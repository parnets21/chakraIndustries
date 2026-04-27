import { useState, useEffect } from 'react';
import { FiBox, FiTruck, FiPackage, FiGift, FiCheck, FiX } from 'react-icons/fi';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { corporateClientApi } from '../../api/corporateClientApi';
import { bulkQuotationApi } from '../../api/bulkQuotationApi';
import { deliveryScheduleApi } from '../../api/deliveryScheduleApi';

const corporateClients = [
  { id: 'CC-001', name: 'Tata Motors Ltd', contact: 'Rajesh Mehta', phone: '9876543210', city: 'Mumbai', tier: 'Platinum', creditLimit: '₹50,00,000', outstanding: '₹12,40,000', status: 'Active' },
  { id: 'CC-002', name: 'Mahindra & Mahindra', contact: 'Suresh Nair', phone: '9812345678', city: 'Pune', tier: 'Gold', creditLimit: '₹30,00,000', outstanding: '₹8,20,000', status: 'Active' },
  { id: 'CC-003', name: 'Bajaj Auto Ltd', contact: 'Anil Sharma', phone: '9823456789', city: 'Aurangabad', tier: 'Platinum', creditLimit: '₹45,00,000', outstanding: '₹18,60,000', status: 'Active' },
  { id: 'CC-004', name: 'Hero MotoCorp', contact: 'Vijay Rao', phone: '9834567890', city: 'Delhi', tier: 'Gold', creditLimit: '₹25,00,000', outstanding: '₹5,80,000', status: 'Active' },
  { id: 'CC-005', name: 'TVS Motor Company', contact: 'Pradeep Kumar', phone: '9845678901', city: 'Chennai', tier: 'Silver', creditLimit: '₹15,00,000', outstanding: '₹3,20,000', status: 'Active' },
  { id: 'CC-006', name: 'Ashok Leyland', contact: 'Ramesh Das', phone: '9856789012', city: 'Chennai', tier: 'Gold', creditLimit: '₹35,00,000', outstanding: '₹0', status: 'Inactive' },
];

const bulkQuotations = [
  { id: 'BQ-2024-018', client: 'Tata Motors Ltd', items: 12, qty: 5000, value: '₹42,00,000', packaging: 'Custom Branded', validity: '30 Apr', status: 'Sent' },
  { id: 'BQ-2024-017', client: 'Bajaj Auto Ltd', items: 8, qty: 3200, value: '₹28,50,000', packaging: 'Standard', validity: '25 Apr', status: 'Approved' },
  { id: 'BQ-2024-016', client: 'Mahindra & Mahindra', items: 15, qty: 4800, value: '₹36,80,000', packaging: 'Custom Branded', validity: '20 Apr', status: 'Draft' },
  { id: 'BQ-2024-015', client: 'Hero MotoCorp', items: 6, qty: 2000, value: '₹14,20,000', packaging: 'Bulk Loose', validity: '18 Apr', status: 'Expired' },
];

const quotationItems = [
  { item: 'Bearing 6205', sku: 'SKU-1042', qty: 1000, unitPrice: 420, discount: 8, total: 386400 },
  { item: 'Oil Seal 35x52', sku: 'SKU-2187', qty: 800, unitPrice: 115, discount: 10, total: 82800 },
  { item: 'Gasket Set A', sku: 'SKU-0934', qty: 500, unitPrice: 650, discount: 5, total: 308750 },
];

const packagingOptions = [
  { id: 'PKG-01', name: 'Standard Box', description: 'Plain corrugated box with product label', moq: 100, extraCost: '₹0', leadTime: '0 days', icon: FiBox },
  { id: 'PKG-02', name: 'Custom Branded', description: 'Client logo & branding on box', moq: 500, extraCost: '₹12/unit', leadTime: '5 days', icon: FiPackage },
  { id: 'PKG-03', name: 'Bulk Loose', description: 'No individual packaging, bulk pallet', moq: 1000, extraCost: '-₹5/unit', leadTime: '0 days', icon: FiTruck },
  { id: 'PKG-04', name: 'Premium Gift Box', description: 'Premium finish with foam insert', moq: 200, extraCost: '₹45/unit', leadTime: '7 days', icon: FiGift },
];

