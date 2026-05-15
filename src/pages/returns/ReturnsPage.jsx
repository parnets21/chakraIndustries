import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/common/Modal';
import { materialReturnApi } from '../../api/materialReturnApi';
import { lossTrackingApi } from '../../api/lossTrackingApi';
import { productsApi } from '../../api/productsApi';
import { toast } from '../../components/common/Toast';
import DebitCreditMatchingPage from './DebitCreditMatchingPage';
import StageTrackerPage from './StageTrackerPage';
import { 
  FiLink, FiUsers, FiFileText, FiPackage, 
  FiSearch, FiDollarSign, FiUser, FiEdit3,
  FiTrendingUp, FiAlertTriangle, FiBarChart2, FiTarget
} from 'react-icons/fi';
import { 
  MdSearch, MdRefresh, MdDownload, MdAdd, 
  MdVisibility, MdEdit, MdDelete, MdLocalShipping,
  MdExpandMore, MdExpandLess, MdAssignment, MdAccessTime, MdCheckCircle
} from 'react-icons/md';

const STAGES = ['Initiated', 'Approved', 'Transport_Pickup', 'In_Transit', 'Out_For_Delivery', 'Delivered', 'Warehouse_Queue', 'Received_At_Warehouse', 'QC_In_Progress', 'QC_Completed', 'Closed'];

const stageColor = {
  Initiated: '#6b7280', 
  Approved: '#059669',
  Transport_Pickup: '#f59e0b', 
  In_Transit: '#3b82f6',
  Out_For_Delivery: '#8b5cf6',
  Delivered: '#f59e0b',
  Warehouse_Queue: '#3b82f6',
  Received_At_Warehouse: '#10b981',
  QC_In_Progress: '#8b5cf6',
  QC_Completed: '#059669',
  Closed: '#10b981'
};

const RETURN_TYPES = ['Defective', 'Wrong Item', 'Excess', 'Damaged in Transit', 'Quality Rejection'];

const EMPTY_FORM = {
  supplierName: '', items: 1, value: '', reason: '',
  transport: '', awbNo: '', returnType: 'Defective',
  orderRef: '', customer: '', invoiceNo: '', productName: '',
  returnQty: 1, pickupAddress: '', attachments: [],
  supplierPincode: '', supplierEmail: '', supplierGSTNo: '', supplierAddress: '',
  selectedProduct: null, productSku: '', productSource: ''
};

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const lbl = 'text-xs font-semibold text-gray-600';
const fld = 'flex flex-col gap-1.5';

