import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';

const returns = [
  { id: 'RET-001', order: 'ORD-2024-080', customer: 'Bajaj Auto', items: 4, value: '₹48,000', type: 'Defective', status: 'Pending', date: '13 Apr' },
  { id: 'RET-002', order: 'ORD-2024-075', customer: 'Hero MotoCorp', items: 2, value: '₹22,000', type: 'Wrong Item', status: 'Approved', date: '12 Apr' },
  { id: 'RET-003', order: 'ORD-2024-070', customer: 'TVS Motor', items: 6, value: '₹84,000', type: 'Defective', status: 'Completed', date: '10 Apr' },
  { id: 'RET-004', order: 'ORD-2024-065', customer: 'Tata Motors', items: 1, value: '₹12,000', type: 'Excess', status: 'Rejected', date: '8 Apr' },
];

export default function ReturnsPage() {
  const [selected, setSelected] = useState(returns[0]);
  const [showModal, setShowModal] = useState(false);

  const kpis = [
    { label: 'Total Returns', value: returns.length, color: '#1c2833' },
    { label: 'Pending', value: returns.filter(r => r.status === 'Pending').length, color: '#f59e0b' },
    { label: 'Approved', value: returns.filter(r => r.status === 'Approved').length, color: '#3b82f6' },
    { label: 'Completed', value: returns.filter(r => r.status === 'Completed').length, color: '#10b981' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Returns Management</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Returns</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Return</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Returns List</div>
          <div className="table-container">
            <table>
              <thead><tr>{['Return ID','Order','Customer','Type','Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {returns.map((r, i) => (
                  <tr key={i} onClick={() => setSelected(r)} style={{ cursor: 'pointer', background: selected?.id === r.id ? '#fdf5f5' : '' }}>
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>{r.id}</td>
                    <td>{r.order}</td>
                    <td style={{ fontWeight: 600 }}>{r.customer}</td>
                    <td><StatusBadge status={r.type} type="warning" /></td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Material Validation — {selected.id}</div>
              <div className="grid-2" style={{ marginBottom: 14 }}>
                {[['Return ID', selected.id], ['Order Ref', selected.order], ['Customer', selected.customer], ['Return Type', selected.type], ['Items', selected.items], ['Date', selected.date]].map(([k, v]) => (
                  <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: '#718096', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Inspection Remarks</label>
                <textarea className="form-textarea" placeholder="Enter inspection findings..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success" style={{ flex: 1 }}>✓ Accept</button>
                <button className="btn btn-danger" style={{ flex: 1 }}>✗ Reject</button>
              </div>
            </div>
            <div className="card">
              <div className="section-title" style={{ marginBottom: 12 }}>Financial Processing</div>
              {[['Return Value', selected.value], ['GST Credit', '₹7,200'], ['Net Refund', selected.value], ['Credit Note', 'CN-2024-' + selected.id.split('-')[1]]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#718096' }}>{k}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 14, width: '100%' }}>Issue Credit Note</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New Return</span>
              <button className="btn btn-sm" style={{ background: 'none', color: '#718096', fontSize: 20, padding: '0 4px' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="form-label">Order Reference *</label><input className="form-input" placeholder="e.g. ORD-2024-089" /></div>
                <div className="form-group"><label className="form-label">Customer Name *</label><input className="form-input" placeholder="Customer name" /></div>
                <div className="form-group"><label className="form-label">Return Type *</label><select className="form-select"><option>Defective</option><option>Wrong Item</option><option>Excess</option><option>Damaged in Transit</option></select></div>
                <div className="form-group"><label className="form-label">Number of Items *</label><input type="number" className="form-input" placeholder="0" /></div>
                <div className="form-group"><label className="form-label">Return Value (₹) *</label><input type="number" className="form-input" placeholder="0.00" /></div>
                <div className="form-group"><label className="form-label">Return Date</label><input type="date" className="form-input" /></div>
              </div>
              <div className="form-group"><label className="form-label">Reason / Description *</label><textarea className="form-textarea" placeholder="Describe the reason for return..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Submit Return</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
