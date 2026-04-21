import { useState, useEffect } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import RFQFlowBadge from './RFQFlowBadge';
import Modal from '../../../../components/common/Modal';
import { rfqApi } from '../../../../api/rfqApi';
import { FaRegEdit } from 'react-icons/fa';
import { MdCompareArrows, MdDeleteOutline, MdVisibility } from 'react-icons/md';

export default function RFQList({ onCompare, refresh }) {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteRFQ, setDeleteRFQ] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewRFQ, setViewRFQ] = useState(null);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      console.log('🔵 Fetching RFQs from API...');
      const res = await rfqApi.getAll(params);
      console.log('✅ RFQ API Response:', res);
      setRfqs(res.data);
    } catch (e) {
      console.error('❌ RFQ Fetch Error:', e);
      alert('Failed to load RFQs: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRFQs(); }, [filterStatus, refresh]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await rfqApi.delete(deleteRFQ._id);
      setDeleteRFQ(null);
      fetchRFQs();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700 }}>Request for Quotations</div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Status</option>
            <option>Draft</option>
            <option>Sent</option>
            <option>Quoted</option>
            <option>Closed</option>
            <option>Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '900px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '11px 12px' }}>RFQ ID</th>
                  <th style={{ padding: '11px 12px' }}>Title</th>
                  <th style={{ padding: '11px 12px' }}>Vendors</th>
                  <th style={{ padding: '11px 12px' }}>Items</th>
                  <th style={{ padding: '11px 12px' }}>Due Date</th>
                  <th style={{ padding: '11px 12px' }}>Priority</th>
                  <th style={{ padding: '11px 12px' }}>Status</th>
                  <th style={{ padding: '11px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No RFQs found</td></tr>
                ) : rfqs.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap', padding: '12px' }}>{r.rfqId}</td>
                    <td style={{ fontWeight: 600, padding: '12px' }}>{r.title}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {r.vendors?.slice(0, 2).map(v => (
                          <span key={v._id} style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 10, color: '#475569', whiteSpace: 'nowrap' }}>
                            {v.companyName}
                          </span>
                        ))}
                        {r.vendors?.length > 2 && (
                          <span style={{ fontSize: 11, color: '#64748b' }}>+{r.vendors.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{r.items?.length || 0}</td>
                    <td style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap', padding: '12px' }}>
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, display: 'inline-block',
                        background: r.priority === 'Critical' ? '#fee2e2' : r.priority === 'Urgent' ? '#fef3c7' : '#f1f5f9',
                        color: r.priority === 'Critical' ? '#991b1b' : r.priority === 'Urgent' ? '#92400e' : '#475569',
                      }}>{r.priority}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }}
                          onClick={() => setViewRFQ(r)}><MdVisibility size={16} /></button>
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
        )}
      </div>

      {/* View RFQ Modal */}
      {viewRFQ && (
        <Modal open={!!viewRFQ} onClose={() => setViewRFQ(null)} title={`RFQ: ${viewRFQ.rfqId}`} size="lg"
          footer={<button className="btn btn-primary" onClick={() => setViewRFQ(null)}>Close</button>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>TITLE</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{viewRFQ.title}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>DUE DATE</div>
              <div style={{ fontSize: 14 }}>{viewRFQ.dueDate ? new Date(viewRFQ.dueDate).toLocaleDateString('en-IN') : '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>PRIORITY</div>
              <div style={{ fontSize: 14 }}>{viewRFQ.priority}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>STATUS</div>
              <div><StatusBadge status={viewRFQ.status} /></div>
            </div>
            {viewRFQ.linkedPR && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>LINKED PR</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{viewRFQ.linkedPR.prId} — {viewRFQ.linkedPR.department}</div>
              </div>
            )}
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Selected Vendors ({viewRFQ.vendors?.length || 0})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {viewRFQ.vendors?.map(v => (
              <div key={v._id} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1.5px solid var(--primary)', background: '#fdf5f5', color: 'var(--primary)' }}>
                {v.companyName}
              </div>
            ))}
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items ({viewRFQ.items?.length || 0})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>ITEM NAME</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>QTY</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>UNIT</th>
                </tr>
              </thead>
              <tbody>
                {viewRFQ.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ padding: '10px 12px' }}>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteRFQ} onClose={() => setDeleteRFQ(null)} title="Delete RFQ"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteRFQ(null)} disabled={deleting}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deleteRFQ?.rfqId}</strong>? This action cannot be undone.</p>
      </Modal>
    </>
  );
}
