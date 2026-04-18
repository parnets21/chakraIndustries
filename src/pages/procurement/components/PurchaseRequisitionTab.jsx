import { useState } from 'react';
import PRList from './pr/PRList';
import CreatePRModal from './pr/CreatePRModal';

export default function PurchaseRequisitionTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const handleEdit = (pr) => { setEditData(pr); setShowCreate(true); };
  const handleSaved = () => setRefresh(r => r + 1);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => { setEditData(null); setShowCreate(true); }}>+ Create PR</button>
      </div>

      <PRList onEdit={handleEdit} refresh={refresh} />

      <CreatePRModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditData(null); }}
        onSaved={handleSaved}
        editData={editData}
      />
    </div>
  );
}
