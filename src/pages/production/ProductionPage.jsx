import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';

const tabList = ['BOM', 'Work Orders', 'Production Tracking', 'Wastage'];
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

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBOM, setSelectedBOM] = useState('BOM-001');
  const [showWOModal, setShowWOModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Production</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span><span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Production</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={btnO} onClick={() => setShowBOMModal(true)}>+ New BOM</button>
          <button className={btnP} onClick={() => setShowWOModal(true)}>+ New Work Order</button>
        </div>
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {tabList.map((t, i) => (
          <div key={i} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 transition-all cursor-pointer flex-shrink-0 bg-transparent ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}>{t}</div>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">BOM List</div>
            {bom.map(b => (
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
            data={workOrders}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div className="flex flex-col gap-4">
          {workOrders.filter(w => w.status === 'In-Progress').map(wo => (
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
            </div>
          ))}
        </div>
      )}

      {activeTab === 3 && (
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
        footer={<><button className={btnO} onClick={() => setShowWOModal(false)}>Cancel</button><button className={btnP} onClick={() => setShowWOModal(false)}>Create Work Order</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Work Order ID</label><input className={inp} placeholder="Auto-generated" disabled /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product *</label><select className={inp}><option>Engine Assembly A</option><option>Gearbox Unit B</option><option>Clutch Assembly C</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Target Quantity *</label><input type="number" className={inp} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Shift</label><select className={inp}><option>Morning</option><option>General</option><option>Night</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Start Date *</label><input type="date" className={inp} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">End Date *</label><input type="date" className={inp} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">BOM Reference</label><select className={inp}><option>BOM-001 — Engine Assembly A</option><option>BOM-002 — Gearbox Unit B</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Priority</label><select className={inp}><option>Normal</option><option>High</option><option>Urgent</option></select></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-1"><label className="text-xs font-semibold text-gray-600">Remarks</label><textarea className={`${inp} resize-y min-h-[80px]`} placeholder="Additional instructions..." /></div>
      </Modal>

      <Modal open={showBOMModal} onClose={() => setShowBOMModal(false)} title="Create New BOM"
        footer={<><button className={btnO} onClick={() => setShowBOMModal(false)}>Cancel</button><button className={btnP} onClick={() => setShowBOMModal(false)}>Save BOM</button></>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product Name *</label><input className={inp} placeholder="e.g. Engine Assembly D" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Version</label><input className={inp} placeholder="v1.0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product Type</label><select className={inp}><option>Finished Good</option><option>Sub-Assembly</option><option>Semi-Finished</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Unit of Measure</label><input className={inp} placeholder="e.g. Set" /></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-1"><label className="text-xs font-semibold text-gray-600">Description</label><textarea className={`${inp} resize-y min-h-[80px]`} placeholder="BOM description..." /></div>
      </Modal>
    </div>
  );
}
