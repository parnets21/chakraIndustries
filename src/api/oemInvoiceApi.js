import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Invoice
export const createInvoice = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-invoices`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get all Invoices
export const getInvoices = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_BASE_URL}/oem-invoices${params ? `?${params}` : ''}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Invoice by ID
export const getInvoiceById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-invoices/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Record Payment
export const recordPayment = async (id, data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-invoices/${id}/payment`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Sync to Tally
export const syncToTally = async (id, tallyDocumentId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/oem-invoices/${id}/sync-tally`, { tallyDocumentId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get Invoice Summary
export const getInvoiceSummary = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/oem-invoices/summary/all`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
