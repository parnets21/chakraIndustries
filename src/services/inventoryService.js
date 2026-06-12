import apiService from './apiService';

class InventoryService {
  // Get list of warehouses
  async getWarehouses() {
    try {
      const response = await apiService.get('/inventory/warehouses');
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get items for a specific warehouse
  async getWarehouseItems(warehouseId, params = {}) {
    try {
      const response = await apiService.get(`/inventory/warehouse/${warehouseId}/items`, params);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // Get inventory list
  async getInventory(params = {}) {
    try {
      console.log('Calling /api/dealer/products endpoint');
      const response = await apiService.get('/products', params);
      console.log('Products API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async getPincodeStock(params = {}) {
    try {
      const response = await apiService.get('/inventory/pincode', params);
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
