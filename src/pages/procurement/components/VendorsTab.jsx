import StatusBadge from '../../../components/common/StatusBadge';
import Modal from '../../../components/common/Modal';
import DataTable from '../../../components/tables/DataTable';
import { vendors } from './data';
import { MdVisibility } from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';

export default function VendorsTab({ categories, showVendorModal, setShowVendorModal, showCategoryModal, setShowCategoryModal, newCategory, setNewCategory, setCategories }) {
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
            { key: 'id', label: 'Actions', render: () => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" title="Edit" style={{ padding: '4px 8px' }}><FaRegEdit  size={16} /></button>
                <button className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text)', padding: '4px 8px' }} title="View"><MdVisibility size={16} /></button>
              </div>
            )},
          ]}
          data={vendors}
        />
      </div>
            
      {/* Manage Categories Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Manage Vendor Categories"
        footer={<button className="btn btn-primary" onClick={() => setShowCategoryModal(false)}>Done</button>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="form-input"
            placeholder="New category name..."
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newCategory.trim()) {
                setCategories(prev => [...prev, newCategory.trim()]);
                setNewCategory('');
              }
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => {
            if (newCategory.trim()) {
              setCategories(prev => [...prev, newCategory.trim()]);
              setNewCategory('');
            }
          }}>+</button>
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
        footer={<><button className="btn btn-outline" onClick={() => setShowVendorModal(false)}>Cancel</button><button className="btn btn-primary">Save Vendor</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label className="form-label">Vendor Name *</label><input className="form-input" placeholder="Company name" /></div>
          <div className="form-group"><label className="form-label">Category *</label>
            <select className="form-select">{categories.map(c => <option key={c}>{c}</option>)}</select>
          </div>
          <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" placeholder="Name" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="10-digit number" /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="email@company.com" /></div>
          <div className="form-group"><label className="form-label">City</label><input className="form-input" placeholder="City" /></div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">GST Number</label><input className="form-input" placeholder="GSTIN" /></div>
        </div>
      </Modal>
    </>
  );
}
