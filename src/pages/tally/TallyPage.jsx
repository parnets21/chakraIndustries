import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';
import { tallyApi } from '../../api/tallyApi';

const inputCls  = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const selectCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]';
const labelCls  = 'text-xs font-semibold text-gray-600';
const fieldCls  = 'flex flex-col gap-1.5 mb-4';
const thCls     = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
const tdCls     = 'px-4 py-3 text-gray-800 align-middle';
const trCls     = 'border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]';
const btnOutline = 'inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]';
const btnSm     = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg';

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:32 }}>
      <div style={{ width:28, height:28, border:'3px solid #f1f5f9', borderTop:'3px solid #c0392b', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function TallyPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab]       = useState(initialTab);
  const [syncing, setSyncing]           = useState(false);
  const [loading, setLoading]           = useState(false);

  // Data
  const [stats, setStats]               = useState({});
  const [masterData, setMasterData]     = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [syncLogs, setSyncLogs]         = useState([]);
  const [config, setConfig]             = useState({
    serverUrl: 'https://erp.majesticmall.net', port: '9000', companyName: '',
    authType: 'None', autoSync: true, syncInterval: 'Every 15 minutes',
    syncDirection: 'Bi-directional',
    syncPrefs: { masterData:true, purchaseVouchers:true, salesVouchers:true, paymentVouchers:true, receiptVouchers:true, journalVouchers:false },
  });

  // Log filters
  const [logTypeFilter, setLogTypeFilter]     = useState('All Types');
  const [logStatusFilter, setLogStatusFilter] = useState('All Status');

  const loadStats = useCallback(async () => {
    try { const r = await tallyApi.getSyncStats(); setStats(r.data || {}); } catch (_) {}
  }, []);

  const loadMasterData = useCallback(async () => {
    try { const r = await tallyApi.getMasterData(); setMasterData(r.data || []); } catch (_) {}
  }, []);

  const loadTransactions = useCallback(async () => {
    try { const r = await tallyApi.getTransactions(); setTransactions(r.data || []); } catch (_) {}
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (logTypeFilter !== 'All Types') params.type = logTypeFilter;
      if (logStatusFilter !== 'All Status') params.status = logStatusFilter;
      const r = await tallyApi.getSyncLogs(params);
      setSyncLogs(r.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  }, [logTypeFilter, logStatusFilter]);

  const loadConfig = useCallback(async () => {
    try {
      // Auto-migrate: if DB still has 'ERP → Tally', flip it to Bi-directional
      await tallyApi.fixConfig().catch(() => {});
      const r = await tallyApi.getConfig();
      if (r.data) setConfig(prev => ({ ...prev, ...r.data }));
    } catch (_) {}
  }, []);

  useEffect(() => {
    loadStats(); loadMasterData(); loadTransactions(); loadConfig();
  }, [loadStats, loadMasterData, loadTransactions, loadConfig]);

  useEffect(() => { if (activeTab === 3) loadLogs(); }, [activeTab, loadLogs]);

  const handleManualSync = async (type) => {
    setSyncing(true);
    try {
      const r = await tallyApi.triggerSync({ type });
      if (r.offline) {
        toast('Tally is not reachable. Open Tally and enable HTTP Server on port 9000.', 'warning');
      } else {
        toast(r.message || `${type} sync completed`, r.success !== false ? 'success' : 'error');
      }
      loadStats(); loadMasterData(); loadTransactions();
      if (activeTab === 3) loadLogs();
    } catch (e) { toast(e.message || 'Sync failed', 'error'); }
    finally { setSyncing(false); }
  };

  const [diagInfo, setDiagInfo] = useState(null);   // stores last test-connection result

  const handleTestConnection = async () => {
    setDiagInfo(null);
    try {
      const r = await tallyApi.testConnection();
      const d = r.data || {};
      setDiagInfo(d);

      if (d.status === 'Connected') {
        setStats(prev => ({ ...prev, connectionStatus: 'Connected' }));
        toast(`✅ Connected — POST ${d.url} → HTTP ${d.httpStatus || '200'}`, 'success');
      } else {
        setStats(prev => ({ ...prev, connectionStatus: 'Disconnected' }));
        toast(`❌ ${d.error || 'Tally not reachable'}`, 'error');
      }
    } catch (e) {
      toast(e.message || 'Connection test failed', 'error');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await tallyApi.saveConfig(config);
      toast('Configuration saved');
    } catch (e) { toast(e.message || 'Failed to save', 'error'); }
  };

  const handleRetry = async (log) => {
    try {
      await tallyApi.retrySync(log._id);
      toast('Retry successful');
      loadLogs();
    } catch (e) { toast(e.message || 'Retry failed', 'error'); }
  };

  const kpis = [
    { label:'Connection Status', value: stats.connectionStatus || 'Unknown', color: stats.connectionStatus === 'Connected' ? '#10b981' : '#ef4444', icon:'🔗' },
    { label:'Last Full Sync',    value: stats.lastSyncAt ? new Date(stats.lastSyncAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Never', color:'#3b82f6', icon:'🔄' },
    { label:"Today's Syncs",     value: stats.todayTotal || 0, color:'#8b5cf6', icon:'📊' },
    { label:'Failed Syncs',      value: stats.todayFailed || 0, color:'#f59e0b', icon:'⚠️' },
  ];

  return (
    <div>
      {/* Top action bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full border"
            style={{ background: stats.syncDirection === 'Bi-directional' ? '#dcfce7' : '#dbeafe', color: stats.syncDirection === 'Bi-directional' ? '#166534' : '#1e40af', borderColor: stats.syncDirection === 'Bi-directional' ? '#86efac' : '#93c5fd' }}>
            {stats.syncDirection || config.syncDirection || 'Bi-directional'}
          </span>
          {stats.autoSync && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              Auto-Sync: {stats.syncInterval || config.syncInterval || 'Every 15 minutes'}
            </span>
          )}
        </div>
        <button className={btnPrimary} onClick={() => handleManualSync('Full')} disabled={syncing}>
          {syncing ? '⏳ Syncing...' : '🔄 Full Bidirectional Sync'}
        </button>
      </div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{k.icon}</span>
              <div className="text-xl font-black tracking-tight" style={{ color:k.color }}>{k.value}</div>
            </div>
            <div className="text-xs text-gray-500 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab 0: Sync Dashboard */}
      {activeTab === 0 && (
        <div>
          {/* Offline / not-connected banner */}
          {stats.connectionStatus && stats.connectionStatus !== 'Connected' && (
            <div className="bg-white rounded-2xl border border-amber-200 p-4 mb-4 shadow-sm" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="flex items-start gap-3">
                <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-bold text-amber-800 mb-1">
                    Tally is {stats.connectionStatus === 'Disconnected' ? 'not reachable' : 'status unknown'} — sync is paused
                  </div>
                  <div className="text-xs text-amber-700 leading-relaxed">
                    To enable bidirectional sync, open <strong>Tally Prime</strong> → press <strong>F12</strong> → <strong>Configure</strong> → <strong>Advanced Configuration</strong> → set <strong>Enable ODBC / HTTP Server: Yes</strong> → Port: <strong>9000</strong>. Then click <strong>Test Connection</strong> below.
                  </div>
                  <button
                    className="mt-2 text-xs font-bold text-amber-800 underline cursor-pointer bg-transparent border-0 p-0 font-[inherit]"
                    onClick={handleTestConnection}
                  >
                    Test Connection Now →
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {[
              { label:'Total Syncs Today', value: stats.todayTotal || 0, subtext:`${stats.todaySuccess || 0} success`, color:'#3b82f6' },
              { label:'Success Rate',      value: stats.successRate || '0%', subtext:`${stats.todaySuccess || 0} / ${stats.todayTotal || 0} total`, color:'#10b981' },
              { label:'Failed Syncs',      value: stats.todayFailed || 0, subtext:'Require attention', color:'#ef4444' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="text-xs text-gray-500 font-medium mb-1">{stat.label}</div>
                <div className="text-3xl font-black tracking-tight mb-1" style={{ color:stat.color }}>{stat.value}</div>
                <div className="text-[11px] text-gray-400">{stat.subtext}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-gray-800">Master Data Status</div>
                  <div className="text-xs text-gray-400 mt-0.5">Items, Ledgers, GST, Units</div>
                </div>
                <button className={`${btnSm} bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]`} onClick={() => handleManualSync('master')} disabled={syncing}>
                  {syncing ? 'Syncing...' : 'Sync All'}
                </button>
              </div>
              {masterData.length === 0 ? <Spinner /> : masterData.map((m, i) => (
                <div key={i} className={`py-3 ${i < masterData.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm">{m.category}</span>
                    <StatusBadge status={m.status} type={m.status==='Synced'?'success':m.status==='Partial'?'warning':'danger'} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Total: {m.total} | Synced: {m.synced} | Failed: {m.failed}</span>
                    <span className="text-gray-400">{m.lastSync}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width:`${m.total > 0 ? (m.synced/m.total)*100 : 0}%`, background: m.failed > 0 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-gray-800">Transaction Status</div>
                  <div className="text-xs text-gray-400 mt-0.5">Purchase, Sales, Payments</div>
                </div>
                <button className={`${btnSm} bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]`} onClick={() => handleManualSync('transaction')} disabled={syncing}>
                  {syncing ? 'Syncing...' : 'Sync All'}
                </button>
              </div>
              {transactions.length === 0 ? <Spinner /> : transactions.map((t, i) => (
                <div key={i} className={`py-3 ${i < transactions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-sm">{t.type}</span>
                    <StatusBadge status={t.status} type={t.status==='Synced'?'success':t.status==='Pending'?'warning':'danger'} />
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
            <button className={btnPrimary} onClick={() => handleManualSync('master')} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync All Master Data'}
            </button>
          </div>
          {masterData.length === 0 ? <Spinner /> : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['Category','Total Records','Synced','Pending','Failed','Last Sync','Status','Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {masterData.map((m, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-semibold`}>{m.category}</td>
                      <td className={`${tdCls} font-bold`}>{m.total}</td>
                      <td className={`${tdCls} font-bold text-green-600`}>{m.synced}</td>
                      <td className={`${tdCls} ${m.pending > 0 ? 'font-bold text-amber-500' : 'text-gray-400'}`}>{m.pending}</td>
                      <td className={`${tdCls} ${m.failed > 0 ? 'font-bold text-red-500' : 'text-gray-400'}`}>{m.failed}</td>
                      <td className={`${tdCls} text-xs text-gray-500`}>{m.lastSync}</td>
                      <td className={tdCls}><StatusBadge status={m.status} type={m.status==='Synced'?'success':m.status==='Partial'?'warning':'danger'} /></td>
                      <td className={tdCls}>
                        <button className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`} onClick={() => handleManualSync(m.category)} disabled={syncing}>
                          Sync Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
            <button className={btnPrimary} onClick={() => handleManualSync('transaction')} disabled={syncing}>
              {syncing ? 'Syncing...' : 'Sync All Transactions'}
            </button>
          </div>
          {transactions.length === 0 ? <Spinner /> : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['Transaction Type','Today','Synced','Pending','Failed','Last Sync','Status','Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-semibold`}>{t.type}</td>
                      <td className={`${tdCls} font-bold`}>{t.today}</td>
                      <td className={`${tdCls} font-bold text-green-600`}>{t.synced}</td>
                      <td className={`${tdCls} ${t.pending > 0 ? 'font-bold text-amber-500' : 'text-gray-400'}`}>{t.pending}</td>
                      <td className={`${tdCls} ${t.failed > 0 ? 'font-bold text-red-500' : 'text-gray-400'}`}>{t.failed}</td>
                      <td className={`${tdCls} text-xs text-gray-500`}>{t.lastSync}</td>
                      <td className={tdCls}><StatusBadge status={t.status} type={t.status==='Synced'?'success':t.status==='Pending'?'warning':'danger'} /></td>
                      <td className={tdCls}>
                        <button className={`${btnSm} border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]`} onClick={() => handleManualSync(t.type)} disabled={syncing}>
                          Sync Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]"
                value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)}>
                {['All Types','Purchase','Sales','Payment','Receipt','Journal','Item Master','Full'].map(t => <option key={t}>{t}</option>)}
              </select>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white text-gray-800 focus:border-red-500 font-[inherit]"
                value={logStatusFilter} onChange={e => setLogStatusFilter(e.target.value)}>
                {['All Status','Success','Failed','Partial'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['Sync ID','Type','Entity','Direction','Status','Time','Duration','Error','Action'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {syncLogs.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400 text-sm">No sync logs yet. Trigger a sync to see logs here.</td></tr>
                  ) : syncLogs.map((log, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-mono text-xs text-red-700 font-semibold`}>{log.syncId}</td>
                      <td className={tdCls}><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{log.type}</span></td>
                      <td className={`${tdCls} font-semibold`}>{log.entity || '—'}</td>
                      <td className={`${tdCls} text-xs`}>{log.direction}</td>
                      <td className={tdCls}><StatusBadge status={log.status} type={log.status==='Success'?'success':log.status==='Partial'?'warning':'danger'} /></td>
                      <td className={`${tdCls} text-xs text-gray-500`}>{new Date(log.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                      <td className={`${tdCls} text-xs font-mono`}>{log.duration || '—'}</td>
                      <td className={`${tdCls} text-xs ${log.error ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{log.error || '—'}</td>
                      <td className={tdCls}>
                        {log.status === 'Failed' && (
                          <button className={`${btnSm} bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]`} onClick={() => handleRetry(log)}>Retry</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Configuration */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Tally Server Configuration</div>
            <div className={fieldCls}>
              <label className={labelCls}>Tally Server URL *</label>
              <input className={inputCls} value={config.serverUrl || ''} onChange={e => setConfig(p => ({ ...p, serverUrl: e.target.value }))} placeholder="e.g. http://192.168.1.100" />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Port *</label>
              <input className={inputCls} value={config.port || ''} onChange={e => setConfig(p => ({ ...p, port: e.target.value }))} placeholder="Default: 9000" />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>
                Company Name
                <span className="ml-1 text-gray-400 font-normal">(optional — leave blank to use active company)</span>
              </label>
              <input className={inputCls} value={config.companyName || ''} onChange={e => setConfig(p => ({ ...p, companyName: e.target.value }))} placeholder="Leave blank OR enter exact name as in Tally" />
              {config.companyName && (
                <div className="text-xs text-amber-600 mt-1">
                  ⚠️ Must match exactly as shown in Tally — including spaces and capitalisation
                </div>
              )}
              {!config.companyName && (
                <div className="text-xs text-green-600 mt-1">
                  ✓ Blank = Tally will use whichever company is currently open
                </div>
              )}
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Authentication</label>
              <select className={selectCls} value={config.authType || 'None'} onChange={e => setConfig(p => ({ ...p, authType: e.target.value }))}>
                {['None','Basic Auth','API Key'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleTestConnection} className={btnOutline}>Test Connection</button>
              <button onClick={handleSaveConfig} className={btnPrimary}>Save Configuration</button>
            </div>

            {/* ── Diagnostics panel — shown after Test Connection ── */}
            {diagInfo && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10,
                background: diagInfo.status === 'Connected' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${diagInfo.status === 'Connected' ? '#86efac' : '#fecaca'}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8,
                  color: diagInfo.status === 'Connected' ? '#166534' : '#dc2626' }}>
                  {diagInfo.status === 'Connected' ? '✅ Connected' : '❌ Not Reachable'}
                </div>
                <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                  {[
                    ['URL', diagInfo.url],
                    ['Method', diagInfo.requestMethod],
                    ['HTTP Status', diagInfo.httpStatus || '—'],
                    ['Error', diagInfo.error || '—'],
                    ['Response preview', diagInfo.responsePreview || '—'],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', verticalAlign: 'top', width: 120 }}>{k}</td>
                      <td style={{ padding: '3px 0', fontFamily: 'monospace', color: '#1e293b', wordBreak: 'break-all' }}>{v}</td>
                    </tr>
                  ))}
                </table>
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 11, color: '#64748b', cursor: 'pointer' }}>Request body sent to Tally</summary>
                  <pre style={{ marginTop: 6, fontSize: 10, background: '#1e293b', color: '#94a3b8', padding: 8, borderRadius: 6, overflow: 'auto', maxHeight: 160 }}>
                    {diagInfo.requestBody}
                  </pre>
                </details>
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Auto-Sync Settings</div>
            <div className={fieldCls}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!config.autoSync} onChange={e => setConfig(p => ({ ...p, autoSync: e.target.checked }))} className="w-4 h-4 accent-red-700" />
                <span className="text-sm font-semibold text-gray-800">Enable Auto-Sync</span>
              </label>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Sync Interval</label>
              <select className={selectCls} value={config.syncInterval || 'Every 15 minutes'} onChange={e => setConfig(p => ({ ...p, syncInterval: e.target.value }))}>
                {['Every 5 minutes','Every 15 minutes','Every 30 minutes','Every 1 hour','Manual only'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Sync Direction</label>
              <select className={selectCls} value={config.syncDirection || 'ERP → Tally'} onChange={e => setConfig(p => ({ ...p, syncDirection: e.target.value }))}>
                {['ERP → Tally','Tally → ERP','Bi-directional'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="text-sm font-bold text-gray-800 mb-3 mt-4">Sync Preferences</div>
            {[
              ['masterData','Master Data'],
              ['purchaseVouchers','Purchase Vouchers'],
              ['salesVouchers','Sales Vouchers'],
              ['paymentVouchers','Payment Vouchers'],
              ['receiptVouchers','Receipt Vouchers'],
              ['journalVouchers','Journal Vouchers'],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{label}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!config.syncPrefs?.[key]} onChange={e => setConfig(p => ({ ...p, syncPrefs: { ...p.syncPrefs, [key]: e.target.checked } }))} className="w-4 h-4 accent-red-700" />
                </label>
              </div>
            ))}
            <button className={btnPrimary + ' mt-4 w-full justify-center'} onClick={handleSaveConfig}>Save Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
