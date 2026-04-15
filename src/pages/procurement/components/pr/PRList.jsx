import StatusBadge from '../../../../components/common/StatusBadge';
import PRApprovalBadge from './PRApprovalBadge';
import { prs } from '../data';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility } from 'react-icons/md';

export default function PRList() {
  return (
    <div className="card">
      <div style={{ fontWeight: 700, marginBottom: 14 }}>PR List</div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>PR ID</th>
              <th>Department</th>
              <th>Items</th>
              <th>Value</th>
              <th>Requested By</th>
              <th>Date</th>
              <th>Approval</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prs.map((p, i) => (
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
                    <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}>
                      <FaRegEdit size={15} />
                    </button>
                    <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }}>
                      <MdVisibility size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
