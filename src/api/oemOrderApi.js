import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create OEM Order
export const createOEMOrder = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-orders`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all OEM Orders
export const getOEMOrders = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_BASE_URL}/oem-orders${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get OEM Order by ID
export const getOEMOrderById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-orders/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Validate Inventory
export const validateInventory = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-orders/${id}/validate-inventory`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Reserve Materials
export const reserveMaterials = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-orders/${id}/reserve-materials`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update OEM Order Status
export const updateOEMOrderStatus = async (id, status) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/oem-orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get OEM Order Summary
export const getOEMOrderSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-orders/summary/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


// Get Workflow Status
export const getOEMWorkflowStatus = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-orders/${id}/workflow-status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Complete OEM Workflow
export const completeOEMWorkflow = async (id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-orders/${id}/complete-workflow`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Trigger Auto Workflows
export const triggerAutoWorkflows = async (id, workflow) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-orders/${id}/trigger-workflow`, { workflow });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
