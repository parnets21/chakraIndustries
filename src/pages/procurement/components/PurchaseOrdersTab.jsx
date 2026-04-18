import { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import DataTable from '../../../components/tables/DataTable';
import { pos, poItems, vendors } from './data';
import { FaRegEdit } from 'react-icons/fa';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';

export default function PurchaseOrdersTab({ showPOModal, setShowPOModal }) {
  const [items, setItems]       = useState(pos);
  const [viewPO, setViewPO]     = useState(null);
  const [editPO, setEditPO]     = useState(null);
  const [deletePO, setDeletePO] = useState(null);

  const confirmDelete = () => {
    setItems(prev => prev.filter(p => p.id !== deletePO.id));
    setDeletePO(null);
  };

  const subtotal   = poItems.reduce((s, i) => s + i.qty * i.basePrice, 0);
  const gstTotal   = poItems.reduce((s, i) => s + (i.qty * i.basePrice * i.gst / 100), 0);
  const grandTotal = subtotal + gstTotal;

  return (
    <>
      <div className="card">
        <DataTable
          columns={[
            { key: 'id',       label: 'PO ID',       render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
            { key: 'vendor',   label: 'Vendor' },
            { key: 'items',    label: 'Items' },
            { key: 'subtotal', label: 'Subtotal' },
            { key: 'gst',      label: 'GST' },
            { key: 'total',    label: 'Grand Total',  render: v => <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{v}</span> },
            { key: 'date',     label: 'Date' },
            { key: 'status',   label: 'Status',       render: v => <StatusBadge status={v} /> },
            { key: 'actions',  label: 'Actions',      render: (_, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                  onClick={() => setEditPO(row)}><FaRegEdit size={15} /></button>
                <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }}
                  onClick={() => setViewPO(row)}><MdVisibility size={16} /></button>
                <button className="btn btn-sm" title="Delete" style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }}
                  onClick={() => setDeletePO(row)}><MdDeleteOutline size={16} /></button>
              </div>
            )},
          ]}
          data={items}
        />
      </div>

      {/* Delete Confirm Modal */}
      <Modal open={!!deletePO} onClose={() => setDeletePO(null)} title="Delete Purchase Order"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeletePO(null)}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={confirmDelete}>Delete</button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deletePO?.id}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* View PO Modal */}
      <Modal open={!!viewPO} onClose={() => setViewPO(null)} title={`PO Details — ${viewPO?.id}`} size="lg"
        footer={<button className="btn btn-outline" onClick={() => setViewPO(null)}>Close</button>}>
        {viewPO && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                ['PO ID', viewPO.id],
                ['Vendor', viewPO.vendor],
                ['Date', viewPO.date],
                ['Items', viewPO.items],
                ['Subtotal', viewPO.subtotal],
                ['GST', viewPO.gst],
                ['Grand Total', viewPO.total],
                ['Status', viewPO.status],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Line Items</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Base Price (₹)</th><th>GST %</th><th>Total (₹)</th></tr></thead>
                <tbody>
                  {poItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{item.item}</td>
                      <td>{item.qty}</td>
                      <td>₹{item.basePrice.toLocaleString()}</td>
                      <td>{item.gst}%</td>
                      <td style={{ fontWeight: 700 }}>₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      {/* Edit PO Modal */}
      <Modal open={!!editPO} onClose={() => setEditPO(null)} title={`Edit PO — ${editPO?.id}`} size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditPO(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setEditPO(null)}>Save Changes</button>
          </>
        }>
        {editPO && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group"><label className="form-label">Vendor</label>
              <select className="form-select" defaultValue={editPO.vendor}>
                {vendors.map(v => <option key={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Date</label>
              <input type="date" className="form-input" defaultValue={editPO.date} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" defaultValue={editPO.status}>
                <option>Pending</option><option>Approved</option><option>Received</option><option>Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Create PO Modal */}
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
