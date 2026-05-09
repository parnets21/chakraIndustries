import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Auto-create Work Order from OEM Order
export const createWorkOrderFromOEM = async (oemOrderId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/from-oem`, { oemOrderId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create Work Order manually
export const createWorkOrder = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all Work Orders
export const getWorkOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_BASE_URL}/work-orders${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Work Order by ID
export const getWorkOrderById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/work-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Approve Work Order
export const approveWorkOrder = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Validate Inventory
export const validateInventory = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/validate-inventory`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reserve Materials
export const reserveMaterials = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/reserve-materials`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Start Production
export const startProduction = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/start-production`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update Produced Quantity
export const updateProducedQty = async (id, produced) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/work-orders/${id}/produced-qty`, { produced });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Complete Work Order
export const completeWorkOrder = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/complete`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Hold Work Order
export const holdWorkOrder = async (id, remarks) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/hold`, { remarks });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel Work Order
export const cancelWorkOrder = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Consume Materials
export const consumeMaterials = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/work-orders/${id}/consume-materials`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Work Order Summary
export const getWorkOrderSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/work-orders/summary/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
