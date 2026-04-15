import { useState } from 'react';
import Modal from '../../../../components/common/Modal';
import { vendors, prs } from '../data';

const emptyItem = { name: '', qty: '', unit: 'Nos' };

export default function CreateRFQModal({ open, onClose }) {
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [items, setItems] = useState([{ ...emptyItem }]);

  const toggleVendor = (name) =>
    setSelectedVendors(prev =>
      prev.includes(name) ? prev.filter(v => v !== name) : [...prev, name]
    );

  const updateItem = (i, field, value) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Modal open={open} onClose={onClose} title="Create RFQ" size="lg"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Send RFQ</button>
        </>
      }>

      {/* Basic Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">RFQ Title *</label>
          <input className="form-input" placeholder="e.g. Raw Material Supply Q3" />
        </div>
        <div className="form-group">
          <label className="form-label">Link PR (optional)</label>
          <select className="form-select">
            <option value="">— None —</option>
            {prs.map(p => <option key={p.id}>{p.id} — {p.dept}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date *</label>
          <input type="date" className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-select">
            <option>Normal</option><option>Urgent</option><option>Critical</option>
          </select>
        </div>
      </div>

      {/* Vendor Selection */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Select Vendors *</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {vendors.filter(v => v.status === 'Active').map(v => (
            <div key={v.id} onClick={() => toggleVendor(v.name)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1.5px solid ${selectedVendors.includes(v.name) ? 'var(--primary)' : 'var(--border)'}`,
                background: selectedVendors.includes(v.name) ? '#fdf5f5' : '#f8fafc',
                color: selectedVendors.includes(v.name) ? 'var(--primary)' : 'var(--text)',
              }}>
              {v.name}
            </div>
          ))}
        </div>
        {selectedVendors.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 6 }}>
            {selectedVendors.length} vendor(s) selected
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Items *</div>
          <button className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
              <input className="form-input" placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
              <input className="form-input" placeholder="Qty" type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
              <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                <option>Nos</option><option>Kg</option><option>Set</option><option>Litre</option><option>Metre</option>
              </select>
              <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px' }}
                onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
