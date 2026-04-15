import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';

const tabList = ['Stock Dashboard', 'Stock Table', 'Warehouses', 'Stock Movement'];

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

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState(0);
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
