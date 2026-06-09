import apiService from './apiService';

class InventoryService {
  // Get inventory list
  async getInventory(params = {}) {
    try {
      const response = await apiService.get('/inventory', params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get product inventory
  async getProductInventory(productId) {
    try {
      const response = await apiService.get(`/inventory/product/${productId}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Check product availability
  async checkAvailability(productId, quantity) {
    try {
      const response = await apiService.post('/inventory/check', { 
        productId, 
        quantity 
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default new InventoryService();
