import { useState } from 'react';
import GRNList from './grn/GRNList';
import CreateGRNModal from './grn/CreateGRNModal';
import GRNDetailModal from './grn/GRNDetailModal';

export default function GRNTab({ externalShowCreate, onExternalClose, onSaved }) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewGRN, setViewGRN]       = useState(null);
  const [refresh, setRefresh]       = useState(0);

  const isOpen = externalShowCreate || showCreate;

  const handleClose = () => { setShowCreate(false); onExternalClose?.(); };

  const handleSaved = () => {
    setRefresh(r => r + 1);
    onSaved?.();
    handleClose();
  };

  return (
    <div>
      {!externalShowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
       
        </div>
      )}

      <GRNList onView={(grn) => setViewGRN(grn)} refresh={refresh} />

      <CreateGRNModal open={isOpen} onClose={handleClose} onSaved={handleSaved} />

      <GRNDetailModal open={!!viewGRN} onClose={() => setViewGRN(null)} grn={viewGRN} />
    </div>
  );
}
