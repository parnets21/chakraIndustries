const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:5001/api');
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };

export const materialReturnApi = {
  getAll:  (p = {}) => fetch(`${BASE}/material-returns?${new URLSearchParams(p)}`, { headers: authHeaders() }).then(handle),
  getStats: ()      => fetch(`${BASE}/material-returns/stats`, { headers: authHeaders() }).then(handle),
  getInvoiceContext: (invoiceNo) => fetch(`${BASE}/material-returns/invoice/${encodeURIComponent(invoiceNo)}/context`, { headers: authHeaders() }).then(handle),
  create:  (body)   => fetch(`${BASE}/material-returns`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  updateStage: (id, stage) => fetch(`${BASE}/material-returns/${id}/stage`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ stage }) }).then(handle),
  issueCreditNote: (id, creditNoteId) => fetch(`${BASE}/material-returns/${id}/credit-note`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ creditNoteId }) }).then(handle),
  delete:  (id)     => fetch(`${BASE}/material-returns/${id}`, { method: 'DELETE', headers: authHeaders() }).then(handle),
  
  // New warehouse workflow APIs
  getWarehouseQueue: () => fetch(`${BASE}/material-returns/warehouse/queue`, { headers: authHeaders() }).then(handle),
  warehouseReceive: (id, data) => fetch(`${BASE}/material-returns/${id}/warehouse/receive`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  qcReceive: (id, data) => fetch(`${BASE}/material-returns/${id}/qc/receive`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  updateTransportStatus: (id, transportStatus) => fetch(`${BASE}/material-returns/${id}/transport/status`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ transportStatus }) }).then(handle),
  
  // Workflow tracking APIs
  getWorkflowStatus: (id) => fetch(`${BASE}/material-returns/${id}/workflow/status`, { headers: authHeaders() }).then(handle),
  processWorkflowStage: (id, stage) => fetch(`${BASE}/material-returns/${id}/workflow/process`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ stage }) }).then(handle),
  
  // Warehouse receive APIs
  getWarehouseReturns: () => fetch(`${BASE}/material-returns/warehouse/returns`, { headers: authHeaders() }).then(handle),
  receiveAtWarehouse: (id, data) => fetch(`${BASE}/material-returns/${id}/warehouse/receive`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  processQC: (id, data) => fetch(`${BASE}/material-returns/${id}/qc/process`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
  
  // Tracking update API
  updateTracking: (id, data) => fetch(`${BASE}/material-returns/${id}/tracking`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) }).then(handle),
};
