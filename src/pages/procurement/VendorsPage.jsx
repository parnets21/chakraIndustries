import { useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import { vendorApi } from '../../api/vendorApi';
import { categoryApi } from '../../api/categoryApi';
=======
import { categoryApi } from '../../api/categoryApi';
import { vendorApi } from '../../api/vendorApi';
import Modal from '../../components/common/Modal';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93
import VendorsTab from './components/VendorsTab';
import { MdBusiness, MdCheckCircle, MdWarning, MdBlock, MdAdd, MdCategory } from 'react-icons/md';

export default function VendorsPage() {
<<<<<<< HEAD
  const [categories, setCategories]               = useState(defaultCategories);
  const [newCategory, setNewCategory]             = useState('');
  const [showVendorModal, setShowVendorModal]     = useState(false);
=======
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blacklisted: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const res = await vendorApi.getAll({});
      const list = res.data || [];
      setStats({
        total:       list.length,
        active:      list.filter(v => v.status === 'Active').length,
        inactive:    list.filter(v => v.status === 'Inactive').length,
        blacklisted: list.filter(v => v.status === 'Blacklisted').length,
      });
    } catch (_) {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Load categories from DB
  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(res.data)).catch(() => {});
  }, []);

  const handleAddCategory = async (name) => {
    if (!name?.trim()) return;
    try {
      const res = await categoryApi.create(name.trim());
      setCategories(prev => [...prev, res.data]);
      setNewCategory('');
    } catch (e) { alert(e.message); }
  };

  const handleDeleteCategory = async (cat) => {
    // If cat is a plain string (default category, not yet in DB), just remove from local state
    if (!cat._id) {
      setCategories(prev => prev.filter(c => (c.name || c) !== (cat.name || cat)));
      return;
    }
    try {
      await categoryApi.delete(cat._id);
      setCategories(prev => prev.filter(c => c._id !== cat._id));
    } catch (e) { alert(e.message); }
  };

  const kpis = [
    { label: 'Total Vendors',   value: stats.total,       icon: <MdBusiness size={18} />,    color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Active',          value: stats.active,      icon: <MdCheckCircle size={18} />, color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Inactive',        value: stats.inactive,    icon: <MdWarning size={18} />,     color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Blacklisted',     value: stats.blacklisted, icon: <MdBlock size={18} />,       color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)' },
  ];

  const categoryNames = categories.map(c => c.name || c);

  return (
    <div>
      <PageHeader
        title="Vendor Management"
        breadcrumb="Procurement › Vendors"
        action={
          <button
            onClick={() => setShowVendorModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
            }}
          >
            <MdAdd size={18} />
            <span>Add Vendor</span>
          </button>
        }
      />

      <KpiStrip kpis={kpis} />

<<<<<<< HEAD
      <PageCard noPad>
        <div style={{ padding: '20px 20px 0' }}>
          <VendorsTab
            categories={categoryNames}
            categoriesRaw={categories}
            setCategories={setCategories}
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            showVendorModal={showVendorModal}
            setShowVendorModal={setShowVendorModal}
            showCategoryModal={showCategoryModal}
            setShowCategoryModal={setShowCategoryModal}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        </div>
      </PageCard>
=======
      <PageCard>
        <VendorsTab
          categories={categoryNames}
          showVendorModal={showVendorModal}
          setShowVendorModal={setShowVendorModal}
        />
      </PageCard>

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
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93
    </div>
  );
}
