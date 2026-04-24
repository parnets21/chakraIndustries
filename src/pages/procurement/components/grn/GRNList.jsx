import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import Modal from '../../../../components/common/Modal';
import { grnApi } from '../../../../api/grnApi';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';

export default function GRNList({ onView, refresh }) {
  const [grns, setGrns]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [deleteGRN, setDeleteGRN] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const fetchGRNs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await grnApi.getAll();
      setGrns(res.data || []);
    } catch (e) {
      console.error('GRN fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGRNs(); }, [fetchGRNs, refresh]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await grnApi.delete(deleteGRN._id);
      setDeleteGRN(null);
      fetchGRNs();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <>
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 14 }}>GRN List</div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
        ) : grns.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No GRNs found</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>GRN ID</th>
                  <th>PO Ref</th>
                  <th>Vendor</th>
                  <th>Ordered</th>
                  <th>Received</th>
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
        )}
      </div>

      {/* Delete Confirm */}
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
    </>
  );
}
