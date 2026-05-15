import { useState, useEffect, useCallback } from 'react';
import { lossTrackingApi } from '../../api/lossTrackingApi';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import { 
  FiDollarSign, FiTrendingUp, FiBarChart2, FiAlertTriangle,
  FiFilter, FiPlus, FiEye, FiEdit, FiTrash2
} from 'react-icons/fi';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const lbl = 'text-xs font-semibold text-gray-600';
const fld = 'flex flex-col gap-1.5';

export default function ProfessionalLossTrackingPage() {
  const [lossRecords, setLossRecords] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    finalStatus: '',
    priority: '',
    lossType: '',
    reconciliationStatus: '',
    responsibleDepartment: '',
    supplierName: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [saving, setSaving] = useState(false);

  // Professional ERP Form Structure
  const [lossForm, setLossForm] = useState({
    mrId: '',
    lossType: 'Transit Damage',
    rootCause: 'Supplier Packing Issue',
    responsibleDepartment: 'Procurement',
    responsiblePerson: '',
    priority: 'Medium',
    products: [{
      productName: '',
      skuCode: '',
      batchNo: '',
      serialNo: '',
      returnQty: 0,
      receivedQty: 0,
      damagedQty: 0,
      shortageQty: 0,
      excessQty: 0,
      unitRate: 0,
      totalValue: 0
    }],
    resolutionNotes: '',
    correctiveAction: '',
    preventiveAction: ''
  });

  const fetchLossRecords = useCallback(async () => {
    setLoading(true);
    try {
      const [recordsRes, analyticsRes] = await Promise.all([
        lossTrackingApi.getAll(filters),
        lossTrackingApi.getAnalytics(filters)
      ]);
      
      setLossRecords(recordsRes.data || []);
      setAnalytics(analyticsRes.data || {});
    } catch (error) {
      console.error('Error fetching loss records:', error);
      toast('Failed to fetch loss tracking data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLossRecords();
  }, [fetchLossRecords]);

  // Helper Functions
  const updateProduct = (index, field, value) => {
    setLossForm(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, [field]: value } : product
      )
    }));
  };

  const addProduct = () => {
    setLossForm(prev => ({
      ...prev,
      products: [...prev.products, {
        productName: '',
        skuCode: '',
        batchNo: '',
        serialNo: '',
        returnQty: 0,
        receivedQty: 0,
        damagedQty: 0,
        shortageQty: 0,
        excessQty: 0,
        unitRate: 0,
        totalValue: 0
      }]
    }));
  };

  const removeProduct = (index) => {
    if (lossForm.products.length > 1) {
      setLossForm(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreateLoss = async () => {
    if (!lossForm.mrId || !lossForm.responsiblePerson) {
      toast('Please fill all required fields: MR ID and Responsible Person', 'error');
      return;
    }

    setSaving(true);
    try {
      await lossTrackingApi.create(lossForm);
      setShowCreateModal(false);
      setLossForm({
        mrId: '',
        lossType: 'Transit Damage',
        rootCause: 'Supplier Packing Issue',
        responsibleDepartment: 'Procurement',
        responsiblePerson: '',
        priority: 'Medium',
        products: [{
          productName: '',
          skuCode: '',
          batchNo: '',
          serialNo: '',
          returnQty: 0,
          receivedQty: 0,
          damagedQty: 0,
          shortageQty: 0,
          excessQty: 0,
          unitRate: 0,
          totalValue: 0
        }],
        resolutionNotes: '',
        correctiveAction: '',
        preventiveAction: ''
      });
      await fetchLossRecords();
      toast('Professional loss record created successfully', 'success');
    } catch (error) {
      toast(error.message || 'Failed to create loss record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRaiseDebitNote = async (id) => {
    const amount = prompt('Enter debit note amount:');
    const reason = prompt('Enter reason for debit note:');
    if (amount && reason) {
      try {
        await lossTrackingApi.raiseDebitNote(id, parseFloat(amount), reason);
        await fetchLossRecords();
        toast('Debit note raised successfully', 'success');
      } catch (error) {
        toast(error.message || 'Failed to raise debit note', 'error');
      }
    }
  };

  const handleIssueCreditNote = async (id) => {
    const amount = prompt('Enter credit note amount:');
    const reason = prompt('Enter reason for credit note:');
    if (amount && reason) {
      try {
        await lossTrackingApi.issueCreditNote(id, parseFloat(amount), reason);
        await fetchLossRecords();
        toast('Credit note issued successfully', 'success');
      } catch (error) {
        toast(error.message || 'Failed to issue credit note', 'error');
      }
    }
  };

  const handleEscalate = async (id) => {
    const reason = prompt('Enter escalation reason:');
    if (reason) {
      try {
        await lossTrackingApi.escalate(id, reason);
        await fetchLossRecords();
        toast('Case escalated successfully', 'success');
      } catch (error) {
        toast(error.message || 'Failed to escalate case', 'error');
      }
    }
  };

  return (
    <div className="p-6">
      {/* Professional ERP Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Professional Loss Tracking System</h1>
        <p className="text-gray-600 mt-1">Comprehensive ERP-level loss management with auto data flow</p>
      </div>
      {/* Executive Dashboard KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { 
            label: 'Total Loss Amount', 
            value: `₹${(analytics.executiveSummary?.[0]?.totalLossAmount || 0).toLocaleString('en-IN')}`, 
            color: '#dc2626',
            icon: <FiDollarSign className="text-xl" />
          },
          { 
            label: 'Recoverable Amount', 
            value: `₹${(analytics.executiveSummary?.[0]?.totalRecoverable || 0).toLocaleString('en-IN')}`, 
            color: '#059669',
            icon: <FiTrendingUp className="text-xl" />
          },
          { 
            label: 'Total Cases', 
            value: analytics.executiveSummary?.[0]?.totalCases || 0, 
            color: '#3b82f6',
            icon: <FiBarChart2 className="text-xl" />
          },
          { 
            label: 'Critical Cases', 
            value: analytics.executiveSummary?.[0]?.criticalCases || 0, 
            color: '#dc2626',
            icon: <FiAlertTriangle className="text-xl" />
          }
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
              <div className="text-2xl font-black tracking-tight" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
            <div className="text-xs text-gray-500 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Professional Filters & Actions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <FiFilter className="text-gray-600" />
            Advanced Filters & Actions
          </h3>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg flex items-center gap-2"
          >
            <FiPlus /> Create Loss Record
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <select 
            className={inp} 
            value={filters.finalStatus} 
            onChange={e => setFilters(prev => ({ ...prev, finalStatus: e.target.value }))}
          >
            <option value="">All Status</option>
            {lossTrackingApi.FINAL_STATUS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          
          <select 
            className={inp} 
            value={filters.priority} 
            onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="">All Priority</option>
            {lossTrackingApi.PRIORITIES.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          
          <select 
            className={inp} 
            value={filters.lossType} 
            onChange={e => setFilters(prev => ({ ...prev, lossType: e.target.value }))}
          >
            <option value="">All Loss Types</option>
            {lossTrackingApi.LOSS_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select 
            className={inp} 
            value={filters.responsibleDepartment} 
            onChange={e => setFilters(prev => ({ ...prev, responsibleDepartment: e.target.value }))}
          >
            <option value="">All Departments</option>
            {lossTrackingApi.DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          <input 
            type="date" 
            className={inp} 
            value={filters.dateFrom} 
            onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            placeholder="From Date"
          />
          
          <input 
            type="date" 
            className={inp} 
            value={filters.dateTo} 
            onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            placeholder="To Date"
          />
        </div>
      </div>
      {/* Professional Loss Tracking Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-800">Loss Tracking Records ({lossRecords.length})</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading loss tracking data...</div>
        ) : lossRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No loss records found. Create your first loss record to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    'Loss ID', 'MR ID', 'Supplier', 'Invoice', 'Loss Type', 
                    'Loss Amount', 'Recoverable', 'Priority', 'Department', 
                    'SLA Status', 'Reconciliation', 'Actions'
                  ].map(header => (
                    <th key={header} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lossRecords.map((record) => (
                  <tr key={record._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">{record.lossId}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{record.mrId}</td>
                    <td className="px-4 py-3 font-medium">{record.supplierName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{record.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        {record.lossType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">₹{(record.lossAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-bold text-green-600">₹{(record.recoverableAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${
                        record.priority === 'Critical' ? 'bg-red-600' :
                        record.priority === 'High' ? 'bg-red-500' :
                        record.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {record.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{record.responsibleDepartment}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        record.slaStatus === 'Overdue' ? 'bg-red-100 text-red-700' :
                        record.slaStatus === 'Due Soon' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {record.daysOpen} days
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        record.reconciliationStatus === 'Fully Reconciled' ? 'bg-green-100 text-green-700' :
                        record.reconciliationStatus === 'Open' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.reconciliationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Professional Create Loss Record Modal */}
      <Modal 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        title="Create Professional Loss Record"
        size="xl"
        footer={
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              onClick={handleCreateLoss}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Loss Record'}
            </button>
          </div>
        }
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-700 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={fld}>
                <label className={lbl}>MR ID *</label>
                <input 
                  className={inp} 
                  placeholder="MR-2026-00001" 
                  value={lossForm.mrId} 
                  onChange={e => setLossForm(prev => ({ ...prev, mrId: e.target.value }))} 
                />
              </div>
              <div className={fld}>
                <label className={lbl}>Loss Type *</label>
                <select 
                  className={inp} 
                  value={lossForm.lossType} 
                  onChange={e => setLossForm(prev => ({ ...prev, lossType: e.target.value }))}
                >
                  {lossTrackingApi.LOSS_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className={fld}>
                <label className={lbl}>Root Cause *</label>
                <select 
                  className={inp} 
                  value={lossForm.rootCause} 
                  onChange={e => setLossForm(prev => ({ ...prev, rootCause: e.target.value }))}
                >
                  {lossTrackingApi.ROOT_CAUSES.map(cause => (
                    <option key={cause} value={cause}>{cause}</option>
                  ))}
                </select>
              </div>
              <div className={fld}>
                <label className={lbl}>Priority *</label>
                <select 
                  className={inp} 
                  value={lossForm.priority} 
                  onChange={e => setLossForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  {lossTrackingApi.PRIORITIES.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Responsibility Assignment */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-indigo-700 mb-3">Responsibility Assignment</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={fld}>
                <label className={lbl}>Responsible Department *</label>
                <select 
                  className={inp} 
                  value={lossForm.responsibleDepartment} 
                  onChange={e => setLossForm(prev => ({ ...prev, responsibleDepartment: e.target.value }))}
                >
                  {lossTrackingApi.DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className={fld}>
                <label className={lbl}>Responsible Person *</label>
                <input 
                  className={inp} 
                  placeholder="Enter person name" 
                  value={lossForm.responsiblePerson} 
                  onChange={e => setLossForm(prev => ({ ...prev, responsiblePerson: e.target.value }))} 
                />
              </div>
            </div>
          </div>
          {/* Product Details */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-700 mb-3">Product Details</h4>
            {lossForm.products.map((product, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white rounded border">
                <div className={fld}>
                  <label className={lbl}>Product Name *</label>
                  <input 
                    className={inp} 
                    placeholder="Product name" 
                    value={product.productName} 
                    onChange={e => updateProduct(index, 'productName', e.target.value)} 
                  />
                </div>
                <div className={fld}>
                  <label className={lbl}>SKU Code *</label>
                  <input 
                    className={inp} 
                    placeholder="SKU-001" 
                    value={product.skuCode} 
                    onChange={e => updateProduct(index, 'skuCode', e.target.value)} 
                  />
                </div>
                <div className={fld}>
                  <label className={lbl}>Batch No</label>
                  <input 
                    className={inp} 
                    placeholder="BATCH-001" 
                    value={product.batchNo} 
                    onChange={e => updateProduct(index, 'batchNo', e.target.value)} 
                  />
                </div>
                <div className={fld}>
                  <label className={lbl}>Damaged Qty *</label>
                  <input 
                    type="number" 
                    className={inp} 
                    placeholder="0" 
                    value={product.damagedQty} 
                    onChange={e => updateProduct(index, 'damagedQty', parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className={fld}>
                  <label className={lbl}>Unit Rate (₹) *</label>
                  <input 
                    type="number" 
                    className={inp} 
                    placeholder="0" 
                    value={product.unitRate} 
                    onChange={e => updateProduct(index, 'unitRate', parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className={fld}>
                  <label className={lbl}>Total Value (₹)</label>
                  <input 
                    type="number" 
                    className={`${inp} bg-gray-100`} 
                    value={product.damagedQty * product.unitRate} 
                    readOnly 
                  />
                </div>
                {lossForm.products.length > 1 && (
                  <div className="col-span-3">
                    <button 
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold flex items-center gap-1"
                    >
                      <FiTrash2 /> Remove Product
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button 
              type="button"
              onClick={addProduct}
              className="text-green-600 hover:text-green-800 text-sm font-semibold flex items-center gap-1"
            >
              <FiPlus /> Add Another Product
            </button>
          </div>

          {/* Resolution & Actions */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-700 mb-3">Resolution & Actions</h4>
            <div className="space-y-4">
              <div className={fld}>
                <label className={lbl}>Resolution Notes</label>
                <textarea 
                  className={inp} 
                  rows={3} 
                  placeholder="Describe the resolution plan..." 
                  value={lossForm.resolutionNotes} 
                  onChange={e => setLossForm(prev => ({ ...prev, resolutionNotes: e.target.value }))} 
                />
              </div>
              <div className={fld}>
                <label className={lbl}>Corrective Action</label>
                <textarea 
                  className={inp} 
                  rows={2} 
                  placeholder="Immediate corrective actions taken..." 
                  value={lossForm.correctiveAction} 
                  onChange={e => setLossForm(prev => ({ ...prev, correctiveAction: e.target.value }))} 
                />
              </div>
              <div className={fld}>
                <label className={lbl}>Preventive Action</label>
                <textarea 
                  className={inp} 
                  rows={2} 
                  placeholder="Preventive measures to avoid future occurrences..." 
                  value={lossForm.preventiveAction} 
                  onChange={e => setLossForm(prev => ({ ...prev, preventiveAction: e.target.value }))} 
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* Professional Details Modal */}
      <Modal 
        open={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        title={`Loss Record Details - ${selectedRecord?.lossId}`}
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
              <h4 className="text-sm font-bold text-red-700 mb-3">Executive Summary</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-600">Total Loss Amount</div>
                  <div className="text-lg font-bold text-red-600">₹{(selectedRecord.lossAmount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Recoverable Amount</div>
                  <div className="text-lg font-bold text-green-600">₹{(selectedRecord.recoverableAmount || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Days Open</div>
                  <div className="text-lg font-bold text-blue-600">{selectedRecord.daysOpen} days</div>
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">Basic Information</h5>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Loss ID:</span> {selectedRecord.lossId}</div>
                    <div><span className="font-semibold">MR ID:</span> {selectedRecord.mrId}</div>
                    <div><span className="font-semibold">Supplier:</span> {selectedRecord.supplierName}</div>
                    <div><span className="font-semibold">Invoice:</span> {selectedRecord.invoiceNumber}</div>
                    <div><span className="font-semibold">Loss Type:</span> {selectedRecord.lossType}</div>
                    <div><span className="font-semibold">Root Cause:</span> {selectedRecord.rootCause}</div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">Responsibility</h5>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Department:</span> {selectedRecord.responsibleDepartment}</div>
                    <div><span className="font-semibold">Person:</span> {selectedRecord.responsiblePerson}</div>
                    <div><span className="font-semibold">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-bold text-white ${
                        selectedRecord.priority === 'Critical' ? 'bg-red-600' :
                        selectedRecord.priority === 'High' ? 'bg-red-500' :
                        selectedRecord.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {selectedRecord.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">Financial Status</h5>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Financial Status:</span> {selectedRecord.financialStatus}</div>
                    <div><span className="font-semibold">Material Status:</span> {selectedRecord.materialStatus}</div>
                    <div><span className="font-semibold">Reconciliation:</span> {selectedRecord.reconciliationStatus}</div>
                    {selectedRecord.debitNoteNumber && (
                      <div><span className="font-semibold">Debit Note:</span> {selectedRecord.debitNoteNumber}</div>
                    )}
                    {selectedRecord.creditNoteNumber && (
                      <div><span className="font-semibold">Credit Note:</span> {selectedRecord.creditNoteNumber}</div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h5 className="text-sm font-bold text-gray-700 mb-3">Actions</h5>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleRaiseDebitNote(selectedRecord._id)}
                      className="w-full bg-orange-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-orange-700"
                    >
                      Raise Debit Note
                    </button>
                    <button 
                      onClick={() => handleIssueCreditNote(selectedRecord._id)}
                      className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-green-700"
                    >
                      Issue Credit Note
                    </button>
                    <button 
                      onClick={() => handleEscalate(selectedRecord._id)}
                      className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-red-700"
                    >
                      Escalate Case
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            {selectedRecord.activityLog && selectedRecord.activityLog.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-bold text-gray-700 mb-3">Activity Log</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedRecord.activityLog.map((activity, index) => (
                    <div key={index} className="text-sm border-l-2 border-blue-500 pl-3">
                      <div className="font-semibold">{activity.action}</div>
                      <div className="text-gray-600">{activity.details}</div>
                      <div className="text-xs text-gray-500">
                        {activity.performedBy} • {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}