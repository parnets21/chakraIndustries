import { useState } from 'react';
import RFQList from './rfq/RFQList';
import CreateRFQModal from './rfq/CreateRFQModal';
import CompareQuotesModal from './rfq/CompareQuotesModal';

export default function RFQTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [compareRFQ, setCompareRFQ] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const handleSaved = () => {
    setRefresh(r => r + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create RFQ</button>
      </div>

      <RFQList onCompare={(rfq) => setCompareRFQ(rfq)} refresh={refresh} />

      <CreateRFQModal open={showCreate} onClose={() => setShowCreate(false)} onSaved={handleSaved} />

      <CompareQuotesModal
        open={!!compareRFQ}
        onClose={() => setCompareRFQ(null)}
        rfq={compareRFQ}
      />
    </div>
  );
}
