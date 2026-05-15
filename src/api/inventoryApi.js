import { globalRateLimiter } from '../utils/rateLimiter.js';

const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';

const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const handle = async (res) => { 
  const d = await res.json(); 
  if (!res.ok) {
    if (res.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    throw new Error(d.message || 'Request failed'); 
  }
  return d; 
};

const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

// Rate-limited fetch wrapper
const rateLimitedFetch = async (url, options = {}) => {
  await globalRateLimiter.waitIfNeeded();
  return fetch(url, options);
};

export const inventoryApi = {
  // ── Stock Items ────────────────────────────────────────────────────────────
  getAll:    (params = {}) => rateLimitedFetch(`${BASE}/inventory${q(params)}`,          { headers: authHeaders() }).then(handle),
  getStats:  ()            => rateLimitedFetch(`${BASE}/inventory/stats`,                 { headers: authHeaders() }).then(handle),
  create:    (body)        => rateLimitedFetch(`${BASE}/inventory`,                       { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  adjust:    (id, body)    => rateLimitedFetch(`${BASE}/inventory/${id}/adjust`,          { method: 'PATCH',  headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  move:      (id, body)    => rateLimitedFetch(`${BASE}/inventory/${id}/move`,            { method: 'PATCH',  headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  delete:    (id)          => rateLimitedFetch(`${BASE}/inventory/${id}`,                 { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── Warehouses ─────────────────────────────────────────────────────────────
  getWarehouses:      ()         => rateLimitedFetch(`${BASE}/inventory/warehouses`,           { headers: authHeaders() }).then(handle),
  getNextWarehouseId: ()         => rateLimitedFetch(`${BASE}/inventory/warehouses/next-id`,   { headers: authHeaders() }).then(handle),
  createWarehouse:    (body)     => rateLimitedFetch(`${BASE}/inventory/warehouses`,           { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  updateWarehouse:    (id, body) => rateLimitedFetch(`${BASE}/inventory/warehouses/${id}`,     { method: 'PUT',    headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteWarehouse:    (id, force = false) => rateLimitedFetch(`${BASE}/inventory/warehouses/${id}${force ? '?force=true' : ''}`,     { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── Movements ──────────────────────────────────────────────────────────────
  getMovements:    (params = {}) => rateLimitedFetch(`${BASE}/inventory/movements${q(params)}`, { headers: authHeaders() }).then(handle),
  createMovement:  (body)        => rateLimitedFetch(`${BASE}/inventory/movements`,             { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteMovement:  (id)          => rateLimitedFetch(`${BASE}/inventory/movements/${id}`,       { method: 'DELETE', headers: authHeaders() }).then(handle),

  // ── GRN to Inventory Conversion ────────────────────────────────────────────
  convertGRNToInventory: (grnId) => rateLimitedFetch(`${BASE}/inventory/convert-grn/${grnId}`, { method: 'POST', headers: authHeaders() }).then(handle),
};
