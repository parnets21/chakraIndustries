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
 * @param {'import'|'export'|'full-export'|'selective-export'} direction
 * @param {string}   type    - entity type or task key
 * @param {Function} onEvent - callback({ event, entity, message, stats, ... })
 * @returns {EventSource}   call .close() to cancel
 */
function openDirectionalStream(direction, type = 'Full', onEvent) {
  const token = getToken();
  let url;
  if (direction === 'full-export') {
    url = `${BASE}/tally/full-export-stream?token=${encodeURIComponent(token)}`;
  } else if (direction === 'selective-export') {
    url = `${BASE}/tally/selective-export?key=${encodeURIComponent(type)}&token=${encodeURIComponent(token)}`;
  } else {
    const endpoint = direction === 'export' ? 'export-stream' : 'import-stream';
    url = `${BASE}/tally/${endpoint}?type=${encodeURIComponent(type)}&token=${encodeURIComponent(token)}`;
  }
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

  // ── Company Validation ─────────────────────────────────────────────────────
  /**
   * Validates that Tally is running and the correct company ("Sri Chakra Industries") is open.
   * Returns: { reachable, openCompany, companyMatch, error }
   */
  validateCompany:  ()       => fetch(`${BASE}/tally/validate-company`,          { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),

  // ── Export Counts (pre-flight data summary) ────────────────────────────────
  getExportCounts:  ()       => fetch(`${BASE}/tally/export-counts`,             { headers: authHeaders() }).then(handle),

  // ── IMPORT FROM TALLY (Tally → ERP) ───────────────────────────────────────
  openImportStream: (type = 'Full', onEvent) => openDirectionalStream('import', type, onEvent),
  importFromTally:  (body)   => fetch(`${BASE}/tally/import`,                    { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),

  // ── EXPORT TO TALLY — Complete system (ERP → Tally) ───────────────────────
  /**
   * openFullExportStream — streams all 14 export tasks to Tally.
   * Validates connection + company before starting.
   * @param {Function} onEvent - callback(evt)
   * @returns {EventSource}
   */
  openFullExportStream: (onEvent) => openDirectionalStream('full-export', 'Full', onEvent),

  /**
   * openSelectiveExportStream — exports a single entity type.
   * @param {string}   key     - task key (e.g. 'salesInvoices', 'vendorLedgers', etc.)
   * @param {Function} onEvent - callback(evt)
   * @returns {EventSource}
   */
  openSelectiveExportStream: (key, onEvent) => openDirectionalStream('selective-export', key, onEvent),

  // ── EXPORT TO TALLY — Legacy (kept for backward compat) ───────────────────
  openExportStream: (type = 'Full', onEvent) => openDirectionalStream('export', type, onEvent),
  exportToTally:    (body)   => fetch(`${BASE}/tally/export`,                    { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),

  // ── Legacy sync (kept for backward compatibility) ──────────────────────────
  triggerSync:      (body)   => fetch(`${BASE}/tally/sync`,                      { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fullSync:         ()       => fetch(`${BASE}/tally/sync`,                      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'Full' }) }).then(handle),
  retrySync:        (id)     => fetch(`${BASE}/tally/retry/${id}`,               { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),

  /** @deprecated Use openImportStream or openFullExportStream instead */
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
