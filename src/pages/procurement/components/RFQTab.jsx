import { useState } from 'react';
import RFQList from './rfq/RFQList';
import CreateRFQModal from './rfq/CreateRFQModal';
import CompareQuotesModal from './rfq/CompareQuotesModal';

export default function RFQTab({ externalShowCreate, onExternalClose }) {
  const [compareRFQ, setCompareRFQ] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const handleSaved = () => {
    setRefresh(r => r + 1);
  };

  const handleClose = () => { onExternalClose?.(); };

  return (
    <div>
      <RFQList onCompare={(rfq) => setCompareRFQ(rfq)} refresh={refresh} />

      <CreateRFQModal open={externalShowCreate} onClose={handleClose} onSaved={handleSaved} />

      <CompareQuotesModal
        open={!!compareRFQ}
        onClose={() => setCompareRFQ(null)}
        rfq={compareRFQ}
      />
    </div>
  );
}
