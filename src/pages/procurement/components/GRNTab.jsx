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
      <GRNList onView={(grn) => setViewGRN(grn)} />

      <CreateGRNModal open={isOpen} onClose={handleClose} />

      <GRNDetailModal open={!!viewGRN} onClose={() => setViewGRN(null)} grn={viewGRN} />
    </div>
  );
}
