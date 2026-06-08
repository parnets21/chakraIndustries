// Shared fetch helpers — mirrors the pattern used across the rest of the API layer
const BASE = import.meta.env.VITE_API_URL || 'https://chakraindustries-backend.onrender.com/api';

const getToken = () =>
  localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');

export const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const handle = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('chakra_token');
    localStorage.removeItem('chakra_user');
    sessionStorage.removeItem('chakra_token');
    sessionStorage.removeItem('chakra_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const d = await res.json();
  if (!res.ok) throw new Error(d.message || 'Request failed');
  return d;
};

export const api = {
  get:    (path)        => fetch(`${BASE}${path}`,  { headers: authHeaders() }).then(handle),
  post:   (path, body)  => fetch(`${BASE}${path}`,  { method: 'POST',   headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  put:    (path, body)  => fetch(`${BASE}${path}`,  { method: 'PUT',    headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  patch:  (path, body)  => fetch(`${BASE}${path}`,  { method: 'PATCH',  headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  delete: (path)        => fetch(`${BASE}${path}`,  { method: 'DELETE', headers: authHeaders() }).then(handle),
};

export default api;
