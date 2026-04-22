import { useState, useEffect, useCallback } from 'react';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import { vendorApi } from '../../api/vendorApi';
import { categoryApi } from '../../api/categoryApi';
import VendorsTab from './components/VendorsTab';
import { defaultCategories } from './components/data';
import { MdBusiness, MdCheckCircle, MdWarning, MdBlock, MdAdd, MdCategory } from 'react-icons/md';

export default function VendorsPage() {
  const [categories, setCategories]               = useState(defaultCategories);
  const [newCategory, setNewCategory]             = useState('');
  const [showVendorModal, setShowVendorModal]     = useState(false);
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
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowCategoryModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: '1.5px solid #c0392b',
              background: 'transparent', color: '#c0392b', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            }}>
              <MdCategory size={15} /> Categories
            </button>
            <button onClick={() => setShowVendorModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
            }}>
              <MdAdd size={16} /> Add Vendor
            </button>
          </div>
        }
      />

      <KpiStrip kpis={kpis} />

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
    </div>
  );
}
