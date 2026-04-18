const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const categoryApi = {
  getAll: () => fetch(`${BASE}/categories`).then(handle),
  create: (name) =>
    fetch(`${BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(handle),
  delete: (id) => fetch(`${BASE}/categories/${id}`, { method: 'DELETE' }).then(handle),
};
