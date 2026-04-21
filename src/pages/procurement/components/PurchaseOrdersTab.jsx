import { useState, useEffect } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { poApi } from '../../../api/poApi';
import { vendorApi } from '../../../api/vendorApi';
import { rfqApi } from '../../../api/rfqApi';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';

export default function PurchaseOrdersTab({ showPOModal, setShowPOModal }) {
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewPO, setViewPO] = useState(null);
  const [deletePO, setDeletePO] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    vendor: '',
    linkedRFQ: '',
    deliveryDate: '',
    paymentTerms: 'Net 30',
    items: [{ name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }],
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await poApi.getAll(params);
      setPOs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await vendorApi.getAll({ status: 'Active' });
      setVendors(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRFQs = async () => {
    try {
      const res = await rfqApi.getAll({ status: 'Quoted' });
      setRFQs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchPOs(); }, [filterStatus]);
  useEffect(() => { 
    if (showPOModal) {
      fetchVendors();
      fetchRFQs();
    }
  }, [showPOModal]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await poApi.delete(deletePO._id);
      setDeletePO(null);
      fetchPOs();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => 
      sum + (parseFloat(item.qty) || 0) * (parseFloat(item.basePrice) || 0), 0
    );
    const gstTotal = formData.items.reduce((sum, item) => 
      sum + (parseFloat(item.qty) || 0) * (parseFloat(item.basePrice) || 0) * (parseFloat(item.gst) || 0) / 100, 0
    );
    return { subtotal, gstTotal, grandTotal: subtotal + gstTotal };
  };

  const handleSubmit = async () => {
    if (!formData.vendor) {
      alert('Please select a vendor');
      return;
    }
    if (formData.items.length === 0 || !formData.items[0].name) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      await poApi.create(formData);
      setShowPOModal(false);
      setFormData({
        vendor: '',
        linkedRFQ: '',
        deliveryDate: '',
        paymentTerms: 'Net 30',
        items: [{ name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }],
        remarks: ''
      });
      fetchPOs();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700 }}>Purchase Orders</div>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">All Status</option>
            <option>Draft</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Received</option>
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
                  <th style={{ padding: '11px 12px' }}>PO ID</th>
                  <th style={{ padding: '11px 12px' }}>Vendor</th>
                  <th style={{ padding: '11px 12px' }}>Items</th>
                  <th style={{ padding: '11px 12px' }}>Subtotal</th>
                  <th style={{ padding: '11px 12px' }}>GST</th>
                  <th style={{ padding: '11px 12px' }}>Grand Total</th>
                  <th style={{ padding: '11px 12px' }}>Date</th>
                  <th style={{ padding: '11px 12px' }}>Status</th>
                  <th style={{ padding: '11px 12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No purchase orders found</td></tr>
                ) : pos.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap', padding: '12px' }}>{p.poId}</td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>{p.vendor?.companyName || '—'}</td>
                    <td style={{ padding: '12px' }}>{p.items?.length || 0}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap', padding: '12px' }}>₹{Math.round(p.subtotal).toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>₹{Math.round(p.gstTotal).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary-dark)', whiteSpace: 'nowrap', padding: '12px' }}>₹{Math.round(p.grandTotal).toLocaleString()}</td>
                    <td style={{ color: '#64748b', fontSize: 12, whiteSpace: 'nowrap', padding: '12px' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ whiteSpace: 'nowrap', padding: '12px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-sm" title="View" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '6px 8px', minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewPO(p)}>
                          <MdVisibility size={16} />
                        </button>
                        <button className="btn btn-sm" title="Delete" style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 8px', minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setDeletePO(p)}>
                          <MdDeleteOutline size={16} />
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

      {/* Delete Confirm Modal */}
      <Modal open={!!deletePO} onClose={() => setDeletePO(null)} title="Delete Purchase Order"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeletePO(null)} disabled={deleting}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deletePO?.poId}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* View PO Modal */}
      <Modal open={!!viewPO} onClose={() => setViewPO(null)} title={`Purchase Order: ${viewPO?.poId}`} size="lg"
        footer={<button className="btn btn-primary" onClick={() => setViewPO(null)}>Close</button>}>
        {viewPO && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 20px', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>PO ID</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{viewPO.poId}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>VENDOR</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{viewPO.vendor?.companyName || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>STATUS</div>
                <div><StatusBadge status={viewPO.status} /></div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>DELIVERY DATE</div>
                <div style={{ fontSize: 14 }}>{viewPO.deliveryDate ? new Date(viewPO.deliveryDate).toLocaleDateString('en-IN') : '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>PAYMENT TERMS</div>
                <div style={{ fontSize: 14 }}>{viewPO.paymentTerms || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>CREATED ON</div>
                <div style={{ fontSize: 14 }}>{new Date(viewPO.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              {viewPO.linkedRFQ && (
                <div style={{ gridColumn: 'span 3' }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>LINKED RFQ</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{viewPO.linkedRFQ.rfqId} — {viewPO.linkedRFQ.title}</div>
                </div>
              )}
            </div>

            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Line Items ({viewPO.items?.length || 0})</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>ITEM NAME</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>QTY</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>UNIT</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>BASE PRICE</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>GST %</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewPO.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '10px 12px' }}>{item.unit}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>₹{parseFloat(item.basePrice).toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.gst}%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>₹{Math.round(item.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#F8FAFC' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>Subtotal:</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>₹{Math.round(viewPO.subtotal).toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#F8FAFC' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>GST Total:</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>₹{Math.round(viewPO.gstTotal).toLocaleString()}</td>
                  </tr>
                  <tr style={{ background: '#FEF2F2' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>Grand Total:</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#c0392b', fontSize: 16 }}>₹{Math.round(viewPO.grandTotal).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal open={showPOModal} onClose={() => setShowPOModal(false)} title="Create Purchase Order" size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowPOModal(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Creating...' : 'Create PO'}
            </button>
          </>
        }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Vendor *</label>
            <select className="form-select" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value })}>
              <option value="">Select vendor</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Linked RFQ (Optional)</label>
            <select className="form-select" value={formData.linkedRFQ} onChange={e => setFormData({ ...formData, linkedRFQ: e.target.value })}>
              <option value="">None</option>
              {rfqs.map(r => <option key={r._id} value={r._id}>{r.rfqId} — {r.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Date</label>
            <input type="date" className="form-input" value={formData.deliveryDate} onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select className="form-select" value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}>
              <option>Net 30</option>
              <option>Net 45</option>
              <option>Net 60</option>
              <option>Net 90</option>
              <option>Advance Payment</option>
              <option>COD</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Items</div>
          <button className="btn btn-sm btn-outline" onClick={handleAddItem}>+ Add Item</button>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>ITEM NAME</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>QTY</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>UNIT</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>BASE PRICE</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>GST %</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#64748B', fontSize: 11 }}>TOTAL</th>
                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#64748B', fontSize: 11 }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, i) => {
                const itemTotal = (parseFloat(item.qty) || 0) * (parseFloat(item.basePrice) || 0) * (1 + (parseFloat(item.gst) || 0) / 100);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="text" className="form-input" placeholder="Item name" value={item.name} 
                        onChange={e => handleItemChange(i, 'name', e.target.value)} style={{ minWidth: 150 }} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="number" className="form-input" value={item.qty} 
                        onChange={e => handleItemChange(i, 'qty', e.target.value)} style={{ width: 70, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <select className="form-select" value={item.unit} onChange={e => handleItemChange(i, 'unit', e.target.value)} style={{ width: 90 }}>
                        <option>Nos</option>
                        <option>Kg</option>
                        <option>Grams</option>
                        <option>Litre</option>
                        <option>ML</option>
                        <option>Metre</option>
                        <option>CM</option>
                        <option>Set</option>
                        <option>Box</option>
                        <option>Carton</option>
                        <option>Pcs</option>
                        <option>Dozen</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="number" className="form-input" value={item.basePrice} 
                        onChange={e => handleItemChange(i, 'basePrice', e.target.value)} style={{ width: 100, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <input type="number" className="form-input" value={item.gst} 
                        onChange={e => handleItemChange(i, 'gst', e.target.value)} style={{ width: 70, textAlign: 'right' }} />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>₹{Math.round(itemTotal).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {formData.items.length > 1 && (
                        <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }} 
                          onClick={() => handleRemoveItem(i)}>×</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginLeft: 'auto', maxWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600 }}>₹{Math.round(totals.subtotal).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>GST Total</span>
            <span style={{ fontWeight: 600 }}>₹{Math.round(totals.gstTotal).toLocaleString()}</span>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--primary-dark)' }}>
            <span>Grand Total</span>
            <span>₹{Math.round(totals.grandTotal).toLocaleString()}</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Remarks</label>
          <textarea className="form-input" rows={2} value={formData.remarks} 
            onChange={e => setFormData({ ...formData, remarks: e.target.value })} 
            placeholder="Additional notes or instructions..." />
        </div>
      </Modal>
    </>
  );
}
