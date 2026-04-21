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
  categories, showVendorModal, setShowVendorModal,
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
      setForm('');
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

      {/* Add / Edit Vendor Modal */}
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
        <Modal open={!!viewVendor} onClose={() => setViewVendor(null)} title={viewVendor.companyName} size="lg"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Vendor ID: <span style={{ fontWeight: 600, color: '#1E293B' }}>{viewVendor.vendorId}</span></div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn" style={{ background: 'transparent', border: '1px solid #CBD5E1', color: '#475569', padding: '8px 16px', borderRadius: 6, fontWeight: 500 }} onClick={() => setViewVendor(null)}>Close</button>
                <button className="btn btn-primary" style={{ background: '#0F172A', color: 'white', padding: '8px 16px', borderRadius: 6, fontWeight: 500 }} onClick={() => openEdit(viewVendor)}>Edit Vendor</button>
              </div>
            </div>
          }>

          <style>{`
            .vendor-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 20px; }
            .section-full-width { grid-column: span 3; }
            .section-half-width { grid-column: span 2; }
            .field-group { display: flex; flex-direction: column; gap: 3px; }
            .field-label { font-size: 11px; font-weight: 500; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px; }
            .field-value { font-size: 14px; font-weight: 400; color: #1E293B; }
            .field-value.copyable { cursor: pointer; font-family: monospace; background: #F8FAFC; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
            .field-value.copyable:hover { background: #E2E8F0; }
            .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 40px; font-size: 12px; font-weight: 500; }
            .status-badge.active { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
            .status-badge.active::before { content: ""; width: 6px; height: 6px; background: #12B76A; border-radius: 50%; box-shadow: 0 0 0 2px rgba(18,183,106,0.2); }
            .status-badge.inactive { background: #F3F4F6; color: #6B7280; border: 1px solid #D1D5DB; }
            .status-badge.inactive::before { content: ""; width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%; }
            .status-badge.blacklisted { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
            .status-badge.blacklisted::before { content: ""; width: 6px; height: 6px; background: #EF4444; border-radius: 50%; }
            .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #E4E7EC; }
            .section-header h3 { font-size: 13px; font-weight: 700; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px; margin: 0; }
            .section-icon { width: 16px; height: 16px; color: #c0392b; }
            .rating-container { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .rating-value { font-size: 16px; font-weight: 700; color: #0F172A; }
            .rating-max { font-size: 12px; color: #64748B; }
            .rating-bar { width: 80px; height: 5px; background: #E2E8F0; border-radius: 3px; overflow: hidden; }
            .rating-bar-fill { height: 100%; background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%); transition: width 0.3s; }
            .rating-stars { color: #F59E0B; font-size: 14px; letter-spacing: 1px; }
            .category-badge { display: inline-flex; padding: 4px 10px; background: #EFF6FF; color: #1E40AF; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid #DBEAFE; }
            @media (max-width: 768px) {
              .vendor-details { grid-template-columns: 1fr; }
              .section-full-width, .section-half-width { grid-column: span 1; }
            }
          `}</style>

          {/* Top Info Bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="category-badge">{viewVendor.category}</div>
            <div className={`status-badge ${viewVendor.status.toLowerCase()}`}>{viewVendor.status}</div>
          </div>

          {/* Contact Information Section */}
          <div style={{ marginBottom: 20 }}>
            <div className="section-header">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3>Contact Information</h3>
            </div>
            <div className="vendor-details">
              <div className="field-group">
                <div className="field-label">Contact Person</div>
                <div className="field-value">{viewVendor.contactPerson}</div>
              </div>
              <div className="field-group">
                <div className="field-label">Phone Number</div>
                <div className="field-value">{viewVendor.phone}</div>
              </div>
              <div className="field-group">
                <div className="field-label">Email Address</div>
                <div className="field-value" style={{ color: '#2563EB' }}>{viewVendor.email}</div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div style={{ marginBottom: 20 }}>
            <div className="section-header">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3>Address Details</h3>
            </div>
            <div className="vendor-details">
              <div className="field-group">
                <div className="field-label">City</div>
                <div className="field-value">{viewVendor.city}</div>
              </div>
              <div className="field-group">
                <div className="field-label">State</div>
                <div className="field-value">{viewVendor.state}</div>
              </div>
              <div className="field-group">
                <div className="field-label">Pincode</div>
                <div className="field-value">{viewVendor.pincode}</div>
              </div>
              <div className="field-group section-full-width">
                <div className="field-label">Full Address</div>
                <div className="field-value">{viewVendor.address}</div>
              </div>
            </div>
          </div>

          {/* Financial & Business Terms */}
          <div style={{ marginBottom: viewVendor.remarks ? 20 : 0 }}>
            <div className="section-header">
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>Financial & Business Terms</h3>
            </div>
            <div className="vendor-details">
              <div className="field-group">
                <div className="field-label">GST Number</div>
                <div className="field-value copyable" title="Click to copy" onClick={() => navigator.clipboard.writeText(viewVendor.gstNumber)}>{viewVendor.gstNumber}</div>
              </div>
              <div className="field-group">
                <div className="field-label">Payment Terms</div>
                <div className="field-value">{viewVendor.paymentTerms}</div>
              </div>
              <div className="field-group">
                <div className="field-label">Lead Time</div>
                <div className="field-value">{viewVendor.leadTimeDays} days</div>
              </div>
              <div className="field-group section-full-width">
                <div className="field-label">Vendor Rating</div>
                <div className="rating-container">
                  <span className="rating-value">{viewVendor.rating}.0</span>
                  <span className="rating-max">/5.0</span>
                  <div className="rating-bar">
                    <div className="rating-bar-fill" style={{ width: `${(viewVendor.rating / 5) * 100}%` }}></div>
                  </div>
                  <span className="rating-stars">{'★'.repeat(viewVendor.rating)}{'☆'.repeat(5 - viewVendor.rating)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Section */}
          {viewVendor.remarks && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 6,
              padding: '12px 16px',
              marginTop: 20
            }}>
              <div className="field-label" style={{ color: '#92400E', marginBottom: 4 }}>Additional Remarks</div>
              <div className="field-value" style={{ color: '#78350F', fontSize: 13 }}>{viewVendor.remarks}</div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
