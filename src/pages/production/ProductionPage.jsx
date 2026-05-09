import { useState, useEffect } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import CreateWorkOrderModal from './components/CreateWorkOrderModal';
import CreateBOMModal from './components/CreateBOMModal';

const tabList = ['BOM', 'Work Orders', 'Production Planning', 'Production Scheduling', 'Production Tracking', 'Efficiency', 'Wastage'];
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
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [showWOModal, setShowWOModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [bomList, setBomList] = useState([]);
  const [woList, setWoList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [bomForm, setBomForm] = useState({ product: '', version: 'v1.0', type: 'Finished Good', uom: 'Set', description: '' });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(false);
      // Mock data
      const mockBOMs = [
        { _id: '1', product: 'Engine Assembly A', version: 'v1.0', type: 'Finished Good', components: [{ itemName: 'Piston Ring', qty: 4 }], status: 'Active' },
        { _id: '2', product: 'Gearbox Unit B', version: 'v1.0', type: 'Finished Good', components: [{ itemName: 'Gear Set', qty: 2 }], status: 'Active' },
      ];
      const mockWOs = [
        { _id: 'wo1', product: 'Engine Assembly A', qty: 200, produced: 150, shift: 'Morning', startDate: new Date('2026-05-01'), endDate: new Date('2026-05-10'), status: 'In-Progress' },
        { _id: 'wo2', product: 'Gearbox Unit B', qty: 120, produced: 90, shift: 'General', startDate: new Date('2026-05-02'), endDate: new Date('2026-05-12'), status: 'In-Progress' },
      ];
      const mockStats = { totalWorkOrders: 5, completedWorkOrders: 2, inProgressWorkOrders: 2, scheduledWorkOrders: 1, totalBOMs: 2 };
      
      setBomList(mockBOMs);
      setWoList(mockWOs);
      setStats(mockStats);
      
      if (mockBOMs.length > 0) {
        setSelectedBOM(mockBOMs[0]._id);
      }
    } catch (error) {
      toast(error.message || 'Failed to fetch data', 'error');
    }
  };

  const handleWorkOrderSaved = () => {
    fetchData();
  };

  const handleCreateBOM = async () => {
    if (!bomForm.product) { toast('Product name is required', 'error'); return; }
    try {
      const newBOM = {
        _id: `bom${bomList.length + 1}`,
        product: bomForm.product,
        version: bomForm.version,
        type: bomForm.type,
        uom: bomForm.uom,
        description: bomForm.description,
        components: [],
        status: 'Active'
      };
      setBomList(prev => [...prev, newBOM]);
      setBomForm({ product: '', version: 'v1.0', type: 'Finished Good', uom: 'Set', description: '' });
      setShowBOMModal(false);
      toast(`BOM created successfully`);
    } catch (error) {
      toast(error.message || 'Failed to create BOM', 'error');
    }
  };

  const handleUpdateWOProgress = async (id) => {
    try {
      const wo = woList.find(w => w._id === id);
      if (!wo) return;
      const increment = Math.min(wo.qty - wo.produced, Math.ceil(wo.qty * 0.1));
      const newProduced = wo.produced + increment;
      
      setWoList(prev => prev.map(w => w._id === id ? { ...w, produced: newProduced } : w));
      toast(`Progress updated for ${id}`);
    } catch (error) {
      toast(error.message || 'Failed to update progress', 'error');
    }
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
        {activeTab === 5 && <button onClick={() => alert('📊 Exporting efficiency report...')} style={outlineBtn}>⬇ Export</button>}
        {activeTab === 6 && <button onClick={() => alert('📊 Exporting wastage report...')} style={outlineBtn}>⬇ Export</button>}
      </div>
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM List</div>
            {loading ? (
              <div className="text-center py-4 text-gray-400">Loading BOMs...</div>
            ) : bomList.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No BOMs found</div>
            ) : (
              bomList.map(b => (
                <div key={b._id} onClick={() => setSelectedBOM(b._id)}
                  className="p-3 rounded-lg mb-2 cursor-pointer transition-all"
                  style={{ border: `2px solid ${selectedBOM === b._id ? '#c0392b' : '#e2e8f0'}`, background: selectedBOM === b._id ? '#fdf5f5' : '#fff' }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">{b.product}</div>
                      <div className="text-[11px] text-gray-400">{b._id.slice(-6)} · {b.version} · {b.components?.length || 0} components</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM Tree — {bomList.find(b => b._id === selectedBOM)?.product || 'Select BOM'}</div>
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
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading work orders...</div>
          ) : (
            <DataTable
              columns={[
                { key: '_id', label: 'WO ID', render: v => <span className="font-semibold text-red-600">{v.slice(-6)}</span> },
                { key: 'product', label: 'Product', render: v => <span className="font-semibold">{v}</span> },
                { key: 'qty', label: 'Target Qty' },
                { key: 'produced', label: 'Produced', render: (v, row) => <span className="font-bold" style={{ color: v >= row.qty ? '#27ae60' : '#f39c12' }}>{v}</span> },
                { key: 'shift', label: 'Shift' },
                { key: 'startDate', label: 'Start', render: v => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) },
                { key: 'endDate', label: 'End', render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—' },
                { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              ]}
              data={woList}
            />
          )}
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
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading production tracking...</div>
          ) : woList.filter(w => w.status === 'In-Progress').length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center text-gray-400">No in-progress work orders</div>
          ) : (
            woList.filter(w => w.status === 'In-Progress').map(wo => (
              <div key={wo._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="font-bold text-[15px]">{wo.product}</div>
                    <div className="text-xs text-gray-400">{wo._id.slice(-6)} · {wo.shift} Shift</div>
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
                <button onClick={() => handleUpdateWOProgress(wo._id)} className="mt-3 w-full py-2 rounded-xl text-sm font-semibold bg-red-600 text-white border-0 cursor-pointer font-[inherit] hover:bg-red-700 transition-all">+ Update Progress</button>
              </div>
            ))
          )}
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
            {woList.map((wo, i) => {
              const eff = wo.qty > 0 ? Math.round((wo.produced / wo.qty) * 100) : 0;
              return (
                <div key={i} className={`py-3 ${i < woList.length - 1 ? 'border-b border-gray-100' : ''}`}>
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

      <CreateWorkOrderModal 
        open={showWOModal} 
        onClose={() => setShowWOModal(false)} 
        onSaved={handleWorkOrderSaved}
      />

      <CreateBOMModal 
        open={showBOMModal} 
        onClose={() => setShowBOMModal(false)} 
        onSaved={handleWorkOrderSaved}
      />
    </div>
  );
}
