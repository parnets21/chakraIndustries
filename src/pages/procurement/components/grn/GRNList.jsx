import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import Modal from '../../../../components/common/Modal';
import EditGRNModal from './EditGRNModal';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';

export default function GRNList({ onView, refresh }) {
  const [grns, setGrns] = useState([]);
  const [deleteGRN, setDeleteGRN] = useState(null);
  const [editGRN, setEditGRN] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGRNs = useCallback(async () => {
    try {
      // Mock data - replace with actual API call
      setGrns([
        { _id: '1', grnId: 'GRN-001', poId: { poId: 'PO-001' }, vendorId: { companyName: 'Vendor A' }, orderedQuantity: 100, receivedQuantity: 100, receivedDate: '2024-04-15', status: 'Completed' },
        { _id: '2', grnId: 'GRN-002', poId: { poId: 'PO-002' }, vendorId: { companyName: 'Vendor B' }, orderedQuantity: 50, receivedQuantity: 45, receivedDate: '2024-04-14', status: 'Pending' },
      ]);
    } catch (e) {
      console.error('GRN fetch error:', e.message);
    }
  }, []);

  useEffect(() => {
    fetchGRNs();
  }, [fetchGRNs, refresh]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // await grnApi.delete(deleteGRN._id);
      setGrns(prev => prev.filter(g => g._id !== deleteGRN._id));
      setDeleteGRN(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditSave = (updatedGRN) => {
    setGrns(prev => prev.map(g => g._id === updatedGRN._id ? updatedGRN : g));
  };

  const fmt = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>GRN List</div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>GRN ID</th>
                <th>PO Ref</th>
                <th>Vendor</th>
                <th>Ordered Qty</th>
                <th>Received Qty</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {grns.map((g) => (
                <tr key={g._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace', fontSize: 12 }}>{g.grnId}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {g.poId?.poId || g.poId || '—'}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {g.vendorId?.companyName || g.vendorId || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>{g.orderedQuantity}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: g.receivedQuantity >= g.orderedQuantity ? '#16a34a' : '#d97706' }}>
                    {g.receivedQuantity}
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>{fmt(g.receivedDate)}</td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" title="View Details"
                        style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }}
                        onClick={() => onView(g)}>
                        <MdVisibility size={16} />
                      </button>
                      <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                        onClick={() => setEditGRN(g)}>
                        <FaRegEdit size={15} />
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
            <button className="btn btn-outline" onClick={() => setDeleteGRN(null)} disabled={deleting}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }}
              onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>
          Delete <strong>{deleteGRN?.grnId}</strong>? This cannot be undone.
        </p>
      </Modal>

      {/* Edit GRN Modal */}
      <EditGRNModal open={!!editGRN} onClose={() => setEditGRN(null)} grn={editGRN} onSave={handleEditSave} />
    </>
  );
}
