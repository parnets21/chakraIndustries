const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };
const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const tallyApi = {
  getConfig:          ()       => fetch(`${BASE}/tally/config`,                { headers: authHeaders() }).then(handle),
  saveConfig:         (body)   => fetch(`${BASE}/tally/config`,                { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  testConnection:     ()       => fetch(`${BASE}/tally/test-connection`,       { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
  getSyncLogs:        (p = {}) => fetch(`${BASE}/tally/logs${q(p)}`,           { headers: authHeaders() }).then(handle),
  getSyncStats:       ()       => fetch(`${BASE}/tally/stats`,                 { headers: authHeaders() }).then(handle),
  getMasterData:      ()       => fetch(`${BASE}/tally/master-data`,           { headers: authHeaders() }).then(handle),
  getTransactions:    ()       => fetch(`${BASE}/tally/transactions`,          { headers: authHeaders() }).then(handle),
  triggerSync:        (body)   => fetch(`${BASE}/tally/sync`,                  { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  retrySync:          (id)     => fetch(`${BASE}/tally/retry/${id}`,           { method: 'POST', headers: authHeaders(), body: '{}' }).then(handle),
};
