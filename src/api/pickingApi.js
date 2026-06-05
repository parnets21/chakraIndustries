const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:5001/api');

const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = (isGet = false) => {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (!isGet) headers['Content-Type'] = 'application/json';
  return headers;
};
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };
const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const pickingApi = {
  // Get all picking lists
  getAll: (params = {}) => fetch(`${BASE}/picking${q(params)}`, { headers: authHeaders(true) }).then(handle),
  
  // Get picking stats
  getStats: () => fetch(`${BASE}/picking/stats`, { headers: authHeaders(true) }).then(handle),
  
  // Create picking list
  create: (body) => fetch(`${BASE}/picking`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  
  // Get picking list by ID
  getById: (id) => fetch(`${BASE}/picking/${id}`, { headers: authHeaders(true) }).then(handle),
  
  // Update picking list status
  updateStatus: (id, body) => fetch(`${BASE}/picking/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  
  // Delete picking list
  delete: (id) => fetch(`${BASE}/picking/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};

export default pickingApi;
