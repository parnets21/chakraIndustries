import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import DataTable from '../../../components/tables/DataTable';
import { pos, poItems, vendors } from './data';

export default function PurchaseOrdersTab({ showPOModal, setShowPOModal }) {
  const subtotal   = poItems.reduce((s, i) => s + i.qty * i.basePrice, 0);
  const gstTotal   = poItems.reduce((s, i) => s + (i.qty * i.basePrice * i.gst / 100), 0);
  const grandTotal = subtotal + gstTotal;

  return (
    <>
      <div className="card">
        <DataTable
          columns={[
            { key: 'id', label: 'PO ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
            { key: 'vendor', label: 'Vendor' },
            { key: 'items', label: 'Items' },
            { key: 'subtotal', label: 'Subtotal' },
            { key: 'gst', label: 'GST' },
            { key: 'total', label: 'Grand Total', render: v => <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{v}</span> },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
          ]}
          data={pos}
        />
      </div>

      <Modal open={showPOModal} onClose={() => setShowPOModal(false)} title="Create Purchase Order" size="lg"
        footer={<><button className="btn btn-outline" onClick={() => setShowPOModal(false)}>Cancel</button><button className="btn btn-primary">Create PO</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="form-group"><label className="form-label">Vendor *</label>
            <select className="form-select">{vendors.map(v => <option key={v.id}>{v.name}</option>)}</select>
          </div>
          <div className="form-group"><label className="form-label">Delivery Date</label><input type="date" className="form-input" /></div>
        </div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>Items</div>
        <div className="table-container" style={{ marginBottom: 16 }}>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Base Price (₹)</th><th>GST %</th><th>Total (₹)</th></tr></thead>
            <tbody>
              {poItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{item.item}</td>
                  <td><input type="number" className="form-input" style={{ width: 70 }} defaultValue={item.qty} /></td>
                  <td><input type="number" className="form-input" style={{ width: 90 }} defaultValue={item.basePrice} /></td>
                  <td>{item.gst}%</td>
                  <td style={{ fontWeight: 700 }}>₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginLeft: 'auto', maxWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span>Subtotal</span><span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span>GST (18%)</span><span style={{ fontWeight: 600 }}>₹{Math.round(gstTotal).toLocaleString()}</span></div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--primary-dark)' }}><span>Grand Total</span><span>₹{Math.round(grandTotal).toLocaleString()}</span></div>
        </div>
      </Modal>
    </>
  );
}
