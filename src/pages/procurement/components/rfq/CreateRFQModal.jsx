import { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal';
import { vendorApi } from '../../../../api/vendorApi';
import { prApi } from '../../../../api/prApi';
import { rfqApi } from '../../../../api/rfqApi';
import { useAuth } from '../../../../auth/AuthContext';
import { MdAttachFile, MdClose } from 'react-icons/md';

const emptyItem = { sku: '', name: '', qty: '', unit: 'Nos', basePrice: '', gst: 18, lastPrice: '', remarks: '' };

// Default units - can be made dynamic later
const DEFAULT_UNITS = ['Nos', 'Kg', 'Grams', 'Litre', 'ML', 'Metre', 'CM', 'Set', 'Box', 'Carton', 'Pcs', 'Dozen'];

export default function CreateRFQModal({ open, onClose, onSaved }) {
  const { user } = useAuth();
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [vendors, setVendors] = useState([]);
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [form, setForm] = useState({
    title: '',
    linkedPR: '',
    dueDate: '',
    priority: 'Normal',
    remarks: '',
    termsConditions: '',
    status: 'Draft', // Draft or Sent
  });

  // Load vendors and PRs when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, prsRes] = await Promise.all([
        vendorApi.getAll({ status: 'Active' }),
        prApi.getAll({ status: 'Pending' })
      ]);
      setVendors(vendorsRes.data);
      setPrs(prsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleVendor = (vendorId) =>
    setSelectedVendors(prev =>
      prev.includes(vendorId) ? prev.filter(v => v !== vendorId) : [...prev, vendorId]
    );

  const updateItem = (i, field, value) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleAttachmentAdd = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files.map(f => ({ file: f, name: f.name, size: f.size }))]);
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (asDraft = false) => {
    if (!form.title.trim()) {
      alert('Please enter RFQ title');
      return;
    }
    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor');
      return;
    }
    if (!form.dueDate) {
      alert('Please select due date');
      return;
    }
    if (items.some(item => !item.name.trim() || !item.qty)) {
      alert('Please fill all item details');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        linkedPR: form.linkedPR || null,
        vendors: selectedVendors,
        items: items.map(item => ({
          sku: item.sku.trim() || null,
          name: item.name.trim(),
          qty: parseFloat(item.qty),
          unit: item.unit,
          basePrice: item.basePrice ? parseFloat(item.basePrice) : null,
          gst: parseFloat(item.gst) || 18,
          lastPrice: item.lastPrice ? parseFloat(item.lastPrice) : null,
          remarks: item.remarks.trim() || '',
        })),
        dueDate: form.dueDate,
        priority: form.priority,
        remarks: form.remarks.trim() || '',
        termsConditions: form.termsConditions.trim() || '',
        createdBy: user?.name || user?.email || 'Unknown',
        status: asDraft ? 'Draft' : 'Sent',
        attachments: attachments.map(a => a.name),
      };

      await rfqApi.create(payload);
      onSaved?.();
      onClose();
      
      // Reset form
      setForm({ title: '', linkedPR: '', dueDate: '', priority: 'Normal', remarks: '', termsConditions: '', status: 'Draft' });
      setSelectedVendors([]);
      setItems([{ ...emptyItem }]);
      setAttachments([]);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create RFQ" size="lg"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-outline" onClick={() => handleSubmit(true)} disabled={saving || selectedVendors.length === 0 || items.length === 0}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={saving || selectedVendors.length === 0 || items.length === 0}>
            {saving ? 'Sending...' : 'Send RFQ'}
          </button>
        </>
      }>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading vendors and PRs...</div>
      ) : (
        <>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">RFQ Title *</label>
              <input className="form-input" placeholder="e.g. Raw Material Supply Q3" value={form.title} onChange={e => updateForm('title', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Link PR (optional)</label>
              <select className="form-select" value={form.linkedPR} onChange={e => updateForm('linkedPR', e.target.value)}>
                <option value="">— None —</option>
                {prs.map(p => <option key={p._id} value={p._id}>{p.prId} — {p.department}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => updateForm('dueDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => updateForm('priority', e.target.value)}>
                <option>Normal</option><option>Urgent</option><option>Critical</option>
              </select>
            </div>
          </div>

          {/* Vendor Selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Select Vendors *</div>
            {vendors.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
                No active vendors found. Please add vendors first.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {vendors.map(v => (
                    <div key={v._id} onClick={() => toggleVendor(v._id)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${selectedVendors.includes(v._id) ? 'var(--primary)' : 'var(--border)'}`,
                        background: selectedVendors.includes(v._id) ? '#fdf5f5' : '#f8fafc',
                        color: selectedVendors.includes(v._id) ? 'var(--primary)' : 'var(--text)',
                        transition: 'all 0.2s',
                      }}>
                      {v.companyName}
                    </div>
                  ))}
                </div>
                {selectedVendors.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 6, fontWeight: 600 }}>
                    ✓ {selectedVendors.length} vendor(s) selected
                  </div>
                )}
              </>
            )}
          </div>

          {/* Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Items *</div>
              <button className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr auto', gap: 8, minWidth: '1200px' }}>
                {['SKU', 'ITEM NAME', 'QTY', 'UNIT', 'BASE PRICE', 'GST %', 'LAST PRICE', ''].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</span>
                ))}
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr auto', gap: 8, alignItems: 'center', minWidth: '1200px' }}>
                  <input className="form-input" placeholder="SKU-001" value={item.sku} onChange={e => updateItem(i, 'sku', e.target.value)} style={{ fontSize: 12 }} />
                  <input className="form-input" placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} style={{ fontSize: 12 }} />
                  <input className="form-input" placeholder="0" type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} style={{ fontSize: 12 }} />
                  <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} style={{ fontSize: 12 }}>
                    {DEFAULT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <input className="form-input" placeholder="0.00" type="number" step="0.01" value={item.basePrice} onChange={e => updateItem(i, 'basePrice', e.target.value)} style={{ fontSize: 12 }} />
                  <input className="form-input" placeholder="18" type="number" value={item.gst} onChange={e => updateItem(i, 'gst', e.target.value)} style={{ fontSize: 12 }} />
                  <input className="form-input" placeholder="Last price" type="number" step="0.01" value={item.lastPrice} onChange={e => updateItem(i, 'lastPrice', e.target.value)} style={{ fontSize: 12 }} />
                  <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', whiteSpace: 'nowrap' }}
                    onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
                </div>
              ))}
            </div>
          </div>
          {/* Attachments */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Attachments</label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#475569', transition: 'all 0.2s' }}>
                <MdAttachFile size={16} />
                <span>Add Files</span>
                <input type="file" multiple onChange={handleAttachmentAdd} style={{ display: 'none' }} />
              </label>
            </div>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attachments.map((att, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}>
                    <span>{att.name} ({(att.size / 1024).toFixed(1)} KB)</span>
                    <button className="btn btn-sm" style={{ background: 'transparent', color: '#ef4444', padding: '2px 6px' }} onClick={() => removeAttachment(i)}>
                      <MdClose size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
