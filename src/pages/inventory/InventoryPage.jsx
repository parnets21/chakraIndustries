import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import StorageLocationPage from './StorageLocationPage';
import PincodeStockPage from './PincodeStockPage';
import { MdWarehouse, MdLocationOn, MdAdd } from 'react-icons/md';
import { toast } from '../../components/common/Toast';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BG_CARD   = '#ffffff';
const BORDER    = '1px solid #e8edf2';
const RADIUS_LG = 18;
const RADIUS_MD = 12;
const RADIUS_SM = 8;
const SHADOW_CARD  = '0 2px 12px rgba(15,23,42,0.06)';
const RED       = '#c0392b';
const RED_LIGHT = '#ef4444';
const AMBER     = '#f59e0b';
const GREEN     = '#22c55e';
const BLUE      = '#3b82f6';
const PURPLE    = '#a855f7';
const TEXT_DARK = '#0f172a';
const TEXT_MID  = '#475569';
const TEXT_LIGHT= '#94a3b8';

const stockData = [
  { sku:'SKU-1042', name:'Bearing 6205',      warehouse:'WH-01', qty:12,  batch:'B-2024-04', minQty:50, status:'Critical' },
  { sku:'SKU-2187', name:'Oil Seal 35x52',    warehouse:'WH-02', qty:8,   batch:'B-2024-03', minQty:30, status:'Critical' },
  { sku:'SKU-0934', name:'Gasket Set A',       warehouse:'WH-01', qty:5,   batch:'B-2024-04', minQty:25, status:'Critical' },
  { sku:'SKU-3301', name:'Piston Ring 80mm',   warehouse:'WH-03', qty:340, batch:'B-2024-02', minQty:40, status:'Active'   },
  { sku:'SKU-4412', name:'Crankshaft Seal',    warehouse:'WH-01', qty:220, batch:'B-2024-04', minQty:20, status:'Active'   },
  { sku:'SKU-5523', name:'Valve Spring Set',   warehouse:'WH-02', qty:180, batch:'B-2024-03', minQty:30, status:'Active'   },
  { sku:'SKU-6634', name:'Timing Chain Kit',   warehouse:'WH-03', qty:0,   batch:'B-2024-01', minQty:10, status:'Dead'     },
  { sku:'SKU-7745', name:'Clutch Plate Set',   warehouse:'WH-01', qty:95,  batch:'B-2024-04', minQty:15, status:'Active'   },
];

const warehouses = [
  { id:'WH-01', name:'Main Warehouse',  location:'Pune - Sector 4', capacity:5000, used:3200, skus:142, manager:'Rajesh Patil' },
  { id:'WH-02', name:'Secondary Store', location:'Pune - Sector 7', capacity:2000, used:1100, skus:68,  manager:'Meena Joshi'  },
  { id:'WH-03', name:'Finished Goods',  location:'Nashik Plant',    capacity:3000, used:2400, skus:95,  manager:'Suresh Rao'   },
];

const movements = [
  { id:'MV-001', type:'Inward',   sku:'SKU-3301', name:'Piston Ring 80mm',  qty:200, from:'Supplier', to:'WH-01',      date:'14 Apr', ref:'GRN-0234' },
  { id:'MV-002', type:'Outward',  sku:'SKU-4412', name:'Crankshaft Seal',   qty:50,  from:'WH-01',    to:'Production', date:'14 Apr', ref:'WO-0891'  },
  { id:'MV-003', type:'Transfer', sku:'SKU-5523', name:'Valve Spring Set',  qty:30,  from:'WH-02',    to:'WH-01',      date:'13 Apr', ref:'TR-0045'  },
  { id:'MV-004', type:'Inward',   sku:'SKU-7745', name:'Clutch Plate Set',  qty:100, from:'Supplier', to:'WH-03',      date:'13 Apr', ref:'GRN-0233' },
];

const stockChartData = [
  { label:'Raw Mat',  value:4200, color:'#c0392b' },
  { label:'WIP',      value:1800, color:'#f39c12' },
  { label:'Finished', value:3100, color:'#27ae60' },
  { label:'Dead',     value:420,  color:'#7f8c8d' },
];

const pickData = [
  { id:'PCK-001', order:'ORD-2024-089', sku:'SKU-3301', item:'Piston Ring 80mm', qty:50, loc:'WH-01 / A3', picker:'Ramesh', status:'Completed' },
  { id:'PCK-002', order:'ORD-2024-089', sku:'SKU-4412', item:'Crankshaft Seal',  qty:20, loc:'WH-01 / B2', picker:'Suresh', status:'In Progress' },
  { id:'PCK-003', order:'ORD-2024-087', sku:'SKU-5523', item:'Valve Spring Set', qty:30, loc:'WH-02 / B1', picker:'Anil',   status:'Pending' },
];

const sortData = [
  { id:'SRT-001', sku:'SKU-3301', item:'Piston Ring 80mm', qty:200, grade:'Grade A', status:'Sorted' },
  { id:'SRT-002', sku:'SKU-1042', item:'Bearing 6205',     qty:50,  grade:'Grade B', status:'Pending' },
  { id:'SRT-003', sku:'SKU-7745', item:'Clutch Plate Set', qty:80,  grade:'Grade A', status:'In Progress' },
];

const packData = [
  { id:'PKG-001', order:'ORD-2024-089', items:3, weight:'42 kg', type:'Standard Box',    status:'Packed'  },
  { id:'PKG-002', order:'ORD-2024-087', items:5, weight:'68 kg', type:'Custom Branded',  status:'Packing' },
  { id:'PKG-003', order:'ORD-2024-085', items:2, weight:'28 kg', type:'Bulk Loose',       status:'Pending' },
];

const batchData = [
  { batch:'B-2024-04', sku:'SKU-3301', item:'Piston Ring 80mm', qty:340, mfg:'Apr 2024', exp:'Apr 2026', wh:'WH-03', status:'Active',   shelfPct:90 },
  { batch:'B-2024-03', sku:'SKU-5523', item:'Valve Spring Set', qty:180, mfg:'Mar 2024', exp:'Mar 2026', wh:'WH-02', status:'Active',   shelfPct:85 },
  { batch:'B-2024-01', sku:'SKU-6634', item:'Timing Chain Kit', qty:0,   mfg:'Jan 2024', exp:'Jan 2026', wh:'WH-03', status:'Dead',     shelfPct:10 },
  { batch:'B-2023-12', sku:'SKU-1042', item:'Bearing 6205',     qty:12,  mfg:'Dec 2023', exp:'Dec 2025', wh:'WH-01', status:'Critical', shelfPct:40 },
];

const ageingData = [
  { sku:'SKU-6634', item:'Timing Chain Kit', wh:'WH-03', qty:0,  lastMov:'Jan 2024', days:105, bucket:'90+',   value:'₹0',      action:'Write-off',          actionColor:'#ef4444' },
  { sku:'SKU-0934', item:'Gasket Set A',      wh:'WH-01', qty:5,  lastMov:'Dec 2023', days:120, bucket:'90+',   value:'₹3,250',  action:'Return to Supplier', actionColor:'#ef4444' },
  { sku:'SKU-2187', item:'Oil Seal 35x52',    wh:'WH-02', qty:8,  lastMov:'Jan 2024', days:75,  bucket:'61–90', value:'₹920',    action:'Offer Discount',     actionColor:'#f59e0b' },
  { sku:'SKU-1042', item:'Bearing 6205',      wh:'WH-01', qty:12, lastMov:'Feb 2024', days:45,  bucket:'31–60', value:'₹1,440',  action:'Monitor',            actionColor:'#f59e0b' },
  { sku:'SKU-7745', item:'Clutch Plate Set',  wh:'WH-01', qty:95, lastMov:'Mar 2024', days:20,  bucket:'0–30',  value:'₹28,500', action:'No Action',          actionColor:'#22c55e' },
];

const defectData = [
  { id:'DEF-001', sku:'SKU-1042', item:'Bearing 6205',     qty:3, type:'Dimensional',     source:'GRN Inspection',  date:'14 Apr', daysAged:1, stage:'QC Hold'      },
  { id:'DEF-002', sku:'SKU-4412', item:'Crankshaft Seal',  qty:5, type:'Surface Defect',  source:'Production',      date:'13 Apr', daysAged:2, stage:'Defective Bin' },
  { id:'DEF-003', sku:'SKU-7745', item:'Clutch Plate Set', qty:2, type:'Packaging Damage',source:'Customer Return', date:'12 Apr', daysAged:3, stage:'Repair'        },
];

