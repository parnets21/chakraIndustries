const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handle = async (res) => {
  if (!res.ok) {
    const text = await res.text();
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

export const poApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/purchase-orders${q ? '?' + q : ''}`).then(handle);
  },
  getById: (id) => fetch(`${BASE}/purchase-orders/${id}`).then(handle),
  create: (body) =>
    fetch(`${BASE}/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  update: (id, body) =>
    fetch(`${BASE}/purchase-orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  updateStatus: (id, status) =>
    fetch(`${BASE}/purchase-orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handle),
  delete: (id) => fetch(`${BASE}/purchase-orders/${id}`, { method: 'DELETE' }).then(handle),
};
