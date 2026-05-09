import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Brand Order
export const createBrandOrder = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/brand-orders`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all Brand Orders
export const getBrandOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_BASE_URL}/brand-orders${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Brand Order by ID
export const getBrandOrderById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/brand-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update Brand Order
export const updateBrandOrder = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/brand-orders/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Approve Brand Order
export const approveBrandOrder = async (id, approvalStatus) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/brand-orders/${id}/approve`, { approvalStatus });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel Brand Order
export const cancelBrandOrder = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/brand-orders/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
