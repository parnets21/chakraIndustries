const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const departmentApi = {
  getAll: () => fetch(`${BASE}/departments`).then(handle),
  create: (name) =>
    fetch(`${BASE}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(handle),
  delete: (id) => fetch(`${BASE}/departments/${id}`, { method: 'DELETE' }).then(handle),
};
