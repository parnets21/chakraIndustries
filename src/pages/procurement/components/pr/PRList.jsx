import { useState, useEffect } from 'react';
import StatusBadge from '../../../../components/common/StatusBadge';
import PRApprovalBadge from './PRApprovalBadge';
import { prApi } from '../../../../api/prApi';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility } from 'react-icons/md';

export default function PRList({ onEdit, onView, refresh }) {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

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

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
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
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PR ID</th>
                <th>Department</th>
                <th>Items</th>
                <th>Value</th>
                <th>Requested By</th>
                <th>Required By</th>
                <th>Priority</th>
                <th>Approval</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prs.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No records found</td></tr>
              ) : prs.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{p.prId}</td>
                  <td>{p.department}</td>
                  <td>{p.items?.length ?? 0}</td>
                  <td style={{ fontWeight: 700 }}>₹{Math.round(p.totalValue).toLocaleString()}</td>
                  <td>{p.requestedBy}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {p.requiredBy ? new Date(p.requiredBy).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                      background: p.priority === 'Critical' ? '#fee2e2' : p.priority === 'Urgent' ? '#fef3c7' : '#f1f5f9',
                      color: p.priority === 'Critical' ? '#991b1b' : p.priority === 'Urgent' ? '#92400e' : '#475569',
                    }}>{p.priority}</span>
                  </td>
                  <td><PRApprovalBadge status={p.status} /></td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }} onClick={() => onEdit?.(p)}>
                        <FaRegEdit size={15} />
                      </button>
                      <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }} onClick={() => onView?.(p)}>
                        <MdVisibility size={16} />
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
  );
}
