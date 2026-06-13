import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../../../components/common/Modal';
import Stepper from '../../../../components/common/Stepper';
import { prApi } from '../../../../api/prApi';
import { departmentApi } from '../../../../api/departmentApi';
import { itemMasterApi } from '../../../../api/itemMasterApi';
import { useAuth } from '../../../../auth/AuthContext';
import { dataEvents } from '../../../../utils/dataEvents';

const steps = ['Details', 'Items', 'Review', 'Submit'];
const emptyItem = { name: '', qty: '', unit: 'Nos', itemMasterId: null, inputMode: 'manual' };
const emptyForm = { department: '', requiredBy: '', priority: 'Normal', remarks: '' };

const UNITS = ['Nos', 'Kg', 'Set', 'Litre', 'Metre', 'Pcs', 'Box', 'Gm', 'Ml', 'Mtr', 'Ltr'];

export default function CreatePRModal({ open, onClose, onSaved, editData }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Item Master state
  const [masterItems, setMasterItems] = useState([]);
  const [masterLoading, setMasterLoading] = useState(false);
  // Per-row search text and dropdown visibility
  const [rowSearch, setRowSearch] = useState({});       // { [rowIdx]: searchText }
  const [rowDropdown, setRowDropdown] = useState({});   // { [rowIdx]: bool }
  const [rowFiltered, setRowFiltered] = useState({});   // { [rowIdx]: filteredList }
  const dropdownRefs = useRef({});

  // Load dropdown items once when modal opens on the Items step
  const loadMasterItems = useCallback(async () => {
    if (masterItems.length) return;
    setMasterLoading(true);
    try {
      const res = await itemMasterApi.getDropdown();
      setMasterItems(res.data || []);
    } catch (_) { /* non-fatal */ }
    finally { setMasterLoading(false); }
  }, [masterItems.length]);

  useEffect(() => {
    if (open) {
      departmentApi.getAll().then(res => setDepartments(res.data)).catch(console.error);
    }
  }, [open]);

  // Load master items when reaching Step 1
  useEffect(() => {
    if (open && step === 1) loadMasterItems();
  }, [open, step, loadMasterItems]);

  useEffect(() => {
    if (editData) {
      setForm({
        department: editData.department || '',
        requiredBy: editData.requiredBy ? editData.requiredBy.slice(0, 10) : '',
        priority: editData.priority || 'Normal',
        remarks: editData.remarks || '',
      });
      setItems(editData.items?.length
        ? editData.items.map(it => ({ ...emptyItem, ...it, inputMode: it.itemMasterId ? 'select' : 'manual' }))
        : [{ ...emptyItem }]
      );
    } else {
      setForm(emptyForm);
      setItems([{ ...emptyItem }]);
    }
    setStep(0);
    setRowSearch({});
    setRowDropdown({});
    setRowFiltered({});
  }, [editData, open]);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const close = () => setRowDropdown({});
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const updateForm = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateItem = (i, k, v) => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const addItem = () => {
    setItems(prev => [...prev, { ...emptyItem }]);
  };
  const removeItem = (i) => {
    setItems(prev => prev.filter((_, idx) => idx !== i));
    setRowSearch(p => { const n = { ...p }; delete n[i]; return n; });
    setRowDropdown(p => { const n = { ...p }; delete n[i]; return n; });
    setRowFiltered(p => { const n = { ...p }; delete n[i]; return n; });
  };

  // Toggle row between select and manual mode
  const toggleMode = (i, mode) => {
    setItems(prev => prev.map((it, idx) =>
      idx === i ? { ...emptyItem, qty: it.qty, unit: it.unit, inputMode: mode } : it
    ));
    setRowSearch(p => ({ ...p, [i]: '' }));
    setRowDropdown(p => ({ ...p, [i]: false }));
    setRowFiltered(p => ({ ...p, [i]: [] }));
  };

  // Handle search input changes for select mode
  const handleRowSearch = (i, text) => {
    setRowSearch(p => ({ ...p, [i]: text }));
    if (!text.trim()) {
      setRowFiltered(p => ({ ...p, [i]: masterItems.slice(0, 8) }));
    } else {
      const q = text.toLowerCase();
      setRowFiltered(p => ({
        ...p,
        [i]: masterItems.filter(m =>
          m.name?.toLowerCase().includes(q) || m.sku?.toLowerCase().includes(q)
        ).slice(0, 10),
      }));
    }
    setRowDropdown(p => ({ ...p, [i]: true }));
    // Clear selection when typing
    updateItem(i, 'itemMasterId', null);
    updateItem(i, 'name', text);
  };

  // Select an item from the dropdown
  const selectMasterItem = (i, master) => {
    setItems(prev => prev.map((it, idx) =>
      idx === i ? {
        ...it,
        name: master.name,
        unit: master.unit || it.unit,
        itemMasterId: master._id,
        sku: master.sku,
        inputMode: 'select',
      } : it
    ));
    setRowSearch(p => ({ ...p, [i]: master.name }));
    setRowDropdown(p => ({ ...p, [i]: false }));
  };

  const handleClose = () => { setStep(0); onClose(); };

  const handleSubmit = async () => {
    if (!form.department) { alert('Please select a department.'); setStep(0); return; }
    const validItems = items.filter(it => it.name?.trim() && it.qty);
    if (validItems.length === 0) { alert('Add at least one item with a name and quantity.'); setStep(1); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        requiredBy: form.requiredBy || null,
        items: validItems.map(it => ({
          name: it.name,
          qty: parseFloat(it.qty) || 0,
          unit: it.unit,
          ...(it.itemMasterId ? { itemMasterId: it.itemMasterId } : {}),
          ...(it.sku ? { sku: it.sku } : {}),
        })),
        requestedBy: user?.name || user?.email || 'Unknown',
      };
      if (editData) await prApi.update(editData._id, payload);
      else await prApi.create(payload);
      dataEvents.emit('pr:changed');
      onSaved?.();
      handleClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editData ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => step === 0 ? handleClose() : setStep(s => s - 1)}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < steps.length - 1
            ? <button className="btn btn-primary" onClick={() => {
                if (step === 0 && !form.department) { alert('Please select a department.'); return; }
                if (step === 1 && !items.some(it => it.name?.trim() && it.qty)) { alert('Add at least one item with name and quantity.'); return; }
                setStep(s => s + 1);
              }}>Next →</button>
            : <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Submitting...' : editData ? 'Update PR' : 'Submit PR'}
              </button>
          }
        </div>
      }
    >
      <style>{`
        .pr-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width: 520px) { .pr-form-grid { grid-template-columns: 1fr; } }
        .pr-form-span { grid-column: span 2; }
        @media(max-width: 520px) { .pr-form-span { grid-column: span 1; } }
        .pr-review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
        @media(max-width: 480px) { .pr-review-grid { grid-template-columns: 1fr; } }
        .pr-mode-btn { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1.5px solid transparent; font-family: inherit; transition: all .15s; }
        .pr-mode-btn.active-select { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .pr-mode-btn.active-manual { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .pr-mode-btn.inactive { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0; }
        .pr-item-search-wrap { position: relative; }
        .pr-item-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 999; background: #fff; border: 1.5px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; box-shadow: 0 8px 24px rgba(15,23,42,0.1); max-height: 200px; overflow-y: auto; }
        .pr-item-dropdown-row { padding: 9px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .pr-item-dropdown-row:hover { background: #eff6ff; }
        .pr-item-dropdown-empty { padding: 10px 12px; font-size: 12px; color: #94a3b8; text-align: center; }
        .pr-input { width: 100%; padding: 8px 11px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #fff; color: #1e293b; font-family: inherit; box-sizing: border-box; }
        .pr-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .pr-select { width: 100%; padding: 8px 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 13px; outline: none; background: #fff; color: #1e293b; font-family: inherit; cursor: pointer; }
        .pr-select:focus { border-color: #6366f1; }
      `}</style>

      <Stepper steps={steps} current={step} />

      {/* ── Step 0: Details ── */}
      {step === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
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
          <div className="form-group" style={{ gridColumn: 'span 3' }}>
            <label className="form-label">Remarks</label>
            <textarea className="form-input" rows={2} placeholder="Reason for requisition..." value={form.remarks} onChange={e => updateForm('remarks', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── Step 1: Items ── */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Add Items</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                Each row supports <strong>Select from catalogue</strong> or <strong>Type manually</strong>
              </div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={addItem}>+ Add Row</button>
          </div>

          {masterLoading && (
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, padding: '6px 10px', background: '#f8fafc', borderRadius: 7 }}>
              Loading item catalogue...
            </div>
          )}

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px 2fr 80px 90px 34px', gap: 8, marginBottom: 6, padding: '0 2px' }}>
            {['', 'ITEM NAME', 'QTY', 'UNIT', ''].map((h, idx) => (
              <span key={idx} style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '.4px' }}>{h}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Mode toggle + row */}
                <div style={{ display: 'grid', gridTemplateColumns: '36px 2fr 80px 90px 34px', gap: 8, alignItems: 'center' }}>
                  {/* Mode toggle button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                    <button
                      className={`pr-mode-btn ${item.inputMode === 'select' ? 'active-select' : 'inactive'}`}
                      title="Select from Item Master"
                      onClick={() => toggleMode(i, 'select')}
                      style={{ fontSize: 14, padding: '4px 6px', lineHeight: 1 }}
                    >☰</button>
                    <button
                      className={`pr-mode-btn ${item.inputMode === 'manual' ? 'active-manual' : 'inactive'}`}
                      title="Type item name manually"
                      onClick={() => toggleMode(i, 'manual')}
                      style={{ fontSize: 13, padding: '4px 6px', lineHeight: 1 }}
                    >✎</button>
                  </div>

                  {/* Item name — select or manual */}
                  <div className="pr-item-search-wrap"
                    ref={el => dropdownRefs.current[i] = el}
                    onMouseDown={e => e.stopPropagation()}
                  >
                    {item.inputMode === 'select' ? (
                      <>
                        <input
                          className="pr-input"
                          placeholder="Search item catalogue…"
                          value={rowSearch[i] ?? item.name}
                          onChange={e => handleRowSearch(i, e.target.value)}
                          onFocus={() => {
                            setRowFiltered(p => ({ ...p, [i]: (rowSearch[i] || item.name)
                              ? masterItems.filter(m => m.name?.toLowerCase().includes((rowSearch[i] || item.name).toLowerCase())).slice(0, 10)
                              : masterItems.slice(0, 8)
                            }));
                            setRowDropdown(p => ({ ...p, [i]: true }));
                          }}
                          style={{ borderColor: item.itemMasterId ? '#bfdbfe' : '#e2e8f0', background: item.itemMasterId ? '#eff6ff' : '#fff' }}
                        />
                        {item.itemMasterId && (
                          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#1d4ed8', fontWeight: 700, pointerEvents: 'none' }}>
                            ✓
                          </span>
                        )}
                        {rowDropdown[i] && (
                          <div className="pr-item-dropdown">
                            {(rowFiltered[i] || []).length === 0 ? (
                              <div className="pr-item-dropdown-empty">
                                {masterLoading ? 'Loading...' : 'No items found'}
                              </div>
                            ) : (rowFiltered[i] || []).map(m => (
                              <div
                                key={m._id}
                                className="pr-item-dropdown-row"
                                onMouseDown={e => { e.preventDefault(); selectMasterItem(i, m); }}
                              >
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{m.name}</div>
                                  {m.sku && <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 1 }}>SKU: {m.sku}</div>}
                                </div>
                                <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>{m.unit || 'Nos'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        className="pr-input"
                        placeholder="Type item name…"
                        value={item.name}
                        onChange={e => updateItem(i, 'name', e.target.value)}
                        style={{ background: '#f0fdf4', borderColor: item.name ? '#bbf7d0' : '#e2e8f0' }}
                      />
                    )}
                  </div>

                  {/* Qty */}
                  <input
                    className="pr-input"
                    type="number"
                    placeholder="Qty"
                    min="0"
                    value={item.qty}
                    onChange={e => updateItem(i, 'qty', e.target.value)}
                    style={{ textAlign: 'right' }}
                  />

                  {/* Unit */}
                  <select
                    className="pr-select"
                    value={item.unit}
                    onChange={e => updateItem(i, 'unit', e.target.value)}
                  >
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>

                  {/* Remove */}
                  <button
                    style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 7, cursor: items.length === 1 ? 'not-allowed' : 'pointer', opacity: items.length === 1 ? 0.4 : 1, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontFamily: 'inherit', flexShrink: 0 }}
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    title="Remove row"
                  >✕</button>
                </div>

                {/* Selected item info badge */}
                {item.inputMode === 'select' && item.itemMasterId && (
                  <div style={{ fontSize: 11, color: '#1d4ed8', background: '#eff6ff', borderRadius: 6, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                    <span>📦</span>
                    <span><strong>{item.name}</strong>{item.sku ? ` · SKU: ${item.sku}` : ''}</span>
                    <button
                      onMouseDown={e => { e.stopPropagation(); toggleMode(i, 'select'); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, lineHeight: 1, padding: 0, marginLeft: 2 }}
                      title="Clear selection"
                    >×</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div>
          <div className="pr-review-grid">
            {[
              ['Department', form.department], 
              ['Required By', form.requiredBy || '—'],
              ['Priority', form.priority],
              ['Remarks', form.remarks || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items ({items.filter(it => it.name?.trim()).length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 380, fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Item', 'Source', 'Qty', 'Unit'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.filter(it => it.name?.trim()).map((it, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{it.name || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {it.itemMasterId
                        ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 700 }}>Catalogue</span>
                        : <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#15803d', fontWeight: 700 }}>Manual</span>
                      }
                    </td>
                    <td style={{ padding: '8px 10px' }}>{it.qty || 0}</td>
                    <td style={{ padding: '8px 10px' }}>{it.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Step 3: Submit ── */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📋</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Ready to Submit</div>
          <div style={{ color: '#64748b', fontSize: 13, marginBottom: 18 }}>
            This PR will be sent for multi-level approval:<br />
            <strong>L1 Manager → L2 HOD → L3 Finance</strong>
          </div>
          <div style={{
            background: '#f8fafc', borderRadius: 10, padding: 16,
            display: 'inline-block', textAlign: 'left',
            minWidth: 220, maxWidth: '100%', boxSizing: 'border-box',
          }}>
            {[
              ['Department', form.department],
              ['Items', `${items.filter(it => it.name?.trim()).length} item(s)`],
            ].map(([k, v], i) => (
              <div key={k} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{k}</div>
                <div style={{ fontWeight: i === 2 ? 800 : 700, fontSize: i === 2 ? 16 : 14, color: i === 2 ? 'var(--primary)' : '#1a202c' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
