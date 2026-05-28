const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

/**
 * Generic response handler.
 * - HTTP errors (4xx/5xx) → throw
 * - HTTP 200 with success:false + offline:true → return as-is (caller handles offline state)
 * - HTTP 200 with success:false (other) → throw with message
 */
const handle = async (res) => {
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || 'Request failed');
  // Offline / Tally-not-reachable: return the object so callers can check d.offline
  if (!d.success && d.offline) return d;
  return d;
};

const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const tallyApi = {
  getConfig:       ()       => fetch(`${BASE}/tally/config`,           { headers: authHeaders() }).then(handle),
  saveConfig:      (body)   => fetch(`${BASE}/tally/config`,           { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fixConfig:       ()       => fetch(`${BASE}/tally/config/fix`,       { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
  testConnection:  ()       => fetch(`${BASE}/tally/test-connection`,  { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
  getSyncLogs:     (p = {}) => fetch(`${BASE}/tally/logs${q(p)}`,      { headers: authHeaders() }).then(handle),
  getSyncStats:    ()       => fetch(`${BASE}/tally/stats`,            { headers: authHeaders() }).then(handle),
  getMasterData:   ()       => fetch(`${BASE}/tally/master-data`,      { headers: authHeaders() }).then(handle),
  getTransactions: ()       => fetch(`${BASE}/tally/transactions`,     { headers: authHeaders() }).then(handle),
  triggerSync:     (body)   => fetch(`${BASE}/tally/sync`,             { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  fullSync:        ()       => fetch(`${BASE}/tally/sync`,             { method: 'POST', headers: authHeaders(), body: JSON.stringify({ type: 'Full' }) }).then(handle),
  retrySync:       (id)     => fetch(`${BASE}/tally/retry/${id}`,      { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
};
