import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/bulk-order-invoices`;

export const bulkOrderInvoiceApi = {
  // Generate invoice from bulk order
  generateInvoiceFromBulkOrder: (orderId) => axios.post(`${API_URL}/${orderId}/generate-invoice`),

  // Get invoice for order
  getInvoiceForOrder: (orderId) => axios.get(`${API_URL}/${orderId}/invoice`),

  // Update invoice status
  updateInvoiceStatus: (invoiceId, status) => axios.patch(`${API_URL}/invoice/${invoiceId}/status`, { status }),

  // Get all invoices for client
  getClientInvoices: (clientId) => axios.get(`${API_URL}/client/${clientId}/invoices`)
};
