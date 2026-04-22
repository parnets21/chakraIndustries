import { useState } from 'react';
import RFQList from './rfq/RFQList';
import CreateRFQModal from './rfq/CreateRFQModal';
import CompareQuotesModal from './rfq/CompareQuotesModal';

export default function RFQTab({ externalShowCreate, onExternalClose }) {
  const [compareRFQ, setCompareRFQ] = useState(null);
  const [refresh, setRefresh] = useState(0);

<<<<<<< HEAD
  const isOpen = externalShowCreate || showCreate;
  const handleClose = () => { setShowCreate(false); onExternalClose?.(); };
  const handleSaved = () => setRefresh(r => r + 1);
=======
  const handleSaved = () => {
    setRefresh(r => r + 1);
  };

  const handleClose = () => { onExternalClose?.(); };
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93

  return (
    <div>
      <RFQList onCompare={(rfq) => setCompareRFQ(rfq)} refresh={refresh} />

<<<<<<< HEAD
      <CreateRFQModal open={isOpen} onClose={handleClose} onSaved={handleSaved} />
=======
      <CreateRFQModal open={externalShowCreate} onClose={handleClose} onSaved={handleSaved} />
>>>>>>> 89bc8f5e1bbee013908cd9e5d8c1b539f487bb93

      <CompareQuotesModal
        open={!!compareRFQ}
        onClose={() => setCompareRFQ(null)}
        rfq={compareRFQ}
      />
    </div>
  );
}
