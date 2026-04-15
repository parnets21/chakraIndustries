import { useState } from 'react';
import RFQList from './rfq/RFQList';
import CreateRFQModal from './rfq/CreateRFQModal';
import CompareQuotesModal from './rfq/CompareQuotesModal';

export default function RFQTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [compareRFQ, setCompareRFQ] = useState(null);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create RFQ</button>
      </div>

      <RFQList onCompare={(rfq) => setCompareRFQ(rfq)} />

      <CreateRFQModal open={showCreate} onClose={() => setShowCreate(false)} />

      <CompareQuotesModal
        open={!!compareRFQ}
        onClose={() => setCompareRFQ(null)}
        rfq={compareRFQ}
      />
    </div>
  );
}
