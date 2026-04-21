import { useState, useEffect } from 'react';
import { categoryApi } from '../../api/categoryApi';
import Modal from '../../components/common/Modal';
import VendorsTab from './components/VendorsTab';

export default function VendorsPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Load categories from DB
  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(res.data)).catch(console.error);
  }, []);

  // Add category to DB
  const handleAddCategory = async (name) => {
    if (!name.trim()) return;
    try {
      const res = await categoryApi.create(name.trim());
      setCategories(prev => [...prev, res.data]);
      setNewCategory('');
    } catch (e) {
      alert(e.message);
    }
  };

  // Delete category from DB
  const handleDeleteCategory = async (cat) => {
    try {
      await categoryApi.delete(cat._id);
      setCategories(prev => prev.filter(c => c._id !== cat._id));
    } catch (e) {
      alert(e.message);
    }
  };

  // Category names for dropdown
  const categoryNames = categories.map(c => c.name);

  return (
    <div>
      <VendorsTab
        categories={categoryNames}
        showVendorModal={showVendorModal}
        setShowVendorModal={setShowVendorModal}
      />

      {/* Manage Categories Modal */}
      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Manage Vendor Categories"
        footer={<button className="btn btn-primary" onClick={() => setShowCategoryModal(false)}>Done</button>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="New category name..." value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(newCategory); }} />
          <button className="btn btn-primary btn-sm" onClick={() => handleAddCategory(newCategory)}>+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map((cat) => (
            <div key={cat._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{cat.name}</span>
              <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px' }}
                onClick={() => handleDeleteCategory(cat)}>✕</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
