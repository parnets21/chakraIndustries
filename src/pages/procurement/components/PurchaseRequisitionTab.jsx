import { useState } from 'react';
import PRList from './pr/PRList';
import CreatePRModal from './pr/CreatePRModal';

export default function PurchaseRequisitionTab() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create PR</button>
      </div>

      <PRList />

      <CreatePRModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
