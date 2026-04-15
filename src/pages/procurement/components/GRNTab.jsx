import { useState } from 'react';
import GRNList from './grn/GRNList';
import CreateGRNModal from './grn/CreateGRNModal';
import GRNDetailModal from './grn/GRNDetailModal';

export default function GRNTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [viewGRN, setViewGRN] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create GRN</button>
      </div>

      <GRNList onView={(grn) => setViewGRN(grn)} />

      <CreateGRNModal open={showCreate} onClose={() => setShowCreate(false)} />

      <GRNDetailModal open={!!viewGRN} onClose={() => setViewGRN(null)} grn={viewGRN} />
    </div>
  );
}
