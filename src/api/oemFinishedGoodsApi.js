import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Finished Goods
export const createFinishedGoods = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-finished-goods`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all Finished Goods
export const getFinishedGoods = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_BASE_URL}/oem-finished-goods${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Finished Goods by ID
export const getFinishedGoodsById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-finished-goods/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update Finished Goods Status
export const updateFinishedGoodsStatus = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/oem-finished-goods/${id}/status`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Finished Goods Summary
export const getFinishedGoodsSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-finished-goods/summary/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
