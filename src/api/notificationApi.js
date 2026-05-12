const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => {
  const token = localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
  console.log('Token from storage:', token ? `${token.substring(0, 20)}...` : 'null');
  return token;
};
const authHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  console.log('Auth headers:', { ...headers, Authorization: headers.Authorization ? `Bearer ${headers.Authorization.substring(7, 27)}...` : 'null' });
  return headers;
};
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };

export const notificationApi = {
  getAll: () => fetch(`${BASE}/notifications`, { headers: authHeaders() }).then(handle),
};
