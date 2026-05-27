import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../../components/common/Modal';
import { materialReturnApi } from '../../api/materialReturnApi';
import { invoiceApi } from '../../api/invoiceApi';
import { toast } from '../../components/common/Toast';

import DebitCreditMatchingPage from './DebitCreditMatchingPage';
import StageTrackerPage from './StageTrackerPage';
import ProfessionalLossTrackingPage from './ProfessionalLossTrackingPage';

// ✅ Import the full DocketTrackingPage component
import DocketTrackingPage from './DocketTrackingPage';

import {
  MdSearch, MdRefresh, MdDownload, MdAdd,
  MdVisibility, MdEdit, MdDelete, MdLocalShipping,
  MdExpandMore, MdExpandLess, MdAssignment, MdAccessTime, MdCheckCircle,
  MdClose, MdArrowForward, MdCheckCircleOutline, MdRadioButtonUnchecked,
  MdFilterList
} from 'react-icons/md';

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = [
  'REQUEST_RAISED', 'APPROVED', 'PICKUP_PENDING', 'IN_TRANSIT', 
  'ARRIVED', 'VERIFICATION_PENDING', 'RECEIVED', 
  'QC_PENDING', 'QC_COMPLETED', 'FINANCE_PENDING', 'CLOSED'
];

const STAGE_ABBR = [
  'Raised', 'Appr', 'Pickup', 'Transit', 'Arriv', 'Verify', 'Recvd', 'QC', 'QC-Ok', 'Fin', 'Closed'
];

const stageColor = {
  REQUEST_RAISED: '#64748b',
  APPROVED: '#059669',
  PICKUP_PENDING: '#f59e0b',
  IN_TRANSIT: '#2563eb',
  ARRIVED: '#8b5cf6',
  VERIFICATION_PENDING: '#ca8a04',
  RECEIVED: '#10b981',
  QC_PENDING: '#8b5cf6',
  QC_COMPLETED: '#059669',
  FINANCE_PENDING: '#ca8a04',
  CLOSED: '#10b981'
};

const LEGACY_STAGE_MAP = {
  Initiated: 'Return_Request_Create',
  Approved: 'Manager_Approval',
  Transport_Pickup: 'Docket_Create',
  In_Transit: 'Transport_Tracking',
  Out_For_Delivery: 'Transport_Tracking',
  Delivered: 'Warehouse_Receive',
  Warehouse_Queue: 'Warehouse_Receive',
  Received_At_Warehouse: 'Warehouse_Receive',
  QC_In_Progress: 'QC_Verification',
  QC_Completed: 'Finance_Reconciliation',
};

