import { useState } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import PRApprovalBadge from './PRApprovalBadge';
import Modal from '../../../../components/common/Modal';
import { prs } from '../data';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';

export default function PRList() {
  const [items, setItems]     = useState(prs);
  const [viewPR, setViewPR]   = useState(null);
  const [editPR, setEditPR]   = useState(null);
  const [deletePR, setDeletePR] = useState(null);

  const confirmDelete = () => {
    setItems(prev => prev.filter(p => p.id !== deletePR.id));
    setDeletePR(null);
  };

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>PR List</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PR ID</th><th>Department</th><th>Items</th><th>Value</th>
                <th>Requested By</th><th>Date</th><th>Approval</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.id}</td>
                  <td>{p.dept}</td>
                  <td>{p.items}</td>
                  <td style={{ fontWeight: 700 }}>{p.value}</td>
                  <td>{p.requestedBy}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{p.date}</td>
                  <td><PRApprovalBadge status={p.status} /></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                        onClick={() => setEditPR(p)}><FaRegEdit size={15} /></button>
                      <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }}
                        onClick={() => setViewPR(p)}><MdVisibility size={16} /></button>
                      <button className="btn btn-sm" title="Delete" style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }}
                        onClick={() => setDeletePR(p)}><MdDeleteOutline size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal open={!!deletePR} onClose={() => setDeletePR(null)} title="Delete PR"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeletePR(null)}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={confirmDelete}>Delete</button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deletePR?.id}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* View PR Modal */}
      <Modal open={!!viewPR} onClose={() => setViewPR(null)} title={`PR Details — ${viewPR?.id}`}
        footer={<button className="btn btn-outline" onClick={() => setViewPR(null)}>Close</button>}>
        {viewPR && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              ['PR ID', viewPR.id],
              ['Department', viewPR.dept],
              ['Items', viewPR.items],
              ['Value', viewPR.value],
              ['Requested By', viewPR.requestedBy],
              ['Date', viewPR.date],
              ['Status', viewPR.status],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Edit PR Modal */}
      <Modal open={!!editPR} onClose={() => setEditPR(null)} title={`Edit PR — ${editPR?.id}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditPR(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setEditPR(null)}>Save Changes</button>
          </>
        }>
        {editPR && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group"><label className="form-label">Department</label>
              <select className="form-select" defaultValue={editPR.dept}>
                <option>Production</option><option>Maintenance</option><option>Admin</option><option>Logistics</option><option>Finance</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Requested By</label>
              <input className="form-input" defaultValue={editPR.requestedBy} /></div>
            <div className="form-group"><label className="form-label">Value</label>
              <input className="form-input" defaultValue={editPR.value} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" defaultValue={editPR.status}>
                <option>Pending</option><option>Approved</option><option>Rejected</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
