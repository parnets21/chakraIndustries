import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import { toast } from '../../components/common/Toast.jsx';
import { tallyApi } from '../../api/tallyApi.js';
import { dataEvents } from '../../utils/dataEvents.js';

// ── Style tokens ──────────────────────────────────────────────────────────────
const inputCls   = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-400 font-[inherit]';
const selectCls  = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-[inherit]';
const labelCls   = 'text-xs font-semibold text-gray-600';
const fieldCls   = 'flex flex-col gap-1.5 mb-4';
const thCls      = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
const tdCls      = 'px-4 py-3 text-gray-800 align-middle text-sm';
const trCls      = 'border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors';
const btnGray    = 'inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all cursor-pointer font-[inherit]';
const btnOutline = 'inline-flex items-center gap-1.5 px-4 py-2 border border-gray-400 text-gray-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all cursor-pointer font-[inherit]';

// small action buttons
const btnImportSm = 'inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold border-0 cursor-pointer font-[inherit] disabled:opacity-40 transition-colors';
const btnExportSm = 'inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold border-0 cursor-pointer font-[inherit] disabled:opacity-40 transition-colors';

// ── What can be imported from Tally ──────────────────────────────────────────
const IMPORT_ENTITIES = [
  { key: 'Items',    label: 'Stock Items',       icon: '📦', desc: 'Products, raw materials, HSN codes, GST rates' },
  { key: 'Ledgers',  label: 'Ledgers & Parties', icon: '📒', desc: 'All ledgers including Vendors and Clients' },
  { key: 'Purchase', label: 'Purchase Vouchers', icon: '🛒', desc: 'All purchase entries from Tally Day Book' },
  { key: 'Sales',    label: 'Sales Vouchers',    icon: '💰', desc: 'All sales entries from Tally Day Book' },
  { key: 'Payment',  label: 'Payment Vouchers',  icon: '💸', desc: 'Payment transactions from Tally' },
  { key: 'Receipt',  label: 'Receipt Vouchers',  icon: '🧾', desc: 'Receipt transactions from Tally' },
  { key: 'Journal',  label: 'Journal Vouchers',  icon: '📋', desc: 'Journal entries from Tally' },
  { key: 'Contra',   label: 'Contra Vouchers',   icon: '🔄', desc: 'Contra entries from Tally (bank transfers, cash deposits)' },
];

