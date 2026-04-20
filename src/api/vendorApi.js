const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com0/api';

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const vendorApi = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetch(`${BASE}/vendors${q ? '?' + q : ''}`).then(handle);
  },
  getById: (id) => fetch(`${BASE}/vendors/${id}`).then(handle),
  create: (body) =>
    fetch(`${BASE}/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  update: (id, body) =>
    fetch(`${BASE}/vendors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(handle),
  delete: (id) => fetch(`${BASE}/vendors/${id}`, { method: 'DELETE' }).then(handle),
  getStats: () => fetch(`${BASE}/vendors/stats`).then(handle),
};
