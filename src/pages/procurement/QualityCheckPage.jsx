import { useState } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import StatusBadge from '../../components/common/StatusBadge';
import { poItems } from './components/data';
import { MdVerifiedUser, MdCheckCircle, MdCancel, MdHourglassEmpty, MdSearch } from 'react-icons/md';

const qcRecords = [
  { grn: 'GRN-0234', po: 'PO-2024-087', vendor: 'Precision Parts Co.', items: 3, passed: 2, failed: 1, status: 'Partial', date: '13 Apr' },
  { grn: 'GRN-0233', po: 'PO-2024-086', vendor: 'National Seals',       items: 2, passed: 0, failed: 0, status: 'Pending', date: '12 Apr' },
  { grn: 'GRN-0232', po: 'PO-2024-085', vendor: 'Global Bearings Ltd',  items: 4, passed: 4, failed: 0, status: 'Passed',  date: '11 Apr' },
];

export default function QualityCheckPage() {
  const [selectedGRN, setSelectedGRN] = useState('GRN-0234');
  const [search, setSearch] = useState('');

  const passed  = qcRecords.filter(q => q.status === 'Passed').length;
  const partial = qcRecords.filter(q => q.status === 'Partial').length;
  const pending = qcRecords.filter(q => q.status === 'Pending').length;

  const kpis = [
    { label: 'Total Inspections', value: qcRecords.length, icon: <MdVerifiedUser size={18} />,    color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Passed',            value: passed,           icon: <MdCheckCircle size={18} />,     color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Partial / Failed',  value: partial,          icon: <MdCancel size={18} />,          color: '#dc2626', color2: '#ef4444', glow: 'rgba(220,38,38,0.3)' },
    { label: 'Pending QC',        value: pending,          icon: <MdHourglassEmpty size={18} />,  color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
  ];

  const inp = {
    padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9,
    fontSize: 13, outline: 'none', background: '#f8fafc', color: '#1e293b',
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div>
      <PageHeader title="Quality Check" breadcrumb="Procurement › Quality Check" />

      <KpiStrip kpis={kpis} />

      {/* GRN List */}
      <PageCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>GRN Inspection Queue</div>
          <div style={{ position: 'relative', width: 220 }}>
            <MdSearch size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input style={{ ...inp, paddingLeft: 30 }} placeholder="Search GRN..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['GRN ID', 'PO Ref', 'Vendor', 'Items', 'Passed', 'Failed', 'Status', 'Date', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qcRecords.filter(q => !search || q.grn.toLowerCase().includes(search.toLowerCase()) || q.vendor.toLowerCase().includes(search.toLowerCase())).map((q, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setSelectedGRN(q.grn)}
                >
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{q.grn}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#1e293b' }}>{q.po}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#1e293b', fontWeight: 500 }}>{q.vendor}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#1e293b' }}>{q.items}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#16a34a', fontWeight: 600 }}>{q.passed}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: q.failed > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>{q.failed}</td>
                  <td style={{ padding: '11px 14px' }}><StatusBadge status={q.status} /></td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#64748b' }}>{q.date}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button onClick={e => { e.stopPropagation(); setSelectedGRN(q.grn); }} style={{
                      padding: '5px 12px', fontSize: 12, borderRadius: 8,
                      background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
                      cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                    }}>Inspect</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* QC Detail Panel */}
      <PageCard>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
          Quality Inspection — {selectedGRN}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
          Enter pass/fail quantities for each item below
        </div>
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #f1f5f9', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Item', 'Received Qty', 'Inspected', 'Pass', 'Fail', 'Result', 'Remarks'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.7px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{item.item}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#1e293b' }}>{item.qty}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#1e293b' }}>{item.qty}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <input type="number" style={{ ...inp, width: 70 }} defaultValue={item.qty - (i === 1 ? 2 : 0)} />
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <input type="number" style={{ ...inp, width: 70 }} defaultValue={i === 1 ? 2 : 0} />
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <StatusBadge status={i === 1 ? 'Partial' : 'Passed'} />
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <input style={{ ...inp, width: 140 }} placeholder="Remarks..." />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#fee2e2', color: '#dc2626', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          }}>✗ Reject Batch</button>
          <button style={{
            padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(22,163,74,0.3)',
          }}>✓ Approve & Close</button>
        </div>
      </PageCard>
    </div>
  );
}
