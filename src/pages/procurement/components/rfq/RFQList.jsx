import { useState } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import RFQFlowBadge from './RFQFlowBadge';
import Modal from '../../../../components/common/Modal';
import { rfqDetails, vendors, prs } from '../data';
import { FaRegEdit } from 'react-icons/fa';
import { MdCompareArrows, MdDeleteOutline } from 'react-icons/md';

export default function RFQList({ onCompare }) {
  const [items, setItems]       = useState(rfqDetails);
  const [editRFQ, setEditRFQ]   = useState(null);
  const [deleteRFQ, setDeleteRFQ] = useState(null);

  const confirmDelete = () => {
    setItems(prev => prev.filter(r => r.id !== deleteRFQ.id));
    setDeleteRFQ(null);
  };

  return (
    <>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>RFQ ID</th><th>Title</th><th>Vendors</th><th>Due Date</th>
                <th>Flow</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.id}</td>
                  <td style={{ fontWeight: 600 }}>{r.title}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {r.vendors.map(v => (
                        <span key={v} style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 10, color: '#475569' }}>{v}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{r.dueDate}</td>
                  <td><RFQFlowBadge prRef={r.prRef} rfqId={r.id} poRef={r.poRef} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                        onClick={() => setEditRFQ(r)}><FaRegEdit size={15} /></button>
                      <button className="btn btn-sm" title="Compare Quotes"
                        style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 8px', border: '1px solid #bbf7d0' }}
                        onClick={() => onCompare(r)}><MdCompareArrows size={16} /></button>
                      <button className="btn btn-sm" title="Delete"
                        style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }}
                        onClick={() => setDeleteRFQ(r)}><MdDeleteOutline size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteRFQ} onClose={() => setDeleteRFQ(null)} title="Delete RFQ"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteRFQ(null)}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={confirmDelete}>Delete</button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deleteRFQ?.id}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* Edit RFQ Modal */}
      <Modal open={!!editRFQ} onClose={() => setEditRFQ(null)} title={`Edit RFQ — ${editRFQ?.id}`} size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditRFQ(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setEditRFQ(null)}>Save Changes</button>
          </>
        }>
        {editRFQ && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="form-group"><label className="form-label">RFQ Title *</label>
                <input className="form-input" defaultValue={editRFQ.title} /></div>
              <div className="form-group"><label className="form-label">Due Date *</label>
                <input type="date" className="form-input" defaultValue={editRFQ.dueDate} /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" defaultValue={editRFQ.status}>
                  <option>Open</option><option>Closed</option><option>Cancelled</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Link PR</label>
                <select className="form-select" defaultValue={editRFQ.prRef || ''}>
                  <option value="">— None —</option>
                  {prs.map(p => <option key={p.id} value={p.id}>{p.id} — {p.dept}</option>)}
                </select>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Vendors</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {vendors.filter(v => v.status === 'Active').map(v => (
                <div key={v.id} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${editRFQ.vendors.includes(v.name) ? 'var(--primary)' : 'var(--border)'}`,
                  background: editRFQ.vendors.includes(v.name) ? '#fdf5f5' : '#f8fafc',
                  color: editRFQ.vendors.includes(v.name) ? 'var(--primary)' : 'var(--text)',
                }}>{v.name}</div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Item Name</th><th>Qty</th><th>Unit</th></tr></thead>
                <tbody>
                  {editRFQ.items.map((item, i) => (
                    <tr key={i}>
                      <td><input className="form-input" defaultValue={item.name} /></td>
                      <td><input className="form-input" type="number" defaultValue={item.qty} style={{ width: 80 }} /></td>
                      <td><select className="form-select" defaultValue={item.unit} style={{ width: 90 }}>
                        <option>Nos</option><option>Kg</option><option>Set</option><option>Litre</option><option>Metre</option>
                      </select></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
