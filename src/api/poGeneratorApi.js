const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:5001/api');
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };
const q = (p = {}) => { const s = new URLSearchParams(p).toString(); return s ? '?' + s : ''; };

export const poGeneratorApi = {
  getStats:          ()             => fetch(`${BASE}/po-generator/stats`,                          { headers: authHeaders() }).then(handle),
  getUploadSummary:  (params = {})  => fetch(`${BASE}/po-generator/upload-summary${q(params)}`,     { headers: authHeaders() }).then(handle),
  listPOs:           (params = {})  => fetch(`${BASE}/po-generator/pos${q(params)}`,                { headers: authHeaders() }).then(handle),
  deletePO:          (id)           => fetch(`${BASE}/po-generator/pos/${id}`,                       { method: 'DELETE', headers: authHeaders() }).then(handle),
  stockCheck:        (poId)         => fetch(`${BASE}/po-generator/stock-check/${poId}`,             { headers: authHeaders() }).then(handle),
  generateInvoice:   (body)         => fetch(`${BASE}/po-generator/generate-invoice`,               { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  generateInvoiceFromPDF: (body)    => fetch(`${BASE}/po-generator/generate-invoice-from-pdf`,      { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  listInvoices:      (params = {})  => fetch(`${BASE}/po-generator/invoices${q(params)}`,           { headers: authHeaders() }).then(handle),
  listGRNInvoices:   (params = {})  => fetch(`${BASE}/po-generator/invoices${q({ ...params, prefix: 'GRNINV' })}`, { headers: authHeaders() }).then(handle),
  getInvoiceById:    (id)           => fetch(`${BASE}/po-generator/invoices/${id}`,                  { headers: authHeaders() }).then(handle),
  updateInvoiceStatus:(id, status)  => fetch(`${BASE}/po-generator/invoices/${id}/status`,          { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) }).then(handle),
  updateDelivery:    (id, items)    => fetch(`${BASE}/po-generator/invoices/${id}/delivery`,         { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ items }) }).then(handle),
  deleteInvoice:     (id)           => fetch(`${BASE}/po-generator/invoices/${id}`,                  { method: 'DELETE', headers: authHeaders() }).then(handle),
  listPendingOrders: (params = {})  => fetch(`${BASE}/po-generator/pending-orders${q(params)}`,     { headers: authHeaders() }).then(handle),
  updatePendingOrder:(id, body)     => fetch(`${BASE}/po-generator/pending-orders/${id}`,           { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  migrateHSN:        ()             => fetch(`${BASE}/po-generator/migrate-hsn`,                    { method: 'POST', headers: authHeaders() }).then(handle),
};
