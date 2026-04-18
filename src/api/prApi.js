const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const prApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/purchase-requisitions${q ? '?' + q : ''}`).then(handle);
  },
  getById: (id) => fetch(`${BASE}/purchase-requisitions/${id}`).then(handle),
  create: (body) =>
    fetch(`${BASE}/purchase-requisitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  update: (id, body) =>
    fetch(`${BASE}/purchase-requisitions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  updateStatus: (id, status) =>
    fetch(`${BASE}/purchase-requisitions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(handle),
  delete: (id) => fetch(`${BASE}/purchase-requisitions/${id}`, { method: 'DELETE' }).then(handle),
};
