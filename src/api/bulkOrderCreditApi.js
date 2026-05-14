import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/bulk-order-credit`;

export const bulkOrderCreditApi = {
  // Check credit limit
  checkCreditLimit: (clientId, orderValue) => axios.post(`${API_URL}/check`, { clientId, orderValue }),

  // Reserve credit
  reserveCredit: (orderId) => axios.post(`${API_URL}/${orderId}/reserve`),

  // Release credit
  releaseCredit: (orderId) => axios.post(`${API_URL}/${orderId}/release`),

  // Get credit summary
  getClientCreditSummary: (clientId) => axios.get(`${API_URL}/${clientId}/summary`)
};
