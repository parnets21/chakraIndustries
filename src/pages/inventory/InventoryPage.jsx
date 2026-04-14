import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea, Grid2, ModalBtn } from '../../components/forms/FormField';

const tabs = ['Stock Dashboard', 'Stock Table', 'Warehouses', 'Stock Movement'];

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

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [movTab, setMovTab]       = useState('Inward');
  const [showModal, setShowModal] = useState(false);

  const total = stockData.reduce((s, i) => s + i.qty, 0);
  const low   = stockData.filter(i => i.qty < i.minQty && i.qty > 0).length;
  const dead  = stockData.filter(i => i.qty === 0).length;

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Inventory</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Inventory</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Stock</button>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {tabs.map((t, i) => (
          <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {/* ── Stock Dashboard ── */}
      {activeTab === 0 && (
        <div>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Stock Units', value: total.toLocaleString(), color: '#fdf0ef', iconColor: '#c0392b' },
              { label: 'Low Stock Items',   value: low,                    color: '#fef9e7', iconColor: '#f39c12' },
              { label: 'Dead Stock Items',  value: dead,                   color: '#f2f3f4', iconColor: '#7f8c8d' },
              { label: 'Active SKUs',       value: stockData.filter(i => i.status === 'Active').length, color: '#eafaf1', iconColor: '#27ae60' },
            ].map((k, i) => (
              <div key={i} className="kpi-card" style={{ background: k.color, border: 'none' }}>
                <div className="kpi-value" style={{ color: k.iconColor }}>{k.value}</div>
                <div className="kpi-label">{k.label}</div>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: '60%', background: k.iconColor }} />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Stock by Category</div>
            <BarChart data={stockChartData} height={180} />
          </div>
        </div>
      )}

      {/* ── Stock Table ── */}
      {activeTab === 1 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'sku',     label: 'SKU',       render: v => <span style={{ fontWeight: 600, color: '#c0392b', fontFamily: 'monospace' }}>{v}</span> },
              { key: 'name',    label: 'Item Name',  render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
              { key: 'warehouse', label: 'Warehouse' },
              { key: 'qty',     label: 'Qty',        render: (v, row) => <span style={{ fontWeight: 700, color: v < row.minQty ? '#e74c3c' : '#27ae60' }}>{v}</span> },
              { key: 'minQty',  label: 'Min Qty' },
              { key: 'batch',   label: 'Batch' },
              { key: 'status',  label: 'Status',     render: v => <StatusBadge status={v} /> },
              { key: 'sku',     label: 'Actions',    render: () => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm">Adjust</button>
                  <button className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text)' }}>Move</button>
                </div>
              )},
            ]}
            data={stockData}
          />
        </div>
      )}

      {/* ── Warehouses ── */}
      {activeTab === 2 && (
        <div className="grid-3">
          {warehouses.map((wh, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{wh.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{wh.id} · {wh.location}</div>
                </div>
                <StatusBadge status="Active" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#c0392b' }}>{wh.skus}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Active SKUs</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f39c12' }}>{wh.manager.split(' ')[0]}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>Manager</div>
                </div>
              </div>
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>Capacity Used</span>
                <span style={{ fontWeight: 700 }}>{wh.used}/{wh.capacity}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(wh.used / wh.capacity) * 100}%`, background: wh.used / wh.capacity > 0.8 ? '#e74c3c' : '#c0392b' }} />
              </div>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 14, width: '100%' }}>View Location Map</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Stock Movement ── */}
      {activeTab === 3 && (
        <div className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['Inward', 'Outward', 'Transfer'].map(t => (
              <button key={t} className={`btn btn-sm${movTab === t ? ' btn-primary' : ' btn-outline'}`} onClick={() => setMovTab(t)}>{t}</button>
            ))}
          </div>
          <DataTable
            columns={[
              { key: 'id',   label: 'Mov ID', render: v => <span style={{ fontWeight: 600, color: '#c0392b' }}>{v}</span> },
              { key: 'sku',  label: 'SKU' },
              { key: 'name', label: 'Item' },
              { key: 'qty',  label: 'Qty',  render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
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

      {/* ── Add Stock Modal ── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Stock Entry"
        footer={
          <>
            <ModalBtn variant="outline" onClick={() => setShowModal(false)}>Cancel</ModalBtn>
            <ModalBtn onClick={() => setShowModal(false)}>Add Stock</ModalBtn>
          </>
        }
      >
        <Grid2>
          <Input label="SKU *"        placeholder="e.g. SKU-1042" />
          <Input label="Item Name *"  placeholder="Item description" />
          <Select label="Warehouse *">
            <option>WH-01 — Main Warehouse</option>
            <option>WH-02 — Secondary Store</option>
            <option>WH-03 — Finished Goods</option>
          </Select>
          <Input label="Quantity *"       type="number" placeholder="0" />
          <Input label="Batch Number"     placeholder="e.g. B-2024-04" />
          <Input label="Min Stock Level"  type="number" placeholder="0" />
          <Select label="Category">
            <option>Raw Material</option>
            <option>WIP</option>
            <option>Finished Good</option>
            <option>Spare Parts</option>
          </Select>
          <Select label="Unit of Measure">
            <option>Nos</option>
            <option>Set</option>
            <option>Kg</option>
            <option>Litre</option>
            <option>Metre</option>
          </Select>
        </Grid2>
        <Textarea label="Remarks" placeholder="Optional notes..." />
      </Modal>

    </div>
  );
}
