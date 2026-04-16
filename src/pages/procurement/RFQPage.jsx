import RFQTab from './components/RFQTab';

export default function RFQPage() {
  return (
    <div>
      <div className="mb-4">
        <div className="text-xl font-black text-gray-900 tracking-tight">RFQ Management</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">Procurement</span>
          <span className="text-xs text-gray-400">›</span>
          <span className="text-xs text-red-600 font-semibold">RFQ</span>
        </div>
      </div>
      <RFQTab />
    </div>
  );
}
