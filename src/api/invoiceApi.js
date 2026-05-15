const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };
const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const invoiceApi = {
  getAll:       (params = {}) => fetch(`${BASE}/invoices${q(params)}`,          { headers: authHeaders() }).then(handle),
  getStats:     ()            => fetch(`${BASE}/invoices/stats`,                 { headers: authHeaders() }).then(handle),
  getById:      (id)          => fetch(`${BASE}/invoices/${id}`,                 { headers: authHeaders() }).then(handle),
  create:       (body)        => fetch(`${BASE}/invoices`,                       { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  bulkUpload:   (body)        => fetch(`${BASE}/invoices/bulk-upload`,           { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  migrateTypes: ()            => fetch(`${BASE}/invoices/migrate-types`,         { method: 'POST',   headers: authHeaders() }).then(handle),
  update:       (id, body)    => fetch(`${BASE}/invoices/${id}`,                 { method: 'PUT',    headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  updateStatus: (id, status)  => fetch(`${BASE}/invoices/${id}/status`,          { method: 'PATCH',  headers: authHeaders(), body: JSON.stringify({ status }) }).then(handle),
  delete:       (id)          => fetch(`${BASE}/invoices/${id}`,                 { method: 'DELETE', headers: authHeaders() }).then(handle),
  deleteAll:    ()            => fetch(`${BASE}/invoices/delete-all`,             { method: 'POST',   headers: authHeaders() }).then(handle),
  sendEmail:    (id, body)    => fetch(`${BASE}/invoices/${id}/send-email`,       { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
};
