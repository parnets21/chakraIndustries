import { useState } from 'react';
import Modal from '../../components/common/Modal';
import { departmentApi } from '../../api/departmentApi';
import PurchaseRequisitionTab from './components/PurchaseRequisitionTab';
import { useAuth } from '../../auth/AuthContext';
import { isViewOnly } from '../../auth/rbac';

export default function PurchaseRequisitionPage() {
  const { user } = useAuth();
  const viewOnly = isViewOnly(user?.role, 'procurement');
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [newDepartment, setNewDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll();
      setDepartments(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddDepartment = async (name) => {
    if (!name.trim()) return;
    try {
      const res = await departmentApi.create(name.trim());
      setDepartments(prev => [...prev, res.data]);
      setNewDepartment('');
    } catch (e) { alert(e.message); }
  };

  const handleDeleteDepartment = async (dept) => {
    try {
      await departmentApi.delete(dept._id);
      setDepartments(prev => prev.filter(d => d._id !== dept._id));
    } catch (e) { alert(e.message); }
  };

  const openDepartmentModal = () => { setShowDepartmentModal(true); loadDepartments(); };

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 16, gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a202c', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Purchase Requisition
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Procurement</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>›</span>
            <span style={{ fontSize: 11, color: '#c0392b', fontWeight: 600 }}>Purchase Requisition</span>
          </div>
        </div>
        {!viewOnly && (
          <button
            className="btn btn-outline"
            onClick={openDepartmentModal}
            style={{ fontSize: 13, whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            ⚙ Manage Departments
          </button>
        )}
      </div>

      <PurchaseRequisitionTab />

      {/* Manage Departments Modal */}
      <Modal
        open={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title="Manage Departments"
        footer={<button className="btn btn-primary" onClick={() => setShowDepartmentModal(false)}>Done</button>}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="form-input"
            placeholder="New department name..."
            value={newDepartment}
            onChange={e => setNewDepartment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddDepartment(newDepartment); }}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={() => handleAddDepartment(newDepartment)}
            style={{ flexShrink: 0, padding: '0 16px' }}>+</button>
        </div>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {departments.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No departments found</div>
            ) : departments.map((dept) => (
              <div key={dept._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
              }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{dept.name}</span>
                <button
                  className="btn btn-sm"
                  style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 12px', flexShrink: 0 }}
                  onClick={() => handleDeleteDepartment(dept)}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