// ── What can be exported to Tally ─────────────────────────────────────────────
const EXPORT_ENTITIES = [
  { key: 'masters',  label: 'Masters',           icon: '🗂️',  desc: 'Items, Vendors (Creditors), Clients (Debtors), Ledgers' },
  { key: 'purchase', label: 'Purchase Vouchers', icon: '🛒', desc: 'Approved / received purchase orders' },
  { key: 'sales',    label: 'Sales Vouchers',    icon: '💰', desc: 'Sent / paid invoices' },
  { key: 'payment',  label: 'Payment Vouchers',  icon: '💸', desc: 'ERP payment vouchers not yet in Tally' },
  { key: 'receipt',  label: 'Receipt Vouchers',  icon: '🧾', desc: 'ERP receipt vouchers not yet in Tally' },
];

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 26, height: 26, border: '3px solid #f1f5f9', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'sp 0.7s linear infinite' }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Confirmation modal ────────────────────────────────────────────────────────
function ConfirmModal({ open, direction, type, onConfirm, onCancel }) {
  if (!open) return null;
  const imp  = direction === 'import';
  const clr  = imp ? '#16a34a' : '#2563eb';
  const arrow = imp ? 'Tally → ERP' : 'ERP → Tally';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '28px 30px', maxWidth: 450, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        {/* direction pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: imp ? '#f0fdf4' : '#eff6ff', border: `1.5px solid ${imp ? '#86efac' : '#93c5fd'}`, borderRadius: 99, padding: '4px 14px', marginBottom: 14, fontSize: 12, fontWeight: 700, color: clr }}>
          <span>{imp ? '📥' : '📤'}</span><span>{arrow}</span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
          Confirm {imp ? 'Import from Tally' : 'Export to Tally'}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
          <strong>Scope:</strong> {type === 'Full' ? 'All data' : type}<br />
          <strong>Direction:</strong> <span style={{ color: clr, fontWeight: 700 }}>{arrow}</span>
        </div>

        <div style={{ background: imp ? '#f0fdf4' : '#eff6ff', border: `1px solid ${imp ? '#86efac' : '#93c5fd'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: imp ? '#14532d' : '#1e3a8a', lineHeight: 1.6 }}>
          {imp
            ? 'ℹ️ Data will be fetched FROM Tally and saved into the ERP database. Nothing is sent to Tally.'
            : 'ℹ️ Data will be pushed FROM the ERP INTO Tally. Records will be created or altered in Tally. Nothing is read from Tally.'}
        </div>

        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '8px 12px', marginBottom: 20, fontSize: 12, color: '#713f12' }}>
          ⚠️ Make sure Tally is running and accessible before proceeding.
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className={btnGray}>Cancel</button>
          <button onClick={onConfirm} style={{ background: `linear-gradient(135deg, ${clr}, ${imp ? '#15803d' : '#1d4ed8'})`, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {imp ? '📥 Start Import' : '📤 Start Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Live terminal panel ───────────────────────────────────────────────────────
function Terminal({ active, direction, phase, log, progress, done, stats, onClose, onCancel }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [log]);
  if (!active) return null;
  const imp  = direction === 'import';
  const dot  = imp ? '#4ade80' : '#60a5fa';

  return (
    <div style={{ background: '#0f172a', borderRadius: 14, padding: '14px 18px', marginBottom: 20, border: `1.5px solid ${imp ? '#14532d' : '#1e3a8a'}`, fontFamily: 'monospace' }}>
      {/* bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!done
            ? <div style={{ width: 9, height: 9, borderRadius: '50%', background: dot, animation: 'pu 1s infinite' }} />
            : <span style={{ fontSize: 14 }}>{(stats?.failed || 0) > 0 ? '⚠️' : '✅'}</span>
          }
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12 }}>{imp ? 'Importing from Tally' : 'Exporting to Tally'} — {phase}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: imp ? '#14532d' : '#1e3a8a', color: dot, border: `1px solid ${imp ? '#166534' : '#1d4ed8'}` }}>
            {imp ? 'Tally → ERP' : 'ERP → Tally'}
          </span>
        </div>
        {done
          ? <button onClick={onClose} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Close</button>
          : <button onClick={onCancel} style={{ background: 'none', border: '1px solid #ef4444', color: '#f87171', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'monospace' }}>Cancel</button>
        }
      </div>

      {/* progress bar */}
      {progress && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 3 }}>
            <span>{progress.entity} — step {progress.index}/{progress.total}</span>
            <span>{progress.records} processed</span>
          </div>
          <div style={{ height: 5, background: '#1e293b', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, transition: 'width 0.3s', background: imp ? 'linear-gradient(90deg,#4ade80,#16a34a)' : 'linear-gradient(90deg,#60a5fa,#2563eb)', width: `${Math.min(100, (progress.index / progress.total) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* log */}
      <div ref={ref} style={{ maxHeight: 200, overflowY: 'auto', fontSize: 11, lineHeight: 1.75, paddingRight: 2 }}>
        {log.map((l, i) => (
          <div key={i} style={{ color: l.level === 'error' ? '#f87171' : l.level === 'warn' ? '#fbbf24' : l.level === 'success' ? '#4ade80' : l.level === 'phase' ? '#fbbf24' : '#64748b', whiteSpace: 'pre-wrap' }}>{l.text}</div>
        ))}
        {!done && <div style={{ color: '#334155' }}>▌</div>}
      </div>

      {/* result grid */}
      {done && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Total',   val: stats.total   || 0, color: '#3b82f6' },
            { label: 'Created', val: stats.created || 0, color: '#10b981' },
            { label: 'Updated', val: stats.updated || 0, color: '#f59e0b' },
            { label: 'Skipped', val: stats.skipped || 0, color: '#6b7280' },
            { label: 'Failed',  val: stats.failed  || 0, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1e293b', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function TallyPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab]   = useState(initialTab);
  const [loading, setLoading]       = useState(false);
  const navigate = useNavigate();

  // confirm modal
  const [confirm, setConfirm] = useState({ open: false, direction: null, type: null });

  // stream
  const [streamActive, setStreamActive]       = useState(false);
  const [streamDir, setStreamDir]             = useState('import');
  const [streamPhase, setStreamPhase]         = useState('');
  const [streamLog, setStreamLog]             = useState([]);
  const [streamProgress, setStreamProgress]   = useState(null);
  const [streamDone, setStreamDone]           = useState(false);
  const [streamStats, setStreamStats]         = useState(null);
  const [streamRunning, setStreamRunning]     = useState(false);
  const esRef = useRef(null);

  // data
  const [stats, setStats]           = useState({});
  const [masterData, setMasterData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [syncLogs, setSyncLogs]     = useState([]);
  const [diagInfo, setDiagInfo]     = useState(null);
  const [logTypeFilter, setLogTypeFilter]     = useState('All Types');
  const [logStatusFilter, setLogStatusFilter] = useState('All Status');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [config, setConfig] = useState({
    port: '9000', companyName: '', tallyLocalUrl: '', authType: 'None',
    financialYearStart: '2026-04-01',
    autoSync: true, syncInterval: 'Every 15 minutes',
    syncPrefs: { masterData: true, purchaseVouchers: true, salesVouchers: true, paymentVouchers: true, receiptVouchers: true, journalVouchers: false },
  });
  const [connectorStatus, setConnectorStatus] = useState(null);

  const reload = useCallback(async () => {
    try { const r = await tallyApi.getSyncStats();    setStats(r.data || {}); } catch (_) {}
    try { const r = await tallyApi.getMasterData();   setMasterData(r.data || []); } catch (_) {}
    try { const r = await tallyApi.getTransactions(); setTransactions(r.data || []); } catch (_) {}
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      await tallyApi.fixConfig().catch(() => {});
      const r = await tallyApi.getConfig();
      if (r.data) setConfig(p => ({ ...p, ...r.data }));
    } catch (_) {}
  }, []);

  const loadConnectorStatus = useCallback(async () => {
    try {
      const r = await tallyApi.getConnectorStatus();
      setConnectorStatus(r.connectors || null);
    } catch (_) {}
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const p = {};
      if (logTypeFilter   !== 'All Types')  p.type   = logTypeFilter;
      if (logStatusFilter !== 'All Status') p.status = logStatusFilter;
      const r = await tallyApi.getSyncLogs(p);
      setSyncLogs(r.data || []);
    } catch (_) {} finally { setLoading(false); }
  }, [logTypeFilter, logStatusFilter]);

  useEffect(() => { reload(); loadConfig(); loadConnectorStatus(); }, [reload, loadConfig, loadConnectorStatus]);
  useEffect(() => { if (activeTab === 3) loadLogs(); }, [activeTab, loadLogs]);

  // ── request with confirm ──────────────────────────────────────────────────
  const ask = (dir, type) => {
    if (streamRunning) { toast('An operation is already running.', 'error'); return; }
    setConfirm({ open: true, direction: dir, type });
  };

  const go = () => {
    const { direction, type } = confirm;
    setConfirm({ open: false, direction: null, type: null });
    startStream(direction, type);
  };

  // ── stream ────────────────────────────────────────────────────────────────
  const startStream = (dir, type) => {
    esRef.current?.close();
    setStreamRunning(true); setStreamActive(true); setStreamDir(dir);
    setStreamDone(false); setStreamStats(null); setStreamLog([]);
    setStreamPhase('Connecting...'); setStreamProgress(null);

    const push = (level, text) => setStreamLog(p => [...p, { level, text }]);

    const onEv = (ev) => {
      switch (ev.event) {
        case 'start':       push('info',    `▶ ${ev.message}`); setStreamPhase('Starting...'); break;
        case 'phase':       push('phase',   `▶ ${ev.message}`); setStreamPhase(ev.message); break;
        case 'phase_start': push('info',    `  [${ev.index}/${ev.total}] ${ev.entity}...`);
                            setStreamProgress({ index: ev.index, total: ev.total, entity: ev.entity, records: 0 });
                            setStreamPhase(`${ev.entity} (${ev.index}/${ev.total})`); break;
        case 'log':         push(ev.level || 'info', `  ${ev.entity ? `[${ev.entity}] ` : ''}${ev.message}`); break;
        case 'phase_done':  ev.ok
                              ? push('success', `  ✅ ${ev.entity}: ${ev.records} records`)
                              : push('error',   `  ❌ ${ev.entity}: ${ev.error || 'failed'}`);
                            setStreamProgress(p => p ? { ...p, records: ev.records || 0 } : p); break;
        case 'summary':     push('success', `🎉 ${ev.message}`); setStreamStats(ev.stats);
                            toast(ev.message, (ev.stats?.failed || 0) > 0 ? 'warning' : 'success'); break;
        case 'done':        setStreamDone(true); setStreamRunning(false);
                            setStreamPhase(dir === 'import' ? '✅ Import Complete' : '✅ Export Complete');
                            if (ev.stats) setStreamStats(ev.stats);
                            esRef.current?.close(); reload();
                            // Emit data events to refresh all relevant pages!
                            dataEvents.emit('vendor:changed');
                            dataEvents.emit('item:changed');
                            dataEvents.emit('client:changed');
                            dataEvents.emit('ledger:changed');
                            if (activeTab === 3) loadLogs(); break;
        case 'error':       push('error', `❌ ${ev.message}`);
                            setStreamDone(true); setStreamRunning(false); setStreamPhase('❌ Failed');
                            esRef.current?.close(); toast(ev.message, 'error'); break;
        default: break;
      }
    };

    const es = dir === 'export'
      ? tallyApi.openExportStream(type, onEv)
      : tallyApi.openImportStream(type, onEv);
    esRef.current = es;
  };

  const cancelStream = () => {
    esRef.current?.close(); esRef.current = null;
    setStreamRunning(false); setStreamDone(true); setStreamPhase('Cancelled');
    setStreamLog(p => [...p, { level: 'warn', text: '⚠️ Cancelled by user' }]);
  };

  const closeTerminal = () => { setStreamActive(false); setStreamLog([]); setStreamStats(null); };

  const handleTestConnection = async () => {
    setDiagInfo(null);
    try {
      const r = await tallyApi.testConnection();
      const d = r.data || {};
      setDiagInfo(d);
      d.status === 'Connected'
        ? toast(`✅ Connected — ${d.url}`, 'success')
        : toast(`❌ ${d.error || 'Not reachable'}`, 'error');
    } catch (e) { toast(e.message || 'Test failed', 'error'); }
  };

  const handleSaveConfig = async () => {
    try { await tallyApi.saveConfig(config); toast('Configuration saved'); }
    catch (e) { toast(e.message || 'Save failed', 'error'); }
  };

  const handleGenerateCredentials = async () => {
    try {
      await tallyApi.generateConnectorCredentials();
      await loadConfig();
      await loadConnectorStatus();
      toast('Connector credentials generated', 'success');
    } catch (e) { toast(e.message || 'Failed to generate credentials', 'error'); }
  };

  const TABS = [
    { label: '📊 Overview',          color: '#6b7280' },
    { label: '📥 Import from Tally', color: '#16a34a' },
    { label: '📤 Export to Tally',   color: '#2563eb' },
    { label: '📋 Logs',              color: '#6b7280' },
    { label: '⚙️ Settings',          color: '#6b7280' },
  ];

  return (
    <div>
      <ConfirmModal open={confirm.open} direction={confirm.direction} type={confirm.type} onConfirm={go} onCancel={() => setConfirm({ open: false, direction: null, type: null })} />

      {/* ── Page title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>Tally Integration</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', fontWeight: 500 }}>
            Manual import &amp; export — choose a direction explicitly
          </p>
        </div>
        <button onClick={() => navigate('/tally/data')} className={btnOutline} style={{ fontSize: 12 }}>📋 View Imported Data</button>
      </div>

      {/* ── TWO BIG BUTTONS — always visible ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>

        {/* IMPORT */}
        <button
          onClick={() => ask('import', 'Full')}
          disabled={streamRunning}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px',
            background: streamRunning && streamDir === 'import' ? '#15803d' : 'linear-gradient(135deg,#22c55e 0%,#15803d 100%)',
            color: '#fff', border: 'none', borderRadius: 18,
            cursor: streamRunning ? 'not-allowed' : 'pointer',
            opacity: streamRunning && streamDir !== 'import' ? 0.55 : 1,
            fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.32)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!streamRunning) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(34,197,94,0.42)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 24px rgba(34,197,94,0.32)'; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {streamRunning && streamDir === 'import' ? '⏳' : '📥'}
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.4px' }}>
              {streamRunning && streamDir === 'import' ? 'Importing…' : 'Import from Tally'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 500, marginTop: 3 }}>
              Tally → ERP &nbsp;·&nbsp; Fetch all vendors, clients, ledgers &amp; vouchers
            </div>
          </div>
        </button>

        {/* EXPORT */}
        <button
          onClick={() => ask('export', 'Full')}
          disabled={streamRunning}
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '20px 22px',
            background: streamRunning && streamDir === 'export' ? '#1d4ed8' : 'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)',
            color: '#fff', border: 'none', borderRadius: 18,
            cursor: streamRunning ? 'not-allowed' : 'pointer',
            opacity: streamRunning && streamDir !== 'export' ? 0.55 : 1,
            fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(59,130,246,0.32)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!streamRunning) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(59,130,246,0.42)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 24px rgba(59,130,246,0.32)'; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {streamRunning && streamDir === 'export' ? '⏳' : '📤'}
          </div>
          <div style={{ textAlign: 'left', minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.4px' }}>
              {streamRunning && streamDir === 'export' ? 'Exporting…' : 'Export to Tally'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 500, marginTop: 3 }}>
              ERP → Tally &nbsp;·&nbsp; Push all vendors, clients, ledgers &amp; vouchers
            </div>
          </div>
        </button>
      </div>

      {/* ── Live terminal ── */}
      <Terminal
        active={streamActive} direction={streamDir} phase={streamPhase}
        log={streamLog} progress={streamProgress} done={streamDone}
        stats={streamStats} onClose={closeTerminal} onCancel={cancelStream}
      />

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #e2e8f0', marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            style={{
              padding: '9px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === i ? t.color : '#9ca3af',
              borderBottom: activeTab === i ? `2.5px solid ${t.color}` : '2.5px solid transparent',
              marginBottom: -2, transition: 'color 0.15s',
              whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          TAB 0 — Overview
      ════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div>
          {/* warnings */}
          {stats.connectionStatus && stats.connectionStatus !== 'Connected' && (
            <div style={{ background: '#fff', border: '1.5px solid #fde68a', borderLeft: '4px solid #f59e0b', borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Tally is not reachable</div>
                <div style={{ fontSize: 12, color: '#b45309', lineHeight: 1.6 }}>Open Tally Prime → F12 → Configure → Advanced Config → Enable ODBC/HTTP Server: Yes, Port: 9000.</div>
                <button onClick={handleTestConnection} style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#92400e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Test Connection →</button>
              </div>
            </div>
          )}
          {!config.tallyLocalUrl && (
            <div style={{ background: '#fff', border: '1.5px solid #fecaca', borderLeft: '4px solid #ef4444', borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🔧</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Tally URL not configured</div>
                <div style={{ fontSize: 12, color: '#ef4444' }}>Go to Settings tab → set Tally Local URL (e.g. <code>http://192.168.1.10</code>)</div>
                <button onClick={() => setActiveTab(4)} style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Go to Settings →</button>
              </div>
            </div>
          )}

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { icon: '🔗', label: 'Connection',   val: stats.connectionStatus || 'Unknown', color: stats.connectionStatus === 'Connected' ? '#10b981' : '#ef4444' },
              { icon: '📥', label: 'Last Import',  val: stats.lastImportAt ? new Date(stats.lastImportAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Never', color: '#16a34a' },
              { icon: '📤', label: 'Last Export',  val: stats.lastExportAt  ? new Date(stats.lastExportAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Never', color: '#2563eb' },
              { icon: '📊', label: "Today's Ops",  val: stats.todayTotal  || 0, color: '#8b5cf6' },
              { icon: '✅', label: 'Succeeded',    val: stats.todaySuccess || 0, color: '#10b981' },
              { icon: '❌', label: 'Failed',       val: stats.todayFailed  || 0, color: '#ef4444' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #f1f5f9', padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{k.icon}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: k.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{k.val}</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Quick nav */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10, marginBottom: 4 }}>
            {[
              { label: 'Stock Items', icon: '📦', path: '/item-master',         clr: '#3b82f6' },
              { label: 'Vendors',     icon: '🏭', path: '/procurement/vendors', clr: '#10b981' },
              { label: 'Ledgers',     icon: '📒', path: '/finance/tally-ledger',clr: '#f59e0b' },
              { label: 'Vouchers',    icon: '📥', path: '/finance/tally-ledger',clr: '#c0392b' },
            ].map(c => (
              <button key={c.label} onClick={() => navigate(c.path)}
                style={{ background: '#fff', border: `1.5px solid ${c.clr}25`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = c.clr + '12'; e.currentTarget.style.borderColor = c.clr; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = c.clr + '25'; }}>
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Import History Table — all modules that have been imported */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '20px 22px', marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Import History</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>All modules imported from Tally — updates after every sync</div>
              </div>
              <button onClick={reload} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>↻ Refresh</button>
            </div>
            {masterData.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No data imported yet. Click <strong>Import from Tally</strong> to begin.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Module', 'Type', 'Total Records', 'Imported', 'Pending', 'Last Sync', 'Status', ''].map(h => (
                        <th key={h} className={thCls}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {masterData.map((m, i) => (
                      <tr key={i} className={trCls}>
                        <td className={tdCls}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{m.icon || '📄'}</span>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{m.category}</span>
                          </div>
                        </td>
                        <td className={tdCls}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                            background: m.moduleType === 'master' ? '#eff6ff' : '#f0fdf4',
                            color: m.moduleType === 'master' ? '#2563eb' : '#16a34a' }}>
                            {m.moduleType === 'master' ? 'Master' : 'Voucher'}
                          </span>
                        </td>
                        <td className={tdCls} style={{ fontWeight: 700 }}>{m.total.toLocaleString('en-IN')}</td>
                        <td className={tdCls} style={{ fontWeight: 700, color: '#16a34a' }}>{m.synced.toLocaleString('en-IN')}</td>
                        <td className={tdCls} style={{ color: m.pending > 0 ? '#f59e0b' : '#94a3b8', fontWeight: m.pending > 0 ? 700 : 400 }}>{m.pending || '—'}</td>
                        <td className={tdCls} style={{ fontSize: 11, color: '#94a3b8' }}>{m.lastSync}</td>
                        <td className={tdCls}>
                          <StatusBadge
                            status={m.status}
                            type={m.status === 'Synced' ? 'success' : m.status === 'Partial' ? 'warning' : m.status === 'Not Imported' ? 'danger' : 'warning'}
                          />
                        </td>
                        <td className={tdCls}>
                          <button className={btnImportSm}
                            onClick={() => ask('import', m.voucherType || m.category)}
                            disabled={streamRunning}>
                            📥
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 1 — IMPORT FROM TALLY
      ════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div>
          {/* section header */}
          <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📥</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#14532d', letterSpacing: '-0.3px' }}>Import from Tally</div>
                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>Direction: Tally → ERP &nbsp;·&nbsp; Nothing is pushed to Tally</div>
              </div>
            </div>
            <button
              onClick={() => ask('import', 'Full')}
              disabled={streamRunning}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: streamRunning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: streamRunning ? 0.6 : 1, boxShadow: '0 3px 12px rgba(22,163,74,0.35)' }}
            >
              <span style={{ fontSize: 18 }}>{streamRunning && streamDir === 'import' ? '⏳' : '📥'}</span>
              {streamRunning && streamDir === 'import' ? 'Importing…' : 'Import All from Tally'}
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#14532d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 20, lineHeight: 1.7 }}>
            <strong>One-way import only.</strong> Data is fetched <em>from</em> Tally and saved into the ERP database. Existing ERP records are matched by Tally GUID to avoid duplicates. Nothing is sent back to Tally.
          </div>

          {/* entity cards — 2 col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 24 }}>
            {/* ── Sales Register shortcut card ── */}
            <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '2px solid #16a34a', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📊</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#14532d' }}>Sales Register</div>
                  <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>Import by date range (April–June)</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/tally/sales-register')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, background: '#16a34a', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                📊 Open
              </button>
            </div>

            {IMPORT_ENTITIES.map(e => (
              <div key={e.key} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'border-color 0.15s' }}
                onMouseEnter={ev => ev.currentTarget.style.borderColor = '#86efac'}
                onMouseLeave={ev => ev.currentTarget.style.borderColor = '#e2e8f0'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{e.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{e.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{e.desc}</div>
                  </div>
                </div>
                <button className={btnImportSm} onClick={() => ask('import', e.key)} disabled={streamRunning}>
                  📥 Import
                </button>
              </div>
            ))}
          </div>

          {/* status table */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Import Status</div>
          {masterData.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No data imported yet. Run <strong>Import All from Tally</strong> above to populate.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Module', 'Type', 'Total', 'Imported', 'Pending', 'Failed', 'Last Import', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {masterData.map((m, i) => (
                    <tr key={i} className={trCls}>
                      <td className={tdCls}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 17 }}>{m.icon || '📄'}</span>
                          <span style={{ fontWeight: 700 }}>{m.category}</span>
                        </div>
                      </td>
                      <td className={tdCls}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                          background: m.moduleType === 'master' ? '#eff6ff' : '#f0fdf4',
                          color: m.moduleType === 'master' ? '#2563eb' : '#16a34a' }}>
                          {m.moduleType === 'master' ? 'Master' : 'Voucher'}
                        </span>
                      </td>
                      <td className={tdCls} style={{ fontWeight: 700 }}>{(m.total || 0).toLocaleString('en-IN')}</td>
                      <td className={tdCls} style={{ fontWeight: 700, color: '#16a34a' }}>{(m.synced || 0).toLocaleString('en-IN')}</td>
                      <td className={tdCls} style={{ color: m.pending > 0 ? '#f59e0b' : '#94a3b8', fontWeight: m.pending > 0 ? 700 : 400 }}>{m.pending > 0 ? m.pending : '—'}</td>
                      <td className={tdCls} style={{ color: m.failed > 0 ? '#ef4444' : '#94a3b8', fontWeight: m.failed > 0 ? 700 : 400 }}>{m.failed > 0 ? m.failed : '—'}</td>
                      <td className={tdCls} style={{ fontSize: 11, color: '#94a3b8' }}>{m.lastSync}</td>
                      <td className={tdCls}>
                        <StatusBadge status={m.status} type={m.status === 'Synced' ? 'success' : m.status === 'Partial' ? 'warning' : 'danger'} />
                      </td>
                      <td className={tdCls}>
                        <button className={btnImportSm}
                          onClick={() => ask('import', m.voucherType || m.category)}
                          disabled={streamRunning}>
                          📥
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

      {/* ════════════════════════════════════════
          TAB 2 — EXPORT TO TALLY
      ════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div>
          {/* section header */}
          <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #93c5fd', borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📤</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.3px' }}>Export to Tally</div>
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>Direction: ERP → Tally &nbsp;·&nbsp; Nothing is fetched from Tally</div>
              </div>
            </div>
            <button
              onClick={() => ask('export', 'Full')}
              disabled={streamRunning}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: streamRunning ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: streamRunning ? 0.6 : 1, boxShadow: '0 3px 12px rgba(37,99,235,0.35)' }}
            >
              <span style={{ fontSize: 18 }}>{streamRunning && streamDir === 'export' ? '⏳' : '📤'}</span>
              {streamRunning && streamDir === 'export' ? 'Exporting…' : 'Export All to Tally'}
            </button>
          </div>

          <div style={{ fontSize: 12, color: '#1e3a8a', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 12, lineHeight: 1.7 }}>
            <strong>One-way export only.</strong> Data is pushed <em>from</em> this ERP <em>into</em> Tally using the XML import API. Records are created or altered in Tally. Nothing is read from Tally.
          </div>
          <div style={{ fontSize: 12, color: '#713f12', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '8px 14px', marginBottom: 20, lineHeight: 1.7 }}>
            ⚠️ Export modifies Tally data. Uses <code>ACTION="Create"</code> for new and <code>ACTION="Alter"</code> for GUID-matched records. A confirmation dialog will appear.
          </div>

          {/* entity cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 24 }}>
            {EXPORT_ENTITIES.map(e => (
              <div key={e.key} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, transition: 'border-color 0.15s' }}
                onMouseEnter={ev => ev.currentTarget.style.borderColor = '#93c5fd'}
                onMouseLeave={ev => ev.currentTarget.style.borderColor = '#e2e8f0'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{e.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{e.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{e.desc}</div>
                  </div>
                </div>
                <button className={btnExportSm} onClick={() => ask('export', e.key)} disabled={streamRunning}>
                  📤 Export
                </button>
              </div>
            ))}
          </div>

          {/* transaction status table */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Export Status</div>
          {transactions.length === 0 ? <Spinner /> : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Transaction Type', 'Today', 'Synced', 'Pending', 'Failed', 'Last Export', 'Status', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} className={trCls}>
                      <td className={tdCls} style={{ fontWeight: 600 }}>{t.type}</td>
                      <td className={tdCls} style={{ fontWeight: 700 }}>{t.today}</td>
                      <td className={tdCls} style={{ fontWeight: 700, color: '#2563eb' }}>{t.synced}</td>
                      <td className={tdCls} style={{ color: t.pending > 0 ? '#f59e0b' : '#94a3b8', fontWeight: t.pending > 0 ? 700 : 400 }}>{t.pending}</td>
                      <td className={tdCls} style={{ color: t.failed > 0 ? '#ef4444' : '#94a3b8', fontWeight: t.failed > 0 ? 700 : 400 }}>{t.failed}</td>
                      <td className={tdCls} style={{ fontSize: 11, color: '#94a3b8' }}>{t.lastSync}</td>
                      <td className={tdCls}><StatusBadge status={t.status} type={t.status === 'Synced' ? 'success' : t.status === 'Pending' ? 'warning' : 'danger'} /></td>
                      <td className={tdCls}>
                        <button className={btnExportSm} onClick={() => ask('export', t.type.replace(' Vouchers', '').toLowerCase())} disabled={streamRunning}>📤</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 3 — LOGS
      ════════════════════════════════════════ */}
      {activeTab === 3 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>Operation Logs</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>All Import (Tally→ERP) and Export (ERP→Tally) history</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white font-[inherit]" value={logTypeFilter} onChange={e => setLogTypeFilter(e.target.value)}>
                {['All Types','Full','Purchase','Sales','Payment','Receipt','Journal','Item Master','Ledger'].map(t => <option key={t}>{t}</option>)}
              </select>
              <select className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-white font-[inherit]" value={logStatusFilter} onChange={e => setLogStatusFilter(e.target.value)}>
                {['All Status','Success','Failed','Partial'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={loadLogs} className={btnGray} style={{ fontSize: 12 }}>↻ Refresh</button>
            </div>
          </div>

          {loading ? <Spinner /> : (
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['', 'ID', 'Type', 'Direction', 'Status', 'Records', 'Time', 'Duration', 'Error', ''].map(h => <th key={h} className={thCls}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {syncLogs.length === 0 ? (
                    <tr><td colSpan={10} style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No logs yet. Run an import or export to see history here.</td></tr>
                  ) : syncLogs.map((log, i) => {
                    const isExp = (log.direction || '').includes('ERP');
                    const isExpanded = expandedLogId === log._id || expandedLogId === log.syncId;
                    const hasModules = log.modules && log.modules.length > 0;
                    return (
                      <>
                        <tr key={log._id || i} className={trCls} style={{ cursor: 'pointer' }} onClick={() => setExpandedLogId(isExpanded ? null : log._id || log.syncId)}>
                          <td className={tdCls} style={{ width: 30, textAlign: 'center' }}>
                            {hasModules ? (isExpanded ? '▼' : '▶') : ''}
                          </td>
                          <td className={tdCls} style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: isExp ? '#2563eb' : '#16a34a', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.syncId}</td>
                          <td className={tdCls}>
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: isExp ? '#eff6ff' : '#f0fdf4', color: isExp ? '#2563eb' : '#16a34a' }}>{log.type}</span>
                          </td>
                          <td className={tdCls}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: isExp ? '#dbeafe' : '#dcfce7', color: isExp ? '#1d4ed8' : '#15803d' }}>
                              {log.direction || (isExp ? 'ERP → Tally' : 'Tally → ERP')}
                            </span>
                          </td>
                          <td className={tdCls}><StatusBadge status={log.status} type={log.status === 'Success' ? 'success' : log.status === 'Partial' ? 'warning' : 'danger'} /></td>
                          <td className={tdCls} style={{ fontWeight: 700 }}>{log.records || 0}</td>
                          <td className={tdCls} style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(log.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td>
                          <td className={tdCls} style={{ fontFamily: 'monospace', fontSize: 11 }}>{log.duration || '—'}</td>
                          <td className={tdCls} style={{ fontSize: 11, color: log.error ? '#ef4444' : '#94a3b8', fontWeight: log.error ? 600 : 400, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.error || '—'}</td>
                          <td className={tdCls}>
                            {log.status === 'Failed' && (
                              <button className={isExp ? btnExportSm : btnImportSm} disabled={streamRunning}
                                onClick={(e) => { e.stopPropagation(); const isE = (log.direction||'').includes('ERP'); ask(isE ? 'export' : 'import', log.type || 'Full'); }}>
                                ↺ Retry
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && hasModules && (
                          <tr>
                            <td colSpan={10} style={{ padding: 0 }}>
                              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12 }}>Module Details</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                                  {log.modules.map((mod, j) => (
                                    <div key={j} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{mod.name}</div>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); navigate(mod.route); }}
                                          className={btnImportSm}
                                          style={{ fontSize: 11, padding: '4px 8px' }}>
                                          👁 View
                                        </button>
                                      </div>
                                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>
                                          Count: <span style={{ fontWeight: 700, color: '#3b82f6' }}>{mod.count}</span>
                                        </div>
                                        {mod.created !== undefined && mod.created > 0 && (
                                          <div style={{ fontSize: 11, color: '#64748b' }}>
                                            Created: <span style={{ fontWeight: 700, color: '#10b981' }}>{mod.created}</span>
                                          </div>
                                        )}
                                        {mod.updated !== undefined && mod.updated > 0 && (
                                          <div style={{ fontSize: 11, color: '#64748b' }}>
                                            Updated: <span style={{ fontWeight: 700, color: '#f59e0b' }}>{mod.updated}</span>
                                          </div>
                                        )}
                                        {mod.failed !== undefined && mod.failed > 0 && (
                                          <div style={{ fontSize: 11, color: '#64748b' }}>
                                            Failed: <span style={{ fontWeight: 700, color: '#ef4444' }}>{mod.failed}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                                        {new Date(mod.timestamp).toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          TAB 4 — SETTINGS
      ════════════════════════════════════════ */}
      {activeTab === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>

          {/* Connection */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Tally Connection</div>

            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: '#14532d', lineHeight: 1.6 }}>
              This URL is used for both <strong>Import</strong> (fetching) and <strong>Export</strong> (pushing).
            </div>

            <div className={fieldCls}>
              <label className={labelCls}>Tally Local URL <span style={{ color: '#ef4444' }}>*</span></label>
              <input className={inputCls} value={config.tallyLocalUrl || ''} onChange={e => setConfig(p => ({ ...p, tallyLocalUrl: e.target.value }))} placeholder="http://192.168.1.50" />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                Same LAN: <code>ipconfig</code> on Tally PC → IPv4.<br />
                Remote: Cloudflare tunnel → paste HTTPS URL.
              </div>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Port</label>
              <input className={inputCls} value={config.port || ''} onChange={e => setConfig(p => ({ ...p, port: e.target.value }))} placeholder="9000" />
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Company Name <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
              <input className={inputCls} value={config.companyName || ''} onChange={e => setConfig(p => ({ ...p, companyName: e.target.value }))} placeholder="Leave blank = active company" />
              <div style={{ fontSize: 11, color: config.companyName ? '#f59e0b' : '#16a34a', marginTop: 3 }}>
                {config.companyName ? 'Must match Tally exactly (case-sensitive)' : 'Uses whichever company is currently open in Tally'}
              </div>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Financial Year Start <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="date"
                className={inputCls}
                value={config.financialYearStart ? new Date(config.financialYearStart).toISOString().split('T')[0] : '2026-04-01'}
                onChange={e => setConfig(p => ({ ...p, financialYearStart: e.target.value }))}
              />
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                First day of your Tally company's financial year (e.g. 01 Apr 2026). Voucher import starts from this date.
              </div>
            </div>
            <div className={fieldCls}>
              <label className={labelCls}>Authentication</label>
              <select className={selectCls} value={config.authType || 'None'} onChange={e => setConfig(p => ({ ...p, authType: e.target.value }))}>
                {['None','Basic Auth','API Key'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleTestConnection} className={btnOutline}>Test Connection</button>
              <button onClick={handleSaveConfig} style={{ padding: '9px 20px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
            </div>

            {diagInfo && (
              <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 10, background: diagInfo.status === 'Connected' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${diagInfo.status === 'Connected' ? '#86efac' : '#fecaca'}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: diagInfo.status === 'Connected' ? '#166534' : '#dc2626' }}>
                  {diagInfo.status === 'Connected' ? '✅ Connected' : '❌ Not Reachable'}
                </div>
                <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                  {[['URL', diagInfo.url],['HTTP Status', diagInfo.httpStatus||'—'],['Error', diagInfo.error||'—'],['Preview', diagInfo.responsePreview||'—']].map(([k,v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '3px 8px 3px 0', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', width: 100, verticalAlign: 'top' }}>{k}</td>
                      <td style={{ padding: '3px 0', fontFamily: 'monospace', color: '#1e293b', wordBreak: 'break-all' }}>{v}</td>
                    </tr>
                  ))}
                </table>
              </div>
            )}

            {/* ── Connector credentials ── */}
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1.5px solid #e2e8f0' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>Connector Mode</div>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#1e3a8a', lineHeight: 1.6 }}>
                Generate credentials to allow the <strong>Srichakra Connector</strong> (Electron desktop app) to connect. Once generated, <code>useConnector</code> is enabled and imports are routed through the connector instead of direct HTTP.
              </div>
              <button
                onClick={handleGenerateCredentials}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 14 }}>
                🔑 Generate Connector Credentials
              </button>

              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: '#475569', marginBottom: 8 }}>Connector Status</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  {[
                    ['useConnector', config.useConnector ? '✅ Enabled' : '— Disabled'],
                    ['Connector ID',  config.connectorId  || '—'],
                    ['Last Seen',     connectorStatus && Array.isArray(connectorStatus) && connectorStatus.length > 0
                      ? (connectorStatus[0].lastSeen ? new Date(connectorStatus[0].lastSeen).toLocaleString('en-IN') : '—')
                      : '—'],
                  ].map(([k, v]) => (
                    <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 8px 4px 0', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap', width: 120, verticalAlign: 'top' }}>{k}</td>
                      <td style={{ padding: '4px 0', fontFamily: 'monospace', color: '#1e293b', wordBreak: 'break-all' }}>{v}</td>
                    </tr>
                  ))}
                </table>
              </div>
            </div>
          </div>

          {/* Auto-import */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e2e8f0', padding: '20px 22px' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>Auto-Import Schedule</div>

            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#713f12', lineHeight: 1.6 }}>
              ⚠️ <strong>Auto-import only (Tally → ERP).</strong> The scheduler never auto-exports — export must always be triggered manually by the user.
            </div>

            <div className={fieldCls}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!config.autoSync} onChange={e => setConfig(p => ({ ...p, autoSync: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Enable Auto-Import (Tally → ERP)</span>
              </label>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, marginLeft: 24 }}>Automatically pull latest data from Tally at the selected interval</div>
            </div>

            <div className={fieldCls}>
              <label className={labelCls}>Import Interval</label>
              <select className={selectCls} value={config.syncInterval || 'Every 15 minutes'} onChange={e => setConfig(p => ({ ...p, syncInterval: e.target.value }))}>
                {['Every 30 seconds','Every 1 minute','Every 5 minutes','Every 15 minutes','Every 30 minutes','Every 1 hour','Manual only'].map(s => <option key={s}>{s}</option>)}
              </select>
              {(config.syncInterval === 'Every 30 seconds' || config.syncInterval === 'Every 1 minute') && (
                <div style={{ fontSize: 11, color: '#b45309', marginTop: 3 }}>⚠ Very short intervals increase server load. Use only on same LAN.</div>
              )}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10, marginTop: 4 }}>What to Auto-Import</div>
            {[
              ['masterData',      'Master Data (Items, Ledgers)'],
              ['purchaseVouchers','Purchase Vouchers'],
              ['salesVouchers',   'Sales Vouchers'],
              ['paymentVouchers', 'Payment Vouchers'],
              ['receiptVouchers', 'Receipt Vouchers'],
              ['journalVouchers', 'Journal Vouchers'],
              ['contraVouchers',  'Contra Vouchers'],
            ].map(([key, lbl]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#475569' }}>{lbl}</span>
                <input type="checkbox" checked={!!config.syncPrefs?.[key]} onChange={e => setConfig(p => ({ ...p, syncPrefs: { ...p.syncPrefs, [key]: e.target.checked } }))} style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
              </div>
            ))}

            <button onClick={handleSaveConfig} style={{ marginTop: 16, width: '100%', padding: '11px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
