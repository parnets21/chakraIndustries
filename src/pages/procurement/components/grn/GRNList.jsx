import { useState } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import Modal from '../../../../components/common/Modal';
import { grnDetails } from '../data';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';

export default function GRNList({ onView }) {
  const [items, setItems]         = useState(grnDetails);
  const [deleteGRN, setDeleteGRN] = useState(null);

  const confirmDelete = () => {
    setItems(prev => prev.filter(g => g.id !== deleteGRN.id));
    setDeleteGRN(null);
  };

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>GRN List</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>GRN ID</th><th>PO Ref</th><th>Vendor</th><th>Warehouse</th>
                <th>Received By</th><th>Date</th><th>QC Status</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((g, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{g.id}</td>
                  <td style={{ color: '#64748b' }}>{g.poRef}</td>
                  <td style={{ fontWeight: 500 }}>{g.vendor}</td>
                  <td>{g.warehouse}</td>
                  <td>{g.receivedBy}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{g.receivedDate}</td>
                  <td><StatusBadge status={g.qcStatus} /></td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}>
                        <FaRegEdit size={15} />
                      </button>
                      <button className="btn btn-sm" title="View Details"
                        style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }}
                        onClick={() => onView(g)}>
                        <MdVisibility size={16} />
                      </button>
                      <button className="btn btn-sm" title="Delete"
                        style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }}
                        onClick={() => setDeleteGRN(g)}>
                        <MdDeleteOutline size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteGRN} onClose={() => setDeleteGRN(null)} title="Delete GRN"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteGRN(null)}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={confirmDelete}>Delete</button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deleteGRN?.id}</strong>? This action cannot be undone.</p>
      </Modal>
    </>
  );
}
