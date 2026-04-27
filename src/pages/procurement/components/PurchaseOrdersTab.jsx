import { useState, useEffect } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import BulkPOUpload from './BulkPOUpload';
import { poApi } from '../../../api/poApi';
import { vendorApi } from '../../../api/vendorApi';
import { rfqApi } from '../../../api/rfqApi';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';
import { FaEdit } from 'react-icons/fa';

const EMPTY_FORM = {
  vendor: '', linkedRFQ: '', deliveryDate: '',
  paymentTerms: 'Net 30', remarks: '',
  items: [{ name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }],
};

export default function PurchaseOrdersTab({ showPOModal, setShowPOModal, onSaved }) {
  const [pos, setPOs]               = useState([]);
  const [vendors, setVendors]       = useState([]);
  const [rfqs, setRFQs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewPO, setViewPO] = useState(null);
  const [editPO, setEditPO] = useState(null);
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
  const [formError, setFormError] = useState('');

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      console.log('📦 Fetching POs with params:', params);
      const res = await poApi.getAll(params);
      console.log('✅ POs fetched:', res.data);
      setPOs(res.data || []);
    } catch (e) {
      console.error('❌ Error fetching POs:', e);
      setPOs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      console.log('👥 Fetching vendors...');
      const res = await vendorApi.getAll({ status: 'Active' });
      console.log('✅ Vendors fetched:', res.data);
      setVendors(res.data || []);
    } catch (e) {
      console.error('❌ Error fetching vendors:', e);
      setVendors([]);
    }
  };

  const fetchRFQs = async () => {
    try {
      const res = await rfqApi.getAll({ status: 'Quoted' });
      console.log('📋 RFQs fetched:', res.data);
      setRFQs(res.data);
    } catch (e) {
      console.error('❌ Error fetching RFQs:', e);
    }
  };

  // Get RFQs for selected vendor
  const getVendorRFQs = () => {
    if (!formData.vendor) return [];
    
    const selectedVendor = vendors.find(v => v._id === formData.vendor);
    if (!selectedVendor) return [];
    
    console.log('🔍 Selected Vendor:', selectedVendor);
    console.log('📋 All RFQs:', rfqs);
    
    const filtered = rfqs.filter(rfq => {
      console.log('Checking RFQ:', rfq.rfqId, 'Vendors:', rfq.vendors);
      
      if (!rfq.vendors || rfq.vendors.length === 0) {
        console.log('  ❌ No vendors in RFQ');
        return false;
      }
      
      // Check if vendor ID matches
      const hasVendorId = rfq.vendors.some(v => {
        const vendorId = typeof v === 'object' ? v._id : v;
        const matches = vendorId === formData.vendor;
        console.log(`  Checking ID: ${vendorId} === ${formData.vendor} ? ${matches}`);
        return matches;
      });
      
      // Check if vendor name matches
      const hasVendorName = rfq.vendors.some(v => {
        const vendorName = typeof v === 'object' ? v.companyName : v;
        const matches = vendorName === selectedVendor.companyName;
        console.log(`  Checking Name: ${vendorName} === ${selectedVendor.companyName} ? ${matches}`);
        return matches;
      });
      
      const result = hasVendorId || hasVendorName;
      console.log(`  Result: ${result}`);
      return result;
    });
    
    console.log(`✅ Vendor: ${selectedVendor.companyName}, RFQs found: ${filtered.length}`, filtered);
    return filtered;
  };

  // Auto-populate items when RFQ is selected
  const handleRFQSelect = (rfqId) => {
    setFormData(prev => ({ ...prev, linkedRFQ: rfqId }));
    
    if (rfqId) {
      const selectedRFQ = rfqs.find(r => r._id === rfqId);
      if (selectedRFQ && selectedRFQ.quotations) {
        // Find quotation for this vendor
        const vendorQuotation = selectedRFQ.quotations.find(q => 
          q.vendor._id === formData.vendor || q.vendor === formData.vendor
        );
        
        if (vendorQuotation && vendorQuotation.items) {
          const newItems = vendorQuotation.items.map(item => ({
            name: item.name,
            qty: item.qty,
            unit: item.unit,
            basePrice: item.unitPrice || 0,
            gst: 18
          }));
          setFormData(prev => ({ ...prev, items: newItems }));
        }
      }
    }
  };

  useEffect(() => { fetchPOs(); }, [filterStatus]);

  useEffect(() => {
    if (showPOModal) {
      setFormData(EMPTY_FORM);
      setFormError('');
      Promise.all([
        vendorApi.getAll({ status: 'Active' }),
        rfqApi.getAll({ status: 'Quoted' }),
        rfqApi.getAll({ status: 'Closed' }),
      ]).then(([vRes, quotedRes, closedRes]) => {
        setVendors(vRes.data || []);
        setRFQs([...(quotedRes.data || []), ...(closedRes.data || [])]);
      }).catch(console.error);
    }
  }, [showPOModal]);

  // When vendor changes — find matching RFQ quotation and auto-fill items
  const handleVendorChange = (vendorId) => {
    setFormData(prev => {
      // If an RFQ is already selected, find this vendor's quotation
      if (prev.linkedRFQ) {
        const rfq = rfqs.find(r => r._id === prev.linkedRFQ);
        const quotation = rfq?.quotations?.find(q => (q.vendor?._id || q.vendor) === vendorId);
        if (quotation?.items?.length) {
          return {
            ...prev,
            vendor: vendorId,
            items: quotation.items.map(it => ({
              name: it.name, qty: it.qty, unit: it.unit || 'Nos',
              basePrice: it.unitPrice, gst: 18,
            })),
          };
        }
      }
      return { ...prev, vendor: vendorId };
    });
  };

  // When RFQ changes — auto-select vendor + fill items from that vendor's quotation
  const handleRFQChange = (rfqId) => {
    if (!rfqId) { setFormData(prev => ({ ...prev, linkedRFQ: '', items: EMPTY_FORM.items })); return; }
    const rfq = rfqs.find(r => r._id === rfqId);
    if (!rfq) { setFormData(prev => ({ ...prev, linkedRFQ: rfqId })); return; }

    // Find quotation for currently selected vendor, or pick the best (lowest total)
    let quotation = null;
    if (formData.vendor) {
      quotation = rfq.quotations?.find(q => (q.vendor?._id || q.vendor) === formData.vendor);
    }
    if (!quotation && rfq.quotations?.length) {
      quotation = rfq.quotations.reduce((best, q) =>
        (q.totalAmount || 0) < (best.totalAmount || Infinity) ? q : best
      , rfq.quotations[0]);
    }

    const vendorId = quotation ? (quotation.vendor?._id || quotation.vendor) : (rfq.vendors?.[0]?._id || '');

    setFormData(prev => ({
      ...prev,
      linkedRFQ: rfqId,
      vendor: vendorId || prev.vendor,
      items: quotation?.items?.length
        ? quotation.items.map(it => ({
            name: it.name, qty: it.qty, unit: it.unit || 'Nos',
            basePrice: it.unitPrice, gst: 18,
          }))
        : rfq.items?.map(it => ({ name: it.name, qty: it.qty, unit: it.unit || 'Nos', basePrice: 0, gst: 18 }))
          || EMPTY_FORM.items,
    }));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await poApi.delete(deletePO._id);
      setDeletePO(null);
      fetchPOs();
    } catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  };

  const handleEdit = (po) => {
    setFormData({
      vendor: po.vendor?._id || '',
      linkedRFQ: po.linkedRFQ?._id || '',
      deliveryDate: po.deliveryDate ? po.deliveryDate.split('T')[0] : '',
      paymentTerms: po.paymentTerms || 'Net 30',
      items: po.items || [{ name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }],
      remarks: po.remarks || ''
    });
    setEditPO(po._id);
    setShowPOModal(true);
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }]
    }));
  };

  const calcTotals = () => {
    const subtotal  = formData.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.basePrice) || 0), 0);
    const gstTotal  = formData.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.basePrice) || 0) * (parseFloat(it.gst) || 0) / 100, 0);
    return { subtotal, gstTotal, grandTotal: subtotal + gstTotal };
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!formData.vendor) { setFormError('Please select a vendor.'); return; }
    if (!formData.items[0]?.name) { setFormError('Add at least one item.'); return; }
    setSaving(true);
    try {
      // Calculate totals for each item
      const items = formData.items.map(item => ({
        name: item.name,
        qty: parseFloat(item.qty) || 0,
        unit: item.unit,
        basePrice: parseFloat(item.basePrice) || 0,
        gst: parseFloat(item.gst) || 18,
        total: (parseFloat(item.qty) || 0) * (parseFloat(item.basePrice) || 0) * (1 + (parseFloat(item.gst) || 18) / 100)
      }));

      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.basePrice), 0);
      const gstTotal = items.reduce((sum, item) => sum + (item.qty * item.basePrice * item.gst / 100), 0);
      const grandTotal = subtotal + gstTotal;

      const payload = {
        vendor: formData.vendor,
        linkedRFQ: formData.linkedRFQ || null,
        deliveryDate: formData.deliveryDate || null,
        paymentTerms: formData.paymentTerms,
        items,
        subtotal,
        gstTotal,
        grandTotal,
        remarks: formData.remarks
      };

      console.log('📤 Sending PO payload:', payload);
      
      if (editPO) {
        // Update existing PO
        await poApi.update(editPO, payload);
        console.log('✅ PO updated successfully');
        alert('✓ Purchase Order updated successfully!');
      } else {
        // Create new PO
        await poApi.create(payload);
        console.log('✅ PO created successfully');
        alert('✓ Purchase Order created successfully!');
      }
      
      setShowPOModal(false);
      setEditPO(null);
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
      console.error('❌ Error saving PO:', e);
      alert(`❌ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const totals = calcTotals();

  return (
    <>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 700 }}>Purchase Orders</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <BulkPOUpload onSuccess={fetchPOs} />
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="">All Status</option>
              <option>Draft</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Received</option>
              <option>Cancelled</option>
            </select>
          </div>
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
                        <button className="btn btn-sm" title="Edit" style={{ background: '#fef3c7', color: '#92400e', padding: '6px 8px', minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleEdit(p)}>
                          <FaEdit size={16} />
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

      {/* Create/Edit PO Modal */}
      <Modal open={showPOModal} onClose={() => { setShowPOModal(false); setEditPO(null); }} title={editPO ? 'Edit Purchase Order' : 'Create Purchase Order'} size="lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowPOModal(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? (editPO ? 'Updating...' : 'Creating...') : (editPO ? 'Update PO' : 'Create PO')}
            </button>
          </>
        }>

        {formError && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
            {formError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label">Linked RFQ (auto-fills items)</label>
            <select className="form-select" value={formData.linkedRFQ} onChange={e => handleRFQChange(e.target.value)}>
              <option value="">— None —</option>
              {rfqs.map(r => <option key={r._id} value={r._id}>{r.rfqId} — {r.quotations?.length || 0} quote(s)</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Vendor *</label>
            <select className="form-select" value={formData.vendor} onChange={e => setFormData({ ...formData, vendor: e.target.value, linkedRFQ: '' })}>
              <option value="">Select vendor</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Linked RFQ (Optional)</label>
            <select className="form-select" value={formData.linkedRFQ} onChange={e => handleRFQSelect(e.target.value)} disabled={!formData.vendor}>
              <option value="">None</option>
              {getVendorRFQs().map(r => <option key={r._id} value={r._id}>{r.rfqId} — {r.title}</option>)}
            </select>
            {!formData.vendor && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Select a vendor first</div>}
            {formData.vendor && getVendorRFQs().length === 0 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>No RFQs available for this vendor</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Delivery Date</label>
            <input type="date" className="form-input" value={formData.deliveryDate} onChange={e => setFormData(p => ({ ...p, deliveryDate: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <select className="form-select" value={formData.paymentTerms} onChange={e => setFormData(p => ({ ...p, paymentTerms: e.target.value }))}>
              <option>Net 30</option><option>Net 45</option><option>Net 60</option>
              <option>Net 90</option><option>Advance Payment</option><option>COD</option>
            </select>
          </div>
        </div>

        {/* Vendor Details Card */}
        {formData.vendor && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 12 }}>👤 VENDOR DETAILS</div>
            {vendors.find(v => v._id === formData.vendor) && (() => {
              const vendor = vendors.find(v => v._id === formData.vendor);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>COMPANY</div>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{vendor.companyName || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>CONTACT PERSON</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.contactPerson || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>PHONE</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>EMAIL</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.email || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>CITY</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.city || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>PAYMENT TERMS</div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{vendor.paymentTerms || 'N/A'}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* RFQ Details Card */}
        {formData.linkedRFQ && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 12 }}>📋 LINKED RFQ DETAILS</div>
            {rfqs.find(r => r._id === formData.linkedRFQ) && (() => {
              const rfq = rfqs.find(r => r._id === formData.linkedRFQ);
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 13, marginBottom: 12 }}>
                    <div>
                      <div style={{ color: '#1e40af', fontSize: 11, marginBottom: 4, opacity: 0.7, fontWeight: 600 }}>RFQ ID</div>
                      <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 14 }}>{rfq.rfqId || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#1e40af', fontSize: 11, marginBottom: 4, opacity: 0.7, fontWeight: 600 }}>TITLE</div>
                      <div style={{ fontWeight: 600, color: '#1e40af' }}>{rfq.title || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#1e40af', fontSize: 11, marginBottom: 4, opacity: 0.7, fontWeight: 600 }}>DUE DATE</div>
                      <div style={{ fontWeight: 600, color: '#1e40af' }}>{rfq.dueDate ? new Date(rfq.dueDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                    </div>
                  </div>
                  <div style={{ background: '#dbeafe', borderRadius: 8, padding: 10, marginTop: 10 }}>
                    <div style={{ color: '#1e40af', fontSize: 11, marginBottom: 6, opacity: 0.7, fontWeight: 600 }}>📦 ITEMS IN RFQ</div>
                    <div style={{ fontSize: 12, color: '#1e40af' }}>
                      {rfq.items && rfq.items.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                          {rfq.items.map((item, idx) => (
                            <div key={idx} style={{ background: '#fff', padding: 8, borderRadius: 6, borderLeft: '3px solid #1e40af' }}>
                              <div style={{ fontWeight: 600, color: '#1e40af', fontSize: 12 }}>{item.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Qty: {item.qty} {item.unit}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#64748b' }}>No items in this RFQ</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Items</div>
          <button className="btn btn-sm btn-outline" onClick={() => setFormData(p => ({ ...p, items: [...p.items, { name: '', qty: 1, unit: 'Nos', basePrice: 0, gst: 18 }] }))}>+ Add Item</button>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['ITEM NAME','QTY','UNIT','BASE PRICE','GST %','TOTAL',''].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'TOTAL' || h === 'QTY' || h === 'BASE PRICE' || h === 'GST %' ? 'right' : 'left', fontWeight: 600, color: '#64748B', fontSize: 11 }}>{h}</th>
                ))}
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
                        {['Nos','Kg','Grams','Litre','ML','Metre','CM','Set','Box','Carton','Pcs','Dozen'].map(u => <option key={u}>{u}</option>)}
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
                          onClick={() => setFormData(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}>×</button>
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
            <span>Subtotal</span><span style={{ fontWeight: 600 }}>₹{Math.round(totals.subtotal).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span>GST Total</span><span style={{ fontWeight: 600 }}>₹{Math.round(totals.gstTotal).toLocaleString()}</span>
          </div>
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#c0392b' }}>
            <span>Grand Total</span><span>₹{Math.round(totals.grandTotal).toLocaleString()}</span>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Remarks</label>
          <textarea className="form-input" rows={2} value={formData.remarks}
            onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))}
            placeholder="Additional notes..." />
        </div>
      </Modal>
    </>
  );
}
