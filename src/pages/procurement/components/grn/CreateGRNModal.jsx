import { useState } from 'react';
import Modal from '../../../../components/common/Modal';
import { pos } from '../data';

export default function CreateGRNModal({ open, onClose }) {
  const [selectedPO, setSelectedPO] = useState('');
  const [items, setItems] = useState([
    { name: 'Bearing 6205', ordered: 100, received: '', condition: 'Good' },
    { name: 'Oil Seal 35x52', ordered: 200, received: '', condition: 'Good' },
  ]);

  const updateItem = (i, k, v) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  return (
    <Modal open={open} onClose={onClose} title="Create Goods Receipt Note (GRN)" size="lg"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save GRN</button>
        </>
      }>

      {/* Header Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">PO Reference *</label>
          <select className="form-select" value={selectedPO} onChange={e => setSelectedPO(e.target.value)}>
            <option value="">— Select PO —</option>
            {pos.map(p => (
              <option key={p.id} value={p.id}>{p.id} — {p.vendor}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Receipt Date *</label>
          <input type="date" className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Warehouse *</label>
          <select className="form-select">
            <option>WH-01 — Main Store</option>
            <option>WH-02 — Secondary Store</option>
            <option>WH-03 — Raw Material Store</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Received By *</label>
          <input className="form-input" placeholder="Staff name" />
        </div>
        <div className="form-group">
          <label className="form-label">Vehicle / Challan No.</label>
          <input className="form-input" placeholder="e.g. MH-12-AB-1234" />
        </div>
        <div className="form-group">
          <label className="form-label">Supplier Challan Date</label>
          <input type="date" className="form-input" />
        </div>
      </div>

      {/* Items Receipt */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items Received</div>
      <div className="table-container" style={{ marginBottom: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Ordered Qty</th>
              <th>Received Qty</th>
              <th>Condition</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td style={{ color: '#64748b' }}>{item.ordered}</td>
                <td>
                  <input type="number" className="form-input" style={{ width: 80 }}
                    placeholder="0" value={item.received}
                    onChange={e => updateItem(i, 'received', e.target.value)} />
                </td>
                <td>
                  <select className="form-select" style={{ width: 110 }}
                    value={item.condition} onChange={e => updateItem(i, 'condition', e.target.value)}>
                    <option>Good</option>
                    <option>Damaged</option>
                    <option>Partial</option>
                  </select>
                </td>
                <td>
                  <input className="form-input" placeholder="Optional..." />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>RECEIPT SUMMARY</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Ordered</div>
            <div style={{ fontWeight: 700 }}>{items.reduce((s, i) => s + i.ordered, 0)} units</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Received</div>
            <div style={{ fontWeight: 700, color: '#16a34a' }}>
              {items.reduce((s, i) => s + (parseInt(i.received) || 0), 0)} units
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Pending</div>
            <div style={{ fontWeight: 700, color: '#d97706' }}>
              {items.reduce((s, i) => s + Math.max(0, i.ordered - (parseInt(i.received) || 0)), 0)} units
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
