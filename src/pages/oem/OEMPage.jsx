import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { getBOMs } from '../../api/bomApi';
import { createWorkOrder, getWorkOrders } from '../../api/productionApi';

const brands = ['Tata Motors', 'Mahindra', 'Bajaj Auto'];

const brandColors = {
  'Tata Motors': '#c0392b',
  'Mahindra': '#8e44ad',
  'Bajaj Auto': '#27ae60',
};

const innerTabs = ['BOM', 'Production', 'Billing'];

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const btnP = 'inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]';
const btnO = 'inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]';

export default function OEMPage() {
  const [activeBrand, setActiveBrand] = useState('Tata Motors');
  const [innerTab, setInnerTab]       = useState('BOM');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showBOMModal, setShowBOMModal]     = useState(false);
  const [selectedBOM, setSelectedBOM]       = useState(null);
  const [showWOModal, setShowWOModal]       = useState(false);
  const [bomList, setBomList]               = useState([]);
  const [workOrders, setWorkOrders]         = useState([]);
  const [loading, setLoading]               = useState(false);
  const [woForm, setWoForm]                 = useState({
    product: '',
    targetQuantity: '',
    startDate: '',
    endDate: '',
    shift: 'General',
    priority: 'Normal',
    remarks: '',
    bomId: ''
  });
  const [woId, setWoId] = useState('');

  const color = brandColors[activeBrand];

  // Fetch BOMs and Work Orders on mount and brand change
  useEffect(() => {
    fetchBOMs();
    fetchWorkOrders();
  }, [activeBrand]);

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      const res = await getBOMs();
      const boms = res.data || [];
      setBomList(boms);
    } catch (error) {
      toast(`Error loading BOMs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      const res = await getWorkOrders();
      setWorkOrders(res.data || []);
    } catch (error) {
      console.error('Error loading work orders:', error);
    }
  };

  // Filter BOMs by brand (using projectId prefix)
  const getBOMsByBrand = () => {
    return bomList.filter(bom => {
      const bomBrand = bom.projectId?.split('-')[0] || '';
      const brandCode = activeBrand.split(' ')[0].substring(0, 2).toUpperCase();
      return bomBrand === brandCode;
    });
  };

  // Filter work orders by brand
  const getWOsByBrand = () => {
    return workOrders.filter(wo => {
      const woBrand = wo.workOrderId?.split('-')[1] || '';
      const brandCode = activeBrand.split(' ')[0].substring(0, 2).toUpperCase();
      return woBrand === brandCode;
    });
  };

  const filteredBOMs = getBOMsByBrand();
  const filteredWOs = getWOsByBrand();

  // Calculate KPIs
  const monthlyTarget = filteredWOs.reduce((sum, wo) => sum + (wo.targetQuantity || 0), 0) || 1;
  const achieved = filteredWOs.reduce((sum, wo) => sum + (wo.producedQuantity || 0), 0);
  const kpis = [
    { label: 'Monthly Target', value: monthlyTarget.toLocaleString() },
    { label: 'Achieved', value: achieved.toLocaleString() },
    { label: 'Achievement %', value: `${Math.round((achieved / monthlyTarget) * 100)}%` },
    { label: 'Billing Type', value: 'Per Unit' },
  ];

  const handleViewBOM = (bom) => {
    setSelectedBOM(bom);
    setShowBOMModal(true);
  };

  const handleProductChange = (e) => {
    const selectedBomId = e.target.value;
    const matchingBom = filteredBOMs.find(b => b._id === selectedBomId);
    
    if (matchingBom) {
      setWoForm(prev => ({ 
        ...prev, 
        product: matchingBom.product,
        bomId: matchingBom._id 
      }));
      
      // Generate WO ID: BRAND-WO-YEAR-RANDOM
      const year = new Date().getFullYear();
      const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const brandCode = activeBrand.split(' ')[0].substring(0, 2).toUpperCase();
      setWoId(`${brandCode}-WO-${year}-${randomNum}`);
    }
  };

  const handleCreateWorkOrder = async () => {
    if (!woForm.product || !woForm.targetQuantity || !woForm.startDate) {
      toast('Please fill all required fields');
      return;
    }

    try {
      const payload = {
        workOrderId: woId,
        bomId: woForm.bomId,
        product: woForm.product,
        targetQuantity: parseInt(woForm.targetQuantity),
        startDate: woForm.startDate,
        endDate: woForm.endDate,
        shift: woForm.shift,
        priority: woForm.priority,
        remarks: woForm.remarks,
        status: 'Pending'
      };

      await createWorkOrder(payload);
      toast('Work order created successfully');
      setShowWOModal(false);
      setWoForm({
        product: '',
        targetQuantity: '',
        startDate: '',
        endDate: '',
        shift: 'General',
        priority: 'Normal',
        remarks: '',
        bomId: ''
      });
      setWoId('');
      fetchWorkOrders();
    } catch (error) {
      toast(`Error creating work order: ${error.message}`);
    }
  };

  return (
    <div>
      {/* ── Action Bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={() => setShowBrandModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', border:'none',
          cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ Add OEM Brand</button>
        {innerTab === 'BOM' && (
          <button onClick={() => toast('BOM form coming soon')} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b',
            cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>+ New BOM</button>
        )}
        {innerTab === 'Production' && (
          <button onClick={() => setShowWOModal(true)} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b',
            cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>+ New Work Order</button>
        )}
        {innerTab === 'Billing' && (
          <button onClick={() => toast('Invoice generated')} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b',
            cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>Generate Invoice</button>
        )}
      </div>

      {/* ── Brand Tabs ── */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {brands.map(b => (
          <button key={b} onClick={() => setActiveBrand(b)}
            className="px-6 py-2.5 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all font-[inherit]"
            style={{
              borderColor: activeBrand === b ? brandColors[b] : '#e2e8f0',
              background:  activeBrand === b ? brandColors[b] : '#fff',
              color:       activeBrand === b ? '#fff' : '#1c2833',
            }}>
            {b}
          </button>
        ))}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: data.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Inner Tab Bar ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'#f8fafc', borderRadius:12, padding:4, width:'fit-content' }}>
        {innerTabs.map(t => (
          <button key={t} onClick={() => setInnerTab(t)}
            style={{
              padding:'7px 20px', borderRadius:9, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s',
              background: innerTab === t ? '#fff' : 'transparent',
              color:      innerTab === t ? color : '#64748b',
              boxShadow:  innerTab === t ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── BOM Tab ── */}
      {innerTab === 'BOM' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Bill of Materials — {activeBrand}</div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading BOMs...</div>
          ) : filteredBOMs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No BOMs found for {activeBrand}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Project ID', 'Product', 'Version', 'Type', 'Materials', 'Status', 'Actions'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBOMs.map((b, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                      <td className="px-4 py-3 align-middle font-semibold text-red-700">{b.projectId}</td>
                      <td className="px-4 py-3 align-middle font-semibold text-gray-800">{b.product}</td>
                      <td className="px-4 py-3 align-middle text-gray-800">{b.version}</td>
                      <td className="px-4 py-3 align-middle text-gray-800">{b.type}</td>
                      <td className="px-4 py-3 align-middle text-gray-800">{b.materials?.length || 0}</td>
                      <td className="px-4 py-3 align-middle"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          onClick={() => handleViewBOM(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Production Tab ── */}
      {innerTab === 'Production' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Production — {activeBrand}</div>
          {filteredWOs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No work orders for {activeBrand}</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>
                    {['WO ID', 'Product', 'Target', 'Produced', 'Progress', 'Status'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredWOs.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                      <td className="px-4 py-3 align-middle font-semibold text-red-700">{p.workOrderId}</td>
                      <td className="px-4 py-3 align-middle font-semibold text-gray-800">{p.product}</td>
                      <td className="px-4 py-3 align-middle text-gray-800">{p.targetQuantity}</td>
                      <td className="px-4 py-3 align-middle font-bold text-gray-800">{p.producedQuantity || 0}</td>
                      <td className="px-4 py-3 align-middle min-w-[140px]">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width:`${((p.producedQuantity || 0)/(p.targetQuantity || 1))*100}%`, background: color }} />
                        </div>
                        <span className="text-[11px] text-gray-500">{Math.round(((p.producedQuantity || 0)/(p.targetQuantity || 1))*100)}%</span>
                      </td>
                      <td className="px-4 py-3 align-middle"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Billing Tab ── */}
      {innerTab === 'Billing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Monthly Production Trend</div>
            <BarChart data={[
              { label: 'Jan', value: 620 },
              { label: 'Feb', value: 680 },
              { label: 'Mar', value: 710 },
              { label: 'Apr', value: achieved }
            ]} color={color} height={160} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Billing Configuration</div>
            {[['Billing Type', 'Per Unit'], ['Rate per Unit', '₹1,200'], ['GST Rate', '18%'], ['Payment Terms', 'Net 30']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-gray-200 text-sm last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
            <button onClick={() => toast('Invoice generated')}
              className="inline-flex items-center justify-center gap-1.5 w-full mt-4 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
              Generate Invoice
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          BOM Details Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        open={showBOMModal}
        onClose={() => setShowBOMModal(false)}
        title={selectedBOM ? `BOM — ${selectedBOM.product}` : 'BOM Details'}
        footer={
          <button className={btnO} onClick={() => setShowBOMModal(false)}>Close</button>
        }
      >
        {selectedBOM && (
          <div>
            {/* Header info */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[['Project ID', selectedBOM.projectId], ['Version', selectedBOM.version], ['Status', selectedBOM.status]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-sm font-bold text-gray-800">{v}</div>
                </div>
              ))}
            </div>

            {/* Materials Table */}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Materials</div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Material', 'SKU', 'Qty', 'Unit', 'Cost Price', 'Total Cost'].map(h => (
                      <th key={h} className="bg-gray-100 px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selectedBOM.materials || []).map((mat, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2.5 align-middle text-xs font-semibold text-gray-800">{mat.materialName}</td>
                      <td className="px-4 py-2.5 align-middle text-xs text-gray-600">{mat.sku}</td>
                      <td className="px-4 py-2.5 align-middle text-xs font-bold text-gray-700">{mat.quantity}</td>
                      <td className="px-4 py-2.5 align-middle text-xs text-gray-500">{mat.unit}</td>
                      <td className="px-4 py-2.5 align-middle text-xs text-gray-600">₹{mat.costPrice?.toFixed(2) || '0.00'}</td>
                      <td className="px-4 py-2.5 align-middle text-xs font-bold text-gray-800">₹{mat.totalCost?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Cost */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Total Material Cost</span>
                <span className="text-lg font-bold text-blue-700">₹{selectedBOM.totalMaterialCost?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════
          Add OEM Brand Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        open={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title="Add OEM Brand"
        footer={
          <>
            <button className={btnO} onClick={() => setShowBrandModal(false)}>Cancel</button>
            <button className={btnP} onClick={() => { setShowBrandModal(false); toast('OEM brand added'); }}>Add Brand</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Brand Name *</label><input className={inp} placeholder="e.g. Maruti Suzuki" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Brand Code *</label><input className={inp} placeholder="e.g. MS" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Billing Type *</label>
            <select className={inp}><option>Per Unit</option><option>Lump Sum</option><option>Monthly Contract</option></select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Rate per Unit (₹)</label><input type="number" className={inp} placeholder="0.00" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Monthly Target</label><input type="number" className={inp} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">GST Rate</label>
            <select className={inp}><option>18%</option><option>12%</option><option>5%</option></select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Contact Person</label><input className={inp} placeholder="Name" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Contact Email</label><input type="email" className={inp} placeholder="email@brand.com" /></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-gray-600">Contract Notes</label>
          <textarea className={inp} rows={3} placeholder="Any special terms or notes..." />
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          New Work Order Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        open={showWOModal}
        onClose={() => setShowWOModal(false)}
        title={`New Work Order — ${activeBrand}`}
        footer={
          <>
            <button className={btnO} onClick={() => setShowWOModal(false)}>Cancel</button>
            <button className={btnP} onClick={() => { setShowWOModal(false); toast('Work order created'); }}>Create Work Order</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product *</label>
            <select className={inp}>{data.bom.map(b => <option key={b.id}>{b.product}</option>)}</select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Target Quantity *</label><input type="number" className={inp} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Start Date *</label><input type="date" className={inp} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">End Date</label><input type="date" className={inp} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Shift</label>
            <select className={inp}><option>Morning</option><option>General</option><option>Night</option></select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Priority</label>
            <select className={inp}><option>Normal</option><option>High</option><option>Urgent</option></select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-gray-600">Remarks</label>
          <textarea className={inp} rows={2} placeholder="Additional instructions..." />
        </div>
      </Modal>
    </div>
  );
}
