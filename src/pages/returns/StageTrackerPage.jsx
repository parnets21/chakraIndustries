import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { materialReturnApi } from '../../api/materialReturnApi';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';

const RETURN_STAGES = [
  { key: 'Initiated', label: 'Initiated', description: 'Return request created' },
  { key: 'Approved', label: 'Approved', description: 'Return approved by manager' },
  { key: 'Transport_Pickup', label: 'Transport_Pickup', description: 'Transport arranged for pickup' },
  { key: 'In_Transit', label: 'In_Transit', description: 'Package in transit' },
  { key: 'Out_For_Delivery', label: 'Out_For_Delivery', description: 'Out for delivery' }
];

// Generate sample returns data
const generateSampleReturns = () => {
  return [
    {
      _id: 'return_001',
      mrId: 'MR-2026-004',
      supplierName: 'Amit Kumar',
      partyType: 'Dealer',
      contactNumber: '+91 98765 43210',
      email: 'amit.kumar@dealer.com',
      address: 'Shop No. 15, Market Complex, Sector 18, Noida, UP - 201301',
      invoiceNo: 'INV-2026-1234',
      invoiceAmount: 4200,
      value: 4200,
      stage: 'Initiated',
      aging: 3, // days since creation
      assignedTo: 'Priya Sharma',
      createdAt: new Date('2026-05-10T10:30:00').toISOString(),
      createdBy: 'Priya Sharma',
      creditNoteId: null,
      debitNoteId: null,
      gstAdjustment: 'Pending',
      tallySync: 'Pending',
      reconciliation: 'Open',
      items: [
        {
          sku: 'SKU-7644',
          productName: 'Product 764443',
          returnQty: 3,
          unitPrice: 1000,
          total: 3000,
          reason: 'Damaged',
          qcResult: 'Pending'
        },
        {
          sku: 'SKU-8821',
          productName: 'Cloth item',
          returnQty: 2,
          unitPrice: 600,
          total: 1200,
          reason: 'Wrong item',
          qcResult: 'Pending'
        }
      ]
    },
    {
      _id: 'return_002',
      mrId: 'MR-2026-005',
      supplierName: 'Rajesh Traders',
      partyType: 'Distributor',
      contactNumber: '+91 87654 32109',
      email: 'info@rajeshtraders.com',
      address: 'Plot No. 45, Industrial Area, Phase 2, Gurgaon, HR - 122015',
      invoiceNo: 'INV-2026-1235',
      invoiceAmount: 8500,
      value: 8500,
      stage: 'Approved',
      aging: 1, // days since creation
      assignedTo: 'Suresh Kumar',
      createdAt: new Date('2026-05-12T14:20:00').toISOString(),
      createdBy: 'Suresh Kumar',
      creditNoteId: 'CN-2026-001',
      debitNoteId: null,
      gstAdjustment: 'Completed',
      tallySync: 'Synced',
      reconciliation: 'Closed',
      items: [
        {
          sku: 'SKU-9001',
          productName: 'Electronic Component',
          returnQty: 5,
          unitPrice: 1700,
          total: 8500,
          reason: 'Defective',
          qcResult: 'Approved'
        }
      ]
    },
    {
      _id: 'return_003',
      mrId: 'MR-2026-006',
      supplierName: 'Metro Supplies',
      partyType: 'Retailer',
      contactNumber: '+91 76543 21098',
      email: 'orders@metrosupplies.in',
      address: 'Building A-12, Commercial Complex, Andheri East, Mumbai, MH - 400069',
      invoiceNo: 'INV-2026-1236',
      invoiceAmount: 2800,
      value: 2800,
      stage: 'QC_Check',
      aging: 7, // days since creation
      assignedTo: 'Anita Sharma',
      createdAt: new Date('2026-05-14T09:15:00').toISOString(),
      createdBy: 'Anita Sharma',
      creditNoteId: null,
      debitNoteId: null,
      gstAdjustment: 'Pending',
      tallySync: 'Pending',
      reconciliation: 'Open',
      items: [
        {
          sku: 'SKU-5522',
          productName: 'Textile Material',
          returnQty: 4,
          unitPrice: 700,
          total: 2800,
          reason: 'Quality Issue',
          qcResult: 'In Progress'
        }
      ]
    }
  ];
};

