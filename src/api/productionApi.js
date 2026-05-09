const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const getBOMs = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/production/boms${q ? '?' + q : ''}`, { headers: authHeaders() }).then(handle);
};

export const getWorkOrders = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/production/work-orders${q ? '?' + q : ''}`, { headers: authHeaders() }).then(handle);
};

export const getProductionStats = () => {
  return fetch(`${BASE}/production/stats`, { headers: authHeaders() }).then(handle);
};

export const createWorkOrder = (body) => {
  return fetch(`${BASE}/production/work-orders`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle);
};

export const createBOM = (body) => {
  return fetch(`${BASE}/production/boms`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle);
};

export const updateWorkOrderProgress = (id, produced) => {
  return fetch(`${BASE}/production/work-orders/${id}/progress`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ produced }) }).then(handle);
};

// New BOM & Inventory Integration APIs
export const calculateMaterialRequirements = (bomId, productionQty) => {
  return fetch(`${BASE}/production/work-orders/calculate-requirements`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ bomId, productionQty })
  }).then(handle);
};

export const checkInventoryStatus = (woId) => {
  return fetch(`${BASE}/production/work-orders/${woId}/inventory-check`, { headers: authHeaders() }).then(handle);
};

export const approveWorkOrder = (woId) => {
  return fetch(`${BASE}/production/work-orders/${woId}/approve`, { method: 'POST', headers: authHeaders() }).then(handle);
};

export const rejectWorkOrder = (woId, reason) => {
  return fetch(`${BASE}/production/work-orders/${woId}/reject`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ reason })
  }).then(handle);
};

export const completeWorkOrder = (woId, actualProduced) => {
  return fetch(`${BASE}/production/work-orders/${woId}/complete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ actualProduced })
  }).then(handle);
};
