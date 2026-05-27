const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };

export const materialReturnApi = {
  // Master Lifecycle
  getAll:  (p = {}) => fetch(`${BASE}/returns?${new URLSearchParams(p)}`, { headers: authHeaders() }).then(handle),
  getById: (id) => fetch(`${BASE}/returns/${id}`, { headers: authHeaders() }).then(handle),
  getStats: () => fetch(`${BASE}/returns/dashboard`, { headers: authHeaders() }).then(handle),
  getInvoiceContext: (invoiceNo) => fetch(`${BASE}/returns/context/${encodeURIComponent(invoiceNo)}`, { headers: authHeaders() }).then(handle),
  create:  (body) => fetch(`${BASE}/returns/create`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  approve: (id) => fetch(`${BASE}/returns/${id}/approve`, { method: 'PUT', headers: authHeaders() }).then(handle),
  generateDocket: (id, data) => fetch(`${BASE}/returns/${id}/docket`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  createGateEntry: (id) => fetch(`${BASE}/returns/${id}/gate-entry`, { method: 'POST', headers: authHeaders() }).then(handle),
  receiveMaterial: (id, data) => fetch(`${BASE}/returns/${id}/receive`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  qcVerify: (id, data) => fetch(`${BASE}/returns/${id}/qc-verify`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  inventoryUpdate: (id) => fetch(`${BASE}/returns/${id}/inventory-update`, { method: 'POST', headers: authHeaders() }).then(handle),
  financeClose: (id, data) => fetch(`${BASE}/returns/${id}/finance-close`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  updateStatus: (id, data) => fetch(`${BASE}/returns/${id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  updateStage: (id, stage) => fetch(`${BASE}/returns/${id}/stage`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ stage }) }).then(handle),
  
  // Specific Module Actions
  processQC: (id, data) => fetch(`${BASE}/returns/${id}/qc`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  processInventory: (id) => fetch(`${BASE}/returns/${id}/inventory`, { method: 'POST', headers: authHeaders() }).then(handle),
  processReconciliation: (id, data) => fetch(`${BASE}/returns/${id}/reconciliation`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  processLoss: (id, data) => fetch(`${BASE}/returns/${id}/loss`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  updateTransport: (id, data) => fetch(`${BASE}/returns/${id}/transport`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  
  // Warehouse Operations
  getWarehouseQueue: () => fetch(`${BASE}/returns/warehouse/queue`, { headers: authHeaders() }).then(handle),
  getWarehouseReturns: () => fetch(`${BASE}/returns/warehouse/returns`, { headers: authHeaders() }).then(handle),
  receiveAtWarehouse: (id, data) => fetch(`${BASE}/returns/${id}/warehouse/receive`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),

  // Workflow tracking
  getWorkflowStatus: (id) => fetch(`${BASE}/returns/${id}/workflow/status`, { headers: authHeaders() }).then(handle),
  processWorkflowStage: (id, stage) => fetch(`${BASE}/returns/${id}/workflow/process`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ stage }) }).then(handle),

  // Utilities
  delete: (id) => fetch(`${BASE}/returns/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
};
