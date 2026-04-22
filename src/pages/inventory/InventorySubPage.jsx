import { useState } from 'react';
import InventoryPage from './InventoryPage';
import { PageHeader, KpiStrip } from '../../components/common/PageShell';
import {
  MdInventory2, MdWarehouse, MdSwapHoriz, MdCheckBox,
  MdInventory, MdBatchPrediction, MdHourglassEmpty,
  MdBrokenImage, MdLocationOn, MdPinDrop, MdAdd,
} from 'react-icons/md';

const TAB_MAP = {
  dashboard:  0,
  stock:      1,
  warehouses: 2,
  movement:   3,
  picking:    4,
  packing:    5,
  batch:      6,
  ageing:     7,
  defective:  8,
  storage:    9,
  pincode:    10,
};

const PAGE_META = {
  dashboard:  {
    title: 'Stock Dashboard',
    breadcrumb: 'Inventory › Dashboard',
    actionLabel: '+ Add Stock',
    kpis: [
      { label: 'Total Stock Units', value: '855',  icon: <MdInventory2 size={18} />,      color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)',  change: '8.2%', up: true  },
      { label: 'Low Stock Items',   value: '3',    icon: <MdHourglassEmpty size={18} />,  color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)',  change: '2',    up: false },
      { label: 'Dead Stock',        value: '1',    icon: <MdBrokenImage size={18} />,     color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)'  },
      { label: 'Active SKUs',       value: '5',    icon: <MdCheckBox size={18} />,        color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)',  change: '1',    up: true  },
    ],
  },
  stock: {
    title: 'Stock Table',
    breadcrumb: 'Inventory › Stock',
    actionLabel: '+ Add Stock',
    kpis: [
      { label: 'Total SKUs',     value: '8',   icon: <MdInventory2 size={18} />,     color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
      { label: 'Critical Items', value: '3',   icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
      { label: 'Warehouses',     value: '3',   icon: <MdWarehouse size={18} />,      color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'  },
      { label: 'Total Units',    value: '855', icon: <MdInventory size={18} />,      color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    ],
  },
  warehouses: {
    title: 'Multi-Warehouse Management',
    breadcrumb: 'Inventory › Warehouses',
    actionLabel: '+ Add Warehouse',
    kpis: [
      { label: 'Total Warehouses', value: '3',      icon: <MdWarehouse size={18} />,   color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)' },
      { label: 'Total Capacity',   value: '10,000', icon: <MdInventory2 size={18} />,  color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'  },
      { label: 'Used Capacity',    value: '6,700',  icon: <MdInventory size={18} />,   color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)' },
      { label: 'Avg Utilization',  value: '67%',    icon: <MdCheckBox size={18} />,    color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)' },
    ],
  },
  movement: {
    title: 'Stock Movement',
    breadcrumb: 'Inventory › Movement',
    actionLabel: '+ Record Movement',
    kpis: [
      { label: 'Inward Today',    value: '2', icon: <MdSwapHoriz size={18} />, color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
      { label: 'Outward Today',   value: '1', icon: <MdSwapHoriz size={18} />, color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
      { label: 'Transfers',       value: '1', icon: <MdSwapHoriz size={18} />, color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'   },
      { label: 'Total Movements', value: '4', icon: <MdInventory2 size={18} />,color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
    ],
  },
  picking: {
    title: 'Picking Workflow',
    breadcrumb: 'Inventory › Picking',
    actionLabel: '+ New Pick List',
    kpis: [
      { label: 'Pending Picks',    value: '1', icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: 'In Progress',      value: '1', icon: <MdInventory2 size={18} />,     color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'   },
      { label: 'Completed Today',  value: '1', icon: <MdCheckBox size={18} />,       color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
      { label: 'Total Pick Lists', value: '3', icon: <MdInventory size={18} />,      color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
    ],
  },
  packing: {
    title: 'Sorting & Packing',
    breadcrumb: 'Inventory › Packing',
    actionLabel: '+ New Sort Job',
    kpis: [
      { label: 'Pending Packing', value: '1', icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: 'In Progress',     value: '1', icon: <MdInventory2 size={18} />,     color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'   },
      { label: 'Packed Today',    value: '1', icon: <MdCheckBox size={18} />,       color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
      { label: 'Sorting Queue',   value: '3', icon: <MdInventory size={18} />,      color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
    ],
  },
  batch: {
    title: 'Batch Tracking',
    breadcrumb: 'Inventory › Batch',
    actionLabel: '+ Add Batch',
    kpis: [
      { label: 'Active Batches',  value: '2', icon: <MdBatchPrediction size={18} />, color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
      { label: 'Critical Expiry', value: '1', icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: 'Dead Batches',    value: '1', icon: <MdBrokenImage size={18} />,    color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)'  },
      { label: 'Total Batches',   value: '4', icon: <MdInventory2 size={18} />,     color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
    ],
  },
  ageing: {
    title: 'Ageing Stock Analysis',
    breadcrumb: 'Inventory › Ageing',
    actionLabel: '⬇ Export Report',
    kpis: [
      { label: '0–30 Days',  value: '2', icon: <MdInventory2 size={18} />,     color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
      { label: '31–60 Days', value: '1', icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: '61–90 Days', value: '1', icon: <MdInventory size={18} />,      color: '#f97316', color2: '#fb923c', glow: 'rgba(249,115,22,0.25)'  },
      { label: '90+ Days',   value: '2', icon: <MdBrokenImage size={18} />,    color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
    ],
  },
  defective: {
    title: 'Defective Stock',
    breadcrumb: 'Inventory › Defective',
    actionLabel: '+ Log Defect',
    kpis: [
      { label: 'Total Defective', value: '10', icon: <MdBrokenImage size={18} />,    color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
      { label: 'QC Hold',         value: '3',  icon: <MdHourglassEmpty size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: 'In Repair',       value: '2',  icon: <MdInventory2 size={18} />,     color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'   },
      { label: 'Disposed',        value: '5',  icon: <MdCheckBox size={18} />,       color: '#64748b', color2: '#94a3b8', glow: 'rgba(100,116,139,0.2)'  },
    ],
  },
  storage: {
    title: 'Storage Location Mapping',
    breadcrumb: 'Inventory › Storage Locations',
    actionLabel: '+ Add Location',
    kpis: [
      { label: 'Total Zones',  value: '3', icon: <MdLocationOn size={18} />,  color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
      { label: 'Total Racks',  value: '4', icon: <MdWarehouse size={18} />,   color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'   },
      { label: 'Total Shelves',value: '5', icon: <MdInventory2 size={18} />,  color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: 'Total Bins',   value: '9', icon: <MdInventory size={18} />,   color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
    ],
  },
  pincode: {
    title: 'Pincode & Godown Stock',
    breadcrumb: 'Inventory › Pincode View',
    kpis: [
      { label: 'Pincodes Mapped', value: '3',   icon: <MdPinDrop size={18} />,    color: '#c0392b', color2: '#e74c3c', glow: 'rgba(192,57,43,0.25)'  },
      { label: 'Total Godowns',   value: '4',   icon: <MdWarehouse size={18} />,  color: '#2563eb', color2: '#3b82f6', glow: 'rgba(37,99,235,0.2)'   },
      { label: 'Total SKUs',      value: '7',   icon: <MdInventory2 size={18} />, color: '#d97706', color2: '#f59e0b', glow: 'rgba(217,119,6,0.25)'  },
      { label: 'Total Units',     value: '855', icon: <MdInventory size={18} />,  color: '#16a34a', color2: '#22c55e', glow: 'rgba(22,163,74,0.25)'  },
    ],
  },
};

export default function InventorySubPage({ tab }) {
  const tabIndex = TAB_MAP[tab] ?? 0;
  const meta = PAGE_META[tab] || PAGE_META.dashboard;
  const [showModal, setShowModal] = useState(false);

  const ActionBtn = meta.actionLabel ? (
    <button
      onClick={() => setShowModal(true)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 10,
        background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
        color: '#fff', border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
        boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
      }}
    >
      <MdAdd size={16} />
      {meta.actionLabel.replace(/^\+\s*/, '')}
    </button>
  ) : null;

  return (
    <div>
      <PageHeader title={meta.title} breadcrumb={meta.breadcrumb} action={ActionBtn} />
      <KpiStrip kpis={meta.kpis} />
      <InventoryPage key={tabIndex} initialTab={tabIndex} externalShowModal={showModal} onExternalModalClose={() => setShowModal(false)} />
    </div>
  );
}
