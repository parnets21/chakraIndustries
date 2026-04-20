import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import { vendorApi } from '../../../api/vendorApi';
import { MdVisibility, MdEdit, MdAdd, MdSearch, MdFilterList, MdBusiness, MdPhone, MdEmail, MdLocationOn, MdStar } from 'react-icons/md';

const EMPTY_FORM = {
  companyName: '', category: '', contactPerson: '', phone: '',
  email: '', city: '', state: '', address: '', pincode: '',
  gstNumber: '', paymentTerms: 'Net 30', leadTimeDays: '', rating: 3, status: 'Active', remarks: '',
};

const inp = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0',
  borderRadius: 9, fontSize: 13, outline: 'none', background: '#fff',
  color: '#1e293b', fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color .15s',
};

const lbl = { fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 5, display: 'block' };

export default function VendorsTab({
  categories = [], showVendorModal, setShowVendorModal,
  showCategoryModal, setShowCategoryModal, newCategory, setNewCategory,
  onAddCategory, onDeleteCategory, categoriesRaw = [],
}) {
  const [vendors, setVendors]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm]             = useState(EMPTY_FORM);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [viewVendor, setViewVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await vendorApi.getAll(params);
      setVendors(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, filterStatus]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);
  useEffect(() => { const t = setTimeout(fetchVendors, 400); return () => clearTimeout(t); }, [search]);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setShowVendorModal(true); };
  const openEdit = (v) => {
    setForm({
      companyName: v.companyName || '', category: v.category || '',
      contactPerson: v.contactPerson || '', phone: v.phone || '',
      email: v.email || '', city: v.city || '', state: v.state || '',
      address: v.address || '', pincode: v.pincode || '',
      gstNumber: v.gstNumber || '', paymentTerms: v.paymentTerms || 'Net 30',
      leadTimeDays: v.leadTimeDays || '', rating: v.rating || 3,
      status: v.status || 'Active', remarks: v.remarks || '',
    });
    setEditId(v._id);
    setShowVendorModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      editId ? await vendorApi.update(editId, form) : await vendorApi.create(form);
      setShowVendorModal(false);
      fetchVendors();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const statusColor = (s) => s === 'Active' ? '#22c55e' : s === 'Inactive' ? '#94a3b8' : '#ef4444';

  return (
    <>
      <style>{`
        /* ── Toolbar ── */
        .vt-toolbar {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .vt-search-wrap {
          position: relative; flex: 1; min-width: 160px;
        }
        .vt-search {
          width: 100%; padding: 9px 12px 9px 34px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; font-size: 13px; color: #1e293b;
          outline: none; font-family: inherit; transition: all .2s;
          box-sizing: border-box;
        }
        .vt-search:focus { border-color: #ef4444; background: #fff; box-shadow: 0 0 0 3px rgba(239,68,68,0.08); }
        .vt-search::placeholder { color: #94a3b8; }
        .vt-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; display: flex; }
        .vt-select {
          padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          background: #f8fafc; font-size: 13px; color: #1e293b;
          outline: none; font-family: inherit; cursor: pointer; min-width: 130px;
        }
        .vt-add-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 10px;
          background: linear-gradient(135deg,#ef4444,#b91c1c);
          color: #fff; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; font-family: inherit;
          box-shadow: 0 3px 10px rgba(185,28,28,0.3);
          white-space: nowrap; flex-shrink: 0;
          transition: all .15s;
        }
        .vt-add-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(185,28,28,0.4); }

        /* ── Desktop table ── */
        .vt-table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid #f1f5f9; }
        .vt-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .vt-table thead tr { background: #f8fafc; }
        .vt-table th {
          padding: 10px 14px; text-align: left; font-size: 10.5px;
          font-weight: 700; color: #94a3b8; text-transform: uppercase;
          letter-spacing: .7px; border-bottom: 1px solid #f1f5f9; white-space: nowrap;
        }
        .vt-table td { padding: 11px 14px; font-size: 12.5px; color: #1e293b; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
        .vt-table tbody tr { transition: background .1s; cursor: default; }
        .vt-table tbody tr:hover { background: #fef2f2; }
        .vt-table tbody tr:last-child td { border-bottom: none; }

        /* ── Mobile cards (hidden on desktop) ── */
        .vt-cards { display: none; flex-direction: column; gap: 10px; }

        /* ── Responsive breakpoint ── */
        @media (max-width: 640px) {
          .vt-table-wrap { display: none; }
          .vt-cards { display: flex; }
          .vt-toolbar { gap: 8px; }
          .vt-select { min-width: 0; flex: 1; }
          .vt-add-btn span.vt-add-label { display: none; }
          .vt-add-btn { padding: 9px 12px; }
        }

        /* ── Vendor card (mobile) ── */
        .vt-card {
          background: #fff; border-radius: 14px;
          border: 1px solid #e8edf2;
          box-shadow: 0 2px 8px rgba(15,23,42,0.05);
          padding: 14px 16px;
        }
        .vt-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
        .vt-card-name { font-size: 14px; font-weight: 700; color: #0f172a; }
        .vt-card-id { font-size: 11px; color: #94a3b8; margin-top: 2px; font-family: monospace; }
        .vt-card-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin-bottom: 12px; }
        .vt-card-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #475569; }
        .vt-card-actions { display: flex; gap: 8px; }
        .vt-card-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;
          padding: 8px 0; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all .15s;
        }
        .vt-card-btn-edit { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
        .vt-card-btn-view { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
        .vt-card-btn-edit:hover { background: #ef4444; color: #fff; }
        .vt-card-btn-view:hover { background: #475569; color: #fff; }

        /* ── Form grid ── */
        .vt-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 540px) { .vt-form-grid { grid-template-columns: 1fr; } }
        .vt-span2 { grid-column: span 2; }
        @media (max-width: 540px) { .vt-span2 { grid-column: span 1; } }

        /* ── View detail grid ── */
        .vt-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
        @media (max-width: 480px) { .vt-detail-grid { grid-template-columns: 1fr; } }
        .vt-detail-span2 { grid-column: span 2; }
        @media (max-width: 480px) { .vt-detail-span2 { grid-column: span 1; } }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="vt-toolbar">
        <div className="vt-search-wrap">
          <span className="vt-search-icon"><MdSearch size={15} /></span>
          <input className="vt-search" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="vt-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Blacklisted</option>
        </select>
        <button className="vt-add-btn" onClick={openAdd}>
          <MdAdd size={17} />
          <span className="vt-add-label">Add Vendor</span>
        </button>
      </div>

      {/* ── Error / Loading ── */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#ef4444', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading vendors…</div>
      )}

      {!loading && (
        <>
          {/* ── Desktop Table ── */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf2', boxShadow: '0 2px 10px rgba(15,23,42,0.05)', overflow: 'hidden' }}>
            <div className="vt-table-wrap">
              <table className="vt-table">
                <thead>
                  <tr>
                    {['Vendor ID', 'Vendor Name', 'Category', 'Contact', 'City', 'Rating', 'Status', 'Actions'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendors.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>No vendors found</td></tr>
                  ) : vendors.map((v, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{v.vendorId}</td>
                      <td style={{ fontWeight: 600 }}>{v.companyName}</td>
                      <td style={{ color: '#64748b' }}>{v.category}</td>
                      <td>{v.contactPerson}</td>
                      <td>{v.city}</td>
                      <td style={{ color: '#f59e0b', fontWeight: 700 }}>★ {v.rating}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(v)} title="Edit" style={{
                            width: 30, height: 30, borderRadius: 7, border: '1px solid #fecaca',
                            background: '#fef2f2', color: '#ef4444', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}><MdEdit size={14} /></button>
                          <button onClick={() => setViewVendor(v)} title="View" style={{
                            width: 30, height: 30, borderRadius: 7, border: '1px solid #e2e8f0',
                            background: '#f8fafc', color: '#475569', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}><MdVisibility size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="vt-cards" style={{ padding: '4px 0' }}>
              {vendors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No vendors found</div>
              ) : vendors.map((v, i) => (
                <div key={i} className="vt-card">
                  <div className="vt-card-top">
                    <div>
                      <div className="vt-card-name">{v.companyName}</div>
                      <div className="vt-card-id">{v.vendorId}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>★ {v.rating}</span>
                      <StatusBadge status={v.status} />
                    </div>
                  </div>

                  <div className="vt-card-meta">
                    <div className="vt-card-meta-item">
                      <MdBusiness size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>{v.category || '—'}</span>
                    </div>
                    <div className="vt-card-meta-item">
                      <MdPhone size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>{v.phone || '—'}</span>
                    </div>
                    <div className="vt-card-meta-item">
                      <MdEmail size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.email || '—'}</span>
                    </div>
                    <div className="vt-card-meta-item">
                      <MdLocationOn size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>{v.city || '—'}</span>
                    </div>
                  </div>

                  <div className="vt-card-actions">
                    <button className="vt-card-btn vt-card-btn-edit" onClick={() => openEdit(v)}>
                      <MdEdit size={14} /> Edit
                    </button>
                    <button className="vt-card-btn vt-card-btn-view" onClick={() => setViewVendor(v)}>
                      <MdVisibility size={14} /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Manage Categories Modal ── */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Manage Vendor Categories"
        footer={<button style={{ padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }} onClick={() => setShowCategoryModal(false)}>Done</button>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input style={{ ...inp, flex: 1 }} placeholder="New category name..." value={newCategory || ''}
            onChange={e => setNewCategory && setNewCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && onAddCategory) onAddCategory(newCategory); }} />
          <button onClick={() => onAddCategory && onAddCategory(newCategory)} style={{
            padding: '9px 14px', borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 16,
          }}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(categoriesRaw || []).map((cat) => (
            <div key={cat._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{cat.name}</span>
              <button onClick={() => onDeleteCategory && onDeleteCategory(cat)} style={{
                padding: '3px 10px', borderRadius: 7, background: '#fef2f2', color: '#ef4444',
                border: '1px solid #fecaca', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              }}>✕ Remove</button>
            </div>
          ))}
          {(categoriesRaw || []).length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>No categories yet</div>
          )}
        </div>
      </Modal>

      {/* ── Add / Edit Vendor Modal ── */}
      <Modal open={showVendorModal} onClose={() => setShowVendorModal(false)} title={editId ? 'Edit Vendor' : 'Add New Vendor'}
        footer={
          <>
            <button onClick={() => setShowVendorModal(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #c0392b', color: '#c0392b', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save Vendor'}</button>
          </>
        }>
        <div className="vt-form-grid">
          <div><label style={lbl}>Vendor Name *</label><input style={inp} placeholder="Company name" value={form.companyName} onChange={f('companyName')} /></div>
          <div><label style={lbl}>Category *</label>
            <select style={inp} value={form.category} onChange={f('category')}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Contact Person *</label><input style={inp} placeholder="Name" value={form.contactPerson} onChange={f('contactPerson')} /></div>
          <div><label style={lbl}>Phone *</label><input style={inp} placeholder="10-digit number" value={form.phone} onChange={f('phone')} /></div>
          <div><label style={lbl}>Email *</label><input style={inp} type="email" placeholder="email@company.com" value={form.email} onChange={f('email')} /></div>
          <div><label style={lbl}>City *</label><input style={inp} placeholder="City" value={form.city} onChange={f('city')} /></div>
          <div><label style={lbl}>State *</label><input style={inp} placeholder="State" value={form.state} onChange={f('state')} /></div>
          <div><label style={lbl}>Pincode *</label><input style={inp} placeholder="6-digit pincode" value={form.pincode} onChange={f('pincode')} /></div>
          <div className="vt-span2"><label style={lbl}>Address *</label><input style={inp} placeholder="Full address" value={form.address} onChange={f('address')} /></div>
          <div><label style={lbl}>GST Number *</label><input style={inp} placeholder="GSTIN" value={form.gstNumber} onChange={f('gstNumber')} /></div>
          <div><label style={lbl}>Payment Terms</label>
            <select style={inp} value={form.paymentTerms} onChange={f('paymentTerms')}>
              {['Net 30','Net 45','Net 60','Net 90','Advance Payment','COD'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Lead Time (days)</label><input style={inp} type="number" placeholder="0" value={form.leadTimeDays} onChange={f('leadTimeDays')} /></div>
          <div><label style={lbl}>Status</label>
            <select style={inp} value={form.status} onChange={f('status')}>
              <option>Active</option><option>Inactive</option><option>Blacklisted</option>
            </select>
          </div>
          <div className="vt-span2"><label style={lbl}>Remarks</label><input style={inp} placeholder="Optional notes" value={form.remarks} onChange={f('remarks')} /></div>
        </div>
      </Modal>

      {/* ── View Vendor Modal ── */}
      {viewVendor && (
        <Modal open={!!viewVendor} onClose={() => setViewVendor(null)} title={viewVendor.companyName}
          footer={<button onClick={() => setViewVendor(null)} style={{ padding: '8px 18px', borderRadius: 9, border: '1.5px solid #e2e8f0', color: '#475569', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Close</button>}>

          {/* Vendor header chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fef2f2', borderRadius: 12, marginBottom: 16, border: '1px solid #fecaca' }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
              {(viewVendor.companyName || 'V').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{viewVendor.companyName}</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{viewVendor.vendorId} · {viewVendor.category}</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>★ {viewVendor.rating}</span>
              <StatusBadge status={viewVendor.status} />
            </div>
          </div>

          <div className="vt-detail-grid">
            {[
              ['Contact Person', viewVendor.contactPerson],
              ['Phone',          viewVendor.phone],
              ['Email',          viewVendor.email],
              ['City',           viewVendor.city],
              ['State',          viewVendor.state],
              ['Pincode',        viewVendor.pincode],
              ['GST Number',     viewVendor.gstNumber],
              ['Payment Terms',  viewVendor.paymentTerms],
              ['Lead Time',      `${viewVendor.leadTimeDays || '—'} days`],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{val || '—'}</div>
              </div>
            ))}
            <div className="vt-detail-span2" style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>Address</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{viewVendor.address || '—'}</div>
            </div>
            {viewVendor.remarks && (
              <div className="vt-detail-span2" style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>Remarks</div>
                <div style={{ fontSize: 13, color: '#475569' }}>{viewVendor.remarks}</div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
