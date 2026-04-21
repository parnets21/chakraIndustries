import { useState } from 'react';
import GRNList from './grn/GRNList';
import CreateGRNModal from './grn/CreateGRNModal';
import GRNDetailModal from './grn/GRNDetailModal';

export default function GRNTab({ externalShowCreate, onExternalClose }) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewGRN, setViewGRN] = useState(null);

  const isOpen = externalShowCreate || showCreate;
  const handleClose = () => { setShowCreate(false); onExternalClose?.(); };

  return (
    <div>
      {!externalShowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create GRN</button>
        </div>
      )}

      <GRNList onView={(grn) => setViewGRN(grn)} />

      <CreateGRNModal open={isOpen} onClose={handleClose} />

      <GRNDetailModal open={!!viewGRN} onClose={() => setViewGRN(null)} grn={viewGRN} />
    </div>
  );
}
