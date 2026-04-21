import { useState } from 'react';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';

export default function PurchaseOrdersPage() {
  const [showPOModal, setShowPOModal] = useState(false);

  return (
    <div>
      <PurchaseOrdersTab showPOModal={showPOModal} setShowPOModal={setShowPOModal} />
    </div>
  );
}
