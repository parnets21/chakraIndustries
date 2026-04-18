import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const tabs = ['Sync Dashboard', 'Master Data Sync', 'Transaction Sync', 'Sync Logs', 'Configuration'];

const syncLogs = [
  { id: 'SYNC-2024-089', type: 'Purchase', entity: 'PO-2024-089', direction: 'ERP → Tally', status: 'Success', time: '14 Apr, 10:32 AM', duration: '2.3s', error: '' },
  { id: 'SYNC-2024-088', type: 'Sales', entity: 'INV-2024-088', direction: 'ERP → Tally', status: 'Success', time: '14 Apr, 09:15 AM', duration: '1.8s', error: '' },
  { id: 'SYNC-2024-087', type: 'Payment', entity: 'PAY-0234', direction: 'ERP → Tally', status: 'Failed', time: '13 Apr, 04:45 PM', duration: '5.2s', error: 'Connection timeout - Tally server not responding' },
  { id: 'SYNC-2024-086', type: 'Ledger', entity: 'LED-1042', direction: 'Tally → ERP', status: 'Success', time: '13 Apr, 02:10 PM', duration: '1.2s', error: '' },
  { id: 'SYNC-2024-085', type: 'Item Master', entity: 'SKU-2187', direction: 'Tally → ERP', status: 'Failed', time: '12 Apr, 11:30 AM', duration: '3.5s', error: 'Duplicate item code found' },
];

const masterDataStatus = [
  { category: 'Items', total: 1240, synced: 1240, pending: 0, failed: 0, lastSync: '14 Apr, 09:00 AM', status: 'Synced' },
  { category: 'Ledgers', total: 342, synced: 340, pending: 0, failed: 2, lastSync: '14 Apr, 09:05 AM', status: 'Partial' },
  { category: 'GST Rates', total: 8, synced: 8, pending: 0, failed: 0, lastSync: '14 Apr, 09:00 AM', status: 'Synced' },
  { category: 'Units', total: 24, synced: 24, pending: 0, failed: 0, lastSync: '14 Apr, 09:00 AM', status: 'Synced' },
  { category: 'Godowns', total: 5, synced: 5, pending: 0, failed: 0, lastSync: '14 Apr, 09:00 AM', status: 'Synced' },
];

const transactionStatus = [
  { type: 'Purchase Vouchers', today: 12, synced: 12, pending: 0, failed: 0, lastSync: '14 Apr, 10:32 AM', status: 'Synced' },
  { type: 'Sales Vouchers', today: 18, synced: 17, pending: 1, failed: 0, lastSync: '14 Apr, 10:15 AM', status: 'Pending' },
  { type: 'Payment Vouchers', today: 8, synced: 7, pending: 0, failed: 1, lastSync: '13 Apr, 04:45 PM', status: 'Failed' },
  { type: 'Receipt Vouchers', today: 6, synced: 6, pending: 0, failed: 0, lastSync: '14 Apr, 09:30 AM', status: 'Synced' },
  { type: 'Journal Vouchers', today: 3, synced: 3, pending: 0, failed: 0, lastSync: '14 Apr, 08:45 AM', status: 'Synced' },
];

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]";
const selectCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]";
const labelCls = "text-xs font-semibold text-gray-600";
const fieldCls = "flex flex-col gap-1.5 mb-4";
const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";
const btnPrimary = "inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]";
const btnOutline = "inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]";
const btnSm = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg";

