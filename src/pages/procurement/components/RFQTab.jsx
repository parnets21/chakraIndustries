import { useState } from 'react';
import RFQList from './rfq/RFQList';
import CreateRFQModal from './rfq/CreateRFQModal';
import CompareQuotesModal from './rfq/CompareQuotesModal';

export default function RFQTab({ externalShowCreate, onExternalClose }) {
  const [showCreate, setShowCreate] = useState(false);
  const [compareRFQ, setCompareRFQ] = useState(null);

  const isOpen = externalShowCreate || showCreate;
  const handleClose = () => { setShowCreate(false); onExternalClose?.(); };

  return (
    <div>
      {!externalShowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create RFQ</button>
        </div>
      )}

      <RFQList onCompare={(rfq) => setCompareRFQ(rfq)} />

      <CreateRFQModal open={isOpen} onClose={handleClose} />

      <CompareQuotesModal
        open={!!compareRFQ}
        onClose={() => setCompareRFQ(null)}
        rfq={compareRFQ}
      />
    </div>
  );
}