export default function StageTrackerPage({ returns: propReturns, onStageUpdate }) {
  const navigate = useNavigate();
  const [returns, setReturns] = useState(propReturns || []);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEditSupplierModal, setShowEditSupplierModal] = useState(false);
  const [showFinancialStatusModal, setShowFinancialStatusModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingFinancialStatus, setViewingFinancialStatus] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    supplierName: '',
    partyType: '',
    contactNumber: '',
    email: '',
    address: ''
  });

  // New Return Form State
  const [showCreateReturn, setShowCreateReturn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [returnForm, setReturnForm] = useState({ 
    supplierName: '', 
    items: 1, 
    value: '', 
    reason: '', 
    transport: '', 
    awbNo: '',
    invoiceNo: '',
    productName: '',
    returnQty: 1,
    pickupAddress: '',
    attachments: [],
    partyType: 'Dealer',
    invoiceAmount: '',
    assignedTo: '',
    createdBy: 'Priya Sharma'
  });

  // Helper function to ensure items is always an array
  const getItemsArray = (returnData) => {
    if (!returnData || !returnData.items) return [];
    if (Array.isArray(returnData.items)) return returnData.items;
    // If items is not an array, try to convert it or return empty array
    return [];
  };

  // Fetch all returns
  const fetchReturns = useCallback(async () => {
    // If returns are passed as props, use them instead of fetching
    if (propReturns && propReturns.length > 0) {
      setReturns(propReturns);
      if (!selectedReturn && propReturns.length > 0) {
        setSelectedReturn(propReturns[0]);
      }
      return;
    }

    try {
      setLoading(true);
      const response = await materialReturnApi.getAll();
      let returnsData = response.data || [];
      
      // Ensure each return has a valid items array
      returnsData = returnsData.map(returnItem => ({
        ...returnItem,
        items: Array.isArray(returnItem.items) ? returnItem.items : []
      }));
      
      // Add sample returns if no data exists
      if (returnsData.length === 0) {
        returnsData = generateSampleReturns();
      }
      
      setReturns(returnsData);
      if (!selectedReturn && returnsData.length > 0) {
        setSelectedReturn(returnsData[0]);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      // Use sample data on error
      const sampleData = generateSampleReturns();
      setReturns(sampleData);
      if (!selectedReturn && sampleData.length > 0) {
        setSelectedReturn(sampleData[0]);
      }
      toast('Using sample data', 'info');
    } finally {
      setLoading(false);
    }
  }, [selectedReturn, propReturns]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const getCurrentStageIndex = (returnData) => {
    return RETURN_STAGES.findIndex(stage => stage.key === returnData?.stage) || 0;
  };

  const handleStageUpdate = async (newStage, note = '') => {
    if (!selectedReturn) return;
    
    setLoading(true);
    try {
      // Use parent callback if available
      if (onStageUpdate) {
        await onStageUpdate(selectedReturn._id, newStage);
        // Update local state
        const updatedReturn = { 
          ...selectedReturn, 
          stage: newStage,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Current User'
        };
        setSelectedReturn(updatedReturn);
        
        // Update returns list
        setReturns(prev => prev.map(r => 
          r._id === selectedReturn._id ? updatedReturn : r
        ));
      } else {
        // Fallback to direct API call
        if (materialReturnApi.updateStage) {
          await materialReturnApi.updateStage(selectedReturn._id, newStage, note);
        }
        
        // Update local state
        const updatedReturn = { 
          ...selectedReturn, 
          stage: newStage,
          lastUpdated: new Date().toISOString(),
          updatedBy: 'Current User'
        };
        setSelectedReturn(updatedReturn);
        
        // Update returns list
        setReturns(prev => prev.map(r => 
          r._id === selectedReturn._id ? updatedReturn : r
        ));
        
        // Refresh data
        await fetchReturns();
      }
      
      toast(`Return ${selectedReturn.mrId} moved to ${newStage} stage`, 'success');
    } catch (error) {
      console.error('Error updating stage:', error);
      toast('Failed to update stage', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSupplier = (returnItem) => {
    setEditingSupplier(returnItem);
    setSupplierForm({
      supplierName: returnItem.supplierName || '',
      partyType: returnItem.partyType || '',
      contactNumber: returnItem.contactNumber || '',
      email: returnItem.email || '',
      address: returnItem.address || ''
    });
    setShowEditSupplierModal(true);
  };

  const handleViewFinancialStatus = (returnItem) => {
    setViewingFinancialStatus(returnItem);
    setShowFinancialStatusModal(true);
  };

  const handleSaveSupplier = async () => {
    if (!editingSupplier) return;
    
    setLoading(true);
    try {
      // Update supplier details via API if available
      if (materialReturnApi.updateSupplier) {
        await materialReturnApi.updateSupplier(editingSupplier._id, supplierForm);
      }
      
      // Update local state
      const updatedReturn = { 
        ...editingSupplier, 
        ...supplierForm,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Current User'
      };
      
      // Update returns list
      setReturns(prev => prev.map(r => 
        r._id === editingSupplier._id ? updatedReturn : r
      ));
      
      // Update selected return if it's the same one
      if (selectedReturn?._id === editingSupplier._id) {
        setSelectedReturn(updatedReturn);
      }
      
      toast(`Supplier details updated for ${editingSupplier.mrId}`, 'success');
      setShowEditSupplierModal(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast('Failed to update supplier details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!returnForm.supplierName || !returnForm.reason || !returnForm.pickupAddress) {
      toast('Please fill all required fields', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const returnData = {
        ...returnForm,
        stage: 'Initiated',
        aging: 0, // New returns start with 0 days aging
        createdAt: new Date().toISOString(),
        mrId: `MR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
      };
      
      // Create via API if available
      if (materialReturnApi.create) {
        await materialReturnApi.create(returnData);
      }
      
      // Add to local state
      const newReturn = {
        _id: `return_${Date.now()}`,
        ...returnData,
        items: [{
          sku: 'SKU-' + Math.floor(Math.random() * 10000),
          productName: returnForm.productName || 'Product',
          returnQty: returnForm.returnQty || 1,
          unitPrice: Math.floor((returnForm.value || 0) / (returnForm.returnQty || 1)),
          total: returnForm.value || 0,
          reason: returnForm.reason,
          qcResult: 'Pending'
        }]
      };
      
      setReturns(prev => [newReturn, ...prev]);
      setShowCreateReturn(false);
      
      // Reset form
      setReturnForm({ 
        supplierName: '', 
        items: 1, 
        value: '', 
        reason: '', 
        transport: '', 
        awbNo: '',
        invoiceNo: '',
        productName: '',
        returnQty: 1,
        pickupAddress: '',
        attachments: [],
        partyType: 'Dealer',
        invoiceAmount: '',
        assignedTo: '',
        createdBy: 'Priya Sharma'
      });
      
      toast(`Return request ${newReturn.mrId} created successfully`, 'success');
    } catch (error) {
      console.error('Error creating return:', error);
      toast('Failed to create return request', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-600">Loading stage tracker...</div>
        </div>
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="text-center py-12">
          <div className="text-lg font-semibold text-gray-600 mb-4">No return requests found</div>
          <button 
            onClick={() => navigate('/returns/material')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Create New Return
          </button>
        </div>
      </div>
    );
  }

  const currentStageIndex = selectedReturn ? getCurrentStageIndex(selectedReturn) : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Returns List Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Stage Tracker</h2>
          <button 
            onClick={() => setShowCreateReturn(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
          >
            + New Return
          </button>
        </div>
        
        {/* Returns List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">MR ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Stage</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Aging</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Assigned</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnItem) => (
                  <tr 
                    key={returnItem._id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedReturn?._id === returnItem._id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedReturn(returnItem)}
                  >
                    <td className="py-3 px-4 text-sm font-semibold text-red-600">{returnItem.mrId || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-semibold">{returnItem.supplierName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{returnItem.partyType || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold">{returnItem.invoiceNo || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm font-semibold">₹{(returnItem.value || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        returnItem.stage === 'In_Transit' ? 'bg-blue-100 text-blue-800' :
                        returnItem.stage === 'Approved' ? 'bg-green-100 text-green-800' :
                        returnItem.stage === 'QC_Check' ? 'bg-yellow-100 text-yellow-800' :
                        returnItem.stage === 'Closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {returnItem.stage === 'In_Transit' ? 'In transit' : returnItem.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        (returnItem.aging || 0) <= 2 ? 'bg-green-100 text-green-800' :
                        (returnItem.aging || 0) <= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {returnItem.aging || 0} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {(returnItem.assignedTo || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-700 font-medium">{returnItem.assignedTo || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {returnItem.createdAt ? new Date(returnItem.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 justify-start">
                        {/* View Details Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReturn(returnItem);
                          }}
                          className="group relative px-3 py-2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-lg text-xs font-bold hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 flex items-center gap-1.5 border border-blue-400/20 backdrop-blur-sm min-w-0 flex-shrink-0"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <svg className="w-3.5 h-3.5 relative z-10 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span className="relative z-10 whitespace-nowrap">View</span>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </button>

                        {/* Supplier Details Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSupplier(returnItem);
                          }}
                          className="group relative px-3 py-2 bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 text-white rounded-lg text-xs font-bold hover:from-emerald-600 hover:via-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 flex items-center gap-1.5 border border-green-400/20 backdrop-blur-sm min-w-0 flex-shrink-0"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <svg className="w-3.5 h-3.5 relative z-10 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="relative z-10 whitespace-nowrap">Supplier Details</span>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-green-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </button>

                        {/* Financial Status Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFinancialStatus(returnItem);
                          }}
                          className="group relative px-3 py-2 bg-gradient-to-br from-purple-500 via-violet-600 to-purple-700 text-white rounded-lg text-xs font-bold hover:from-purple-600 hover:via-violet-700 hover:to-purple-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 flex items-center gap-1.5 border border-purple-400/20 backdrop-blur-sm min-w-0 flex-shrink-0"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <svg className="w-3.5 h-3.5 relative z-10 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="relative z-10 whitespace-nowrap">Finance</span>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-violet-600 rounded-lg blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Return Details */}
      {selectedReturn && (
        <>
          {/* Header with exact MR ID and details */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-red-600 mb-1">{selectedReturn.mrId || 'N/A'}</h1>
                <p className="text-gray-600">
                  Sales return • Created {selectedReturn.createdAt ? new Date(selectedReturn.createdAt).toLocaleDateString('en-IN') : 'N/A'} • By {selectedReturn.createdBy || 'N/A'}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {selectedReturn.stage === 'In_Transit' ? 'In transit' : selectedReturn.stage}
                </div>
                <div className="flex gap-2">
                  {/* Move to Next Stage Button */}
                  {selectedReturn.stage === 'In_Transit' && (
                    <button 
                      onClick={() => handleStageUpdate('Approved')}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {loading ? 'Moving...' : '→ Move to Approved'}
                    </button>
                  )}
                  {selectedReturn.stage === 'Approved' && (
                    <button 
                      onClick={() => handleStageUpdate('QC_Check')}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      {loading ? 'Moving...' : '→ Move to QC Check'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stage Progress Tracker */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Stage Tracker — {selectedReturn.mrId || 'N/A'}</h3>
              <div className="flex items-center justify-between mb-4 overflow-x-auto">
                {RETURN_STAGES.map((stage, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;

                  return (
                    <div key={stage.key} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        {/* Stage Circle */}
                        <div className={`
                          w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2
                          ${isCompleted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : isCurrent 
                              ? 'bg-red-600 border-red-600 text-white' 
                              : 'border-gray-300 text-gray-400 bg-white'
                          }
                        `}>
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        
                        {/* Stage Label */}
                        <div className="mt-3 text-center">
                          <div className={`text-sm font-semibold ${
                            isCurrent ? 'text-red-700' : isCompleted ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {stage.label}
                          </div>
                        </div>
                      </div>
                      
                      {/* Connector Line */}
                      {index < RETURN_STAGES.length - 1 && (
                        <div className={`h-1 w-20 mx-4 rounded ${
                          index < currentStageIndex ? 'bg-green-400' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Move to Approved Button */}
          <div className="mt-6 px-6">
            <button 
              onClick={() => handleStageUpdate('Approved')}
              disabled={loading}
              className="w-full px-6 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-semibold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="text-xl">→</span>
              {loading ? 'Moving...' : 'Move to Approved'}
            </button>
          </div>
        </>
      )}

      {/* Edit Supplier Modal */}
      <Modal 
        open={showEditSupplierModal} 
        onClose={() => setShowEditSupplierModal(false)} 
        title="Edit Supplier Details"
        footer={
          <div className="flex gap-3">
            <button 
              onClick={() => setShowEditSupplierModal(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveSupplier}
              disabled={loading || !supplierForm.supplierName.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 font-semibold">📝 Editing Supplier for</span>
            </div>
            <div className="text-sm text-blue-800">
              <div><strong>MR ID:</strong> {editingSupplier?.mrId}</div>
              <div><strong>Invoice:</strong> {editingSupplier?.invoiceNo}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierForm.supplierName}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, supplierName: e.target.value }))}
                placeholder="Enter supplier name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Party Type
              </label>
              <select
                value={supplierForm.partyType}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, partyType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select party type</option>
                <option value="Dealer">Dealer</option>
                <option value="Distributor">Distributor</option>
                <option value="Retailer">Retailer</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Manufacturer">Manufacturer</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={supplierForm.contactNumber}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                placeholder="Enter contact number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address
            </label>
            <textarea
              value={supplierForm.address}
              onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter complete address"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div className="text-xs text-gray-500 mt-2">
            <strong>Note:</strong> Changes will be applied to this return record. Contact admin for permanent supplier master updates.
          </div>
        </div>
      </Modal>

      {/* Financial Status Modal */}
      <Modal 
        open={showFinancialStatusModal} 
        onClose={() => setShowFinancialStatusModal(false)} 
        title="Financial Status Details"
        footer={
          <div className="flex justify-end">
            <button 
              onClick={() => setShowFinancialStatusModal(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
            >
              Close
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Return Information Header */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-600 font-semibold text-lg">💰 Financial Overview</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">MR ID:</span>
                <span className="font-semibold ml-2">{viewingFinancialStatus?.mrId}</span>
              </div>
              <div>
                <span className="text-gray-600">Invoice No:</span>
                <span className="font-semibold ml-2">{viewingFinancialStatus?.invoiceNo}</span>
              </div>
              <div>
                <span className="text-gray-600">Supplier:</span>
                <span className="font-semibold ml-2">{viewingFinancialStatus?.supplierName}</span>
              </div>
              <div>
                <span className="text-gray-600">Return Amount:</span>
                <span className="font-semibold ml-2 text-red-600">₹{(viewingFinancialStatus?.value || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Financial Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Credit Note Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📄</span>
                <h4 className="font-semibold text-gray-800">Credit Note</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    viewingFinancialStatus?.creditNoteId ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {viewingFinancialStatus?.creditNoteId ? 'Generated' : 'Not Generated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Note ID:</span>
                  <span className="font-semibold">{viewingFinancialStatus?.creditNoteId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">₹{(viewingFinancialStatus?.value || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Debit Note Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📋</span>
                <h4 className="font-semibold text-gray-800">Debit Note</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    viewingFinancialStatus?.debitNoteId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {viewingFinancialStatus?.debitNoteId ? 'Generated' : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Debit Note ID:</span>
                  <span className="font-semibold">{viewingFinancialStatus?.debitNoteId || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* GST Adjustment */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🧾</span>
                <h4 className="font-semibold text-gray-800">GST Adjustment</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    (viewingFinancialStatus?.gstAdjustment || 'Pending') === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {viewingFinancialStatus?.gstAdjustment || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST Amount:</span>
                  <span className="font-semibold">₹{Math.round((viewingFinancialStatus?.value || 0) * 0.18).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Tally Sync */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔄</span>
                <h4 className="font-semibold text-gray-800">Tally Sync</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-xs ${
                    (viewingFinancialStatus?.tallySync || 'Pending') === 'Synced' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {viewingFinancialStatus?.tallySync || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Sync:</span>
                  <span className="font-semibold">
                    {(viewingFinancialStatus?.tallySync || 'Pending') === 'Synced' ? 'Today' : 'Not synced'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚖️</span>
              <h4 className="font-semibold text-gray-800">Reconciliation Status</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{(viewingFinancialStatus?.invoiceAmount || 0).toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-600">Original Invoice</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">₹{(viewingFinancialStatus?.value || 0).toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-600">Return Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">₹{((viewingFinancialStatus?.invoiceAmount || 0) - (viewingFinancialStatus?.value || 0)).toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-600">Net Amount</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                (viewingFinancialStatus?.reconciliation || 'Open') === 'Closed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
              }`}>
                Reconciliation: {viewingFinancialStatus?.reconciliation || 'Open'}
              </span>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h4 className="font-semibold text-gray-800">Pending Actions</h4>
            </div>
            <ul className="space-y-2 text-sm">
              {!viewingFinancialStatus?.creditNoteId && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Generate Credit Note</span>
                </li>
              )}
              {(viewingFinancialStatus?.gstAdjustment || 'Pending') !== 'Completed' && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Complete GST Adjustment</span>
                </li>
              )}
              {(viewingFinancialStatus?.tallySync || 'Pending') !== 'Synced' && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Sync with Tally</span>
                </li>
              )}
              {(viewingFinancialStatus?.reconciliation || 'Open') !== 'Closed' && (
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Close Reconciliation</span>
                </li>
              )}
            </ul>
            {(!viewingFinancialStatus?.creditNoteId || 
              (viewingFinancialStatus?.gstAdjustment || 'Pending') !== 'Completed' || 
              (viewingFinancialStatus?.tallySync || 'Pending') !== 'Synced' || 
              (viewingFinancialStatus?.reconciliation || 'Open') !== 'Closed') ? null : (
              <div className="text-green-600 font-semibold">✅ All financial processes completed</div>
            )}
          </div>
        </div>
      </Modal>

      {/* New Return Form Modal */}
      <Modal 
        open={showCreateReturn} 
        onClose={() => setShowCreateReturn(false)} 
        title="New Material Return"
        footer={
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateReturn(false)}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateReturn}
              disabled={saving || !returnForm.supplierName.trim() || !returnForm.reason.trim() || !returnForm.pickupAddress.trim()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? 'Creating...' : 'Create Return'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Supplier *', 'supplierName', 'text', 'Supplier name'], 
            ['Invoice Number *', 'invoiceNo', 'text', 'Invoice number'],
            ['Product Name *', 'productName', 'text', 'Product name'], 
            ['Return Qty', 'returnQty', 'number', '1'],
            ['No. of Items', 'items', 'number', '1'], 
            ['Return Value (₹)', 'value', 'number', '0'], 
            ['Transport', 'transport', 'text', 'Courier name'], 
            ['AWB / Tracking No.', 'awbNo', 'text', 'AWB number']
          ].map(([label, key, type, ph]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">{label}</label>
              <input 
                type={type} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400" 
                placeholder={ph} 
                value={returnForm[key]} 
                onChange={e => setReturnForm(p => ({ ...p, [key]: e.target.value }))} 
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Assigned To</label>
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
              value={returnForm.assignedTo} 
              onChange={e => setReturnForm(p => ({ ...p, assignedTo: e.target.value }))}
            >
              <option value="">Select assignee</option>
              <option value="Priya Sharma">Priya Sharma</option>
              <option value="Suresh Kumar">Suresh Kumar</option>
              <option value="Anita Sharma">Anita Sharma</option>
              <option value="Rajesh Gupta">Rajesh Gupta</option>
              <option value="Neha Singh">Neha Singh</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Pickup Address *</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400" 
              rows={2} 
              placeholder="Complete pickup address..." 
              value={returnForm.pickupAddress} 
              onChange={e => setReturnForm(p => ({ ...p, pickupAddress: e.target.value }))} 
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Reason *</label>
            <textarea 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400" 
              rows={2} 
              placeholder="Reason for return..." 
              value={returnForm.reason} 
              onChange={e => setReturnForm(p => ({ ...p, reason: e.target.value }))} 
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs font-semibold text-gray-600">Attachments (Optional)</label>
            <input 
              type="file" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
              multiple 
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => setReturnForm(p => ({ ...p, attachments: Array.from(e.target.files) }))} 
            />
            <div className="text-xs text-gray-500">Upload invoice, photos, or supporting documents (PDF, Images, Word docs)</div>
            {returnForm.attachments && returnForm.attachments.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-600 mb-1">Selected Files:</div>
                {returnForm.attachments.map((file, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mb-1">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}