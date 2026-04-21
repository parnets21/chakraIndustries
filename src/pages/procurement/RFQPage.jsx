import { useState } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import RFQTab from './components/RFQTab';
import { rfqs } from './components/data';
import { MdRequestQuote, MdHourglassEmpty, MdCheckCircle, MdAdd } from 'react-icons/md';

export default function RFQPage() {
  const [showCreate, setShowCreate] = useState(false);

  const open   = rfqs.filter(r => r.status === 'Open').length;
  const closed = rfqs.filter(r => r.status === 'Closed').length;
  const total  = rfqs.length;

  const kpis = [
    { label: 'Total RFQs',    value: total,  icon: <MdRequestQuote size={18} />, color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Open',          value: open,   icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Closed',        value: closed, icon: <MdCheckCircle size={18} />,  color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Avg. Vendors',  value: '2.3',  icon: <MdRequestQuote size={18} />, color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)' },
  ];

  return (
    <div>
      <PageHeader
        title="RFQ Management"
        breadcrumb="Procurement › RFQ"
        action={
          <button onClick={() => setShowCreate(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
          }}>
            <MdAdd size={16} /> Create RFQ
          </button>
        }
      />

      <KpiStrip kpis={kpis} />

      <PageCard noPad>
        <div style={{ padding: '20px 20px 0' }}>
          <RFQTab externalShowCreate={showCreate} onExternalClose={() => setShowCreate(false)} />
        </div>
      </PageCard>
    </div>
  );
}
