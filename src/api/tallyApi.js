const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:5001/api');
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const handle = async (res) => {
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || 'Request failed');
  if (!d.success && d.offline) return d;
  return d;
};

const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

/**
 * openDirectionalStream — opens an SSE connection for Import or Export.
 *
 * @param {'import'|'export'} direction  - which stream to open
 * @param {string}            type       - entity type ('Full', 'Items', 'Ledgers', etc.)
 * @param {Function}          onEvent    - callback({ event, entity, message, stats, ... })
 * @returns {EventSource}   call .close() to cancel
 *
 * Events emitted:
 *   start       — connection established
 *   phase       — entity group starting
 *   phase_start — individual entity starting { entity, index, total }
 *   phase_done  — individual entity complete { entity, records, ok, error? }
 *   log         — detailed log line { level, entity, message }
 *   summary     — final summary { stats, logs, message }
 *   done        — stream complete { stats, duration }
 *   error       — fatal error { message }
 */
function openDirectionalStream(direction, type = 'Full', onEvent) {
  const token = getToken();
  const endpoint = direction === 'export' ? 'export-stream' : 'import-stream';
  const url = `${BASE}/tally/${endpoint}?type=${encodeURIComponent(type)}&token=${encodeURIComponent(token)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try { onEvent(JSON.parse(e.data)); } catch (_) {}
  };
  es.onerror = () => {
    onEvent({ event: 'error', message: 'Stream connection lost. Check your network and try again.' });
    es.close();
  };
  return es;
}

export const tallyApi = {
  // ── Configuration ─────────────────────────────────────────────────────────
  getConfig:        ()       => fetch(`${BASE}/tally/config`,                    { headers: authHeaders() }).then(handle),
  saveConfig:       (body)   => fetch(`${BASE}/tally/config`,                    { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fixConfig:        ()       => fetch(`${BASE}/tally/config/fix`,                { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
  testConnection:   ()       => fetch(`${BASE}/tally/test-connection`,           { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),

  // ── IMPORT FROM TALLY (Tally → ERP) ───────────────────────────────────────
  /**
   * openImportStream — pull data FROM Tally INTO the ERP.
   * @param {string}   type     - 'Full' | 'Items' | 'Ledgers' | 'Purchase' | 'Sales' |
   *                              'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'master' | 'transaction'
   * @param {Function} onEvent  - callback(evt)
   * @returns {EventSource}
   */
  openImportStream: (type = 'Full', onEvent) => openDirectionalStream('import', type, onEvent),
  importFromTally:  (body)   => fetch(`${BASE}/tally/import`,                    { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),

  // ── EXPORT TO TALLY (ERP → Tally) ─────────────────────────────────────────
  /**
   * openExportStream — push data FROM the ERP INTO Tally.
   * @param {string}   type     - 'Full' | 'masters' | 'purchase' | 'sales' | 'payment' | 'receipt'
   * @param {Function} onEvent  - callback(evt)
   * @returns {EventSource}
   */
  openExportStream: (type = 'Full', onEvent) => openDirectionalStream('export', type, onEvent),
  exportToTally:    (body)   => fetch(`${BASE}/tally/export`,                    { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),

  // ── Legacy sync (kept for backward compatibility) ──────────────────────────
  triggerSync:      (body)   => fetch(`${BASE}/tally/sync`,                      { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fullSync:         ()       => fetch(`${BASE}/tally/sync`,                      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'Full' }) }).then(handle),
  retrySync:        (id)     => fetch(`${BASE}/tally/retry/${id}`,               { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),

  /** @deprecated Use openImportStream or openExportStream instead */
  openSyncStream: (type = 'Full', onEvent) => openDirectionalStream('import', type, onEvent),

  // ── Status / Logs ──────────────────────────────────────────────────────────
  getSyncLogs:      (p = {}) => fetch(`${BASE}/tally/logs${q(p)}`,               { headers: authHeaders() }).then(handle),
  getSyncStats:     ()       => fetch(`${BASE}/tally/stats`,                     { headers: authHeaders() }).then(handle),
  getMasterData:    ()       => fetch(`${BASE}/tally/master-data`,               { headers: authHeaders() }).then(handle),
  getTransactions:  ()       => fetch(`${BASE}/tally/transactions`,              { headers: authHeaders() }).then(handle),

  // ── Vouchers (All types: Sales, Purchase, Payment, Receipt, Journal, Contra)
  getVouchers:      (p = {}) => fetch(`${BASE}/tally/vouchers${q(p)}`,           { headers: authHeaders() }).then(handle),
  createVoucher:    (body)   => fetch(`${BASE}/tally/vouchers`,                  { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  updateVoucher:    (id, body) => fetch(`${BASE}/tally/vouchers/${id}`,          { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteVoucher:    (id)     => fetch(`${BASE}/tally/vouchers/${id}`,            { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── GUID sync status ───────────────────────────────────────────────────────
  getGuidStatus:    ()       => fetch(`${BASE}/tally/guid-status`,               { headers: authHeaders() }).then(handle),

  // ── Full diagnostics (config + connectivity + DB counts + recent logs) ─────
  getDiagnostics:   ()       => fetch(`${BASE}/tally/diagnostics`,               { headers: authHeaders() }).then(handle),
};
