import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';

const tabList = ['BOM', 'Work Orders', 'Production Planning', 'Production Scheduling', 'Production Tracking', 'Efficiency', 'Wastage'];
const bom = [
  { id: 'BOM-001', product: 'Engine Assembly A', components: 14, version: 'v2.1', status: 'Active' },
  { id: 'BOM-002', product: 'Gearbox Unit B', components: 22, version: 'v1.4', status: 'Active' },
  { id: 'BOM-003', product: 'Clutch Assembly C', components: 8, version: 'v3.0', status: 'Active' },
];
const bomTree = [
  { level: 0, item: 'Engine Assembly A', qty: 1, unit: 'Set', type: 'Finished' },
  { level: 1, item: '├─ Cylinder Block', qty: 1, unit: 'Nos', type: 'Sub-Assembly' },
  { level: 2, item: '│  ├─ Piston Ring 80mm', qty: 4, unit: 'Nos', type: 'Raw' },
  { level: 2, item: '│  └─ Cylinder Liner', qty: 4, unit: 'Nos', type: 'Raw' },
  { level: 1, item: '├─ Crankshaft Assembly', qty: 1, unit: 'Nos', type: 'Sub-Assembly' },
  { level: 2, item: '│  ├─ Crankshaft Seal', qty: 2, unit: 'Nos', type: 'Raw' },
  { level: 2, item: '│  └─ Bearing 6205', qty: 4, unit: 'Nos', type: 'Raw' },
  { level: 1, item: '└─ Valve Train', qty: 1, unit: 'Set', type: 'Sub-Assembly' },
  { level: 2, item: '   ├─ Valve Spring Set', qty: 8, unit: 'Nos', type: 'Raw' },
  { level: 2, item: '   └─ Timing Chain Kit', qty: 1, unit: 'Set', type: 'Raw' },
];
const workOrders = [
  { id: 'WO-0891', product: 'Engine Assembly A', qty: 50, produced: 50, status: 'Completed', startDate: '10 Apr', endDate: '14 Apr', shift: 'Morning' },
  { id: 'WO-0892', product: 'Gearbox Unit B', qty: 30, produced: 18, status: 'In-Progress', startDate: '12 Apr', endDate: '16 Apr', shift: 'General' },
  { id: 'WO-0893', product: 'Clutch Assembly C', qty: 80, produced: 0, status: 'Pending', startDate: '15 Apr', endDate: '18 Apr', shift: 'Night' },
];
const wastageData = [
  { label: 'Mon', value: 12, color: '#e74c3c' }, { label: 'Tue', value: 8, color: '#e74c3c' },
  { label: 'Wed', value: 15, color: '#e74c3c' }, { label: 'Thu', value: 6, color: '#e74c3c' },
  { label: 'Fri', value: 10, color: '#e74c3c' }, { label: 'Sat', value: 4, color: '#e74c3c' },
];
const goodData = [
  { label: 'Mon', value: 188, color: '#27ae60' }, { label: 'Tue', value: 192, color: '#27ae60' },
  { label: 'Wed', value: 185, color: '#27ae60' }, { label: 'Thu', value: 194, color: '#27ae60' },
  { label: 'Fri', value: 190, color: '#27ae60' }, { label: 'Sat', value: 176, color: '#27ae60' },
];
const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const btnP = 'inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]';
const btnO = 'inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]';

