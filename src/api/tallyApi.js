const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const handle = async (res) => {
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || 'Request failed');
  if (!d.success && d.offline) return d;
  return d;
};

const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const tallyApi = {
  // ── Configuration ─────────────────────────────────────────────────────────
  getConfig:        ()       => fetch(`${BASE}/tally/config`,                    { headers: authHeaders() }).then(handle),
  saveConfig:       (body)   => fetch(`${BASE}/tally/config`,                    { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fixConfig:        ()       => fetch(`${BASE}/tally/config/fix`,                { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
  testConnection:   ()       => fetch(`${BASE}/tally/test-connection`,           { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),

  // ── Sync ───────────────────────────────────────────────────────────────────
  triggerSync:      (body)   => fetch(`${BASE}/tally/sync`,                      { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fullSync:         ()       => fetch(`${BASE}/tally/sync`,                      { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'Full' }) }).then(handle),
  retrySync:        (id)     => fetch(`${BASE}/tally/retry/${id}`,               { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),

  // ── Status / Logs ──────────────────────────────────────────────────────────
  getSyncLogs:      (p = {}) => fetch(`${BASE}/tally/logs${q(p)}`,               { headers: authHeaders() }).then(handle),
  getSyncStats:     ()       => fetch(`${BASE}/tally/stats`,                     { headers: authHeaders() }).then(handle),
  getMasterData:    ()       => fetch(`${BASE}/tally/master-data`,               { headers: authHeaders() }).then(handle),
  getTransactions:  ()       => fetch(`${BASE}/tally/transactions`,              { headers: authHeaders() }).then(handle),

  // ── Vouchers (Payments & Receipts) ─────────────────────────────────────────
  getVouchers:      (p = {}) => fetch(`${BASE}/tally/vouchers${q(p)}`,           { headers: authHeaders() }).then(handle),
  createVoucher:    (body)   => fetch(`${BASE}/tally/vouchers`,                  { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteVoucher:    (id)     => fetch(`${BASE}/tally/vouchers/${id}`,            { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── GUID sync status ───────────────────────────────────────────────────────
  getGuidStatus:    ()       => fetch(`${BASE}/tally/guid-status`,               { headers: authHeaders() }).then(handle),
};