const defectLog = [
  { event:'DEF-001 — Bearing 6205 (3 units) flagged at GRN QC',          time:'14 Apr, 09:15 AM', stage:'QC Hold',      color:'#f59e0b' },
  { event:'DEF-002 — Crankshaft Seal (5 units) moved to Defective Bin',  time:'13 Apr, 02:00 PM', stage:'Defective Bin',color:'#ef4444' },
  { event:'DEF-003 — Clutch Plate Set (2 units) sent for Repair',        time:'12 Apr, 11:00 AM', stage:'Repair',       color:'#3b82f6' },
  { event:'DEF-000 — Oil Seal (4 units) scrapped & written off',         time:'10 Apr, 04:00 PM', stage:'Disposed',     color:'#6b7280' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const card = (extra={}) => ({
  background: BG_CARD, border: BORDER, borderRadius: RADIUS_LG,
  boxShadow: SHADOW_CARD, ...extra,
});

const inputStyle = {
  width:'100%', padding:'8px 12px', border:'1px solid #e2e8f0',
  borderRadius: RADIUS_SM, fontSize:13, outline:'none',
  background:'#fff', color: TEXT_DARK, fontFamily:'inherit',
  boxSizing:'border-box',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color: TEXT_DARK }}>{title}</div>
        {subtitle && <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginTop:2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function Pill({ label, color, bg }) {
  return (
    <span style={{
      display:'inline-block', padding:'3px 10px', borderRadius:20,
      fontSize:11, fontWeight:700, background: bg || color+'18', color,
    }}>{label}</span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InventoryPage({ initialTab = 0, externalShowModal = false, onExternalModalClose }) {
  const [activeTab, setActiveTab]     = useState(initialTab);
  const [movTab, setMovTab]           = useState('Inward');
  const [internalModal, setInternalModal] = useState(false);
  const [stockFilter, setStockFilter] = useState('All');
  const [whFilter, setWhFilter]       = useState('All');
  const [stockSearch, setStockSearch] = useState('');
  const [selectedWH, setSelectedWH]   = useState(warehouses[0]);
  const [adjustModal, setAdjustModal] = useState(false);
  const [moveModal, setMoveModal]     = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [moveToWarehouse, setMoveToWarehouse] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [adjustType, setAdjustType] = useState('Add Stock');
  const [adjustQty, setAdjustQty] = useState('');
  
  // Movement form state
  const [movementList, setMovementList] = useState(movements);
  const [movementForm, setMovementForm] = useState({
    type: 'Inward',
    sku: '',
    from: 'Supplier',
    to: '',
    qty: '',
    ref: '',
  });
  const [successMsg, setSuccessMsg] = useState('');

  // Picking form state
  const [pickingList, setPickingList] = useState(pickData);
  const [pickingForm, setPickingForm] = useState({
    order: '',
    warehouse: '',
    sku: '',
    location: '',
    qty: '',
    picker: '',
    priority: 'Normal',
    notes: '',
  });

  // Mutable data state
  const [stockList, setStockList]       = useState(stockData);
  const [warehouseList, setWarehouseList] = useState(warehouses);
  const [movementList, setMovementList] = useState(movements);
  const [pickList, setPickList]         = useState(pickData);
  const [sortList, setSortList]         = useState(sortData);
  const [packList, setPackList]         = useState(packData);
  const [batchList, setBatchList]       = useState(batchData);
  const [defectList, setDefectList]     = useState(defectData);
  const [defectLogList, setDefectLogList] = useState(defectLog);

  // Adjust/Move modal state
  const [adjustItem, setAdjustItem]   = useState(null);
  const [moveItem, setMoveItem]       = useState(null);
  const [adjustQty, setAdjustQty]     = useState('');
  const [moveToWH, setMoveToWH]       = useState('');

  // merge external trigger (from PageHeader button) with any internal triggers
  const showModal = externalShowModal || internalModal;
  const closeModal = () => { setInternalModal(false); onExternalModalClose?.(); };

  // Form refs for modals
  const stockFormRef = useState({})[0];
  const [stockForm, setStockForm] = useState({ sku:'', name:'', qty:'', minQty:'', batch:'', warehouse:'WH-01', category:'Raw Material', uom:'Nos', remarks:'' });
  const [whForm, setWhForm]       = useState({ id:'', name:'', location:'', manager:'', capacity:'', phone:'', type:'Raw Material', status:'Active', address:'' });
  const [movForm, setMovForm]     = useState({ type:'Inward', sku:'SKU-1042', from:'Supplier', to:'WH-01', qty:'', ref:'' });
  const [pickForm, setPickForm]   = useState({ order:'', warehouse:'WH-01', sku:'SKU-1042', location:'', qty:'', picker:'', priority:'Normal', notes:'' });
  const [sortForm, setSortForm]   = useState({ order:'', sku:'SKU-1042', qty:'', grade:'Grade A', boxType:'Standard Box', weight:'' });
  const [batchForm, setBatchForm] = useState({ batch:'', sku:'SKU-1042', qty:'', warehouse:'WH-01', mfg:'', exp:'' });
  const [defectForm, setDefectForm] = useState({ sku:'SKU-1042', qty:'', type:'Dimensional', source:'GRN Inspection', stage:'QC Hold', warehouse:'WH-01', remarks:'' });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddStock = () => {
    if (!stockForm.sku || !stockForm.name || !stockForm.qty) { toast('Please fill required fields', 'error'); return; }
    const newItem = { sku: stockForm.sku, name: stockForm.name, warehouse: stockForm.warehouse.split(' ')[0], qty: parseInt(stockForm.qty)||0, batch: stockForm.batch||'—', minQty: parseInt(stockForm.minQty)||0, status: parseInt(stockForm.qty) === 0 ? 'Dead' : parseInt(stockForm.qty) < parseInt(stockForm.minQty||0) ? 'Critical' : 'Active' };
    setStockList(prev => [...prev, newItem]);
    setStockForm({ sku:'', name:'', qty:'', minQty:'', batch:'', warehouse:'WH-01', category:'Raw Material', uom:'Nos', remarks:'' });
    closeModal(); toast(`Stock entry added — ${newItem.sku}`);
  };

  const handleAddWarehouse = () => {
    if (!whForm.id || !whForm.name || !whForm.location) { toast('Please fill required fields', 'error'); return; }
    const newWH = { id: whForm.id, name: whForm.name, location: whForm.location, capacity: parseInt(whForm.capacity)||0, used: 0, skus: 0, manager: whForm.manager };
    setWarehouseList(prev => [...prev, newWH]);
    setWhForm({ id:'', name:'', location:'', manager:'', capacity:'', phone:'', type:'Raw Material', status:'Active', address:'' });
    closeModal(); toast(`Warehouse ${newWH.id} added`);
  };

  const handleRecordMovement = () => {
    if (!movForm.qty) { toast('Please enter quantity', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === movForm.sku.split(' ')[0]);
    const newMov = { id:`MV-${String(movementList.length+1).padStart(3,'0')}`, type: movForm.type, sku: movForm.sku.split(' ')[0], name: skuItem?.name||movForm.sku, qty: parseInt(movForm.qty), from: movForm.from.split(' ')[0], to: movForm.to.split(' ')[0], date: new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short'}), ref: movForm.ref||'—' };
    setMovementList(prev => [...prev, newMov]);
    setMovForm({ type:'Inward', sku:'SKU-1042', from:'Supplier', to:'WH-01', qty:'', ref:'' });
    closeModal(); toast(`Movement recorded — ${newMov.id}`);
  };

  const handleCreatePickList = () => {
    if (!pickForm.order || !pickForm.qty) { toast('Please fill required fields', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === pickForm.sku.split(' ')[0]);
    const newPick = { id:`PCK-${String(pickList.length+1).padStart(3,'0')}`, order: pickForm.order, sku: pickForm.sku.split(' ')[0], item: skuItem?.name||pickForm.sku, qty: parseInt(pickForm.qty), loc: pickForm.location||'—', picker: pickForm.picker||'Unassigned', status:'Pending' };
    setPickList(prev => [...prev, newPick]);
    setPickForm({ order:'', warehouse:'WH-01', sku:'SKU-1042', location:'', qty:'', picker:'', priority:'Normal', notes:'' });
    closeModal(); toast(`Pick list ${newPick.id} created`);
  };

  const handleConfirmPick = (pickId) => {
    setPickList(prev => prev.map(p => p.id === pickId ? { ...p, status:'Completed' } : p));
    toast(`Pick ${pickId} confirmed ✓`);
  };

  const handleCreateSortJob = () => {
    if (!sortForm.order || !sortForm.qty) { toast('Please fill required fields', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === sortForm.sku.split(' ')[0]);
    const newSort = { id:`SRT-${String(sortList.length+1).padStart(3,'0')}`, sku: sortForm.sku.split(' ')[0], item: skuItem?.name||sortForm.sku, qty: parseInt(sortForm.qty), grade: sortForm.grade, status:'Pending' };
    const newPack = { id:`PKG-${String(packList.length+1).padStart(3,'0')}`, order: sortForm.order, items: 1, weight: sortForm.weight ? `${sortForm.weight} kg` : '—', type: sortForm.boxType, status:'Pending' };
    setSortList(prev => [...prev, newSort]);
    setPackList(prev => [...prev, newPack]);
    setSortForm({ order:'', sku:'SKU-1042', qty:'', grade:'Grade A', boxType:'Standard Box', weight:'' });
    closeModal(); toast(`Sort/Pack job created — ${newSort.id}`);
  };

  const handleUpdateSortStatus = (id, newStatus) => {
    setSortList(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    toast(`Sort job ${id} → ${newStatus}`);
  };

  const handleUpdatePackStatus = (id, newStatus) => {
    setPackList(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast(`Pack job ${id} → ${newStatus}`);
  };

  const handleAddBatch = () => {
    if (!batchForm.batch || !batchForm.qty || !batchForm.mfg || !batchForm.exp) { toast('Please fill required fields', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === batchForm.sku.split(' ')[0]);
    const mfgDate = new Date(batchForm.mfg + '-01');
    const expDate = new Date(batchForm.exp + '-01');
    const totalMs = expDate - mfgDate;
    const remainMs = expDate - new Date();
    const shelfPct = Math.max(0, Math.min(100, Math.round((remainMs / totalMs) * 100)));
    const newBatch = { batch: batchForm.batch, sku: batchForm.sku.split(' ')[0], item: skuItem?.name||batchForm.sku, qty: parseInt(batchForm.qty), mfg: new Date(batchForm.mfg+'-01').toLocaleDateString('en-IN',{month:'short',year:'numeric'}), exp: new Date(batchForm.exp+'-01').toLocaleDateString('en-IN',{month:'short',year:'numeric'}), wh: batchForm.warehouse.split(' ')[0], status: shelfPct < 20 ? 'Critical' : 'Active', shelfPct };
    setBatchList(prev => [...prev, newBatch]);
    setBatchForm({ batch:'', sku:'SKU-1042', qty:'', warehouse:'WH-01', mfg:'', exp:'' });
    closeModal(); toast(`Batch ${newBatch.batch} added`);
  };

  const handleLogDefect = () => {
    if (!defectForm.qty) { toast('Please enter quantity', 'error'); return; }
    const skuItem = stockList.find(s => s.sku === defectForm.sku.split(' ')[0]);
    const newDefect = { id:`DEF-${String(defectList.length+1).padStart(3,'0')}`, sku: defectForm.sku.split(' ')[0], item: skuItem?.name||defectForm.sku, qty: parseInt(defectForm.qty), type: defectForm.type, source: defectForm.source, date: new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short'}), daysAged: 0, stage: defectForm.stage };
    const newLog = { event:`${newDefect.id} — ${newDefect.item} (${newDefect.qty} units) flagged at ${newDefect.source}`, time: new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}), stage: newDefect.stage, color: newDefect.stage==='QC Hold' ? '#f59e0b' : '#ef4444' };
    setDefectList(prev => [...prev, newDefect]);
    setDefectLogList(prev => [newLog, ...prev]);
    setDefectForm({ sku:'SKU-1042', qty:'', type:'Dimensional', source:'GRN Inspection', stage:'QC Hold', warehouse:'WH-01', remarks:'' });
    closeModal(); toast(`Defect ${newDefect.id} logged`);
  };

  const handleDefectAction = (id, action) => {
    const stageMap = { Repair:'Repair', Rework:'Defective Bin', Scrap:'Disposed' };
    setDefectList(prev => prev.map(d => d.id === id ? { ...d, stage: stageMap[action]||action } : d));
    toast(`${id} → ${action}`);
  };

  const handleAdjustQty = () => {
    if (!adjustQty) { toast('Enter a quantity', 'error'); return; }
    setStockList(prev => prev.map(s => s.sku === adjustItem.sku ? { ...s, qty: parseInt(adjustQty), status: parseInt(adjustQty)===0 ? 'Dead' : parseInt(adjustQty) < s.minQty ? 'Critical' : 'Active' } : s));
    setAdjustItem(null); setAdjustQty('');
    toast(`${adjustItem.sku} quantity updated to ${adjustQty}`);
  };

  const handleMoveStock = () => {
    if (!moveToWH) { toast('Select destination warehouse', 'error'); return; }
    setStockList(prev => prev.map(s => s.sku === moveItem.sku ? { ...s, warehouse: moveToWH } : s));
    setMoveItem(null); setMoveToWH('');
    toast(`${moveItem.sku} moved to ${moveToWH}`);
  };

  const handleExportCSV = (data, filename) => {
    if (!data.length) { toast('No data to export', 'warning'); return; }
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast(`${filename} downloaded`);
  };

  const filteredStock = stockList
    .filter(r => stockFilter === 'All' || r.status === stockFilter)
    .filter(r => whFilter === 'All' || r.warehouse === whFilter)
    .filter(r => !stockSearch || r.sku.toLowerCase().includes(stockSearch.toLowerCase()) || r.name.toLowerCase().includes(stockSearch.toLowerCase()));

  return (
    <div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — Stock Dashboard  (Analytics-first layout)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div>
          {/* Low stock alert banner */}
          {stockData.filter(s => s.qty < s.minQty && s.qty > 0).length > 0 && (
            <div style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 18px', marginBottom:16,
              background:'#fffbeb', border:'1px solid #fde68a',
              borderRadius:12, borderLeft:'4px solid #f59e0b',
            }}>
              <span style={{ fontSize:18 }}>⚠️</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#92400e' }}>
                  {stockData.filter(s => s.qty < s.minQty && s.qty > 0).length} items below minimum stock level
                </div>
                <div style={{ fontSize:11.5, color:'#b45309', marginTop:2 }}>
                  {stockData.filter(s => s.qty < s.minQty && s.qty > 0).map(s => s.name).join(' · ')}
                </div>
              </div>
              <button onClick={() => toast('Redirecting to Purchase Requisition…', 'info')} style={{
                marginLeft:'auto', padding:'5px 14px', borderRadius:8,
                background:'#f59e0b', color:'#fff', border:'none',
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              }}>Create PR →</button>
            </div>
          )}

          {/* 2-col grid */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
            {/* Bar chart card */}
            <div style={{ ...card(), overflow:'hidden' }}>
              <div style={{
                background:'linear-gradient(90deg,#c0392b,#e74c3c)',
                padding:'14px 20px',
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Stock by Category</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Units across all warehouses</div>
              </div>
              <div style={{ padding:20 }}>
                <BarChart data={stockChartData} height={180} />
              </div>
            </div>

            {/* Right column: alerts + warehouse summary */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Quick Alerts */}
              <div style={{ ...card(), padding:0, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom: BORDER }}>
                  <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Quick Alerts</div>
                </div>
                <div style={{ padding:'8px 0' }}>
                  {[
                    { msg:'Bearing 6205 — critically low (12 units)', color: RED_LIGHT,  bg:'#fef2f2' },
                    { msg:'Oil Seal 35x52 — below minimum threshold', color: AMBER,      bg:'#fffbeb' },
                    { msg:'Piston Ring 80mm — stock replenished',     color: GREEN,      bg:'#f0fdf4' },
                  ].map((a,i) => (
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'12px 20px', background: a.bg,
                      borderLeft:`4px solid ${a.color}`,
                      marginBottom: i < 2 ? 1 : 0,
                    }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: a.color, flexShrink:0 }} />
                      <div style={{ fontSize:12, color: TEXT_DARK, fontWeight:500 }}>{a.msg}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warehouse summary */}
              <div style={{ ...card(), padding:0, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom: BORDER }}>
                  <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Warehouse Summary</div>
                </div>
                <div style={{ padding:'8px 0' }}>
                  {warehouses.map((wh, i) => {
                    const pct = Math.round((wh.used / wh.capacity) * 100);
                    const barColor = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
                    return (
                      <div key={i} style={{ padding:'10px 20px', borderBottom: i < warehouses.length-1 ? BORDER : 'none' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:12, fontWeight:700, color: TEXT_DARK }}>{wh.id}</span>
                          <span style={{ fontSize:11.5, fontWeight:700, color: barColor }}>{pct}%</span>
                        </div>
                        <div style={{ height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background: barColor, borderRadius:3 }} />
                        </div>
                        <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:3 }}>{wh.name} · {wh.skus} SKUs</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — Stock Table  (Data-grid with filter toolbar)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div style={{ ...card(), overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{
            display:'flex', alignItems:'center', gap:12, padding:'14px 20px',
            borderBottom: BORDER, background:'#fafbfc', flexWrap:'wrap',
          }}>
            <div style={{ position:'relative', flex:1, minWidth:180 }}>
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color: TEXT_LIGHT }}>🔍</span>
              <input placeholder="Search SKU or item…" value={stockSearch} onChange={e => setStockSearch(e.target.value)} style={{ ...inputStyle, paddingLeft:32, width:'100%' }} />
            </div>
            {/* Warehouse filter */}
            <select value={whFilter} onChange={e => setWhFilter(e.target.value)} style={{
              ...inputStyle, width:'auto', minWidth:160, cursor:'pointer',
              border:'1px solid #e2e8f0', background:'#fff',
            }}>
              <option value="All">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.id} — {w.name}</option>)}
            </select>
            <div style={{ display:'flex', gap:6 }}>
              {['All','Active','Critical','Dead'].map(f => (
                <button key={f} onClick={() => setStockFilter(f)} style={{
                  padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600,
                  border: stockFilter===f ? 'none' : `1px solid #e2e8f0`,
                  background: stockFilter===f ? RED : '#fff',
                  color: stockFilter===f ? '#fff' : TEXT_MID,
                  cursor:'pointer', fontFamily:'inherit',
                }}>{f}</button>
              ))}
            </div>
            <button onClick={() => handleExportCSV(filteredStock, 'stock-table.csv')} style={{
              padding:'6px 16px', borderRadius: RADIUS_SM, fontSize:12, fontWeight:600,
              background:'#f1f5f9', border: BORDER, color: TEXT_MID,
              cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6,
            }}><MdDownload size={14} /> Export</button>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ position:'sticky', top:0, background:'#f8fafc', zIndex:1 }}>
                  {['SKU','Item Name','Warehouse','Qty','Min Qty','Batch','Status','Actions'].map(h => (
                    <th key={h} style={{
                      padding:'10px 16px', textAlign:'left', fontSize:10.5,
                      fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase',
                      letterSpacing:'0.06em', borderBottom: BORDER, whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((r,i) => (
                  <tr key={i} style={{ background: i%2===0 ? '#f8fafc' : '#fff', borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{
                          width:7, height:7, borderRadius:'50%', flexShrink:0,
                          background: r.status==='Critical' ? RED_LIGHT : r.status==='Dead' ? '#94a3b8' : GREEN,
                        }} />
                        <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color: RED }}>{r.sku}</span>
                      </div>
                    </td>
                    <td style={{ padding:'11px 16px', fontSize:13, fontWeight:600, color: TEXT_DARK }}>{r.name}</td>
                    <td style={{ padding:'11px 16px', fontSize:13, color: TEXT_MID }}>{r.warehouse}</td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{
                        display:'inline-block', padding:'3px 10px', borderRadius:20,
                        fontSize:12, fontWeight:700,
                        background: r.qty < r.minQty ? '#fef2f2' : '#f0fdf4',
                        color: r.qty < r.minQty ? RED_LIGHT : GREEN,
                      }}>{r.qty}</span>
                    </td>
                    <td style={{ padding:'11px 16px', fontSize:13, color: TEXT_MID }}>{r.minQty}</td>
                    <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace', color: TEXT_MID }}>{r.batch}</td>
                    <td style={{ padding:'11px 16px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding:'11px 16px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { setAdjustItem(r); setAdjustQty(String(r.qty)); }} style={{
                          padding:'4px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600,
                          border:`1px solid ${RED}`, color: RED, background:'transparent',
                          cursor:'pointer', fontFamily:'inherit',
                        }}>✏ Adjust</button>
                        <button onClick={() => { setMoveItem(r); setMoveToWH(r.warehouse); }} style={{
                          padding:'4px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600,
                          border:'1px solid #e2e8f0', color: TEXT_MID, background:'#f8fafc',
                          cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4,
                        }}><MdSwapHoriz size={14} /> Move</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — Warehouses
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div>
          {/* Warehouse dropdown selector */}
          <div style={{
            display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap',
            background:'#fff', borderRadius:14, border: BORDER,
            padding:'14px 20px', boxShadow: SHADOW_CARD,
          }}>
            <MdWarehouse size={18} style={{ color: RED, flexShrink:0 }} />
            <span style={{ fontSize:13, fontWeight:700, color: TEXT_DARK, flexShrink:0 }}>Warehouse:</span>
            <select
              value={selectedWH?.id || ''}
              onChange={e => setSelectedWH(warehouses.find(w => w.id === e.target.value))}
              style={{
                flex:1, minWidth:200, maxWidth:320,
                padding:'8px 12px', border:'1.5px solid #e2e8f0',
                borderRadius:10, fontSize:13, fontWeight:600,
                color: TEXT_DARK, background:'#f8fafc',
                outline:'none', cursor:'pointer', fontFamily:'inherit',
              }}
            >
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.id} — {w.name} ({w.location})</option>
              ))}
            </select>
            {/* utilization badge */}
            {selectedWH && (() => {
              const pct = Math.round((selectedWH.used / selectedWH.capacity) * 100);
              const c = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
              return (
                <span style={{
                  padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700,
                  background: c+'18', color: c, border:`1px solid ${c}30`,
                }}>{pct}% used</span>
              );
            })()}
            <span style={{
              marginLeft:'auto', fontSize:12, color: TEXT_LIGHT, fontWeight:500,
            }}>
              {warehouses.length} warehouses total
            </span>
          </div>

          {/* Selected warehouse detail */}
          {selectedWH && (() => {
            const pct = Math.round((selectedWH.used / selectedWH.capacity) * 100);
            const barColor = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
            const whStock = stockData.filter(s => s.warehouse === selectedWH.id);
            return (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                {/* Info card */}
                <div style={{ ...card(), overflow:'hidden' }}>
                  <div style={{ background:'linear-gradient(135deg,#c0392b,#e74c3c)', padding:'18px 20px' }}>
                    <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{selectedWH.name}</div>
                    <div style={{ fontSize:11.5, color:'rgba(255,255,255,0.75)', marginTop:3 }}>
                      {selectedWH.id} · {selectedWH.location}
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'#f1f5f9' }}>
                    {[
                      ['Active SKUs',  selectedWH.skus],
                      ['Manager',      selectedWH.manager],
                      ['Capacity',     `${selectedWH.capacity.toLocaleString()} units`],
                      ['Status',       '● Active'],
                    ].map(([label, val], j) => (
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
                    <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:4 }}>
                      {selectedWH.used.toLocaleString()} / {selectedWH.capacity.toLocaleString()} units
                    </div>
                  </div>
                </div>

                {/* Stock in this warehouse */}
                <div style={{ ...card(), overflow:'hidden' }}>
                  <div style={{ padding:'14px 20px', borderBottom: BORDER, display:'flex', alignItems:'center', gap:8 }}>
                    <MdLocationOn size={16} style={{ color: RED }} />
                    <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>
                      Stock in {selectedWH.id}
                    </div>
                    <span style={{
                      marginLeft:'auto', padding:'2px 10px', borderRadius:20,
                      fontSize:11, fontWeight:700, background:'#fef2f2', color: RED,
                    }}>{whStock.length} SKUs</span>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr style={{ background:'#f8fafc' }}>
                          {['SKU','Item','Qty','Status'].map(h => (
                            <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10.5, fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom: BORDER }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {whStock.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding:'24px', textAlign:'center', color: TEXT_LIGHT, fontSize:13 }}>No stock in this warehouse</td></tr>
                        ) : whStock.map((r, i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, fontWeight:700, color: RED }}>{r.sku}</td>
                            <td style={{ padding:'10px 14px', fontSize:12.5, fontWeight:600, color: TEXT_DARK }}>{r.name}</td>
                            <td style={{ padding:'10px 14px' }}>
                              <span style={{
                                padding:'2px 9px', borderRadius:20, fontSize:12, fontWeight:700,
                                background: r.qty < r.minQty ? '#fef2f2' : '#f0fdf4',
                                color: r.qty < r.minQty ? RED_LIGHT : GREEN,
                              }}>{r.qty}</span>
                            </td>
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

          {/* All warehouses overview grid */}
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', borderBottom: BORDER }}>
              <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>All Warehouses Overview</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'#f1f5f9' }}>
              {warehouses.map((wh, i) => {
                const pct = Math.round((wh.used / wh.capacity) * 100);
                const barColor = pct > 85 ? RED_LIGHT : pct > 70 ? AMBER : GREEN;
                const gradients = [
                  'linear-gradient(135deg,#c0392b,#e74c3c)',
                  'linear-gradient(135deg,#7c3aed,#a855f7)',
                  'linear-gradient(135deg,#0369a1,#3b82f6)',
                ];
                const accentColor = i === 0 ? RED : i === 1 ? PURPLE : BLUE;
                return (
                  <div key={i} style={{
                    background:'#fff', padding:'20px',
                    cursor:'pointer', transition:'background 0.1s',
                  }}
                    onClick={() => setSelectedWH(wh)}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <div style={{
                        width:36, height:36, borderRadius:10, flexShrink:0,
                        background: gradients[i],
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'#fff', fontSize:16,
                      }}><MdWarehouse size={20} /></div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{wh.name}</div>
                        <div style={{ fontSize:11, color: TEXT_LIGHT }}>{wh.id} · {wh.location}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:11.5, color: TEXT_MID }}>{wh.skus} SKUs</span>
                      <span style={{ fontSize:11.5, fontWeight:700, color: barColor }}>{pct}%</span>
                    </div>
                    <div style={{ height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: barColor, borderRadius:3 }} />
                    </div>
                    <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:4 }}>
                      {wh.used.toLocaleString()} / {wh.capacity.toLocaleString()} units
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3 — Stock Movement  (Timeline + filter layout)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 3 && (
        <div>
          {/* Success message */}
          {successMsg && (
            <div style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'12px 18px', marginBottom:16,
              background:'#f0fdf4', border:'1px solid #86efac',
              borderRadius:12, borderLeft:'4px solid #22c55e',
            }}>
              <span style={{ fontSize:18 }}>✓</span>
              <div style={{ fontSize:13, fontWeight:700, color:'#22c55e' }}>{successMsg}</div>
            </div>
          )}

          {/* Pill toggles */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            {[
              { label:'Inward',   color: GREEN,  bg:'#f0fdf4' },
              { label:'Outward',  color: RED_LIGHT, bg:'#fef2f2' },
              { label:'Transfer', color: BLUE,   bg:'#eff6ff' },
            ].map(({ label, color, bg }) => (
              <button key={label} onClick={() => setMovTab(label)} style={{
                padding:'8px 22px', borderRadius:24, fontSize:13, fontWeight:700,
                border: movTab===label ? 'none' : `1.5px solid #e2e8f0`,
                background: movTab===label ? color : '#fff',
                color: movTab===label ? '#fff' : TEXT_MID,
                cursor:'pointer', fontFamily:'inherit',
                boxShadow: movTab===label ? `0 3px 10px ${color}40` : 'none',
                transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          {/* Movement cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {movementList.filter(m => m.type === movTab).length === 0 ? (
              <div style={{
                textAlign:'center', padding:'40px 20px',
                background:'#f8fafc', borderRadius:12, border:'1px solid #e2e8f0',
              }}>
                <div style={{ fontSize:14, color: TEXT_LIGHT, fontWeight:600 }}>
                  No {movTab.toLowerCase()} movements yet
                </div>
                <button onClick={() => setInternalModal(true)} style={{
                  marginTop:12, padding:'8px 16px', borderRadius:8,
                  background: BLUE, color:'#fff', border:'none',
                  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                }}>+ Record Movement</button>
              </div>
            ) : (
              movementList.filter(m => m.type === movTab).map((mv,i) => {
                const typeColor = mv.type==='Inward' ? GREEN : mv.type==='Outward' ? RED_LIGHT : BLUE;
                const typeIcon  = mv.type==='Inward' ? '↓' : mv.type==='Outward' ? '↑' : '⇄';
                return (
                  <div key={i} style={{
                    ...card(), padding:'16px 20px',
                    borderLeft:`4px solid ${typeColor}`,
                    display:'flex', alignItems:'center', gap:20,
                  }}>
                    {/* Icon circle */}
                    <div style={{
                      width:44, height:44, borderRadius:'50%', flexShrink:0,
                      background: typeColor+'18', display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:20, color: typeColor, fontWeight:900,
                    }}>{typeIcon}</div>

                    {/* Center info */}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color: TEXT_DARK }}>{mv.name}</div>
                      <div style={{ display:'flex', gap:10, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11.5, fontFamily:'monospace', color: RED, fontWeight:600 }}>{mv.sku}</span>
                        <span style={{ fontSize:11.5, color: TEXT_LIGHT }}>Ref: {mv.ref}</span>
                        <span style={{ fontSize:11.5, color: TEXT_LIGHT }}>{mv.id}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6 }}>
                        <span style={{ fontSize:12, color: TEXT_MID, fontWeight:600 }}>{mv.from}</span>
                        <span style={{ fontSize:14, color: typeColor }}>→</span>
                        <span style={{ fontSize:12, color: TEXT_MID, fontWeight:600 }}>{mv.to}</span>
                      </div>
                    </div>

                    {/* Right: qty + date */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{
                        fontSize:20, fontWeight:900, color: typeColor,
                      }}>{mv.qty}</div>
                      <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:2 }}>units</div>
                      <div style={{ fontSize:11.5, color: TEXT_MID, marginTop:6, fontWeight:600 }}>{mv.date}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4 — Picking  (Kanban-style workflow board)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 4 && (() => {
        const cols = [
          { label:'Pending',     color: AMBER,  bg:'#fffbeb', items: pickList.filter(p => p.status==='Pending') },
          { label:'In Progress', color: BLUE,   bg:'#eff6ff', items: pickList.filter(p => p.status==='In Progress') },
          { label:'Completed',   color: GREEN,  bg:'#f0fdf4', items: pickList.filter(p => p.status==='Completed') },
        ];
        return (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {cols.map((col,ci) => (
              <div key={ci} style={{ ...card(), overflow:'hidden' }}>
                {/* Column header */}
                <div style={{
                  background: col.color, padding:'12px 16px',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{col.label}</span>
                  <span style={{
                    background:'rgba(255,255,255,0.3)', color:'#fff',
                    borderRadius:12, padding:'1px 9px', fontSize:12, fontWeight:700,
                  }}>{col.items.length}</span>
                </div>

                {/* Cards */}
                <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>
                  {col.items.length === 0 && (
                    <div style={{ textAlign:'center', padding:'24px 0', color: TEXT_LIGHT, fontSize:12 }}>No items</div>
                  )}
                  {col.items.map((p,pi) => (
                    <div key={pi} style={{
                      background:'#fff', border: BORDER, borderRadius: RADIUS_MD,
                      padding:'14px 14px', boxShadow:'0 1px 4px rgba(15,23,42,0.05)',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                        <span style={{ fontSize:12, fontWeight:800, color: col.color }}>{p.id}</span>
                        {/* Picker avatar */}
                        <div style={{
                          width:28, height:28, borderRadius:'50%', background: col.color+'22',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:11, fontWeight:800, color: col.color,
                        }}>{p.picker.slice(0,2).toUpperCase()}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK, marginBottom:4 }}>{p.item}</div>
                      <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginBottom:2 }}>Order: {p.order}</div>
                      <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginBottom:2 }}>SKU: <span style={{ fontFamily:'monospace', color: RED }}>{p.sku}</span></div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                        <span style={{ fontSize:11.5, color: TEXT_MID }}>📍 {p.loc}</span>
                        <span style={{
                          background: col.color+'18', color: col.color,
                          borderRadius:12, padding:'2px 9px', fontSize:11, fontWeight:700,
                        }}>Qty: {p.qty}</span>
                      </div>
                      {p.status === 'In Progress' && (
                        <button onClick={() => handleConfirmPick(p.id)} style={{
                          marginTop:10, width:'100%', padding:'7px 0',
                          borderRadius: RADIUS_SM, border:'none',
                          background: BLUE, color:'#fff',
                          fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                        }}>✓ Confirm Pick</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {cols.map((col,ci) => (
                <div key={ci} style={{ ...card(), overflow:'hidden' }}>
                  {/* Column header */}
                  <div style={{
                    background: col.color, padding:'12px 16px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                  }}>
                    <span style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{col.label}</span>
                    <span style={{
                      background:'rgba(255,255,255,0.3)', color:'#fff',
                      borderRadius:12, padding:'1px 9px', fontSize:12, fontWeight:700,
                    }}>{col.items.length}</span>
                  </div>

                  {/* Cards */}
                  <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>
                    {col.items.length === 0 && (
                      <div style={{ textAlign:'center', padding:'24px 0', color: TEXT_LIGHT, fontSize:12 }}>No items</div>
                    )}
                    {col.items.map((p,pi) => (
                      <div key={pi} style={{
                        background:'#fff', border: BORDER, borderRadius: RADIUS_MD,
                        padding:'14px 14px', boxShadow:'0 1px 4px rgba(15,23,42,0.05)',
                      }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                          <span style={{ fontSize:12, fontWeight:800, color: col.color }}>{p.id}</span>
                          {/* Picker avatar */}
                          <div style={{
                            width:28, height:28, borderRadius:'50%', background: col.color+'22',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:11, fontWeight:800, color: col.color,
                          }}>{p.picker.slice(0,2).toUpperCase()}</div>
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK, marginBottom:4 }}>{p.item}</div>
                        <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginBottom:2 }}>Order: {p.order}</div>
                        <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginBottom:2 }}>SKU: <span style={{ fontFamily:'monospace', color: RED }}>{p.sku}</span></div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                          <span style={{ fontSize:11.5, color: TEXT_MID, display:'flex', alignItems:'center', gap:4 }}><MdLocationOn size={14} /> {p.loc}</span>
                          <span style={{
                            background: col.color+'18', color: col.color,
                            borderRadius:12, padding:'2px 9px', fontSize:11, fontWeight:700,
                          }}>Qty: {p.qty}</span>
                        </div>
                        {p.status === 'In Progress' && (
                          <button style={{
                            marginTop:10, width:'100%', padding:'7px 0',
                            borderRadius: RADIUS_SM, border:'none',
                            background: BLUE, color:'#fff',
                            fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                          }}><MdCheckCircle size={16} /> Confirm Pick</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5 — Sorting & Packing  (Split workflow panels)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 5 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Sorting Queue */}
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(90deg,#7c3aed,#a855f7)', padding:'14px 20px' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>Sorting Queue</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Grade & classify incoming stock</div>
            </div>
            <div style={{ padding:'8px 0' }}>
              {sortList.map((r,i) => {
                const gradeColor = r.grade==='Grade A' ? GREEN : AMBER;
                const statusBorder = r.status==='Sorted' ? GREEN : r.status==='In Progress' ? BLUE : '#e2e8f0';
                  return (
                  <div key={i} style={{
                    padding:'14px 20px', borderLeft:`4px solid ${statusBorder}`,
                    borderBottom: i < sortList.length-1 ? BORDER : 'none',
                    background: r.status==='Sorted' ? '#f0fdf4' : r.status==='In Progress' ? '#eff6ff' : '#fff',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{r.item}</div>
                        <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginTop:2 }}>{r.id} · {r.sku} · Qty: {r.qty}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                        <span style={{
                          padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                          background: gradeColor+'18', color: gradeColor,
                        }}>{r.grade}</span>
                        <span style={{
                          padding:'2px 8px', borderRadius:20, fontSize:10.5, fontWeight:600,
                          background: statusBorder+'18', color: statusBorder,
                        }}>{r.status}</span>
                      </div>
                    </div>
                    {/* Progress indicator */}
                    <div style={{ marginTop:10, height:4, background:'#f1f5f9', borderRadius:2, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:2,
                        width: r.status==='Sorted' ? '100%' : r.status==='In Progress' ? '55%' : '10%',
                        background: statusBorder,
                        transition:'width 0.5s',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Packing Queue */}
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(90deg,#0d9488,#14b8a6)', padding:'14px 20px' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>Packing Queue</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Package & dispatch ready orders</div>
            </div>
            <div style={{ padding:'8px 0' }}>
              {packList.map((r,i) => {
                const statusIcon  = r.status==='Packed' ? '📦' : r.status==='Packing' ? '⏳' : '🕐';
                const statusColor = r.status==='Packed' ? GREEN : r.status==='Packing' ? BLUE : TEXT_LIGHT;
                return (
                  <div key={i} style={{
                    padding:'14px 20px',
                    borderBottom: i < packList.length-1 ? BORDER : 'none',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{r.order}</div>
                        <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginTop:2 }}>{r.id} · {r.items} items</div>
                      </div>
                      <span style={{
                        padding:'4px 10px', borderRadius:20, fontSize:11.5, fontWeight:700,
                        background: statusColor+'18', color: statusColor, display:'flex', alignItems:'center', gap:6,
                      }}>{statusIcon} {r.status}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                      <span style={{
                        padding:'3px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600,
                        background:'#f1f5f9', color: TEXT_MID, display:'flex', alignItems:'center', gap:4,
                      }}><MdScale size={14} /> {r.weight}</span>
                      <span style={{
                        padding:'3px 10px', borderRadius: RADIUS_SM, fontSize:11, fontWeight:600,
                        background:'#f1f5f9', color: TEXT_MID, display:'flex', alignItems:'center', gap:4,
                      }}><MdDescription size={14} /> {r.type}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6 — Batch Tracking  (Timeline-style batch cards with expiry alerts)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 6 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <SectionHeader
            title="Batch Tracking"
            subtitle="Shelf life, expiry & status per batch"
            action={
              <div style={{ display:'flex', gap:8 }}>
                {batchList.filter(b => b.shelfPct < 50).length > 0 && (
                  <div style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'6px 12px', borderRadius:8,
                    background:'#fef2f2', border:'1px solid #fecaca',
                    fontSize:12, fontWeight:700, color: RED_LIGHT,
                  }}>
                    ⚠ {batchList.filter(b => b.shelfPct < 50).length} batches nearing expiry
                  </div>
                )}
              </div>
            }
          />
          {batchList.map((b,i) => {
            const statusColor = b.status==='Active' ? GREEN : b.status==='Critical' ? AMBER : '#94a3b8';
            const barColor    = b.shelfPct > 60 ? GREEN : b.shelfPct > 30 ? AMBER : RED_LIGHT;
            return (
              <div key={i} style={{ ...card(), padding:0, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'stretch' }}>
                  {/* Batch chip */}
                  <div style={{
                    background: statusColor+'18', borderRight:`3px solid ${statusColor}`,
                    padding:'20px 18px', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center', minWidth:110,
                  }}>
                    <div style={{ fontSize:11, color: TEXT_LIGHT, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Batch</div>
                    <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:900, color: statusColor, textAlign:'center' }}>{b.batch}</div>
                  </div>

                  {/* Center details */}
                  <div style={{ flex:1, padding:'16px 20px' }}>
                    <div style={{ fontSize:14, fontWeight:700, color: TEXT_DARK }}>{b.item}</div>
                    <div style={{ display:'flex', gap:12, marginTop:4, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11.5, fontFamily:'monospace', color: RED }}>{b.sku}</span>
                      <span style={{ fontSize:11.5, color: TEXT_LIGHT, display:'flex', alignItems:'center', gap:4 }}><MdLocationOn size={14} /> {b.wh}</span>
                      <span style={{ fontSize:11.5, color: TEXT_LIGHT }}>Mfg: {b.mfg}</span>
                    </div>
                    {/* Shelf life bar */}
                    <div style={{ marginTop:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:11, color: TEXT_LIGHT }}>Shelf life remaining</span>
                        <span style={{ fontSize:11, fontWeight:700, color: barColor }}>{b.shelfPct}%</span>
                      </div>
                      <div style={{ height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${b.shelfPct}%`, background: barColor, borderRadius:3, transition:'width 0.5s' }} />
                      </div>
                    </div>
                  </div>

                  {/* Right: qty + expiry */}
                  <div style={{
                    padding:'16px 20px', textAlign:'right', borderLeft: BORDER,
                    display:'flex', flexDirection:'column', justifyContent:'center', minWidth:120,
                  }}>
                    <div style={{ fontSize:24, fontWeight:900, color: statusColor, lineHeight:1 }}>{b.qty}</div>
                    <div style={{ fontSize:11, color: TEXT_LIGHT, marginTop:2 }}>units</div>
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:10.5, color: TEXT_LIGHT }}>Expires</div>
                      <div style={{ fontSize:12, fontWeight:700, color: b.status==='Dead' ? RED_LIGHT : TEXT_DARK, marginTop:2 }}>{b.exp}</div>
                    </div>
                    <span style={{
                      marginTop:8, display:'inline-block', padding:'3px 10px', borderRadius:20,
                      fontSize:11, fontWeight:700, background: statusColor+'18', color: statusColor,
                    }}>{b.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7 — Ageing Stock  (Heat-map style analysis)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 7 && (
        <div>
          {/* Main table */}
          <div style={{ ...card(), overflow:'hidden' }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'14px 20px', borderBottom: BORDER,
            }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color: TEXT_DARK }}>Ageing Stock Analysis</div>
                <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginTop:2 }}>Items not moved — with action suggestions</div>
              </div>
              <button onClick={() => handleExportCSV(ageingData, 'ageing-stock-report.csv')} style={{
                padding:'7px 16px', borderRadius: RADIUS_SM, fontSize:12, fontWeight:700,
                background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff',
                border:'none', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6,
              }}><MdDownload size={14} /> Export Report</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['SKU','Item','Warehouse','Qty','Last Movement','Days Idle','Bucket','Value','Suggested Action'].map(h => (
                      <th key={h} style={{
                        padding:'10px 16px', textAlign:'left', fontSize:10.5,
                        fontWeight:700, color: TEXT_LIGHT, textTransform:'uppercase',
                        letterSpacing:'0.06em', borderBottom: BORDER, whiteSpace:'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ageingData.map((r,i) => {
                    const rowBg = r.days > 90 ? 'rgba(239,68,68,0.08)' : r.days > 60 ? 'rgba(245,158,11,0.08)' : r.days > 30 ? 'rgba(251,191,36,0.05)' : '#fff';
                    const daysColor = r.days > 90 ? RED_LIGHT : r.days > 60 ? '#f97316' : r.days > 30 ? AMBER : GREEN;
                    return (
                      <tr key={i} style={{ background: rowBg, borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'12px 16px', fontFamily:'monospace', fontSize:12, fontWeight:700, color: RED }}>{r.sku}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600, color: TEXT_DARK }}>{r.item}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, color: TEXT_MID }}>{r.wh}</td>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700, color: TEXT_DARK }}>{r.qty}</td>
                        <td style={{ padding:'12px 16px', fontSize:12, color: TEXT_MID }}>{r.lastMov}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontSize:18, fontWeight:900, color: daysColor }}>{r.days}</span>
                          <span style={{ fontSize:11, color: TEXT_LIGHT, marginLeft:2 }}>d</span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <Pill label={r.bucket} color={r.actionColor} />
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, fontWeight:700, color: TEXT_DARK }}>{r.value}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{
                            display:'inline-block', padding:'4px 12px', borderRadius: RADIUS_SM,
                            fontSize:11.5, fontWeight:700,
                            background: r.actionColor+'18', color: r.actionColor,
                            border:`1px solid ${r.actionColor}30`,
                          }}>{r.action}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 8 — Defective Stock  (Status-flow layout)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 8 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Defective register */}
            <div style={{ ...card(), overflow:'hidden' }}>
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'14px 20px', borderBottom: BORDER,
                background:'linear-gradient(90deg,#fef2f2,#fff)',
              }}>
                <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>Defective Stock Register</div>
                <button onClick={() => setInternalModal(true)} style={{
                  padding:'6px 14px', borderRadius: RADIUS_SM, fontSize:12, fontWeight:700,
                  background: RED_LIGHT, color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit',
                }}>+ Log Defect</button>
              </div>
              <div style={{ padding:'4px 0' }}>
                {defectList.map((r,i) => {
                  const stageBorder = r.stage==='QC Hold' ? AMBER : r.stage==='Repair' ? BLUE : RED_LIGHT;
                  const stageBg     = r.stage==='QC Hold' ? '#fffbeb' : r.stage==='Repair' ? '#eff6ff' : '#fef2f2';
                  return (
                    <div key={i} style={{
                      padding:'14px 20px', borderLeft:`4px solid ${stageBorder}`,
                      background: stageBg,
                      borderBottom: i < defectList.length-1 ? BORDER : 'none',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:13, fontWeight:800, color: RED }}>{r.id}</span>
                          <span style={{ fontSize:11.5, fontFamily:'monospace', color: TEXT_LIGHT }}>{r.sku}</span>
                        </div>
                        <span style={{
                          padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                          background: stageBorder+'22', color: stageBorder,
                        }}>{r.stage}</span>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK }}>{r.item} — {r.qty} units</div>
                      <div style={{ fontSize:11.5, color: TEXT_LIGHT, marginTop:3 }}>
                        {r.type} · {r.source} · {r.date} ·{' '}
                        <span style={{ color: r.daysAged > 2 ? RED_LIGHT : TEXT_LIGHT, fontWeight: r.daysAged > 2 ? 700 : 400 }}>
                          {r.daysAged}d aged
                        </span>
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:10 }}>
                        {[
                          { label:'Repair', color: BLUE },
                          { label:'Rework', color: AMBER },
                          { label:'Scrap',  color: RED_LIGHT },
                        ].map(btn => (
                          <button key={btn.label} onClick={() => handleDefectAction(r.id, btn.label)} style={{
                            padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                            background: btn.color+'18', color: btn.color,
                            border:`1px solid ${btn.color}40`, cursor:'pointer', fontFamily:'inherit',
                          }}>{btn.label}</button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ ...card(), padding:20 }}>
              <div style={{ fontSize:13, fontWeight:700, color: TEXT_DARK, marginBottom:20 }}>
                Movement Log — QC → Defective → Disposal/Repair
              </div>
              <div style={{ position:'relative', paddingLeft:28 }}>
                {/* Connecting line */}
                <div style={{
                  position:'absolute', left:9, top:6, bottom:6,
                  width:2, background:'#e2e8f0', borderRadius:1,
                }} />
                {defectLogList.map((item,i) => (
                  <div key={i} style={{ position:'relative', marginBottom: i < defectLogList.length-1 ? 22 : 0 }}>
                    {/* Dot */}
                    <div style={{
                      position:'absolute', left:-19, top:3,
                      width:12, height:12, borderRadius:'50%',
                      background: item.color,
                      boxShadow:`0 0 0 3px ${item.color}30`,
                    }} />
                    <div style={{ fontSize:13, fontWeight:600, color: TEXT_DARK, lineHeight:1.4 }}>{item.event}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5 }}>
                      <span style={{ fontSize:11.5, color: TEXT_LIGHT }}>{item.time}</span>
                      <span style={{
                        padding:'2px 8px', borderRadius:20, fontSize:10.5, fontWeight:700,
                        background: item.color+'20', color: item.color,
                      }}>{item.stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs 9 & 10 ── */}
      {activeTab === 9  && <StorageLocationPage />}
      {activeTab === 10 && <PincodeStockPage />}

      {/* ── Tab-specific Modals ── */}

      {/* Add Stock (tabs 0 & 1) */}
      {(activeTab === 0 || activeTab === 1) && (
        <Modal open={showModal} onClose={closeModal} title="Add Stock Entry"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleAddStock}>Add Stock</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'SKU *', key:'sku', placeholder:'e.g. SKU-1042', type:'text' },
              { label:'Item Name *', key:'name', placeholder:'Item description', type:'text' },
              { label:'Quantity *', key:'qty', placeholder:'0', type:'number' },
              { label:'Min Stock Level', key:'minQty', placeholder:'0', type:'number' },
              { label:'Batch Number', key:'batch', placeholder:'e.g. B-2024-04', type:'text' },
            ].map((f,i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={stockForm[f.key]} onChange={e => setStockForm(p=>({...p,[f.key]:e.target.value}))} style={inputStyle} />
              </div>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse *</label>
              <select value={stockForm.warehouse} onChange={e => setStockForm(p=>({...p,warehouse:e.target.value}))} style={inputStyle}>
                {warehouseList.map(w => <option key={w.id}>{w.id} — {w.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Remarks</label>
            <textarea placeholder="Optional notes…" value={stockForm.remarks} onChange={e => setStockForm(p=>({...p,remarks:e.target.value}))} style={{ ...inputStyle, minHeight:64, resize:'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Add Warehouse (tab 2) */}
      {activeTab === 2 && (
        <Modal open={showModal} onClose={closeModal} title="Add New Warehouse"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleAddWarehouse}>Save Warehouse</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'Warehouse ID *', key:'id', placeholder:'e.g. WH-04', type:'text' },
              { label:'Warehouse Name *', key:'name', placeholder:'e.g. North Godown', type:'text' },
              { label:'Location *', key:'location', placeholder:'City / Area', type:'text' },
              { label:'Manager Name *', key:'manager', placeholder:'Full name', type:'text' },
              { label:'Capacity (units)', key:'capacity', placeholder:'0', type:'number' },
              { label:'Contact Phone', key:'phone', placeholder:'10-digit number', type:'text' },
            ].map((f,i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={whForm[f.key]} onChange={e => setWhForm(p=>({...p,[f.key]:e.target.value}))} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Address</label>
            <textarea placeholder="Full address…" value={whForm.address} onChange={e => setWhForm(p=>({...p,address:e.target.value}))} style={{ ...inputStyle, minHeight:56, resize:'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Record Movement (tab 3) */}
      {activeTab === 3 && (
        <Modal open={showModal} onClose={closeModal} title="Record Stock Movement"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleRecordMovement}>Record Movement</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Movement Type *</label>
              <select value={movForm.type} onChange={e => setMovForm(p=>({...p,type:e.target.value}))} style={inputStyle}>
                <option>Inward</option><option>Outward</option><option>Transfer</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label>
              <select value={movForm.sku} onChange={e => setMovForm(p=>({...p,sku:e.target.value}))} style={inputStyle}>
                {stockList.map(s => <option key={s.sku}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>From *</label>
              <select value={movForm.from} onChange={e => setMovForm(p=>({...p,from:e.target.value}))} style={inputStyle}>
                <option>Supplier</option>
                {warehouseList.map(w => <option key={w.id}>{w.id} — {w.name}</option>)}
                <option>Production</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>To *</label>
              <select value={movForm.to} onChange={e => setMovForm(p=>({...p,to:e.target.value}))} style={inputStyle}>
                {warehouseList.map(w => <option key={w.id}>{w.id} — {w.name}</option>)}
                <option>Production</option><option>Dispatch</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Quantity *</label>
              <input type="number" placeholder="0" value={movForm.qty} onChange={e => setMovForm(p=>({...p,qty:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Reference No.</label>
              <input type="text" placeholder="e.g. GRN-0234 / WO-0891" value={movForm.ref} onChange={e => setMovForm(p=>({...p,ref:e.target.value}))} style={inputStyle} />
            </div>
          </div>
        </Modal>
      )}

      {/* New Pick List (tab 4) */}
      {activeTab === 4 && (
        <Modal open={showModal} onClose={closeModal} title="Create Pick List"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleCreatePickList}>Create Pick List</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Order Reference *</label>
              <input type="text" placeholder="e.g. ORD-2024-090" value={pickForm.order} onChange={e => setPickForm(p=>({...p,order:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse *</label>
              <select value={pickForm.warehouse} onChange={e => setPickForm(p=>({...p,warehouse:e.target.value}))} style={inputStyle}>
                {warehouseList.map(w => <option key={w.id}>{w.id} — {w.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU to Pick *</label>
              <select value={pickForm.sku} onChange={e => setPickForm(p=>({...p,sku:e.target.value}))} style={inputStyle}>
                {stockList.map(s => <option key={s.sku}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Storage Location</label>
              <input type="text" placeholder="e.g. Zone A / Rack R2" value={pickForm.location} onChange={e => setPickForm(p=>({...p,location:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Qty to Pick *</label>
              <input type="number" placeholder="0" value={pickForm.qty} onChange={e => setPickForm(p=>({...p,qty:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Assign Picker</label>
              <input type="text" placeholder="Picker name" value={pickForm.picker} onChange={e => setPickForm(p=>({...p,picker:e.target.value}))} style={inputStyle} />
            </div>
          </div>
        </Modal>
      )}

      {/* New Sort Job (tab 5) */}
      {activeTab === 5 && (
        <Modal open={showModal} onClose={closeModal} title="Create Sort / Pack Job"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleCreateSortJob}>Create Job</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Order Reference *</label>
              <input type="text" placeholder="e.g. ORD-2024-089" value={sortForm.order} onChange={e => setSortForm(p=>({...p,order:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label>
              <select value={sortForm.sku} onChange={e => setSortForm(p=>({...p,sku:e.target.value}))} style={inputStyle}>
                {stockList.map(s => <option key={s.sku}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Quantity *</label>
              <input type="number" placeholder="0" value={sortForm.qty} onChange={e => setSortForm(p=>({...p,qty:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Grade</label>
              <select value={sortForm.grade} onChange={e => setSortForm(p=>({...p,grade:e.target.value}))} style={inputStyle}>
                <option>Grade A</option><option>Grade B</option><option>Grade C</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Box / Package Type</label>
              <select value={sortForm.boxType} onChange={e => setSortForm(p=>({...p,boxType:e.target.value}))} style={inputStyle}>
                <option>Standard Box</option><option>Custom Branded</option><option>Bulk Loose</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Weight (kg)</label>
              <input type="number" placeholder="0" value={sortForm.weight} onChange={e => setSortForm(p=>({...p,weight:e.target.value}))} style={inputStyle} />
            </div>
          </div>
        </Modal>
      )}

      {/* Add Batch (tab 6) */}
      {activeTab === 6 && (
        <Modal open={showModal} onClose={closeModal} title="Add New Batch"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleAddBatch}>Add Batch</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Batch Number *</label>
              <input type="text" placeholder="e.g. B-2024-05" value={batchForm.batch} onChange={e => setBatchForm(p=>({...p,batch:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label>
              <select value={batchForm.sku} onChange={e => setBatchForm(p=>({...p,sku:e.target.value}))} style={inputStyle}>
                {stockList.map(s => <option key={s.sku}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Quantity *</label>
              <input type="number" placeholder="0" value={batchForm.qty} onChange={e => setBatchForm(p=>({...p,qty:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse *</label>
              <select value={batchForm.warehouse} onChange={e => setBatchForm(p=>({...p,warehouse:e.target.value}))} style={inputStyle}>
                {warehouseList.map(w => <option key={w.id}>{w.id} — {w.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Mfg Date *</label>
              <input type="month" value={batchForm.mfg} onChange={e => setBatchForm(p=>({...p,mfg:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Expiry Date *</label>
              <input type="month" value={batchForm.exp} onChange={e => setBatchForm(p=>({...p,exp:e.target.value}))} style={inputStyle} />
            </div>
          </div>
        </Modal>
      )}

      {/* Log Defect (tab 8) */}
      {activeTab === 8 && (
        <Modal open={showModal} onClose={closeModal} title="Log Defective Stock"
          footer={<>
            <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={closeModal}>Cancel</button>
            <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(185,28,28,0.3)' }} onClick={handleLogDefect}>Log Defect</button>
          </>}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>SKU *</label>
              <select value={defectForm.sku} onChange={e => setDefectForm(p=>({...p,sku:e.target.value}))} style={inputStyle}>
                {stockList.map(s => <option key={s.sku}>{s.sku} — {s.name}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Defective Qty *</label>
              <input type="number" placeholder="0" value={defectForm.qty} onChange={e => setDefectForm(p=>({...p,qty:e.target.value}))} style={inputStyle} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Defect Type *</label>
              <select value={defectForm.type} onChange={e => setDefectForm(p=>({...p,type:e.target.value}))} style={inputStyle}>
                <option>Dimensional</option><option>Surface Defect</option>
                <option>Packaging Damage</option><option>Functional Failure</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Source *</label>
              <select value={defectForm.source} onChange={e => setDefectForm(p=>({...p,source:e.target.value}))} style={inputStyle}>
                <option>GRN Inspection</option><option>Production</option>
                <option>Customer Return</option><option>Internal Audit</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Stage</label>
              <select value={defectForm.stage} onChange={e => setDefectForm(p=>({...p,stage:e.target.value}))} style={inputStyle}>
                <option>QC Hold</option><option>Defective Bin</option>
                <option>Repair</option><option>Scrap</option>
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Warehouse</label>
              <select value={defectForm.warehouse} onChange={e => setDefectForm(p=>({...p,warehouse:e.target.value}))} style={inputStyle}>
                {warehouseList.map(w => <option key={w.id}>{w.id} — {w.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
            <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Remarks</label>
            <textarea placeholder="Describe the defect…" value={defectForm.remarks} onChange={e => setDefectForm(p=>({...p,remarks:e.target.value}))} style={{ ...inputStyle, minHeight:56, resize:'vertical' }} />
          </div>
        </Modal>
      )}

      {/* Adjust Quantity Modal */}
      <Modal open={!!adjustItem} onClose={() => { setAdjustItem(null); setAdjustQty(''); }} title={`Adjust Quantity — ${adjustItem?.sku}`}
        footer={<>
          <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => { setAdjustItem(null); setAdjustQty(''); }}>Cancel</button>
          <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={handleAdjustQty}>Save</button>
        </>}>
        {adjustItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:10, fontSize:13 }}>
              <strong>{adjustItem.name}</strong> · Current qty: <strong style={{ color: RED }}>{adjustItem.qty}</strong> · Min: {adjustItem.minQty}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>New Quantity *</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} style={inputStyle} autoFocus />
            </div>
          </div>
        )}
      </Modal>

      {/* Move Stock Modal */}
      <Modal open={!!moveItem} onClose={() => { setMoveItem(null); setMoveToWH(''); }} title={`Move Stock — ${moveItem?.sku}`}
        footer={<>
          <button style={{ padding:'8px 18px', borderRadius:10, border:`1.5px solid ${RED}`, color:RED, background:'transparent', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => { setMoveItem(null); setMoveToWH(''); }}>Cancel</button>
          <button style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={handleMoveStock}>Move</button>
        </>}>
        {moveItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:10, fontSize:13 }}>
              <strong>{moveItem.name}</strong> · Currently in: <strong style={{ color: RED }}>{moveItem.warehouse}</strong>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:12, fontWeight:600, color:TEXT_MID }}>Move to Warehouse *</label>
              <select value={moveToWH} onChange={e => setMoveToWH(e.target.value)} style={inputStyle}>
                {warehouseList.filter(w => w.id !== moveItem.warehouse).map(w => <option key={w.id} value={w.id}>{w.id} — {w.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
