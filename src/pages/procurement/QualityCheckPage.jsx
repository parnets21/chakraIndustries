import QualityCheckTab from './components/QualityCheckTab';

export default function QualityCheckPage() {
  return (
    <div>
      <div className="mb-4">
        <div className="text-xl font-black text-gray-900 tracking-tight">Quality Inspection</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">Procurement</span>
          <span className="text-xs text-gray-400">›</span>
          <span className="text-xs text-red-600 font-semibold">Quality Check</span>
        </div>
      </div>
      <QualityCheckTab />
    </div>
  );
}
