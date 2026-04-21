import { useState } from 'react';
import PRList from './pr/PRList';
import CreatePRModal from './pr/CreatePRModal';

export default function PurchaseRequisitionTab({ externalShowCreate, onExternalClose }) {
  const [showCreate, setShowCreate] = useState(false);
  const [editData, setEditData] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const isOpen = externalShowCreate || showCreate;
  const handleClose = () => { setShowCreate(false); setEditData(null); onExternalClose?.(); };

  const handleEdit = (pr) => { setEditData(pr); setShowCreate(true); };
  const handleSaved = () => setRefresh(r => r + 1);

  return (
    <div>
      {!externalShowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button className="btn btn-primary" onClick={() => { setEditData(null); setShowCreate(true); }}>+ Create PR</button>
        </div>
      )}

      <PRList onEdit={handleEdit} refresh={refresh} />

      <CreatePRModal
        open={isOpen}
        onClose={handleClose}
        onSaved={handleSaved}
        editData={editData}
      />
    </div>
  );
}
