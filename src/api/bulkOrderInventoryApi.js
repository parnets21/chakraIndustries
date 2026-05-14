import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/bulk-order-inventory`;

export const bulkOrderInventoryApi = {
  // Check inventory for order
  checkInventory: (orderId) => axios.post(`${API_URL}/${orderId}/check`),

  // Reserve inventory
  reserveInventory: (orderId) => axios.post(`${API_URL}/${orderId}/reserve`),

  // Create work order for shortage
  createWorkOrderForShortage: (orderId) => axios.post(`${API_URL}/${orderId}/create-work-order`),

  // Release reserved inventory
  releaseReservedInventory: (orderId) => axios.post(`${API_URL}/${orderId}/release`)
};
