import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import StorageLocationPage from './StorageLocationPage';
import PincodeStockPage from './PincodeStockPage';

const tabList = ['Stock Dashboard', 'Stock Table', 'Warehouses', 'Stock Movement', 'Picking', 'Sorting & Packing', 'Batch Tracking', 'Ageing Stock', 'Defective Stock', 'Storage Locations', 'Pincode Stock'];

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
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: '0–30 days', value: 2, color: '#10b981' },
              { label: '31–60 days', value: 1, color: '#f59e0b' },
              { label: '61–90 days', value: 1, color: '#ef4444' },
              { label: '90+ days', value: 1, color: '#7f8c8d' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <div className="text-sm font-bold text-gray-800">Ageing Stock Analysis</div>
                <div className="text-xs text-gray-400 mt-0.5">Items not moved — with action suggestions</div>
              </div>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Export Report</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['SKU','Item','Warehouse','Qty','Last Movement','Days Idle','Bucket','Value','Suggested Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr></thead>
                <tbody>
                  {[
                    { sku: 'SKU-6634', item: 'Timing Chain Kit', wh: 'WH-03', qty: 0, lastMov: 'Jan 2024', days: 105, bucket: '90+', value: '₹0', action: 'Write-off', actionColor: '#ef4444' },
                    { sku: 'SKU-0934', item: 'Gasket Set A', wh: 'WH-01', qty: 5, lastMov: 'Dec 2023', days: 120, bucket: '90+', value: '₹3,250', action: 'Return to Supplier', actionColor: '#ef4444' },
                    { sku: 'SKU-2187', item: 'Oil Seal 35x52', wh: 'WH-02', qty: 8, lastMov: 'Jan 2024', days: 75, bucket: '61–90', value: '₹920', action: 'Offer Discount', actionColor: '#f59e0b' },
                    { sku: 'SKU-1042', item: 'Bearing 6205', wh: 'WH-01', qty: 12, lastMov: 'Feb 2024', days: 45, bucket: '31–60', value: '₹1,440', action: 'Monitor', actionColor: '#f59e0b' },
                    { sku: 'SKU-7745', item: 'Clutch Plate Set', wh: 'WH-01', qty: 95, lastMov: 'Mar 2024', days: 20, bucket: '0–30', value: '₹28,500', action: 'No Action', actionColor: '#10b981' },
                  ].map((r, i) => (
                    <tr key={i} className={`border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors ${r.days > 90 ? 'bg-red-50/20' : r.days > 60 ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-4 py-3 align-middle font-mono text-xs font-semibold text-red-700">{r.sku}</td>
                      <td className="px-4 py-3 align-middle font-semibold">{r.item}</td>
                      <td className="px-4 py-3 align-middle">{r.wh}</td>
                      <td className="px-4 py-3 align-middle font-bold">{r.qty}</td>
                      <td className="px-4 py-3 align-middle text-gray-500">{r.lastMov}</td>
                      <td className={`px-4 py-3 align-middle font-extrabold ${r.days > 90 ? 'text-red-500' : r.days > 60 ? 'text-amber-500' : r.days > 30 ? 'text-amber-400' : 'text-green-600'}`}>{r.days}d</td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: r.actionColor + '20', color: r.actionColor }}>{r.bucket}</span>
                      </td>
                      <td className="px-4 py-3 align-middle font-bold">{r.value}</td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: r.actionColor + '15', color: r.actionColor }}>{r.action}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 8 && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total Defective Units', value: 10, color: '#ef4444' },
              { label: 'Pending QC', value: 3, color: '#f59e0b' },
              { label: 'Awaiting Disposal', value: 5, color: '#8b5cf6' },
              { label: 'Repair in Progress', value: 2, color: '#3b82f6' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="text-sm font-bold text-gray-800">Defective Stock Register</div>
                <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">+ Log Defect</button>
              </div>
              {[
                { id: 'DEF-001', sku: 'SKU-1042', item: 'Bearing 6205', qty: 3, type: 'Dimensional', source: 'GRN Inspection', date: '14 Apr', daysAged: 1, stage: 'QC Hold' },
                { id: 'DEF-002', sku: 'SKU-4412', item: 'Crankshaft Seal', qty: 5, type: 'Surface Defect', source: 'Production', date: '13 Apr', daysAged: 2, stage: 'Defective Bin' },
                { id: 'DEF-003', sku: 'SKU-7745', item: 'Clutch Plate Set', qty: 2, type: 'Packaging Damage', source: 'Customer Return', date: '12 Apr', daysAged: 3, stage: 'Repair' },
              ].map((r, i) => (
                <div key={i} className={`py-3 ${i < 2 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold text-sm text-red-700">{r.id}</span>
                      <span className="text-xs text-gray-400 ml-2">{r.sku}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      r.stage === 'QC Hold' ? 'bg-amber-100 text-amber-700' :
                      r.stage === 'Repair' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.stage}</span>
                  </div>
                  <div className="font-semibold text-sm">{r.item} — {r.qty} units</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.type} · {r.source} · {r.date} · <span className={r.daysAged > 2 ? 'text-red-500 font-bold' : 'text-gray-400'}>{r.daysAged}d aged</span></div>
                  <div className="flex gap-1.5 mt-2">
                    <button className="px-2 py-1 text-[11px] rounded bg-blue-100 text-blue-800 font-semibold border-0 cursor-pointer font-[inherit]">Repair</button>
                    <button className="px-2 py-1 text-[11px] rounded bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]">Rework</button>
                    <button className="px-2 py-1 text-[11px] rounded bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">Scrap</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3.5">Movement Log — QC → Defective → Disposal/Repair</div>
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-gray-200 rounded" />
                {[
                  { event: 'DEF-001 — Bearing 6205 (3 units) flagged at GRN QC', time: '14 Apr, 09:15 AM', stage: 'QC Hold', color: '#f59e0b' },
                  { event: 'DEF-002 — Crankshaft Seal (5 units) moved to Defective Bin', time: '13 Apr, 02:00 PM', stage: 'Defective Bin', color: '#ef4444' },
                  { event: 'DEF-003 — Clutch Plate Set (2 units) sent for Repair', time: '12 Apr, 11:00 AM', stage: 'Repair', color: '#3b82f6' },
                  { event: 'DEF-000 — Oil Seal (4 units) scrapped & written off', time: '10 Apr, 04:00 PM', stage: 'Disposed', color: '#6b7280' },
                ].map((item, i) => (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <div className="absolute -left-[17px] top-1 w-3 h-3 rounded-full ring-2 ring-offset-1" style={{ background: item.color, borderColor: item.color }} />
                    <div className="text-sm font-semibold text-gray-800">{item.event}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{item.time}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: item.color + '20', color: item.color }}>{item.stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 9 && <StorageLocationPage />}
      {activeTab === 10 && <PincodeStockPage />}

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