const DUMMY_RETURNS = [
  { mrId: 'MR-2026-0024', docketId: 'DKT-789456', invoiceNo: 'INV-2026-1234', supplierName: 'ABC Suppliers Pvt Ltd', productName: 'Industrial Bearing (BRG-7644)', productSku: 'BRG-7644', returnQty: 10, stage: 'In_Transit',             qcStatus: 'Pending',     approvalStatus: 'Completed', finStatus: 'Partial',     priority: 'High',   value: 12500, created: '12 May, 2026 10:30 AM' },
  { mrId: 'MR-2026-0023', docketId: 'DKT-789455', invoiceNo: 'INV-2026-1233', supplierName: 'XYZ Industries',          productName: 'Copper Wire',                  productSku: 'CW-200',    returnQty: 25, stage: 'Received_At_Warehouse', qcStatus: 'Completed',   approvalStatus: 'Completed', finStatus: 'Reconciled', priority: 'Medium', value: 18750, created: '10 May, 2026 09:15 AM' },
  { mrId: 'MR-2026-0022', docketId: 'DKT-789454', invoiceNo: 'INV-2026-1232', supplierName: 'Global Components',       productName: 'Aluminium Frame 5',            productSku: 'AF-005',    returnQty: 5,  stage: 'QC_In_Progress',       qcStatus: 'In Progress', approvalStatus: 'Completed', finStatus: 'Pending',     priority: 'High',   value: 7250,  created: '09 May, 2026 02:00 PM' },
  { mrId: 'MR-2026-0021', docketId: 'DKT-789453', invoiceNo: 'INV-2026-1231', supplierName: 'Tech Solutions Ltd',      productName: 'Motor Housing',               productSku: 'MH-101',    returnQty: 8,  stage: 'Approved',             qcStatus: 'Pending',     approvalStatus: 'Pending',   finStatus: 'Pending',     priority: 'Medium', value: 8400,  created: '08 May, 2026 11:45 AM' },
  { mrId: 'MR-2026-0020', docketId: 'DKT-789452', invoiceNo: 'INV-2026-1230', supplierName: 'ABC Suppliers Pvt Ltd',   productName: 'Bearing Set',                 productSku: 'BS-400',    returnQty: 12, stage: 'Closed',               qcStatus: 'Completed',   approvalStatus: 'Completed', finStatus: 'Reconciled', priority: 'Low',    value: 10200, created: '05 May, 2026 03:30 PM' },
  { mrId: 'MR-2026-0019', docketId: 'DKT-789451', invoiceNo: 'INV-2026-1229', supplierName: 'Prime Components',        productName: 'Gear Box',                    productSku: 'GB-220',    returnQty: 3,  stage: 'Transport_Pickup',     qcStatus: 'Pending',     approvalStatus: 'Completed', finStatus: 'Partial',     priority: 'High',   value: 6400,  created: '04 May, 2026 10:00 AM' },
  { mrId: 'MR-2026-0018', docketId: 'DKT-789450', invoiceNo: 'INV-2026-1228', supplierName: 'STZ Industries',          productName: 'Steel Rod',                   productSku: 'SR-500',    returnQty: 20, stage: 'Out_For_Delivery',     qcStatus: 'Pending',     approvalStatus: 'Completed', finStatus: 'Partial',     priority: 'Medium', value: 22000, created: '03 May, 2026 09:00 AM' },
  { mrId: 'MR-2026-0017', docketId: 'DKT-789449', invoiceNo: 'INV-2026-1227', supplierName: 'ABC Suppliers Pvt Ltd',   productName: 'Electric Motor',              productSku: 'EM-110',    returnQty: 4,  stage: 'Initiated',            qcStatus: 'Pending',     approvalStatus: 'Pending',   finStatus: 'Pending',     priority: 'Low',    value: 9800,  created: '01 May, 2026 08:30 AM' },
];

// ─── Badge Helpers ─────────────────────────────────────────────────────────────

const stageBadge = (stage) => {
  const map = {
    Invoice_Select: 'bg-slate-100 text-slate-700',
    Invoice_API_Fetch: 'bg-blue-100 text-blue-700',
    Supplier_Products_Auto_Fetch: 'bg-teal-100 text-teal-700',
    Return_Request_Create: 'bg-red-100 text-red-700',
    MR_ID_Generate: 'bg-violet-100 text-violet-700',
    Manager_Approval: 'bg-green-100 text-green-700',
    Docket_Create: 'bg-orange-100 text-orange-700',
    Transport_Tracking: 'bg-blue-100 text-blue-700',
    Warehouse_Receive: 'bg-emerald-100 text-emerald-700',
    QC_Verification: 'bg-purple-100 text-purple-700',
    Finance_Reconciliation: 'bg-yellow-100 text-yellow-700',
    Tally_Sync: 'bg-lime-100 text-lime-700',
    In_Transit: 'bg-blue-100 text-blue-700', Transport_Pickup: 'bg-amber-100 text-amber-700',
    Out_For_Delivery: 'bg-purple-100 text-purple-700', Delivered: 'bg-amber-100 text-amber-700',
    Received_At_Warehouse: 'bg-emerald-100 text-emerald-700', Warehouse_Queue: 'bg-blue-100 text-blue-700',
    QC_In_Progress: 'bg-purple-100 text-purple-700', QC_Completed: 'bg-green-100 text-green-700',
    Approved: 'bg-green-100 text-green-700', Closed: 'bg-green-100 text-green-700',
    Initiated: 'bg-gray-100 text-gray-600',
  };
  return map[stage] || 'bg-gray-100 text-gray-600';
};

