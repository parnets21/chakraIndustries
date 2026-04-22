import { useState } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import PurchaseRequisitionTab from './components/PurchaseRequisitionTab';
import { prs } from './components/data';
import { MdAssignment, MdHourglassEmpty, MdCheckCircle, MdCancel, MdAdd } from 'react-icons/md';

export default function PurchaseRequisitionPage() {
  const [showCreate, setShowCreate] = useState(false);

  const pending  = prs.filter(p => p.status === 'Pending').length;
  const approved = prs.filter(p => p.status === 'Approved').length;
  const rejected = prs.filter(p => p.status === 'Rejected').length;

  const kpis = [
    { label: 'Total PRs',  value: prs.length, icon: <MdAssignment size={18} />,     color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Pending',    value: pending,    icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Approved',   value: approved,   icon: <MdCheckCircle size={18} />,    color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Rejected',   value: rejected,   icon: <MdCancel size={18} />,         color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)' },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Requisitions"
        breadcrumb="Procurement › PR List"
        action={
          <button onClick={() => setShowCreate(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
          }}>
            <MdAdd size={16} /> Create PR
          </button>
        }
      />

      <KpiStrip kpis={kpis} />

      <PageCard noPad>
        <div style={{ padding: '20px 20px 0' }}>
          <PurchaseRequisitionTab
            externalShowCreate={showCreate}
            onExternalClose={() => setShowCreate(false)}
          />
        </div>
      </PageCard>
    </div>
  );
}
