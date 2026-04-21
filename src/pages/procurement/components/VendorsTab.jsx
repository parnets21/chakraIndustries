import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import DataTable from '../../../components/tables/DataTable';
import { vendorApi } from '../../../api/vendorApi';
import { MdVisibility } from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';

const EMPTY_FORM = {
  companyName: '', category: '', contactPerson: '', phone: '',
  email: '', city: '', state: '', address: '', pincode: '',
  gstNumber: '', paymentTerms: 'Net 30', leadTimeDays: '', rating: 3, status: 'Active', remarks: '',
};

export default function VendorsTab({
  categories, showVendorModal, setShowVendorModal,
}) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [viewVendor, setViewVendor] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await vendorApi.getAll(params);
      setVendors(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(fetchVendors, 400);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowVendorModal(true); };
  const openEdit = (vendor) => {
    setForm({
      companyName: vendor.companyName || '',
      category: vendor.category || '',
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      city: vendor.city || '',
      state: vendor.state || '',
      address: vendor.address || '',
      pincode: vendor.pincode || '',
      gstNumber: vendor.gstNumber || '',
      paymentTerms: vendor.paymentTerms || 'Net 30',
      leadTimeDays: vendor.leadTimeDays || '',
      rating: vendor.rating || 3,
      status: vendor.status || 'Active',
      remarks: vendor.remarks || '',
    });
    setEditId(vendor._id);
    setShowVendorModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await vendorApi.update(editId, form);
      } else {
        await vendorApi.create(form);
      }
      setShowVendorModal(false);
      setForm('');
      fetchVendors();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const columns = [
    { key: 'vendorId', label: 'Vendor ID' },
    { key: 'companyName', label: 'Vendor Name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'category', label: 'Category' },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'city', label: 'City' },
    { key: 'rating', label: 'Rating', render: v => <span style={{ color: 'var(--accent)', fontWeight: 700 }}>★ {v}</span> },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', label: 'Actions', render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }} onClick={() => openEdit(row)}><FaRegEdit size={16} /></button>
          <button className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }} title="View" onClick={() => setViewVendor(row)}><MdVisibility size={16} /></button>
        </div>
      )
    },
  ];

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="Search vendors..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240 }} />
        <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Blacklisted</option>
        </select>
      </div>

      <div className="card">
        {error && <div style={{ color: 'red', padding: 12 }}>{error}</div>}
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <DataTable columns={columns} data={vendors} />
        )}
      </div>

      {/* Add / Edit Vendor Modal */}
      <Modal open={showVendorModal} onClose={() => setShowVendorModal(false)} title={editId ? 'Edit Vendor' : 'Add New Vendor'}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowVendorModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Vendor'}</button>
          </>
        }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label className="form-label">Vendor Name *</label><input className="form-input" placeholder="Company name" value={form.companyName} onChange={f('companyName')} /></div>
          <div className="form-group"><label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={f('category')}>
              <option value="">Select category</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Contact Person *</label><input className="form-input" placeholder="Name" value={form.contactPerson} onChange={f('contactPerson')} /></div>
          <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" placeholder="10-digit number" value={form.phone} onChange={f('phone')} /></div>
          <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" placeholder="email@company.com" value={form.email} onChange={f('email')} /></div>
          <div className="form-group"><label className="form-label">City *</label><input className="form-input" placeholder="City" value={form.city} onChange={f('city')} /></div>
          <div className="form-group"><label className="form-label">State *</label><input className="form-input" placeholder="State" value={form.state} onChange={f('state')} /></div>
          <div className="form-group"><label className="form-label">Pincode *</label><input className="form-input" placeholder="6-digit pincode" value={form.pincode} onChange={f('pincode')} /></div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Address *</label><input className="form-input" placeholder="Full address" value={form.address} onChange={f('address')} /></div>
          <div className="form-group"><label className="form-label">GST Number *</label><input className="form-input" placeholder="GSTIN" value={form.gstNumber} onChange={f('gstNumber')} /></div>
          <div className="form-group"><label className="form-label">Payment Terms</label>
            <select className="form-select" value={form.paymentTerms} onChange={f('paymentTerms')}>
              {['Net 30', 'Net 45', 'Net 60', 'Net 90', 'Advance Payment', 'COD'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Lead Time (days)</label><input className="form-input" type="number" placeholder="0" value={form.leadTimeDays} onChange={f('leadTimeDays')} /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={f('status')}>
              <option>Active</option><option>Inactive</option><option>Blacklisted</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Remarks</label><input className="form-input" placeholder="Optional notes" value={form.remarks} onChange={f('remarks')} /></div>
        </div>
      </Modal>

      {/* View Vendor Modal */}
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
