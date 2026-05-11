import { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { bomApi, workOrderApi, mrpApi } from '../../api/bomApi';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const btnP = 'inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]';
const btnO = 'inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]';

const TABS = ['BOM', 'Work Orders', 'WIP & Consumption', 'MRP', 'Tracking', 'Efficiency'];

const EMPTY_BOM  = { product: '', productCode: '', version: 'v1.0', type: 'Finished Good', uom: 'Set', description: '', overheadPct: 0, labourCost: 0 };
const EMPTY_COMP = { itemName: '', itemCode: '', qty: '', unit: 'Nos', type: 'Raw', level: 1, unitCost: '', scrapFactor: 0, remarks: '', isOptional: false };
const EMPTY_ALT  = { itemName: '', itemCode: '', unitCost: '', leadTimeDays: '', priority: 0, notes: '' };
const EMPTY_WO   = { product: '', bomId: '', qty: '', shift: 'General', priority: 'Normal', startDate: '', endDate: '', remarks: '' };
const EMPTY_QC   = { passedQty: '', rejectedQty: '', defectType: '', inspectedBy: '', remarks: '' };

const STATUS_COLOR = {
  Active: '#16a34a', Draft: '#d97706', Obsolete: '#94a3b8',
  'Pending Approval': '#2563eb', Approved: '#16a34a', Rejected: '#ef4444',
  Pending: '#d97706', Released: '#2563eb', 'In-Progress': '#7c3aed',
  WIP: '#0891b2', 'QC Pending': '#f59e0b', Completed: '#16a34a', Cancelled: '#94a3b8',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #f1f5f9', borderTop: '3px solid #c0392b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Empty({ msg = 'No data yet' }) {
  return <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{msg}</div>;
}
function Badge({ label, color = '#64748b' }) {
  return <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '18', color }}>{label}</span>;
}
function Th({ children }) {
  return <th style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', background: '#f8fafc' }}>{children}</th>;
}
function Td({ children, style = {} }) {
  return <td style={{ padding: '9px 12px', fontSize: 12.5, color: '#1e293b', borderBottom: '1px solid #f1f5f9', ...style }}>{children}</td>;
}

