import { useState } from 'react';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';

export default function PurchaseOrdersPage() {
  const [showPOModal, setShowPOModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Purchase Order Creation</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Procurement</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Purchase Orders</span>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
          onClick={() => setShowPOModal(true)}>+ New PO</button>
      </div>
      <PurchaseOrdersTab showPOModal={showPOModal} setShowPOModal={setShowPOModal} />
    </div>
  );
}
