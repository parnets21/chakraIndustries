import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';

const tabs = ['Demand Forecast', 'Purchase Planning', 'Inventory Optimization', 'Seasonal Trends'];

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

const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";

export default function ForecastingPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const primaryBtn = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'8px 16px', borderRadius:10,
    background:'linear-gradient(135deg,#ef4444,#b91c1c)',
    color:'#fff', border:'none', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
    boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {activeTab === 0 && <button onClick={() => alert('📊 Generating demand forecast...')} style={primaryBtn}>Generate Forecast</button>}
        {activeTab === 1 && <button onClick={() => alert('📦 Auto-generating purchase orders...')} style={primaryBtn}>Auto-Generate POs</button>}
        {activeTab === 3 && <button onClick={() => alert('💾 Saving seasonal configuration...')} style={primaryBtn}>Save Config</button>}
      </div>
      {activeTab === 0 && (
        <div>
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
            <div className="text-sm font-bold text-gray-800 mb-3.5">SKU-wise Demand Forecast</div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['SKU','Item','Apr Actual','May Forecast','Jun Forecast','Jul Forecast','Trend'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { sku: 'SKU-1042', item: 'Bearing 6205', apr: 420, may: 450, jun: 480, jul: 510, trend: '+10%' },
                    { sku: 'SKU-3301', item: 'Piston Ring 80mm', apr: 580, may: 600, jun: 640, jul: 680, trend: '+8%' },
                    { sku: 'SKU-4412', item: 'Crankshaft Seal', apr: 380, may: 400, jun: 420, jul: 440, trend: '+6%' },
                    { sku: 'SKU-5523', item: 'Valve Spring Set', apr: 320, may: 350, jun: 360, jul: 370, trend: '+5%' },
                  ].map((r, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-mono text-xs font-semibold text-red-700`}>{r.sku}</td>
                      <td className={`${tdCls} font-semibold`}>{r.item}</td>
                      <td className={tdCls}>{r.apr}</td>
                      <td className={`${tdCls} font-bold text-amber-600`}>{r.may}</td>
                      <td className={`${tdCls} font-bold text-amber-600`}>{r.jun}</td>
                      <td className={`${tdCls} font-bold text-amber-600`}>{r.jul}</td>
                      <td className={`${tdCls} font-bold text-green-600`}>{r.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="text-sm font-bold text-gray-800">Suggested Purchase Orders</div>
            <button onClick={() => alert('📦 Auto-generating purchase orders...')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-white font-semibold border-0 cursor-pointer font-[inherit]">
              Auto-Generate POs
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['SKU','Item Name','Current Stock','Forecast Demand','Suggested Qty','Preferred Vendor','Urgency','Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {suggestedPurchases.map((s, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold text-red-700 font-mono`}>{s.sku}</td>
                    <td className={`${tdCls} font-semibold`}>{s.name}</td>
                    <td className={`${tdCls} font-bold ${s.currentStock < 50 ? 'text-red-500' : 'text-green-600'}`}>{s.currentStock}</td>
                    <td className={tdCls}>{s.forecastDemand}</td>
                    <td className={`${tdCls} font-bold`}>{s.suggestedQty}</td>
                    <td className={tdCls}>{s.vendor}</td>
                    <td className={tdCls}><StatusBadge status={s.urgency} type={s.urgency === 'Critical' ? 'danger' : s.urgency === 'Normal' ? 'warning' : 'info'} /></td>
                    <td className={tdCls}>
                      <button onClick={() => alert(`📦 Creating PO for ${s.sku}...`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Create PO</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Inventory Optimization Recommendations</div>
            {[
              { sku: 'SKU-1042', item: 'Bearing 6205', current: 12, optimal: 500, action: 'Reorder Immediately', color: '#ef4444' },
              { sku: 'SKU-3301', item: 'Piston Ring 80mm', current: 340, optimal: 400, action: 'Reorder Soon', color: '#f59e0b' },
              { sku: 'SKU-4412', item: 'Crankshaft Seal', current: 220, optimal: 250, action: 'Monitor', color: '#3b82f6' },
              { sku: 'SKU-6634', item: 'Timing Chain Kit', current: 0, optimal: 50, action: 'Clearance / Write-off', color: '#6b7280' },
            ].map((r, i) => (
              <div key={i} className={`py-3 ${i < 3 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <div className="font-semibold text-sm">{r.item}</div>
                    <div className="text-xs text-gray-400">{r.sku}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: r.color + '20', color: r.color }}>{r.action}</span>
                </div>
                <div className="flex gap-4 text-xs mt-1">
                  <span className="text-gray-400">Current: <strong className="text-gray-800">{r.current}</strong></span>
                  <span className="text-gray-400">Optimal: <strong className="text-gray-800">{r.optimal}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Stock Coverage (Days)</div>
            <div className="text-xs text-gray-400 mb-3">Days of stock remaining at current demand rate</div>
            <BarChart data={[
              { label: 'SKU-1042', value: 3, color: '#ef4444' },
              { label: 'SKU-2187', value: 5, color: '#ef4444' },
              { label: 'SKU-3301', value: 45, color: '#27ae60' },
              { label: 'SKU-4412', value: 38, color: '#27ae60' },
              { label: 'SKU-5523', value: 30, color: '#f39c12' },
            ]} height={200} />
          </div>
        </div>
      )}
      {activeTab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Seasonal Trend Configuration</div>
            <div className="text-xs text-gray-400 mb-4">Set demand multipliers per month to adjust forecasts for seasonal patterns</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => {
                const defaults = [0.8, 0.85, 1.0, 1.0, 1.1, 1.2, 1.1, 1.3, 1.4, 1.5, 1.6, 1.8];
                const color = defaults[i] >= 1.4 ? '#ef4444' : defaults[i] >= 1.1 ? '#f59e0b' : '#10b981';
                return (
                  <div key={m} className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-gray-500">{m}</label>
                    <input type="number" step="0.1" min="0.1" max="3"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit] text-center font-bold"
                      defaultValue={defaults[i]}
                      style={{ color }}
                    />
                  </div>
                );
              })}
            </div>
            <button onClick={() => alert('💾 Saving seasonal configuration...')} className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
              Save Seasonal Config
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Seasonal Demand Pattern</div>
            <BarChart data={[
              { label: 'Jan', value: 3360, color: '#10b981' },
              { label: 'Feb', value: 3570, color: '#10b981' },
              { label: 'Mar', value: 4200, color: '#10b981' },
              { label: 'Apr', value: 4200, color: '#10b981' },
              { label: 'May', value: 4620, color: '#f59e0b' },
              { label: 'Jun', value: 5040, color: '#f59e0b' },
              { label: 'Jul', value: 4620, color: '#f59e0b' },
              { label: 'Aug', value: 5460, color: '#ef4444' },
              { label: 'Sep', value: 5880, color: '#ef4444' },
              { label: 'Oct', value: 6300, color: '#ef4444' },
              { label: 'Nov', value: 6720, color: '#ef4444' },
              { label: 'Dec', value: 7560, color: '#ef4444' },
            ]} height={200} />
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Normal</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Peak</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
