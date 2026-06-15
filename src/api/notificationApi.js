const BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin + '/api' : 'http://localhost:5001/api/api');
const getToken = () => localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const fetchWithRetry = async (url, options = {}, retries = 2) => {
  try {
    const res = await fetch(url, options);
    // Handle 304 Not Modified as success with empty data
    if (res.status === 304) {
      return { success: true, data: [], notModified: true };
    }
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

const getUrl = (path) => `${BASE}${path}`;

export const notificationApi = {
  getAll: () => fetchWithRetry(getUrl('/notifications'), { headers: authHeaders() }),
  dismiss: (notificationId) => fetchWithRetry(getUrl(`/notifications/${notificationId}/dismiss`), { method: 'POST', headers: authHeaders() }),
  clearAll: () => fetchWithRetry(getUrl('/notifications/clear-all'), { method: 'POST', headers: authHeaders() }),
};