export default function ProductionPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data
  const [bomList, setBomList]         = useState([]);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [bomLoading, setBomLoading]   = useState(false);
  const [woList, setWoList]           = useState([]);
  const [woLoading, setWoLoading]     = useState(false);
  const [mrpRuns, setMrpRuns]         = useState([]);
  const [selectedMRP, setSelectedMRP] = useState(null);
  const [mrpLoading, setMrpLoading]   = useState(false);

  // Modals
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

  // Forms
  const [bomForm, setBomForm]       = useState(EMPTY_BOM);
  const [compForm, setCompForm]     = useState(EMPTY_COMP);
  const [altForm, setAltForm]       = useState(EMPTY_ALT);
  const [woForm, setWoForm]         = useState(EMPTY_WO);
  const [progressVal, setProgressVal] = useState('');
  const [qcForm, setQcForm]         = useState(EMPTY_QC);
  const [approveForm, setApproveForm] = useState({ action: 'approve', approver: '', remarks: '' });
  const [mrpForm, setMrpForm]       = useState({ description: '', runBy: '', selectedWOs: [] });
  const [mrpPRForm, setMrpPRForm]   = useState({ department: 'Production', requestedBy: 'MRP System', selectedLines: [] });

  // ── Loaders ────────────────────────────────────────────────────────────────
  const loadBOMs = useCallback(async () => {
    setBomLoading(true);
    try {
      const res = await bomApi.getAll();
      const list = res.data || [];
      setBomList(list);
      setSelectedBOM(prev => {
        if (!prev && list.length > 0) return list[0];
        if (prev) return list.find(b => b._id === prev._id) || prev;
        return null;
      });
    } catch (e) { toast(e.message || 'Failed to load BOMs', 'error'); }
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

  useEffect(() => { loadBOMs(); loadWOs(); loadMRP(); }, [loadBOMs, loadWOs, loadMRP]);

  // ── BOM handlers ───────────────────────────────────────────────────────────
  const handleCreateBOM = async () => {
    if (!bomForm.product.trim()) { toast('Product name is required', 'error'); return; }
    try {
      await bomApi.create(bomForm);
      toast('BOM created'); setBomForm(EMPTY_BOM); setShowBOMModal(false); loadBOMs();
    } catch (e) { toast(e.message || 'Failed to create BOM', 'error'); }
  };

  const handleDeleteBOM = async (bom) => {
    if (!window.confirm(`Delete BOM "${bom.product}" (${bom.bomId})?`)) return;
    try {
      await bomApi.delete(bom._id);
      toast('BOM deleted');
      if (selectedBOM?._id === bom._id) setSelectedBOM(null);
      loadBOMs();
    } catch (e) { toast(e.message || 'Failed to delete BOM', 'error'); }
  };

  const handleSubmitApproval = async (bom) => {
    try { await bomApi.submit(bom._id, { approver: 'Production Manager' }); toast('BOM submitted for approval'); loadBOMs(); }
    catch (e) { toast(e.message || 'Failed to submit', 'error'); }
  };

  const handleApprove = async () => {
    if (!showApproveModal) return;
    try {
      await bomApi.approve(showApproveModal._id, approveForm);
      toast(`BOM ${approveForm.action}d`);
      setShowApproveModal(null); setApproveForm({ action: 'approve', approver: '', remarks: '' }); loadBOMs();
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleExplode = async (bom) => {
    try {
      const res = await bomApi.explode(bom._id, 1);
      setExplodeData(res.data || []); setShowExplodeModal(bom);
    } catch (e) { toast(e.message || 'Failed to explode BOM', 'error'); }
  };

  // ── Component handlers ─────────────────────────────────────────────────────
  const handleAddComponent = async () => {
    if (!compForm.itemName.trim()) { toast('Item name is required', 'error'); return; }
    if (!compForm.qty || parseFloat(compForm.qty) <= 0) { toast('Quantity must be > 0', 'error'); return; }
    if (!selectedBOM) { toast('Select a BOM first', 'error'); return; }
    try {
      const res = await bomApi.addComponent(selectedBOM._id, {
        ...compForm, qty: parseFloat(compForm.qty), unitCost: parseFloat(compForm.unitCost) || 0,
      });
      toast('Component added'); setCompForm(EMPTY_COMP); setShowCompModal(false);
      setSelectedBOM(res.data); setBomList(prev => prev.map(b => b._id === res.data._id ? res.data : b));
    } catch (e) { toast(e.message || 'Failed to add component', 'error'); }
  };

  const handleDeleteComponent = async (bomId, componentId, itemName) => {
    if (!window.confirm(`Remove "${itemName}"?`)) return;
    try {
      const res = await bomApi.deleteComponent(bomId, componentId);
      toast('Component removed');
      setSelectedBOM(res.data); setBomList(prev => prev.map(b => b._id === res.data._id ? res.data : b));
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleAddAlternate = async () => {
    if (!altForm.itemName.trim()) { toast('Alternate item name is required', 'error'); return; }
    if (!selectedBOM || !showAltModal) return;
    try {
      await bomApi.addAlternate(selectedBOM._id, showAltModal, {
        ...altForm, unitCost: parseFloat(altForm.unitCost) || 0, leadTimeDays: parseInt(altForm.leadTimeDays) || 0,
      });
      toast('Alternate added'); setAltForm(EMPTY_ALT); setShowAltModal(null); loadBOMs();
    } catch (e) { toast(e.message || 'Failed to add alternate', 'error'); }
  };

  // ── WO handlers ────────────────────────────────────────────────────────────
  const handleCreateWO = async () => {
    if (!woForm.product.trim()) { toast('Product is required', 'error'); return; }
    if (!woForm.qty || parseInt(woForm.qty) < 1) { toast('Quantity must be at least 1', 'error'); return; }
    if (!woForm.startDate) { toast('Start date is required', 'error'); return; }
    try {
      await workOrderApi.create({ ...woForm, qty: parseInt(woForm.qty), bomId: woForm.bomId || undefined });
      toast('Work order created'); setWoForm(EMPTY_WO); setShowWOModal(false); loadWOs();
    } catch (e) { toast(e.message || 'Failed to create WO', 'error'); }
  };

  const handleReleaseWO = async (wo) => {
    if (!window.confirm(`Release WO ${wo.woId}? This will create the material consumption plan from the BOM.`)) return;
    try { await workOrderApi.release(wo._id); toast('WO released — material plan created'); loadWOs(); }
    catch (e) { toast(e.message || 'Failed to release WO', 'error'); }
  };

  const handleUpdateProgress = async () => {
    if (!showProgressModal) return;
    const val = parseInt(progressVal);
    if (isNaN(val) || val < 0) { toast('Enter a valid quantity', 'error'); return; }
    try {
      const res = await workOrderApi.updateProgress(showProgressModal._id, val);
      setWoList(prev => prev.map(w => w._id === res.data._id ? res.data : w));
      toast('Progress updated'); setShowProgressModal(null); setProgressVal('');
    } catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  const handleDeductInventory = async (wo) => {
    if (!window.confirm(`Deduct inventory for WO ${wo.woId}? This will reduce stock for all consumed materials.`)) return;
    try {
      const res = await workOrderApi.deductInventory(wo._id);
      toast(res.message || 'Inventory deducted');
      if (res.warnings?.length) res.warnings.forEach(w => toast(w, 'warning'));
      loadWOs();
    } catch (e) { toast(e.message || 'Failed to deduct inventory', 'error'); }
  };

  const handleRecordQC = async () => {
    if (!showQCModal) return;
    try {
      await workOrderApi.recordQC(showQCModal._id, {
        ...qcForm, passedQty: parseInt(qcForm.passedQty) || 0, rejectedQty: parseInt(qcForm.rejectedQty) || 0,
      });
      toast('QC result recorded'); setShowQCModal(null); setQcForm(EMPTY_QC); loadWOs();
    } catch (e) { toast(e.message || 'Failed to record QC', 'error'); }
  };

  const handleDeleteWO = async (wo) => {
    if (!window.confirm(`Delete WO ${wo.woId}?`)) return;
    try { await workOrderApi.delete(wo._id); toast('Work order deleted'); loadWOs(); }
    catch (e) { toast(e.message || 'Failed', 'error'); }
  };

  // ── MRP handlers ───────────────────────────────────────────────────────────
  const handleRunMRP = async () => {
    if (mrpForm.selectedWOs.length === 0) { toast('Select at least one Work Order', 'error'); return; }
    try {
      const res = await mrpApi.run({ workOrderIds: mrpForm.selectedWOs, description: mrpForm.description, runBy: mrpForm.runBy });
      toast(`MRP run completed — ${res.data.itemsWithShortage} shortage(s) found`);
      setShowMRPModal(false); setMrpForm({ description: '', runBy: '', selectedWOs: [] });
      setSelectedMRP(res.data); loadMRP();
    } catch (e) { toast(e.message || 'MRP run failed', 'error'); }
  };

  const handleCreatePRs = async () => {
    if (!selectedMRP || mrpPRForm.selectedLines.length === 0) { toast('Select lines to create PRs', 'error'); return; }
    try {
      const res = await mrpApi.createPRs(selectedMRP._id, {
        lineIds: mrpPRForm.selectedLines, department: mrpPRForm.department, requestedBy: mrpPRForm.requestedBy,
      });
      toast(res.message || 'PRs created');
      setMrpPRForm({ department: 'Production', requestedBy: 'MRP System', selectedLines: [] });
      const updated = await mrpApi.getById(selectedMRP._id);
      setSelectedMRP(updated.data); loadMRP();
    } catch (e) { toast(e.message || 'Failed to create PRs', 'error'); }
  };

  const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(185,28,28,0.3)' };
  const outlineBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'transparent', color: '#c0392b', border: '1.5px solid #c0392b', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' };

  return (
    <div>
      {/* Tab Bar */}
      <div style={{ display:"flex", gap:4, marginBottom:20, background:"#f8fafc", borderRadius:12, padding:4, overflowX:"auto" }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            style={{ padding:"7px 18px", borderRadius:9, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap", background: activeTab===i ? "#fff" : "transparent", color: activeTab===i ? "#c0392b" : "#64748b", boxShadow: activeTab===i ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {activeTab === 0 && (
          <>
            <button 
              onClick={() => setShowBOMModal(true)} 
              style={primaryBtn}
            >
              + New BOM
            </button>
            {selectedBOM && (
              <button 
                onClick={() => setShowCompModal(true)} 
                style={outlineBtn}
              >
                + Add Component
              </button>
            )}
          </>
        )}
        {activeTab === 1 && <button onClick={() => setShowWOModal(true)} style={primaryBtn}>+ New Work Order</button>}
        {activeTab === 3 && <button onClick={() => setShowMRPModal(true)} style={primaryBtn}>Run MRP</button>}
      </div>

      {/*  TAB 0: BOM  */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BOM List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM List</div>
            {bomLoading ? <Spinner /> : bomList.length === 0 ? <Empty msg="No BOMs yet. Click + New BOM to create one." /> : bomList.map(b => {
              const sc = STATUS_COLOR[b.approvalStatus] || STATUS_COLOR[b.status] || "#64748b";
              return (
                <div key={b._id} onClick={() => setSelectedBOM(b)}
                  className="p-3 rounded-lg mb-2 cursor-pointer transition-all"
                  style={{ border: `2px solid ${selectedBOM?._id === b._id ? "#c0392b" : "#e2e8f0"}`, background: selectedBOM?._id === b._id ? "#fdf5f5" : "#fff" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm">{b.product}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{b.bomId}  {b.version}  {b.componentCount ?? 0} components</div>
                      <div className="text-[11px] text-red-600 font-semibold mt-0.5">₹{(b.totalCost || 0).toLocaleString()} total cost</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge label={b.approvalStatus || b.status} color={sc} />
                      <div className="flex gap-1 mt-1">
                        {b.approvalStatus === "Draft" && b.componentCount > 0 && (
                          <button onClick={e => { e.stopPropagation(); handleSubmitApproval(b); }} style={{ padding:"2px 7px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #2563eb", color:"#2563eb", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Submit</button>
                        )}
                        {b.approvalStatus === "Pending Approval" && (
                          <button onClick={e => { e.stopPropagation(); setShowApproveModal(b); }} style={{ padding:"2px 7px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #16a34a", color:"#16a34a", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Review</button>
                        )}
                        <button onClick={e => { e.stopPropagation(); handleExplode(b); }} style={{ padding:"2px 7px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #7c3aed", color:"#7c3aed", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Explode</button>
                        <button onClick={e => { e.stopPropagation(); handleDeleteBOM(b); }} style={{ padding:"2px 7px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #fecaca", color:"#ef4444", background:"#fef2f2", cursor:"pointer", fontFamily:"inherit" }}>Del</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Component Tree */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-bold text-gray-800">Component Tree {selectedBOM ? `— ${selectedBOM.product}` : ""}</div>
         
            </div>
            {!selectedBOM ? <Empty msg="Select a BOM to view its components" /> : selectedBOM.components?.length === 0 ? <Empty msg="No components yet. Click + Add to build the BOM." /> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>{["#","Item","Code","Qty","Unit","Type","Scrap%","Unit Cost","Total","Alt",""].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                  <tbody>
                    {selectedBOM.components.map((c, i) => {
                      const tc = c.type === "Raw" ? "#64748b" : c.type === "Sub-Assembly" ? "#2563eb" : c.type === "Consumable" ? "#d97706" : "#7c3aed";
                      const total = c.qty * (1 + (c.scrapFactor || 0) / 100) * (c.unitCost || 0);
                      return (
                        <tr key={c._id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <Td style={{ color:"#94a3b8", fontWeight:600 }}>{i + 1}</Td>
                          <Td style={{ fontWeight:700 }}>{c.itemName}{c.isOptional && <span style={{ fontSize:10, color:"#94a3b8", marginLeft:4 }}>(opt)</span>}</Td>
                          <Td style={{ fontFamily:"monospace", fontSize:11.5, color:"#64748b" }}>{c.itemCode || "—"}</Td>
                          <Td style={{ fontWeight:700, color:"#c0392b" }}>{c.qty}</Td>
                          <Td style={{ color:"#64748b" }}>{c.unit}</Td>
                          <Td><Badge label={c.type} color={tc} /></Td>
                          <Td style={{ color:"#64748b" }}>{c.scrapFactor || 0}%</Td>
                          <Td style={{ color:"#64748b" }}>₹{(c.unitCost || 0).toLocaleString()}</Td>
                          <Td style={{ fontWeight:700 }}>₹{Math.round(total).toLocaleString()}</Td>
                          <Td>
                            <button onClick={() => setShowAltModal(c._id)} style={{ padding:"2px 7px", borderRadius:5, fontSize:10, fontWeight:600, border:"1px solid #7c3aed", color:"#7c3aed", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>
                              {c.alternates?.length > 0 ? `${c.alternates.length} alt` : "+ Alt"}
                            </button>
                          </Td>
                          <Td>
                            <button onClick={() => handleDeleteComponent(selectedBOM._id, c._id, c.itemName)} style={{ padding:"2px 7px", borderRadius:5, fontSize:10, fontWeight:600, border:"1px solid #fecaca", color:"#ef4444", background:"#fef2f2", cursor:"pointer", fontFamily:"inherit" }}></button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:"#f8fafc", borderTop:"2px solid #e2e8f0" }}>
                      <td colSpan={8} style={{ padding:"9px 12px", fontWeight:700, fontSize:12, textAlign:"right", color:"#1e293b" }}>Material Cost:</td>
                      <td style={{ padding:"9px 12px", fontWeight:800, fontSize:13, color:"#c0392b" }}>₹{(selectedBOM.materialCost || 0).toLocaleString()}</td>
                      <td colSpan={2} />
                    </tr>
                    {(selectedBOM.overheadPct > 0 || selectedBOM.labourCost > 0) && (
                      <tr style={{ background:"#f8fafc" }}>
                        <td colSpan={8} style={{ padding:"6px 12px", fontWeight:600, fontSize:11.5, textAlign:"right", color:"#64748b" }}>+ Overhead ({selectedBOM.overheadPct || 0}%) + Labour ₹{(selectedBOM.labourCost || 0).toLocaleString()}:</td>
                        <td style={{ padding:"6px 12px", fontWeight:800, fontSize:13, color:"#c0392b" }}>₹{(selectedBOM.totalCost || 0).toLocaleString()}</td>
                        <td colSpan={2} />
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {/*  TAB 1: Work Orders  */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {woLoading ? <Spinner /> : woList.length === 0 ? <Empty msg="No work orders yet." /> : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
                <thead><tr>{["WO ID","Product","BOM","Qty","Produced","Rejected","Progress","Status","Actions"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {woList.map((wo, i) => {
                    const pct = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
                    const pc = pct >= 100 ? "#16a34a" : pct >= 50 ? "#d97706" : "#ef4444";
                    const sc = STATUS_COLOR[wo.status] || "#64748b";
                    return (
                      <tr key={wo._id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#fafafa" }}>
                        <Td style={{ fontWeight:700, color:"#c0392b", fontFamily:"monospace" }}>{wo.woId}</Td>
                        <Td style={{ fontWeight:600 }}>{wo.product}</Td>
                        <Td style={{ fontSize:11.5, color:"#64748b" }}>{wo.bomId?.bomId || "—"}</Td>
                        <Td style={{ fontWeight:700 }}>{wo.qty}</Td>
                        <Td style={{ fontWeight:700, color: wo.produced >= wo.qty ? "#16a34a" : "#1e293b" }}>{wo.produced}</Td>
                        <Td style={{ color: wo.rejected > 0 ? "#ef4444" : "#94a3b8" }}>{wo.rejected || 0}</Td>
                        <Td style={{ minWidth:100 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <div style={{ flex:1, height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}>
                              <div style={{ height:"100%", width:`${pct}%`, background:pc, borderRadius:3 }} />
                            </div>
                            <span style={{ fontSize:11, fontWeight:700, color:pc, minWidth:30 }}>{pct}%</span>
                          </div>
                        </Td>
                        <Td><Badge label={wo.status} color={sc} /></Td>
                        <Td>
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {wo.status === "Pending" && wo.bomId && (
                              <button onClick={() => handleReleaseWO(wo)} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #2563eb", color:"#2563eb", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Release</button>
                            )}
                            {["Released","In-Progress","WIP"].includes(wo.status) && (
                              <button onClick={() => { setShowProgressModal(wo); setProgressVal(String(wo.produced)); }} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #c0392b", color:"#c0392b", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Progress</button>
                            )}
                            {["Released","In-Progress","WIP"].includes(wo.status) && !wo.inventoryDeducted && (
                              <button onClick={() => handleDeductInventory(wo)} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #7c3aed", color:"#7c3aed", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Deduct Inv</button>
                            )}
                            {wo.status === "QC Pending" && (
                              <button onClick={() => { setShowQCModal(wo); setQcForm({ ...EMPTY_QC, passedQty: String(wo.produced) }); }} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #f59e0b", color:"#d97706", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>QC</button>
                            )}
                            {wo.materialConsumption?.length > 0 && (
                              <button onClick={() => setShowConsumptionModal(wo)} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #0891b2", color:"#0891b2", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>Materials</button>
                            )}
                            <button onClick={() => handleDeleteWO(wo)} style={{ padding:"3px 8px", borderRadius:6, fontSize:10, fontWeight:600, border:"1px solid #fecaca", color:"#ef4444", background:"#fef2f2", cursor:"pointer", fontFamily:"inherit" }}>Del</button>
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

      {/*  TAB 2: WIP & Consumption  */}
      {activeTab === 2 && (
        <div className="flex flex-col gap-4">
          {woLoading ? <Spinner /> : woList.filter(w => ["Released","In-Progress","WIP","QC Pending"].includes(w.status)).length === 0
            ? <Empty msg="No active work orders with material consumption data." />
            : woList.filter(w => ["Released","In-Progress","WIP","QC Pending"].includes(w.status)).map(wo => {
              const pct = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
              return (
                <div key={wo._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-bold text-[15px]">{wo.product}</div>
                      <div className="text-xs text-gray-400">{wo.woId}  {wo.shift} Shift  {wo.priority} Priority</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge label={wo.status} color={STATUS_COLOR[wo.status] || "#64748b"} />
                      {wo.inventoryDeducted && <Badge label="Inv Deducted" color="#16a34a" />}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>Progress: <strong>{wo.produced}/{wo.qty}</strong></span>
                    <span className="font-bold" style={{ color:"#c0392b" }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width:`${pct}%`, background:"#c0392b" }} />
                  </div>
                  {wo.materialConsumption?.length > 0 && (
                    <div style={{ overflowX:"auto" }}>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Material Consumption Plan</div>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                        <thead><tr>{["Item","Code","Planned Qty","Consumed Qty","Unit","Batch","OEM/Vendor","Cost"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                        <tbody>
                          {wo.materialConsumption.map((m, i) => {
                            const pctC = m.plannedQty > 0 ? Math.round((m.consumedQty / m.plannedQty) * 100) : 0;
                            return (
                              <tr key={m._id} style={{ background: i%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                                <Td style={{ fontWeight:600 }}>{m.itemName}{m.isAlternate && <Badge label="Alt" color="#7c3aed" />}</Td>
                                <Td style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{m.itemCode || "—"}</Td>
                                <Td style={{ fontWeight:700 }}>{m.plannedQty}</Td>
                                <Td>
                                  <span style={{ fontWeight:700, color: pctC >= 100 ? "#16a34a" : pctC > 0 ? "#d97706" : "#94a3b8" }}>{m.consumedQty}</span>
                                  <span style={{ fontSize:10, color:"#94a3b8", marginLeft:4 }}>({pctC}%)</span>
                                </Td>
                                <Td style={{ color:"#64748b" }}>{m.unit}</Td>
                                <Td style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{m.batchNo || "—"}</Td>
                                <Td style={{ fontSize:11, color:"#64748b" }}>{m.oemBrand?.name || m.vendorId?.companyName || "—"}</Td>
                                <Td style={{ fontWeight:700 }}>₹{Math.round(m.consumedQty * (m.unitCost || 0)).toLocaleString()}</Td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background:"#f8fafc", borderTop:"2px solid #e2e8f0" }}>
                            <td colSpan={7} style={{ padding:"8px 12px", fontWeight:700, textAlign:"right", fontSize:12 }}>Actual Cost:</td>
                            <td style={{ padding:"8px 12px", fontWeight:800, color:"#c0392b", fontSize:13 }}>₹{(wo.actualCost || 0).toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}


      {/*  TAB 3: MRP  */}
      {activeTab === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MRP Run List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">MRP Runs</div>
            {mrpLoading ? <Spinner /> : mrpRuns.length === 0 ? <Empty msg="No MRP runs yet. Click Run MRP to calculate material requirements." /> : mrpRuns.map(r => (
              <div key={r._id} onClick={() => setSelectedMRP(r)}
                className="p-3 rounded-lg mb-2 cursor-pointer transition-all"
                style={{ border: `2px solid ${selectedMRP?._id === r._id ? "#c0392b" : "#e2e8f0"}`, background: selectedMRP?._id === r._id ? "#fdf5f5" : "#fff" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{r.mrpId}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{new Date(r.runDate).toLocaleDateString("en-IN")}  {r.totalItems} items  {r.itemsWithShortage} shortages</div>
                    <div className="text-[11px] text-red-600 font-semibold mt-0.5">Est. ₹{(r.estimatedCost || 0).toLocaleString()}</div>
                  </div>
                  <Badge label={r.status} color={r.status === "Completed" ? "#16a34a" : "#d97706"} />
                </div>
              </div>
            ))}
          </div>

          {/* MRP Results */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-bold text-gray-800">MRP Lines {selectedMRP ? `— ${selectedMRP.mrpId}` : ""}</div>
              {selectedMRP && mrpPRForm.selectedLines.length > 0 && (
                <button onClick={handleCreatePRs} style={{ ...primaryBtn, padding:"5px 12px", fontSize:12 }}>Create PRs ({mrpPRForm.selectedLines.length})</button>
              )}
            </div>
            {!selectedMRP ? <Empty msg="Select an MRP run to view results" /> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr>{["","Item","Gross Req","On Hand","Scheduled","Net Req","Suggest Qty","Action","Status"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
                  <tbody>
                    {(selectedMRP.lines || []).map(l => {
                      const checked = mrpPRForm.selectedLines.includes(String(l._id));
                      const ac = l.action === "Create PR" ? "#ef4444" : "#16a34a";
                      return (
                        <tr key={l._id} style={{ background: l.netRequirement > 0 ? "#fff8f8" : "#fff", borderBottom:"1px solid #f1f5f9" }}>
                          <Td>
                            {l.action === "Create PR" && l.status === "Open" && (
                              <input type="checkbox" checked={checked} onChange={e => setMrpPRForm(p => ({ ...p, selectedLines: e.target.checked ? [...p.selectedLines, String(l._id)] : p.selectedLines.filter(x => x !== String(l._id)) }))} />
                            )}
                          </Td>
                          <Td style={{ fontWeight:600 }}>{l.itemName}</Td>
                          <Td style={{ fontWeight:700, color:"#c0392b" }}>{l.grossRequirement}</Td>
                          <Td style={{ color: l.onHandQty > 0 ? "#16a34a" : "#94a3b8" }}>{l.onHandQty}</Td>
                          <Td style={{ color:"#2563eb" }}>{l.scheduledReceipts}</Td>
                          <Td style={{ fontWeight:700, color: l.netRequirement > 0 ? "#ef4444" : "#16a34a" }}>{l.netRequirement}</Td>
                          <Td style={{ fontWeight:700 }}>{l.suggestedOrderQty}</Td>
                          <Td><Badge label={l.action} color={ac} /></Td>
                          <Td><Badge label={l.status} color={l.status === "Open" ? "#d97706" : "#16a34a"} /></Td>
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

      {/*  TAB 4: Tracking  */}
      {activeTab === 4 && (
        <div className="flex flex-col gap-4">
          {woLoading ? <Spinner /> : woList.filter(w => w.status === "In-Progress" || w.status === "WIP").length === 0
            ? <Empty msg="No in-progress work orders." />
            : woList.filter(w => w.status === "In-Progress" || w.status === "WIP").map(wo => {
              const pct = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
              return (
                <div key={wo._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-bold text-[15px]">{wo.product}</div>
                      <div className="text-xs text-gray-400">{wo.woId}  {wo.shift} Shift  {wo.priority} Priority</div>
                    </div>
                    <Badge label={wo.status} color={STATUS_COLOR[wo.status] || "#64748b"} />
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>Progress: <strong>{wo.produced}/{wo.qty}</strong></span>
                    <span className="font-bold" style={{ color:"#c0392b" }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background:"#c0392b" }} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setShowProgressModal(wo); setProgressVal(String(wo.produced)); }} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white border-0 cursor-pointer font-[inherit] hover:bg-red-700 transition-all">+ Update Progress</button>
                    {!wo.inventoryDeducted && <button onClick={() => handleDeductInventory(wo)} className="py-2 px-4 rounded-xl text-sm font-semibold border border-purple-500 text-purple-600 cursor-pointer font-[inherit] hover:bg-purple-50 transition-all">Deduct Inventory</button>}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/*  TAB 5: Efficiency  */}
      {activeTab === 5 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Efficiency by Work Order</div>
            {woList.length === 0 ? <Empty msg="No work orders yet." /> : woList.map((wo, i) => {
              const eff = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
              return (
                <div key={wo._id} className={`py-3 ${i < woList.length - 1 ? "border-b border-gray-100" : ""}`}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold">{wo.product} <span className="text-gray-400 text-xs">({wo.woId})</span></span>
                    <span className="font-extrabold" style={{ color: eff >= 90 ? "#27ae60" : eff >= 50 ? "#f39c12" : "#ef4444" }}>{eff}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${eff}%`, background: eff >= 90 ? "#27ae60" : eff >= 50 ? "#f39c12" : "#ef4444" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Summary</div>
            {[
              { label:"Total BOMs", value: bomList.length, color:"#c0392b" },
              { label:"Active BOMs", value: bomList.filter(b => b.status === "Active").length, color:"#16a34a" },
              { label:"Pending Approval", value: bomList.filter(b => b.approvalStatus === "Pending Approval").length, color:"#2563eb" },
              { label:"Total Work Orders", value: woList.length, color:"#7c3aed" },
              { label:"Completed WOs", value: woList.filter(w => w.status === "Completed").length, color:"#16a34a" },
              { label:"In-Progress WOs", value: woList.filter(w => w.status === "In-Progress" || w.status === "WIP").length, color:"#d97706" },
              { label:"MRP Runs", value: mrpRuns.length, color:"#0891b2" },
            ].map((s, i, arr) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize:13, color:"#64748b", fontWeight:500 }}>{s.label}</span>
                <span style={{ fontSize:18, fontWeight:800, color:s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* New BOM Modal */}
      <Modal open={showBOMModal} onClose={() => setShowBOMModal(false)} title="Create New BOM">
        <div className="flex flex-col gap-3">
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Product Name *</label><input className={inp} placeholder="e.g. Chakra Motor Assembly" value={bomForm.product} onChange={e => setBomForm(p => ({ ...p, product: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Product Code</label><input className={inp} placeholder="e.g. CMA-001" value={bomForm.productCode} onChange={e => setBomForm(p => ({ ...p, productCode: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Version</label><input className={inp} value={bomForm.version} onChange={e => setBomForm(p => ({ ...p, version: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Type</label>
              <select className={inp} value={bomForm.type} onChange={e => setBomForm(p => ({ ...p, type: e.target.value }))}>
                {["Finished Good","Sub-Assembly","Semi-Finished","Phantom"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">UOM</label><input className={inp} placeholder="Set / Nos / Kg" value={bomForm.uom} onChange={e => setBomForm(p => ({ ...p, uom: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Overhead %</label><input type="number" className={inp} min={0} value={bomForm.overheadPct} onChange={e => setBomForm(p => ({ ...p, overheadPct: parseFloat(e.target.value) || 0 }))} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Labour Cost (₹)</label><input type="number" className={inp} min={0} value={bomForm.labourCost} onChange={e => setBomForm(p => ({ ...p, labourCost: parseFloat(e.target.value) || 0 }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label><textarea className={inp} rows={2} placeholder="Optional description" value={bomForm.description} onChange={e => setBomForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => setShowBOMModal(false)}>Cancel</button>
            <button className={btnP} onClick={handleCreateBOM}>Create BOM</button>
          </div>
        </div>
      </Modal>

      {/* Add Component Modal */}
      <Modal open={showCompModal} onClose={() => setShowCompModal(false)} title={`Add Component — ${selectedBOM?.product || ""}`}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Item Name *</label><input className={inp} placeholder="e.g. Steel Rod" value={compForm.itemName} onChange={e => setCompForm(p => ({ ...p, itemName: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Item Code</label><input className={inp} placeholder="e.g. SR-001" value={compForm.itemCode} onChange={e => setCompForm(p => ({ ...p, itemCode: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Qty *</label><input type="number" className={inp} min={0} step="0.01" value={compForm.qty} onChange={e => setCompForm(p => ({ ...p, qty: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Unit</label><input className={inp} value={compForm.unit} onChange={e => setCompForm(p => ({ ...p, unit: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Type</label>
              <select className={inp} value={compForm.type} onChange={e => setCompForm(p => ({ ...p, type: e.target.value }))}>
                {["Raw","Sub-Assembly","Consumable","Packaging"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Unit Cost (₹)</label><input type="number" className={inp} min={0} step="0.01" value={compForm.unitCost} onChange={e => setCompForm(p => ({ ...p, unitCost: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Scrap Factor %</label><input type="number" className={inp} min={0} max={100} value={compForm.scrapFactor} onChange={e => setCompForm(p => ({ ...p, scrapFactor: parseFloat(e.target.value) || 0 }))} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Remarks</label><input className={inp} placeholder="Optional" value={compForm.remarks} onChange={e => setCompForm(p => ({ ...p, remarks: e.target.value }))} /></div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={compForm.isOptional} onChange={e => setCompForm(p => ({ ...p, isOptional: e.target.checked }))} />
            Optional component
          </label>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => setShowCompModal(false)}>Cancel</button>
            <button className={btnP} onClick={handleAddComponent}>Add Component</button>
          </div>
        </div>
      </Modal>

      {/* Add Alternate Modal */}
      <Modal open={!!showAltModal} onClose={() => setShowAltModal(null)} title="Add Alternate Item">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Alternate Item Name *</label><input className={inp} placeholder="e.g. Aluminium Rod" value={altForm.itemName} onChange={e => setAltForm(p => ({ ...p, itemName: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Item Code</label><input className={inp} value={altForm.itemCode} onChange={e => setAltForm(p => ({ ...p, itemCode: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Unit Cost (₹)</label><input type="number" className={inp} min={0} step="0.01" value={altForm.unitCost} onChange={e => setAltForm(p => ({ ...p, unitCost: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Lead Time (days)</label><input type="number" className={inp} min={0} value={altForm.leadTimeDays} onChange={e => setAltForm(p => ({ ...p, leadTimeDays: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label><input className={inp} placeholder="Optional" value={altForm.notes} onChange={e => setAltForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => setShowAltModal(null)}>Cancel</button>
            <button className={btnP} onClick={handleAddAlternate}>Add Alternate</button>
          </div>
        </div>
      </Modal>

      {/* New Work Order Modal */}
      <Modal open={showWOModal} onClose={() => setShowWOModal(false)} title="Create Work Order">
        <div className="flex flex-col gap-3">
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Product *</label><input className={inp} placeholder="Product name" value={woForm.product} onChange={e => setWoForm(p => ({ ...p, product: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Link BOM</label>
            <select className={inp} value={woForm.bomId} onChange={e => setWoForm(p => ({ ...p, bomId: e.target.value }))}>
              <option value="">— Select BOM (optional) —</option>
              {bomList.filter(b => b.approvalStatus === "Approved").map(b => <option key={b._id} value={b._id}>{b.product} ({b.bomId})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Quantity *</label><input type="number" className={inp} min={1} value={woForm.qty} onChange={e => setWoForm(p => ({ ...p, qty: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Shift</label>
              <select className={inp} value={woForm.shift} onChange={e => setWoForm(p => ({ ...p, shift: e.target.value }))}>
                {["General","Morning","Afternoon","Night"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Priority</label>
              <select className={inp} value={woForm.priority} onChange={e => setWoForm(p => ({ ...p, priority: e.target.value }))}>
                {["Low","Normal","High","Urgent"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Start Date *</label><input type="date" className={inp} value={woForm.startDate} onChange={e => setWoForm(p => ({ ...p, startDate: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">End Date</label><input type="date" className={inp} value={woForm.endDate} onChange={e => setWoForm(p => ({ ...p, endDate: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Remarks</label><textarea className={inp} rows={2} value={woForm.remarks} onChange={e => setWoForm(p => ({ ...p, remarks: e.target.value }))} /></div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => setShowWOModal(false)}>Cancel</button>
            <button className={btnP} onClick={handleCreateWO}>Create Work Order</button>
          </div>
        </div>
      </Modal>

      {/* Update Progress Modal */}
      <Modal open={!!showProgressModal} onClose={() => { setShowProgressModal(null); setProgressVal(''); }} title={`Update Progress — ${showProgressModal?.woId || ""}`}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Target: <strong>{showProgressModal?.qty}</strong> units</p>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Produced Qty</label><input type="number" className={inp} min={0} value={progressVal} onChange={e => setProgressVal(e.target.value)} /></div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => { setShowProgressModal(null); setProgressVal(''); }}>Cancel</button>
            <button className={btnP} onClick={handleUpdateProgress}>Update</button>
          </div>
        </div>
      </Modal>

      {/* QC Modal */}
      <Modal open={!!showQCModal} onClose={() => { setShowQCModal(null); setQcForm(EMPTY_QC); }} title={`Record QC — ${showQCModal?.woId || ""}`}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Passed Qty</label><input type="number" className={inp} min={0} value={qcForm.passedQty} onChange={e => setQcForm(p => ({ ...p, passedQty: e.target.value }))} /></div>
            <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Rejected Qty</label><input type="number" className={inp} min={0} value={qcForm.rejectedQty} onChange={e => setQcForm(p => ({ ...p, rejectedQty: e.target.value }))} /></div>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Defect Type</label><input className={inp} placeholder="e.g. Dimensional, Surface" value={qcForm.defectType} onChange={e => setQcForm(p => ({ ...p, defectType: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Inspected By</label><input className={inp} value={qcForm.inspectedBy} onChange={e => setQcForm(p => ({ ...p, inspectedBy: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Remarks</label><textarea className={inp} rows={2} value={qcForm.remarks} onChange={e => setQcForm(p => ({ ...p, remarks: e.target.value }))} /></div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => { setShowQCModal(null); setQcForm(EMPTY_QC); }}>Cancel</button>
            <button className={btnP} onClick={handleRecordQC}>Submit QC</button>
          </div>
        </div>
      </Modal>

      {/* Approve BOM Modal */}
      <Modal open={!!showApproveModal} onClose={() => setShowApproveModal(null)} title={`Review BOM — ${showApproveModal?.product || ""}`}>
        <div className="flex flex-col gap-3">
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Action</label>
            <select className={inp} value={approveForm.action} onChange={e => setApproveForm(p => ({ ...p, action: e.target.value }))}>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Approver Name</label><input className={inp} value={approveForm.approver} onChange={e => setApproveForm(p => ({ ...p, approver: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Remarks</label><textarea className={inp} rows={2} value={approveForm.remarks} onChange={e => setApproveForm(p => ({ ...p, remarks: e.target.value }))} /></div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => setShowApproveModal(null)}>Cancel</button>
            <button className={btnP} onClick={handleApprove}>{approveForm.action === 'approve' ? 'Approve' : 'Reject'} BOM</button>
          </div>
        </div>
      </Modal>

      {/* Run MRP Modal */}
      <Modal open={showMRPModal} onClose={() => setShowMRPModal(false)} title="Run MRP">
        <div className="flex flex-col gap-3">
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Description</label><input className={inp} placeholder="e.g. May 2026 production run" value={mrpForm.description} onChange={e => setMrpForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div><label className="text-xs font-semibold text-gray-600 mb-1 block">Run By</label><input className={inp} placeholder="Your name" value={mrpForm.runBy} onChange={e => setMrpForm(p => ({ ...p, runBy: e.target.value }))} /></div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Select Work Orders *</label>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {woList.filter(w => ["Released","In-Progress","WIP"].includes(w.status)).length === 0
                ? <p className="text-xs text-gray-400 p-2">No released work orders available.</p>
                : woList.filter(w => ["Released","In-Progress","WIP"].includes(w.status)).map(wo => (
                  <label key={wo._id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-gray-50 rounded">
                    <input type="checkbox"
                      checked={mrpForm.selectedWOs.includes(wo._id)}
                      onChange={e => setMrpForm(p => ({ ...p, selectedWOs: e.target.checked ? [...p.selectedWOs, wo._id] : p.selectedWOs.filter(id => id !== wo._id) }))}
                    />
                    <span className="font-medium">{wo.product}</span>
                    <span className="text-gray-400 text-xs">({wo.woId}, qty: {wo.qty})</span>
                  </label>
                ))
              }
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <button className={btnO} onClick={() => setShowMRPModal(false)}>Cancel</button>
            <button className={btnP} onClick={handleRunMRP}>Run MRP</button>
          </div>
        </div>
      </Modal>

      {/* BOM Explode Modal */}
      <Modal open={!!showExplodeModal} onClose={() => { setShowExplodeModal(null); setExplodeData([]); }} title={`BOM Explosion — ${showExplodeModal?.product || ""}`}>
        <div style={{ overflowX:"auto" }}>
          {explodeData.length === 0 ? <Empty msg="No components to explode." /> : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr>{["Level","Item","Code","Qty","Unit","Type","Unit Cost","Total Cost"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {explodeData.map((c, i) => (
                  <tr key={i} style={{ background: i%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                    <Td style={{ color:"#94a3b8", fontWeight:600 }}>L{c.level}</Td>
                    <Td style={{ fontWeight:600, paddingLeft: `${(c.level - 1) * 16 + 12}px` }}>{c.itemName}</Td>
                    <Td style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{c.itemCode || "—"}</Td>
                    <Td style={{ fontWeight:700, color:"#c0392b" }}>{c.qty}</Td>
                    <Td style={{ color:"#64748b" }}>{c.unit}</Td>
                    <Td><Badge label={c.type} color="#64748b" /></Td>
                    <Td style={{ color:"#64748b" }}>₹{(c.unitCost || 0).toLocaleString()}</Td>
                    <Td style={{ fontWeight:700 }}>₹{Math.round(c.qty * (c.unitCost || 0)).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      {/* Material Consumption Modal */}
      <Modal open={!!showConsumptionModal} onClose={() => setShowConsumptionModal(null)} title={`Material Consumption — ${showConsumptionModal?.woId || ""}`}>
        <div style={{ overflowX:"auto" }}>
          {(showConsumptionModal?.materialConsumption || []).length === 0 ? <Empty msg="No consumption data." /> : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr>{["Item","Code","Planned","Consumed","Unit","Batch","Cost"].map(h => <Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {(showConsumptionModal?.materialConsumption || []).map((m, i) => (
                  <tr key={m._id} style={{ background: i%2===0?"#fff":"#fafafa", borderBottom:"1px solid #f1f5f9" }}>
                    <Td style={{ fontWeight:600 }}>{m.itemName}</Td>
                    <Td style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{m.itemCode || "—"}</Td>
                    <Td style={{ fontWeight:700 }}>{m.plannedQty}</Td>
                    <Td style={{ fontWeight:700, color: m.consumedQty >= m.plannedQty ? "#16a34a" : "#d97706" }}>{m.consumedQty}</Td>
                    <Td style={{ color:"#64748b" }}>{m.unit}</Td>
                    <Td style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{m.batchNo || "—"}</Td>
                    <Td style={{ fontWeight:700 }}>₹{Math.round(m.consumedQty * (m.unitCost || 0)).toLocaleString()}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

    </div>
  );
}
