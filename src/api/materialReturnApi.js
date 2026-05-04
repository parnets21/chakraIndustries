const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };

export const materialReturnApi = {
  getAll:  (p = {}) => fetch(`${BASE}/material-returns?${new URLSearchParams(p)}`, { headers: authHeaders() }).then(handle),
  getStats: ()      => fetch(`${BASE}/material-returns/stats`, { headers: authHeaders() }).then(handle),
  create:  (body)   => fetch(`${BASE}/material-returns`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  updateStage: (id, stage) => fetch(`${BASE}/material-returns/${id}/stage`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ stage }) }).then(handle),
  issueCreditNote: (id, creditNoteId) => fetch(`${BASE}/material-returns/${id}/credit-note`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ creditNoteId }) }).then(handle),
  delete:  (id)     => fetch(`${BASE}/material-returns/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};
