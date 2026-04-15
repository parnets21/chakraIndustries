import StatusBadge from '../../components/common/StatusBadge';
import LineChart from '../../components/charts/LineChart';

const demandData = [
  { label: 'Jan', value: 4200 }, { label: 'Feb', value: 4800 }, { label: 'Mar', value: 5100 },
  { label: 'Apr', value: 4900 }, { label: 'May', value: 5600 }, { label: 'Jun', value: 6200 },
  { label: 'Jul', value: 5800 }, { label: 'Aug', value: 6800 }, { label: 'Sep', value: 7200 },
  { label: 'Oct', value: 7800 }, { label: 'Nov', value: 8400 }, { label: 'Dec', value: 9200 },
];

const forecastData = [
  { label: 'May', value: 6200 }, { label: 'Jun', value: 6800 }, { label: 'Jul', value: 7100 },
  { label: 'Aug', value: 7600 }, { label: 'Sep', value: 8200 }, { label: 'Oct', value: 8900 },
];

const suggestedPurchases = [
  { sku: 'SKU-1042', name: 'Bearing 6205', currentStock: 12, forecastDemand: 450, suggestedQty: 500, vendor: 'Global Bearings Ltd', urgency: 'Critical' },
  { sku: 'SKU-2187', name: 'Oil Seal 35x52', currentStock: 8, forecastDemand: 280, suggestedQty: 300, vendor: 'National Seals', urgency: 'Critical' },
  { sku: 'SKU-3301', name: 'Piston Ring 80mm', currentStock: 340, forecastDemand: 600, suggestedQty: 400, vendor: 'Shree Metals', urgency: 'Normal' },
  { sku: 'SKU-4412', name: 'Crankshaft Seal', currentStock: 220, forecastDemand: 400, suggestedQty: 250, vendor: 'National Seals', urgency: 'Normal' },
  { sku: 'SKU-5523', name: 'Valve Spring Set', currentStock: 180, forecastDemand: 350, suggestedQty: 200, vendor: 'Precision Parts', urgency: 'Low' },
];

export default function ForecastingPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Demand Forecasting</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Forecasting</span>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
          Generate Forecast
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Historical Demand</div>
          <div className="text-xs text-gray-400 mt-0.5 mb-3">Units sold — FY 2024-25</div>
          <LineChart data={demandData} color="#c0392b" height={180} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Demand Forecast</div>
          <div className="text-xs text-gray-400 mt-0.5 mb-3">Projected — Next 6 months</div>
          <LineChart data={forecastData} color="#f39c12" height={180} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-sm font-bold text-gray-800">Suggested Purchase Orders</div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-white font-semibold border-0 cursor-pointer font-[inherit]">
            Auto-Generate POs
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr>
                {['SKU','Item Name','Current Stock','Forecast Demand','Suggested Qty','Preferred Vendor','Urgency','Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suggestedPurchases.map((s, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                  <td className="px-4 py-3 align-middle font-semibold text-red-700 font-mono">{s.sku}</td>
                  <td className="px-4 py-3 align-middle font-semibold text-gray-800">{s.name}</td>
                  <td className={`px-4 py-3 align-middle font-bold ${s.currentStock < 50 ? 'text-red-500' : 'text-green-600'}`}>{s.currentStock}</td>
                  <td className="px-4 py-3 text-gray-800 align-middle">{s.forecastDemand}</td>
                  <td className="px-4 py-3 align-middle font-bold text-gray-800">{s.suggestedQty}</td>
                  <td className="px-4 py-3 text-gray-800 align-middle">{s.vendor}</td>
                  <td className="px-4 py-3 text-gray-800 align-middle">
                    <StatusBadge status={s.urgency} type={s.urgency === 'Critical' ? 'danger' : s.urgency === 'Normal' ? 'warning' : 'info'} />
                  </td>
                  <td className="px-4 py-3 text-gray-800 align-middle">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">
                      Create PO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
