import axiosInstance from './axiosConfig';

const API_BASE_URL = '/api/docket-tracking';

// Enhanced mock data for comprehensive ERP-level testing
const mockDockets = [
  {
    id: '1',
    docketId: 'DKT-2026-00001',
    mrId: 'MR-2026-004',
    returnRequestId: 'RR-2026-004',
    awbLrNumber: 'AWB-889977',
    courierPartner: 'VRL Logistics',
    vehicleNumber: 'KA01AB1234',
    driverName: 'Ramesh Kumar',
    driverMobile: '9876543210',
    pickupLocation: 'Main Warehouse, Bangalore',
    deliveryLocation: 'Amit Traders, Chennai',
    pickupDate: '2024-05-13',
    dispatchDate: '2024-05-13',
    lastScanLocation: 'Bangalore Hub',
    lastScanTime: '2024-05-13T14:30:00Z',
    estimatedDelivery: '2024-05-15',
    actualDeliveryDate: null,
    transitDays: 2,
    shipmentWeight: 25.5,
    packagesCount: 3,
    transportCost: 1200.00,
    shipmentType: 'Standard',
    priority: 'Medium',
    transportStatus: 'in_transit',
    podStatus: 'pending',
    damageStatus: 'none',
    delayReason: '',
    remarks: 'Material dispatched from our warehouse.',
    trackingHistory: [
      {
        status: 'pickup_pending',
        location: 'Main Warehouse',
        timestamp: '2024-05-13T09:00:00Z',
        remarks: 'Docket created'
      },
      {
        status: 'picked_up',
        location: 'Main Warehouse',
        timestamp: '2024-05-13T10:30:00Z',
        remarks: 'Picked up by driver'
      },
      {
        status: 'in_transit',
        location: 'Bangalore Hub',
        timestamp: '2024-05-13T14:30:00Z',
        remarks: 'In transit to Chennai'
      }
    ],
    materialDetails: {
      description: 'Electronic Components',
      quantity: 5,
      weight: 25.5,
      value: 15000,
      unit: 'Pieces',
      invoiceNumber: 'INV-7624764',
      returnAmount: 15000
    },
    contactDetails: {
      supplierName: 'Amit Traders',
      supplierContact: '9876543210',
      transporterContact: '9876543211',
      driverContact: '9876543210'
    },
    attachments: [],
    podDetails: {
      receivedBy: '',
      receivedDate: null,
      receivedTime: '',
      signature: '',
      podImage: '',
      verificationStatus: 'pending'
    },
    slaDetails: {
      expectedSLA: 48,
      actualSLA: null,
      slaBreached: false
    },
    integrationRefs: {
      warehouseId: 'WH001',
      vendorId: 'VEN001',
      customerId: null,
      dispatchId: 'DISP001',
      qcId: null
    },
    isActive: true,
    createdBy: 'admin',
    createdAt: '2024-05-13T09:00:00Z',
    updatedAt: '2024-05-13T14:30:00Z'
  },
  {
    id: '2',
    docketId: 'DKT-2026-00002',
    mrId: 'MR-2026-003',
    returnRequestId: 'RR-2026-003',
    awbLrNumber: 'AWB-889978',
    courierPartner: 'Delhivery',
    vehicleNumber: 'KA02BC5678',
    driverName: 'Suresh Patil',
    driverMobile: '9876543211',
    pickupLocation: 'Secondary Warehouse, Mumbai',
    deliveryLocation: 'Shree Steel Pvt Ltd, Pune',
    pickupDate: '2024-05-12',
    dispatchDate: '2024-05-12',
    lastScanLocation: 'Pune Hub',
    lastScanTime: '2024-05-14T16:00:00Z',
    estimatedDelivery: '2024-05-14',
    actualDeliveryDate: '2024-05-14T17:30:00Z',
    transitDays: 2,
    shipmentWeight: 45.2,
    packagesCount: 5,
    transportCost: 800.00,
    shipmentType: 'Express',
    priority: 'High',
    transportStatus: 'delivered',
    podStatus: 'uploaded',
    damageStatus: 'none',
    delayReason: '',
    remarks: 'Successfully delivered',
    trackingHistory: [
      {
        status: 'pickup_pending',
        location: 'Secondary Warehouse',
        timestamp: '2024-05-12T08:00:00Z',
        remarks: 'Docket created'
      },
      {
        status: 'picked_up',
        location: 'Secondary Warehouse',
        timestamp: '2024-05-12T09:30:00Z',
        remarks: 'Picked up by driver'
      },
      {
        status: 'in_transit',
        location: 'Mumbai Hub',
        timestamp: '2024-05-12T12:00:00Z',
        remarks: 'Departed from Mumbai'
      },
      {
        status: 'reached_hub',
        location: 'Pune Hub',
        timestamp: '2024-05-14T10:00:00Z',
        remarks: 'Reached destination hub'
      },
      {
        status: 'out_for_delivery',
        location: 'Pune Hub',
        timestamp: '2024-05-14T14:00:00Z',
        remarks: 'Out for delivery'
      },
      {
        status: 'delivered',
        location: 'Shree Steel Pvt Ltd',
        timestamp: '2024-05-14T17:30:00Z',
        remarks: 'Delivered successfully'
      }
    ],
    materialDetails: {
      description: 'Steel Components',
      quantity: 10,
      weight: 45.2,
      value: 25000,
      unit: 'Pieces',
      invoiceNumber: 'INV-7624765',
      returnAmount: 25000
    },
    contactDetails: {
      supplierName: 'Shree Steel Pvt Ltd',
      supplierContact: '9876543212',
      transporterContact: '9876543213',
      driverContact: '9876543211'
    },
    attachments: [
      {
        fileName: 'POD_AWB889978.pdf',
        fileType: 'pdf',
        fileUrl: '/uploads/pod/POD_AWB889978.pdf',
        uploadedAt: '2024-05-14T18:00:00Z',
        uploadedBy: 'driver',
        category: 'POD'
      }
    ],
    podDetails: {
      receivedBy: 'Rajesh Kumar',
      receivedDate: '2024-05-14',
      receivedTime: '17:30',
      signature: 'signature_base64_string',
      podImage: 'pod_image_base64_string',
      verificationStatus: 'verified'
    },
    slaDetails: {
      expectedSLA: 48,
      actualSLA: 44,
      slaBreached: false
    },
    integrationRefs: {
      warehouseId: 'WH002',
      vendorId: 'VEN002',
      customerId: null,
      dispatchId: 'DISP002',
      qcId: 'QC002'
    },
    isActive: true,
    createdBy: 'admin',
    createdAt: '2024-05-12T08:00:00Z',
    updatedAt: '2024-05-14T18:00:00Z'
  },
  {
    id: '3',
    docketId: 'DKT-2026-00003',
    mrId: 'MR-2026-002',
    returnRequestId: 'RR-2026-002',
    awbLrNumber: 'AWB-889979',
    courierPartner: 'Blue Dart',
    vehicleNumber: 'KA05CD9876',
    driverName: 'Mahesh Singh',
    driverMobile: '9876543212',
    pickupLocation: 'Main Warehouse, Delhi',
    deliveryLocation: 'Global Metals, Gurgaon',
    pickupDate: '2024-05-10',
    dispatchDate: '2024-05-10',
    lastScanLocation: 'Gurgaon Hub',
    lastScanTime: '2024-05-12T11:00:00Z',
    estimatedDelivery: '2024-05-12',
    actualDeliveryDate: '2024-05-12T15:45:00Z',
    transitDays: 2,
    shipmentWeight: 32.8,
    packagesCount: 4,
    transportCost: 1500.00,
    shipmentType: 'Overnight',
    priority: 'Critical',
    transportStatus: 'delivered',
    podStatus: 'verified',
    damageStatus: 'none',
    delayReason: '',
    remarks: 'Successfully delivered',
    trackingHistory: [
      {
        status: 'pickup_pending',
        location: 'Main Warehouse',
        timestamp: '2024-05-10T07:00:00Z',
        remarks: 'Docket created'
      },
      {
        status: 'picked_up',
        location: 'Main Warehouse',
        timestamp: '2024-05-10T08:30:00Z',
        remarks: 'Picked up by driver'
      },
      {
        status: 'in_transit',
        location: 'Delhi Hub',
        timestamp: '2024-05-10T11:00:00Z',
        remarks: 'Departed from Delhi'
      },
      {
        status: 'reached_hub',
        location: 'Gurgaon Hub',
        timestamp: '2024-05-12T09:00:00Z',
        remarks: 'Reached destination hub'
      },
      {
        status: 'out_for_delivery',
        location: 'Gurgaon Hub',
        timestamp: '2024-05-12T11:00:00Z',
        remarks: 'Out for delivery'
      },
      {
        status: 'delivered',
        location: 'Global Metals',
        timestamp: '2024-05-12T15:45:00Z',
        remarks: 'Delivered successfully'
      }
    ],
    materialDetails: {
      description: 'Metal Sheets',
      quantity: 8,
      weight: 32.8,
      value: 40000,
      unit: 'Sheets',
      invoiceNumber: 'INV-7624766',
      returnAmount: 40000
    },
    contactDetails: {
      supplierName: 'Global Metals',
      supplierContact: '9876543213',
      transporterContact: '9876543214',
      driverContact: '9876543212'
    },
    attachments: [
      {
        fileName: 'POD_AWB889979.pdf',
        fileType: 'pdf',
        fileUrl: '/uploads/pod/POD_AWB889979.pdf',
        uploadedAt: '2024-05-12T16:00:00Z',
        uploadedBy: 'driver',
        category: 'POD'
      },
      {
        fileName: 'LR_AWB889979.pdf',
        fileType: 'pdf',
        fileUrl: '/uploads/lr/LR_AWB889979.pdf',
        uploadedAt: '2024-05-10T08:30:00Z',
        uploadedBy: 'admin',
        category: 'LR_Copy'
      }
    ],
    podDetails: {
      receivedBy: 'Amit Sharma',
      receivedDate: '2024-05-12',
      receivedTime: '15:45',
      signature: 'signature_base64_string',
      podImage: 'pod_image_base64_string',
      verificationStatus: 'verified'
    },
    slaDetails: {
      expectedSLA: 48,
      actualSLA: 56,
      slaBreached: true
    },
    integrationRefs: {
      warehouseId: 'WH001',
      vendorId: 'VEN003',
      customerId: null,
      dispatchId: 'DISP003',
      qcId: 'QC003'
    },
    isActive: true,
    createdBy: 'admin',
    createdAt: '2024-05-10T07:00:00Z',
    updatedAt: '2024-05-12T16:00:00Z'
  },
  {
    id: '4',
    docketId: 'DKT-2026-00004',
    mrId: 'MR-2026-001',
    returnRequestId: 'RR-2026-001',
    awbLrNumber: 'AWB-889980',
    courierPartner: 'DTDC',
    vehicleNumber: 'KA03EF1122',
    driverName: 'Rajesh Kumar',
    driverMobile: '9876543213',
    pickupLocation: 'Regional Hub, Hyderabad',
    deliveryLocation: 'ABC Industries, Vijayawada',
    pickupDate: '2024-05-08',
    dispatchDate: '2024-05-08',
    lastScanLocation: 'Vijayawada Hub',
    lastScanTime: '2024-05-10T09:00:00Z',
    estimatedDelivery: '2024-05-10',
    actualDeliveryDate: null,
    transitDays: 7,
    shipmentWeight: 18.3,
    packagesCount: 2,
    transportCost: 600.00,
    shipmentType: 'Economy',
    priority: 'Low',
    transportStatus: 'delayed',
    podStatus: 'pending',
    damageStatus: 'none',
    delayReason: 'Vehicle breakdown on route',
    remarks: 'Delayed due to technical issues',
    trackingHistory: [
      {
        status: 'pickup_pending',
        location: 'Regional Hub',
        timestamp: '2024-05-08T06:00:00Z',
        remarks: 'Docket created'
      },
      {
        status: 'picked_up',
        location: 'Regional Hub',
        timestamp: '2024-05-08T07:30:00Z',
        remarks: 'Picked up by driver'
      },
      {
        status: 'in_transit',
        location: 'Hyderabad Hub',
        timestamp: '2024-05-08T10:00:00Z',
        remarks: 'Departed from Hyderabad'
      },
      {
        status: 'delayed',
        location: 'Highway Toll Plaza',
        timestamp: '2024-05-09T14:00:00Z',
        remarks: 'Vehicle breakdown - repair in progress'
      },
      {
        status: 'in_transit',
        location: 'Vijayawada Hub',
        timestamp: '2024-05-10T09:00:00Z',
        remarks: 'Resumed journey after repair'
      }
    ],
    materialDetails: {
      description: 'Industrial Parts',
      quantity: 3,
      weight: 18.3,
      value: 12000,
      unit: 'Pieces',
      invoiceNumber: 'INV-7624767',
      returnAmount: 12000
    },
    contactDetails: {
      supplierName: 'ABC Industries',
      supplierContact: '9876543214',
      transporterContact: '9876543215',
      driverContact: '9876543213'
    },
    attachments: [
      {
        fileName: 'LR_AWB889980.pdf',
        fileType: 'pdf',
        fileUrl: '/uploads/lr/LR_AWB889980.pdf',
        uploadedAt: '2024-05-08T07:30:00Z',
        uploadedBy: 'admin',
        category: 'LR_Copy'
      }
    ],
    podDetails: {
      receivedBy: '',
      receivedDate: null,
      receivedTime: '',
      signature: '',
      podImage: '',
      verificationStatus: 'pending'
    },
    slaDetails: {
      expectedSLA: 48,
      actualSLA: null,
      slaBreached: true
    },
    integrationRefs: {
      warehouseId: 'WH003',
      vendorId: 'VEN004',
      customerId: null,
      dispatchId: 'DISP004',
      qcId: null
    },
    isActive: true,
    createdBy: 'admin',
    createdAt: '2024-05-08T06:00:00Z',
    updatedAt: '2024-05-10T09:00:00Z'
  }
];
export const docketTrackingApi = {
  // Get all dockets with enhanced filtering
  getAllDockets: async (params = {}) => {
    try {
      // For now, return mock data. Replace with actual API call when backend is ready
      // const response = await axiosInstance.get(API_BASE_URL, { params });
      
      let filteredData = [...mockDockets];
      
      // Apply search filter
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredData = filteredData.filter(docket => 
          docket.docketId.toLowerCase().includes(searchTerm) ||
          docket.mrId.toLowerCase().includes(searchTerm) ||
          docket.contactDetails.supplierName.toLowerCase().includes(searchTerm) ||
          docket.awbLrNumber.toLowerCase().includes(searchTerm) ||
          docket.courierPartner.toLowerCase().includes(searchTerm) ||
          docket.vehicleNumber.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply status filter
      if (params.status && params.status !== 'all') {
        filteredData = filteredData.filter(docket => docket.transportStatus === params.status);
      }
      
      // Apply courier filter
      if (params.courier && params.courier !== 'all') {
        filteredData = filteredData.filter(docket => docket.courierPartner === params.courier);
      }
      
      // Apply priority filter
      if (params.priority && params.priority !== 'all') {
        filteredData = filteredData.filter(docket => docket.priority === params.priority);
      }
      
      // Apply date range filter
      if (params.dateFrom) {
        filteredData = filteredData.filter(docket => 
          new Date(docket.pickupDate) >= new Date(params.dateFrom)
        );
      }
      
      if (params.dateTo) {
        filteredData = filteredData.filter(docket => 
          new Date(docket.pickupDate) <= new Date(params.dateTo)
        );
      }
      
      // Apply delayed filter
      if (params.delayed === 'true') {
        const now = new Date();
        filteredData = filteredData.filter(docket => 
          docket.transportStatus !== 'delivered' && 
          docket.transportStatus !== 'closed' &&
          new Date(docket.estimatedDelivery) < now
        );
      }
      
      // Add computed fields
      const enhancedData = filteredData.map(docket => ({
        ...docket,
        isDelayed: docket.transportStatus !== 'delivered' && 
                  docket.transportStatus !== 'closed' && 
                  new Date() > new Date(docket.estimatedDelivery),
        actualTransitDays: docket.actualDeliveryDate ? 
          Math.ceil((new Date(docket.actualDeliveryDate) - new Date(docket.pickupDate)) / (1000 * 60 * 60 * 24)) :
          Math.ceil((new Date() - new Date(docket.pickupDate)) / (1000 * 60 * 60 * 24))
      }));
      
      // Apply sorting
      if (params.sortBy) {
        enhancedData.sort((a, b) => {
          const aVal = a[params.sortBy];
          const bVal = b[params.sortBy];
          const order = params.sortOrder === 'desc' ? -1 : 1;
          
          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
          return 0;
        });
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = enhancedData.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: enhancedData.length,
          pages: Math.ceil(enhancedData.length / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching dockets:', error);
      throw error;
    }
  },

  // Get docket by ID with full details
  getDocketById: async (docketId) => {
    try {
      // For now, return mock data. Replace with actual API call when backend is ready
      // const response = await axiosInstance.get(`${API_BASE_URL}/${docketId}`);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      // Add computed fields
      const enhancedDocket = {
        ...docket,
        isDelayed: docket.transportStatus !== 'delivered' && 
                  docket.transportStatus !== 'closed' && 
                  new Date() > new Date(docket.estimatedDelivery),
        actualTransitDays: docket.actualDeliveryDate ? 
          Math.ceil((new Date(docket.actualDeliveryDate) - new Date(docket.pickupDate)) / (1000 * 60 * 60 * 24)) :
          Math.ceil((new Date() - new Date(docket.pickupDate)) / (1000 * 60 * 60 * 24))
      };
      
      return {
        success: true,
        data: enhancedDocket
      };
    } catch (error) {
      console.error('Error fetching docket:', error);
      throw error;
    }
  },

  // Create new docket with auto-generation
  createDocket: async (docketData) => {
    try {
      // For now, simulate creating a docket. Replace with actual API call when backend is ready
      // const response = await axiosInstance.post(API_BASE_URL, docketData);
      
      // Auto-generate docket ID
      const year = new Date().getFullYear();
      const sequence = String(mockDockets.length + 1).padStart(5, '0');
      const docketId = `DKT-${year}-${sequence}`;
      
      // Auto-calculate estimated delivery (pickup date + 2 days default)
      const pickupDate = new Date(docketData.pickupDate || new Date());
      const estimatedDelivery = new Date(pickupDate);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
      
      const newDocket = {
        ...docketData,
        id: String(mockDockets.length + 1),
        docketId,
        pickupDate: pickupDate.toISOString(),
        estimatedDelivery: docketData.estimatedDelivery || estimatedDelivery.toISOString(),
        transportStatus: docketData.transportStatus || 'pickup_pending',
        podStatus: 'pending',
        damageStatus: 'none',
        transitDays: 0,
        trackingHistory: [{
          status: docketData.transportStatus || 'pickup_pending',
          location: docketData.pickupLocation,
          timestamp: new Date().toISOString(),
          remarks: 'Docket created'
        }],
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockDockets.push(newDocket);
      
      return {
        success: true,
        data: newDocket,
        message: 'Docket created successfully'
      };
    } catch (error) {
      console.error('Error creating docket:', error);
      throw error;
    }
  },

  // Update docket
  updateDocket: async (docketId, docketData) => {
    try {
      // For now, simulate updating a docket. Replace with actual API call when backend is ready
      // const response = await axiosInstance.put(`${API_BASE_URL}/${docketId}`, docketData);
      
      const index = mockDockets.findIndex(d => d.id === docketId);
      if (index === -1) {
        throw new Error('Docket not found');
      }
      
      mockDockets[index] = { 
        ...mockDockets[index], 
        ...docketData,
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: mockDockets[index],
        message: 'Docket updated successfully'
      };
    } catch (error) {
      console.error('Error updating docket:', error);
      throw error;
    }
  },

  // Update docket status with tracking history
  updateDocketStatus: async (docketId, statusData) => {
    try {
      // For now, simulate updating status. Replace with actual API call when backend is ready
      // const response = await axiosInstance.patch(`${API_BASE_URL}/${docketId}/status`, statusData);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      // Update status
      docket.transportStatus = statusData.status;
      docket.lastScanLocation = statusData.location || docket.lastScanLocation;
      docket.lastScanTime = new Date().toISOString();
      
      // Add to tracking history
      docket.trackingHistory.push({
        status: statusData.status,
        location: statusData.location || docket.lastScanLocation,
        timestamp: new Date().toISOString(),
        remarks: statusData.remarks || `Status updated to ${statusData.status}`,
        updatedBy: statusData.updatedBy || 'system'
      });
      
      // Set actual delivery date if delivered
      if (statusData.status === 'delivered' && !docket.actualDeliveryDate) {
        docket.actualDeliveryDate = new Date().toISOString();
        docket.podStatus = 'pending';
      }
      
      docket.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        data: docket,
        message: 'Status updated successfully'
      };
    } catch (error) {
      console.error('Error updating docket status:', error);
      throw error;
    }
  },

  // Delete docket (soft delete)
  deleteDocket: async (docketId) => {
    try {
      // For now, simulate deleting a docket. Replace with actual API call when backend is ready
      // const response = await axiosInstance.delete(`${API_BASE_URL}/${docketId}`);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      docket.isActive = false;
      docket.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        message: 'Docket deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting docket:', error);
      throw error;
    }
  },

  // Track docket by AWB/LR number
  trackByLRNumber: async (lrNumber) => {
    try {
      // For now, return mock data. Replace with actual API call when backend is ready
      // const response = await axiosInstance.get(`${API_BASE_URL}/track/${lrNumber}`);
      
      const docket = mockDockets.find(d => d.awbLrNumber === lrNumber);
      if (!docket) {
        throw new Error('No docket found with this AWB/LR number');
      }
      
      return {
        success: true,
        data: docket
      };
    } catch (error) {
      console.error('Error tracking docket:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      // For now, calculate from mock data. Replace with actual API call when backend is ready
      // const response = await axiosInstance.get(`${API_BASE_URL}/stats`);
      
      const activeDockets = mockDockets.filter(d => d.isActive);
      const now = new Date();
      
      const stats = {
        total: activeDockets.length,
        inTransit: activeDockets.filter(d => d.transportStatus === 'in_transit').length,
        pendingQC: activeDockets.filter(d => d.podStatus === 'pending' && d.transportStatus === 'delivered').length,
        closed: activeDockets.filter(d => d.transportStatus === 'closed').length,
        delayed: activeDockets.filter(d => 
          d.transportStatus !== 'delivered' && 
          d.transportStatus !== 'closed' &&
          new Date(d.estimatedDelivery) < now
        ).length,
        byStatus: activeDockets.reduce((acc, docket) => {
          acc[docket.transportStatus] = (acc[docket.transportStatus] || 0) + 1;
          return acc;
        }, {}),
        byCourier: activeDockets.reduce((acc, docket) => {
          acc[docket.courierPartner] = (acc[docket.courierPartner] || 0) + 1;
          return acc;
        }, {}),
        byPriority: activeDockets.reduce((acc, docket) => {
          acc[docket.priority] = (acc[docket.priority] || 0) + 1;
          return acc;
        }, {})
      };
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get delayed dockets
  getDelayedDockets: async () => {
    try {
      // For now, filter from mock data. Replace with actual API call when backend is ready
      // const response = await axiosInstance.get(`${API_BASE_URL}/delayed`);
      
      const now = new Date();
      const delayedDockets = mockDockets.filter(d => 
        d.isActive &&
        d.transportStatus !== 'delivered' && 
        d.transportStatus !== 'closed' &&
        new Date(d.estimatedDelivery) < now
      );
      
      return {
        success: true,
        data: delayedDockets
      };
    } catch (error) {
      console.error('Error fetching delayed dockets:', error);
      throw error;
    }
  },

  // Upload POD
  uploadPOD: async (docketId, podData) => {
    try {
      // For now, simulate POD upload. Replace with actual API call when backend is ready
      // const response = await axiosInstance.post(`${API_BASE_URL}/${docketId}/pod`, podData);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      // Update POD details
      docket.podDetails = {
        ...docket.podDetails,
        ...podData,
        verificationStatus: 'pending'
      };
      
      docket.podStatus = 'uploaded';
      docket.updatedAt = new Date().toISOString();
      
      // Add to attachments if file is provided
      if (podData.podFile) {
        docket.attachments.push({
          fileName: podData.podFile.name,
          fileType: podData.podFile.type,
          fileUrl: `/uploads/pod/${podData.podFile.name}`,
          uploadedAt: new Date().toISOString(),
          uploadedBy: podData.uploadedBy || 'driver',
          category: 'POD'
        });
      }
      
      return {
        success: true,
        data: docket,
        message: 'POD uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading POD:', error);
      throw error;
    }
  },

  // Upload attachment
  uploadAttachment: async (docketId, attachmentData) => {
    try {
      // For now, simulate attachment upload. Replace with actual API call when backend is ready
      // const response = await axiosInstance.post(`${API_BASE_URL}/${docketId}/attachment`, attachmentData);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      // Add to attachments
      docket.attachments.push({
        fileName: attachmentData.file.name,
        fileType: attachmentData.file.type,
        fileUrl: `/uploads/${attachmentData.category.toLowerCase()}/${attachmentData.file.name}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: attachmentData.uploadedBy || 'admin',
        category: attachmentData.category || 'Other'
      });
      
      docket.updatedAt = new Date().toISOString();
      
      return {
        success: true,
        data: docket,
        message: 'Attachment uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  },

  // Get tracking timeline
  getTrackingTimeline: async (docketId) => {
    try {
      // For now, return from mock data. Replace with actual API call when backend is ready
      // const response = await axiosInstance.get(`${API_BASE_URL}/${docketId}/timeline`);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      return {
        success: true,
        data: docket.trackingHistory
      };
    } catch (error) {
      console.error('Error fetching tracking timeline:', error);
      throw error;
    }
  },

  // Close docket
  closeDocket: async (docketId, closeData) => {
    try {
      // For now, simulate closing docket. Replace with actual API call when backend is ready
      // const response = await axiosInstance.patch(`${API_BASE_URL}/${docketId}/close`, closeData);
      
      const docket = mockDockets.find(d => d.id === docketId);
      if (!docket) {
        throw new Error('Docket not found');
      }
      
      docket.transportStatus = 'closed';
      docket.podStatus = 'verified';
      docket.updatedAt = new Date().toISOString();
      
      // Add to tracking history
      docket.trackingHistory.push({
        status: 'closed',
        location: docket.deliveryLocation,
        timestamp: new Date().toISOString(),
        remarks: closeData.remarks || 'Docket closed successfully',
        updatedBy: closeData.closedBy || 'admin'
      });
      
      return {
        success: true,
        data: docket,
        message: 'Docket closed successfully'
      };
    } catch (error) {
      console.error('Error closing docket:', error);
      throw error;
    }
  },

  // Bulk update status
  bulkUpdateStatus: async (docketIds, statusData) => {
    try {
      // For now, simulate bulk update. Replace with actual API call when backend is ready
      // const response = await axiosInstance.patch(`${API_BASE_URL}/bulk/status`, { docketIds, ...statusData });
      
      const updatedDockets = [];
      
      docketIds.forEach(docketId => {
        const docket = mockDockets.find(d => d.id === docketId);
        if (docket) {
          docket.transportStatus = statusData.status;
          docket.lastScanLocation = statusData.location || docket.lastScanLocation;
          docket.lastScanTime = new Date().toISOString();
          docket.updatedAt = new Date().toISOString();
          
          // Add to tracking history
          docket.trackingHistory.push({
            status: statusData.status,
            location: statusData.location || docket.lastScanLocation,
            timestamp: new Date().toISOString(),
            remarks: statusData.remarks || `Bulk status update to ${statusData.status}`,
            updatedBy: statusData.updatedBy || 'admin'
          });
          
          updatedDockets.push(docket);
        }
      });
      
      return {
        success: true,
        data: updatedDockets,
        message: `${updatedDockets.length} dockets updated successfully`
      };
    } catch (error) {
      console.error('Error bulk updating dockets:', error);
      throw error;
    }
  }
};

export default docketTrackingApi;