const qcBadge   = (s) => s === 'Completed' ? 'bg-green-100 text-green-700' : s === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
const finBadge  = (s) => s === 'Reconciled' ? 'bg-green-100 text-green-700' : s === 'Partial' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
const prioBadge = (p) => p === 'High' || p === 'Critical' ? 'bg-red-100 text-red-700' : p === 'Low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const normalizeReturn = (record) => {
  if (!record) return {};
  const stage = LEGACY_STAGE_MAP[record.stage] || record.stage || 'Return_Request_Create';
  return {
    ...record,
    id: record._id || record.id || record.mrId,
    stage,
    docketId: record.docketId || '',
    invoiceNo: record.invoiceNo || '',
    supplierName: record.supplierName || record.customerName || 'Unknown Party',
    productName: record.productName || 'Invoice Item',
    productSku: record.productSku || record.skuCode || '',
    returnQty: Number(record.returnQty || record.expectedQty || 1),
    qcStatus: record.qcStatus || 'Pending',
    approvalStatus: record.approvalStatus || 'Pending',
    finStatus: record.reconciliationStatus === 'Completed' || record.ledgerStatus === 'Reconciled' ? 'Reconciled' : 'Pending',
    priority: record.priority || 'Medium',
    value: Number(record.value || record.refundAmount || 0),
    created: formatDateTime(record.createdAt || record.returnDate),
  };
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, iconColor, label, value, change, warnChange }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-1">
    <Icon className={`text-2xl ${iconColor} mb-1`} />
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-2xl font-bold leading-tight">{value}</div>
    <div className={`text-xs font-medium ${warnChange ? 'text-amber-600' : 'text-emerald-600'}`}>{change} vs last month</div>
  </div>
);

// ─── Lifecycle Bar ─────────────────────────────────────────────────────────────