export default function ProductionPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedBOM, setSelectedBOM] = useState('BOM-001');
  const [showWOModal, setShowWOModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [bomList, setBomList] = useState(bom);
  const [woList, setWoList] = useState(workOrders);
  const [woForm, setWoForm] = useState({ product: 'Engine Assembly A', qty: '', shift: 'Morning', startDate: '', endDate: '', bom: 'BOM-001', priority: 'Normal', remarks: '' });
  const [bomForm, setBomForm] = useState({ product: '', version: 'v1.0', type: 'Finished Good', uom: 'Set', description: '' });

  const handleCreateWO = () => {
    if (!woForm.qty || !woForm.startDate) { toast('Please fill required fields', 'error'); return; }
    const newWO = { id: `WO-${String(woList.length + 892).padStart(4, '0')}`, product: woForm.product, qty: parseInt(woForm.qty), produced: 0, status: 'Pending', startDate: new Date(woForm.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), endDate: woForm.endDate ? new Date(woForm.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—', shift: woForm.shift };
    setWoList(prev => [...prev, newWO]);
    setWoForm({ product: 'Engine Assembly A', qty: '', shift: 'Morning', startDate: '', endDate: '', bom: 'BOM-001', priority: 'Normal', remarks: '' });
    setShowWOModal(false);
    toast(`Work Order ${newWO.id} created`);
  };

  const handleCreateBOM = () => {
    if (!bomForm.product) { toast('Product name is required', 'error'); return; }
    const newBOM = { id: `BOM-${String(bomList.length + 4).padStart(3, '0')}`, product: bomForm.product, components: 0, version: bomForm.version, status: 'Active' };
    setBomList(prev => [...prev, newBOM]);
    setBomForm({ product: '', version: 'v1.0', type: 'Finished Good', uom: 'Set', description: '' });
    setShowBOMModal(false);
    toast(`BOM ${newBOM.id} created`);
  };

  const handleUpdateWOProgress = (id) => {
    setWoList(prev => prev.map(w => {
      if (w.id !== id) return w;
      const increment = Math.min(w.qty - w.produced, Math.ceil(w.qty * 0.1));
      const newProduced = w.produced + increment;
      return { ...w, produced: newProduced, status: newProduced >= w.qty ? 'Completed' : 'In-Progress' };
    }));
    toast(`Progress updated for ${id}`);
  };

  const primaryBtn = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'8px 16px', borderRadius:10,
    background:'linear-gradient(135deg,#ef4444,#b91c1c)',
    color:'#fff', border:'none', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
    boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
  };
  const outlineBtn = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'8px 16px', borderRadius:10,
    background:'transparent', color:'#c0392b',
    border:'1.5px solid #c0392b', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {activeTab === 0 && <button onClick={() => setShowBOMModal(true)} style={primaryBtn}>+ New BOM</button>}
        {activeTab === 1 && <button onClick={() => setShowWOModal(true)} style={primaryBtn}>+ New Work Order</button>}
        {activeTab === 2 && <button onClick={() => setShowWOModal(true)} style={primaryBtn}>+ New Plan</button>}
        {activeTab === 3 && <button onClick={() => setShowWOModal(true)} style={primaryBtn}>+ Schedule WO</button>}
        {activeTab === 5 && <button style={outlineBtn}>⬇ Export</button>}
        {activeTab === 6 && <button style={outlineBtn}>⬇ Export</button>}
      </div>
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM List</div>
            {bomList.map(b => (
              <div key={b.id} onClick={() => setSelectedBOM(b.id)}
                className="p-3 rounded-lg mb-2 cursor-pointer transition-all"
                style={{ border: `2px solid ${selectedBOM === b.id ? '#c0392b' : '#e2e8f0'}`, background: selectedBOM === b.id ? '#fdf5f5' : '#fff' }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{b.product}</div>
                    <div className="text-[11px] text-gray-400">{b.id} · {b.version} · {b.components} components</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM Tree — Engine Assembly A</div>
            <div className="font-mono text-xs">
              {bomTree.map((row, i) => (
                <div key={i} className="py-1.5 border-b border-gray-50 flex justify-between items-center">
                  <span style={{ color: row.level === 0 ? '#c0392b' : row.level === 1 ? '#1c2833' : '#718096', fontWeight: row.level === 0 ? 700 : 400 }}>{row.item}</span>
                  <div className="flex gap-3 items-center">
                    <span className="text-gray-400">{row.qty} {row.unit}</span>
                    <StatusBadge status={row.type} type={row.type === 'Finished' ? 'success' : row.type === 'Sub-Assembly' ? 'info' : 'gray'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'WO ID', render: v => <span className="font-semibold text-red-600">{v}</span> },
              { key: 'product', label: 'Product', render: v => <span className="font-semibold">{v}</span> },
              { key: 'qty', label: 'Target Qty' },
              { key: 'produced', label: 'Produced', render: (v, row) => <span className="font-bold" style={{ color: v >= row.qty ? '#27ae60' : '#f39c12' }}>{v}</span> },
              { key: 'shift', label: 'Shift' },
              { key: 'startDate', label: 'Start' },
              { key: 'endDate', label: 'End' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={woList}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Production Plan — April 2024</div>
            {[
              { product: 'Engine Assembly A', target: 200, planned: 200, color: '#27ae60' },
              { product: 'Gearbox Unit B', target: 120, planned: 90, color: '#f39c12' },
              { product: 'Clutch Assembly C', target: 300, planned: 300, color: '#27ae60' },
            ].map((p, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold">{p.product}</span>
                  <span className="font-bold" style={{ color: p.color }}>{p.planned}/{p.target}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(p.planned / p.target) * 100}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Resource Planning</div>
            {[
              { resource: 'CNC Machine M-200', allocated: 'Engine Assembly A', utilization: 85 },
              { resource: 'Hydraulic Press HP-50', allocated: 'Gearbox Unit B', utilization: 60 },
              { resource: 'Assembly Line 1', allocated: 'Clutch Assembly C', utilization: 100 },
            ].map((r, i) => (
              <div key={i} className={`py-3 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">{r.resource}</span>
                  <span className="font-bold" style={{ color: r.utilization >= 90 ? '#ef4444' : '#27ae60' }}>{r.utilization}%</span>
                </div>
                <div className="text-xs text-gray-400 mb-1.5">{r.allocated}</div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${r.utilization}%`, background: r.utilization >= 90 ? '#ef4444' : '#27ae60' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Production Schedule — Week of 14 Apr</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Product', 'WO ID', 'Mon 14', 'Tue 15', 'Wed 16', 'Thu 17', 'Fri 18', 'Sat 19', 'Shift', 'Status'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { product: 'Engine Assembly A', wo: 'WO-0891', mon: 50, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, shift: 'Morning', status: 'Completed' },
                  { product: 'Gearbox Unit B', wo: 'WO-0892', mon: 8, tue: 10, wed: 0, thu: 0, fri: 0, sat: 0, shift: 'General', status: 'In-Progress' },
                  { product: 'Clutch Assembly C', wo: 'WO-0893', mon: 0, tue: 0, wed: 20, thu: 30, fri: 30, sat: 0, shift: 'Night', status: 'Scheduled' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold">{r.product}</td>
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.wo}</td>
                    {[r.mon, r.tue, r.wed, r.thu, r.fri, r.sat].map((v, j) => (
                      <td key={j} className={`px-4 py-3 align-middle text-center font-bold ${v > 0 ? 'text-green-600' : 'text-gray-300'}`}>{v > 0 ? v : '—'}</td>
                    ))}
                    <td className="px-4 py-3 align-middle text-xs">{r.shift}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div className="flex flex-col gap-4">
          {woList.filter(w => w.status === 'In-Progress').map(wo => (
            <div key={wo.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-bold text-[15px]">{wo.product}</div>
                  <div className="text-xs text-gray-400">{wo.id} · {wo.shift} Shift</div>
                </div>
                <StatusBadge status={wo.status} />
              </div>
              <div className="flex justify-between text-xs mb-1.5">
                <span>Progress: <strong>{wo.produced}/{wo.qty}</strong></span>
                <span className="font-bold" style={{ color: '#c0392b' }}>{Math.round((wo.produced / wo.qty) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(wo.produced / wo.qty) * 100}%`, background: '#c0392b' }} />
              </div>
              <button onClick={() => handleUpdateWOProgress(wo.id)} className="mt-3 w-full py-2 rounded-xl text-sm font-semibold bg-red-600 text-white border-0 cursor-pointer font-[inherit] hover:bg-red-700 transition-all">+ Update Progress</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 5 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Production Efficiency (This Week)</div>
            <div className="text-xs text-gray-400 mb-3">Daily efficiency %</div>
            <BarChart data={[
              { label: 'Mon', value: 88, color: '#c0392b' }, { label: 'Tue', value: 92, color: '#c0392b' },
              { label: 'Wed', value: 85, color: '#c0392b' }, { label: 'Thu', value: 94, color: '#c0392b' },
              { label: 'Fri', value: 90, color: '#c0392b' }, { label: 'Sat', value: 78, color: '#f39c12' },
            ]} height={180} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Efficiency by Work Order</div>
            {workOrders.map((wo, i) => {
              const eff = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
              return (
                <div key={i} className={`py-3 ${i < workOrders.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold">{wo.product}</span>
                    <span className="font-extrabold" style={{ color: eff >= 90 ? '#27ae60' : eff >= 50 ? '#f39c12' : '#ef4444' }}>{eff}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${eff}%`, background: eff >= 90 ? '#27ae60' : eff >= 50 ? '#f39c12' : '#ef4444' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Good Units (This Week)</div>
            <div className="text-xs text-gray-400 mb-3">Daily production output</div>
            <BarChart data={goodData} height={180} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-1">Rejected / Wastage</div>
            <div className="text-xs text-gray-400 mb-3">Daily rejection count</div>
            <BarChart data={wastageData} height={180} />
          </div>
        </div>
      )}

      <Modal open={showWOModal} onClose={() => setShowWOModal(false)} title="Create Work Order"
        footer={<><button className={btnO} onClick={() => setShowWOModal(false)}>Cancel</button><button className={btnP} onClick={handleCreateWO}>Create Work Order</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Work Order ID</label><input className={inp} placeholder="Auto-generated" disabled /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product *</label><select className={inp} value={woForm.product} onChange={e => setWoForm(p=>({...p,product:e.target.value}))}><option>Engine Assembly A</option><option>Gearbox Unit B</option><option>Clutch Assembly C</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Target Quantity *</label><input type="number" className={inp} placeholder="0" value={woForm.qty} onChange={e => setWoForm(p=>({...p,qty:e.target.value}))} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Shift</label><select className={inp} value={woForm.shift} onChange={e => setWoForm(p=>({...p,shift:e.target.value}))}><option>Morning</option><option>General</option><option>Night</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Start Date *</label><input type="date" className={inp} value={woForm.startDate} onChange={e => setWoForm(p=>({...p,startDate:e.target.value}))} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">End Date *</label><input type="date" className={inp} value={woForm.endDate} onChange={e => setWoForm(p=>({...p,endDate:e.target.value}))} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">BOM Reference</label><select className={inp} value={woForm.bom} onChange={e => setWoForm(p=>({...p,bom:e.target.value}))}><option>BOM-001 — Engine Assembly A</option><option>BOM-002 — Gearbox Unit B</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Priority</label><select className={inp} value={woForm.priority} onChange={e => setWoForm(p=>({...p,priority:e.target.value}))}><option>Normal</option><option>High</option><option>Urgent</option></select></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-1"><label className="text-xs font-semibold text-gray-600">Remarks</label><textarea className={`${inp} resize-y min-h-[80px]`} placeholder="Additional instructions..." value={woForm.remarks} onChange={e => setWoForm(p=>({...p,remarks:e.target.value}))} /></div>
      </Modal>

      <Modal open={showBOMModal} onClose={() => setShowBOMModal(false)} title="Create New BOM"
        footer={<><button className={btnO} onClick={() => setShowBOMModal(false)}>Cancel</button><button className={btnP} onClick={handleCreateBOM}>Save BOM</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product Name *</label><input className={inp} placeholder="e.g. Engine Assembly D" value={bomForm.product} onChange={e => setBomForm(p=>({...p,product:e.target.value}))} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Version</label><input className={inp} placeholder="v1.0" value={bomForm.version} onChange={e => setBomForm(p=>({...p,version:e.target.value}))} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product Type</label><select className={inp} value={bomForm.type} onChange={e => setBomForm(p=>({...p,type:e.target.value}))}><option>Finished Good</option><option>Sub-Assembly</option><option>Semi-Finished</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Unit of Measure</label><input className={inp} placeholder="e.g. Set" value={bomForm.uom} onChange={e => setBomForm(p=>({...p,uom:e.target.value}))} /></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-1"><label className="text-xs font-semibold text-gray-600">Description</label><textarea className={`${inp} resize-y min-h-[80px]`} placeholder="BOM description..." value={bomForm.description} onChange={e => setBomForm(p=>({...p,description:e.target.value}))} /></div>
      </Modal>
    </div>
  );
}
