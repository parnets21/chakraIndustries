import axiosInstance from './axiosConfig';

const inventoryApi = {
  // ============ STOCK MANAGEMENT ============
  
  // Get all stock with filters
  getAllStock: (filters = {}) =>
    axiosInstance.get(`/inventory/stock`, { params: filters }),

  // Get stock by warehouse
  getStockByWarehouse: (warehouseId) =>
    axiosInstance.get(`/inventory/stock/warehouse/${warehouseId}`),

  // Get stock by location
  getStockByLocation: (locationId) =>
    axiosInstance.get(`/inventory/stock/location/${locationId}`),

  // Get stock by SKU
  getStockBySKU: (sku) =>
    axiosInstance.get(`/inventory/stock/sku/${sku}`),

  // Get stock by warehouse and SKU
  getStockByWarehouseAndSKU: (warehouseId, sku) =>
    axiosInstance.get(`/inventory/stock/warehouse/${warehouseId}/sku/${sku}`),

  // Get stock by location and SKU
  getStockByLocationAndSKU: (locationId, sku) =>
    axiosInstance.get(`/inventory/stock/location/${locationId}/sku/${sku}`),

  // Get stock type breakdown for SKU
  getStockTypeBreakdown: (sku) =>
    axiosInstance.get(`/inventory/stock/${sku}/breakdown`),

  // Update stock quantity
  updateStock: (data) =>
    axiosInstance.post(`/inventory/stock/update`, data),

  // Transfer stock between locations
  transferStock: (data) =>
    axiosInstance.post(`/inventory/stock/transfer`, data),

  // Adjust stock (damage, loss, etc.)
  adjustStock: (data) =>
    axiosInstance.post(`/inventory/stock/adjust`, data),

  // ============ WAREHOUSE MANAGEMENT ============
  
  // Get all warehouses
  getWarehouses: () =>
    axiosInstance.get(`/warehouses`),

  // Get all warehouses with automatic data
  getWarehousesWithData: () =>
    axiosInstance.get(`/warehouses/data/all`),

  // Get warehouse details
  getWarehouseDetails: (warehouseId) =>
    axiosInstance.get(`/warehouses/${warehouseId}`),

  // Get warehouse capacity
  getWarehouseCapacity: (warehouseId) =>
    axiosInstance.get(`/warehouses/${warehouseId}/capacity`),

  // Get warehouse zones
  getWarehouseZones: (warehouseId) =>
    axiosInstance.get(`/warehouses/${warehouseId}/zones`),

  // Get warehouse summary
  getWarehouseSummary: (warehouseId) =>
    axiosInstance.get(`/warehouses/${warehouseId}/summary`),

  // Sync warehouse capacity from inventory
  syncWarehouseCapacity: (warehouseId) =>
    axiosInstance.get(`/warehouses/${warehouseId}/sync`),

  // Create warehouse
  createWarehouse: (data) =>
    axiosInstance.post(`/warehouses`, data),

  // Update warehouse
  updateWarehouse: (warehouseId, data) =>
    axiosInstance.put(`/warehouses/${warehouseId}`, data),

  // Delete warehouse
  deleteWarehouse: (warehouseId) =>
    axiosInstance.delete(`/warehouses/${warehouseId}`),

  // Add zone to warehouse
  addZone: (warehouseId, data) =>
    axiosInstance.post(`/warehouses/${warehouseId}/zones`, data),

  // Update zone in warehouse
  updateZone: (warehouseId, zoneId, data) =>
    axiosInstance.put(`/warehouses/${warehouseId}/zones/${zoneId}`, data),

  // ============ LOCATION MANAGEMENT ============
  
  // Get all locations
  getLocations: (filters = {}) =>
    axiosInstance.get(`/locations`, { params: filters }),

  // Get locations by warehouse
  getLocationsByWarehouse: (warehouseId) =>
    axiosInstance.get(`/locations`, { params: { warehouse: warehouseId } }),

  // Get location details
  getLocationDetails: (locationId) =>
    axiosInstance.get(`/locations/${locationId}`),

  // Get location capacity
  getLocationCapacity: (locationId) =>
    axiosInstance.get(`/locations/${locationId}/capacity`),

  // Update location capacity
  updateLocationCapacity: (locationId, capacity) =>
    axiosInstance.put(`/locations/${locationId}/capacity`, { capacity }),

  // Create location
  createLocation: (data) =>
    axiosInstance.post(`/locations`, data),

  // Add bin to location
  addBin: (locationId, data) =>
    axiosInstance.post(`/locations/${locationId}/bins`, data),

  // Update bin quantity
  updateBinQuantity: (locationId, data) =>
    axiosInstance.put(`/locations/${locationId}/bins`, data),

  // ============ BATCH MANAGEMENT ============
  
  // Get all batches
  getAllBatches: (filters = {}) =>
    axiosInstance.get(`/batches`, { params: filters }),

  // Get batches by SKU
  getBatchesBySKU: (sku) =>
    axiosInstance.get(`/batches/sku/${sku}`),

  // Get batch details
  getBatchDetails: (batchId) =>
    axiosInstance.get(`/batches/${batchId}`),

  // Create batch
  createBatch: (data) =>
    axiosInstance.post(`/batches`, data),

  // Update batch
  updateBatch: (batchId, data) =>
    axiosInstance.put(`/batches/${batchId}`, data),

  // Get batch expiry info
  getBatchExpiry: (batchId) =>
    axiosInstance.get(`/batches/${batchId}/expiry`),

  // Update batch expiry
  updateBatchExpiry: (batchId, expiryDate) =>
    axiosInstance.put(`/batches/${batchId}/expiry`, { expiryDate }),

  // Get expiring batches
  getExpiringBatches: (daysThreshold = 30) =>
    axiosInstance.get(`/batches/expiring`, { params: { days: daysThreshold } }),

  // Get ageing report
  getAgeingReport: () =>
    axiosInstance.get(`/batches/ageing-report`),

  // ============ STOCK MOVEMENT TRACKING ============
  
  // Get movement history
  getMovementHistory: (filters = {}) =>
    axiosInstance.get(`/stock-movements`, { params: filters }),

  // Get movements by SKU
  getMovementsBySKU: (sku, limit = 100) =>
    axiosInstance.get(`/stock-movements/sku/${sku}`, { params: { limit } }),

  // Get movements by warehouse
  getMovementsByWarehouse: (warehouseId, limit = 100) =>
    axiosInstance.get(`/stock-movements/warehouse/${warehouseId}`, { params: { limit } }),

  // Get movements by location
  getMovementsByLocation: (locationId, limit = 100) =>
    axiosInstance.get(`/stock-movements/location/${locationId}`, { params: { limit } }),

  // Record movement
  recordMovement: (data) =>
    axiosInstance.post(`/stock-movements`, data),

  // Get movement details
  getMovementDetails: (movementId) =>
    axiosInstance.get(`/stock-movements/${movementId}`),

  // Transfer stock between warehouses
  transferStockBetweenWarehouses: (data) =>
    axiosInstance.post(`/stock-movements/transfer`, data),

  // ============ INVENTORY DASHBOARD ============
  
  // Get dashboard stats
  getDashboardStats: () =>
    axiosInstance.get(`/inventory/stats`),

  // Get stock summary
  getStockSummary: () =>
    axiosInstance.get(`/inventory/summary`),

  // ============ BASIC INVENTORY CRUD ============
  
  // Get all inventory items
  getAllInventory: (filters = {}) =>
    axiosInstance.get(`/inventory`, { params: filters }),

  // Get inventory by ID
  getInventoryById: (id) =>
    axiosInstance.get(`/inventory/${id}`),

  // Create inventory item
  createInventory: (data) =>
    axiosInstance.post(`/inventory`, data),

  // Update inventory item
  updateInventory: (id, data) =>
    axiosInstance.put(`/inventory/${id}`, data),

  // Delete inventory item
  deleteInventory: (id) =>
    axiosInstance.delete(`/inventory/${id}`),

  // Adjust inventory stock
  adjustInventoryStock: (id, data) =>
    axiosInstance.patch(`/inventory/${id}/adjust`, data),

  // ============ INVENTORY DATA ENDPOINTS (FOR PAGE DISPLAY) ============
  
  // Get all inventory data for display
  getAllInventoryData: () =>
    axiosInstance.get(`/inventory-data/inventory/all`),

  // Get all warehouses data for display
  getAllWarehousesData: () =>
    axiosInstance.get(`/inventory-data/warehouses/all`),

  // Get all movements data for display
  getAllMovementsData: () =>
    axiosInstance.get(`/inventory-data/movements/all`),

  // Get all batches data for display
  getAllBatchesData: () =>
    axiosInstance.get(`/inventory-data/batches/all`),

  // Get ageing stock data for display
  getAgeingStockData: () =>
    axiosInstance.get(`/inventory-data/ageing/all`),

  // Create inventory item
  createInventoryData: (data) =>
    axiosInstance.post(`/inventory-data/inventory/create`, data),

  // Create warehouse
  createWarehouseData: (data) =>
    axiosInstance.post(`/inventory-data/warehouse/create`, data),

  // Create movement
  createMovementData: (data) =>
    axiosInstance.post(`/inventory-data/movement/create`, data),

  // Create batch
  createBatchData: (data) =>
    axiosInstance.post(`/inventory-data/batch/create`, data),
};

export default inventoryApi;
