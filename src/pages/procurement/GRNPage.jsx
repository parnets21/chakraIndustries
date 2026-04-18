import GRNTab from './components/GRNTab';

export default function GRNPage() {
  return (
    <div>
      <div className="mb-4">
        <div className="text-xl font-black text-gray-900 tracking-tight">Goods Receipt Note (GRN)</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">Procurement</span>
          <span className="text-xs text-gray-400">›</span>
          <span className="text-xs text-red-600 font-semibold">GRN</span>
        </div>
      </div>
      <GRNTab />
    </div>
  );
}
