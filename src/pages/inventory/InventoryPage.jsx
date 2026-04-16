import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';

const tabList = ['Stock Dashboard', 'Stock Table', 'Warehouses', 'Stock Movement', 'Picking', 'Sorting & Packing', 'Batch Tracking', 'Ageing Stock', 'Defective Stock'];

const stockData = [
  { sku: 'SKU-1042', name: 'Bearing 6205',      warehouse: 'WH-01', qty: 12,  batch: 'B-2024-04', minQty: 50, status: 'Critical' },
  { sku: 'SKU-2187', name: 'Oil Seal 35x52',    warehouse: 'WH-02', qty: 8,   batch: 'B-2024-03', minQty: 30, status: 'Critical' },
  { sku: 'SKU-0934', name: 'Gasket Set A',       warehouse: 'WH-01', qty: 5,   batch: 'B-2024-04', minQty: 25, status: 'Critical' },
  { sku: 'SKU-3301', name: 'Piston Ring 80mm',   warehouse: 'WH-03', qty: 340, batch: 'B-2024-02', minQty: 40, status: 'Active'   },
  { sku: 'SKU-4412', name: 'Crankshaft Seal',    warehouse: 'WH-01', qty: 220, batch: 'B-2024-04', minQty: 20, status: 'Active'   },
  { sku: 'SKU-5523', name: 'Valve Spring Set',   warehouse: 'WH-02', qty: 180, batch: 'B-2024-03', minQty: 30, status: 'Active'   },
  { sku: 'SKU-6634', name: 'Timing Chain Kit',   warehouse: 'WH-03', qty: 0,   batch: 'B-2024-01', minQty: 10, status: 'Dead'     },
  { sku: 'SKU-7745', name: 'Clutch Plate Set',   warehouse: 'WH-01', qty: 95,  batch: 'B-2024-04', minQty: 15, status: 'Active'   },
];

const warehouses = [
  { id: 'WH-01', name: 'Main Warehouse',  location: 'Pune - Sector 4', capacity: 5000, used: 3200, skus: 142, manager: 'Rajesh Patil' },
  { id: 'WH-02', name: 'Secondary Store', location: 'Pune - Sector 7', capacity: 2000, used: 1100, skus: 68,  manager: 'Meena Joshi'  },
  { id: 'WH-03', name: 'Finished Goods',  location: 'Nashik Plant',    capacity: 3000, used: 2400, skus: 95,  manager: 'Suresh Rao'   },
];

const movements = [
  { id: 'MV-001', type: 'Inward',   sku: 'SKU-3301', name: 'Piston Ring 80mm',  qty: 200, from: 'Supplier', to: 'WH-01',     date: '14 Apr', ref: 'GRN-0234' },
  { id: 'MV-002', type: 'Outward',  sku: 'SKU-4412', name: 'Crankshaft Seal',   qty: 50,  from: 'WH-01',    to: 'Production', date: '14 Apr', ref: 'WO-0891'  },
  { id: 'MV-003', type: 'Transfer', sku: 'SKU-5523', name: 'Valve Spring Set',  qty: 30,  from: 'WH-02',    to: 'WH-01',     date: '13 Apr', ref: 'TR-0045'  },
  { id: 'MV-004', type: 'Inward',   sku: 'SKU-7745', name: 'Clutch Plate Set',  qty: 100, from: 'Supplier', to: 'WH-03',     date: '13 Apr', ref: 'GRN-0233' },
];

const stockChartData = [
  { label: 'Raw Mat',  value: 4200, color: '#c0392b' },
  { label: 'WIP',      value: 1800, color: '#f39c12' },
  { label: 'Finished', value: 3100, color: '#27ae60' },
  { label: 'Dead',     value: 420,  color: '#7f8c8d' },
];

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';

