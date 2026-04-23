import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const inventoryApi = {
  // ============ STOCK MANAGEMENT ============
  
  // Get all stock with filters
  getAllStock: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/stock`, { params: filters }),

  // Get stock by warehouse
  getStockByWarehouse: (warehouseId) =>
    axios.get(`${API_BASE}/inventory/stock/warehouse/${warehouseId}`),

  // Get stock by location
  getStockByLocation: (locationId) =>
    axios.get(`${API_BASE}/inventory/stock/location/${locationId}`),

  // Get stock by SKU
  getStockBySKU: (sku) =>
    axios.get(`${API_BASE}/inventory/stock/sku/${sku}`),

  // Get stock by warehouse and SKU
  getStockByWarehouseAndSKU: (warehouseId, sku) =>
    axios.get(`${API_BASE}/inventory/stock/warehouse/${warehouseId}/sku/${sku}`),

  // Get stock by location and SKU
  getStockByLocationAndSKU: (locationId, sku) =>
    axios.get(`${API_BASE}/inventory/stock/location/${locationId}/sku/${sku}`),

  // ============ STOCK TYPES ============
  
  // Get stock by type (available, reserved, damaged, expired, etc.)
  getStockByType: (stockType) =>
    axios.get(`${API_BASE}/inventory/stock/type/${stockType}`),

  // Get stock breakdown by type for SKU
  getStockTypeBreakdown: (sku) =>
    axios.get(`${API_BASE}/inventory/stock/${sku}/breakdown`),

  // Update stock quantity
  updateStock: (data) =>
    axios.post(`${API_BASE}/inventory/stock/update`, data),

  // Transfer stock between locations
  transferStock: (data) =>
    axios.post(`${API_BASE}/inventory/stock/transfer`, data),

  // Adjust stock (damage, loss, etc.)
  adjustStock: (data) =>
    axios.post(`${API_BASE}/inventory/stock/adjust`, data),

  // ============ WAREHOUSE MANAGEMENT ============
  
  // Get all warehouses
  getWarehouses: () =>
    axios.get(`${API_BASE}/inventory/warehouses`),

  // Get warehouse details
  getWarehouseDetails: (warehouseId) =>
    axios.get(`${API_BASE}/inventory/warehouses/${warehouseId}`),

  // Get warehouse capacity
  getWarehouseCapacity: (warehouseId) =>
    axios.get(`${API_BASE}/inventory/warehouses/${warehouseId}/capacity`),

  // Get warehouse zones
  getWarehouseZones: (warehouseId) =>
    axios.get(`${API_BASE}/inventory/warehouses/${warehouseId}/zones`),

  // Get zone capacity
  getZoneCapacity: (zoneId) =>
    axios.get(`${API_BASE}/inventory/zones/${zoneId}/capacity`),

  // ============ LOCATION MANAGEMENT ============
  
  // Get all locations
  getLocations: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/locations`, { params: filters }),

  // Get locations by warehouse
  getLocationsByWarehouse: (warehouseId) =>
    axios.get(`${API_BASE}/inventory/warehouses/${warehouseId}/locations`),

  // Get location details
  getLocationDetails: (locationId) =>
    axios.get(`${API_BASE}/inventory/locations/${locationId}`),

  // Get location capacity
  getLocationCapacity: (locationId) =>
    axios.get(`${API_BASE}/inventory/locations/${locationId}/capacity`),

  // Update location capacity
  updateLocationCapacity: (locationId, capacity) =>
    axios.put(`${API_BASE}/inventory/locations/${locationId}/capacity`, { capacity }),

  // ============ BATCH MANAGEMENT ============
  
  // Get all batches
  getAllBatches: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/batches`, { params: filters }),

  // Get batches by SKU
  getBatchesBySKU: (sku) =>
    axios.get(`${API_BASE}/inventory/batches/sku/${sku}`),

  // Get batch details
  getBatchDetails: (batchId) =>
    axios.get(`${API_BASE}/inventory/batches/${batchId}`),

  // Create batch
  createBatch: (data) =>
    axios.post(`${API_BASE}/inventory/batches`, data),

  // Update batch
  updateBatch: (batchId, data) =>
    axios.put(`${API_BASE}/inventory/batches/${batchId}`, data),

  // Get batch expiry info
  getBatchExpiry: (batchId) =>
    axios.get(`${API_BASE}/inventory/batches/${batchId}/expiry`),

  // Update batch expiry
  updateBatchExpiry: (batchId, expiryDate) =>
    axios.put(`${API_BASE}/inventory/batches/${batchId}/expiry`, { expiryDate }),

  // Get expiring batches
  getExpiringBatches: (daysThreshold = 30) =>
    axios.get(`${API_BASE}/inventory/batches/expiring`, { params: { days: daysThreshold } }),

  // ============ BARCODE MANAGEMENT ============
  
  // Generate barcode
  generateBarcode: (data) =>
    axios.post(`${API_BASE}/inventory/barcode/generate`, data),

  // Generate multiple barcodes
  generateBarcodes: (data) =>
    axios.post(`${API_BASE}/inventory/barcode/generate-batch`, data),

  // Scan barcode
  scanBarcode: (barcodeValue) =>
    axios.post(`${API_BASE}/inventory/barcode/scan`, { barcodeValue }),

  // Validate barcode
  validateBarcode: (barcodeValue) =>
    axios.get(`${API_BASE}/inventory/barcode/validate/${barcodeValue}`),

  // Get barcode history
  getBarcodeHistory: (barcodeId) =>
    axios.get(`${API_BASE}/inventory/barcode/${barcodeId}/history`),

  // Print barcodes
  printBarcodes: (barcodeIds) =>
    axios.post(`${API_BASE}/inventory/barcode/print`, { barcodeIds }),

  // Lookup barcode
  lookupBarcode: (barcodeValue) =>
    axios.get(`${API_BASE}/inventory/barcode/lookup/${barcodeValue}`),

  // ============ STOCK MOVEMENT TRACKING ============
  
  // Get movement history
  getMovementHistory: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/movements`, { params: filters }),

  // Get movements by SKU
  getMovementsBySKU: (sku, limit = 100) =>
    axios.get(`${API_BASE}/inventory/movements/sku/${sku}`, { params: { limit } }),

  // Get movements by warehouse
  getMovementsByWarehouse: (warehouseId, limit = 100) =>
    axios.get(`${API_BASE}/inventory/movements/warehouse/${warehouseId}`, { params: { limit } }),

  // Get movements by location
  getMovementsByLocation: (locationId, limit = 100) =>
    axios.get(`${API_BASE}/inventory/movements/location/${locationId}`, { params: { limit } }),

  // Record movement
  recordMovement: (data) =>
    axios.post(`${API_BASE}/inventory/movements`, data),

  // Get movement details
  getMovementDetails: (movementId) =>
    axios.get(`${API_BASE}/inventory/movements/${movementId}`),

  // ============ REAL-TIME UPDATES ============
  
  // Get real-time stock levels
  getRealTimeStock: (sku) =>
    axios.get(`${API_BASE}/inventory/stock/realtime/${sku}`),

  // Subscribe to stock updates (WebSocket)
  subscribeToStockUpdates: (sku, callback) => {
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/inventory/stock/${sku}`);
    ws.onmessage = (event) => callback(JSON.parse(event.data));
    return ws;
  },

  // ============ ALERTS & AUTOMATION ============
  
  // Get all alerts
  getAlerts: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/alerts`, { params: filters }),

  // Get stock alerts
  getStockAlerts: () =>
    axios.get(`${API_BASE}/inventory/alerts/stock`),

  // Get capacity alerts
  getCapacityAlerts: () =>
    axios.get(`${API_BASE}/inventory/alerts/capacity`),

  // Get expiry alerts
  getExpiryAlerts: () =>
    axios.get(`${API_BASE}/inventory/alerts/expiry`),

  // Create alert
  createAlert: (data) =>
    axios.post(`${API_BASE}/inventory/alerts`, data),

  // Acknowledge alert
  acknowledgeAlert: (alertId) =>
    axios.put(`${API_BASE}/inventory/alerts/${alertId}/acknowledge`),

  // Get reorder points
  getReorderPoints: () =>
    axios.get(`${API_BASE}/inventory/reorder-points`),

  // Set reorder point
  setReorderPoint: (sku, data) =>
    axios.post(`${API_BASE}/inventory/reorder-points/${sku}`, data),

  // Trigger auto-reorder
  triggerAutoReorder: (sku) =>
    axios.post(`${API_BASE}/inventory/auto-reorder/${sku}`),

  // ============ RECONCILIATION & REPORTING ============
  
  // Get reconciliation report
  getReconciliationReport: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/reconciliation`, { params: filters }),

  // Create reconciliation
  createReconciliation: (data) =>
    axios.post(`${API_BASE}/inventory/reconciliation`, data),

  // Get inventory variance
  getInventoryVariance: (filters = {}) =>
    axios.get(`${API_BASE}/inventory/variance`, { params: filters }),

  // Get stock summary
  getStockSummary: () =>
    axios.get(`${API_BASE}/inventory/summary`),

  // Get warehouse summary
  getWarehouseSummary: (warehouseId) =>
    axios.get(`${API_BASE}/inventory/warehouses/${warehouseId}/summary`),

  // Export inventory report
  exportInventoryReport: (format = 'csv') =>
    axios.get(`${API_BASE}/inventory/export`, { params: { format }, responseType: 'blob' }),
};

export default inventoryApi;