export default function TallyPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connected');

  const handleManualSync = (type) => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  const kpis = [
    { label: 'Connection Status', value: connectionStatus, color: connectionStatus === 'Connected' ? '#10b981' : '#ef4444', icon: '🔗' },
    { label: 'Last Full Sync', value: '14 Apr, 09:00 AM', color: '#3b82f6', icon: '🔄' },
    { label: 'Today\'s Syncs', value: '47', color: '#8b5cf6', icon: '📊' },
    { label: 'Failed Syncs', value: '2', color: '#f59e0b', icon: '⚠️' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Tally Integration</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Tally Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={btnOutline} onClick={() => setShowConfigModal(true)}>⚙️ Configuration</button>
          <button className={btnPrimary} onClick={() => handleManualSync('all')} disabled={syncing}>
            {syncing ? '🔄 Syncing...' : '🔄 Sync Now'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{k.icon}</span>
              <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            </div>
            <div className="text-xs text-gray-500 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer flex-shrink-0 bg-transparent font-[inherit] ${
              activeTab === i
                ? 'text-red-700 border-red-600'
                : 'text-gray-400 border-transparent hover:text-red-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Sync Dashboard */}
      {activeTab === 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total Syncs Today', value: '47', subtext: '+12 vs yesterday', color: '#3b82f6' },
              { label: 'Success Rate', value: '95.7%', subtext: '45 success / 47 total', color: '#10b981' },
              { label: 'Avg Sync Time', value: '2.1s', subtext: 'Per transaction', color: '#8b5cf6' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="text-xs text-gray-500 font-medium mb-1">{stat.label}</div>
                <div className="text-3xl font-black tracking-tight mb-1" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[11px] text-gray-400">{stat.subtext}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Master Data Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-gray-800">Master Data Status</div>
                  <div className="text-xs text-gray-400 mt-0.5">Items, Ledgers, GST, Units</div>
                </div>
                <button className={`${btnSm} bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]`} onClick={() => handleManualSync('master')}>
                  Sync All
                </button>
              </div>
              {masterDataStatus.slice(0, 5).map((m, i) => (
                <div key={i} className={`py-3 ${i < 4 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm">{m.category}</span>
                    <StatusBadge status={m.status} type={m.status === 'Synced' ? 'success' : m.status === 'Partial' ? 'warning' : 'danger'} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Total: {m.total} | Synced: {m.synced} | Failed: {m.failed}</span>
                    <span className="text-gray-400">{m.lastSync}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(m.synced / m.total) * 100}%`, background: m.failed > 0 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Transaction Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-gray-800">Transaction Status</div>
                  <div className="text-xs text-gray-400 mt-0.5">Purchase, Sales, Payments</div>
                </div>
                <button className={`${btnSm} bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]`} onClick={() => handleManualSync('transaction')}>
                  Sync All
                </button>
              </div>
              {transactionStatus.map((t, i) => (
                <div key={i} className={`py-3 ${i < transactionStatus.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm">{t.type}</span>
                    <StatusBadge status={t.status} type={t.status === 'Synced' ? 'success' : t.status === 'Pending' ? 'warning' : 'danger'} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Today: {t.today} | Synced: {t.synced} | Pending: {t.pending} | Failed: {t.failed}</span>
                  </div>
                  <div className="text-[11px] text-gray-400">{t.lastSync}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Master Data Sync */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Master Data Synchronization</div>
              <div className="text-xs text-gray-400 mt-0.5">Sync items, ledgers, GST rates, units, and godowns</div>
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]">
                <option>ERP → Tally</option>
                <option>Tally → ERP</option>
                <option>Bi-directional</option>
              </select>
              <button className={btnPrimary} onClick={() => handleManualSync('master')}>Sync All Master Data</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Category', 'Total Records', 'Synced', 'Pending', 'Failed', 'Last Sync', 'Status', 'Action'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {masterDataStatus.map((m, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold`}>{m.category}</td>
                    <td className={`${tdCls} font-bold`}>{m.total}</td>
                    <td className={`${tdCls} font-bold text-green-600`}>{m.synced}</td>
                    <td className={`${tdCls} ${m.pending > 0 ? 'font-bold text-amber-500' : 'text-gray-400'}`}>{m.pending}</td>
                    <td className={`${tdCls} ${m.failed > 0 ? 'font-bold text-red-500' : 'text-gray-400'}`}>{m.failed}</td>
                    <td className={`${tdCls} text-xs text-gray-500`}>{m.lastSync}</td>
                    <td className={tdCls}><StatusBadge status={m.status} type={m.status === 'Synced' ? 'success' : m.status === 'Partial' ? 'warning' : 'danger'} /></td>
                    <td className={tdCls}>
                      <button className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`} onClick={() => handleManualSync(m.category)}>
                        Sync Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Transaction Sync */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Transaction Synchronization</div>
              <div className="text-xs text-gray-400 mt-0.5">Sync purchase, sales, payment, receipt, and journal vouchers</div>
            </div>
            <button className={btnPrimary} onClick={() => handleManualSync('transaction')}>Sync All Transactions</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Transaction Type', 'Today', 'Synced', 'Pending', 'Failed', 'Last Sync', 'Status', 'Action'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactionStatus.map((t, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold`}>{t.type}</td>
                    <td className={`${tdCls} font-bold`}>{t.today}</td>
                    <td className={`${tdCls} font-bold text-green-600`}>{t.synced}</td>
                    <td className={`${tdCls} ${t.pending > 0 ? 'font-bold text-amber-500' : 'text-gray-400'}`}>{t.pending}</td>
                    <td className={`${tdCls} ${t.failed > 0 ? 'font-bold text-red-500' : 'text-gray-400'}`}>{t.failed}</td>
                    <td className={`${tdCls} text-xs text-gray-500`}>{t.lastSync}</td>
                    <td className={tdCls}><StatusBadge status={t.status} type={t.status === 'Synced' ? 'success' : t.status === 'Pending' ? 'warning' : 'danger'} /></td>
                    <td className={tdCls}>
                      <button className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`} onClick={() => handleManualSync(t.type)}>
                        Sync Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sync Logs */}
      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Synchronization Logs</div>
              <div className="text-xs text-gray-400 mt-0.5">Detailed history of all sync operations</div>
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]">
                <option>All Types</option>
                <option>Purchase</option>
                <option>Sales</option>
                <option>Payment</option>
                <option>Master Data</option>
              </select>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]">
                <option>All Status</option>
                <option>Success</option>
                <option>Failed</option>
              </select>
              <button className={btnOutline}>Export Logs</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Sync ID', 'Type', 'Entity', 'Direction', 'Status', 'Time', 'Duration', 'Error', 'Action'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {syncLogs.map((log, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-mono text-xs text-red-700 font-semibold`}>{log.id}</td>
                    <td className={tdCls}>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{log.type}</span>
                    </td>
                    <td className={`${tdCls} font-semibold`}>{log.entity}</td>
                    <td className={`${tdCls} text-xs`}>{log.direction}</td>
                    <td className={tdCls}><StatusBadge status={log.status} type={log.status === 'Success' ? 'success' : 'danger'} /></td>
                    <td className={`${tdCls} text-xs text-gray-500`}>{log.time}</td>
                    <td className={`${tdCls} text-xs font-mono`}>{log.duration}</td>
                    <td className={`${tdCls} text-xs ${log.error ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                      {log.error || '—'}
                    </td>
                    <td className={tdCls}>
                      {log.status === 'Failed' && (
                        <button className={`${btnSm} bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]`}>
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Configuration */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Tally Server Configuration</div>
            <div className={fieldCls}>
              <label className={labelCls}>Tally Server URL *</label>
              <input className={inputCls} defaultValue="http://localhost" placeholder="e.g. http://192.168.1.100" />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Port *</label>
              <input className={inputCls} defaultValue="9000" placeholder="Default: 9000" />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Company Name *</label>
              <input className={inputCls} defaultValue="Chakra Industries Pvt Ltd" placeholder="Exact name as in Tally" />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Authentication</label>
              <select className={selectCls}>
                <option>None</option>
                <option>Basic Auth</option>
                <option>API Key</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className={btnOutline}>Test Connection</button>
              <button className={btnPrimary}>Save Configuration</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Auto-Sync Settings</div>
            <div className={fieldCls}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-700" />
                <span className="text-sm font-semibold text-gray-800">Enable Auto-Sync</span>
              </label>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Sync Interval</label>
              <select className={selectCls}>
                <option>Every 5 minutes</option>
                <option>Every 15 minutes</option>
                <option>Every 30 minutes</option>
                <option>Every 1 hour</option>
                <option>Manual only</option>
              </select>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Sync Direction</label>
              <select className={selectCls}>
                <option>ERP → Tally (Push)</option>
                <option>Tally → ERP (Pull)</option>
                <option>Bi-directional</option>
              </select>
            </div>
            <div className="text-sm font-bold text-gray-800 mb-3 mt-4">Sync Preferences</div>
            {['Master Data', 'Purchase Vouchers', 'Sales Vouchers', 'Payment Vouchers', 'Receipt Vouchers'].map((pref, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{pref}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-red-700" />
                </label>
              </div>
            ))}
            <button className={btnPrimary + ' mt-4 w-full justify-center'}>Save Settings</button>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title="Quick Configuration"
        footer={
          <>
            <button className={btnOutline} onClick={() => setShowConfigModal(false)}>Cancel</button>
            <button className={btnPrimary} onClick={() => setShowConfigModal(false)}>Save & Test</button>
          </>
        }>
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldCls}>
            <label className={labelCls}>Server URL *</label>
            <input className={inputCls} defaultValue="http://localhost" />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Port *</label>
            <input className={inputCls} defaultValue="9000" />
          </div>
          <div className={`${fieldCls} col-span-2`}>
            <label className={labelCls}>Company Name *</label>
            <input className={inputCls} defaultValue="Chakra Industries Pvt Ltd" />
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Sync Interval</label>
            <select className={selectCls}>
              <option>Every 15 minutes</option>
              <option>Every 30 minutes</option>
              <option>Every 1 hour</option>
            </select>
          </div>
          <div className={fieldCls}>
            <label className={labelCls}>Direction</label>
            <select className={selectCls}>
              <option>ERP → Tally</option>
              <option>Tally → ERP</option>
              <option>Bi-directional</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