export default function ReturnsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [returns, setReturns] = useState([]);
  const [lossRecords, setLossRecords] = useState([]);
  const [lossStats, setLossStats] = useState({ totalLossValue: 0, courierLost: 0, qcRejected: 0, cnMismatch: 0 });
  const [stats, setStats] = useState({ total: 0, inTransit: 0, pendingQC: 0, closed: 0 });
  const [selected, setSelected] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showCreateLoss, setShowCreateLoss] = useState(false);
  const [showCreateDocket, setShowCreateDocket] = useState(false);
  const [showCreateDebitCredit, setShowCreateDebitCredit] = useState(false);
  const [showCreateStageTracker, setShowCreateStageTracker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [lossForm, setLossForm] = useState({ /* your loss form state */ });
  const [docketForm, setDocketForm] = useState({
    docketId: '', mrId: '', invoiceNo: '', productName: '', supplierName: '',
    returnQty: '', supplierEmail: '', supplierPincode: '', stage: 'Initiated'
  });
  const [debitCreditForm, setDebitCreditForm] = useState({ /* your debit form */ });
  const [stageTrackerForm, setStageTrackerForm] = useState({ /* your stage form */ });

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Docket Tracking States
  const [dockets, setDockets] = useState([]);
  const [docketSearchTerm, setDocketSearchTerm] = useState('');
  const [expandedDockets, setExpandedDockets] = useState(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        materialReturnApi.getAll(),
        materialReturnApi.getStats(),
      ]);
      const list = listRes.data || [];
      setReturns(list);
      setStats(statsRes.data || {});
      if (!selected && list.length > 0) setSelected(list[0]);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, [selected]);

  const fetchLossTracking = useCallback(async () => {
    // Your original logic
  }, []);

  useEffect(() => { 
    fetchAll(); 
    if (activeTab === 4) fetchLossTracking();
  }, [fetchAll, fetchLossTracking, activeTab]);

  // Dummy Docket Data
  useEffect(() => {
    if (activeTab === 2) {
      setDockets([{
        id: 1,
        docketId: "DKT-2026-00001",
        mrId: "MR-2026-004",
        awbLrNumber: "AWB-889977",
        courier: "VRL Logistics",
        pickupDate: "5/13/2024",
        lastScan: "Bangalore Hub",
        lastScanTime: "5/13/2024, 8:00:00 PM",
        estDelivery: "5/15/2024",
        status: "in_transit",
        priority: "Medium",
        isDelayed: true
      }]);
    }
  }, [activeTab]);

  const toggleDocketExpansion = (id) => {
    const newSet = new Set(expandedDockets);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedDockets(newSet);
  };

  const handleCreateDocket = () => {
    toast('Docket created successfully!', 'success');
    setShowCreateDocket(false);
  };

  // ===================== DOCKET TRACKING UI =====================
  const renderDocketTracking = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Docket Tracking</h1>
        <p className="text-gray-600">Professional ERP-level docket tracking and shipment management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-blue-500">
          <div className="p-3 bg-blue-100 rounded-lg"><MdAssignment className="text-3xl text-blue-600" /></div>
          <div><p className="text-sm text-gray-500">Total Dockets</p><p className="text-3xl font-bold">4</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-purple-500">
          <div className="p-3 bg-purple-100 rounded-lg"><MdLocalShipping className="text-3xl text-purple-600" /></div>
          <div><p className="text-sm text-gray-500">In Transit</p><p className="text-3xl font-bold">1</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-orange-500">
          <div className="p-3 bg-orange-100 rounded-lg"><MdAccessTime className="text-3xl text-orange-600" /></div>
          <div><p className="text-sm text-gray-500">Pending QC</p><p className="text-3xl font-bold">0</p></div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 border-l-4 border-green-500">
          <div className="p-3 bg-green-100 rounded-lg"><MdCheckCircle className="text-3xl text-green-600" /></div>
          <div><p className="text-sm text-gray-500">Closed</p><p className="text-3xl font-bold">0</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex-1 min-w-[280px] relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search..." value={docketSearchTerm} onChange={(e) => setDocketSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>All Status</option>
          <option>In Transit</option>
          <option>Delayed</option>
        </select>
        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>All Couriers</option>
          <option>VRL Logistics</option>
        </select>
        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <option>All Priority</option>
          <option>Medium</option>
        </select>

        <input type="date" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        <input type="date" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />

        <label className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg cursor-pointer">
          <input type="checkbox" className="w-4 h-4" /> Delayed Only
        </label>

        <button className="px-5 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2" onClick={() => toast('Refreshed')}>
          <MdRefresh /> Refresh
        </button>
        <button className="px-5 py-3 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 flex items-center gap-2" onClick={() => toast('Exporting...')}>
          <MdDownload /> Export
        </button>
        <button onClick={() => setShowCreateDocket(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
          <MdAdd /> Create Docket
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-10"></th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">DOCKET ID</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">MR ID</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">AWB/LR NUMBER</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">COURIER</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">PICKUP DATE</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">LAST SCAN</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">EST. DELIVERY</th>
              <th className="text-left py-4 px-6 font-medium text-gray-600">STATUS</th>
              <th className="text-center py-4 px-6 font-medium text-gray-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dockets.map(d => (
              <React.Fragment key={d.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <button onClick={() => toggleDocketExpansion(d.id)}>
                      {expandedDockets.has(d.id) ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-blue-600">{d.docketId}</span>
                    {d.isDelayed && <div className="text-red-600 text-xs font-bold">DELAYED</div>}
                  </td>
                  <td className="px-6 py-4 font-medium">{d.mrId}</td>
                  <td className="px-6 py-4"><span className="font-mono bg-gray-100 px-3 py-1 rounded text-sm">{d.awbLrNumber}</span></td>
                  <td className="px-6 py-4">{d.courier}</td>
                  <td className="px-6 py-4">{d.pickupDate}</td>
                  <td className="px-6 py-4">
                    <div>{d.lastScan}</div>
                    <div className="text-xs text-gray-500">{d.lastScanTime}</div>
                  </td>
                  <td className="px-6 py-4 text-red-600 font-medium">{d.estDelivery}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-block px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700">in transit</span>
                      <span className="inline-block px-2.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Medium</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-3">
                      <MdVisibility className="cursor-pointer hover:text-blue-600" size={18} />
                      <MdEdit className="cursor-pointer hover:text-green-600" size={18} />
                      <MdDelete className="cursor-pointer hover:text-red-600" size={18} />
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">4 records</div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Return Requests', 'Stage Tracker', 'Docket Tracking', 'Debit/Credit Matching', 'Loss Tracking'].map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: activeTab === i ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : '#f1f5f9',
              color: activeTab === i ? '#fff' : '#475569',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {/* Your KPI cards here */}
      </div>

      {/* Render Tabs */}
      {!loading && activeTab === 2 && renderDocketTracking()}
      {!loading && activeTab === 0 && <div>Return Requests Content</div>}
      {!loading && activeTab === 1 && <StageTrackerPage returns={returns} onStageUpdate={() => {}} />}
      {!loading && activeTab === 3 && <DebitCreditMatchingPage />}
      {!loading && activeTab === 4 && <div>Loss Tracking Content</div>}

      {/* Create Docket Modal */}
      <Modal open={showCreateDocket} onClose={() => setShowCreateDocket(false)} title="Create New Docket">
        <div className="space-y-4">
          <input type="text" placeholder="Docket ID *" className="w-full p-3 border rounded-lg" value={docketForm.docketId} onChange={(e) => setDocketForm({...docketForm, docketId: e.target.value})} />
          <input type="text" placeholder="MR ID *" className="w-full p-3 border rounded-lg" value={docketForm.mrId} onChange={(e) => setDocketForm({...docketForm, mrId: e.target.value})} />
          <button onClick={handleCreateDocket} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Create Docket</button>
        </div>
      </Modal>
    </div>
  );
}