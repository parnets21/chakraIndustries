const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };
const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const sortingApi = {
  getAll: (params = {}) => fetch(`${BASE}/sorting${q(params)}`, { headers: authHeaders() }).then(handle),
  getById: (id) => fetch(`${BASE}/sorting/${id}`, { headers: authHeaders() }).then(handle),
  create: (body) => fetch(`${BASE}/sorting`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  update: (id, body) => fetch(`${BASE}/sorting/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  delete: (id) => fetch(`${BASE}/sorting/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};

export default sortingApi;
