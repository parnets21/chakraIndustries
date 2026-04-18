import { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal';
import Stepper from '../../../../components/common/Stepper';
import { prApi } from '../../../../api/prApi';
import { departmentApi } from '../../../../api/departmentApi';
import { useAuth } from '../../../../auth/AuthContext';

const steps = ['Details', 'Items', 'Review', 'Submit'];
const emptyItem = { name: '', qty: '', unit: 'Nos', estimatedPrice: '' };
const emptyForm = { department: '', requiredBy: '', priority: 'Normal', costCenter: '', remarks: '' };

export default function CreatePRModal({ open, onClose, onSaved, editData }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    departmentApi.getAll().then(res => setDepartments(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (editData) {
      setForm({
        department: editData.department || 'Production',
        requiredBy: editData.requiredBy ? editData.requiredBy.slice(0, 10) : '',
        priority: editData.priority || 'Normal',
        costCenter: editData.costCenter || '',
        remarks: editData.remarks || '',
      });
      setItems(editData.items?.length ? editData.items : [{ ...emptyItem }]);
    } else {
      setForm(emptyForm);
      setItems([{ ...emptyItem }]);
    }
    setStep(0);
  }, [editData, open]);

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const totalEstimate = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.estimatedPrice) || 0), 0);

  const handleClose = () => { setStep(0); onClose(); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        items,
        requestedBy: user?.name || user?.email || 'Unknown',
      };
      if (editData) {
        await prApi.update(editData._id, payload);
      } else {
        await prApi.create(payload);
      }
      onSaved?.();
      handleClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={editData ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'} size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="btn btn-outline" onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < steps.length - 1
            ? <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
            : <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Submitting...' : editData ? 'Update PR' : 'Submit PR'}
              </button>
          }
        </div>
      }>

      <Stepper steps={steps} current={step} />

      {/* Step 0 — Details */}
      {step === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select className="form-select" value={form.department} onChange={e => updateForm('department', e.target.value)}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Required By *</label>
            <input type="date" className="form-input" value={form.requiredBy} onChange={e => updateForm('requiredBy', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={e => updateForm('priority', e.target.value)}>
              <option>Normal</option><option>Urgent</option><option>Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cost Center</label>
            <input className="form-input" placeholder="e.g. CC-PROD-01" value={form.costCenter} onChange={e => updateForm('costCenter', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Remarks</label>
            <textarea className="form-input" rows={2} placeholder="Reason for requisition..." value={form.remarks} onChange={e => updateForm('remarks', e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 1 — Items */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Add Items</div>
            <button className="btn btn-outline btn-sm" onClick={addItem}>+ Add Row</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10 }}>
              {['ITEM NAME', 'QTY', 'UNIT', 'EST. PRICE (₹)', ''].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{h}</span>
              ))}
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 10, alignItems: 'center' }}>
                <input className="form-input" placeholder="Item name" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
                <input className="form-input" type="number" placeholder="0" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} />
                <select className="form-select" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                  <option>Nos</option><option>Kg</option><option>Set</option><option>Litre</option><option>Metre</option>
                </select>
                <input className="form-input" type="number" placeholder="0.00" value={item.estimatedPrice} onChange={e => updateItem(i, 'estimatedPrice', e.target.value)} />
                <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px' }}
                  onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
              </div>
            ))}
          </div>
          {totalEstimate > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right', fontSize: 13 }}>
              Estimated Total: <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>₹{Math.round(totalEstimate).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Review */}
      {step === 2 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              ['Department', form.department],
              ['Required By', form.requiredBy || '—'],
              ['Priority', form.priority],
              ['Cost Center', form.costCenter || '—'],
              ['Remarks', form.remarks || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items ({items.length})</div>
          <div className="table-container">
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Est. Price</th><th>Total</th></tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{it.name || '—'}</td>
                    <td>{it.qty || 0}</td>
                    <td>{it.unit}</td>
                    <td>₹{it.estimatedPrice || 0}</td>
                    <td style={{ fontWeight: 700 }}>₹{((parseFloat(it.qty) || 0) * (parseFloat(it.estimatedPrice) || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ textAlign: 'right', marginTop: 12, fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
            Grand Total: ₹{Math.round(totalEstimate).toLocaleString()}
          </div>
        </div>
      )}

      {/* Step 3 — Submit */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Ready to Submit</div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            This PR will be sent for multi-level approval:<br />
            <strong>L1 Manager → L2 HOD → L3 Finance</strong>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, display: 'inline-block', textAlign: 'left', minWidth: 260 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Department</div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>{form.department}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Items</div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>{items.length} item(s)</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Estimated Value</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>₹{Math.round(totalEstimate).toLocaleString()}</div>
          </div>
        </div>
      )}
    </Modal>
  );
}
