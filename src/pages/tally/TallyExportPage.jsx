/**
 * TallyExportPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated "Export to Tally" page for Sri Chakra Industries ERP.
 *
 * Features:
 *  • One-click "Export to Tally" button
 *  • Pre-flight: validates Tally connection + confirms "Sri Chakra Industries" is open
 *  • Live SSE progress terminal (14 export tasks)
 *  • Per-task success / failure tracking
 *  • Full export report on completion with time taken
 *  • Settings panel to configure Tally URL + company name
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { tallyApi } from '../../api/tallyApi';
import { toast } from '../../components/common/Toast';

// ─── Style constants ──────────────────────────────────────────────────────────
const card  = { background: '#fff', borderRadius: 16, border: '1.5px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '22px 24px' };
const mono  = { fontFamily: "'Cascadia Code','Fira Mono','Consolas',monospace", fontSize: 12 };

// Status badge colors
const STATUS_COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
  failed:  { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
  warning: { bg: '#fefce8', border: '#fde047', text: '#a16207' },
  pending: { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8' },
  running: { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
};

function Badge({ status, children }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {children}
    </span>
  );
}

// ─── Connection status widget ─────────────────────────────────────────────────
function ConnectionStatus({ status, openCompany, companyMatch, expectedCompany, onRecheck }) {
  if (status === 'checking') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 12 }}>
        <Spinner size={16} color="#2563eb" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8' }}>Connecting to Tally…</span>
      </div>
    );
  }
  if (status === 'unreachable') {
    return (
      <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderLeft: '4px solid #ef4444', borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>⚠️ Cannot connect to Tally</div>
        <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
          Make sure Tally Prime is running and the HTTP Server is enabled:<br />
          <strong>Tally Prime → F12 → Configure → Advanced Configuration → Enable ODBC/HTTP Server: Yes, Port: 9000</strong>
        </div>
        <button onClick={onRecheck} style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#dc2626', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          Retry Connection →
        </button>
      </div>
    );
  }
  if (status === 'wrong-company') {
    return (
      <div style={{ padding: '14px 16px', background: '#fefce8', border: '1.5px solid #fde047', borderLeft: '4px solid #f59e0b', borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ Wrong company open in Tally</div>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
          Expected: <strong>{expectedCompany}</strong><br />
          Currently open: <strong>{openCompany || 'Unknown'}</strong><br />
          Please open <strong>{expectedCompany}</strong> in Tally Prime, then click Retry.
        </div>
        <button onClick={onRecheck} style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#92400e', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          Retry after opening correct company →
        </button>
      </div>
    );
  }
  if (status === 'connected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12 }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Tally connected</span>
          {openCompany && <span style={{ fontSize: 12, color: '#166534', marginLeft: 8 }}>Company: <strong>{openCompany}</strong></span>}
        </div>
        <button onClick={onRecheck} style={{ marginLeft: 'auto', fontSize: 11, color: '#15803d', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Recheck</button>
      </div>
    );
  }
  return null;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 20, color = '#2563eb' }) {
  return (
    <>
      <div style={{ width: size, height: size, border: `3px solid ${color}22`, borderTop: `3px solid ${color}`, borderRadius: '50%', animation: 'tally-spin 0.7s linear infinite', flexShrink: 0 }} />
      <style>{`@keyframes tally-spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, color = '#2563eb' }) {
  return (
    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 99, transition: 'width 0.35s ease' }} />
    </div>
  );
}

// ─── Export counts card ───────────────────────────────────────────────────────
function ExportCountsPanel({ counts }) {
  if (!counts) return null;
  const tasks = [
    { key: 'units',             icon: '📐', label: 'Units of Measure' },
    { key: 'stockGroups',       icon: '🗂️',  label: 'Stock Groups' },
    { key: 'godowns',           icon: '🏭', label: 'Godowns / Warehouses' },
    { key: 'systemLedgers',     icon: '📒', label: 'Ledger Masters' },
    { key: 'vendorLedgers',     icon: '🤝', label: 'Vendor / Supplier Masters' },
    { key: 'customerLedgers',   icon: '👥', label: 'Customer Masters' },
    { key: 'stockItems',        icon: '📦', label: 'Stock Items + Opening Stock + GST' },
    { key: 'salesInvoices',     icon: '🧾', label: 'Sales Invoices' },
    { key: 'purchaseInvoices',  icon: '🛒', label: 'Purchase Invoices' },
    { key: 'creditNotes',       icon: '💳', label: 'Credit Notes' },
    { key: 'debitNotes',        icon: '📋', label: 'Debit Notes' },
    { key: 'paymentVouchers',   icon: '💸', label: 'Payment Vouchers' },
    { key: 'receiptVouchers',   icon: '💰', label: 'Receipt Vouchers' },
    { key: 'journalVouchers',   icon: '📓', label: 'Journal Vouchers' },
  ];
  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📊 Data to be Exported</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: 99, padding: '3px 12px' }}>
          Total: {counts.total?.toLocaleString() || 0} records
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {tasks.map(t => {
          const d = counts[t.key];
          const n = d?.count ?? 0;
          return (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d?.label || t.label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: n > 0 ? '#1e293b' : '#cbd5e1' }}>{n.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Live terminal ────────────────────────────────────────────────────────────
function Terminal({ logs, done, onClose, onCancel, running }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);

  return (
    <div style={{ background: '#0f172a', borderRadius: 14, padding: '14px 18px', marginBottom: 20, border: '1.5px solid #1e3a8a' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!done
            ? <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#60a5fa', animation: 'tally-pulse 1s infinite' }} />
            : <span style={{ fontSize: 14 }}>✅</span>
          }
          <span style={{ ...mono, color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>
            {done ? 'Export Complete' : 'Exporting to Tally…'}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#1e3a8a', color: '#60a5fa', border: '1px solid #1d4ed8' }}>
            ERP → Tally
          </span>
        </div>
        {done
          ? <button onClick={onClose} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', ...mono }}>Close</button>
          : <button onClick={onCancel} style={{ background: 'none', border: '1px solid #ef4444', color: '#f87171', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', ...mono }}>Cancel</button>
        }
      </div>
      <div ref={ref} style={{ maxHeight: 260, overflowY: 'auto', ...mono, lineHeight: 1.8, paddingRight: 2 }}>
        {logs.map((l, i) => (
          <div key={i} style={{
            color: l.level === 'error'   ? '#f87171'
                 : l.level === 'warn'    ? '#fbbf24'
                 : l.level === 'success' ? '#4ade80'
                 : l.level === 'phase'   ? '#fbbf24'
                 : '#64748b',
            whiteSpace: 'pre-wrap',
          }}>{l.text}</div>
        ))}
        {!done && <div style={{ color: '#334155' }}>▌</div>}
      </div>
      <style>{`@keyframes tally-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ─── Export Report Table ───────────────────────────────────────────────────────
function ExportReport({ taskResults, stats, duration, startTime }) {
  if (!taskResults?.length) return null;
  const success = taskResults.filter(t => t.ok);
  const failed  = taskResults.filter(t => !t.ok);
  const warned  = taskResults.filter(t => t.ok && t.warning);

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#1e293b', marginBottom: 4 }}>
            {failed.length === 0 ? '🎉 Export Completed Successfully' : '⚠️ Export Completed with Errors'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {startTime && `Started at ${new Date(startTime).toLocaleTimeString('en-IN')} · `}
            Duration: <strong>{duration}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '10px 18px', minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#15803d' }}>{stats?.total || 0}</div>
            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>Total Records</div>
          </div>
          <div style={{ textAlign: 'center', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: '10px 18px', minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#15803d' }}>{success.length}</div>
            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>Tasks OK</div>
          </div>
          {warned.length > 0 && (
            <div style={{ textAlign: 'center', background: '#fefce8', border: '1px solid #fde047', borderRadius: 12, padding: '10px 18px', minWidth: 90 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#a16207' }}>{warned.length}</div>
              <div style={{ fontSize: 11, color: '#a16207', fontWeight: 600 }}>Warnings</div>
            </div>
          )}
          {failed.length > 0 && (
            <div style={{ textAlign: 'center', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '10px 18px', minWidth: 90 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>{failed.length}</div>
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Tasks Failed</div>
            </div>
          )}
        </div>
      </div>

      {/* Per-task table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>Entity</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>Records</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>Created</th>
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>Altered</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid #e2e8f0' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {taskResults.map((t, i) => (
              <tr key={t.key || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{t.label || t.key}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {t.ok
                    ? t.warning ? <Badge status="warning">⚠️ Warning</Badge> : <Badge status="success">✅ Success</Badge>
                    : <Badge status="failed">❌ Failed</Badge>
                  }
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>{(t.records || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{(t.created || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{(t.altered || 0).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: t.ok ? '#a16207' : '#dc2626', fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.error || t.warning || '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
              <td colSpan={3} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>TOTAL</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#1e293b' }}>{taskResults.reduce((s, t) => s + (t.records || 0), 0).toLocaleString()}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#15803d' }}>{taskResults.reduce((s, t) => s + (t.created || 0), 0).toLocaleString()}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 900, color: '#f59e0b' }}>{taskResults.reduce((s, t) => s + (t.altered || 0), 0).toLocaleString()}</td>
              <td style={{ padding: '10px 12px' }} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ config, onChange, onSave, saving }) {
  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 16 }}>⚙️ Tally Connection Settings</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
            Tally Local URL <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            value={config.tallyLocalUrl || ''}
            onChange={e => onChange('tallyLocalUrl', e.target.value)}
            placeholder="http://localhost or http://192.168.1.10"
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            IP/hostname of the computer running Tally Prime (default port 9000)
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Port</label>
          <input
            value={config.port || '9000'}
            onChange={e => onChange('port', e.target.value)}
            placeholder="9000"
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Tally HTTP server port (default: 9000)</div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>
            Company Name in Tally <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            value={config.companyName || ''}
            onChange={e => onChange('companyName', e.target.value)}
            placeholder="Sri Chakra Industries"
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            Must match exactly the company name in Tally Prime
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 }}>Authentication</label>
          <select
            value={config.authType || 'None'}
            onChange={e => onChange('authType', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          >
            <option value="None">None</option>
            <option value="Basic Auth">Basic Auth</option>
            <option value="API Key">API Key</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 14, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
        <strong>How to enable Tally HTTP Server:</strong><br />
        Open Tally Prime → press <kbd style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace' }}>F12</kbd> → Configure → Advanced Configuration → set <strong>Enable ODBC/HTTP Server: Yes</strong> → set Port: <strong>9000</strong> → Accept
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', background: saving ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {saving ? <><Spinner size={14} color="#fff" /> Saving…</> : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function TallyExportPage() {
  // ── Connection state ────────────────────────────────────────────────────────
  const [connStatus, setConnStatus]       = useState('idle'); // idle | checking | connected | unreachable | wrong-company
  const [openCompany, setOpenCompany]     = useState(null);
  const [companyMatch, setCompanyMatch]   = useState(false);

  // ── Config ──────────────────────────────────────────────────────────────────
  const [config, setConfig]   = useState({ tallyLocalUrl: '', port: '9000', companyName: 'Sri Chakra Industries', authType: 'None' });
  const [savingCfg, setSavingCfg] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ── Export counts ────────────────────────────────────────────────────────────
  const [exportCounts, setExportCounts] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // ── Stream / export state ───────────────────────────────────────────────────
  const [running, setRunning]       = useState(false);
  const [termOpen, setTermOpen]     = useState(false);
  const [termDone, setTermDone]     = useState(false);
  const [logs, setLogs]             = useState([]);
  const [progress, setProgress]     = useState({ current: 0, total: 14 });

  // ── Report ──────────────────────────────────────────────────────────────────
  const [taskResults, setTaskResults] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [reportDuration, setReportDuration] = useState('');
  const [exportStartTime, setExportStartTime] = useState(null);

  // ── Refs ────────────────────────────────────────────────────────────────────
  const esRef     = useRef(null);
  const taskBuf   = useRef([]); // accumulate per-task results during stream

  // ── Load config + counts on mount ──────────────────────────────────────────
  useEffect(() => {
    loadConfig();
    loadCounts();
  }, []);

  const loadConfig = async () => {
    try {
      await tallyApi.fixConfig().catch(() => {});
      const r = await tallyApi.getConfig();
      if (r.data) setConfig(p => ({ ...p, ...r.data }));
    } catch (_) {}
  };

  const loadCounts = async () => {
    setLoadingCounts(true);
    try {
      const r = await tallyApi.getExportCounts();
      if (r.data) setExportCounts(r.data);
    } catch (_) {} finally { setLoadingCounts(false); }
  };

  // ── Check Tally connection + company ──────────────────────────────────────
  const checkConnection = useCallback(async () => {
    setConnStatus('checking');
    try {
      const r = await tallyApi.validateCompany();
      const d = r.data;
      if (!d.reachable) {
        setConnStatus('unreachable');
      } else if (!d.companyMatch && config.companyName) {
        setConnStatus('wrong-company');
        setOpenCompany(d.openCompany);
        setCompanyMatch(false);
      } else {
        setConnStatus('connected');
        setOpenCompany(d.openCompany);
        setCompanyMatch(true);
      }
    } catch (e) {
      setConnStatus('unreachable');
    }
  }, [config.companyName]);

  // ── Save settings ──────────────────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingCfg(true);
    try {
      await tallyApi.saveConfig(config);
      toast('Settings saved', 'success');
      setShowSettings(false);
      // Recheck after save
      setConnStatus('idle');
    } catch (e) {
      toast(e.message || 'Save failed', 'error');
    } finally { setSavingCfg(false); }
  };

  // ── Add log line ──────────────────────────────────────────────────────────
  const pushLog = (level, text) => setLogs(p => [...p, { level, text }]);

  // ── Start Export ──────────────────────────────────────────────────────────
  const startExport = async () => {
    if (running) { toast('An export is already in progress', 'error'); return; }

    // If connection not validated yet, validate first
    if (connStatus !== 'connected') {
      await checkConnection();
      // We'll let the user click again after seeing the status
      return;
    }

    // Launch stream
    esRef.current?.close();
    setRunning(true);
    setTermOpen(true);
    setTermDone(false);
    setLogs([]);
    setTaskResults([]);
    setReportStats(null);
    setReportDuration('');
    setProgress({ current: 0, total: 14 });
    taskBuf.current = [];
    setExportStartTime(Date.now());

    const onEvent = (ev) => {
      switch (ev.event) {
        case 'start':
          pushLog('info', `▶ ${ev.message}`);
          break;

        case 'log':
          pushLog(ev.level || 'info', `  ${ev.entity ? `[${ev.entity}] ` : ''}${ev.message}`);
          break;

        case 'phase_start':
          pushLog('phase', `\n  [${ev.index}/${ev.total}] ⏳ ${ev.entity}`);
          setProgress({ current: ev.index, total: ev.total });
          break;

        case 'phase_done':
          if (ev.ok) {
            pushLog('success', `  ✅ ${ev.entity}: ${ev.records || 0} records exported${ev.warning ? ` ⚠️ ${ev.warning.slice(0, 80)}` : ''}`);
          } else {
            pushLog('error', `  ❌ ${ev.entity}: ${ev.error || 'Failed'}`);
          }
          taskBuf.current.push({
            key: ev.entity?.toLowerCase().replace(/\s+/g, '_') || String(taskBuf.current.length),
            label: ev.entity,
            ok: ev.ok,
            records: ev.records || 0,
            created: ev.created || 0,
            altered: ev.altered || 0,
            error: ev.error,
            warning: ev.warning,
          });
          setTaskResults([...taskBuf.current]);
          break;

        case 'summary':
          pushLog('success', `\n🎉 ${ev.message}`);
          setReportStats(ev.stats);
          setReportDuration(ev.duration || '');
          if (ev.results) {
            taskBuf.current = ev.results;
            setTaskResults([...ev.results]);
          }
          break;

        case 'done':
          setTermDone(true);
          setRunning(false);
          if (ev.stats) setReportStats(ev.stats);
          if (ev.duration) setReportDuration(ev.duration);
          esRef.current?.close();
          loadCounts(); // refresh counts after export
          toast('Export to Tally completed!', 'success');
          break;

        case 'error':
          pushLog('error', `❌ ${ev.message}`);
          if (ev.openCompany && ev.expectedCompany) {
            setConnStatus('wrong-company');
            setOpenCompany(ev.openCompany);
          }
          setTermDone(true);
          setRunning(false);
          esRef.current?.close();
          toast(ev.message, 'error');
          break;

        default:
          break;
      }
    };

    const es = tallyApi.openFullExportStream(onEvent);
    esRef.current = es;
  };

  const cancelExport = () => {
    esRef.current?.close();
    esRef.current = null;
    setRunning(false);
    setTermDone(true);
    pushLog('warn', '\n⚠️ Export cancelled by user');
    toast('Export cancelled', 'warning');
  };

  const closeTerminal = () => {
    setTermOpen(false);
    setLogs([]);
  };

  // ── Determine button state ────────────────────────────────────────────────
  const needsConnection = connStatus === 'idle' || connStatus === 'unreachable' || connStatus === 'wrong-company';
  const canExport       = connStatus === 'connected' && !running;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 4px' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', borderRadius: 12, width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📤</span>
            Export to Tally
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '5px 0 0 50px', fontWeight: 500 }}>
            Push all ERP data into Tally Prime — Sri Chakra Industries
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowSettings(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={loadCounts}
            disabled={loadingCounts}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#475569', cursor: loadingCounts ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {loadingCounts ? <Spinner size={14} color="#475569" /> : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* ── Settings panel (collapsible) ── */}
      {showSettings && (
        <SettingsPanel
          config={config}
          onChange={(k, v) => setConfig(p => ({ ...p, [k]: v }))}
          onSave={saveSettings}
          saving={savingCfg}
        />
      )}

      {/* ── Connection status ── */}
      {connStatus !== 'idle' && (
        <div style={{ marginBottom: 16 }}>
          <ConnectionStatus
            status={connStatus}
            openCompany={openCompany}
            companyMatch={companyMatch}
            expectedCompany={config.companyName}
            onRecheck={checkConnection}
          />
        </div>
      )}

      {/* ── Config warning ── */}
      {!config.tallyLocalUrl && (
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#fef2f2', border: '1.5px solid #fca5a5', borderLeft: '4px solid #ef4444', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>🔧</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Tally URL not configured</div>
            <div style={{ fontSize: 12, color: '#b91c1c' }}>
              Click <strong>⚙️ Settings</strong> above and enter the Tally Local URL (e.g. <code style={{ background: '#fee2e2', padding: '1px 5px', borderRadius: 4 }}>http://localhost</code> if Tally is on the same computer).
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN EXPORT BUTTON ── */}
      <div style={{ marginBottom: 22 }}>
        <button
          onClick={needsConnection && !running ? checkConnection : startExport}
          disabled={running || (connStatus === 'wrong-company')}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
            padding: '22px 28px',
            background: running
              ? 'linear-gradient(135deg,#1d4ed8,#1e40af)'
              : connStatus === 'wrong-company'
              ? '#94a3b8'
              : 'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            cursor: running || connStatus === 'wrong-company' ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: running ? 'none' : '0 8px 32px rgba(59,130,246,0.38)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!running && connStatus !== 'wrong-company') { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(59,130,246,0.48)'; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = running ? 'none' : '0 8px 32px rgba(59,130,246,0.38)'; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
            {running ? <Spinner size={24} color="#fff" /> : needsConnection ? '🔌' : '📤'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>
              {running ? 'Exporting to Tally…' : needsConnection ? 'Connect to Tally' : 'Export to Tally'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 500, marginTop: 3 }}>
              {running
                ? `Exporting ${progress.current} of ${progress.total} entity types…`
                : needsConnection
                ? 'Validate Tally connection and company before export'
                : 'ERP → Tally  ·  Push all masters, invoices & vouchers to Sri Chakra Industries'}
            </div>
          </div>
        </button>

        {/* Progress bar shown during export */}
        {running && (
          <div style={{ marginTop: 8 }}>
            <ProgressBar value={(progress.current / progress.total) * 100} color="#3b82f6" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              <span>Step {progress.current} of {progress.total}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Export counts panel ── */}
      {exportCounts && !termOpen && <ExportCountsPanel counts={exportCounts} />}

      {/* ── Live terminal ── */}
      {termOpen && (
        <Terminal
          logs={logs}
          done={termDone}
          running={running}
          onClose={closeTerminal}
          onCancel={cancelExport}
        />
      )}

      {/* ── Export report ── */}
      {taskResults.length > 0 && (
        <ExportReport
          taskResults={taskResults}
          stats={reportStats}
          duration={reportDuration}
          startTime={exportStartTime}
        />
      )}

      {/* ── How it works ── */}
      {!termOpen && !taskResults.length && (
        <div style={{ ...card }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 14 }}>📋 What gets exported (in order)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {[
              { n: 1,  icon: '📐', label: 'Units of Measure',        desc: 'Nos, Kg, Ltr, Mtr, Box, Pcs, Gm, Ml' },
              { n: 2,  icon: '🗂️',  label: 'Stock Groups',           desc: 'All ERP product categories → Tally stock groups' },
              { n: 3,  icon: '🏭', label: 'Godowns / Warehouses',    desc: 'All active warehouses as Tally godowns' },
              { n: 4,  icon: '📒', label: 'Ledger Masters',          desc: 'GST, Sales, Purchase, ERP account ledgers' },
              { n: 5,  icon: '🤝', label: 'Vendor / Supplier Masters', desc: 'Vendors as Sundry Creditors with GSTIN' },
              { n: 6,  icon: '👥', label: 'Customer Masters',        desc: 'Clients + Corporate Clients as Sundry Debtors' },
              { n: 7,  icon: '📦', label: 'Stock Items + GST + Opening Stock', desc: 'All active items with HSN codes and opening balances' },
              { n: 8,  icon: '🧾', label: 'Sales Invoices',          desc: 'Sent / Paid invoices as Sales vouchers' },
              { n: 9,  icon: '🛒', label: 'Purchase Invoices',       desc: 'Approved POs as Purchase vouchers' },
              { n: 10, icon: '💳', label: 'Credit Notes',            desc: 'Open / Closed credit notes as Credit Note vouchers' },
              { n: 11, icon: '📋', label: 'Debit Notes',             desc: 'Approved debit notes as Debit Note vouchers' },
              { n: 12, icon: '💸', label: 'Payment Vouchers',        desc: 'ERP payment vouchers not yet in Tally' },
              { n: 13, icon: '💰', label: 'Receipt Vouchers',        desc: 'ERP receipt vouchers not yet in Tally' },
              { n: 14, icon: '📓', label: 'Journal Vouchers',        desc: 'ERP journal entries not yet in Tally' },
            ].map(item => (
              <div key={item.n} style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, fontWeight: 900, color: '#2563eb' }}>{item.n}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, fontSize: 12, color: '#1e40af', lineHeight: 1.7 }}>
            <strong>ℹ️ Smart sync:</strong> Records are created in Tally if they don't exist, or altered if they do (uses Tally GUID as dedup key). No duplicates are created on re-export. The export is fault-tolerant — if one task fails, the rest continue.
          </div>
        </div>
      )}
    </div>
  );
}
