import { useState } from 'react';
import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import DataTable from '../../../components/tables/DataTable';
import { vendors } from './data';
import { MdVisibility, MdDeleteOutline } from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';

export default function VendorsTab({ categories, showVendorModal, setShowVendorModal, showCategoryModal, setShowCategoryModal, newCategory, setNewCategory, setCategories }) {
  const [items, setItems]               = useState(vendors);
  const [viewVendor, setViewVendor]     = useState(null);
  const [editVendor, setEditVendor]     = useState(null);
  const [deleteVendor, setDeleteVendor] = useState(null);

  // Add Vendor form state
  const [form, setForm] = useState({ name: '', category: '', contact: '', phone: '', email: '', city: '', gst: '' });
  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const confirmDelete = () => {
    setItems(prev => prev.filter(v => v.id !== deleteVendor.id));
    setDeleteVendor(null);
  };

  const handleSaveVendor = () => {
    if (!form.name.trim() || !form.category) return;
    const newVendor = {
      id: `V-${String(items.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      category: form.category,
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      status: 'Active',
      rating: '—',
    };
    setItems(prev => [...prev, newVendor]);
    setForm({ name: '', category: '', contact: '', phone: '', email: '', city: '', gst: '' });
    setShowVendorModal(false);
  };

  return (
    <>
      <div className="card">
        <DataTable
          columns={[
            { key: 'id', label: 'Vendor ID' },
            { key: 'name', label: 'Vendor Name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
            { key: 'category', label: 'Category' },
            { key: 'contact', label: 'Contact' },
            { key: 'city', label: 'City' },
            { key: 'rating', label: 'Rating', render: v => <span style={{ color: 'var(--accent)', fontWeight: 700 }}>★ {v}</span> },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            { key: 'actions', label: 'Actions', render: (_, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}
                  onClick={() => setEditVendor(row)}><FaRegEdit size={16} /></button>
                <button className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }} title="View"
                  onClick={() => setViewVendor(row)}><MdVisibility size={16} /></button>
                <button className="btn btn-sm" title="Delete" style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px' }}
                  onClick={() => setDeleteVendor(row)}><MdDeleteOutline size={16} /></button>
              </div>
            )},
          ]}
          data={items}
        />
      </div>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteVendor} onClose={() => setDeleteVendor(null)} title="Delete Vendor"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setDeleteVendor(null)}>Cancel</button>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', padding: '6px 18px' }} onClick={confirmDelete}>Delete</button>
          </>
        }>
        <p style={{ fontSize: 14, color: '#374151' }}>Are you sure you want to delete <strong>{deleteVendor?.name}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* View Vendor Modal */}
      <Modal open={!!viewVendor} onClose={() => setViewVendor(null)} title={`Vendor — ${viewVendor?.name}`}
        footer={<button className="btn btn-outline" onClick={() => setViewVendor(null)}>Close</button>}>
        {viewVendor && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Vendor ID', viewVendor.id],
              ['Vendor Name', viewVendor.name],
              ['Category', viewVendor.category],
              ['Contact Person', viewVendor.contact],
              ['Phone', viewVendor.phone],
              ['City', viewVendor.city],
              ['Rating', `★ ${viewVendor.rating}`],
              ['Status', viewVendor.status],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={!!editVendor} onClose={() => setEditVendor(null)} title={`Edit Vendor — ${editVendor?.id}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setEditVendor(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setEditVendor(null)}>Save Changes</button>
          </>
        }>
        {editVendor && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group"><label className="form-label">Vendor Name *</label>
              <input className="form-input" defaultValue={editVendor.name} /></div>
            <div className="form-group"><label className="form-label">Category *</label>
              <select className="form-select" defaultValue={editVendor.category}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Contact Person</label>
              <input className="form-input" defaultValue={editVendor.contact} /></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-input" defaultValue={editVendor.phone} /></div>
            <div className="form-group"><label className="form-label">City</label>
              <input className="form-input" defaultValue={editVendor.city} /></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" defaultValue={editVendor.status}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Manage Categories Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Manage Vendor Categories"
        footer={<button className="btn btn-primary" onClick={() => setShowCategoryModal(false)}>Done</button>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="New category name..." value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newCategory.trim()) { setCategories(prev => [...prev, newCategory.trim()]); setNewCategory(''); } }} />
          <button className="btn btn-primary btn-sm" onClick={() => { if (newCategory.trim()) { setCategories(prev => [...prev, newCategory.trim()]); setNewCategory(''); } }}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map((cat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{cat}</span>
              <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px' }}
                onClick={() => setCategories(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal open={showVendorModal} onClose={() => setShowVendorModal(false)} title="Add New Vendor"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setShowVendorModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveVendor}>Save Vendor</button>
          </>
        }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Vendor Name *</label>
            <input className="form-input" placeholder="Company name" value={form.name} onChange={e => setF('name', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={e => setF('category', e.target.value)}>
              <option value="">— Select Category —</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input className="form-input" placeholder="Name" value={form.contact} onChange={e => setF('contact', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" placeholder="10-digit number" value={form.phone} onChange={e => setF('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="email@company.com" value={form.email} onChange={e => setF('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-input" placeholder="City" value={form.city} onChange={e => setF('city', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">GST Number</label>
            <input className="form-input" placeholder="GSTIN" value={form.gst} onChange={e => setF('gst', e.target.value)} />
          </div>
        </div>
      </Modal>
    </>
  );
}
