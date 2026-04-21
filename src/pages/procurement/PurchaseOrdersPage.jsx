import { useState } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';
import { pos } from './components/data';
import { MdShoppingCart, MdHourglassEmpty, MdCheckCircle, MdLocalShipping, MdAdd } from 'react-icons/md';

export default function PurchaseOrdersPage() {
  const [showPOModal, setShowPOModal] = useState(false);

  const pending  = pos.filter(p => p.status === 'Pending').length;
  const approved = pos.filter(p => p.status === 'Approved').length;
  const received = pos.filter(p => p.status === 'Received').length;
  const totalVal = '₹12,74,400';

  const kpis = [
    { label: 'Total POs',     value: pos.length, icon: <MdShoppingCart size={18} />,   color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Pending',       value: pending,    icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Approved',      value: approved,   icon: <MdCheckCircle size={18} />,    color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Total Value',   value: totalVal,   icon: <MdLocalShipping size={18} />,  color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)' },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        breadcrumb="Procurement › PO Management"
        action={
          <button onClick={() => setShowPOModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
          }}>
            <MdAdd size={16} /> Create PO
          </button>
        }
      />

      <KpiStrip kpis={kpis} />

      <PageCard noPad>
        <div style={{ padding: '20px' }}>
          <PurchaseOrdersTab showPOModal={showPOModal} setShowPOModal={setShowPOModal} />
        </div>
      </PageCard>
    </div>
  );
}
