import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';

const syncLogs = [
  { id: 'SYN-001', type: 'Inventory Sync', direction: 'Push', records: 142, status: 'Success', time: '15 Apr, 10:30 AM', duration: '4.2s' },
  { id: 'SYN-002', type: 'Order Pull', direction: 'Pull', records: 18, status: 'Success', time: '15 Apr, 09:00 AM', duration: '2.1s' },
  { id: 'SYN-003', type: 'SKU Master Sync', direction: 'Push', records: 320, status: 'Failed', time: '14 Apr, 06:00 PM', duration: '—', error: 'API timeout — 30s limit exceeded' },
  { id: 'SYN-004', type: 'Stock Update', direction: 'Push', records: 88, status: 'Success', time: '14 Apr, 03:00 PM', duration: '3.8s' },
  { id: 'SYN-005', type: 'Order Pull', direction: 'Pull', records: 24, status: 'Partial', time: '14 Apr, 12:00 PM', duration: '5.1s', error: '3 records skipped — missing SKU mapping' },
];

const skuMismatches = [
  { sku: 'SKU-1042', name: 'Bearing 6205', localStock: 12, vinculumStock: 15, diff: -3, status: 'Mismatch' },
  { sku: 'SKU-3301', name: 'Piston Ring 80mm', localStock: 340, vinculumStock: 340, diff: 0, status: 'Matched' },
  { sku: 'SKU-4412', name: 'Crankshaft Seal', localStock: 220, vinculumStock: 218, diff: 2, status: 'Mismatch' },
  { sku: 'SKU-5523', name: 'Valve Spring Set', localStock: 180, vinculumStock: 180, diff: 0, status: 'Matched' },
  { sku: 'SKU-7745', name: 'Clutch Plate Set', localStock: 95, vinculumStock: 0, diff: 95, status: 'Mismatch' },
];

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';

export default function VinculumPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [syncing, setSyncing] = useState(false);
  const [apiKey, setApiKey] = useState('vc_live_••••••••••••••••••••••••');
  const [showKey, setShowKey] = useState(false);

  const tabs = ['API Configuration', 'Sync Logs', 'SKU Matching', 'Manual Sync'];

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2500);
  };

  const kpis = [
    { label: 'Last Sync', value: '10:30 AM', color: '#10b981' },
    { label: 'Total Synced Today', value: '572', color: '#3b82f6' },
    { label: 'Failed Syncs', value: syncLogs.filter(l => l.status === 'Failed').length, color: '#ef4444' },
    { label: 'SKU Mismatches', value: skuMismatches.filter(s => s.status === 'Mismatch').length, color: '#f59e0b' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab 0: API Configuration */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">API Credentials</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">API Key</label>
                <div className="flex gap-2">
                  <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => setApiKey(e.target.value)} className={inputCls} />
                  <button onClick={() => setShowKey(s => !s)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer font-[inherit]">{showKey ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Base URL</label>
                <input className={inputCls} defaultValue="https://api.vinculum.co.in/v1" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Warehouse Code</label>
                <input className={inputCls} defaultValue="WH-CHAKRA-01" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Sync Frequency</label>
                <select className={inputCls}>
                  <option>Every 15 minutes</option>
                  <option>Every 30 minutes</option>
                  <option>Every 1 hour</option>
                  <option>Manual only</option>
                </select>
              </div>
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
                Save Configuration
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Connection Status</div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <div>
                <div className="font-bold text-sm text-green-800">Connected</div>
                <div className="text-xs text-green-600">Last ping: 2 minutes ago</div>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-800 mb-3">Sync Settings</div>
            {[
              { label: 'Inventory Sync', enabled: true },
              { label: 'Order Pull', enabled: true },
              { label: 'SKU Master Sync', enabled: true },
              { label: 'Price Sync', enabled: false },
              { label: 'Return Sync', enabled: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{s.label}</span>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${s.enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${s.enabled ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: Sync Logs */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Sync Logs</div>
              <div className="text-xs text-gray-400 mt-0.5">Last 24 hours of sync activity</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">Export Logs</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>{['Sync ID', 'Type', 'Direction', 'Records', 'Status', 'Time', 'Duration', 'Error'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {syncLogs.map((log, i) => (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors ${log.status === 'Failed' ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] text-red-700">{log.id}</td>
                    <td className="px-4 py-3 align-middle font-semibold text-sm">{log.type}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.direction === 'Push' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{log.direction}</span>
                    </td>
                    <td className="px-4 py-3 align-middle font-bold">{log.records}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={log.status} type={log.status === 'Success' ? 'success' : log.status === 'Partial' ? 'warning' : 'danger'} /></td>
                    <td className="px-4 py-3 align-middle text-xs text-gray-500">{log.time}</td>
                    <td className="px-4 py-3 align-middle text-xs text-gray-500">{log.duration}</td>
                    <td className="px-4 py-3 align-middle text-xs text-red-500 max-w-[200px] truncate">{log.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: SKU Matching */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">SKU-Level Stock Matching</div>
              <div className="text-xs text-gray-400 mt-0.5">Compare local stock vs Vinculum stock across SKUs</div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                {skuMismatches.filter(s => s.status === 'Mismatch').length} Mismatches
              </span>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Run Match</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
            <table className="w-full">
              <thead>
                <tr>{['SKU', 'Name', 'Local Stock', 'Vinculum Stock', 'Difference', 'Status', 'Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {skuMismatches.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors ${row.status === 'Mismatch' ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] text-red-700">{row.sku}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{row.name}</td>
                    <td className="px-4 py-3 align-middle font-bold text-blue-600">{row.localStock}</td>
                    <td className="px-4 py-3 align-middle font-bold text-purple-600">{row.vinculumStock}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${row.diff === 0 ? 'text-green-600' : 'text-red-500'}`}>{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={row.status} type={row.status === 'Matched' ? 'success' : 'danger'} /></td>
                    <td className="px-4 py-3 align-middle">
                      {row.status === 'Mismatch' ? (
                        <button className="px-2 py-1 text-[11px] rounded-lg bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]">Adjust</button>
                      ) : <span className="text-green-600 text-xs">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200">
            <div className="font-bold text-sm text-amber-800 mb-1">Suggested Adjustments</div>
            <div className="text-xs text-amber-700">3 SKUs have stock mismatches. Recommended: push local stock values to Vinculum or investigate discrepancy before adjusting.</div>
          </div>
        </div>
      )}

      {/* Tab 3: Manual Sync */}
      {activeTab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Manual Sync Trigger</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Sync Type</label>
                <select className={inputCls}>
                  <option>Inventory Sync</option>
                  <option>Order Pull</option>
                  <option>SKU Master Sync</option>
                  <option>Full Sync</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Date Range (optional)</label>
                <div className="flex gap-2">
                  <input type="date" className={inputCls} />
                  <input type="date" className={inputCls} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">SKU Filter (optional)</label>
                <input className={inputCls} placeholder="e.g. SKU-1042, SKU-3301" />
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit] disabled:opacity-60"
              >
                {syncing ? '⟳ Syncing...' : '⟳ Start Sync'}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Sync Progress</div>
            {syncing ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-semibold text-blue-700">Sync in progress...</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <div className="text-xs text-gray-500">Processing records...</div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">⟳</div>
                <div className="text-sm">No sync in progress</div>
                <div className="text-xs mt-1">Trigger a sync from the left panel</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
