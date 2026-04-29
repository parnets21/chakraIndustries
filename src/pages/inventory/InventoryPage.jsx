import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import StatusBadge from '../../components/common/StatusBadge';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import StorageLocationPage from './StorageLocationPage';
import PincodeStockPage from './PincodeStockPage';
import { MdWarehouse, MdLocationOn, MdFileDownload as MdDownload, MdSwapHoriz, MdCheckCircle, MdWarning, MdArrowForward } from 'react-icons/md';
import { toast } from '../../components/common/Toast';
import { inventoryApi } from '../../api/inventoryApi';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG_CARD   = '#ffffff';
const BORDER    = '1px solid #e8edf2';
const RADIUS_LG = 18;
const RADIUS_SM = 8;
const SHADOW    = '0 2px 12px rgba(15,23,42,0.06)';
const RED       = '#c0392b';
const RED_LIGHT = '#ef4444';
const AMBER     = '#f59e0b';
const GREEN     = '#22c55e';
const BLUE      = '#3b82f6';
const PURPLE    = '#a855f7';
const TEXT_DARK = '#0f172a';
const TEXT_MID  = '#475569';
const TEXT_LIGHT= '#94a3b8';

const card  = (x = {}) => ({ background: BG_CARD, border: BORDER, borderRadius: RADIUS_LG, boxShadow: SHADOW, ...x });
const inp   = { width:'100%', padding:'8px 12px', border:'1px solid #e2e8f0', borderRadius: RADIUS_SM, fontSize:13, outline:'none', background:'#fff', color: TEXT_DARK, fontFamily:'inherit', boxSizing:'border-box' };
const btnPrimary = { padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' };
const btnOutline = { padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' };

const GRADIENTS = [
  'linear-gradient(135deg,#c0392b,#e74c3c)',
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#0369a1,#3b82f6)',
  'linear-gradient(135deg,#047857,#10b981)',
  'linear-gradient(135deg,#b45309,#f59e0b)',
];

function Spinner() {
  return <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}><div style={{ width:32, height:32, border:'4px solid #fecaca', borderTopColor: RED, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
}

function Empty({ msg = 'No data found' }) {
  return <div style={{ textAlign:'center', padding:'40px 20px', color: TEXT_LIGHT, fontSize:13, fontWeight:600 }}>{msg}</div>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventoryPage({ initialTab = 0, externalShowModal = false, onExternalModalClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // ── Shared data ────────────────────────────────────────────────────────────
  const [stockList,     setStockList]     = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [movementList,  setMovementList]  = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [internalModal, setInternalModal] = useState(false);
  const showModal = externalShowModal || internalModal;
  const closeModal = () => { setInternalModal(false); onExternalModalClose?.(); };

  // ── Forms ──────────────────────────────────────────────────────────────────
  const [stockForm,  setStockForm]  = useState({ sku:'', name:'', qty:'', minQty:'', warehouse:'', unit:'Nos', remarks:'' });
  const [whForm,     setWhForm]     = useState({ warehouseId:'', name:'', location:'', manager:'', capacity:'', phone:'', type:'Raw Material', address:'' });
  const [movForm,    setMovForm]    = useState({ type:'Inward', sku:'', from:'Supplier', to:'', qty:'', ref:'' });
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty,  setAdjustQty]  = useState('');
  const [moveItem,   setMoveItem]   = useState(null);
  const [moveToWH,   setMoveToWH]   = useState('');

  // ── Filters ────────────────────────────────────────────────────────────────
  const [stockFilter, setStockFilter] = useState('All');
  const [whFilter,    setWhFilter]    = useState('All');
  const [stockSearch, setStockSearch] = useState('');
  const [movTab,      setMovTab]      = useState('Inward');
  const [selectedWH,  setSelectedWH]  = useState(null);

  // ── Local-only tabs (no backend yet) ──────────────────────────────────────
  const [pickList,  setPickList]  = useState([]);
  const [sortList,  setSortList]  = useState([]);
  const [packList,  setPackList]  = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [defectList,setDefectList]= useState([]);
  const [defectLog, setDefectLog] = useState([]);
  const [pickForm,  setPickForm]  = useState({ order:'', sku:'', location:'', qty:'', picker:'' });
  const [sortForm,  setSortForm]  = useState({ order:'', sku:'', qty:'', grade:'Grade A', boxType:'Standard Box', weight:'' });
  const [batchForm, setBatchForm] = useState({ batch:'', sku:'', qty:'', warehouse:'', mfg:'', exp:'' });
  const [defectForm,setDefectForm]= useState({ sku:'', qty:'', type:'Dimensional', source:'GRN Inspection', stage:'QC Hold', warehouse:'', remarks:'' });

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [stockRes, whRes, movRes, statsRes] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getWarehouses(),
        inventoryApi.getMovements(),
        inventoryApi.getStats(),
      ]);
      const stock = stockRes.data || [];
      const whs   = whRes.data   || [];
      const movs  = movRes.data  || [];
      setStockList(stock);
      setWarehouseList(whs);
      setMovementList(movs);
      setStats(statsRes.data || null);
      if (whs.length > 0 && !selectedWH) setSelectedWH(whs[0]);
    } catch (e) {
      toast('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { loadAll(); }, [loadAll]);

  // Keep selectedWH in sync when warehouseList updates
  useEffect(() => {
    if (warehouseList.length > 0 && !selectedWH) setSelectedWH(warehouseList[0]);
  }, [warehouseList]); // eslint-disable-line

  // ── Computed values ────────────────────────────────────────────────────────
  const filteredStock = stockList
    .filter(r => stockFilter === 'All' || r.status === stockFilter)
    .filter(r => whFilter    === 'All' || r.warehouse === whFilter)
    .filter(r => !stockSearch || r.sku.toLowerCase().includes(stockSearch.toLowerCase()) || r.name.toLowerCase().includes(stockSearch.toLowerCase()));

  const lowStockItems = stockList.filter(s => s.qty < s.minQty && s.qty > 0);

  const chartData = (() => {
    if (!stats?.byWarehouse) return [{ label:'Active', value: stats?.active || 0, color:'#c0392b' }, { label:'Critical', value: stats?.critical || 0, color:'#f59e0b' }, { label:'Dead', value: stats?.dead || 0, color:'#94a3b8' }];
    return Object.entries(stats.byWarehouse).map(([id, d], i) => ({ label: id, value: d.qty, color: GRADIENTS[i % GRADIENTS.length].match(/#[a-f0-9]{6}/gi)?.[0] || RED }));
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddStock = async () => {
    if (!stockForm.sku || !stockForm.name || !stockForm.qty) { toast('SKU, name and qty are required', 'error'); return; }
    try {
      await inventoryApi.create({ ...stockForm, warehouse: stockForm.warehouse || warehouseList[0]?.warehouseId || 'WH-01' });
      toast(`Stock entry added — ${stockForm.sku}`);
      setStockForm({ sku:'', name:'', qty:'', minQty:'', warehouse:'', unit:'Nos', remarks:'' });
      closeModal(); loadAll();
    } catch (e) { toast(e.message || 'Failed to add stock', 'error'); }
  };

  const handleAddWarehouse = async () => {
    if (!whForm.warehouseId || !whForm.name || !whForm.location) { toast('ID, name and location are required', 'error'); return; }
    try {
      await inventoryApi.createWarehouse(whForm);
      toast(`Warehouse ${whForm.warehouseId} added`);
      setWhForm({ warehouseId:'', name:'', location:'', manager:'', capacity:'', phone:'', type:'Raw Material', address:'' });
      closeModal(); loadAll();
    } catch (e) { toast(e.message || 'Failed to add warehouse', 'error'); }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try { await inventoryApi.deleteWarehouse(id); toast('Warehouse deleted'); loadAll(); }
    catch (e) { toast(e.message || 'Failed to delete', 'error'); }
  };

  const handleRecordMovement = async () => {
    if (!movForm.sku || !movForm.qty || !movForm.from || !movForm.to) { toast('Please fill all required fields', 'error'); return; }
    try {
      await inventoryApi.createMovement(movForm);
      toast('Movement recorded');
      setMovForm({ type:'Inward', sku:'', from:'Supplier', to:'', qty:'', ref:'' });
      closeModal(); loadAll();
    } catch (e) { toast(e.message || 'Failed to record movement', 'error'); }
  };

  const handleAdjustQty = async () => {
    if (!adjustQty) { toast('Enter a quantity', 'error'); return; }
    try {
      await inventoryApi.adjust(adjustItem._id, { qty: adjustQty });
      toast(`${adjustItem.sku} quantity updated to ${adjustQty}`);
      setAdjustItem(null); setAdjustQty(''); loadAll();
    } catch (e) { toast(e.message || 'Failed to adjust', 'error'); }
  };

  const handleMoveStock = async () => {
    if (!moveToWH) { toast('Select destination warehouse', 'error'); return; }
    try {
      await inventoryApi.move(moveItem._id, { toWarehouse: moveToWH });
      toast(`${moveItem.sku} moved to ${moveToWH}`);
      setMoveItem(null); setMoveToWH(''); loadAll();
    } catch (e) { toast(e.message || 'Failed to move', 'error'); }
  };

  const handleDeleteStock = async (id, sku) => {
    if (!window.confirm(`Delete ${sku}?`)) return;
    try { await inventoryApi.delete(id); toast(`${sku} deleted`); loadAll(); }
    catch (e) { toast(e.message || 'Failed to delete', 'error'); }
  };

  const handleExportExcel = (data, filename) => {
    if (!data.length) { toast('No data to export', 'warning'); return; }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, filename);
    toast(`${filename} downloaded`);
  };

  // Local-only handlers (pick/sort/batch/defect — no backend yet)
  const handleCreatePickList = () => {
    if (!pickForm.order || !pickForm.qty) { toast('Order and qty required', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === pickForm.sku);
    setPickList(p => [...p, { id:`PCK-${String(p.length+1).padStart(3,'0')}`, order:pickForm.order, sku:pickForm.sku, item:skuItem?.name||pickForm.sku, qty:parseInt(pickForm.qty), loc:pickForm.location||'—', picker:pickForm.picker||'Unassigned', status:'Pending' }]);
    setPickForm({ order:'', sku:'', location:'', qty:'', picker:'' });
    closeModal(); toast('Pick list created');
  };
  const handleCreateSortJob = () => {
    if (!sortForm.order || !sortForm.qty) { toast('Order and qty required', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === sortForm.sku);
    setSortList(p => [...p, { id:`SRT-${String(p.length+1).padStart(3,'0')}`, sku:sortForm.sku, item:skuItem?.name||sortForm.sku, qty:parseInt(sortForm.qty), grade:sortForm.grade, status:'Pending' }]);
    setPackList(p => [...p, { id:`PKG-${String(p.length+1).padStart(3,'0')}`, order:sortForm.order, items:1, weight:sortForm.weight?`${sortForm.weight} kg`:'—', type:sortForm.boxType, status:'Pending' }]);
    setSortForm({ order:'', sku:'', qty:'', grade:'Grade A', boxType:'Standard Box', weight:'' });
    closeModal(); toast('Sort/Pack job created');
  };
  const handleAddBatch = () => {
    if (!batchForm.batch || !batchForm.qty || !batchForm.mfg || !batchForm.exp) { toast('All fields required', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === batchForm.sku);
    const mfgD = new Date(batchForm.mfg+'-01'), expD = new Date(batchForm.exp+'-01');
    const pct = Math.max(0, Math.min(100, Math.round(((expD - new Date()) / (expD - mfgD)) * 100)));
    setBatchList(p => [...p, { batch:batchForm.batch, sku:batchForm.sku, item:skuItem?.name||batchForm.sku, qty:parseInt(batchForm.qty), mfg:mfgD.toLocaleDateString('en-IN',{month:'short',year:'numeric'}), exp:expD.toLocaleDateString('en-IN',{month:'short',year:'numeric'}), wh:batchForm.warehouse||warehouseList[0]?.warehouseId||'WH-01', status:pct<20?'Critical':'Active', shelfPct:pct }]);
    setBatchForm({ batch:'', sku:'', qty:'', warehouse:'', mfg:'', exp:'' });
    closeModal(); toast('Batch added');
  };
  const handleLogDefect = () => {
    if (!defectForm.sku || !defectForm.qty) { toast('SKU and qty required', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === defectForm.sku);
    const newD = { id:`DEF-${String(defectList.length+1).padStart(3,'0')}`, sku:defectForm.sku, item:skuItem?.name||defectForm.sku, qty:parseInt(defectForm.qty), type:defectForm.type, source:defectForm.source, date:new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short'}), daysAged:0, stage:defectForm.stage };
    setDefectList(p => [...p, newD]);
    setDefectLog(p => [{ event:`${newD.id} — ${newD.item} (${newD.qty} units) flagged at ${newD.source}`, time:new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}), stage:newD.stage, color:newD.stage==='QC Hold'?'#f59e0b':'#ef4444' }, ...p]);
    setDefectForm({ sku:'', qty:'', type:'Dimensional', source:'GRN Inspection', stage:'QC Hold', warehouse:'', remarks:'' });
    closeModal(); toast('Defect logged');
  };

  // ── Ageing computed from real stock ────────────────────────────────────────
  const ageingData = stockList
    .filter(s => s.lastReceivedAt)
    .map(s => {
      const days = Math.floor((Date.now() - new Date(s.lastReceivedAt)) / 86400000);
      const bucket = days > 90 ? '90+' : days > 60 ? '61–90' : days > 30 ? '31–60' : '0–30';
      const actionColor = days > 90 ? '#ef4444' : days > 60 ? '#f59e0b' : '#22c55e';
      const action = days > 90 ? 'Write-off / Return' : days > 60 ? 'Offer Discount' : days > 30 ? 'Monitor' : 'No Action';
      return { sku: s.sku, item: s.name, wh: s.warehouse, qty: s.qty, lastMov: new Date(s.lastReceivedAt).toLocaleDateString('en-IN',{month:'short',year:'numeric'}), days, bucket, action, actionColor };
    })
    .sort((a, b) => b.days - a.days);

  if (loading) return <Spinner />;

  return (
    <div>

      {/* ══ TAB 0 — Stock Dashboard ══════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* ── Low stock alert ── */}
          {lowStockItems.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', background:'linear-gradient(135deg,#fffbeb,#fef9ec)', border:'1px solid #fde68a', borderRadius:14, boxShadow:'0 4px 16px rgba(245,158,11,0.1)', animation:'fadeSlideUp 0.3s ease' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'linear-gradient(135deg,#f59e0b,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(245,158,11,0.4)' }}>
                <MdWarning size={20} color="#fff" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>{lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below minimum stock level</div>
                <div style={{ fontSize:11.5, color:'#b45309', marginTop:3 }}>{lowStockItems.slice(0,4).map(s => s.name).join(' · ')}{lowStockItems.length > 4 && <strong> +{lowStockItems.length - 4} more</strong>}</div>
              </div>
              <button onClick={() => toast('Redirecting to Purchase Requisition…', 'info')} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:'0 3px 12px rgba(245,158,11,0.4)' }}>
                Create PR <MdArrowForward size={14} />
              </button>
            </div>
          )}

          {/* ── Main 2-col grid ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, alignItems:'start' }}>

            {/* ── LEFT: Chart + Movements ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Chart */}
              <div style={{ background:'#fff', borderRadius:18, border:BORDER, boxShadow:SHADOW, overflow:'hidden' }}>
                <div style={{ padding:'18px 22px 14px', borderBottom:BORDER, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:TEXT_DARK }}>Stock by Warehouse</div>
                    <div style={{ fontSize:11.5, color:TEXT_LIGHT, marginTop:2 }}>Total units stored per location</div>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    {[{l:'Active',color:GREEN},{l:'Critical',color:AMBER},{l:'Dead',color:'#94a3b8'}].map(x=>(
                      <div key={x.l} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:TEXT_MID, fontWeight:600 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:x.color }} />{x.l}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding:'18px 22px 14px' }}>
                  {chartData.length > 0 ? <BarChart data={chartData} height={200} /> : <Empty msg="No stock data yet" />}
                </div>
              </div>

              {/* Recent movements */}
              <div style={{ background:'#fff', borderRadius:18, border:BORDER, boxShadow:SHADOW, overflow:'hidden' }}>
                <div style={{ padding:'16px 22px', borderBottom:BORDER, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:TEXT_DARK }}>Recent Movements</div>
                  <span style={{ padding:'3px 10px', borderRadius:20, background:'#f1f5f9', fontSize:11.5, fontWeight:700, color:TEXT_MID }}>{movementList.length} total</span>
                </div>
                {movementList.length === 0 ? (
                  <div style={{ padding:'32px 22px', textAlign:'center', color:TEXT_LIGHT, fontSize:12.5 }}>No movements recorded yet</div>
                ) : movementList.slice(0,6).map((mv, i) => {
                  const tc = mv.type==='Inward' ? '#10b981' : mv.type==='Outward' ? RED_LIGHT : BLUE;
                  const ti = mv.type==='Inward' ? '↓' : mv.type==='Outward' ? '↑' : '⇄';
                  return (
                    <div key={mv._id||i} style={{ display:'flex', alignItems:'center', gap:14, padding:'13px 22px', borderBottom: i < Math.min(movementList.length,6)-1 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:tc+'15', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, color:tc, fontWeight:900, flexShrink:0 }}>{ti}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:TEXT_DARK, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{mv.name || mv.sku}</div>
                        <div style={{ fontSize:11, color:TEXT_LIGHT, marginTop:2 }}>{mv.from} → {mv.to}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:tc }}>{mv.qty}</div>
                        <div style={{ fontSize:10.5, color:TEXT_LIGHT, marginTop:1 }}>units · {new Date(mv.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── RIGHT: Alerts + Warehouse capacity ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Alerts panel */}
              <div style={{ background:'#fff', borderRadius:18, border:BORDER, boxShadow:SHADOW, overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:BORDER, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:14, fontWeight:800, color:TEXT_DARK }}>Stock Alerts</div>
                  {(lowStockItems.length + stockList.filter(s=>s.status==='Dead').length) > 0 ? (
                    <span style={{ padding:'3px 10px', borderRadius:20, background:'#fef2f2', color:RED_LIGHT, fontSize:11.5, fontWeight:700 }}>
                      {lowStockItems.length + stockList.filter(s=>s.status==='Dead').length} issues
                    </span>
                  ) : (
                    <span style={{ padding:'3px 10px', borderRadius:20, background:'#f0fdf4', color:'#16a34a', fontSize:11.5, fontWeight:700 }}>All clear</span>
                  )}
                </div>
                {lowStockItems.length === 0 && stockList.filter(s=>s.status==='Dead').length === 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 20px', gap:8 }}>
                    <MdCheckCircle size={32} color="#22c55e" />
                    <div style={{ fontSize:13, fontWeight:700, color:'#16a34a' }}>All stock levels healthy</div>
                    <div style={{ fontSize:11.5, color:TEXT_LIGHT }}>No alerts at this time</div>
                  </div>
                ) : (
                  <div>
                    {[
                      ...stockList.filter(s=>s.status==='Dead').map(s=>({ label:s.name, sku:s.sku, sub:'Dead stock · 0 units', color:'#94a3b8', leftBar:'#94a3b8', bg:'#fafafa' })),
                      ...lowStockItems.map(s=>({ label:s.name, sku:s.sku, sub:`${s.qty} units · min ${s.minQty}`, color: s.qty < s.minQty*0.5 ? RED_LIGHT : AMBER, leftBar: s.qty < s.minQty*0.5 ? RED_LIGHT : AMBER, bg: s.qty < s.minQty*0.5 ? '#fff8f8' : '#fffdf5' })),
                    ].slice(0,7).map((a,i,arr)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom: i<arr.length-1?'1px solid #f8fafc':'none', background:a.bg, borderLeft:`3px solid ${a.leftBar}` }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, fontWeight:700, color:TEXT_DARK, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.label}</div>
                          <div style={{ fontSize:11, color:TEXT_LIGHT, marginTop:1, fontFamily:'monospace' }}>{a.sku}</div>
                        </div>
                        <div style={{ fontSize:11, fontWeight:700, color:a.color, whiteSpace:'nowrap' }}>{a.sub}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warehouse capacity */}
              <div style={{ background:'#fff', borderRadius:18, border:BORDER, boxShadow:SHADOW, overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:BORDER, display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#c0392b,#e74c3c)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <MdWarehouse size={16} color="#fff" />
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:TEXT_DARK }}>Warehouse Capacity</div>
                  <span style={{ marginLeft:'auto', fontSize:11.5, color:TEXT_LIGHT }}>{warehouseList.length} locations</span>
                </div>
                {warehouseList.length === 0 ? (
                  <div style={{ padding:'24px 20px', textAlign:'center', color:TEXT_LIGHT, fontSize:12 }}>No warehouses configured</div>
                ) : warehouseList.map((wh, i) => {
                  const pct = wh.capacity > 0 ? Math.round((wh.used / wh.capacity) * 100) : 0;
                  const bc  = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
                  return (
                    <div key={i} style={{ padding:'14px 20px', borderBottom: i<warehouseList.length-1?'1px solid #f8fafc':'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <div>
                          <span style={{ fontSize:12.5, fontWeight:800, color:TEXT_DARK }}>{wh.warehouseId||wh.id}</span>
                          <span style={{ fontSize:11, color:TEXT_LIGHT, marginLeft:7 }}>{wh.name}</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, color:TEXT_LIGHT }}>{wh.skus??0} SKUs</span>
                          <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11.5, fontWeight:800, background:bc+'18', color:bc }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height:7, background:'#f1f5f9', borderRadius:4, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:bc, borderRadius:4, transition:'width 0.6s ease' }} />
                      </div>
                      <div style={{ fontSize:10.5, color:TEXT_LIGHT, marginTop:5 }}>
                        {(wh.used||0).toLocaleString()} / {(wh.capacity||0).toLocaleString()} units
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 1 — Stock Table ══════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div style={{ ...card(), overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom: BORDER, background:'#fafbfc', flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:180 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color: TEXT_LIGHT }}>🔍</span>
              <input placeholder="Search SKU or item…" value={stockSearch} onChange={e => setStockSearch(e.target.value)} style={{ ...inp, paddingLeft:32, width:'100%' }} />
            </div>
            <select value={whFilter} onChange={e => setWhFilter(e.target.value)} style={{ ...inp, width:'auto', minWidth:160, cursor:'pointer' }}>
              <option value="All">All Warehouses</option>
              {warehouseList.map(w => <option key={w._id} value={w.warehouseId || w.id}>{w.warehouseId || w.id} — {w.name}</option>)}
            </select>
            <div style={{ display:'flex', gap:6 }}>
              {['All','Active','Critical','Dead'].map(f => (
                <button key={f} onClick={() => setStockFilter(f)} style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, border: stockFilter===f ? 'none' : '1px solid #e2e8f0', background: stockFilter===f ? RED : '#fff', color: stockFilter===f ? '#fff' : TEXT_MID, cursor:'pointer', fontFamily:'inherit' }}>{f}</button>
              ))}
            </div>
            <button onClick={() => handleExportExcel(filteredStock, 'stock-table.xlsx')} style={{ padding:'6px 16px', borderRadius: RADIUS_SM, fontSize:12, fontWeight:600, background:'#f1f5f9', border: BORDER, color: TEXT_MID, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 }}><MdDownload size={14} /> Export</button>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['SKU','Item Name','Warehouse','Qty','Min Qty','Batch / GRN','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10.5, fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom: BORDER, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color: TEXT_LIGHT }}>No stock items found</td></tr>
                ) : filteredStock.map((r, i) => (
                  <tr key={r._id || i} style={{ background: i%2===0 ? '#f8fafc' : '#fff', borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: r.status==='Critical' ? RED_LIGHT : r.status==='Dead' ? '#94a3b8' : GREEN }} />
                        <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color: RED }}>{r.sku}</span>
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', fontWeight:600, color: TEXT_DARK }}>{r.name}</td>
                    <td style={{ padding:'11px 16px', color: TEXT_MID }}>{r.warehouse}</td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700, background: r.qty < r.minQty ? '#fef2f2' : '#f0fdf4', color: r.qty < r.minQty ? RED_LIGHT : GREEN }}>{r.qty}</span>
                    </td>
                    <td style={{ padding:'11px 16px', color: TEXT_MID }}>{r.minQty}</td>
                    <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace', color: TEXT_MID }}>{r.grnId?.grnId || '—'}</td>
                    <td style={{ padding:'11px 16px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { setAdjustItem(r); setAdjustQty(String(r.qty)); }} style={{ padding:'4px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600, border:`1px solid ${RED}`, color: RED, background:'transparent', cursor:'pointer', fontFamily:'inherit' }}>✏ Adjust</button>
                        <button onClick={() => { setMoveItem(r); setMoveToWH(''); }} style={{ padding:'4px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600, border:'1px solid #e2e8f0', color: TEXT_MID, background:'#f8fafc', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}><MdSwapHoriz size={14} /> Move</button>
                        <button onClick={() => handleDeleteStock(r._id, r.sku)} style={{ padding:'4px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600, border:'1px solid #fecaca', color: RED_LIGHT, background:'#fef2f2', cursor:'pointer', fontFamily:'inherit' }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ TAB 2 — Warehouses ══════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div>
          {/* Selector bar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, background:'#fff', borderRadius:14, border: BORDER, padding:'14px 20px', boxShadow: SHADOW, flexWrap:'wrap' }}>
            <MdWarehouse size={18} style={{ color: RED, flexShrink:0 }} />
            <span style={{ fontSize:13, fontWeight:700, color: TEXT_DARK, flexShrink:0 }}>Warehouse:</span>
            <select value={selectedWH?.warehouseId || selectedWH?.id || ''} onChange={e => setSelectedWH(warehouseList.find(w => (w.warehouseId||w.id) === e.target.value))} style={{ flex:1, minWidth:200, maxWidth:320, padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:600, color: TEXT_DARK, background:'#f8fafc', outline:'none', cursor:'pointer', fontFamily:'inherit' }}>
              {warehouseList.map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name} ({w.location})</option>)}
            </select>
            {selectedWH && (() => {
              const pct = selectedWH.capacity > 0 ? Math.round((selectedWH.used / selectedWH.capacity) * 100) : 0;
              const c = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
              return <span style={{ padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, background:c+'18', color:c, border:`1px solid ${c}30` }}>{pct}% used</span>;
            })()}
            <span style={{ marginLeft:'auto', fontSize:12, color: TEXT_LIGHT }}>{warehouseList.length} warehouses</span>
          </div>

          {/* Selected WH detail */}
          {selectedWH && (() => {
            const pct = selectedWH.capacity > 0 ? Math.round((selectedWH.used / selectedWH.capacity) * 100) : 0;
            const barColor = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
            const whStock = stockList.filter(s => s.warehouse === (selectedWH.warehouseId || selectedWH.id));
            return (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                <div style={{ ...card(), overflow:'hidden' }}>
                  <div style={{ background:'linear-gradient(135deg,#c0392b,#e74c3c)', padding:'18px 20px' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{selectedWH.name}</div>
                    <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.75)', marginTop:3 }}>{selectedWH.warehouseId||selectedWH.id} · {selectedWH.location}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'#f1f5f9' }}>
                    {[['Active SKUs', selectedWH.skus ?? 0], ['Manager', selectedWH.manager || '—'], ['Capacity', `${(selectedWH.capacity||0).toLocaleString()} units`], ['Status', '● Active']].map(([label, val], j) => (
                      <div key={j} style={{ background:'#fff', padding:'12px 16px' }}>
                        <div style={{ fontSize:11, color: TEXT_LIGHT, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                        <div style={{ fontSize:14, fontWeight:700, color: TEXT_DARK, marginTop:3 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding:'16px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:12, color: TEXT_MID, fontWeight:600 }}>Capacity Used</span>
                      <span style={{ fontSize:12, fontWeight:700, color: barColor }}>{pct}%</span>
                    </div>
                    <div style={{ height:12, background:'#f1f5f9', borderRadius:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, borderRadius:6, background: barColor, transition:'width 0.5s' }} />
                    </div>
                    <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:4 }}>{(selectedWH.used||0).toLocaleString()} / {(selectedWH.capacity||0).toLocaleString()} units</div>
                  </div>
                  <div style={{ padding:'0 20px 16px' }}>
                    <button onClick={() => handleDeleteWarehouse(selectedWH._id)} style={{ ...btnOutline, fontSize:12, padding:'6px 14px' }}>Delete Warehouse</button>
                  </div>
                </div>

                <div style={{ ...card(), overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom: BORDER, display:'flex', alignItems:'center', gap:8 }}>
                    <MdLocationOn size={16} style={{ color: RED }} />
                    <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Stock in {selectedWH.warehouseId||selectedWH.id}</div>
                    <span style={{ marginLeft:'auto', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#fef2f2', color: RED }}>{whStock.length} SKUs</span>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ background:'#f8fafc' }}>
                          {['SKU','Item','Qty','Status'].map(h => <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10.5, fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom: BORDER }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {whStock.length === 0 ? <tr><td colSpan={4} style={{ padding:'24px', textAlign:'center', color: TEXT_LIGHT, fontSize:13 }}>No stock in this warehouse</td></tr>
                          : whStock.map((r, i) => (
                            <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }} onMouseEnter={e => e.currentTarget.style.background='#fef2f2'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                              <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, fontWeight:700, color: RED }}>{r.sku}</td>
                              <td style={{ padding:'10px 14px', fontSize:12.5, fontWeight:600, color: TEXT_DARK }}>{r.name}</td>
                              <td style={{ padding:'10px 14px' }}><span style={{ padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700, background: r.qty < r.minQty ? '#fef2f2' : '#f0fdf4', color: r.qty < r.minQty ? RED_LIGHT : GREEN }}>{r.qty}</span></td>
                              <td style={{ padding:'10px 14px' }}><StatusBadge status={r.status} /></td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* All warehouses grid */}
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}>
              <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>All Warehouses Overview</div>
            </div>
            {warehouseList.length === 0 ? <Empty msg="No warehouses yet. Click '+ Add Warehouse' to create one." /> : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:1, background:'#f1f5f9' }}>
                {warehouseList.map((wh, i) => {
                  const pct = wh.capacity > 0 ? Math.round((wh.used / wh.capacity) * 100) : 0;
                  const barColor = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
                  return (
                    <div key={wh._id} style={{ background:'#fff', padding:'20px', cursor:'pointer', transition:'background 0.1s' }} onClick={() => setSelectedWH(wh)} onMouseEnter={e => e.currentTarget.style.background='#fef2f2'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background: GRADIENTS[i % GRADIENTS.length], display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><MdWarehouse size={20} /></div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{wh.name}</div>
                          <div style={{ fontSize:11, color: TEXT_LIGHT }}>{wh.warehouseId||wh.id} · {wh.location}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <span style={{ fontSize:11.5, color: TEXT_MID }}>{wh.skus ?? 0} SKUs</span>
                        <span style={{ fontSize:11.5, fontWeight:700, color: barColor }}>{pct}%</span>
                      </div>
                      <div style={{ height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background: barColor, borderRadius:3 }} />
                      </div>
                      <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:4 }}>{(wh.used||0).toLocaleString()} / {(wh.capacity||0).toLocaleString()} units</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 3 — Stock Movement ═══════════════════════════════════════════ */}
      {activeTab === 3 && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {[{ label:'Inward', color: GREEN }, { label:'Outward', color: RED_LIGHT }, { label:'Transfer', color: BLUE }].map(({ label, color }) => (
              <button key={label} onClick={() => setMovTab(label)} style={{ padding:'8px 22px', borderRadius:24, fontSize:13, fontWeight:700, border: movTab===label ? 'none' : '1.5px solid #e2e8f0', background: movTab===label ? color : '#fff', color: movTab===label ? '#fff' : TEXT_MID, cursor:'pointer', fontFamily:'inherit', boxShadow: movTab===label ? `0 3px 10px ${color}40` : 'none', transition:'all 0.15s' }}>{label}</button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:12, color: TEXT_LIGHT, alignSelf:'center' }}>{movementList.filter(m=>m.type===movTab).length} records</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {movementList.filter(m => m.type === movTab).length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:14, color: TEXT_LIGHT, fontWeight:600 }}>No {movTab.toLowerCase()} movements yet</div>
                <button onClick={() => setInternalModal(true)} style={{ marginTop:12, padding:'8px 16px', borderRadius:8, background: BLUE, color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>+ Record Movement</button>
              </div>
            ) : movementList.filter(m => m.type === movTab).map((mv, i) => {
              const typeColor = mv.type==='Inward' ? GREEN : mv.type==='Outward' ? RED_LIGHT : BLUE;
              const typeIcon  = mv.type==='Inward' ? '↓' : mv.type==='Outward' ? '↑' : '⇄';
              return (
                <div key={mv._id||i} style={{ ...card(), padding:'16px 20px', borderLeft:`4px solid ${typeColor}`, display:'flex', alignItems:'center', gap:20 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, background:typeColor+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:typeColor, fontWeight:900 }}>{typeIcon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color: TEXT_DARK }}>{mv.name || mv.sku}</div>
                    <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11.5, fontFamily:'monospace', color: RED, fontWeight:600 }}>{mv.sku}</span>
                      <span style={{ fontSize:11.5, color: TEXT_LIGHT }}>Ref: {mv.ref || '—'}</span>
                      <span style={{ fontSize:11.5, color: TEXT_LIGHT }}>{mv.movementId}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                      <span style={{ fontSize:12, color: TEXT_MID, fontWeight:600 }}>{mv.from}</span>
                      <span style={{ fontSize:14, color: typeColor }}>→</span>
                      <span style={{ fontSize:12, color: TEXT_MID, fontWeight:600 }}>{mv.to}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:20, fontWeight:900, color: typeColor }}>{mv.qty}</div>
                    <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:2 }}>units</div>
                    <div style={{ fontSize:11.5, color: TEXT_MID, marginTop:6, fontWeight:600 }}>{new Date(mv.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TAB 4 — Picking ══════════════════════════════════════════════════ */}
      {activeTab === 4 && (() => {
        const cols = [
          { label:'Pending',     color: AMBER,      items: pickList.filter(p => p.status==='Pending') },
          { label:'In Progress', color: BLUE,        items: pickList.filter(p => p.status==='In Progress') },
          { label:'Completed',   color: GREEN,       items: pickList.filter(p => p.status==='Completed') },
        ];
        return (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {cols.map((col, ci) => (
              <div key={ci} style={{ ...card(), overflow:'hidden' }}>
                <div style={{ background: col.color, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{col.label}</span>
                  <span style={{ background:'rgba(255,255,255,0.3)', color:'#fff', borderRadius:12, padding:'1px 9px', fontSize:12, fontWeight:700 }}>{col.items.length}</span>
                </div>
                <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>
                  {col.items.length === 0 && <div style={{ textAlign:'center', padding:'24px 0', color: TEXT_LIGHT, fontSize:12 }}>No items</div>}
                  {col.items.map((p, pi) => (
                    <div key={pi} style={{ background:'#fff', border: BORDER, borderRadius: RADIUS_SM+4, padding:'14px', boxShadow:'0 1px 4px rgba(15,23,42,0.05)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:800, color: col.color }}>{p.id}</span>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:col.color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color: col.color }}>{(p.picker||'?').slice(0,2).toUpperCase()}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK, marginBottom:4 }}>{p.item}</div>
                      <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginBottom:2 }}>Order: {p.order}</div>
                      <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginBottom:2 }}>SKU: <span style={{ fontFamily:'monospace', color: RED }}>{p.sku}</span></div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                        <span style={{ fontSize:11.5, color: TEXT_MID }}>📍 {p.loc}</span>
                        <span style={{ background:col.color+'18', color:col.color, borderRadius:12, padding:'2px 9px', fontSize:11, fontWeight:700 }}>Qty: {p.qty}</span>
                      </div>
                      {p.status === 'In Progress' && (
                        <button onClick={() => setPickList(prev => prev.map(x => x.id===p.id ? {...x, status:'Completed'} : x))} style={{ marginTop:10, width:'100%', padding:'6px', borderRadius:8, background: GREEN, color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Mark Complete</button>
                      )}
                      {p.status === 'Pending' && (
                        <button onClick={() => setPickList(prev => prev.map(x => x.id===p.id ? {...x, status:'In Progress'} : x))} style={{ marginTop:10, width:'100%', padding:'6px', borderRadius:8, background: BLUE, color:'#fff', border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>▶ Start Picking</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ══ TAB 5 — Sorting & Packing ════════════════════════════════════════ */}
      {activeTab === 5 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}><div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Sorting Queue</div></div>
            {sortList.length === 0 ? <Empty msg="No sort jobs yet" /> : sortList.map((s, i) => (
              <div key={i} style={{ padding:'14px 20px', borderBottom: i<sortList.length-1 ? BORDER : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{s.item}</div>
                  <div style={{ fontSize:11.5, color: TEXT_LIGHT }}>{s.id} · {s.sku} · {s.grade}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, fontWeight:700, color: BLUE }}>{s.qty} units</span>
                  <StatusBadge status={s.status} />
                  {s.status !== 'Sorted' && <button onClick={() => setSortList(p => p.map(x => x.id===s.id ? {...x, status:'Sorted'} : x))} style={{ padding:'3px 10px', borderRadius:8, background: GREEN, color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Done</button>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}><div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Packing Queue</div></div>
            {packList.length === 0 ? <Empty msg="No pack jobs yet" /> : packList.map((p, i) => (
              <div key={i} style={{ padding:'14px 20px', borderBottom: i<packList.length-1 ? BORDER : 'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{p.id}</div>
                  <div style={{ fontSize:11.5, color: TEXT_LIGHT }}>Order: {p.order} · {p.type} · {p.weight}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <StatusBadge status={p.status} />
                  {p.status !== 'Packed' && <button onClick={() => setPackList(prev => prev.map(x => x.id===p.id ? {...x, status:'Packed'} : x))} style={{ padding:'3px 10px', borderRadius:8, background: GREEN, color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Packed</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB 6 — Batch Tracking ═══════════════════════════════════════════ */}
      {activeTab === 6 && (
        <div style={{ ...card(), overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom: BORDER }}><div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Batch Register</div></div>
          {batchList.length === 0 ? <Empty msg="No batches yet. Click '+ Add Batch' to create one." /> : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['Batch No.','SKU','Item','Qty','Mfg','Expiry','Warehouse','Shelf Life','Status'].map(h => <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10.5, fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom: BORDER, whiteSpace:'nowrap' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {batchList.map((b, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding:'11px 16px', fontFamily:'monospace', fontWeight:700, color: RED }}>{b.batch}</td>
                      <td style={{ padding:'11px 16px', fontFamily:'monospace', fontSize:12, color: TEXT_MID }}>{b.sku}</td>
                      <td style={{ padding:'11px 16px', fontWeight:600, color: TEXT_DARK }}>{b.item}</td>
                      <td style={{ padding:'11px 16px', fontWeight:700, color: BLUE }}>{b.qty}</td>
                      <td style={{ padding:'11px 16px', color: TEXT_MID }}>{b.mfg}</td>
                      <td style={{ padding:'11px 16px', color: TEXT_MID }}>{b.exp}</td>
                      <td style={{ padding:'11px 16px', color: TEXT_MID }}>{b.wh}</td>
                      <td style={{ padding:'11px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                            <div style={{ height:'100%', width:`${b.shelfPct}%`, background: b.shelfPct < 20 ? RED_LIGHT : b.shelfPct < 50 ? AMBER : GREEN, borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:11, fontWeight:700, color: b.shelfPct < 20 ? RED_LIGHT : TEXT_MID }}>{b.shelfPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'11px 16px' }}><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 7 — Ageing Stock ═════════════════════════════════════════════ */}
      {activeTab === 7 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
            {[
              { label:'0–30 Days',  value: ageingData.filter(a=>a.bucket==='0–30').length,  color: GREEN     },
              { label:'31–60 Days', value: ageingData.filter(a=>a.bucket==='31–60').length, color: AMBER     },
              { label:'61–90 Days', value: ageingData.filter(a=>a.bucket==='61–90').length, color: '#f97316' },
              { label:'90+ Days',   value: ageingData.filter(a=>a.bucket==='90+').length,   color: RED_LIGHT },
            ].map((k, i) => (
              <div key={i} style={{ ...card(), padding:'18px 20px' }}>
                <div style={{ fontSize:24, fontWeight:900, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:11.5, color:TEXT_LIGHT, marginTop:4 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}><div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Ageing Analysis — computed from last received date</div></div>
            {ageingData.length === 0 ? <Empty msg="No ageing data — stock items with lastReceivedAt will appear here" /> : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['SKU','Item','Warehouse','Qty','Last Received','Days','Bucket','Recommended Action'].map(h => <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10.5, fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom: BORDER, whiteSpace:'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {ageingData.map((r, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0 ? '#f8fafc' : '#fff' }}>
                        <td style={{ padding:'11px 16px', fontFamily:'monospace', fontWeight:700, color: RED }}>{r.sku}</td>
                        <td style={{ padding:'11px 16px', fontWeight:600, color: TEXT_DARK }}>{r.item}</td>
                        <td style={{ padding:'11px 16px', color: TEXT_MID }}>{r.wh}</td>
                        <td style={{ padding:'11px 16px', fontWeight:700, color: BLUE }}>{r.qty}</td>
                        <td style={{ padding:'11px 16px', color: TEXT_MID }}>{r.lastMov}</td>
                        <td style={{ padding:'11px 16px' }}><span style={{ fontWeight:700, color: r.days > 90 ? RED_LIGHT : r.days > 60 ? '#f97316' : r.days > 30 ? AMBER : GREEN }}>{r.days}d</span></td>
                        <td style={{ padding:'11px 16px' }}><span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700, background: r.days>90 ? '#fef2f2' : r.days>60 ? '#fff7ed' : r.days>30 ? '#fffbeb' : '#f0fdf4', color: r.actionColor }}>{r.bucket}</span></td>
                        <td style={{ padding:'11px 16px' }}><span style={{ fontSize:12, fontWeight:600, color: r.actionColor }}>{r.action}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 8 — Defective Stock ══════════════════════════════════════════ */}
      {activeTab === 8 && (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}><div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Defective Items</div></div>
            {defectList.length === 0 ? <Empty msg="No defects logged yet" /> : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc' }}>
                      {['ID','SKU','Item','Qty','Type','Source','Date','Stage','Actions'].map(h => <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10.5, fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom: BORDER, whiteSpace:'nowrap' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {defectList.map((d, i) => (
                      <tr key={i} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'10px 14px', fontFamily:'monospace', fontWeight:700, color: RED_LIGHT }}>{d.id}</td>
                        <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, color: RED }}>{d.sku}</td>
                        <td style={{ padding:'10px 14px', fontWeight:600, color: TEXT_DARK }}>{d.item}</td>
                        <td style={{ padding:'10px 14px', fontWeight:700, color: RED_LIGHT }}>{d.qty}</td>
                        <td style={{ padding:'10px 14px', color: TEXT_MID }}>{d.type}</td>
                        <td style={{ padding:'10px 14px', color: TEXT_MID }}>{d.source}</td>
                        <td style={{ padding:'10px 14px', color: TEXT_MID }}>{d.date}</td>
                        <td style={{ padding:'10px 14px' }}><StatusBadge status={d.stage} /></td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:4 }}>
                            {['Repair','Scrap'].map(a => <button key={a} onClick={() => setDefectList(p => p.map(x => x.id===d.id ? {...x, stage: a==='Scrap'?'Disposed':'Repair'} : x))} style={{ padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600, border:'1px solid #e2e8f0', color: TEXT_MID, background:'#f8fafc', cursor:'pointer', fontFamily:'inherit' }}>{a}</button>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}><div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Defect Log</div></div>
            {defectLog.length === 0 ? <Empty msg="No log entries yet" /> : defectLog.map((l, i) => (
              <div key={i} style={{ padding:'12px 20px', borderBottom: i<defectLog.length-1 ? BORDER : 'none', borderLeft:`4px solid ${l.color}`, background: l.color+'08' }}>
                <div style={{ fontSize:12, fontWeight:600, color: TEXT_DARK }}>{l.event}</div>
                <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:3 }}>{l.time} · {l.stage}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TAB 9 — Storage Locations ════════════════════════════════════════ */}
      {activeTab === 9 && <StorageLocationPage />}

      {/* ══ TAB 10 — Pincode Stock ═══════════════════════════════════════════ */}
      {activeTab === 10 && <PincodeStockPage />}

      {/* ══ MODALS ═══════════════════════════════════════════════════════════ */}

      {/* Add Stock (tab 0 & 1) */}
      {(activeTab === 0 || activeTab === 1) && (
        <Modal open={showModal} onClose={closeModal} title="Add Stock Entry" size="lg"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleAddStock}>Add Stock</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{ label:'SKU *', key:'sku', placeholder:'e.g. SKU-1042' }, { label:'Item Name *', key:'name', placeholder:'Item description' }, { label:'Quantity *', key:'qty', placeholder:'0', type:'number' }, { label:'Min Qty (reorder level)', key:'minQty', placeholder:'0', type:'number' }, { label:'Unit', key:'unit', placeholder:'Nos / Kg / Ltr' }].map(f => (
              <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>{f.label}</label>
                <input type={f.type||'text'} placeholder={f.placeholder} value={stockForm[f.key]} onChange={e => setStockForm(p=>({...p,[f.key]:e.target.value}))} style={inp} />
              </div>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse</label>
              <select value={stockForm.warehouse} onChange={e => setStockForm(p=>({...p,warehouse:e.target.value}))} style={inp}>
                <option value="">— Select Warehouse —</option>
                {warehouseList.map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Remarks</label>
            <textarea placeholder="Optional notes…" value={stockForm.remarks} onChange={e => setStockForm(p=>({...p,remarks:e.target.value}))} style={{ ...inp, minHeight:64, resize:'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Add Warehouse (tab 2) */}
      {activeTab === 2 && (
        <Modal open={showModal} onClose={closeModal} title="Add New Warehouse"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleAddWarehouse}>Save Warehouse</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{ label:'Warehouse ID *', key:'warehouseId', placeholder:'e.g. WH-04' }, { label:'Warehouse Name *', key:'name', placeholder:'e.g. North Godown' }, { label:'Location *', key:'location', placeholder:'City / Area' }, { label:'Manager Name', key:'manager', placeholder:'Full name' }, { label:'Capacity (units)', key:'capacity', placeholder:'0', type:'number' }, { label:'Contact Phone', key:'phone', placeholder:'10-digit number' }].map((f, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>{f.label}</label>
                <input type={f.type||'text'} placeholder={f.placeholder} value={whForm[f.key]} onChange={e => setWhForm(p=>({...p,[f.key]:e.target.value}))} style={inp} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Address</label>
            <textarea placeholder="Full address…" value={whForm.address} onChange={e => setWhForm(p=>({...p,address:e.target.value}))} style={{ ...inp, minHeight:56, resize:'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Record Movement (tab 3) */}
      {activeTab === 3 && (
        <Modal open={showModal} onClose={closeModal} title="Record Stock Movement"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleRecordMovement}>Record Movement</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Movement Type *</label>
              <select value={movForm.type} onChange={e => setMovForm(p=>({...p,type:e.target.value}))} style={inp}><option>Inward</option><option>Outward</option><option>Transfer</option></select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label>
              <select value={movForm.sku} onChange={e => setMovForm(p=>({...p,sku:e.target.value}))} style={inp}>
                <option value="">— Select SKU —</option>
                {stockList.map(s => <option key={s._id} value={s.sku}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>From *</label>
              <select value={movForm.from} onChange={e => setMovForm(p=>({...p,from:e.target.value}))} style={inp}>
                <option value="Supplier">Supplier</option>
                {warehouseList.map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name}</option>)}
                <option value="Production">Production</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>To *</label>
              <select value={movForm.to} onChange={e => setMovForm(p=>({...p,to:e.target.value}))} style={inp}>
                <option value="">— Select —</option>
                {warehouseList.map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name}</option>)}
                <option value="Production">Production</option>
                <option value="Dispatch">Dispatch</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Quantity *</label>
              <input type="number" placeholder="0" value={movForm.qty} onChange={e => setMovForm(p=>({...p,qty:e.target.value}))} style={inp} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Reference No.</label>
              <input type="text" placeholder="e.g. GRN-0234 / WO-0891" value={movForm.ref} onChange={e => setMovForm(p=>({...p,ref:e.target.value}))} style={inp} />
            </div>
          </div>
        </Modal>
      )}

      {/* New Pick List (tab 4) */}
      {activeTab === 4 && (
        <Modal open={showModal} onClose={closeModal} title="Create Pick List"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleCreatePickList}>Create Pick List</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Order Reference *</label><input placeholder="e.g. ORD-2024-090" value={pickForm.order} onChange={e => setPickForm(p=>({...p,order:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label><select value={pickForm.sku} onChange={e => setPickForm(p=>({...p,sku:e.target.value}))} style={inp}><option value="">— Select SKU —</option>{stockList.map(s => <option key={s._id} value={s.sku}>{s.sku} — {s.name}</option>)}</select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Storage Location</label><input placeholder="e.g. Zone A / Rack R2" value={pickForm.location} onChange={e => setPickForm(p=>({...p,location:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Qty to Pick *</label><input type="number" placeholder="0" value={pickForm.qty} onChange={e => setPickForm(p=>({...p,qty:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Assign Picker</label><input placeholder="Picker name" value={pickForm.picker} onChange={e => setPickForm(p=>({...p,picker:e.target.value}))} style={inp} /></div>
          </div>
        </Modal>
      )}

      {/* New Sort Job (tab 5) */}
      {activeTab === 5 && (
        <Modal open={showModal} onClose={closeModal} title="Create Sort / Pack Job"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleCreateSortJob}>Create Job</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Order Reference *</label><input placeholder="e.g. ORD-2024-089" value={sortForm.order} onChange={e => setSortForm(p=>({...p,order:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label><select value={sortForm.sku} onChange={e => setSortForm(p=>({...p,sku:e.target.value}))} style={inp}><option value="">— Select SKU —</option>{stockList.map(s => <option key={s._id} value={s.sku}>{s.sku} — {s.name}</option>)}</select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Quantity *</label><input type="number" placeholder="0" value={sortForm.qty} onChange={e => setSortForm(p=>({...p,qty:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Grade</label><select value={sortForm.grade} onChange={e => setSortForm(p=>({...p,grade:e.target.value}))} style={inp}><option>Grade A</option><option>Grade B</option><option>Grade C</option></select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Box / Package Type</label><select value={sortForm.boxType} onChange={e => setSortForm(p=>({...p,boxType:e.target.value}))} style={inp}><option>Standard Box</option><option>Custom Branded</option><option>Bulk Loose</option></select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Weight (kg)</label><input type="number" placeholder="0" value={sortForm.weight} onChange={e => setSortForm(p=>({...p,weight:e.target.value}))} style={inp} /></div>
          </div>
        </Modal>
      )}

      {/* Add Batch (tab 6) */}
      {activeTab === 6 && (
        <Modal open={showModal} onClose={closeModal} title="Add New Batch"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleAddBatch}>Add Batch</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Batch Number *</label><input placeholder="e.g. B-2024-05" value={batchForm.batch} onChange={e => setBatchForm(p=>({...p,batch:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label><select value={batchForm.sku} onChange={e => setBatchForm(p=>({...p,sku:e.target.value}))} style={inp}><option value="">— Select SKU —</option>{stockList.map(s => <option key={s._id} value={s.sku}>{s.sku} — {s.name}</option>)}</select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Quantity *</label><input type="number" placeholder="0" value={batchForm.qty} onChange={e => setBatchForm(p=>({...p,qty:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse</label><select value={batchForm.warehouse} onChange={e => setBatchForm(p=>({...p,warehouse:e.target.value}))} style={inp}><option value="">— Select —</option>{warehouseList.map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name}</option>)}</select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Mfg Date *</label><input type="month" value={batchForm.mfg} onChange={e => setBatchForm(p=>({...p,mfg:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Expiry Date *</label><input type="month" value={batchForm.exp} onChange={e => setBatchForm(p=>({...p,exp:e.target.value}))} style={inp} /></div>
          </div>
        </Modal>
      )}

      {/* Log Defect (tab 8) */}
      {activeTab === 8 && (
        <Modal open={showModal} onClose={closeModal} title="Log Defective Stock"
          footer={<><button style={btnOutline} onClick={closeModal}>Cancel</button><button style={btnPrimary} onClick={handleLogDefect}>Log Defect</button></>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label><select value={defectForm.sku} onChange={e => setDefectForm(p=>({...p,sku:e.target.value}))} style={inp}><option value="">— Select SKU —</option>{stockList.map(s => <option key={s._id} value={s.sku}>{s.sku} — {s.name}</option>)}</select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Defective Qty *</label><input type="number" placeholder="0" value={defectForm.qty} onChange={e => setDefectForm(p=>({...p,qty:e.target.value}))} style={inp} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Defect Type</label><select value={defectForm.type} onChange={e => setDefectForm(p=>({...p,type:e.target.value}))} style={inp}><option>Dimensional</option><option>Surface Defect</option><option>Packaging Damage</option><option>Functional Failure</option></select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Source</label><select value={defectForm.source} onChange={e => setDefectForm(p=>({...p,source:e.target.value}))} style={inp}><option>GRN Inspection</option><option>Production</option><option>Customer Return</option><option>Internal Audit</option></select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Stage</label><select value={defectForm.stage} onChange={e => setDefectForm(p=>({...p,stage:e.target.value}))} style={inp}><option>QC Hold</option><option>Defective Bin</option><option>Repair</option><option>Scrap</option></select></div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}><label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse</label><select value={defectForm.warehouse} onChange={e => setDefectForm(p=>({...p,warehouse:e.target.value}))} style={inp}><option value="">— Select —</option>{warehouseList.map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name}</option>)}</select></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Remarks</label>
            <textarea placeholder="Describe the defect…" value={defectForm.remarks} onChange={e => setDefectForm(p=>({...p,remarks:e.target.value}))} style={{ ...inp, minHeight:56, resize:'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Adjust Quantity */}
      <Modal open={!!adjustItem} onClose={() => { setAdjustItem(null); setAdjustQty(''); }} title={`Adjust Quantity — ${adjustItem?.sku}`}
        footer={<><button style={btnOutline} onClick={() => { setAdjustItem(null); setAdjustQty(''); }}>Cancel</button><button style={btnPrimary} onClick={handleAdjustQty}>Save</button></>}>
        {adjustItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:10, fontSize:13 }}>
              <strong>{adjustItem.name}</strong> · Current qty: <strong style={{ color: RED }}>{adjustItem.qty}</strong> · Min: {adjustItem.minQty}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>New Quantity *</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={inp} autoFocus />
            </div>
          </div>
        )}
      </Modal>

      {/* Move Stock */}
      <Modal open={!!moveItem} onClose={() => { setMoveItem(null); setMoveToWH(''); }} title={`Move Stock — ${moveItem?.sku}`}
        footer={<><button style={btnOutline} onClick={() => { setMoveItem(null); setMoveToWH(''); }}>Cancel</button><button style={btnPrimary} onClick={handleMoveStock}>Move</button></>}>
        {moveItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:10, fontSize:13 }}>
              <strong>{moveItem.name}</strong> · Currently in: <strong style={{ color: RED }}>{moveItem.warehouse}</strong>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Move to Warehouse *</label>
              <select value={moveToWH} onChange={e => setMoveToWH(e.target.value)} style={inp}>
                <option value="">— Select Warehouse —</option>
                {warehouseList.filter(w => (w.warehouseId||w.id) !== moveItem.warehouse).map(w => <option key={w._id} value={w.warehouseId||w.id}>{w.warehouseId||w.id} — {w.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