const LifecycleBar = ({ currentStage }) => {
  const idx = STAGES.indexOf(currentStage);
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center" style={{ minWidth: 'max-content' }}>
        {STAGES.map((s, i) => (
          <React.Fragment key={s}>
            <div
              className="flex items-center justify-center rounded-full text-xs font-semibold flex-shrink-0"
              style={{
                width: 22, height: 22,
                background: i < idx ? '#059669' : i === idx ? '#dc2626' : '#e5e7eb',
                color: i <= idx ? '#fff' : '#9ca3af',
                fontSize: 9
              }}
            >
              {i < idx ? '✓' : i === idx ? '●' : '○'}
            </div>
            {i < STAGES.length - 1 && (
              <div style={{ width: 18, height: 2, background: i < idx ? '#059669' : '#e5e7eb', flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex mt-1" style={{ minWidth: 'max-content' }}>
        {STAGES.map((s, i) => (
          <div
            key={s}
            style={{ width: i < STAGES.length - 1 ? 40 : 22, fontSize: 8, textAlign: 'center', flexShrink: 0 }}
            className={i === idx ? 'text-red-600 font-semibold' : 'text-gray-400'}
          >
            {STAGE_ABBR[i]}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Detail Panel ──────────────────────────────────────────────────────────────

const DETAIL_TABS = ['Product Details', 'Transport Tracking', 'QC Details', 'Finance & Reconciliation', 'Loss-End Tracking', 'Activity Logs'];

const DetailPanel = ({ record, onClose, onStageMove, onApprovalUpdate }) => {
  const [activeTab, setActiveTab] = useState('Product Details');
  const [nextStage, setNextStage] = useState('');

  const stageIdx = STAGES.indexOf(record.stage);
  const nextStages = STAGES.slice(stageIdx + 1);

  const handleMove = () => {
    if (!nextStage) return;
    onStageMove(record.mrId, nextStage);
    setNextStage('');
  };

  return (
    <div className="bg-white rounded-2xl shadow border overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center px-5 py-3 border-b">
        <span className="font-semibold text-sm">Return Details — {record.mrId}</span>
        <div className="flex items-center gap-2">
          <button className="p-1 text-gray-400 hover:text-gray-600"><MdRefresh size={16} /></button>
          <button className="p-1 text-gray-400 hover:text-gray-600"><MdClose size={16} onClick={onClose} /></button>
        </div>
      </div>

      {/* Approval Quick Actions */}
      <div className="px-5 py-3 border-b bg-red-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Approval Status</span>
          <span className={`text-xs font-bold ${record.approvalStatus === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>
            {record.approvalStatus || 'Pending'}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onApprovalUpdate(record.mrId, 'Pending')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${record.approvalStatus === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
          >
            Mark Pending
          </button>
          <button 
            onClick={() => onApprovalUpdate(record.mrId, 'Approved')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${record.approvalStatus === 'Approved' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
          >
            {record.approvalStatus === 'Approved' ? '✓ Approved' : 'Approve Return'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 px-5 py-3 border-b bg-gray-50 text-xs">
        <div><div className="text-gray-400 mb-0.5">Quantity</div><div className="font-medium">{record.returnQty}</div></div>
        <div><div className="text-gray-400 mb-0.5">Return Type</div><div className="font-medium">Material Return</div></div>
        <div><div className="text-gray-400 mb-0.5">Return Value</div><div className="font-semibold text-red-600">₹{record.value.toLocaleString('en-IN')}</div></div>
        <div><div className="text-gray-400 mb-0.5">Created On</div><div className="font-medium">{record.created}</div></div>
        <div><div className="text-gray-400 mb-0.5">Created By</div><div className="font-medium">Priya Sharma</div></div>
      </div>
      <div className="px-5 py-3 border-b">
        <div className="text-xs font-semibold text-gray-500 mb-2">Lifecycle Progress</div>
        <LifecycleBar currentStage={record.stage} />
      </div>
      <div className="flex gap-0 border-b overflow-x-auto">
        {DETAIL_TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === t ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="px-5 py-3 overflow-y-auto flex-1 text-xs">
        {activeTab === 'Product Details' && (
          <>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    {['Product', 'MRU/Item Code', 'Batch No.', 'Return Qty', 'Unit', 'Unit Rate (₹)', 'Return Value (₹)', 'Damage %', 'Reason'].map(h => (
                      <th key={h} className="text-left px-2 py-2 text-gray-500 font-medium border-b whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-2 py-2">{record.productName}</td>
                    <td className="px-2 py-2 font-mono">SRG-10441</td>
                    <td className="px-2 py-2">BATCH 80</td>
                    <td className="px-2 py-2">{record.returnQty}</td>
                    <td className="px-2 py-2">Nos</td>
                    <td className="px-2 py-2">₹{Math.round(record.value / (record.returnQty || 1)).toLocaleString('en-IN')}</td>
                    <td className="px-2 py-2">₹{record.value.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-2">5%</td>
                    <td className="px-2 py-2">Damaged During Transit</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { label: 'Invoice Value',    val: `₹${record.value.toLocaleString('en-IN')}` },
                { label: 'Return Value',     val: `₹${record.value.toLocaleString('en-IN')}` },
                { label: 'Debit Note',       val: `₹${Math.round(record.value * 0.32).toLocaleString('en-IN')}` },
                { label: 'Credit Note',      val: `₹${Math.round(record.value * 0.52).toLocaleString('en-IN')}` },
                { label: 'Recoverable Amt',  val: `₹${Math.round(record.value * 0.8).toLocaleString('en-IN')}` },
                { label: 'Pending Recovery', val: `₹${Math.round(record.value * 0.2).toLocaleString('en-IN')}` },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-gray-400 text-xs">{label}</div>
                  <div className="font-semibold text-red-600 text-sm">{val}</div>
                </div>
              ))}
            </div>
          </>
        )}
        {activeTab === 'Transport Tracking' && (
          <div className="flex flex-col gap-3 py-1">
            {['Initiated at supplier', 'Picked up by VRL Logistics', 'In transit – Delhi hub', 'In transit – Bangalore hub'].map((e, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${i < 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <div className="text-gray-800">{e}</div>
                  <div className="text-gray-400 text-xs">{i === 0 ? record.created : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'QC Details' && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            {[{ label: 'QC Status', val: record.qcStatus }, { label: 'Assigned To', val: 'Rajesh Kumar' }, { label: 'Damage %', val: '5%' }, { label: 'QC Remarks', val: 'Minor surface damage noted' }].map(({ label, val }) => (
              <div key={label}><div className="text-gray-400 mb-0.5">{label}</div><div className="font-medium">{val}</div></div>
            ))}
          </div>
        )}
        {activeTab === 'Finance & Reconciliation' && (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{ label: 'Invoice Value', val: `₹${record.value.toLocaleString('en-IN')}` }, { label: 'Debit Note', val: `₹${Math.round(record.value * 0.32).toLocaleString('en-IN')}` }, { label: 'Credit Note', val: `₹${Math.round(record.value * 0.52).toLocaleString('en-IN')}` }].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="text-gray-400">{label}</div>
                  <div className="font-semibold text-red-600 text-sm">{val}</div>
                </div>
              ))}
            </div>
            <div className="text-gray-500">Financial reconciliation status: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${finBadge(record.finStatus)}`}>{record.finStatus}</span></div>
          </div>
        )}
        {activeTab === 'Loss-End Tracking' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[{ label: 'Loss Amount', val: `₹${Math.round(record.value * 0.08).toLocaleString('en-IN')}` }, { label: 'Loss %', val: '8%' }, { label: 'Damage Type', val: 'Transit Damage' }, { label: 'Liability', val: 'Courier' }].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="text-gray-400">{label}</div>
                <div className="font-semibold text-red-600 text-sm">{val}</div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'Activity Logs' && (
          <div className="flex flex-col divide-y">
            {[`Return ${record.mrId} created`, `Stage moved to ${record.stage}`, `QC status: ${record.qcStatus}`].map((e, i) => (
              <div key={i} className="flex justify-between py-2">
                <span>{e}</span>
                <span className="text-gray-400">{record.created}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 px-5 py-3 border-t bg-gray-50">
        <select value={nextStage} onChange={e => setNextStage(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white">
          <option value="">Select next stage...</option>
          {nextStages.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <button onClick={handleMove} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold whitespace-nowrap">
          Move to Next Stage →
        </button>
      </div>
    </div>
  );
};

// ─── Create Return Modal Form ──────────────────────────────────────────────────

const CreateReturnModal = ({ open, onClose, onCreate, invoices = [], onInvoiceFetch, saving }) => {
  const empty = { supplierName: '', supplierType: 'Dealer', invoiceNo: '', invoiceDate: '', productName: '', productSku: '', returnQty: '', returnValue: '', priority: 'Medium', returnType: 'Material Return', reason: '', status: 'Pending', supplierEmail: '', supplierPincode: '', supplierGSTNo: '', supplierAddress: '', transport: '', awbNo: '' };
  const [form, setForm] = useState(empty);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleInvoiceSelect = async (invoiceNo) => {
    set('invoiceNo', invoiceNo);
    if (!invoiceNo) return;

    // Proactively set supplier name from the list we already have
    const inv = invoices.find(i => i.invoiceNo === invoiceNo);
    if (inv) {
      set('supplierName', inv.partyName || inv.supplierName || '');
    }

    setFetchingInvoice(true);
    try {
      const context = await onInvoiceFetch(invoiceNo);
      setForm(f => ({
        ...f, ...context, invoiceNo,
        invoiceDate: context.invoiceDate ? new Date(context.invoiceDate).toISOString().slice(0, 10) : f.invoiceDate,
        returnValue: context.value || f.returnValue,
        productSku: context.productSku || context.skuCode || f.productSku,
      }));
      toast('Invoice API fetched supplier and products', 'success');
    } catch (err) {
      toast(err.message || 'Invoice fetch failed', 'error');
    } finally {
      setFetchingInvoice(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.supplierName || !form.invoiceNo || !form.productName) {
      toast('Supplier, Invoice & Product are required', 'error');
      return;
    }
    
    // Explicitly mapping keys for the API
    const payload = {
      ...form,
      customerName: form.supplierName, // Backend uses customerName/supplierName interchangeably
      skuCode: form.productSku,
      expectedQty: Number(form.returnQty),
      value: Number(form.returnValue),
    };

    try {
      await onCreate(payload);
      setForm(empty);
    } catch (error) {
      // Error is already toasted in onCreate parent
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="New Return Request">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Invoice Select *</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" value={form.invoiceNo} onChange={e => handleInvoiceSelect(e.target.value)}>
              <option value="">Select invoice</option>
              {invoices.map(inv => <option key={inv._id || inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} - {inv.partyName || inv.supplierName || 'Party'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Supplier Name *</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" placeholder="Auto from invoice" value={form.supplierName} onChange={e => set('supplierName', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Invoice Date</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Product Name *</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50" placeholder="Auto from invoice item" value={form.productName} onChange={e => set('productName', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Product SKU</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="SKU-XXXX" value={form.productSku} onChange={e => set('productSku', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Return Quantity *</label>
            <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" value={form.returnQty} onChange={e => set('returnQty', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Return Value (₹)</label>
            <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" value={form.returnValue} onChange={e => set('returnValue', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option>Medium</option><option>High</option><option>Low</option><option>Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Return Type</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.returnType} onChange={e => set('returnType', e.target.value)}>
              <option>Material Return</option><option>Damaged</option><option>Quality Issue</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Approval Status *</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" 
              value={form.status} 
              onChange={e => set('status', e.target.value)}
            >
              <option value="Pending">PENDING</option>
              <option value="Approved">APPROVED</option>
               <option value="Approved">COMPLETED</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Reason for Return</label>
            <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Describe reason..." value={form.reason} onChange={e => set('reason', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 pt-2 border-t">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving || fetchingInvoice} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Return Request'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReturnsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab]       = useState(initialTab);
  const [returns, setReturns]           = useState(DUMMY_RETURNS);
  const [invoices, setInvoices]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [savingReturn, setSavingReturn] = useState(false);
  const [selected, setSelected]         = useState(null);
  const [showCreate, setShowCreate]     = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await materialReturnApi.getAll();
      const data = (response.data || []).map(normalizeReturn);
      setReturns(data.length ? data : DUMMY_RETURNS.map(normalizeReturn));
      setSelected(prev => prev ? data.find(r => r.mrId === prev.mrId) || prev : null);
    } catch (err) {
      toast(err.message || 'Returns API unavailable, showing local sample data', 'error');
      setReturns(DUMMY_RETURNS.map(normalizeReturn));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoiceApi.getAll({ limit: 200 });
      setInvoices(response.data || []);
    } catch (err) {
      toast(err.message || 'Invoice API fetch failed', 'error');
      setInvoices([]);
    }
  };

  useEffect(() => {
    loadReturns();
    loadInvoices();
  }, [loadReturns]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleInvoiceFetch = async (invoiceNo) => {
    const response = await materialReturnApi.getInvoiceContext(invoiceNo);
    return response.data || {};
  };

  const handleCreateReturn = async (form) => {
    setSavingReturn(true);
    try {
      const payload = {
        invoiceNo: form.invoiceNo, invoiceDate: form.invoiceDate || undefined,
        supplierName: form.supplierName, supplierEmail: form.supplierEmail,
        supplierPincode: form.supplierPincode, supplierGSTNo: form.supplierGSTNo,
        supplierAddress: form.supplierAddress, productName: form.productName,
        productSku: form.productSku, skuCode: form.productSku,
        returnQty: Number(form.returnQty) || 1, expectedQty: Number(form.returnQty) || 1,
        value: Number(form.returnValue || form.value) || 0, priority: form.priority,
        reason: form.reason || form.returnType || 'Material Return',
        returnStatus: 'Pending', approvalStatus: form.status || 'Pending', qcStatus: 'Pending',
        ledgerStatus: 'Pending', reconciliationStatus: 'Pending',
        transport: form.transport, awbNo: form.awbNo,
        stage: form.status === 'Completed' ? 'Manager_Approval' : 'Return_Request_Create',
        currentWorkflowStage: form.status === 'Completed' ? 'Manager_Approval' : 'Return_Request_Create',
      };
      const response = await materialReturnApi.create(payload);
      const created = normalizeReturn(response.data);
      setReturns(prev => [created, ...prev]);
      setSelected(created);
      toast(`Return Request ${created.returnRequestId || ''} created, MR ID ${created.mrId} generated`, 'success');
      setShowCreate(false);
    } catch (err) {
      toast(err.message || 'Return request create failed', 'error');
      throw err;
    } finally {
      setSavingReturn(false);
    }
  };

  const handleStageMove = async (mrId, newStage) => {
    const record = returns.find(r => r.mrId === mrId);
    if (!record?._id) {
      setReturns(prev => prev.map(r => r.mrId === mrId ? { ...r, stage: newStage } : r));
      setSelected(prev => prev && prev.mrId === mrId ? { ...prev, stage: newStage } : prev);
      toast(`Stage updated to ${newStage.replace(/_/g, ' ')}`, 'success');
      return;
    }
    try {
      const response = await materialReturnApi.updateStage(record._id, newStage);
      const updated = normalizeReturn(response.data);
      setReturns(prev => prev.map(r => r.mrId === mrId ? updated : r));
      setSelected(prev => prev && prev.mrId === mrId ? updated : prev);
      toast(`Stage updated to ${newStage.replace(/_/g, ' ')}`, 'success');
    } catch (err) {
      toast(err.message || 'Stage update failed', 'error');
    }
  };

  const handleApprovalUpdate = async (mrId, status) => {
    const record = returns.find(r => r.mrId === mrId);
    if (!record?._id) {
      setReturns(prev => prev.map(r => r.mrId === mrId ? { ...r, approvalStatus: status } : r));
      setSelected(prev => prev && prev.mrId === mrId ? { ...prev, approvalStatus: status } : prev);
      toast(`Approval status set to ${status}`, 'success');
      return;
    }
    try {
      let response;
      if (status === 'Approved') {
        response = await materialReturnApi.approve(record._id);
        toast('Return Request Approved! Workflow moved to Pickup Pending.', 'success');
      } else {
        response = await materialReturnApi.updateStatus(record._id, { 
          approvalStatus: status,
          stage: record.stage 
        });
        toast(`Return marked as ${status}`, 'success');
      }
      
      const updated = normalizeReturn(response.data);
      setReturns(prev => prev.map(r => r.mrId === mrId ? updated : r));
      setSelected(prev => prev && prev.mrId === mrId ? updated : prev);
      loadReturns();
    } catch (err) {
      toast(err.message || 'Approval update failed', 'error');
    }
  };

  const handleDelete = async (mrId) => {
    const record = returns.find(r => r.mrId === mrId);
    try {
      if (record?._id) await materialReturnApi.delete(record._id);
      setReturns(prev => prev.filter(r => r.mrId !== mrId));
      if (selected && selected.mrId === mrId) setSelected(null);
      toast('Return deleted', 'error');
    } catch (err) {
      toast(err.message || 'Delete failed', 'error');
    }
  };

  const filtered = searchTerm
    ? returns.filter(r =>
        (r.mrId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.docketId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.invoiceNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : returns;

  // ── Return Requests Tab ──────────────────────────────────────────────────────

  const renderReturnRequests = () => (
    <div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 min-w-[170px]">
          <label className="text-xs text-gray-500 font-medium">Date Range</label>
          <input type="text" defaultValue="01 May 2025 - 31 May 2025" className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs" />
        </div>
        {[
          { label: 'Return Type', options: ['All', 'Material Return', 'Damaged', 'Quality Issue'] },
          { label: 'Supplier',    options: ['All', 'ABC Suppliers', 'XYZ Industries', 'Global Components'] },
          { label: 'Return Stage', options: ['All', ...STAGES] },
          { label: 'Financial Status', options: ['All', 'Pending', 'Partial', 'Reconciled'] },
          { label: 'QC Status',    options: ['All', 'Pending', 'In Progress', 'Completed'] },
        ].map(({ label, options }) => (
          <div key={label} className="flex flex-col gap-1 min-w-[120px]">
            <label className="text-xs text-gray-500 font-medium">{label}</label>
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white">
              {options.map(o => <option key={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        ))}
        <div className="flex-1 min-w-[200px] relative">
          <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search MR ID, Invoice, Docket..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs" />
        </div>
        <button onClick={() => setShowCreate(true)} className="ml-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm active:scale-95 transition-all">
          <MdAdd size={16} /> New Return Request
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
        {[
          { icon: MdAssignment,    iconColor: 'text-red-500',    label: 'Total Returns',     value: String(returns.length), change: '↑12%' },
          { icon: MdLocalShipping, iconColor: 'text-blue-500',   label: 'In-Transit',        value: String(returns.filter(r => r.stage === 'In_Transit').length), change: '↑8%' },
          { icon: MdAccessTime,    iconColor: 'text-purple-500', label: 'Pending QC',        value: String(returns.filter(r => r.qcStatus === 'Pending').length), change: '↑5%' },
          { icon: MdAssignment,    iconColor: 'text-amber-500',  label: 'Financial Pending', value: String(returns.filter(r => r.finStatus === 'Pending').length), change: '↑16%', warnChange: true },
          { icon: MdCheckCircle,   iconColor: 'text-emerald-500',label: 'Recovered Amount',  value: '₹', change: '↑18%' },
          { icon: MdDelete,        iconColor: 'text-red-500',    label: 'Loss Amount',       value: '₹', change: '↑7%', warnChange: true },
          { icon: MdCheckCircle,   iconColor: 'text-green-500',  label: 'Closed Returns',    value: String(returns.filter(r => r.stage === 'Closed').length), change: '↑20%' },
          { icon: MdAssignment,    iconColor: 'text-red-600',    label: 'Critical Returns',  value: String(returns.filter(r => r.priority === 'High' || r.priority === 'Critical').length), change: '↑2%', warnChange: true },
        ].map((kpi, i) => <KpiCard key={i} {...kpi} />)}
      </div>

      <div className={`grid gap-4 ${selected ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        <div className={`${selected ? 'lg:col-span-7' : ''} bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden`}>
          <div className="px-5 py-3 border-b flex justify-end items-center">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50"><MdDownload size={14} /> Export</button>
              <button onClick={loadReturns} className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"><MdRefresh size={14} /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['MR ID', 'Docket ID', 'Invoice No', 'Party', 'Product', 'Return Qty', 'Approval', 'Stage', 'QC Status', 'Financial Status', 'Priority', 'Value', 'Actions'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={13} className="px-3 py-8 text-center text-xs text-gray-500">Loading backend returns...</td></tr>}
                {filtered.map((r) => (
                  <tr key={r.mrId} onClick={() => setSelected(s => s?.mrId === r.mrId ? null : r)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selected?.mrId === r.mrId ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-3 font-semibold text-red-600 text-xs whitespace-nowrap">{r.mrId}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{r.docketId}</td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-600">{r.invoiceNo}</td>
                    <td className="px-3 py-3 text-xs max-w-[120px] truncate">{r.supplierName}</td>
                    <td className="px-3 py-3 text-xs max-w-[120px] truncate">{r.productName}</td>
                    <td className="px-3 py-3 text-xs text-center font-semibold">{r.returnQty}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase whitespace-nowrap ${
                        r.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {r.approvalStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${stageBadge(r.stage)}`}>{r.stage.replace(/_/g, ' ')}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${qcBadge(r.qcStatus)}`}>{r.qcStatus}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${finBadge(r.finStatus)}`}>{r.finStatus}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioBadge(r.priority)}`}>{r.priority}</span></td>
                    <td className="px-3 py-3 text-xs font-semibold text-right whitespace-nowrap">₹{r.value.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button title="View" onClick={() => setSelected(s => s?.mrId === r.mrId ? null : r)} className="text-gray-400 hover:text-blue-600"><MdVisibility size={16} /></button>
                        <button title="Edit" onClick={() => toast('Edit coming soon', 'success')} className="text-gray-400 hover:text-green-600"><MdEdit size={16} /></button>
                        <button title="Delete" onClick={() => handleDelete(r.mrId)} className="text-gray-400 hover:text-red-600"><MdDelete size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t flex items-center justify-between text-xs text-gray-500">
            <span>Showing 1 - {Math.min(10, filtered.length)} of {filtered.length} entries</span>
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select className="border border-gray-300 rounded px-2 py-1 text-xs"><option>10</option><option>25</option><option>50</option></select>
              <div className="flex gap-1">
                {['‹', '1', '2', '3', '›'].map((p, i) => (
                  <button key={i} className={`w-7 h-7 rounded text-xs flex items-center justify-center border ${p === '1' ? 'bg-red-600 text-white border-red-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {selected && (
          <div className="lg:col-span-5">
            <DetailPanel record={selected} onClose={() => setSelected(null)} onStageMove={handleStageMove} onApprovalUpdate={handleApprovalUpdate} />
          </div>
        )}
      </div>
    </div>
  );

  // ── Root Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      {/* Tab Content */}
      {activeTab === 0 && renderReturnRequests()}
      {activeTab === 1 && <StageTrackerPage returns={returns} onStageUpdate={() => {}} />}

      {/* ✅ Tab 2: Full DocketTrackingPage component — sare 22 columns + modals */}
      {activeTab === 2 && <DocketTrackingPage />}

      {activeTab === 3 && <DebitCreditMatchingPage />}
      {activeTab === 4 && <ProfessionalLossTrackingPage />}

      {/* Create Return Modal */}
      <CreateReturnModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreateReturn}
        invoices={invoices}
        onInvoiceFetch={handleInvoiceFetch}
        saving={savingReturn}
      />
    </div>
  );
}
