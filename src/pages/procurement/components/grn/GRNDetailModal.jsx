import Modal from '../../../../components/common/Modal';
import StatusBadge from '../../../../components/common/StatusBadge';

export default function GRNDetailModal({ open, onClose, grn }) {
  if (!grn) return null;

  return (
    <Modal open={open} onClose={onClose} title={`GRN Details — ${grn.id}`} size="lg"
      footer={<button className="btn btn-outline" onClick={onClose}>Close</button>}>

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          ['PO Reference', grn.poRef],
          ['Vendor', grn.vendor],
          ['Warehouse', grn.warehouse],
          ['Received By', grn.receivedBy],
          ['Receipt Date', grn.receivedDate],
          ['GST %', grn.gst],
        ].map(([label, value], i) => (
          <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Items Table */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Item-wise Receipt</div>
      <div className="table-container">
        <table>
          <thead>
            <tr><th>Item</th><th>Ordered</th><th>Received</th><th>Accepted</th><th>Rejected</th><th>Result</th></tr>
          </thead>
          <tbody>
            {grn.items.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{item.name}</td>
                <td>{item.ordered}</td>
                <td>{item.received}</td>
                <td style={{ color: '#16a34a', fontWeight: 600 }}>{item.accepted}</td>
                <td style={{ color: item.rejected > 0 ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>{item.rejected}</td>
                <td>
                  <StatusBadge status={item.rejected > 0 ? 'Partial' : item.received < item.ordered ? 'Partial' : 'Passed'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
        {[
          ['Total Ordered', grn.items.reduce((s, i) => s + i.ordered, 0), '#1c2833'],
          ['Total Received', grn.items.reduce((s, i) => s + i.received, 0), '#16a34a'],
          ['Total Accepted', grn.items.reduce((s, i) => s + i.accepted, 0), '#2563eb'],
          ['Total Rejected', grn.items.reduce((s, i) => s + i.rejected, 0), '#dc2626'],
        ].map(([label, val, color]) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: 16, color }}>{val}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
