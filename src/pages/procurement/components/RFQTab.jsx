import { useState } from 'react';
import RFQList from './rfq/RFQList';
import CreateRFQModal from './rfq/CreateRFQModal';
import CompareQuotesModal from './rfq/CompareQuotesModal';

export default function RFQTab({ externalShowCreate, onExternalClose }) {
  const [showCreate, setShowCreate] = useState(false);
  const [compareRFQ, setCompareRFQ] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const handleSaved = () => {
    setRefresh(r => r + 1);
  };

  const isOpen = externalShowCreate || showCreate;
  const handleClose = () => { setShowCreate(false); onExternalClose?.(); };

  return (
    <div>
      {!externalShowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create RFQ</button>
        </div>
      )}

      <RFQList onCompare={(rfq) => setCompareRFQ(rfq)} refresh={refresh} />

<<<<<<< HEAD
      <CreateRFQModal open={isOpen} onClose={handleClose} />
=======
      <CreateRFQModal open={showCreate} onClose={() => setShowCreate(false)} onSaved={handleSaved} />
>>>>>>> 8e7ffc4ffa5529936c00c86da72f3d0474bbc628

      <CompareQuotesModal
        open={!!compareRFQ}
        onClose={() => setCompareRFQ(null)}
        rfq={compareRFQ}
      />
    </div>
  );
}
