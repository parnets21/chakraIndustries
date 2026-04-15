const typeMap = {
  active: 'success', approved: 'success', completed: 'success', delivered: 'success', passed: 'success', received: 'success',
  pending: 'warning', 'in-progress': 'warning', processing: 'warning', partial: 'warning',
  rejected: 'danger', cancelled: 'danger', failed: 'danger', overdue: 'danger', critical: 'danger',
  draft: 'gray', inactive: 'gray', closed: 'gray',
  shipped: 'info', transit: 'info', ordered: 'info', open: 'info',
  oem: 'purple', custom: 'purple',
};

export default function StatusBadge({ status, type }) {
  const cls = type || typeMap[status?.toLowerCase()] || 'gray';
  return <span className={`status-badge ${cls}`}>{status}</span>;
}
