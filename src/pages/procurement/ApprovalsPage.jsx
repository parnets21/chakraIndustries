import { PageHeader, KpiStrip, PageCard, PTable } from '../../components/common/PageShell';
import StatusBadge from '../../components/common/StatusBadge';
import { MdPendingActions, MdWarning, MdCheckCircle, MdAccessTime } from 'react-icons/md';

const pendingApprovals = [
  { id: 'PO-2024-089', type: 'Purchase Order',       amount: '₹4,82,000', requestedBy: 'Ravi Sharma',  dept: 'Procurement', age: '2d', level: 'L2 — Manager',  status: 'Pending'   },
  { id: 'PR-2024-034', type: 'Purchase Requisition', amount: '₹1,20,000', requestedBy: 'Priya Nair',   dept: 'Production',  age: '1d', level: 'L1 — HOD',      status: 'Pending'   },
  { id: 'RFQ-2024-012',type: 'RFQ',                  amount: '₹8,40,000', requestedBy: 'Amit Patel',   dept: 'Procurement', age: '3d', level: 'L3 — Director',  status: 'Pending'   },
  { id: 'PO-2024-085', type: 'Purchase Order',       amount: '₹2,10,000', requestedBy: 'Suresh Jain',  dept: 'Maintenance', age: '4d', level: 'L2 — Manager',  status: 'Escalated' },
];

export default function ApprovalsPage() {
  const escalated = pendingApprovals.filter(a => a.status === 'Escalated').length;
  const pending   = pendingApprovals.filter(a => a.status === 'Pending').length;
  const avgAge    = '2.5d';

  const kpis = [
    { label: 'Pending Approvals', value: pending,   icon: <MdPendingActions size={18} />, color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Escalated',         value: escalated, icon: <MdWarning size={18} />,        color: '#dc2626', color2: '#ef4444', glow: 'rgba(220,38,38,0.3)' },
    { label: 'Avg. Age',          value: avgAge,    icon: <MdAccessTime size={18} />,     color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Approved Today',    value: '12',      icon: <MdCheckCircle size={18} />,    color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
  ];

  const columns = [
    { key: 'id',          label: 'Doc ID',       render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{v}</span> },
    { key: 'type',        label: 'Type' },
    { key: 'amount',      label: 'Amount',       render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
    { key: 'requestedBy', label: 'Requested By' },
    { key: 'dept',        label: 'Dept' },
    { key: 'age',         label: 'Age',          render: (v, row) => <span style={{ fontWeight: 700, color: parseInt(v) > 2 ? '#ef4444' : '#f59e0b' }}>{v}</span> },
    { key: 'level',       label: 'Level' },
    { key: 'status',      label: 'Status',       render: v => <StatusBadge status={v} type={v === 'Escalated' ? 'danger' : 'warning'} /> },
    { key: 'actions',     label: 'Actions',      render: () => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={{
          padding: '5px 12px', fontSize: 12, borderRadius: 8,
          background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0',
          cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
        }}>✓ Approve</button>
        <button style={{
          padding: '5px 12px', fontSize: 12, borderRadius: 8,
          background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca',
          cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
        }}>✗ Reject</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Approval Dashboard" breadcrumb="Procurement › Approvals" />

      <KpiStrip kpis={kpis} />

      <PageCard>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          Pending Approvals
        </div>
        <PTable columns={columns} rows={pendingApprovals} emptyText="No pending approvals" />
      </PageCard>
    </div>
  );
}
