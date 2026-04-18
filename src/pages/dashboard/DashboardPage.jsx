import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import StatusBadge from '../../components/common/StatusBadge';
import { useEffect, useState } from 'react';

const kpis = [
  { label: 'Total Sales', value: '₹48.2L', change: '+12.4%', up: true, color: '#fdf0ef', iconColor: '#c0392b', icon: <SalesIcon /> },
  { label: 'Active Orders', value: '284', change: '+8.1%', up: true, color: '#eafaf1', iconColor: '#27ae60', icon: <OrderIcon /> },
  { label: 'Inventory Value', value: '₹1.2Cr', change: '-2.3%', up: false, color: '#fef9e7', iconColor: '#f39c12', icon: <BoxIcon /> },
  { label: 'Production Today', value: '1,840', change: '+5.6%', up: true, color: '#f5eef8', iconColor: '#8e44ad', icon: <FactoryIcon /> },
  { label: 'Pending Dispatch', value: '37', change: '-4.2%', up: false, color: '#eaf4fb', iconColor: '#2980b9', icon: <TruckIcon /> },
];

const operationalAlerts = [
  { label: 'Pending GRNs', value: 8, color: '#f59e0b', icon: '📋' },
  { label: 'Return Requests', value: 3, color: '#ef4444', icon: '↩️' },
  { label: "Today's Dispatches", value: 12, color: '#10b981', icon: '🚛' },
  { label: 'Production vs Target', value: '94%', color: '#8b5cf6', icon: '🏭' },
];

const productionTarget = [
  { product: 'Engine Assembly A', target: 50, actual: 50, pct: 100 },
  { product: 'Gearbox Unit B', target: 30, actual: 18, pct: 60 },
  { product: 'Clutch Assembly C', target: 80, actual: 0, pct: 0 },
];

const salesTrend = [
  { label: 'Jan', value: 320000 }, { label: 'Feb', value: 410000 }, { label: 'Mar', value: 380000 },
  { label: 'Apr', value: 520000 }, { label: 'May', value: 490000 }, { label: 'Jun', value: 610000 },
  { label: 'Jul', value: 580000 }, { label: 'Aug', value: 720000 }, { label: 'Sep', value: 680000 },
  { label: 'Oct', value: 790000 }, { label: 'Nov', value: 850000 }, { label: 'Dec', value: 920000 },
];

const inventoryStatus = [
  { label: 'Raw Mat', value: 4200, color: '#c0392b' },
  { label: 'WIP', value: 1800, color: '#f39c12' },
  { label: 'Finished', value: 3100, color: '#27ae60' },
  { label: 'Dead', value: 420, color: '#922b21' },
  { label: 'Quarant.', value: 280, color: '#8e44ad' },
];

const productionEff = [
  { label: 'Mon', value: 88, color: '#c0392b' }, { label: 'Tue', value: 92, color: '#c0392b' },
  { label: 'Wed', value: 85, color: '#c0392b' }, { label: 'Thu', value: 94, color: '#c0392b' },
  { label: 'Fri', value: 90, color: '#c0392b' }, { label: 'Sat', value: 78, color: '#f39c12' },
];

const donutData = [
  { label: 'Delivered', value: 142, color: '#27ae60' },
  { label: 'Processing', value: 87, color: '#c0392b' },
  { label: 'Pending', value: 55, color: '#f39c12' },
];

const recentOrders = [
  { id: 'ORD-2024-089', customer: 'Tata Motors Ltd', items: 12, value: '₹2,84,000', status: 'Processing', date: '14 Apr' },
  { id: 'ORD-2024-088', customer: 'Mahindra & Mahindra', items: 8, value: '₹1,56,000', status: 'Delivered', date: '13 Apr' },
  { id: 'ORD-2024-087', customer: 'Bajaj Auto', items: 24, value: '₹4,12,000', status: 'Pending', date: '13 Apr' },
  { id: 'ORD-2024-086', customer: 'Hero MotoCorp', items: 6, value: '₹98,000', status: 'Delivered', date: '12 Apr' },
  { id: 'ORD-2024-085', customer: 'TVS Motor', items: 18, value: '₹3,24,000', status: 'Shipped', date: '12 Apr' },
];

