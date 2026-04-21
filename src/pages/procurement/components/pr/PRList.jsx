import { useState, useEffect } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import PRApprovalBadge from './PRApprovalBadge';
import Modal from '../../../../components/common/Modal';
import { prApi } from '../../../../api/prApi';
import { FaRegEdit, FaRegTrashAlt } from 'react-icons/fa';
import { MdVisibility } from 'react-icons/md';

export default function PRList({ onEdit, onView, refresh }) {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewPR, setViewPR] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPRs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await prApi.getAll(params);
      setPrs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPRs(); }, [filterStatus, refresh]);

  const handleDelete = async (pr) => {
    setDeleting(true);
    try {
      await prApi.delete(pr._id);
      setDeleteConfirm(null);
      fetchPRs();
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
        <div style={{ fontWeight: 700 }}>Purchase Requisitions</div>
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Status</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Rejected</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={{ padding: '11px 12px' }}>PR ID</th>
                <th style={{ padding: '11px 12px' }}>Department</th>
                <th style={{ padding: '11px 12px' }}>Items</th>
                <th style={{ padding: '11px 12px' }}>Value</th>
                <th style={{ padding: '11px 12px' }}>Requested By</th>
                <th style={{ padding: '11px 12px' }}>Required By</th>
                <th style={{ padding: '11px 12px' }}>Priority</th>
                <th style={{ padding: '11px 12px' }}>Approval</th>
                <th style={{ padding: '11px 12px' }}>Status</th>
                <th style={{ padding: '11px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No records found</td></tr>
              ) : prs.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap', padding: '12px' }}>{p.prId}</td>
                  <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>{p.department}</td>
                  <td style={{ padding: '12px' }}>{p.items?.length ?? 0}</td>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap', padding: '12px' }}>₹{Math.round(p.totalValue).toLocaleString()}</td>
                  <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>{p.requestedBy}</td>
                  <td style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap', padding: '12px' }}>
                    {p.requiredBy ? new Date(p.requiredBy).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, display: 'inline-block',
                      background: p.priority === 'Critical' ? '#fee2e2' : p.priority === 'Urgent' ? '#fef3c7' : '#f1f5f9',
                      color: p.priority === 'Critical' ? '#991b1b' : p.priority === 'Urgent' ? '#92400e' : '#475569',
                    }}>{p.priority}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', padding: '12px' }}><PRApprovalBadge status={p.status} /></td>
                  <td style={{ whiteSpace: 'nowrap', padding: '12px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '6px 8px', minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewPR(p)}>
                        <MdVisibility size={16} />
                      </button>
                      <button className="btn btn-sm" title="Delete" style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 8px', minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeleteConfirm(p)}>
                        <FaRegTrashAlt size={14} />
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

    {/* View PR Modal */}
    {viewPR && (
      <Modal open={!!viewPR} onClose={() => setViewPR(null)} title={`Purchase Requisition: ${viewPR.prId}`} size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              Status: <span style={{ fontWeight: 600, color: viewPR.status === 'Approved' ? '#047857' : viewPR.status === 'Rejected' ? '#DC2626' : '#F59E0B' }}>{viewPR.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: 6, fontWeight: 500 }} onClick={() => setViewPR(null)}>Close</button>
              <button className="btn btn-primary" style={{ background: '#0F172A', color: 'white', padding: '8px 16px', borderRadius: 6, fontWeight: 500 }} onClick={() => { onEdit?.(viewPR); setViewPR(null); }}>Edit PR</button>
            </div>
          </div>
        }>
        
        <style>{`
          .pr-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 20px; }
          .pr-full-width { grid-column: span 3; }
          .pr-field { display: flex; flex-direction: column; gap: 3px; }
          .pr-label { font-size: 11px; font-weight: 500; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; }
          .pr-value { font-size: 14px; font-weight: 400; color: #1E293B; }
          .pr-section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #E4E7EC; }
          .pr-section-header h3 { font-size: 13px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px; margin: 0; }
        `}</style>

        {/* PR Details */}
        <div style={{ marginBottom: 20 }}>
          <div className="pr-section-header">
            <h3>Requisition Details</h3>
          </div>
          <div className="pr-details">
            <div className="pr-field">
              <div className="pr-label">Department</div>
              <div className="pr-value">{viewPR.department}</div>
            </div>
            <div className="pr-field">
              <div className="pr-label">Requested By</div>
              <div className="pr-value">{viewPR.requestedBy}</div>
            </div>
            <div className="pr-field">
              <div className="pr-label">Required By</div>
              <div className="pr-value">{viewPR.requiredBy ? new Date(viewPR.requiredBy).toLocaleDateString('en-IN') : '—'}</div>
            </div>
            <div className="pr-field">
              <div className="pr-label">Priority</div>
              <div className="pr-value">
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, display: 'inline-block',
                  background: viewPR.priority === 'Critical' ? '#FEE2E2' : viewPR.priority === 'Urgent' ? '#FEF3C7' : '#F1F5F9',
                  color: viewPR.priority === 'Critical' ? '#991B1B' : viewPR.priority === 'Urgent' ? '#92400E' : '#475569',
                }}>{viewPR.priority}</span>
              </div>
            </div>
            <div className="pr-field">
              <div className="pr-label">Cost Center</div>
              <div className="pr-value">{viewPR.costCenter || '—'}</div>
            </div>
            <div className="pr-field">
              <div className="pr-label">Total Value</div>
              <div className="pr-value" style={{ fontWeight: 700, color: '#c0392b', fontSize: 16 }}>₹{Math.round(viewPR.totalValue).toLocaleString()}</div>
            </div>
            {viewPR.remarks && (
              <div className="pr-field pr-full-width">
                <div className="pr-label">Remarks</div>
                <div className="pr-value">{viewPR.remarks}</div>
              </div>
            )}
          </div>
        </div>

        {/* Items List */}
        <div>
          <div className="pr-section-header">
            <h3>Items ({viewPR.items?.length || 0})</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>ITEM NAME</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>QTY</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>UNIT</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>EST. PRICE</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {(viewPR.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ padding: '10px 12px' }}>{item.unit}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{parseFloat(item.estimatedPrice || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>₹{((parseFloat(item.qty) || 0) * (parseFloat(item.estimatedPrice) || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F8FAFC', fontWeight: 700 }}>
                  <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right' }}>Grand Total:</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#c0392b', fontSize: 15 }}>₹{Math.round(viewPR.totalValue).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Modal>
    )}

    {/* Delete Confirmation Modal */}
    {deleteConfirm && (
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Purchase Requisition" size="md"
        footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn" style={{ background: 'transparent', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: 6, fontWeight: 500 }} onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
            <button className="btn" style={{ background: '#DC2626', color: 'white', padding: '8px 16px', borderRadius: 6, fontWeight: 500 }} onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete PR'}
            </button>
          </div>
        }>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#1E293B' }}>Are you sure you want to delete this PR?</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
            This action cannot be undone. The following PR will be permanently deleted:
          </div>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '16px', textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: 13 }}>
              <div style={{ color: '#991B1B', fontWeight: 600 }}>PR ID:</div>
              <div style={{ color: '#1E293B', fontWeight: 700 }}>{deleteConfirm.prId}</div>
              <div style={{ color: '#991B1B', fontWeight: 600 }}>Department:</div>
              <div style={{ color: '#1E293B' }}>{deleteConfirm.department}</div>
              <div style={{ color: '#991B1B', fontWeight: 600 }}>Total Value:</div>
              <div style={{ color: '#1E293B', fontWeight: 700 }}>₹{Math.round(deleteConfirm.totalValue).toLocaleString()}</div>
              <div style={{ color: '#991B1B', fontWeight: 600 }}>Items:</div>
              <div style={{ color: '#1E293B' }}>{deleteConfirm.items?.length || 0} item(s)</div>
            </div>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}