const tierColor = { Platinum: '#8b5cf6', Gold: '#f59e0b', Silver: '#6b7280' };

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]";
const selectCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]";
const labelCls = "text-xs font-semibold text-gray-600";
const fieldCls = "flex flex-col gap-1.5 mb-4";
const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";
const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]";
const btnOutline = "inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]";
const btnSm = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg";

export default function BulkOrdersPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState('PKG-02');
  const [loading, setLoading] = useState(false);
  const [corporateClients, setCorporateClients] = useState([]);
  const [bulkQuotations, setBulkQuotations] = useState([]);
  const [deliverySchedules, setDeliverySchedules] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    city: '',
    tier: 'Silver',
    creditLimit: '',
    gstNumber: '',
    address: '',
  });
  const [newDeliveryForm, setNewDeliveryForm] = useState({
    quotationId: '',
    client: '',
    items: '',
    qty: '',
    deliveryDate: '',
    slot: '',
    warehouse: 'WH-01',
    vehicle: '',
    status: 'Draft',
  });

  // Transform backend data to frontend format
  const transformCorporateClient = (backendClient) => ({
    id: backendClient.clientId || backendClient._id,
    name: backendClient.name,
    contact: backendClient.contact,
    phone: backendClient.phone,
    city: backendClient.city,
    tier: backendClient.tier,
    creditLimit: typeof backendClient.creditLimit === 'number' ? `₹${backendClient.creditLimit.toLocaleString()}` : backendClient.creditLimit,
    outstanding: typeof backendClient.outstanding === 'number' ? `₹${backendClient.outstanding.toLocaleString()}` : backendClient.outstanding,
    status: backendClient.status,
  });

  const transformBulkQuotation = (backendQuotation) => ({
    id: backendQuotation.quotationId || backendQuotation._id,
    client: backendQuotation.client,
    items: backendQuotation.items,
    qty: backendQuotation.qty,
    value: typeof backendQuotation.value === 'number' ? `₹${backendQuotation.value.toLocaleString()}` : backendQuotation.value,
    packaging: backendQuotation.packaging,
    validity: new Date(backendQuotation.validity).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    status: backendQuotation.status,
  });

  const transformDeliverySchedule = (backendSchedule) => ({
    id: backendSchedule.scheduleId || backendSchedule._id,
    quotationId: backendSchedule.quotationId,
    client: backendSchedule.client,
    items: backendSchedule.items,
    qty: backendSchedule.qty,
    date: new Date(backendSchedule.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    slot: backendSchedule.slot,
    wh: backendSchedule.warehouse,
    vehicle: backendSchedule.vehicle,
    status: backendSchedule.status,
  });

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch clients
        try {
          const clientsRes = await corporateClientApi.getAll();
          if (clientsRes.data && Array.isArray(clientsRes.data)) {
            setCorporateClients(clientsRes.data.map(transformCorporateClient));
          }
        } catch (err) {
          console.warn('Failed to fetch corporate clients:', err);
          setCorporateClients([]);
        }

        // Fetch quotations
        try {
          const quotationsRes = await bulkQuotationApi.getAll();
          if (quotationsRes.data && Array.isArray(quotationsRes.data)) {
            setBulkQuotations(quotationsRes.data.map(transformBulkQuotation));
          }
        } catch (err) {
          console.warn('Failed to fetch bulk quotations:', err);
          setBulkQuotations([]);
        }

        // Fetch delivery schedules
        try {
          const schedulesRes = await deliveryScheduleApi.getAll();
          if (schedulesRes.data && Array.isArray(schedulesRes.data)) {
            setDeliverySchedules(schedulesRes.data.map(transformDeliverySchedule));
          }
        } catch (err) {
          console.warn('Failed to fetch delivery schedules:', err);
          setDeliverySchedules([]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const subtotal = quotationItems.reduce((s, i) => s + i.total, 0);
  const gst = Math.round(subtotal * 0.18);
  const grand = subtotal + gst;

  const kpis = [
    { label: 'Corporate Clients', value: corporateClients.filter(c => c.status === 'Active').length, color: '#8b5cf6' },
    { label: 'Active Quotations', value: bulkQuotations.filter(q => q.status === 'Sent').length, color: '#f59e0b' },
    { label: 'Approved Quotes', value: bulkQuotations.filter(q => q.status === 'Approved').length, color: '#10b981' },
    { label: 'Total Pipeline', value: '₹1.21Cr', color: '#c0392b' },
  ];

  const handleAddCorporateClient = async () => {
    if (!newClientForm.name || !newClientForm.contact) {
      toast('❌ Please fill in required fields');
      return;
    }

    try {
      setLoading(true);
      const clientName = newClientForm.name;
      
      const payload = {
        name: newClientForm.name,
        contact: newClientForm.contact,
        phone: newClientForm.phone || 'N/A',
        email: newClientForm.email || 'N/A',
        city: newClientForm.city || 'N/A',
        tier: newClientForm.tier,
        creditLimit: newClientForm.creditLimit ? parseInt(newClientForm.creditLimit) : 0,
        gstNumber: newClientForm.gstNumber || 'N/A',
        address: newClientForm.address || 'N/A',
        status: 'Active',
      };

      const response = await corporateClientApi.create(payload);
      
      if (response.success && response.data) {
        const newClient = transformCorporateClient(response.data);
        setCorporateClients([newClient, ...corporateClients]);
        
        setShowClientModal(false);
        setNewClientForm({
          name: '',
          contact: '',
          phone: '',
          email: '',
          city: '',
          tier: 'Silver',
          creditLimit: '',
          gstNumber: '',
          address: '',
        });
        toast(`✅ Corporate client "${clientName}" added successfully!`);
      }
    } catch (error) {
      console.error('Failed to add corporate client:', error);
      toast(`❌ Failed to add client: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBulkQuotation = async () => {
    if (!selectedClient) {
      toast('❌ Please select a client');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        client: selectedClient.name,
        items: quotationItems.length,
        qty: quotationItems.reduce((sum, item) => sum + item.qty, 0),
        value: grand,
        packaging: 'Custom Branded',
        validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'Sent',
        lineItems: quotationItems,
      };

      const response = await bulkQuotationApi.create(payload);
      
      if (response.success && response.data) {
        const newQuotation = transformBulkQuotation(response.data);
        setBulkQuotations([newQuotation, ...bulkQuotations]);
        
        setShowQuoteModal(false);
        setSelectedClient(null);
        toast(`✉️ Quotation sent to ${selectedClient.name}!`);
      }
    } catch (error) {
      console.error('Failed to add bulk quotation:', error);
      toast(`❌ Failed to send quotation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeliverySchedule = async () => {
    if (!newDeliveryForm.quotationId || !newDeliveryForm.client || !newDeliveryForm.deliveryDate || !newDeliveryForm.slot) {
      toast('❌ Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        quotationId: newDeliveryForm.quotationId,
        client: newDeliveryForm.client,
        items: parseInt(newDeliveryForm.items) || 0,
        qty: parseInt(newDeliveryForm.qty) || 0,
        deliveryDate: new Date(newDeliveryForm.deliveryDate),
        slot: newDeliveryForm.slot,
        warehouse: newDeliveryForm.warehouse,
        vehicle: newDeliveryForm.vehicle || 'Pending',
        status: newDeliveryForm.status,
      };

      const response = await deliveryScheduleApi.create(payload);
      
      if (response.success && response.data) {
        const newSchedule = transformDeliverySchedule(response.data);
        // Add to the beginning of the list so it appears first
        setDeliverySchedules([newSchedule, ...deliverySchedules]);
        
        setShowDeliveryModal(false);
        setNewDeliveryForm({
          quotationId: '',
          client: '',
          items: '',
          qty: '',
          deliveryDate: '',
          slot: '',
          warehouse: 'WH-01',
          vehicle: '',
          status: 'Draft',
        });
        toast(`✅ Delivery scheduled successfully!`);
      }
    } catch (error) {
      console.error('Failed to add delivery schedule:', error);
      toast(`❌ Failed to schedule delivery: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {activeTab === 0 && <button onClick={() => { setSelectedClient(null); setShowClientModal(true); }} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)',
          color:'#fff', border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ Add Client</button>}
        {activeTab === 1 && <button onClick={() => setShowQuoteModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)',
          color:'#fff', border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ New Quotation</button>}
        {activeTab === 3 && <button onClick={() => setShowDeliveryModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)',
          color:'#fff', border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ Schedule Delivery</button>}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'Client ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'name', label: 'Company', render: v => <span className="font-bold">{v}</span> },
              { key: 'contact', label: 'Contact' },
              { key: 'city', label: 'City' },
              { key: 'tier', label: 'Tier', render: v => (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold" style={{ background: (tierColor[v] || '#6b7280') + '20', color: tierColor[v] || '#6b7280' }}>{v}</span>
              )},
              { key: 'creditLimit', label: 'Credit Limit', render: v => <span className="font-semibold">{v}</span> },
              { key: 'outstanding', label: 'Outstanding', render: v => <span className={`font-bold ${v === '₹0' ? 'text-green-600' : 'text-red-500'}`}>{v}</span> },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              { key: 'id', label: 'Actions', render: () => (
                <div className="flex gap-1.5">
                  <button onClick={() => alert('👁 Viewing client details...')} className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`}>View</button>
                  <button onClick={() => alert('📋 Creating quotation...')} className={`${btnSm} bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]`}>Quote</button>
                </div>
              )},
            ]}
            data={corporateClients}
          />
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'Quote ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'client', label: 'Client', render: v => <span className="font-semibold">{v}</span> },
              { key: 'items', label: 'SKUs' },
              { key: 'qty', label: 'Total Qty', render: v => <span className="font-bold">{v.toLocaleString()}</span> },
              { key: 'value', label: 'Value', render: v => <span className="font-bold text-red-700">{v}</span> },
              { key: 'packaging', label: 'Packaging' },
              { key: 'validity', label: 'Valid Till' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              { key: 'id', label: 'Actions', render: () => (
                <div className="flex gap-1.5">
                  <button onClick={() => alert('👁 Viewing quotation...')} className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`}>View</button>
                  <button onClick={() => alert('📦 Converting to PO...')} className={`${btnSm} bg-gray-100 text-gray-800 font-semibold border-0 cursor-pointer font-[inherit]`}>Convert to PO</button>
                </div>
              )},
            ]}
            data={bulkQuotations}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-3.5">
            {packagingOptions.map(pkg => {
              const IconComponent = pkg.icon;
              return (
                <div key={pkg.id} onClick={() => setSelectedPkg(pkg.id)}
                  className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedPkg === pkg.id ? 'border-red-600 bg-red-50' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`p-2.5 rounded-lg ${selectedPkg === pkg.id ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="font-bold text-sm text-gray-800">{pkg.name}</div>
                        <span className={`font-bold text-[13px] ${pkg.extraCost.startsWith('-') ? 'text-green-600' : pkg.extraCost === '₹0' ? 'text-gray-400' : 'text-red-700'}`}>{pkg.extraCost}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{pkg.description}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[11px] ml-9">
                    <span className="text-gray-400">MOQ: <strong className="text-gray-800">{pkg.moq.toLocaleString()} units</strong></span>
                    <span className="text-gray-400">Lead Time: <strong className="text-gray-800">{pkg.leadTime}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Packaging Preview</div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center mb-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-md mb-3">
                {packagingOptions.find(p => p.id === selectedPkg) && (
                  (() => {
                    const IconComponent = packagingOptions.find(p => p.id === selectedPkg).icon;
                    return <IconComponent size={40} className="text-red-600" />;
                  })()
                )}
              </div>
              <div className="font-bold text-[15px] text-gray-800">{packagingOptions.find(p => p.id === selectedPkg)?.name}</div>
              <div className="text-xs text-gray-400 mt-1">{packagingOptions.find(p => p.id === selectedPkg)?.description}</div>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ['Selected Option', packagingOptions.find(p => p.id === selectedPkg)?.name],
                ['Extra Cost per Unit', packagingOptions.find(p => p.id === selectedPkg)?.extraCost],
                ['Minimum Order Qty', (packagingOptions.find(p => p.id === selectedPkg)?.moq.toLocaleString()) + ' units'],
                ['Lead Time', packagingOptions.find(p => p.id === selectedPkg)?.leadTime],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50 text-[13px]">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-bold text-gray-800">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => toast('✅ Packaging applied to quotation')} className={`${btnPrimary} mt-4 w-full justify-center`}>
              <FiCheck size={16} /> Apply to Quotation
            </button>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="mb-4">
            <div className="text-sm font-bold text-gray-800">Delivery Scheduling</div>
            <div className="text-xs text-gray-400 mt-0.5">Plan and schedule bulk order deliveries</div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Quote ID','Client','Items','Qty','Delivery Date','Slot','Warehouse','Vehicle','Status'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {deliverySchedules.length > 0 ? (
                  deliverySchedules.map((r, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-semibold text-red-700`}>{r.quotationId}</td>
                      <td className={`${tdCls} font-semibold`}>{r.client}</td>
                      <td className={tdCls}>{r.items}</td>
                      <td className={`${tdCls} font-bold`}>{r.qty.toLocaleString()}</td>
                      <td className={tdCls}>{r.date}</td>
                      <td className={tdCls}>{r.slot}</td>
                      <td className={tdCls}>{r.wh}</td>
                      <td className={`${tdCls} ${r.vehicle === 'Pending' ? 'text-amber-500 font-semibold' : 'font-mono text-xs'}`}>
                        <div className="flex items-center gap-1.5">
                          {r.vehicle === 'Pending' ? <FiX size={14} /> : <FiCheck size={14} className="text-green-600" />}
                          {r.vehicle}
                        </div>
                      </td>
                      <td className={tdCls}><StatusBadge status={r.status} type={r.status === 'Confirmed' ? 'success' : r.status === 'Pending' ? 'warning' : 'info'} /></td>
                    </tr>
                  ))
                ) : (
                  <tr className={trCls}>
                    <td colSpan="9" className={`${tdCls} text-center text-gray-400`}>No delivery schedules yet. Click "+ Schedule Delivery" to create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <Modal open={showClientModal} onClose={() => setShowClientModal(false)} title="Add Corporate Client"
        footer={<>
          <button className={btnOutline} onClick={() => setShowClientModal(false)}>Cancel</button>
          <button className={btnPrimary} onClick={handleAddCorporateClient}>Save Client</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldCls}><label className={labelCls}>Company Name *</label><input className={inputCls} placeholder="e.g. Maruti Suzuki" value={newClientForm.name} onChange={(e) => setNewClientForm({...newClientForm, name: e.target.value})} /></div>
          <div className={fieldCls}><label className={labelCls}>Contact Person *</label><input className={inputCls} placeholder="Name" value={newClientForm.contact} onChange={(e) => setNewClientForm({...newClientForm, contact: e.target.value})} /></div>
          <div className={fieldCls}><label className={labelCls}>Phone</label><input className={inputCls} placeholder="10-digit number" value={newClientForm.phone} onChange={(e) => setNewClientForm({...newClientForm, phone: e.target.value})} /></div>
          <div className={fieldCls}><label className={labelCls}>Email</label><input type="email" className={inputCls} placeholder="email@company.com" value={newClientForm.email} onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})} /></div>
          <div className={fieldCls}><label className={labelCls}>City</label><input className={inputCls} placeholder="City" value={newClientForm.city} onChange={(e) => setNewClientForm({...newClientForm, city: e.target.value})} /></div>
          <div className={fieldCls}><label className={labelCls}>Client Tier</label><select className={selectCls} value={newClientForm.tier} onChange={(e) => setNewClientForm({...newClientForm, tier: e.target.value})}><option>Silver</option><option>Gold</option><option>Platinum</option></select></div>
          <div className={fieldCls}><label className={labelCls}>Credit Limit (₹)</label><input type="number" className={inputCls} placeholder="0" value={newClientForm.creditLimit} onChange={(e) => setNewClientForm({...newClientForm, creditLimit: e.target.value})} /></div>
          <div className={fieldCls}><label className={labelCls}>GST Number</label><input className={inputCls} placeholder="GSTIN" value={newClientForm.gstNumber} onChange={(e) => setNewClientForm({...newClientForm, gstNumber: e.target.value})} /></div>
          <div className={`${fieldCls} col-span-2`}><label className={labelCls}>Address</label><textarea className={inputCls} placeholder="Full address..." value={newClientForm.address} onChange={(e) => setNewClientForm({...newClientForm, address: e.target.value})} /></div>
        </div>
      </Modal>

      {/* Bulk Quotation Modal */}
      <Modal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} title="Generate Bulk Quotation" size="lg"
        footer={<>
          <button className={btnOutline} onClick={() => { setShowQuoteModal(false); toast('Quotation saved as draft'); }}>Save Draft</button>
          <button className={btnPrimary} onClick={handleAddBulkQuotation}>Send Quotation</button>
        </>}>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className={fieldCls}><label className={labelCls}>Corporate Client *</label>
            <select className={selectCls} onChange={(e) => { const client = corporateClients.find(c => c.name === e.target.value); setSelectedClient(client); }}><option value="">Select a client</option>{corporateClients.filter(c => c.status === 'Active').map(c => <option key={c.id}>{c.name}</option>)}</select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Validity Date</label><input type="date" className={inputCls} /></div>
          <div className={fieldCls}><label className={labelCls}>Packaging Option</label>
            <select className={selectCls}>{packagingOptions.map(p => <option key={p.id}>{p.name}</option>)}</select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Payment Terms</label>
            <select className={selectCls}><option>Net 30</option><option>Net 45</option><option>Net 60</option><option>Advance</option></select>
          </div>
        </div>
        <div className="font-bold text-[13px] text-gray-800 mb-2.5">Line Items</div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
          <table className="w-full">
            <thead><tr>{['Item','SKU','Qty','Unit Price (₹)','Discount %','Total (₹)'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
            <tbody>
              {quotationItems.map((item, i) => (
                <tr key={i} className={trCls}>
                  <td className={`${tdCls} font-semibold`}>{item.item}</td>
                  <td className={`${tdCls} font-mono text-xs text-red-700`}>{item.sku}</td>
                  <td className={tdCls}><input type="number" className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]" defaultValue={item.qty} /></td>
                  <td className={tdCls}><input type="number" className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]" defaultValue={item.unitPrice} /></td>
                  <td className={tdCls}><input type="number" className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]" defaultValue={item.discount} /></td>
                  <td className={`${tdCls} font-bold`}>₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 max-w-[300px] ml-auto">
          <div className="flex justify-between mb-2 text-[13px]"><span className="text-gray-600">Subtotal</span><span className="font-semibold text-gray-800">₹{subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between mb-2 text-[13px]"><span className="text-gray-600">GST (18%)</span><span className="font-semibold text-gray-800">₹{gst.toLocaleString()}</span></div>
          <div className="flex justify-between pt-2 border-t border-gray-200 text-[15px] font-extrabold text-red-700"><span>Grand Total</span><span>₹{grand.toLocaleString()}</span></div>
        </div>
      </Modal>

      {/* Schedule Delivery Modal */}
      <Modal open={showDeliveryModal} onClose={() => setShowDeliveryModal(false)} title="Schedule Delivery"
        footer={<>
          <button className={btnOutline} onClick={() => setShowDeliveryModal(false)}>Cancel</button>
          <button className={btnPrimary} onClick={handleAddDeliverySchedule} disabled={loading}>{loading ? 'Scheduling...' : 'Schedule Delivery'}</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldCls}><label className={labelCls}>Quotation ID *</label>
            <select className={selectCls} value={newDeliveryForm.quotationId} onChange={(e) => {
              const quotation = bulkQuotations.find(q => q.id === e.target.value);
              if (quotation) {
                setNewDeliveryForm({
                  ...newDeliveryForm, 
                  quotationId: e.target.value, 
                  client: quotation.client, 
                  items: quotation.items.toString(), 
                  qty: quotation.qty.toString()
                });
              }
            }}>
              <option value="">Select a quotation</option>
              {bulkQuotations.map(q => (
                <option key={q.id} value={q.id}>
                  {q.id} - {q.client} ({q.qty.toLocaleString()} units)
                </option>
              ))}
            </select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Client *</label>
            <input className={inputCls} placeholder="Auto-filled" value={newDeliveryForm.client} readOnly />
          </div>
          <div className={fieldCls}><label className={labelCls}>Items</label>
            <input type="number" className={inputCls} placeholder="Auto-filled" value={newDeliveryForm.items} readOnly />
          </div>
          <div className={fieldCls}><label className={labelCls}>Quantity</label>
            <input type="number" className={inputCls} placeholder="Auto-filled" value={newDeliveryForm.qty} readOnly />
          </div>
          <div className={fieldCls}><label className={labelCls}>Delivery Date *</label>
            <input type="date" className={inputCls} value={newDeliveryForm.deliveryDate} onChange={(e) => setNewDeliveryForm({...newDeliveryForm, deliveryDate: e.target.value})} />
          </div>
          <div className={fieldCls}><label className={labelCls}>Time Slot *</label>
            <select className={selectCls} value={newDeliveryForm.slot} onChange={(e) => setNewDeliveryForm({...newDeliveryForm, slot: e.target.value})}>
              <option value="">Select slot</option>
              <option value="09:00–11:00">09:00–11:00</option>
              <option value="10:00–12:00">10:00–12:00</option>
              <option value="02:00–04:00">02:00–04:00</option>
              <option value="04:00–06:00">04:00–06:00</option>
            </select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Warehouse</label>
            <select className={selectCls} value={newDeliveryForm.warehouse} onChange={(e) => setNewDeliveryForm({...newDeliveryForm, warehouse: e.target.value})}>
              <option value="WH-01">WH-01 (Mumbai)</option>
              <option value="WH-02">WH-02 (Pune)</option>
              <option value="WH-03">WH-03 (Delhi)</option>
            </select>
          </div>
          <div className={fieldCls}><label className={labelCls}>Vehicle Number</label>
            <input className={inputCls} placeholder="e.g. MH-12-AB-1234" value={newDeliveryForm.vehicle} onChange={(e) => setNewDeliveryForm({...newDeliveryForm, vehicle: e.target.value})} />
          </div>
          <div className={fieldCls}><label className={labelCls}>Status</label>
            <select className={selectCls} value={newDeliveryForm.status} onChange={(e) => setNewDeliveryForm({...newDeliveryForm, status: e.target.value})}>
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
