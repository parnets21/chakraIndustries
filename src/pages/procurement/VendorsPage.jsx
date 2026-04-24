import { useState, useEffect, useCallback } from 'react';
import { categoryApi } from '../../api/categoryApi';
import { vendorApi } from '../../api/vendorApi';
import { rfqApi } from '../../api/rfqApi';
import { poApi } from '../../api/poApi';
import Modal from '../../components/common/Modal';
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
import VendorsTab from './components/VendorsTab';
import { MdBusiness, MdCheckCircle, MdWarning, MdBlock, MdAdd } from 'react-icons/md';

export default function VendorsPage() {
  const [categories, setCategories]         = useState([]);
  const [newCategory, setNewCategory]       = useState('');
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

  useEffect(() => {
    categoryApi.getAll()
      .then(res => setCategories(res.data || []))
      .catch(() => {});
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowCategoryModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Categories
            </button>
            <button
              onClick={() => setShowVendorModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 3px 10px rgba(185,28,28,0.3)' }}
            >
              <MdAdd size={18} /> Add Vendor
            </button>
          </div>
        }
      />

      <KpiStrip kpis={kpis} />

      <PageCard>
        <VendorsTab
          categories={categoryNames}
          categoriesRaw={categories}
          showVendorModal={showVendorModal}
          setShowVendorModal={setShowVendorModal}
          showCategoryModal={showCategoryModal}
          setShowCategoryModal={setShowCategoryModal}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onStatsChange={fetchStats}
        />
      </PageCard>

      {/* Manage Categories Modal */}
      <Modal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Manage Vendor Categories"
        footer={
          <button onClick={() => setShowCategoryModal(false)} style={{ padding: '8px 18px', borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Done</button>
        }
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            placeholder="New category name..."
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(newCategory); }}
            onFocus={e => e.target.style.borderColor = '#ef4444'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <button
            onClick={() => handleAddCategory(newCategory)}
            style={{ padding: '9px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14 }}
          >+</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: 13 }}>No categories yet. Add one above.</div>
          )}
          {categories.map((cat) => (
            <div key={cat._id || cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{cat.name || cat}</span>
              <button
                onClick={() => handleDeleteCategory(cat)}
                style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
              >Remove</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
