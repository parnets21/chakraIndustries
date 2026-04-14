import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea, Grid2, ModalBtn } from '../../components/forms/FormField';

const returns = [
  { id: 'RET-001', order: 'ORD-2024-080', customer: 'Bajaj Auto', items: 4, value: '₹48,000', type: 'Defective', status: 'Pending', date: '13 Apr' },
  { id: 'RET-002', order: 'ORD-2024-075', customer: 'Hero MotoCorp', items: 2, value: '₹22,000', type: 'Wrong Item', status: 'Approved', date: '12 Apr' },
  { id: 'RET-003', order: 'ORD-2024-070', customer: 'TVS Motor', items: 6, value: '₹84,000', type: 'Defective', status: 'Completed', date: '10 Apr' },
  { id: 'RET-004', order: 'ORD-2024-065', customer: 'Tata Motors', items: 1, value: '₹12,000', type: 'Excess', status: 'Rejected', date: '8 Apr' },
];

export default function ReturnsPage() {
  const [selected, setSelected] = useState(returns[0]);
  const [showModal, setShowModal] = useState(false);

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
        {[
          { label: 'Total Returns', value: returns.length, color: '#f3f4f6', textColor: 'var(--text)' },
          { label: 'Pending', value: returns.filter(r => r.status === 'Pending').length, color: '#fef3c7', textColor: '#f59e0b' },
          { label: 'Approved', value: returns.filter(r => r.status === 'Approved').length, color: '#dbeafe', textColor: '#3b82f6' },
          { label: 'Completed', value: returns.filter(r => r.status === 'Completed').length, color: '#d1fae5', textColor: '#10b981' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ background: k.color, border: 'none' }}>
            <div className="kpi-value" style={{ color: k.textColor }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 14 }}>Returns List</div>
          <div className="table-container">
            <table>
              <thead><tr><th>Return ID</th><th>Order</th><th>Customer</th><th>Type</th><th>Status</th></tr></thead>
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
              <div style={{ fontWeight: 700, marginBottom: 12, color: '#1c2833' }}>Material Validation — {selected.id}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                {[['Return ID', selected.id], ['Order Ref', selected.order], ['Customer', selected.customer], ['Return Type', selected.type], ['Items', selected.items], ['Date', selected.date]].map(([k, v]) => (
                  <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-light)', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Inspection Remarks</label>
                <textarea className="form-textarea" placeholder="Enter inspection findings..." />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success btn-sm" style={{ flex: 1 }}>✓ Accept</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }}>✗ Reject</button>
              </div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Financial Processing</div>
              {[['Return Value', selected.value], ['GST Credit', '₹7,200'], ['Net Refund', selected.value], ['Credit Note', 'CN-2024-' + selected.id.split('-')[1]]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-light)' }}>{k}</span>
                  <span style={{ fontWeight: 700 }}>{v}</span>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop: 14, width: '100%' }}>Issue Credit Note</button>
            </div>
          </div>
        )}
      </div>

      {/* New Return Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Return"
        footer={<><ModalBtn variant="outline" onClick={() => setShowModal(false)}>Cancel</ModalBtn><ModalBtn onClick={() => setShowModal(false)}>Submit Return</ModalBtn></>}>
        <Grid2>
          <Input label="Order Reference *" placeholder="e.g. ORD-2024-089" />
          <Input label="Customer Name *" placeholder="Customer name" />
          <Select label="Return Type *">
            <option>Defective</option>
            <option>Wrong Item</option>
            <option>Excess</option>
            <option>Damaged in Transit</option>
          </Select>
          <Input label="Number of Items *" type="number" placeholder="0" />
          <Input label="Return Value (₹) *" type="number" placeholder="0.00" />
          <Input label="Return Date" type="date" />
        </Grid2>
        <Textarea label="Reason / Description *" placeholder="Describe the reason for return..." />
      </Modal>
    </div>
  );
}
