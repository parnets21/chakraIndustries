import axiosInstance from './axiosConfig';

const API_BASE_URL = '/api/material-returns'; // Use Material Returns as base for integrated flow

const docketTrackingApi = {
  // Get dockets (returns with DOCKET_CREATED or higher stage)
  getAllDockets: async (params = {}) => {
    try {
      // If we want specific stages for Docket Tracking, we can filter them
      const response = await axiosInstance.get(API_BASE_URL, {
        params: {
          ...params,
          stages: [
            'DOCKET_CREATED',
            'PENDING_VEHICLE_ASSIGNMENT',
            'VEHICLE_ASSIGNED',
            'OUT_FOR_PICKUP',
            'PICKED_UP',
            'IN_TRANSIT',
            'ARRIVED_AT_WAREHOUSE',
            'RECEIVED'
          ].join(',')
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dockets:', error);
      throw error;
    }
  },

  // Update docket/transport info (Vehicle, Driver, Courier, AWB, LR)
  updateDocket: async (id, data) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/${id}/transport`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating docket:', error);
      throw error;
    }
  },

  // Update Status/Stage (for specific actions like Start Pickup, Mark Arrived)
  updateStatus: async (id, statusData) => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/${id}/transport`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  },

  // Track docket by ID (returns single MR entry with timeline)
  getDocketById: async (id) => {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching docket details:', error);
      throw error;
    }
  },

  // Delete/Cancel Docket (soft delete by changing stage or status)
  deleteDocket: async (id) => {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting docket:', error);
      throw error;
    }
  }
};

export default docketTrackingApi;
