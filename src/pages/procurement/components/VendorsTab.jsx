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
  showCategoryModal, setShowCategoryModal, newCategory, setNewCategory,
  onAddCategory, onDeleteCategory, categoriesRaw,
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

      {/* Manage Categories Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Manage Vendor Categories"
        footer={<button className="btn btn-primary" onClick={() => setShowCategoryModal(false)}>Done</button>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="New category name..." value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAddCategory(newCategory); }} />
          <button className="btn btn-primary btn-sm" onClick={() => onAddCategory(newCategory)}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(categoriesRaw || []).map((cat) => (
            <div key={cat._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
              <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px' }}
                onClick={() => onDeleteCategory(cat)}>✕</button>
            </div>
          ))}
        </div>
      </Modal>

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
        <Modal open={!!viewVendor} onClose={() => setViewVendor(null)} title={`Vendor: ${viewVendor.companyName}`}
          footer={<button className="btn btn-outline" onClick={() => setViewVendor(null)}>Close</button>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
            {[
              ['Vendor ID', viewVendor.vendorId], ['Category', viewVendor.category],
              ['Contact Person', viewVendor.contactPerson], ['Phone', viewVendor.phone],
              ['Email', viewVendor.email], ['City', viewVendor.city],
              ['State', viewVendor.state], ['Pincode', viewVendor.pincode],
              ['GST Number', viewVendor.gstNumber], ['Payment Terms', viewVendor.paymentTerms],
              ['Lead Time', `${viewVendor.leadTimeDays} days`], ['Rating', `★ ${viewVendor.rating}`],
              ['Status', viewVendor.status], ['Remarks', viewVendor.remarks || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 500 }}>{val}</div>
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>Address</div>
              <div style={{ fontWeight: 500 }}>{viewVendor.address}</div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
