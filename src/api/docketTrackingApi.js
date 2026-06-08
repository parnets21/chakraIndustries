import api from './axiosConfig';

const docketTrackingApi = {
  // Get all dockets with filtering
  getAllDockets: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/docket-tracking${queryParams ? `?${queryParams}` : ''}`);
      return response;
    } catch (error) {
      console.error('Error fetching dockets:', error);
      throw error;
    }
  },

  // Get single docket by ID
  getDocketById: async (id) => {
    try {
      const response = await api.get(`/docket-tracking/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching docket details:', error);
      throw error;
    }
  },

  // Create new docket
  createDocket: async (data) => {
    try {
      const response = await api.post('/docket-tracking', data);
      return response;
    } catch (error) {
      console.error('Error creating docket:', error);
      throw error;
    }
  },

  // Update docket
  updateDocket: async (id, data) => {
    try {
      const response = await api.put(`/docket-tracking/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating docket:', error);
      throw error;
    }
  },

  // Update docket status
  updateDocketStatus: async (id, statusData) => {
    try {
      const response = await api.patch(`/docket-tracking/${id}/status`, statusData);
      return response;
    } catch (error) {
      console.error('Error updating docket status:', error);
      throw error;
    }
  },

  // Delete docket
  deleteDocket: async (id) => {
    try {
      const response = await api.delete(`/docket-tracking/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting docket:', error);
      throw error;
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/docket-tracking/stats');
      return response;
    } catch (error) {
      console.error('Error fetching docket stats:', error);
      throw error;
    }
  },

  // Track by LR number
  trackByLRNumber: async (lrNumber) => {
    try {
      const response = await api.get(`/docket-tracking/track/${lrNumber}`);
      return response;
    } catch (error) {
      console.error('Error tracking by LR number:', error);
      throw error;
    }
  },

  // Upload POD
  uploadPOD: async (id, podData) => {
    try {
      const response = await api.post(`/docket-tracking/${id}/pod`, podData);
      return response;
    } catch (error) {
      console.error('Error uploading POD:', error);
      throw error;
    }
  },

  // Close docket
  closeDocket: async (id, closeData) => {
    try {
      const response = await api.patch(`/docket-tracking/${id}/close`, closeData);
      return response;
    } catch (error) {
      console.error('Error closing docket:', error);
      throw error;
    }
  }
};

export default docketTrackingApi;
