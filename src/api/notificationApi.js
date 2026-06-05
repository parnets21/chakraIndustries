const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:5001/api');
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const handle = async (res) => { const d = await res.json(); if (!res.ok) throw new Error(d.message || 'Request failed'); return d; };

export const notificationApi = {
  getAll: () => fetch(`${BASE}/notifications`, { headers: authHeaders() }).then(handle),
  dismiss: (notificationId) => fetch(`${BASE}/notifications/${notificationId}/dismiss`, { method: 'POST', headers: authHeaders() }).then(handle),
  clearAll: () => fetch(`${BASE}/notifications/clear-all`, { method: 'POST', headers: authHeaders() }).then(handle),
};
