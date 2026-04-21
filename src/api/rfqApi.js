const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handle = async (res) => {
  console.log('🔵 API Response Status:', res.status, res.statusText);
  console.log('🔵 API Response URL:', res.url);
  
  if (!res.ok) {
    const text = await res.text();
    console.error('❌ API Error Response:', text);
    let errorMsg = 'Request failed';
    try {
      const data = JSON.parse(text);
      errorMsg = data.message || errorMsg;
    } catch (e) {
      errorMsg = `${res.status} ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }
  
  const data = await res.json();
  return data;
};

export const rfqApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const url = `${BASE}/rfqs${q ? '?' + q : ''}`;
    console.log('🔵 RFQ API - Fetching from:', url);
    return fetch(url).then(handle);
  },
  getById: (id) => fetch(`${BASE}/rfqs/${id}`).then(handle),
  create: (body) =>
    fetch(`${BASE}/rfqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  update: (id, body) =>
    fetch(`${BASE}/rfqs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  updateStatus: (id, status) =>
    fetch(`${BASE}/rfqs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handle),
  addQuotation: (id, quotation) =>
    fetch(`${BASE}/rfqs/${id}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotation),
    }).then(handle),
  delete: (id) => fetch(`${BASE}/rfqs/${id}`, { method: 'DELETE' }).then(handle),
};
