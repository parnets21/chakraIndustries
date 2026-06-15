import { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { bomApi, workOrderApi, mrpApi } from '../../api/bomApi';
import { itemMasterApi } from '../../api/itemMasterApi';

const STATUS_COLOR = {
  Active: '#16a34a', Draft: '#d97706', Obsolete: '#94a3b8',
  'Pending Approval': '#2563eb', Approved: '#16a34a', Rejected: '#ef4444',
  Pending: '#d97706', Released: '#2563eb', 'In-Progress': '#7c3aed',
  WIP: '#0891b2', 'QC Pending': '#f59e0b', Completed: '#16a34a', Cancelled: '#94a3b8',
};

// ── Dropdown option lists ─────────────────────────────────────────────────────
const BOM_TYPES       = ['Finished Good', 'Semi-Finished', 'Sub-Assembly', 'Phantom'];
const UOM_OPTIONS     = ['Set', 'Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Pcs'];
const UNIT_OPTIONS    = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Pcs', 'Set', 'Gm', 'Ml'];
const COMP_TYPES      = ['Raw', 'Semi-Finished', 'Consumable', 'Packaging'];
const SHIFT_OPTIONS   = ['General', 'Morning', 'Evening', 'Night'];
const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];

const EMPTY_BOM  = { productItemMasterId: '', product: '', productCode: '', version: 'v1.0', type: BOM_TYPES[0], uom: UOM_OPTIONS[0], description: '', overheadPct: 0, labourCost: 0 };
const EMPTY_COMP = { itemMasterId: '', itemName: '', itemCode: '', description: '', qty: '', unit: UNIT_OPTIONS[0], type: COMP_TYPES[0], level: 1, unitCost: '', scrapFactor: 0, remarks: '', isOptional: false };
const EMPTY_ALT  = { itemName: '', itemCode: '', unitCost: '', leadTimeDays: '', priority: 0, notes: '' };
const EMPTY_WO   = { productItemMasterId: '', product: '', bomId: '', qty: '', shift: SHIFT_OPTIONS[0], priority: PRIORITY_OPTIONS[1], startDate: '', endDate: '', productionLine: '', machine: '', assignedTeam: '', supervisor: '', remarks: '' };
const EMPTY_QC   = { passedQty: '', reworkQty: '', rejectedQty: '', defectType: '', inspectedBy: '', remarks: '' };

