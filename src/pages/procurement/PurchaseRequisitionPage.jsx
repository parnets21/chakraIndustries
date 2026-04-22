import { useState } from 'react';
<<<<<<< HEAD
import { PageHeader, KpiStrip, PageCard } from '../../components/common/PageShell';
=======
import Modal from '../../components/common/Modal';
import { departmentApi } from '../../api/departmentApi';
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93
import PurchaseRequisitionTab from './components/PurchaseRequisitionTab';
import { prs } from './components/data';
import { MdAssignment, MdHourglassEmpty, MdCheckCircle, MdCancel, MdAdd } from 'react-icons/md';

export default function PurchaseRequisitionPage() {
<<<<<<< HEAD
  const [showCreate, setShowCreate] = useState(false);

  const pending  = prs.filter(p => p.status === 'Pending').length;
  const approved = prs.filter(p => p.status === 'Approved').length;
  const rejected = prs.filter(p => p.status === 'Rejected').length;

  const kpis = [
    { label: 'Total PRs',  value: prs.length, icon: <MdAssignment size={18} />,     color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
    { label: 'Pending',    value: pending,    icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
    { label: 'Approved',   value: approved,   icon: <MdCheckCircle size={18} />,    color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    { label: 'Rejected',   value: rejected,   icon: <MdCancel size={18} />,         color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)' },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Requisitions"
        breadcrumb="Procurement › PR List"
        action={
          <button onClick={() => setShowCreate(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
          }}>
            <MdAdd size={16} /> Create PR
          </button>
        }
      />

      <KpiStrip kpis={kpis} />

      <PageCard noPad>
        <div style={{ padding: '20px 20px 0' }}>
          <PurchaseRequisitionTab
            externalShowCreate={showCreate}
            onExternalClose={() => setShowCreate(false)}
          />
        </div>
      </PageCard>
=======
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  // Load departments
  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll();
      setDepartments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add department
  const handleAddDepartment = async (name) => {
    if (!name.trim()) return;
    try {
      const res = await departmentApi.create(name.trim());
      setDepartments(prev => [...prev, res.data]);
      setNewDepartment('');
    } catch (e) {
      alert(e.message);
    }
  };

  // Delete department
  const handleDeleteDepartment = async (dept) => {
    try {
      await departmentApi.delete(dept._id);
      setDepartments(prev => prev.filter(d => d._id !== dept._id));
    } catch (e) {
      alert(e.message);
    }
  };

  // Open modal and load departments
  const openDepartmentModal = () => {
    setShowDepartmentModal(true);
    loadDepartments();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Purchase Requisition Workflow</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Procurement</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Purchase Requisition</span>
          </div>
        </div>
        <button className="btn btn-outline" onClick={openDepartmentModal}>⚙ Manage Departments</button>
      </div>

      <PurchaseRequisitionTab />

      {/* Manage Departments Modal */}
      <Modal open={showDepartmentModal} onClose={() => setShowDepartmentModal(false)} title="Manage Departments"
        footer={<button className="btn btn-primary" onClick={() => setShowDepartmentModal(false)}>Done</button>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="form-input" placeholder="New department name..." value={newDepartment}
            onChange={e => setNewDepartment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddDepartment(newDepartment); }} />
          <button className="btn btn-primary btn-sm" onClick={() => handleAddDepartment(newDepartment)}>+</button>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No departments found</div>
            ) : departments.map((dept) => (
              <div key={dept._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{dept.name}</span>
                <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 10px' }}
                  onClick={() => handleDeleteDepartment(dept)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </Modal>
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93
    </div>
  );
}
