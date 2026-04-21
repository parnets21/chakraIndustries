import { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal';
import { vendorApi } from '../../../../api/vendorApi';
import { prApi } from '../../../../api/prApi';
import { rfqApi } from '../../../../api/rfqApi';
import { useAuth } from '../../../../auth/AuthContext';

const emptyItem = { name: '', qty: '', unit: 'Nos' };

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
  const [form, setForm] = useState({
    title: '',
    linkedPR: '',
    dueDate: '',
    priority: 'Normal',
    remarks: '',
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

  const handleSubmit = async () => {
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
          name: item.name.trim(),
          qty: parseFloat(item.qty),
          unit: item.unit
        })),
        dueDate: form.dueDate,
        priority: form.priority,
        remarks: form.remarks.trim() || '',
        createdBy: user?.name || user?.email || 'Unknown',
        status: 'Sent'
      };

      await rfqApi.create(payload);
      onSaved?.();
      onClose();
      
      // Reset form
      setForm({ title: '', linkedPR: '', dueDate: '', priority: 'Normal', remarks: '' });
      setSelectedVendors([]);
      setItems([{ ...emptyItem }]);
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
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || selectedVendors.length === 0 || items.length === 0}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
                {['ITEM NAME', 'QTY', 'UNIT', ''].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{h}</span>
                ))}
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
                  <input className="form-input" placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                  <input className="form-input" placeholder="0" type="number" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                  <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                    {DEFAULT_UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px' }}
                    onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
