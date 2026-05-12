import axios from 'axios';

const API_BASE = '/api/packaging';

export const packagingApi = {
  // Get all packaging options
  getAll: async () => {
    const response = await axios.get(`${API_BASE}`);
    return response.data;
  },

  // Get packaging by ID
  getById: async (id) => {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  },

  // Create new packaging option
  create: async (data) => {
    const response = await axios.post(`${API_BASE}`, data);
    return response.data;
  },

  // Update packaging option
  update: async (id, data) => {
    const response = await axios.put(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Delete packaging option
  delete: async (id) => {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  },

  // Get active packaging options
  getActive: async () => {
    const response = await axios.get(`${API_BASE}?status=Active`);
    return response.data;
  },
};
