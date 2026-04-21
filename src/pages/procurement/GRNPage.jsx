import { useState } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import GRNTab from './components/GRNTab';
import { grns } from './components/data';
import { MdInventory, MdCheckCircle, MdHourglassEmpty, MdWarning, MdAdd } from 'react-icons/md';

export default function GRNPage() {
  const [showCreate, setShowCreate] = useState(false);

  const completed = grns.filter(g => g.status === 'Completed').length;
  const partial   = grns.filter(g => g.status === 'Partial').length;
  const pending   = grns.filter(g => g.status === 'Pending').length;

  const kpis = [
    { label: 'Total GRNs',  value: grns.length, icon: <MdInventory size={18} />,       color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Completed',   value: completed,   icon: <MdCheckCircle size={18} />,     color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Partial',     value: partial,     icon: <MdHourglassEmpty size={18} />,  color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Pending QC',  value: pending,     icon: <MdWarning size={18} />,         color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)' },
  ];

  return (
    <div>
      <PageHeader
        title="GRN Entry"
        breadcrumb="Procurement › GRN"
        action={
          <button onClick={() => setShowCreate(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
          }}>
            <MdAdd size={16} /> Create GRN
          </button>
        }
      />

      <KpiStrip kpis={kpis} />

      <PageCard noPad>
        <div style={{ padding: '20px 20px 0' }}>
          <GRNTab externalShowCreate={showCreate} onExternalClose={() => setShowCreate(false)} />
        </div>
      </PageCard>
    </div>
  );
}
