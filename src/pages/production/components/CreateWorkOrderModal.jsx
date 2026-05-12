import { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import { createWorkOrder } from '../../../api/productionApi';
import { getOEMOrders, getOEMOrderById } from '../../../api/oemOrderApi';
import { bomApi } from '../../../api/bomApi';
import { toast } from '../../../components/common/Toast';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const btnP = 'inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]';
const btnO = 'inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]';

export default function CreateWorkOrderModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    product: '',
    qty: '',
    shift: 'Morning',
    startDate: '',
    endDate: '',
    bom: '',
    priority: 'Normal',
    remarks: ''
  });
  const [woId, setWoId] = useState('');
  const [oemOrders, setOemOrders] = useState([]);
  const [selectedOEM, setSelectedOEM] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [bomList, setBomList] = useState([]);
  const [filteredBomList, setFilteredBomList] = useState([]);
  const [selectedBomDetails, setSelectedBomDetails] = useState(null);
  const [loadingBomDetails, setLoadingBomDetails] = useState(false);
  const [bomSearchTerm, setBomSearchTerm] = useState('');

  // Fetch OEM Orders and BOMs on modal open
  useEffect(() => {
    if (open) {
      fetchOEMOrders();
      fetchBOMs();
      setBomSearchTerm('');
    }
  }, [open]);

  // Filter BOMs based on search term
  useEffect(() => {
    if (!bomSearchTerm.trim()) {
      setFilteredBomList(bomList);
    } else {
      const term = bomSearchTerm.toLowerCase();
      const filtered = bomList.filter(bom => 
        (bom.bomId || '').toLowerCase().includes(term) ||
        (bom.product || '').toLowerCase().includes(term) ||
        (bom.productCode || '').toLowerCase().includes(term)
      );
      setFilteredBomList(filtered);
    }
  }, [bomSearchTerm, bomList]);

  const fetchBOMs = async () => {
    try {
      const response = await bomApi.getAll({ status: 'Active' });
      const boms = response.data || [];
      // Sort by product name for better UX
      const sorted = boms.sort((a, b) => (a.product || '').localeCompare(b.product || ''));
      setBomList(sorted);
      setFilteredBomList(sorted);
      console.log('BOMs fetched:', sorted.length, 'items');
    } catch (error) {
      console.error('Error fetching BOMs:', error);
      toast('Failed to load BOMs', 'error');
    }
  };

  const fetchOEMOrders = async () => {
    try {
      setLoading(true);
      const response = await getOEMOrders({ status: 'BOM-Loaded' });
      console.log('OEM Orders fetched:', response.data);
      setOemOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching OEM orders:', error);
      toast(error.message || 'Failed to fetch OEM orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = async (e) => {
    const selectedOEMId = e.target.value;
    
    if (!selectedOEMId) {
      setSelectedOEM(null);
      setForm(prev => ({ ...prev, product: '', qty: '', bom: '' }));
      setSelectedBomDetails(null);
      setWoId('');
      return;
    }

    try {
      setFetchingDetails(true);
      // Fetch full OEM order details
      const response = await getOEMOrderById(selectedOEMId);
      const matchingOEM = response.data;
      
      console.log('Full OEM Order data:', matchingOEM);
      
      setSelectedOEM(matchingOEM);
      const bomId = matchingOEM.bomId?._id || matchingOEM.bomId;
      setForm(prev => ({ 
        ...prev, 
        product: matchingOEM.product,
        qty: matchingOEM.quantity,
        bom: bomId || ''
      }));
      
      // If BOM is linked, fetch its details
      if (bomId) {
        try {
          setLoadingBomDetails(true);
          const bomResponse = await bomApi.getById(bomId);
          console.log('Auto-loaded BOM details:', bomResponse.data);
          setSelectedBomDetails(bomResponse.data);
        } catch (bomError) {
          console.error('Error fetching BOM details:', bomError);
          setSelectedBomDetails(null);
        } finally {
          setLoadingBomDetails(false);
        }
      }
      
      // Generate WO ID
      generateWOId();
    } catch (error) {
      console.error('Error fetching OEM order details:', error);
      toast('Failed to fetch OEM order details', 'error');
      setSelectedOEM(null);
      setForm(prev => ({ ...prev, product: '', qty: '', bom: '' }));
      setSelectedBomDetails(null);
      setWoId('');
    } finally {
      setFetchingDetails(false);
    }
  };

  const generateWOId = () => {
    const year = new Date().getFullYear();
    const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    setWoId(`WO-${year}-${randomNum}`);
  };

  const handleBomChange = async (e) => {
    const selectedBomId = e.target.value;
    
    setForm(prev => ({ ...prev, bom: selectedBomId }));
    
    if (!selectedBomId) {
      setSelectedBomDetails(null);
      return;
    }

    try {
      setLoadingBomDetails(true);
      const response = await bomApi.getById(selectedBomId);
      console.log('BOM Details loaded:', response.data);
      setSelectedBomDetails(response.data);
    } catch (error) {
      console.error('Error fetching BOM details:', error);
      toast('Failed to load BOM details', 'error');
      setSelectedBomDetails(null);
    } finally {
      setLoadingBomDetails(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.product || !form.qty || !form.startDate) {
      toast('Please fill all required fields: Product, Quantity, and Start Date', 'error');
      return;
    }

    if (!woId) {
      toast('Work Order ID not generated. Please try again.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        woId,
        product: form.product.trim(),
        qty: parseInt(form.qty),
        shift: form.shift || 'General',
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        bomId: form.bom || null,
        priority: form.priority || 'Normal',
        remarks: form.remarks || ''
      };

      console.log('Submitting Work Order payload:', payload);
      
      await createWorkOrder(payload);
      toast(`Work Order ${woId} created successfully`, 'success');
      
      // Reset form
      setForm({
        product: '',
        qty: '',
        shift: 'Morning',
        startDate: '',
        endDate: '',
        bom: '',
        priority: 'Normal',
        remarks: ''
      });
      setWoId('');
      setSelectedOEM(null);
      setSelectedBomDetails(null);
      
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error creating work order:', error);
      toast(error.message || 'Failed to create work order', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title="Create Work Order"
      footer={
        <>
          <button className={btnO} onClick={onClose}>Cancel</button>
          <button className={btnP} onClick={handleSubmit} disabled={saving || loading}>
            {saving ? 'Creating...' : 'Create Work Order'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Work Order ID - Auto Generated with Project ID */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Work Order ID</label>
          <input 
            className={inp} 
            placeholder="Auto-generated" 
            value={woId}
            disabled 
          />
        </div>

        {/* Product Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Product *</label>
          <select 
            className={inp} 
            value={selectedOEM?._id || ''} 
            onChange={handleProductChange}
            disabled={loading}
          >
            <option value="">Select Product</option>
            {oemOrders.map(oem => (
              <option key={oem._id} value={oem._id}>
                {oem.product}
              </option>
            ))}
          </select>
        </div>

        {/* Target Quantity */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Target Quantity *</label>
          <input 
            type="number" 
            className={inp} 
            placeholder="0" 
            value={form.qty} 
            onChange={e => setForm(p => ({ ...p, qty: e.target.value }))}
            min="1"
          />
        </div>

        {/* Shift */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Shift</label>
          <select 
            className={inp} 
            value={form.shift} 
            onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}
          >
            <option>Morning</option>
            <option>General</option>
            <option>Night</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Start Date *</label>
          <input 
            type="date" 
            className={inp} 
            value={form.startDate} 
            onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">End Date</label>
          <input 
            type="date" 
            className={inp} 
            value={form.endDate} 
            onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
          />
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-600">Priority</label>
          <select 
            className={inp} 
            value={form.priority} 
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
          >
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>

        {/* Link BOM */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-gray-600">Link BOM (Dynamic) — {filteredBomList.length} Available</label>
          
          {/* BOM Search Filter */}
          <input 
            type="text"
            className={inp}
            placeholder="Search BOM by ID, Product, or Code..."
            value={bomSearchTerm}
            onChange={e => setBomSearchTerm(e.target.value)}
          />
          
          {/* BOM Dropdown */}
          <select 
            className={inp} 
            value={form.bom} 
            onChange={handleBomChange}
            disabled={loadingBomDetails || filteredBomList.length === 0}
            size={Math.min(5, filteredBomList.length + 1)}
          >
            <option value="">— Select BOM (optional) —</option>
            {filteredBomList.map(bom => (
              <option key={bom._id} value={bom._id}>
                {bom.bomId} — {bom.product} {bom.productCode ? `(${bom.productCode})` : ''} v{bom.version}
              </option>
            ))}
          </select>
          
          {loadingBomDetails && <span className="text-xs text-blue-600 animate-pulse">⏳ Loading BOM details...</span>}
          {filteredBomList.length === 0 && bomSearchTerm && <span className="text-xs text-orange-600">No BOMs match your search</span>}
          {bomList.length === 0 && !bomSearchTerm && <span className="text-xs text-red-600">No active BOMs available</span>}
        </div>
      </div>

      {/* Remarks */}
      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-xs font-semibold text-gray-600">Remarks</label>
        <textarea 
          className={`${inp} resize-y min-h-[80px]`} 
          placeholder="Additional instructions..." 
          value={form.remarks} 
          onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
        />
      </div>

      {/* BOM Details Display */}
      {selectedBomDetails && (
        <div className="mt-6 pt-6 border-t-2 border-blue-300 bg-blue-50 rounded-lg p-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">
                📋 BOM: {selectedBomDetails.bomId} — {selectedBomDetails.product}
              </h3>
              <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded">
                v{selectedBomDetails.version}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
              <div className="bg-white p-2 rounded border border-blue-200">
                <span className="text-gray-600 block text-xs">Material Cost</span>
                <span className="font-bold text-blue-700">₹{(selectedBomDetails.materialCost || 0).toLocaleString()}</span>
              </div>
              <div className="bg-white p-2 rounded border border-green-200">
                <span className="text-gray-600 block text-xs">Total Cost</span>
                <span className="font-bold text-green-700">₹{(selectedBomDetails.totalCost || 0).toLocaleString()}</span>
              </div>
              <div className="bg-white p-2 rounded border border-purple-200">
                <span className="text-gray-600 block text-xs">Components</span>
                <span className="font-bold text-purple-700">{selectedBomDetails.components?.length || 0}</span>
              </div>
              <div className="bg-white p-2 rounded border border-orange-200">
                <span className="text-gray-600 block text-xs">Status</span>
                <span className={`font-bold ${selectedBomDetails.status === 'Active' ? 'text-green-700' : 'text-orange-700'}`}>
                  {selectedBomDetails.status}
                </span>
              </div>
            </div>
          </div>

          {selectedBomDetails.components && selectedBomDetails.components.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Item</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Code</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Unit</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Type</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Unit Cost</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBomDetails.components.map((comp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-800">{comp.itemName}</td>
                      <td className="px-3 py-2 text-gray-600 font-mono text-xs">{comp.itemCode || '—'}</td>
                      <td className="px-3 py-2 text-center font-semibold">{comp.qty}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{comp.unit}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          comp.type === 'Raw' ? 'bg-yellow-100 text-yellow-700' :
                          comp.type === 'Sub-Assembly' ? 'bg-blue-100 text-blue-700' :
                          comp.type === 'Packing' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {comp.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">₹{(comp.unitCost || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-bold text-green-700">₹{((comp.qty || 0) * (comp.unitCost || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              {loadingBomDetails ? 'Loading BOM components...' : 'No components found in this BOM'}
            </div>
          )}
        </div>
      )}

      {/* BOM Materials Display */}
      {selectedOEM && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-4">
            Materials Required for {form.product}
            {fetchingDetails && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
          </h3>
          
          {selectedOEM.requiredMaterials && selectedOEM.requiredMaterials.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Material Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">SKU</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Required Qty</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Unit</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Available</th>
                    <th className="px-3 py-2 text-center font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOEM.requiredMaterials.map((material, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-semibold text-gray-800">{material.materialName || 'N/A'}</td>
                      <td className="px-3 py-2 text-gray-600">{material.sku || '-'}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{material.requiredQty || 0}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{material.unit || '-'}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{material.availableQty || 0}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          material.status === 'Available' ? 'bg-green-100 text-green-700' :
                          material.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {material.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
              {fetchingDetails ? 'Loading materials...' : 'No materials found for this product'}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
