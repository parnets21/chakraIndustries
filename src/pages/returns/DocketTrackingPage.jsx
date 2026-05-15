import React, { useState, useEffect } from 'react';
import { 
  MdSearch, 
  MdAdd, 
  MdVisibility, 
  MdEdit, 
  MdDelete, 
  MdDownload,
  MdFilterList,
  MdRefresh,
  MdLocalShipping,
  MdInventory,
  MdAccessTime,
  MdCheckCircle,
  MdWarning,
  MdExpandMore,
  MdExpandLess,
  MdFileUpload,
  MdTrackChanges,
  MdClose,
  MdLocationOn,
  MdPhone,
  MdPerson,
  MdDirectionsCar,
  MdAttachFile,
  MdVerifiedUser,
  MdError,
  MdSchedule,
  MdTrendingUp,
  MdAssignment
} from 'react-icons/md';
import PageShell from '../../components/common/PageShell';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';
import docketTrackingApi from '../../api/docketTrackingApi';
import CreateDocketModal from './components/CreateDocketModal';
import EditDocketModal from './components/EditDocketModal';
import ViewDocketModal from './components/ViewDocketModal';
import TrackShipmentModal from './components/TrackShipmentModal';

const DocketTrackingPage = () => {
  const [dockets, setDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    courier: 'all',
    priority: 'all',
    dateFrom: '',
    dateTo: '',
    delayed: false
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [dashboardStats, setDashboardStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  // Fetch dockets with enhanced filtering
  const fetchDockets = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      
      const response = await docketTrackingApi.getAllDockets(params);
      setDockets(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      toast('Error fetching dockets', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const response = await docketTrackingApi.getDashboardStats();
      setDashboardStats(response.data || {});
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  useEffect(() => {
    fetchDockets();
  }, [searchTerm, filters, pagination.page]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleDelete = async (docketId) => {
    if (window.confirm('Are you sure you want to delete this docket?')) {
      try {
        await docketTrackingApi.deleteDocket(docketId);
        toast('Docket deleted successfully');
        fetchDockets();
        fetchDashboardStats();
      } catch (error) {
        toast('Error deleting docket', 'error');
      }
    }
  };

  const handleStatusUpdate = async (docketId, statusData) => {
    try {
      await docketTrackingApi.updateDocketStatus(docketId, statusData);
      toast('Status updated successfully');
      fetchDockets();
      fetchDashboardStats();
    } catch (error) {
      toast('Error updating status', 'error');
    }
  };

  const toggleRowExpansion = (docketId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(docketId)) {
      newExpanded.delete(docketId);
    } else {
      newExpanded.add(docketId);
    }
    setExpandedRows(newExpanded);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    toast('Export functionality will be implemented');
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pickup_pending':
        return <MdSchedule className="w-4 h-4" />;
      case 'picked_up':
        return <MdLocalShipping className="w-4 h-4" />;
      case 'in_transit':
        return <MdInventory className="w-4 h-4" />;
      case 'reached_hub':
        return <MdLocationOn className="w-4 h-4" />;
      case 'out_for_delivery':
        return <MdTrendingUp className="w-4 h-4" />;
      case 'delivered':
        return <MdCheckCircle className="w-4 h-4" />;
      case 'delayed':
        return <MdWarning className="w-4 h-4" />;
      case 'damaged':
        return <MdError className="w-4 h-4" />;
      case 'returned':
        return <MdAssignment className="w-4 h-4" />;
      case 'cancelled':
        return <MdClose className="w-4 h-4" />;
      case 'closed':
        return <MdVerifiedUser className="w-4 h-4" />;
      default:
        return <MdAccessTime className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pickup_pending':
        return 'orange';
      case 'picked_up':
        return 'blue';
      case 'in_transit':
        return 'purple';
      case 'reached_hub':
        return 'indigo';
      case 'out_for_delivery':
        return 'cyan';
      case 'delivered':
        return 'green';
      case 'delayed':
        return 'red';
      case 'damaged':
        return 'red';
      case 'returned':
        return 'yellow';
      case 'cancelled':
        return 'gray';
      case 'closed':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const columns = [
    {
      key: 'expand',
      label: '',
      width: '40px',
      render: (_, row) => (
        <button
          onClick={() => toggleRowExpansion(row.id)}
          className="p-1 text-gray-500 hover:text-blue-600"
        >
          {expandedRows.has(row.id) ? 
            <MdExpandLess className="w-4 h-4" /> : 
            <MdExpandMore className="w-4 h-4" />
          }
        </button>
      )
    },
    {
      key: 'docketId',
      label: 'Docket ID',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-blue-600">{value}</span>
          {row.isDelayed && (
            <span className="text-xs text-red-500 font-medium">DELAYED</span>
          )}
        </div>
      )
    },
    {
      key: 'mrId',
      label: 'MR ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-700">{value}</span>
      )
    },
    {
      key: 'awbLrNumber',
      label: 'AWB/LR Number',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
      )
    },
    {
      key: 'courierPartner',
      label: 'Courier',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium">{value}</span>
      )
    },
    {
      key: 'pickupDate',
      label: 'Pickup Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm">{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'lastScanLocation',
      label: 'Last Scan',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{value || 'N/A'}</span>
          {row.lastScanTime && (
            <span className="text-xs text-gray-500">
              {new Date(row.lastScanTime).toLocaleString()}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'estimatedDelivery',
      label: 'Est. Delivery',
      sortable: true,
      render: (value, row) => (
        <div className="flex flex-col">
          <span className={`text-sm ${row.isDelayed ? 'text-red-600 font-medium' : ''}`}>
            {new Date(value).toLocaleDateString()}
          </span>
          {row.actualDeliveryDate && (
            <span className="text-xs text-green-600">
              Delivered: {new Date(row.actualDeliveryDate).toLocaleDateString()}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'transportStatus',
      label: 'Status',
      render: (value, row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge 
            status={value} 
            color={getStatusColor(value)}
            icon={getStatusIcon(value)}
          />
          <StatusBadge 
            status={row.priority} 
            color={getPriorityColor(row.priority)}
            size="sm"
          />
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-1">
          <button
            onClick={() => {
              setSelectedDocket(row);
              setShowViewModal(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <MdVisibility className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDocket(row);
              setShowTrackModal(true);
            }}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title="Track Shipment"
          >
            <MdTrackChanges className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDocket(row);
              setShowEditModal(true);
            }}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Edit"
          >
            <MdEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <MdDelete className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const renderExpandedRow = (row) => (
    <div className="bg-gray-50 p-4 border-t">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver & Vehicle Details */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MdDirectionsCar className="w-4 h-4" />
            Transport Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium">{row.vehicleNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Driver:</span>
              <span className="font-medium">{row.driverName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mobile:</span>
              <span className="font-medium">{row.driverMobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weight:</span>
              <span className="font-medium">{row.shipmentWeight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Packages:</span>
              <span className="font-medium">{row.packagesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="font-medium">₹{row.transportCost}</span>
            </div>
          </div>
        </div>

        {/* Material Details */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MdInventory className="w-4 h-4" />
            Material Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{row.materialDetails?.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">{row.materialDetails?.quantity} {row.materialDetails?.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Value:</span>
              <span className="font-medium">₹{row.materialDetails?.value?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice:</span>
              <span className="font-medium">{row.materialDetails?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Return Amount:</span>
              <span className="font-medium">₹{row.materialDetails?.returnAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* POD & Attachments */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MdAttachFile className="w-4 h-4" />
            POD & Files
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">POD Status:</span>
              <StatusBadge 
                status={row.podStatus} 
                color={row.podStatus === 'verified' ? 'green' : row.podStatus === 'uploaded' ? 'blue' : 'gray'}
                size="sm"
              />
            </div>
            {row.podDetails?.receivedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600">Received By:</span>
                <span className="font-medium">{row.podDetails.receivedBy}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Attachments:</span>
              <span className="font-medium">{row.attachments?.length || 0} files</span>
            </div>
            {row.delayReason && (
              <div className="mt-2 p-2 bg-red-50 rounded">
                <span className="text-red-700 text-xs font-medium">Delay Reason:</span>
                <p className="text-red-600 text-xs mt-1">{row.delayReason}</p>
              </div>
            )}
            {row.remarks && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <span className="text-blue-700 text-xs font-medium">Remarks:</span>
                <p className="text-blue-600 text-xs mt-1">{row.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      {row.trackingHistory && row.trackingHistory.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MdTrackChanges className="w-4 h-4" />
            Tracking Timeline
          </h4>
          <div className="space-y-3">
            {row.trackingHistory.map((event, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  event.status === 'delivered' ? 'bg-green-500' :
                  event.status === 'delayed' ? 'bg-red-500' :
                  event.status === 'in_transit' ? 'bg-blue-500' :
                  'bg-gray-400'
                }`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-sm capitalize">
                        {event.status.replace('_', ' ')}
                      </span>
                      {event.location && (
                        <span className="text-gray-600 text-sm ml-2">
                          at {event.location}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.remarks && (
                    <p className="text-xs text-gray-600 mt-1">{event.remarks}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <PageShell
      title="Docket Tracking"
      subtitle="Professional ERP-level docket tracking and shipment management"
    >
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Dockets</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardStats.total || 0}</p>
            </div>
            <MdAssignment className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardStats.inTransit || 0}</p>
            </div>
            <MdLocalShipping className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending QC</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardStats.pendingQC || 0}</p>
            </div>
            <MdSchedule className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Closed</p>
              <p className="text-2xl font-bold text-gray-800">{dashboardStats.closed || 0}</p>
            </div>
            <MdCheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Enhanced Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Docket ID, MR ID, AWB/LR Number, Supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pickup_pending">Pickup Pending</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="reached_hub">Reached Hub</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
            <option value="closed">Closed</option>
          </select>
          
          <select
            value={filters.courier}
            onChange={(e) => handleFilterChange('courier', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Couriers</option>
            <option value="VRL Logistics">VRL Logistics</option>
            <option value="Delhivery">Delhivery</option>
            <option value="Blue Dart">Blue Dart</option>
            <option value="DTDC">DTDC</option>
            <option value="FedEx">FedEx</option>
          </select>
          
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="From Date"
          />
          
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="To Date"
          />
          
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
            <input
              type="checkbox"
              checked={filters.delayed}
              onChange={(e) => handleFilterChange('delayed', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Delayed Only</span>
          </label>
          
          <button
            onClick={fetchDockets}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <MdRefresh className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={exportToExcel}
            className="px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 flex items-center gap-2"
          >
            <MdDownload className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <MdAdd className="w-4 h-4" />
            Create Docket
          </button>
        </div>
      </div>

      {/* Enhanced Data Table with Expandable Rows */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={dockets}
          loading={loading}
          emptyMessage="No dockets found"
          expandedRowRender={renderExpandedRow}
          expandedRows={expandedRows}
        />
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
                {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDocketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDockets();
            fetchDashboardStats();
            toast('Docket created successfully');
          }}
        />
      )}

      {showEditModal && selectedDocket && (
        <EditDocketModal
          isOpen={showEditModal}
          docket={selectedDocket}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchDockets();
            fetchDashboardStats();
            toast('Docket updated successfully');
          }}
        />
      )}

      {showViewModal && selectedDocket && (
        <ViewDocketModal
          isOpen={showViewModal}
          docket={selectedDocket}
          onClose={() => setShowViewModal(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {showTrackModal && selectedDocket && (
        <TrackShipmentModal
          isOpen={showTrackModal}
          docket={selectedDocket}
          onClose={() => setShowTrackModal(false)}
        />
      )}
    </PageShell>
  );
};

export default DocketTrackingPage;