import { useState } from 'react';
import { defaultCategories } from './components/data';
import VendorsTab from './components/VendorsTab';
import RFQTab from './components/RFQTab';
import PurchaseRequisitionTab from './components/PurchaseRequisitionTab';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';
import GRNTab from './components/GRNTab';
import QualityCheckTab from './components/QualityCheckTab';
import StatusBadge from '../../components/common/StatusBadge';

/* ─── jump to section ─────────────────────────────────────────────────────── */
const jump = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ─── section divider header ─────────────────────────────────────────────── */
function SectionHeader({ id, num, title, sub }) {
  return (
    <div id={id} style={{ scrollMarginTop: 108, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 800,
          boxShadow: '0 2px 8px rgba(185,28,28,.28)',
        }}>{num}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-0.2px' }}>{title}</div>
          {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      <div style={{
        height: 2,
        background: 'linear-gradient(90deg,#ef4444 0%,#fca5a5 45%,#f3f4f6 100%)',
        borderRadius: 2, marginBottom: 18,
      }} />
    </div>
  );
}

/* ─── approvals inline section ───────────────────────────────────────────── */
const pendingApprovals = [
  { id: 'PO-2024-089', type: 'Purchase Order',       amount: '₹4,82,000', requestedBy: 'Ravi Sharma',  dept: 'Procurement', age: '2d', level: 'L2 — Manager',  status: 'Pending'   },
  { id: 'PR-2024-034', type: 'Purchase Requisition', amount: '₹1,20,000', requestedBy: 'Priya Nair',   dept: 'Production',  age: '1d', level: 'L1 — HOD',      status: 'Pending'   },
  { id: 'RFQ-2024-012',type: 'RFQ',                  amount: '₹8,40,000', requestedBy: 'Amit Patel',   dept: 'Procurement', age: '3d', level: 'L3 — Director',  status: 'Pending'   },
  { id: 'PO-2024-085', type: 'Purchase Order',       amount: '₹2,10,000', requestedBy: 'Suresh Jain',  dept: 'Maintenance', age: '4d', level: 'L2 — Manager',  status: 'Escalated' },
];

function ApprovalsSection() {
  const th = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
  const td = 'px-4 py-3 text-sm text-gray-800 align-middle';
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="text-sm font-bold text-gray-800">Pending Approvals</div>
        <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{pendingApprovals.length}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead><tr>{['Doc ID','Type','Amount','Requested By','Dept','Age','Level','Status','Actions'].map(h=><th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {pendingApprovals.map((a,i)=>(
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                <td className={`${td} font-semibold text-red-700`}>{a.id}</td>
                <td className={td}>{a.type}</td>
                <td className={`${td} font-bold`}>{a.amount}</td>
                <td className={td}>{a.requestedBy}</td>
                <td className={td}>{a.dept}</td>
                <td className={`${td} font-bold ${parseInt(a.age)>2?'text-red-500':'text-amber-500'}`}>{a.age}</td>
                <td className={td}>{a.level}</td>
                <td className={td}><StatusBadge status={a.status} type={a.status==='Escalated'?'danger':'warning'}/></td>
                <td className={td}>
                  <div className="flex gap-1.5">
                    <button className="px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-800 font-semibold border-0 cursor-pointer font-[inherit]">✓ Approve</button>
                    <button className="px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">✗ Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── nav items ──────────────────────────────────────────────────────────── */
const NAV = [
  { id: 'sec-vendors',   label: 'Vendors' },
  { id: 'sec-rfq',       label: 'RFQ' },
  { id: 'sec-pr',        label: 'Purchase Requisition' },
  { id: 'sec-approvals', label: 'Approvals' },
  { id: 'sec-po',        label: 'Purchase Orders' },
  { id: 'sec-grn',       label: 'GRN' },
  { id: 'sec-qc',        label: 'Quality Check' },
];

/* ─── main page ──────────────────────────────────────────────────────────── */
export default function ProcurementPage() {
  const [showVendorModal,   setShowVendorModal]   = useState(false);
  const [showPOModal,       setShowPOModal]       = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories,        setCategories]        = useState(defaultCategories);
  const [newCategory,       setNewCategory]       = useState('');

  return (
    <div>
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Procurement & Purchase Management</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Procurement</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]"
            onClick={() => setShowCategoryModal(true)}>⚙ Categories</button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]"
            onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
            onClick={() => setShowPOModal(true)}>+ New PO</button>
        </div>
      </div>

      {/* ── Sticky quick-jump nav ── */}
      <div style={{
        position: 'sticky', top: 64, zIndex: 50,
        background: '#fff',
        borderBottom: '1.5px solid #e5e7eb',
        display: 'flex', overflowX: 'auto', gap: 0,
        marginLeft: -24, marginRight: -24, paddingLeft: 24,
        marginBottom: 32,
        scrollbarWidth: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        {NAV.map((s, i) => (
          <button key={s.id} onClick={() => jump(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
              background: 'transparent', border: 'none',
              borderBottom: '2.5px solid transparent',
              color: '#6b7280', transition: 'all .15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.color='#b91c1c'; e.currentTarget.style.borderBottomColor='#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.color='#6b7280'; e.currentTarget.style.borderBottomColor='transparent'; }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              background: '#fef2f2', color: '#ef4444',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800,
            }}>{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Vendor Onboarding & Categorization
      ══════════════════════════════════════════════════════════════════════ */}
      <SectionHeader id="sec-vendors" num="1"
        title="Vendor Onboarding & Categorization"
        sub="Manage all vendors, categories and ratings" />
      <VendorsTab
        categories={categories} setCategories={setCategories}
        newCategory={newCategory} setNewCategory={setNewCategory}
        showVendorModal={showVendorModal} setShowVendorModal={setShowVendorModal}
        showCategoryModal={showCategoryModal} setShowCategoryModal={setShowCategoryModal}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — RFQ Management
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader id="sec-rfq" num="2"
          title="RFQ Management"
          sub="Request for quotations, vendor quotes and comparison" />
        <RFQTab />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Purchase Requisition Workflow
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader id="sec-pr" num="3"
          title="Purchase Requisition Workflow"
          sub="Raise and track internal purchase requests" />
        <PurchaseRequisitionTab />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — Multi-Level Approval System
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader id="sec-approvals" num="4"
          title="Multi-Level Approval System"
          sub="Approve or reject pending procurement documents" />
        <ApprovalsSection />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — Purchase Order Creation
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader id="sec-po" num="5"
          title="Purchase Order Creation"
          sub="Create, track and manage all purchase orders" />
        <PurchaseOrdersTab showPOModal={showPOModal} setShowPOModal={setShowPOModal} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — Goods Receipt Note
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader id="sec-grn" num="6"
          title="Goods Receipt Note (GRN)"
          sub="Record and verify goods received against purchase orders" />
        <GRNTab />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — Quality Inspection
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 48 }}>
        <SectionHeader id="sec-qc" num="7"
          title="Quality Inspection"
          sub="Inspect received goods and record pass / fail results" />
        <QualityCheckTab />
      </div>

      {/* bottom padding */}
      <div style={{ height: 60 }} />
    </div>
  );
}