export default function InventoryPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [movTab, setMovTab] = useState('Inward');
  const [showModal, setShowModal] = useState(false);

  const total = stockData.reduce((s, i) => s + i.qty, 0);
  const low   = stockData.filter(i => i.qty < i.minQty && i.qty > 0).length;
  const dead  = stockData.filter(i => i.qty === 0).length;

  const kpis = [
    { label: 'Total Stock Units', value: total.toLocaleString(), color: '#c0392b' },
    { label: 'Low Stock Items',   value: low,                    color: '#f39c12' },
    { label: 'Dead Stock Items',  value: dead,                   color: '#7f8c8d' },
    { label: 'Active SKUs',       value: stockData.filter(i => i.status === 'Active').length, color: '#27ae60' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Inventory</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Inventory</span>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all" onClick={() => setShowModal(true)}>+ Add Stock</button>
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {tabList.map((t, i) => (
          <div key={i}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 transition-all cursor-pointer flex-shrink-0 bg-transparent ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}
            onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {activeTab === 0 && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {kpis.map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: '60%', background: k.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Stock by Category</div>
            <BarChart data={stockChartData} height={180} />
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'sku',     label: 'SKU',       render: v => <span className="font-semibold text-red-600 font-mono">{v}</span> },
              { key: 'name',    label: 'Item Name',  render: v => <span className="font-semibold">{v}</span> },
              { key: 'warehouse', label: 'Warehouse' },
              { key: 'qty',     label: 'Qty',        render: (v, row) => <span className="font-bold" style={{ color: v < row.minQty ? '#e74c3c' : '#27ae60' }}>{v}</span> },
              { key: 'minQty',  label: 'Min Qty' },
              { key: 'batch',   label: 'Batch' },
              { key: 'status',  label: 'Status',     render: v => <StatusBadge status={v} /> },
              { key: 'sku',     label: 'Actions',    render: () => (
                <div className="flex gap-1.5">
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 font-semibold hover:bg-red-700 hover:text-white transition-all">Adjust</button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-800 font-semibold">Move</button>
                </div>
              )},
            ]}
            data={stockData}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-[15px]">{wh.name}</div>
                  <div className="text-xs text-gray-400">{wh.id} · {wh.location}</div>
                </div>
                <StatusBadge status="Active" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="text-lg font-black" style={{ color: '#c0392b' }}>{wh.skus}</div>
                  <div className="text-[11px] text-gray-400">Active SKUs</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5">
                  <div className="text-lg font-black" style={{ color: '#f39c12' }}>{wh.manager.split(' ')[0]}</div>
                  <div className="text-[11px] text-gray-400">Manager</div>
                </div>
              </div>
              <div className="flex justify-between text-xs mb-1.5">
                <span>Capacity Used</span>
                <span className="font-bold">{wh.used}/{wh.capacity}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(wh.used / wh.capacity) * 100}%`, background: wh.used / wh.capacity > 0.8 ? '#e74c3c' : '#c0392b' }} />
              </div>
              <button className="inline-flex items-center justify-center gap-1.5 w-full mt-3.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 font-semibold hover:bg-red-700 hover:text-white transition-all">View Location Map</button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex gap-2 mb-4">
            {['Inward', 'Outward', 'Transfer'].map(t => (
              <button key={t} onClick={() => setMovTab(t)}
                className={movTab === t
                  ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold shadow-md'
                  : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 font-semibold hover:bg-red-700 hover:text-white transition-all'}>
                {t}
              </button>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'id',   label: 'Mov ID', render: v => <span className="font-semibold text-red-600">{v}</span> },
              { key: 'sku',  label: 'SKU' },
              { key: 'name', label: 'Item' },
              { key: 'qty',  label: 'Qty',  render: v => <span className="font-bold">{v}</span> },
              { key: 'from', label: 'From' },
              { key: 'to',   label: 'To' },
              { key: 'ref',  label: 'Reference' },
              { key: 'date', label: 'Date' },
              { key: 'type', label: 'Type', render: v => <StatusBadge status={v} type={v === 'Inward' ? 'success' : v === 'Outward' ? 'danger' : 'info'} /> },
            ]}
            data={movements.filter(m => m.type === movTab)}
          />
        </div>
      )}

      {activeTab === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Picking Workflow</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Pick ID','Order Ref','SKU','Item','Qty','Location','Picker','Status','Action'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { id: 'PCK-001', order: 'ORD-2024-089', sku: 'SKU-3301', item: 'Piston Ring 80mm', qty: 50, loc: 'WH-01 / A3', picker: 'Ramesh', status: 'Completed' },
                  { id: 'PCK-002', order: 'ORD-2024-089', sku: 'SKU-4412', item: 'Crankshaft Seal', qty: 20, loc: 'WH-01 / B2', picker: 'Suresh', status: 'In Progress' },
                  { id: 'PCK-003', order: 'ORD-2024-087', sku: 'SKU-5523', item: 'Valve Spring Set', qty: 30, loc: 'WH-02 / B1', picker: 'Anil', status: 'Pending' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.id}</td>
                    <td className="px-4 py-3 align-middle">{r.order}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs text-red-700">{r.sku}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.item}</td>
                    <td className="px-4 py-3 align-middle font-bold">{r.qty}</td>
                    <td className="px-4 py-3 align-middle text-xs">{r.loc}</td>
                    <td className="px-4 py-3 align-middle">{r.picker}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 align-middle">
                      <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">Confirm Pick</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Sorting Queue</div>
            {[
              { id: 'SRT-001', sku: 'SKU-3301', item: 'Piston Ring 80mm', qty: 200, category: 'Grade A', status: 'Sorted' },
              { id: 'SRT-002', sku: 'SKU-1042', item: 'Bearing 6205', qty: 50, category: 'Grade B', status: 'Pending' },
              { id: 'SRT-003', sku: 'SKU-7745', item: 'Clutch Plate Set', qty: 80, category: 'Grade A', status: 'In Progress' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <div className="font-semibold text-sm">{r.item}</div>
                  <div className="text-xs text-gray-400">{r.id} · {r.sku} · Qty: {r.qty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">{r.category}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Packing Queue</div>
            {[
              { id: 'PKG-001', order: 'ORD-2024-089', items: 3, weight: '42 kg', type: 'Standard Box', status: 'Packed' },
              { id: 'PKG-002', order: 'ORD-2024-087', items: 5, weight: '68 kg', type: 'Custom Branded', status: 'Packing' },
              { id: 'PKG-003', order: 'ORD-2024-085', items: 2, weight: '28 kg', type: 'Bulk Loose', status: 'Pending' },
            ].map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <div className="font-semibold text-sm">{r.order}</div>
                  <div className="text-xs text-gray-400">{r.id} · {r.items} items · {r.weight} · {r.type}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Batch Tracking</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Batch No.','SKU','Item','Qty','Mfg Date','Expiry','Warehouse','Status'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { batch: 'B-2024-04', sku: 'SKU-3301', item: 'Piston Ring 80mm', qty: 340, mfg: 'Apr 2024', exp: 'Apr 2026', wh: 'WH-03', status: 'Active' },
                  { batch: 'B-2024-03', sku: 'SKU-5523', item: 'Valve Spring Set', qty: 180, mfg: 'Mar 2024', exp: 'Mar 2026', wh: 'WH-02', status: 'Active' },
                  { batch: 'B-2024-01', sku: 'SKU-6634', item: 'Timing Chain Kit', qty: 0, mfg: 'Jan 2024', exp: 'Jan 2026', wh: 'WH-03', status: 'Dead' },
                  { batch: 'B-2023-12', sku: 'SKU-1042', item: 'Bearing 6205', qty: 12, mfg: 'Dec 2023', exp: 'Dec 2025', wh: 'WH-01', status: 'Critical' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-mono text-xs font-bold text-red-700">{r.batch}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs">{r.sku}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.item}</td>
                    <td className="px-4 py-3 align-middle font-bold">{r.qty}</td>
                    <td className="px-4 py-3 align-middle text-gray-500">{r.mfg}</td>
                    <td className="px-4 py-3 align-middle text-gray-500">{r.exp}</td>
                    <td className="px-4 py-3 align-middle">{r.wh}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 7 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="text-sm font-bold text-gray-800">Ageing Stock Analysis</div>
              <div className="text-xs text-gray-400 mt-0.5">Items not moved in 90+ days</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Export Report</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['SKU','Item','Warehouse','Qty','Last Movement','Days Idle','Value','Action'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { sku: 'SKU-6634', item: 'Timing Chain Kit', wh: 'WH-03', qty: 0, lastMov: 'Jan 2024', days: 105, value: '₹0' },
                  { sku: 'SKU-0934', item: 'Gasket Set A', wh: 'WH-01', qty: 5, lastMov: 'Dec 2023', days: 120, value: '₹3,250' },
                  { sku: 'SKU-2187', item: 'Oil Seal 35x52', wh: 'WH-02', qty: 8, lastMov: 'Jan 2024', days: 95, value: '₹920' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-mono text-xs font-semibold text-red-700">{r.sku}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.item}</td>
                    <td className="px-4 py-3 align-middle">{r.wh}</td>
                    <td className="px-4 py-3 align-middle font-bold">{r.qty}</td>
                    <td className="px-4 py-3 align-middle text-gray-500">{r.lastMov}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${r.days > 100 ? 'text-red-500' : 'text-amber-500'}`}>{r.days}d</td>
                    <td className="px-4 py-3 align-middle font-bold">{r.value}</td>
                    <td className="px-4 py-3 align-middle">
                      <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">Mark for Clearance</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="text-sm font-bold text-gray-800">Defective Stock Management</div>
              <div className="text-xs text-gray-400 mt-0.5">Quarantined & rejected items</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">+ Log Defect</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Defect ID','SKU','Item','Qty','Defect Type','Source','Reported By','Date','Action'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { id: 'DEF-001', sku: 'SKU-1042', item: 'Bearing 6205', qty: 3, type: 'Dimensional', source: 'GRN Inspection', by: 'Vijay Singh', date: '14 Apr' },
                  { id: 'DEF-002', sku: 'SKU-4412', item: 'Crankshaft Seal', qty: 5, type: 'Surface Defect', source: 'Production', by: 'Anil Rao', date: '13 Apr' },
                  { id: 'DEF-003', sku: 'SKU-7745', item: 'Clutch Plate Set', qty: 2, type: 'Packaging Damage', source: 'Customer Return', by: 'Suresh Kumar', date: '12 Apr' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.id}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs">{r.sku}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.item}</td>
                    <td className="px-4 py-3 align-middle font-bold text-red-500">{r.qty}</td>
                    <td className="px-4 py-3 align-middle">{r.type}</td>
                    <td className="px-4 py-3 align-middle text-xs text-gray-500">{r.source}</td>
                    <td className="px-4 py-3 align-middle">{r.by}</td>
                    <td className="px-4 py-3 align-middle text-gray-400">{r.date}</td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex gap-1.5">
                        <button className="px-2 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]">Rework</button>
                        <button className="px-2 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">Scrap</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Stock Entry"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all" onClick={() => setShowModal(false)}>Add Stock</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">SKU *</label><input className={inputCls} placeholder="e.g. SKU-1042" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Item Name *</label><input className={inputCls} placeholder="Item description" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Warehouse *</label><select className={inputCls}><option>WH-01 — Main Warehouse</option><option>WH-02 — Secondary Store</option><option>WH-03 — Finished Goods</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Quantity *</label><input type="number" className={inputCls} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Batch Number</label><input className={inputCls} placeholder="e.g. B-2024-04" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Min Stock Level</label><input type="number" className={inputCls} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Category</label><select className={inputCls}><option>Raw Material</option><option>WIP</option><option>Finished Good</option><option>Spare Parts</option></select></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Unit of Measure</label><select className={inputCls}><option>Nos</option><option>Set</option><option>Kg</option><option>Litre</option><option>Metre</option></select></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-1">
          <label className="text-xs font-semibold text-gray-600">Remarks</label>
          <textarea className={`${inputCls} resize-y min-h-[80px]`} placeholder="Optional notes..." />
        </div>
      </Modal>
    </div>
  );
}
