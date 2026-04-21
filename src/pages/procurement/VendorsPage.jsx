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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Vendor Onboarding & Categorization</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Procurement</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Vendors</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]"
            onClick={() => setShowCategoryModal(true)}>⚙ Categories</button>
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
            onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>
        </div>
      </div>
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