function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
      <div style={{ width:32, height:32, border:'3px solid #f1f5f9', borderTop:'3px solid #c0392b', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Empty({ msg = 'No data yet' }) {
  return <div style={{ padding:'36px 20px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>{msg}</div>;
}
function Badge({ label, color = '#64748b' }) {
  return <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, background:color+'18', color }}>{label}</span>;
}
function Th({ children }) {
  return <th style={{ padding:'9px 12px', textAlign:'left', fontSize:10.5, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap', background:'#f8fafc' }}>{children}</th>;
}
function Td({ children, style = {} }) {
  return <td style={{ padding:'9px 12px', fontSize:12.5, color:'#1e293b', borderBottom:'1px solid #f1f5f9', ...style }}>{children}</td>;
}

function WIPCard({ wo, onSaveConsumption }) {
  const [rows, setRows] = useState(
    () => (wo.materialConsumption || []).map(m => ({ consumptionId: m._id, consumedQty: String(m.consumedQty || ''), batchNo: m.batchNo || '' }))
  );
  useEffect(() => {
    setRows((wo.materialConsumption || []).map(m => ({ consumptionId: m._id, consumedQty: String(m.consumedQty || ''), batchNo: m.batchNo || '' })));
  }, [wo._id]); // eslint-disable-line
  const pct = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
  return (
    <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', padding:20, marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15 }}>{wo.product}</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>{wo.woId} · {wo.shift} Shift · {wo.priority}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <Badge label={wo.status} color={STATUS_COLOR[wo.status] || '#64748b'} />
          {wo.inventoryDeducted && <Badge label="Inv Deducted" color="#16a34a" />}
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
        <span>Progress: <strong>{wo.produced}/{wo.qty}</strong></span>
        <span style={{ fontWeight:700, color:'#c0392b' }}>{pct}%</span>
      </div>
      <div style={{ height:8, background:'#f1f5f9', borderRadius:4, overflow:'hidden', marginBottom:12 }}>
        <div style={{ height:'100%', borderRadius:4, width:`${pct}%`, background:'#c0392b' }} />
      </div>
      {wo.materialConsumption?.length > 0 && (
        <div style={{ overflowX:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Material Consumption</span>
            <button onClick={() => onSaveConsumption(wo, rows)} style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid #16a34a', color:'#16a34a', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Save</button>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{['Item','Planned','Consumed','Batch','Unit','Cost'].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {wo.materialConsumption.map((m, i) => {
                const r = rows[i] || { consumedQty:'', batchNo:'' };
                return (
                  <tr key={m._id} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                    <Td style={{ fontWeight:600 }}>{m.itemName}</Td>
                    <Td style={{ fontWeight:700 }}>{m.plannedQty} {m.unit}</Td>
                    <Td><input type="number" min={0} step="0.01" value={r.consumedQty} onChange={e => setRows(p => p.map((x,j) => j===i?{...x,consumedQty:e.target.value}:x))} style={{ width:70, padding:'2px 6px', border:'1px solid #e2e8f0', borderRadius:4, fontSize:12, fontFamily:'inherit' }} /></Td>
                    <Td><input type="text" value={r.batchNo} placeholder="Batch#" onChange={e => setRows(p => p.map((x,j) => j===i?{...x,batchNo:e.target.value}:x))} style={{ width:80, padding:'2px 6px', border:'1px solid #e2e8f0', borderRadius:4, fontSize:12, fontFamily:'inherit' }} /></Td>
                    <Td style={{ color:'#64748b' }}>{m.unit}</Td>
                    <Td style={{ fontWeight:700 }}>₹{Math.round((parseFloat(r.consumedQty)||m.consumedQty||0)*(m.unitCost||0)).toLocaleString()}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WastageRow({ wo, m, onSave }) {
  const [qty, setQty] = useState(String(m.wastedQty || ''));
  const [reason, setReason] = useState(m.wastageReason || '');
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, flexWrap:'wrap' }}>
      <span style={{ fontSize:11, color:'#64748b', minWidth:110 }}>{m.itemName}</span>
      <input type="number" min={0} step="0.01" value={qty} placeholder="Wasted qty" onChange={e => setQty(e.target.value)} style={{ width:70, padding:'2px 6px', border:'1px solid #e2e8f0', borderRadius:4, fontSize:11, fontFamily:'inherit' }} />
      <input type="text" value={reason} placeholder="Reason" onChange={e => setReason(e.target.value)} style={{ width:100, padding:'2px 6px', border:'1px solid #e2e8f0', borderRadius:4, fontSize:11, fontFamily:'inherit' }} />
      <button onClick={() => onSave(wo, m._id, qty, reason)} style={{ padding:'2px 8px', borderRadius:5, fontSize:10, fontWeight:600, border:'1px solid #ef4444', color:'#ef4444', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Save</button>
      {(m.wastedQty||0) > 0 && <span style={{ fontSize:10, color:'#ef4444', fontWeight:700 }}>Wasted: {m.wastedQty} {m.unit}</span>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProductionPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const [bomList, setBomList]         = useState([]);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [bomLoading, setBomLoading]   = useState(false);
  const [woList, setWoList]           = useState([]);
  const [woLoading, setWoLoading]     = useState(false);
  const [mrpRuns, setMrpRuns]         = useState([]);
  const [selectedMRP, setSelectedMRP] = useState(null);
  const [mrpLoading, setMrpLoading]   = useState(false);

  // Item Master
  const [itemMasterItems, setItemMasterItems] = useState([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [isItemSearching, setIsItemSearching] = useState(false);

  const [showBOMModal, setShowBOMModal]           = useState(false);
  const [showCompModal, setShowCompModal]         = useState(false);
  const [showAltModal, setShowAltModal]           = useState(null);
  const [showWOModal, setShowWOModal]             = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(null);
  const [showQCModal, setShowQCModal]             = useState(null);
  const [showApproveModal, setShowApproveModal]   = useState(null);
  const [showMRPModal, setShowMRPModal]           = useState(false);
  const [showExplodeModal, setShowExplodeModal]   = useState(null);
  const [explodeData, setExplodeData]             = useState([]);
  const [showConsumptionModal, setShowConsumptionModal] = useState(null);

  const [bomForm, setBomForm]         = useState(EMPTY_BOM);
  const [compForm, setCompForm]       = useState(EMPTY_COMP);
  const [altForm, setAltForm]         = useState(EMPTY_ALT);
  const [woForm, setWoForm]           = useState(EMPTY_WO);
  const [progressVal, setProgressVal] = useState('');
  const [qcForm, setQcForm]           = useState(EMPTY_QC);
  const [approveForm, setApproveForm] = useState({ action:'approve', approver:'', remarks:'' });
  const [mrpForm, setMrpForm]         = useState({ description:'', runBy:'', selectedWOs:[] });
  const [mrpPRForm, setMrpPRForm]     = useState({ department:'Production', requestedBy:'MRP System', selectedLines:[] });

  const loadBOMs = useCallback(async () => {
    setBomLoading(true);
    try {
      const res = await bomApi.getAll();
      const list = res.data || [];
      setBomList(list);
      setSelectedBOM(prev => {
        if (!prev && list.length > 0) return list[0];
        if (prev) return list.find(b => b._id === prev._id) || list[0] || null;
        return null;
      });
      return list;
    } catch (e) { toast(e.message || 'Failed to load BOMs', 'error'); return []; }
    finally { setBomLoading(false); }
  }, []); // eslint-disable-line

  const loadWOs = useCallback(async () => {
    setWoLoading(true);
    try { const r = await workOrderApi.getAll(); setWoList(r.data || []); }
    catch (e) { toast(e.message || 'Failed to load work orders', 'error'); }
    finally { setWoLoading(false); }
  }, []);

  const loadMRP = useCallback(async () => {
    setMrpLoading(true);
    try { const r = await mrpApi.getAll(); setMrpRuns(r.data || []); }
    catch (e) { toast(e.message || 'Failed to load MRP runs', 'error'); }
    finally { setMrpLoading(false); }
  }, []);

  const loadItemMaster = useCallback(async () => {
    try { 
      const r = await itemMasterApi.getDropdown(); 
      setItemMasterItems(r.data || []); 
    }
    catch (e) { toast(e.message || 'Failed to load items', 'error'); }
  }, []);

  const searchItemMaster = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setItemSearchResults([]);
      return;
    }
    setIsItemSearching(true);
    try { 
      const r = await itemMasterApi.search(query); 
      setItemSearchResults(r.data || []); 
    }
    catch (e) { 
      toast(e.message || 'Failed to search items', 'error');
      setItemSearchResults([]); 
    }
    finally { setIsItemSearching(false); }
  }, []);

  useEffect(() => { loadBOMs(); loadWOs(); loadMRP(); loadItemMaster(); }, [loadBOMs, loadWOs, loadMRP, loadItemMaster]);

  const handleCreateBOM = async () => {
    if (!bomForm.product.trim()) { toast('Product name is required', 'error'); return; }
    try {
      const res = await bomApi.create(bomForm);
      const newBOM = res.data;
      toast('BOM created');
      setBomForm(EMPTY_BOM);
      setShowBOMModal(false);
      const list = await loadBOMs();
      setSelectedBOM(list.find(b => b._id === newBOM._id) || newBOM);
    } catch (e) { toast(e.message || 'Failed to create BOM', 'error'); }
  };

  const handleDeleteBOM = async (bom) => {
    if (!window.confirm(`Delete BOM "${bom.product}"?`)) return;
    try {
      await bomApi.delete(bom._id);
      toast('BOM deleted');
      if (selectedBOM?._id === bom._id) setSelectedBOM(null);
      loadBOMs();
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleSubmitApproval = async (bom) => {
    try {
      const res = await bomApi.submit(bom._id, { approver: 'Production Manager' });
      const u = res.data;
      setBomList(prev => prev.map(b => b._id === u._id ? u : b));
      if (selectedBOM?._id === u._id) setSelectedBOM(u);
      toast('BOM submitted for approval');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleApprove = async () => {
    if (!showApproveModal) return;
    try {
      const res = await bomApi.approve(showApproveModal._id, approveForm);
      const u = res.data;
      setBomList(prev => prev.map(b => b._id === u._id ? u : b));
      if (selectedBOM?._id === u._id) setSelectedBOM(u);
      toast(`BOM ${approveForm.action}d`);
      setShowApproveModal(null);
      setApproveForm({ action:'approve', approver:'', remarks:'' });
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleExplode = async (bom) => {
    try {
      const res = await bomApi.explode(bom._id, 1);
      setExplodeData(res.data || []);
      setShowExplodeModal(bom);
    } catch (e) { toast(e.message || 'Failed to explode BOM', 'error'); }
  };

  const handleAddComponent = async () => {
    if (!compForm.itemMasterId) { toast('Select an item from Item Master', 'error'); return; }
    if (!compForm.qty || parseFloat(compForm.qty) <= 0) { toast('Quantity must be > 0', 'error'); return; }
    if (!selectedBOM) { toast('Select a BOM first', 'error'); return; }
    try {
      const res = await bomApi.addComponent(selectedBOM._id, { 
        itemMasterId: compForm.itemMasterId, 
        itemName: compForm.itemName,
        itemCode: compForm.itemCode,
        unit: compForm.unit,
        qty: parseFloat(compForm.qty), 
        scrapFactor: parseFloat(compForm.scrapFactor) || 0,
        type: compForm.type,
        isOptional: compForm.isOptional
      });
      toast('Component added');
      setCompForm(EMPTY_COMP);
      setShowCompModal(false);
      setItemSearchTerm('');
      setItemSearchResults([]);
      setSelectedBOM(res.data);
      setBomList(prev => prev.map(b => b._id === res.data._id ? res.data : b));
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleDeleteComponent = async (bomId, componentId, itemName) => {
    if (!window.confirm(`Remove "${itemName}"?`)) return;
    try {
      const res = await bomApi.deleteComponent(bomId, componentId);
      toast('Component removed');
      setSelectedBOM(res.data);
      setBomList(prev => prev.map(b => b._id === res.data._id ? res.data : b));
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleAddAlternate = async () => {
    if (!altForm.itemName.trim()) { toast('Alternate item name is required', 'error'); return; }
    if (!selectedBOM || !showAltModal) return;
    try {
      const res = await bomApi.addAlternate(selectedBOM._id, showAltModal, { ...altForm, unitCost: parseFloat(altForm.unitCost) || 0, leadTimeDays: parseInt(altForm.leadTimeDays) || 0 });
      const u = res.data;
      setSelectedBOM(u);
      setBomList(prev => prev.map(b => b._id === u._id ? u : b));
      toast('Alternate added');
      setAltForm(EMPTY_ALT);
      setShowAltModal(null);
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleCreateWO = async () => {
    if (!woForm.product.trim()) { toast('Product is required', 'error'); return; }
    if (!woForm.qty || parseInt(woForm.qty) < 1) { toast('Quantity must be at least 1', 'error'); return; }
    if (!woForm.startDate) { toast('Start date is required', 'error'); return; }
    try {
      const res = await workOrderApi.create({ ...woForm, qty: parseInt(woForm.qty), bomId: woForm.bomId || undefined });
      setWoList(prev => [res.data, ...prev]);
      toast('Work order created');
      setWoForm(EMPTY_WO);
      setShowWOModal(false);
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleReleaseWO = async (wo) => {
    if (!window.confirm(`Release WO ${wo.woId}? This will deduct raw materials from inventory.`)) return;
    try {
      const res = await workOrderApi.release(wo._id);
      setWoList(prev => prev.map(w => w._id === res.data._id ? res.data : w));
      toast('WO released — materials deducted from inventory');
      if (res.warnings?.length) res.warnings.forEach(w => toast(w, 'warning'));
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleUpdateProgress = async () => {
    if (!showProgressModal) return;
    const val = parseInt(progressVal);
    if (isNaN(val) || val < 0) { toast('Enter a valid quantity', 'error'); return; }
    try {
      const res = await workOrderApi.updateProgress(showProgressModal._id, val);
      setWoList(prev => prev.map(w => w._id === res.data._id ? res.data : w));
      toast('Progress updated');
      setShowProgressModal(null);
      setProgressVal('');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleDeleteWO = async (wo) => {
    if (!window.confirm(`Delete WO ${wo.woId}?`)) return;
    try {
      await workOrderApi.delete(wo._id);
      setWoList(prev => prev.filter(w => w._id !== wo._id));
      toast('Work order deleted');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleRecordQC = async () => {
    if (!showQCModal) return;
    try {
      const res = await workOrderApi.recordQC(showQCModal._id, { 
        ...qcForm, 
        passedQty: parseInt(qcForm.passedQty) || 0, 
        reworkQty: parseInt(qcForm.reworkQty) || 0,
        rejectedQty: parseInt(qcForm.rejectedQty) || 0 
      });
      setWoList(prev => prev.map(w => w._id === res.data._id ? res.data : w));
      toast('QC recorded — finished goods posted to inventory');
      setShowQCModal(null);
      setQcForm(EMPTY_QC);
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleSaveConsumption = async (wo, consumptions) => {
    try {
      const res = await workOrderApi.recordConsumption(wo._id, { consumptions });
      setWoList(prev => prev.map(w => w._id === res.data._id ? res.data : w));
      toast('Consumption saved');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleSaveWastage = async (wo, consumptionId, wastedQty, wastageReason) => {
    if (!wastedQty || parseFloat(wastedQty) <= 0) { toast('Enter a valid wastage quantity', 'error'); return; }
    try {
      const res = await workOrderApi.recordWastage(wo._id, { consumptionId, wastedQty: parseFloat(wastedQty), wastageReason });
      setWoList(prev => prev.map(w => w._id === res.data._id ? res.data : w));
      toast('Wastage recorded');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleRunMRP = async () => {
    if (mrpForm.selectedWOs.length === 0) { toast('Select at least one Work Order', 'error'); return; }
    try {
      const res = await mrpApi.run({ workOrderIds: mrpForm.selectedWOs, description: mrpForm.description, runBy: mrpForm.runBy });
      setMrpRuns(prev => [res.data, ...prev]);
      setSelectedMRP(res.data);
      toast(`MRP done — ${res.data.itemsWithShortage} shortage(s) found`);
      setShowMRPModal(false);
      setMrpForm({ description:'', runBy:'', selectedWOs:[] });
    } catch (e) { toast(e.message || 'MRP failed', 'error'); }
  };

  const handleCreatePRs = async () => {
    if (!selectedMRP || mrpPRForm.selectedLines.length === 0) { toast('Select lines to create PRs', 'error'); return; }
    try {
      const res = await mrpApi.createPRs(selectedMRP._id, { lineIds: mrpPRForm.selectedLines, department: mrpPRForm.department, requestedBy: mrpPRForm.requestedBy });
      const updated = res.data?.mrpRun || res.data;
      if (updated?._id) { setSelectedMRP(updated); setMrpRuns(prev => prev.map(m => m._id === updated._id ? updated : m)); }
      toast(res.message || 'Purchase Requisition created');
      setMrpPRForm({ department:'Production', requestedBy:'MRP System', selectedLines:[] });
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const primaryBtn = { display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' };
  const outlineBtn = { display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' };
  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';

  const PROD_TABS = ['BOM', 'Work Orders', 'MRP / Material Plan', 'QC & Finished Goods', 'Wastage'];

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display:'flex', gap:4, marginBottom:20, borderBottom:'2px solid #f1f5f9', flexWrap:'wrap' }}>
        {PROD_TABS.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding:'8px 18px', fontSize:13, fontWeight:600, fontFamily:'inherit',
            border:'none', background:'none', cursor:'pointer', borderRadius:'8px 8px 0 0',
            color: activeTab === i ? '#c0392b' : '#64748b',
            borderBottom: activeTab === i ? '2px solid #c0392b' : '2px solid transparent',
            marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {activeTab === 0 && (
          <>
            <button onClick={() => setShowBOMModal(true)} style={primaryBtn}>+ New BOM</button>
            {selectedBOM && <button onClick={() => setShowCompModal(true)} style={outlineBtn}>+ Add Component</button>}
          </>
        )}
        {activeTab === 1 && <button onClick={() => setShowWOModal(true)} style={primaryBtn}>+ New Work Order</button>}
        {activeTab === 2 && <button onClick={() => setShowMRPModal(true)} style={primaryBtn}>Run MRP</button>}
      </div>

      {/* ── TAB 0: BOM ── */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM List</div>
            {bomLoading ? <Spinner /> : bomList.length === 0 ? <Empty msg="No BOMs yet. Click + New BOM to create one." /> : bomList.map(b => {
              const sc = STATUS_COLOR[b.approvalStatus] || STATUS_COLOR[b.status] || '#64748b';
              const isSel = selectedBOM?._id === b._id;
              return (
                <div key={b._id} className="p-3 rounded-lg mb-2 transition-all"
                  style={{ border:`2px solid ${isSel?'#c0392b':'#e2e8f0'}`, background:isSel?'#fdf5f5':'#fff', cursor:'pointer', userSelect:'none' }}
                  onMouseDown={() => setSelectedBOM(b)}>
                  <div className="flex justify-between items-start" style={{ pointerEvents:'none' }}>
                    <div>
                      <div className="font-bold text-sm">{b.product}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{b.bomId} · {b.version} · {b.componentCount ?? 0} components</div>
                      <div className="text-[11px] text-red-600 font-semibold mt-0.5">₹{(b.totalCost||0).toLocaleString()} total cost</div>
                    </div>
                    <Badge label={b.approvalStatus || b.status} color={sc} />
                  </div>
                  <div className="flex gap-1 mt-2" style={{ pointerEvents:'auto' }}>
                    {b.approvalStatus === 'Draft' && (b.componentCount||0) > 0 && (
                      <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();handleSubmitApproval(b);}} style={{ padding:'2px 7px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #2563eb', color:'#2563eb', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Submit</button>
                    )}
                    {b.approvalStatus === 'Pending Approval' && (
                      <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setShowApproveModal(b);}} style={{ padding:'2px 7px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #16a34a', color:'#16a34a', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Review</button>
                    )}
                    <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();handleExplode(b);}} style={{ padding:'2px 7px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #7c3aed', color:'#7c3aed', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Explode</button>
                    <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();handleDeleteBOM(b);}} style={{ padding:'2px 7px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #fecaca', color:'#ef4444', background:'#fef2f2', cursor:'pointer', fontFamily:'inherit' }}>Del</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Components {selectedBOM ? `— ${selectedBOM.product}` : ''}</div>
            {!selectedBOM ? (
              <Empty msg="Select a BOM from the left to view its components" />
            ) : (selectedBOM.components?.length || 0) === 0 ? (
              <div style={{ padding:'20px', background:'#f0f9ff', borderRadius:10, border:'1px solid #bfdbfe', fontSize:12, color:'#1e40af' }}>
                BOM is empty. Click <strong>+ Add Component</strong> to add raw materials.
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr>{['#','Item','Code','Required Qty','Scrap %','Total Req Qty','Unit','Type','Unit Cost','Total',''].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                  <tbody>
                    {selectedBOM.components.map((c,i) => {
                      const scrapQty = c.qty * ((c.scrapFactor || 0) / 100);
                      const totalQty = c.qty + scrapQty;
                      const totalCost = totalQty * (c.unitCost || 0);
                      return (
                        <tr key={c._id} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                          <Td style={{ color:'#94a3b8', fontWeight:600 }}>{i+1}</Td>
                          <Td style={{ fontWeight:700 }}>{c.itemName}{c.isOptional&&<span style={{ fontSize:10, color:'#94a3b8', marginLeft:4 }}>(opt)</span>}</Td>
                          <Td style={{ fontFamily:'monospace', fontSize:11.5, color:'#64748b' }}>{c.itemCode||'—'}</Td>
                          <Td style={{ fontWeight:700, color:'#c0392b' }}>{c.qty}</Td>
                          <Td style={{ color:'#64748b' }}>{c.scrapFactor || 0}%</Td>
                          <Td style={{ fontWeight:700, color:'#7c3aed' }}>{Math.round(totalQty * 1000) / 1000}</Td>
                          <Td style={{ color:'#64748b' }}>{c.unit}</Td>
                          <Td><Badge label={c.type} color="#64748b" /></Td>
                          <Td style={{ color:'#64748b' }}>₹{(c.unitCost||0).toLocaleString()}</Td>
                          <Td style={{ fontWeight:700 }}>₹{Math.round(totalCost).toLocaleString()}</Td>
                          <Td>
                            <button onClick={()=>handleDeleteComponent(selectedBOM._id,c._id,c.itemName)} style={{ padding:'2px 7px', borderRadius:5, fontSize:10, fontWeight:600, border:'1px solid #fecaca', color:'#ef4444', background:'#fef2f2', cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'#f8fafc', borderTop:'2px solid #e2e8f0' }}>
                      <td colSpan={9} style={{ padding:'9px 12px', fontWeight:700, fontSize:12, textAlign:'right', color:'#1e293b' }}>Total Material Cost:</td>
                      <td style={{ padding:'9px 12px', fontWeight:800, fontSize:13, color:'#c0392b' }}>₹{(selectedBOM.materialCost||0).toLocaleString()}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 1: Work Orders ── */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {woLoading ? <Spinner /> : woList.length === 0 ? <Empty msg="No work orders yet. Click + New Work Order to create one." /> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead><tr>{['WO ID','Product','BOM','Qty','Produced','Rejected','Progress','Status','Actions'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {woList.map((wo,i) => {
                    const pct = wo.qty>0?Math.round((wo.produced/wo.qty)*100):0;
                    const pc = pct>=100?'#16a34a':pct>=50?'#d97706':'#ef4444';
                    return (
                      <tr key={wo._id} style={{ borderBottom:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafafa' }}>
                        <Td style={{ fontWeight:700, color:'#c0392b', fontFamily:'monospace' }}>{wo.woId}</Td>
                        <Td style={{ fontWeight:600 }}>{wo.product}</Td>
                        <Td style={{ fontSize:11.5, color:'#64748b' }}>{wo.bomId?.bomId||'—'}</Td>
                        <Td style={{ fontWeight:700 }}>{wo.qty}</Td>
                        <Td style={{ fontWeight:700, color:wo.produced>=wo.qty?'#16a34a':'#1e293b' }}>{wo.produced}</Td>
                        <Td style={{ color:wo.rejected>0?'#ef4444':'#94a3b8' }}>{wo.rejected||0}</Td>
                        <Td style={{ minWidth:100 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, background:pc, borderRadius:3 }} />
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:pc, minWidth:30 }}>{pct}%</span>
                          </div>
                        </Td>
                        <Td><Badge label={wo.status} color={(STATUS_COLOR[wo.status] || '#64748b')} /></Td>
                        <Td>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                            {wo.status==='Pending' && wo.bomId && (
                              <button onClick={()=>handleReleaseWO(wo)} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #2563eb', color:'#2563eb', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Release</button>
                            )}
                            {['Released','In-Progress','WIP'].includes(wo.status) && (
                              <button onClick={()=>{setShowProgressModal(wo);setProgressVal(String(wo.produced));}} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #c0392b', color:'#c0392b', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Progress</button>
                            )}
                            {wo.status==='QC Pending' && (
                              <button onClick={()=>{setShowQCModal(wo);setQcForm({...EMPTY_QC,passedQty:String(wo.produced)});}} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #f59e0b', color:'#d97706', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>QC</button>
                            )}
                            {wo.materialConsumption?.length>0 && (
                              <button onClick={()=>setShowConsumptionModal(wo)} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #0891b2', color:'#0891b2', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Materials</button>
                            )}
                            <button onClick={()=>handleDeleteWO(wo)} style={{ padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:600, border:'1px solid #fecaca', color:'#ef4444', background:'#fef2f2', cursor:'pointer', fontFamily:'inherit' }}>Del</button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: MRP ── */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">MRP Runs</div>
            {mrpLoading ? <Spinner /> : mrpRuns.length === 0 ? (
              <div style={{ padding:'20px', background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', fontSize:12, color:'#64748b', lineHeight:1.7 }}>
                <strong style={{ color:'#1e293b' }}>No MRP runs yet.</strong><br />
                MRP checks what raw materials are needed for your Work Orders vs current stock.<br /><br />
                <strong>Steps:</strong> Create BOM → Approve → Create Work Order → Click "Run MRP"
              </div>
            ) : mrpRuns.map(r => (
              <div key={r._id} onClick={async ()=>{
                try {
                  const full = await mrpApi.getById(r._id);
                  setSelectedMRP(full.data || r);
                } catch {
                  setSelectedMRP(r);
                }
              }} className="p-3 rounded-lg mb-2 cursor-pointer transition-all"
                style={{ border:`2px solid ${selectedMRP?._id===r._id?'#c0392b':'#e2e8f0'}`, background:selectedMRP?._id===r._id?'#fdf5f5':'#fff' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{r.mrpId}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{new Date(r.runDate).toLocaleDateString('en-IN')} · {r.totalItems} items · {r.itemsWithShortage} shortages</div>
                    <div className="text-[11px] text-red-600 font-semibold mt-0.5">Est. ₹{(r.estimatedCost||0).toLocaleString()}</div>
                  </div>
                  <Badge label={r.status} color={r.status==='Completed'?'#16a34a':'#d97706'} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div className="text-sm font-bold text-gray-800">Shortage Lines {selectedMRP?`— ${selectedMRP.mrpId}`:''}</div>
              {selectedMRP && mrpPRForm.selectedLines.length>0 && (
                <button onClick={handleCreatePRs} style={{ ...primaryBtn, padding:'5px 12px', fontSize:12 }}>Create PR ({mrpPRForm.selectedLines.length})</button>
              )}
            </div>
            {!selectedMRP ? (
              <Empty msg="Select an MRP run from the left to view shortage lines" />
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead><tr>{['','Item','Need','In Stock','Short','Suggest Buy','Action','Status'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                  <tbody>
                    {(selectedMRP.lines||[]).map(l => {
                      const checked = mrpPRForm.selectedLines.includes(String(l._id));
                      return (
                        <tr key={l._id} style={{ background:l.netRequirement>0?'#fff8f8':'#fff', borderBottom:'1px solid #f1f5f9' }}>
                          <Td>
                            {l.action==='Create PR' && l.status==='Open' && (
                              <input type="checkbox" checked={checked} onChange={e=>setMrpPRForm(p=>({...p,selectedLines:e.target.checked?[...p.selectedLines,String(l._id)]:p.selectedLines.filter(x=>x!==String(l._id))}))} />
                            )}
                          </Td>
                          <Td style={{ fontWeight:600 }}>{l.itemName}</Td>
                          <Td style={{ fontWeight:700, color:'#c0392b' }}>{l.grossRequirement}</Td>
                          <Td style={{ color:l.onHandQty>0?'#16a34a':'#94a3b8' }}>{l.onHandQty}</Td>
                          <Td style={{ fontWeight:700, color:l.netRequirement>0?'#ef4444':'#16a34a' }}>{l.netRequirement}</Td>
                          <Td style={{ fontWeight:700 }}>{l.suggestedOrderQty}</Td>
                          <Td><Badge label={l.action} color={l.action==='Create PR'?'#ef4444':'#16a34a'} /></Td>
                          <Td><Badge label={l.status} color={l.status==='Open'?'#d97706':'#16a34a'} /></Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: QC & Finished Goods ── */}
      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9' }}>
            <div className="text-sm font-bold text-gray-800">QC & Finished Goods</div>
            <div className="text-xs text-gray-400 mt-0.5">Work orders at QC Pending stage — record pass/fail quantities</div>
          </div>
          {woLoading ? <Spinner /> : woList.filter(w=>w.status==='QC Pending').length === 0 ? (
            <Empty msg="No work orders pending QC. Work orders move here after progress reaches 100%." />
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                <thead><tr>{['WO ID','Product','Qty','Produced','Rework','Rejected','Status','Action'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {woList.filter(w=>w.status==='QC Pending').map((wo,i) => (
                    <tr key={wo._id} style={{ borderBottom:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafafa' }}>
                      <Td style={{ fontWeight:700, color:'#c0392b', fontFamily:'monospace' }}>{wo.woId}</Td>
                      <Td style={{ fontWeight:600 }}>{wo.product}</Td>
                      <Td style={{ fontWeight:700 }}>{wo.qty}</Td>
                      <Td style={{ fontWeight:700, color:'#16a34a' }}>{wo.produced}</Td>
                      <Td style={{ color: ((wo.qcResult && wo.qcResult.reworkQty) || 0) > 0 ? '#f59e0b' : '#94a3b8' }}>{(wo.qcResult && wo.qcResult.reworkQty) || 0}</Td>
                      <Td style={{ color: (wo.rejected || 0) > 0 ? '#ef4444' : '#94a3b8' }}>{wo.rejected || 0}</Td>
                      <Td><Badge label={wo.status} color={(STATUS_COLOR[wo.status] || '#64748b')} /></Td>
                      <Td>
                        <button onClick={() => { setShowQCModal(wo); setQcForm({...EMPTY_QC, passedQty: String(wo.produced)}); }} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid #f59e0b', color:'#d97706', background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>Record QC</button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Wastage ── */}
      {activeTab === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Wastage Tracking</div>
          <div className="text-xs text-gray-400 mb-4">Record material wastage per work order</div>
          {woLoading ? <Spinner /> : woList.filter(w=>w.materialConsumption?.length>0).length === 0 ? (
            <Empty msg="No released work orders with material consumption data yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {woList.filter(w=>w.materialConsumption?.length>0).map(wo => (
                <div key={wo._id} style={{ background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0', padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13 }}>{wo.product}</div>
                      <div style={{ fontSize:11, color:'#94a3b8' }}>{wo.woId}</div>
                    </div>
                    <Badge label={wo.status} color={STATUS_COLOR[wo.status]||'#64748b'} />
                  </div>
                  {wo.materialConsumption.map((m,idx) => (
                    <WastageRow key={m._id||idx} wo={wo} m={m} onSave={handleSaveWastage} />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: New BOM ── */}
      {showBOMModal && (
        <Modal open={showBOMModal} title="New BOM" onClose={()=>{setShowBOMModal(false);setBomForm(EMPTY_BOM);}}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Select Product (from Item Master) *</label>
              <select 
                className={inp}
                value={bomForm.productItemMasterId}
                onChange={(e) => {
                  const selectedItem = itemMasterItems.find(i => i._id === e.target.value);
                  if (selectedItem) {
                    setBomForm({
                      ...bomForm,
                      productItemMasterId: selectedItem._id,
                      product: selectedItem.name,
                      productCode: selectedItem.sku,
                      uom: selectedItem.unit
                    });
                  } else {
                    setBomForm({...bomForm, productItemMasterId: '', product: '', productCode: '', uom: UOM_OPTIONS[0]});
                  }
                }}
              >
                <option value="">-- Select Product --</option>
                {itemMasterItems.map(item => (
                  <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Product Name (auto-filled)</label><input className={inp} value={bomForm.product} readOnly placeholder="Auto-filled" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Product Code</label><input className={inp} value={bomForm.productCode} onChange={e=>setBomForm(p=>({...p,productCode:e.target.value}))} placeholder="SKU-001" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Version</label><input className={inp} value={bomForm.version} onChange={e=>setBomForm(p=>({...p,version:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
              <select className={inp} value={bomForm.type} onChange={e=>setBomForm(p=>({...p,type:e.target.value}))}>
                {BOM_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">UOM</label>
              <select className={inp} value={bomForm.uom} onChange={e=>setBomForm(p=>({...p,uom:e.target.value}))}>
                {UOM_OPTIONS.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Labour Cost (₹)</label><input type="number" min={0} className={inp} value={bomForm.labourCost} onChange={e=>setBomForm(p=>({...p,labourCost:parseFloat(e.target.value)||0}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Overhead %</label><input type="number" min={0} max={100} className={inp} value={bomForm.overheadPct} onChange={e=>setBomForm(p=>({...p,overheadPct:parseFloat(e.target.value)||0}))} /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Description</label><textarea className={inp} rows={2} value={bomForm.description} onChange={e=>setBomForm(p=>({...p,description:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{setShowBOMModal(false);setBomForm(EMPTY_BOM);}} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleCreateBOM} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>Create BOM</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Add Component ── */}
      {showCompModal && (
        <Modal open={showCompModal} title={`Add Component — ${selectedBOM?.product}`} onClose={()=>{setShowCompModal(false);setCompForm(EMPTY_COMP);setItemSearchTerm('');setItemSearchResults([]);}}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Select Item (from Item Master) *</label>
              <select 
                className={inp}
                value={compForm.itemMasterId || ''}
                onChange={(e) => {
                  const selectedItem = itemMasterItems.find(i => i._id === e.target.value);
                  if (selectedItem) {
                    setCompForm({
                      ...compForm,
                      itemMasterId: selectedItem._id,
                      itemName: selectedItem.name,
                      itemCode: selectedItem.sku,
                      unit: selectedItem.unit
                    });
                    setItemSearchTerm(selectedItem.name);
                  } else {
                    setCompForm({...compForm, itemMasterId: '', itemName: '', itemCode: '', unit: UNIT_OPTIONS[0]});
                    setItemSearchTerm('');
                  }
                }}
              >
                <option value="">--- Select an item ---</option>
                {itemMasterItems.map(item => (
                  <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Or search items...</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className={inp}
                  type="text"
                  value={itemSearchTerm}
                  placeholder="Search items..."
                  onChange={(e) => {
                    const term = e.target.value;
                    setItemSearchTerm(term);
                    searchItemMaster(term);
                    
                    // If term matches an item exactly, select it
                    const exactMatch = itemMasterItems.find(i => 
                      i.name.toLowerCase() === term.toLowerCase() || 
                      i.sku.toLowerCase() === term.toLowerCase()
                    );
                    if (exactMatch) {
                      setCompForm({
                        ...compForm,
                        itemMasterId: exactMatch._id,
                        itemName: exactMatch.name,
                        itemCode: exactMatch.sku,
                        unit: exactMatch.unit
                      });
                    }
                  }}
                />
                {itemSearchResults.length > 0 && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    zIndex: 50, 
                    maxHeight: '200px', 
                    overflowY: 'auto' 
                  }}>
                    {itemSearchResults.map(item => (
                      <div 
                        key={item._id} 
                        style={{ 
                          padding: '8px 12px', 
                          cursor: 'pointer', 
                          borderBottom: '1px solid #f1f5f9' 
                        }}
                        onClick={() => {
                          setCompForm({
                            ...compForm,
                            itemMasterId: item._id,
                            itemName: item.name,
                            itemCode: item.sku,
                            unit: item.unit
                          });
                          setItemSearchTerm(item.name);
                          setItemSearchResults([]);
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.sku}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Item Name (auto-filled)</label><input className={inp} value={compForm.itemName} readOnly placeholder="Auto-filled" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Item Code</label><input className={inp} value={compForm.itemCode} readOnly placeholder="Auto-filled" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Quantity *</label><input type="number" min={0} step="0.01" className={inp} value={compForm.qty} onChange={e=>setCompForm(p=>({...p,qty:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Unit</label><input className={inp} value={compForm.unit} readOnly placeholder="Auto-filled" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
              <select className={inp} value={compForm.type} onChange={e=>setCompForm(p=>({...p,type:e.target.value}))}>
                {COMP_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Scrap Factor %</label><input type="number" min={0} max={100} className={inp} value={compForm.scrapFactor} onChange={e=>setCompForm(p=>({...p,scrapFactor:parseFloat(e.target.value)||0}))} /></div>
            <div className="col-span-2 flex items-center gap-2"><input type="checkbox" id="opt" checked={compForm.isOptional} onChange={e=>setCompForm(p=>({...p,isOptional:e.target.checked}))} /><label htmlFor="opt" className="text-xs text-gray-600">Optional component</label></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{setShowCompModal(false);setCompForm(EMPTY_COMP);setItemSearchTerm('');setItemSearchResults([]);}} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleAddComponent} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>Add Component</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: BOM Approve ── */}
      {showApproveModal && (
        <Modal open={!!showApproveModal} title={`Review BOM — ${showApproveModal.product}`} onClose={()=>setShowApproveModal(null)}>
          <div className="grid gap-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Action</label>
              <select className={inp} value={approveForm.action} onChange={e=>setApproveForm(p=>({...p,action:e.target.value}))}>
                <option value="approve">Approve</option>
                <option value="reject">Reject</option>
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Approver Name</label><input className={inp} value={approveForm.approver} onChange={e=>setApproveForm(p=>({...p,approver:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Remarks</label><textarea className={inp} rows={2} value={approveForm.remarks} onChange={e=>setApproveForm(p=>({...p,remarks:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>setShowApproveModal(null)} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleApprove} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>{approveForm.action === 'approve' ? 'Approve' : 'Reject'}</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: BOM Explode ── */}
      {showExplodeModal && (
        <Modal open={!!showExplodeModal} title={`BOM Explosion — ${showExplodeModal.product}`} onClose={()=>setShowExplodeModal(null)}>
          {explodeData.length === 0 ? <Empty msg="No components to explode" /> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr>{['Level','Item','Code','Qty','Unit','Type','Unit Cost','Total Cost'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {explodeData.map((c,i) => (
                    <tr key={i} style={{ background:i%2===0?'#fff':'#fafafa' }}>
                      <Td style={{ color:'#94a3b8' }}>{c.level}</Td>
                      <Td style={{ fontWeight:600, paddingLeft:(c.level-1)*16+12 }}>{c.itemName}</Td>
                      <Td style={{ fontFamily:'monospace', fontSize:11 }}>{c.itemCode||'—'}</Td>
                      <Td style={{ fontWeight:700, color:'#c0392b' }}>{c.qty}</Td>
                      <Td>{c.unit}</Td>
                      <Td><Badge label={c.type} color="#64748b" /></Td>
                      <Td>₹{(c.unitCost||0).toLocaleString()}</Td>
                      <Td style={{ fontWeight:700 }}>₹{Math.round((c.qty||0)*(c.unitCost||0)).toLocaleString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <button onClick={()=>setShowExplodeModal(null)} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: New Work Order ── */}
      {showWOModal && (
        <Modal open={showWOModal} title="New Work Order" onClose={()=>{setShowWOModal(false);setWoForm(EMPTY_WO);}}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Select Product (from Item Master) *</label>
              <select 
                className={inp}
                value={woForm.productItemMasterId || ''}
                onChange={(e) => {
                  const selectedItem = itemMasterItems.find(i => i._id === e.target.value);
                  if (selectedItem) {
                    // Find matching BOM if exists
                    const matchingBOM = bomList.find(b => b.productItemMasterId === selectedItem._id);
                    setWoForm({
                      ...woForm,
                      productItemMasterId: selectedItem._id,
                      product: selectedItem.name,
                      bomId: matchingBOM ? matchingBOM._id : ''
                    });
                  } else {
                    setWoForm({...woForm, productItemMasterId: '', product: '', bomId: ''});
                  }
                }}
              >
                <option value="">--- Select Product ---</option>
                {itemMasterItems.map(item => (
                  <option key={item._id} value={item._id}>{item.name} ({item.sku})</option>
                ))}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Link BOM</label>
              <select className={inp} value={woForm.bomId} onChange={e=>setWoForm(p=>({...p,bomId:e.target.value}))}>
                <option value="">— No BOM —</option>
                {bomList.map(b=>(
                  <option key={b._id} value={b._id}>
                    {b.product} ({b.bomId}) - {b.approvalStatus || 'Draft'}
                  </option>
                ))}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Quantity *</label><input type="number" min={1} className={inp} value={woForm.qty} onChange={e=>setWoForm(p=>({...p,qty:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Start Date *</label><input type="date" className={inp} value={woForm.startDate} onChange={e=>setWoForm(p=>({...p,startDate:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">End Date</label><input type="date" className={inp} value={woForm.endDate} onChange={e=>setWoForm(p=>({...p,endDate:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Shift</label>
              <select className={inp} value={woForm.shift} onChange={e=>setWoForm(p=>({...p,shift:e.target.value}))}>
                {SHIFT_OPTIONS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Priority</label>
              <select className={inp} value={woForm.priority} onChange={e=>setWoForm(p=>({...p,priority:e.target.value}))}>
                {PRIORITY_OPTIONS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Production Line</label><input className={inp} value={woForm.productionLine} onChange={e=>setWoForm(p=>({...p,productionLine:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Machine</label><input className={inp} value={woForm.machine} onChange={e=>setWoForm(p=>({...p,machine:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Supervisor</label><input className={inp} value={woForm.supervisor} onChange={e=>setWoForm(p=>({...p,supervisor:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Team</label><input className={inp} value={woForm.assignedTeam} onChange={e=>setWoForm(p=>({...p,assignedTeam:e.target.value}))} /></div>
            <div className="col-span-2"><label className="text-xs font-semibold text-gray-500 block mb-1">Remarks</label><textarea className={inp} rows={2} value={woForm.remarks} onChange={e=>setWoForm(p=>({...p,remarks:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{setShowWOModal(false);setWoForm(EMPTY_WO);}} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleCreateWO} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>Create Work Order</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Update Progress ── */}
      {showProgressModal && (
        <Modal open={!!showProgressModal} title={`Update Progress — ${showProgressModal.woId}`} onClose={()=>{setShowProgressModal(null);setProgressVal('');}}>
          <div className="text-xs text-gray-500 mb-3">Target: <strong>{showProgressModal.qty}</strong> units</div>
          <div><label className="text-xs font-semibold text-gray-500 block mb-1">Units Produced So Far</label>
            <input type="number" min={0} max={showProgressModal.qty} className={inp} value={progressVal} onChange={e=>setProgressVal(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{setShowProgressModal(null);setProgressVal('');}} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleUpdateProgress} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>Save Progress</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Record QC ── */}
      {showQCModal && (
        <Modal open={!!showQCModal} title={`Record QC — ${showQCModal.woId}`} onClose={()=>{setShowQCModal(null);setQcForm(EMPTY_QC);}}>
          <div className="text-xs text-gray-500 mb-3">Product: <strong>{showQCModal.product}</strong> · Produced: <strong>{showQCModal.produced}</strong></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Passed Qty</label><input type="number" min={0} className={inp} value={qcForm.passedQty} onChange={e=>setQcForm(p=>({...p,passedQty:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Rework Qty</label><input type="number" min={0} className={inp} value={qcForm.reworkQty} onChange={e=>setQcForm(p=>({...p,reworkQty:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Rejected Qty</label><input type="number" min={0} className={inp} value={qcForm.rejectedQty} onChange={e=>setQcForm(p=>({...p,rejectedQty:e.target.value}))} /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Defect Type</label><input className={inp} value={qcForm.defectType} onChange={e=>setQcForm(p=>({...p,defectType:e.target.value}))} placeholder="e.g. Dimensional" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Inspected By</label><input className={inp} value={qcForm.inspectedBy} onChange={e=>setQcForm(p=>({...p,inspectedBy:e.target.value}))} /></div>
            <div className="col-span-3"><label className="text-xs font-semibold text-gray-500 block mb-1">Remarks</label><textarea className={inp} rows={2} value={qcForm.remarks} onChange={e=>setQcForm(p=>({...p,remarks:e.target.value}))} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{setShowQCModal(null);setQcForm(EMPTY_QC);}} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleRecordQC} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>Submit QC</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Material Consumption ── */}
      {showConsumptionModal && (
        <Modal open={!!showConsumptionModal} title={`Material Consumption — ${showConsumptionModal.woId}`} onClose={()=>setShowConsumptionModal(null)}>
          <WIPCard wo={showConsumptionModal} onSaveConsumption={(wo, rows) => { handleSaveConsumption(wo, rows); setShowConsumptionModal(null); }} />
        </Modal>
      )}

      {/* ── Modal: Run MRP ── */}
      {showMRPModal && (
        <Modal open={showMRPModal} title="Run MRP" onClose={()=>{setShowMRPModal(false);setMrpForm({description:'',runBy:'',selectedWOs:[]});}}>
          <div className="grid gap-3">
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Description</label><input className={inp} value={mrpForm.description} onChange={e=>setMrpForm(p=>({...p,description:e.target.value}))} placeholder="e.g. Week 22 planning" /></div>
            <div><label className="text-xs font-semibold text-gray-500 block mb-1">Run By</label><input className={inp} value={mrpForm.runBy} onChange={e=>setMrpForm(p=>({...p,runBy:e.target.value}))} /></div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-2">Select Work Orders *</label>
              {woList.filter(w=>['Pending','Released','In-Progress'].includes(w.status)).length === 0 ? (
                <div style={{ fontSize:12, color:'#94a3b8', padding:'10px 0' }}>No active work orders available.</div>
              ) : (
                <div style={{ maxHeight:200, overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:8, padding:8 }}>
                  {woList.filter(w=>['Pending','Released','In-Progress'].includes(w.status)).map(wo => (
                    <label key={wo._id} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 4px', cursor:'pointer', fontSize:12 }}>
                      <input type="checkbox" checked={mrpForm.selectedWOs.includes(wo._id)} onChange={e=>setMrpForm(p=>({...p,selectedWOs:e.target.checked?[...p.selectedWOs,wo._id]:p.selectedWOs.filter(x=>x!==wo._id)}))} />
                      <span style={{ fontWeight:600, color:'#c0392b' }}>{wo.woId}</span>
                      <span>{wo.product}</span>
                      <span style={{ color:'#94a3b8' }}>({wo.qty} units)</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={()=>{setShowMRPModal(false);setMrpForm({description:'',runBy:'',selectedWOs:[]});}} style={{ ...outlineBtn, padding:'7px 14px', fontSize:12 }}>Cancel</button>
            <button onClick={handleRunMRP} style={{ ...primaryBtn, padding:'7px 14px', fontSize:12 }}>Run MRP</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
