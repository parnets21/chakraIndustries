import StatusBadge from '../../../../components/common/StatusBadge';
import RFQFlowBadge from './RFQFlowBadge';
import { rfqDetails } from '../data';
import { FaRegEdit } from 'react-icons/fa';
import { MdCompareArrows } from 'react-icons/md';

export default function RFQList({ onCompare }) {
  return (
    <div className="card">
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>RFQ ID</th>
              <th>Title</th>
              <th>Vendors</th>
              <th>Due Date</th>
              <th>Flow</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rfqDetails.map((r, i) => (
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
                    <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}>
                      <FaRegEdit size={15} />
                    </button>
                    <button className="btn btn-sm" title="Compare Quotes"
                      style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 8px', border: '1px solid #bbf7d0' }}
                      onClick={() => onCompare(r)}>
                      <MdCompareArrows size={16} />
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
