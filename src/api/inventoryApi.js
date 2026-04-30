const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };
const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const inventoryApi = {
  // ── Stock Items ────────────────────────────────────────────────────────────
  getAll:    (params = {}) => fetch(`${BASE}/inventory${q(params)}`,          { headers: authHeaders() }).then(handle),
  getStats:  ()            => fetch(`${BASE}/inventory/stats`,                 { headers: authHeaders() }).then(handle),
  create:    (body)        => fetch(`${BASE}/inventory`,                       { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  adjust:    (id, body)    => fetch(`${BASE}/inventory/${id}/adjust`,          { method: 'PATCH',  headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  move:      (id, body)    => fetch(`${BASE}/inventory/${id}/move`,            { method: 'PATCH',  headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  delete:    (id)          => fetch(`${BASE}/inventory/${id}`,                 { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── Warehouses ─────────────────────────────────────────────────────────────
  getWarehouses:      ()         => fetch(`${BASE}/inventory/warehouses`,           { headers: authHeaders() }).then(handle),
  getNextWarehouseId: ()         => fetch(`${BASE}/inventory/warehouses/next-id`,   { headers: authHeaders() }).then(handle),
  createWarehouse:    (body)     => fetch(`${BASE}/inventory/warehouses`,           { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  updateWarehouse:    (id, body) => fetch(`${BASE}/inventory/warehouses/${id}`,     { method: 'PUT',    headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteWarehouse:    (id)       => fetch(`${BASE}/inventory/warehouses/${id}`,     { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── Movements ──────────────────────────────────────────────────────────────
  getMovements:    (params = {}) => fetch(`${BASE}/inventory/movements${q(params)}`, { headers: authHeaders() }).then(handle),
  createMovement:  (body)        => fetch(`${BASE}/inventory/movements`,             { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteMovement:  (id)          => fetch(`${BASE}/inventory/movements/${id}`,       { method: 'DELETE', headers: authHeaders() }).then(handle),
};