const lowStock = [
  { sku: 'SKU-1042', name: 'Bearing 6205', qty: 12, min: 50, warehouse: 'WH-01' },
  { sku: 'SKU-2187', name: 'Oil Seal 35x52', qty: 8, min: 30, warehouse: 'WH-02' },
  { sku: 'SKU-0934', name: 'Gasket Set A', qty: 5, min: 25, warehouse: 'WH-01' },
  { sku: 'SKU-3301', name: 'Piston Ring 80mm', qty: 18, min: 40, warehouse: 'WH-03' },
];

const pendingApprovals = [
  { id: 'PO-2024-089', type: 'Purchase Order', amount: '₹4,82,000', requestedBy: 'Ravi Sharma', age: '2d' },
  { id: 'PR-2024-034', type: 'Purchase Requisition', amount: '₹1,20,000', requestedBy: 'Priya Nair', age: '1d' },
  { id: 'RFQ-2024-012', type: 'RFQ', amount: '₹8,40,000', requestedBy: 'Amit Patel', age: '3d' },
];

export default function DashboardPage() {
 
  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: k.color }}>
                <span style={{ color: k.iconColor }}>{k.icon}</span>
              </div>
              <span className={`text-xs font-bold ${k.up ? 'text-green-600' : 'text-red-500'}`}>
                {k.up ? '↑' : '↓'} {k.change}
              </span>
            </div>
            <div className="text-xl font-black tracking-tight mt-2">{k.value}</div>
            <div className="text-xs text-gray-500 font-medium">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Sales Trend</div>
              <div className="text-xs text-gray-400 mt-0.5">Monthly revenue — FY 2024-25</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black tracking-tight" style={{ color: '#c0392b' }}>₹82.4L</div>
              <div className="text-xs font-bold" style={{ color: '#27ae60' }}>↑ 18.2% vs last year</div>
            </div>
          </div>
          <LineChart data={salesTrend} color="#c0392b" height={160} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Order Status</div>
          <div className="text-xs text-gray-400 mb-4">Current distribution</div>
          <DonutChart data={donutData} size={120} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Inventory Status</div>
          <div className="text-xs text-gray-400 mb-3">Units by category</div>
          <BarChart data={inventoryStatus} height={150} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Production Efficiency</div>
          <div className="text-xs text-gray-400 mb-3">This week (%)</div>
          <BarChart data={productionEff} height={150} />
        </div>
      </div>

      {/* Operational Alerts Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {operationalAlerts.map((a, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: a.color + '18' }}>{a.icon}</div>
            <div className="min-w-0">
              <div className="text-xl font-black leading-none" style={{ color: a.color }}>{a.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 truncate">{a.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Production vs Target */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-gray-800">Production vs Target — Today</div>
            <div className="text-xs text-gray-400 mt-0.5">Work order progress</div>
          </div>
          <StatusBadge status="Active" />
        </div>
        <div className="flex flex-col gap-3.5">
          {productionTarget.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold">{p.product}</span>
                <span className="font-bold" style={{ color: p.pct === 100 ? '#27ae60' : p.pct > 50 ? '#f39c12' : '#e74c3c' }}>
                  {p.actual}/{p.target} units ({p.pct}%)
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, background: p.pct === 100 ? '#27ae60' : p.pct > 50 ? '#f39c12' : '#e74c3c' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold mb-3.5" style={{ color: '#922b21' }}>Recent Orders</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse text-sm" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Value', 'Status', 'Date'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold" style={{ color: '#c0392b' }}>{o.id}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle">{o.customer}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle">{o.items}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold">{o.value}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 align-middle text-gray-400">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold" style={{ color: '#922b21' }}>Low Stock Alerts</div>
              <StatusBadge status="Critical" />
            </div>
            {lowStock.map((s, i) => (
              <div key={i} className={`flex items-center justify-between py-2 ${i < lowStock.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <div className="text-xs font-semibold">{s.name}</div>
                  <div className="text-[11px] text-gray-400">{s.sku} · {s.warehouse}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-500">{s.qty}</div>
                  <div className="text-[10px] text-gray-400">min: {s.min}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold mb-3" style={{ color: '#922b21' }}>Pending Approvals</div>
            {pendingApprovals.map((a, i) => (
              <div key={i} className={`py-2 ${i < pendingApprovals.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold" style={{ color: '#c0392b' }}>{a.id}</span>
                  <span className="text-[11px] text-gray-400">{a.age} ago</span>
                </div>
                <div className="text-[11px] text-gray-400">{a.type} · {a.requestedBy}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: '#f39c12' }}>{a.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function OrderIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>; }
function BoxIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>; }
function FactoryIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>; }
function TruckIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>; }
