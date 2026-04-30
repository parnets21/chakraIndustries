import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const qcApi = {
  create: async (data) => {
    const res = await axios.post(`${API_BASE}/quality-checks`, data);
    return res.data;
  },

  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.grnId) params.append('grnId', filters.grnId);
    if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);

    const res = await axios.get(`${API_BASE}/quality-checks?${params}`);
    return res.data;
  },

  getById: async (id) => {
    const res = await axios.get(`${API_BASE}/quality-checks/${id}`);
    return res.data;
  },

  updateStatus: async (id, status, approvalNotes) => {
    const res = await axios.put(`${API_BASE}/quality-checks/${id}/status`, {
      status,
      approvalNotes
    });
    return res.data;
  },

  getStats: async () => {
    const res = await axios.get(`${API_BASE}/quality-checks/stats`);
    return res.data;
  },

  delete: async (id) => {
    const res = await axios.delete(`${API_BASE}/quality-checks/${id}`);
    return res.data;
  }
};
