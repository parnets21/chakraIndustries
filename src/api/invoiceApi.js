const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const fetchWithRetry = async (url, options = {}, retries = 2) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (retries > 0 && (err.name === 'TypeError' || err.message.includes('Failed to fetch'))) {
      console.warn(`Fetch failed, retrying... (${retries} left)`);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
};

const getUrl = (path, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return query ? `${BASE}${path}?${query}` : `${BASE}${path}`;
};

export const invoiceApi = {
  getAll:       (params = {}) => fetchWithRetry(getUrl('/invoices', params), { headers: authHeaders() }),
  getStats:     ()            => fetchWithRetry(getUrl('/invoices/stats'), { headers: authHeaders() }),
  getById:      (id)          => fetchWithRetry(getUrl(`/invoices/${id}`), { headers: authHeaders() }),
  create:       (body)        => fetchWithRetry(getUrl('/invoices'), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }),
  bulkUpload:   (body)        => fetchWithRetry(getUrl('/invoices/bulk-upload'), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }),
  migrateTypes: ()            => fetchWithRetry(getUrl('/invoices/migrate-types'), { method: 'POST', headers: authHeaders() }),
  update:       (id, body)    => fetchWithRetry(getUrl(`/invoices/${id}`), { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) }),
  updateStatus: (id, status)  => fetchWithRetry(getUrl(`/invoices/${id}/status`), { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status }) }),
  delete:       (id)          => fetchWithRetry(getUrl(`/invoices/${id}`), { method: 'DELETE', headers: authHeaders() }),
  deleteAll:    ()            => fetchWithRetry(getUrl('/invoices/delete-all'), { method: 'POST', headers: authHeaders() }),
  sendEmail:    (id, body)    => fetchWithRetry(getUrl(`/invoices/${id}/send-email`), { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }),
  getByInvoiceNo: (invoiceNo) => fetchWithRetry(getUrl(`/invoices/no/${invoiceNo}`), { headers: authHeaders() }),
};
