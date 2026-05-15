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
  MdWarning
} from 'react-icons/md';
import PageShell from '../../components/common/PageShell';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from '../../components/common/Toast';
import docketTrackingApi from '../../api/docketTrackingApi';

const DocketTrackingPage = () => {
  const [dockets, setDockets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocket, setSelectedDocket] = useState(null);

  // Fetch dockets
  const fetchDockets = async () => {
    try {
      setLoading(true);
      const response = await docketTrackingApi.getAllDockets({
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setDockets(response.data || []);
    } catch (error) {
      toast('Error fetching dockets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDockets();
  }, [searchTerm, statusFilter]);

  const handleDelete = async (docketId) => {
    if (window.confirm('Are you sure you want to delete this docket?')) {
      try {
        await docketTrackingApi.deleteDocket(docketId);
        toast('Docket deleted successfully');
        fetchDockets();
      } catch (error) {
        toast('Error deleting docket', 'error');
      }
    }
  };

  const handleStatusUpdate = async (docketId, newStatus) => {
    try {
      await docketTrackingApi.updateDocketStatus(docketId, newStatus);
      toast('Status updated successfully');
      fetchDockets();
    } catch (error) {
      toast('Error updating status', 'error');
    }
  };
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'dispatched':
        return <MdLocalShipping className="w-4 h-4" />;
      case 'in_transit':
        return <MdInventory className="w-4 h-4" />;
      case 'delivered':
        return <MdCheckCircle className="w-4 h-4" />;
      case 'delayed':
        return <MdWarning className="w-4 h-4" />;
      default:
        return <MdAccessTime className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'dispatched':
        return 'blue';
      case 'in_transit':
        return 'yellow';
      case 'delivered':
        return 'green';
      case 'delayed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const columns = [
    {
      key: 'docketId',
      label: 'Docket ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-blue-600">{value}</span>
      )
    },
    {
      key: 'mrId',
      label: 'MR ID',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'supplierName',
      label: 'Supplier Name',
      sortable: true
    },
    {
      key: 'transporter',
      label: 'Transporter',
      sortable: true
    },
    {
      key: 'lrNumber',
      label: 'LR Number',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{value}</span>
      )
    },
    {
      key: 'vehicleNo',
      label: 'Vehicle No',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'dispatchDate',
      label: 'Dispatch Date',
      sortable: true,
      render: (value) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'expectedArrival',
      label: 'Expected Arrival',
      sortable: true,
      render: (value) => (
        <span>{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      key: 'materialStatus',
      label: 'Material Status',
      render: (value) => (
        <StatusBadge 
          status={value} 
          color={getStatusColor(value)}
          icon={getStatusIcon(value)}
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex space-x-2">
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
  return (
    <PageShell
      title="Docket Tracking"
      subtitle="Track and manage material shipment dockets"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Docket ID, MR ID, Supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="delayed">Delayed</option>
          </select>
          
          <button
            onClick={fetchDockets}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <MdRefresh className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <MdAdd className="w-4 h-4" />
            Add Docket
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={dockets}
          loading={loading}
          emptyMessage="No dockets found"
        />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDocketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDockets();
            toast('Docket created successfully');
          }}
        />
      )}
    </PageShell>
  );
};
// Create Docket Modal Component
const CreateDocketModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    // Return Details (Auto Filled)
    mrId: '',
    supplierName: '',
    invoiceNo: '',
    returnQty: '',
    returnAmount: '',
    dispatchLocation: '',
    
    // Logistics Details
    transporter: '',
    lrNumber: '',
    vehicleNo: '',
    driverName: '',
    driverMobile: '',
    dispatchDate: '',
    expectedArrival: '',
    transportCost: '',
    
    // Material Status
    materialStatus: 'in_transit',
    remarks: '',
    
    // Attachments
    lrCopy: null,
    otherDocuments: null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Generate docket ID automatically
      const docketId = `DKT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const docketData = {
        ...formData,
        docketId
      };
      
      await docketTrackingApi.createDocket(docketData);
      onSuccess();
    } catch (error) {
      console.error('Error creating docket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Docket" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Return Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Return Details (Auto Filled)</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MR ID
              </label>
              <input
                type="text"
                value={formData.mrId}
                onChange={(e) => setFormData({...formData, mrId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="MR-2026-004"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData({...formData, supplierName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Amit Traders"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice No.
              </label>
              <input
                type="text"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="INV-7624764"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Qty
              </label>
              <input
                type="text"
                value={formData.returnQty}
                onChange={(e) => setFormData({...formData, returnQty: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="5 Items"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Amount
              </label>
              <input
                type="text"
                value={formData.returnAmount}
                onChange={(e) => setFormData({...formData, returnAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="₹24.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispatch Location
              </label>
              <input
                type="text"
                value={formData.dispatchLocation}
                onChange={(e) => setFormData({...formData, dispatchLocation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Main Warehouse"
              />
            </div>
          </div>
        </div>
        {/* Logistics Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Logistics Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporter *
              </label>
              <select
                value={formData.transporter}
                onChange={(e) => setFormData({...formData, transporter: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Transporter</option>
                <option value="VRL Logistics">VRL Logistics</option>
                <option value="Delhivery">Delhivery</option>
                <option value="Blue Dart Freight">Blue Dart Freight</option>
                <option value="Transport Co.">Transport Co.</option>
                <option value="Express Logistics">Express Logistics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LR Number *
              </label>
              <input
                type="text"
                value={formData.lrNumber}
                onChange={(e) => setFormData({...formData, lrNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="LR-889977"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle No *
              </label>
              <input
                type="text"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="KA01AB1234"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ramesh Kumar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Mobile
              </label>
              <input
                type="tel"
                value={formData.driverMobile}
                onChange={(e) => setFormData({...formData, driverMobile: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transport Cost
              </label>
              <input
                type="number"
                value={formData.transportCost}
                onChange={(e) => setFormData({...formData, transportCost: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1200.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dispatch Date *
              </label>
              <input
                type="date"
                value={formData.dispatchDate}
                onChange={(e) => setFormData({...formData, dispatchDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Arrival *
              </label>
              <input
                type="date"
                value={formData.expectedArrival}
                onChange={(e) => setFormData({...formData, expectedArrival: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
        {/* Material Status Section */}
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Material Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Status
              </label>
              <select
                value={formData.materialStatus}
                onChange={(e) => setFormData({...formData, materialStatus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dispatched">Dispatched</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Material dispatched from our warehouse."
              />
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        <div>
          <h3 className="text-lg font-semibold text-blue-600 mb-4">Attachments</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LR Copy
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('lrCopy', e.target.files[0])}
                  className="hidden"
                  id="lrCopy"
                />
                <label htmlFor="lrCopy" className="cursor-pointer">
                  <div className="text-gray-500">
                    {formData.lrCopy ? formData.lrCopy.name : 'Choose File'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.lrCopy ? 'File selected' : 'LR_889977.pdf'}
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Documents
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('otherDocuments', e.target.files[0])}
                  className="hidden"
                  id="otherDocs"
                />
                <label htmlFor="otherDocs" className="cursor-pointer">
                  <div className="text-gray-500">
                    {formData.otherDocuments ? formData.otherDocuments.name : 'Choose File'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.otherDocuments ? 'File selected' : 'No file chosen'}
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Docket'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DocketTrackingPage;