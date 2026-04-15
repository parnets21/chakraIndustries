import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';

const orders = [
  { id: 'ORD-2024-089', customer: 'Tata Motors Ltd', items: 12, value: '₹2,84,000', status: 'Processing', date: '14 Apr', priority: 'High' },
  { id: 'ORD-2024-088', customer: 'Mahindra & Mahindra', items: 8, value: '₹1,56,000', status: 'Delivered', date: '13 Apr', priority: 'Normal' },
  { id: 'ORD-2024-087', customer: 'Bajaj Auto', items: 24, value: '₹4,12,000', status: 'Pending', date: '13 Apr', priority: 'Urgent' },
  { id: 'ORD-2024-086', customer: 'Hero MotoCorp', items: 6, value: '₹98,000', status: 'Delivered', date: '12 Apr', priority: 'Normal' },
  { id: 'ORD-2024-085', customer: 'TVS Motor', items: 18, value: '₹3,24,000', status: 'Shipped', date: '12 Apr', priority: 'High' },
  { id: 'ORD-2024-084', customer: 'Ashok Leyland', items: 30, value: '₹6,80,000', status: 'Processing', date: '11 Apr', priority: 'Normal' },
  { id: 'ORD-2024-083', customer: 'Eicher Motors', items: 15, value: '₹2,10,000', status: 'Cancelled', date: '10 Apr', priority: 'Low' },
];

export default function OrdersPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const kpis = [
    { label: 'Total Orders', value: orders.length, color: '#3b82f6' },
    { label: 'Processing', value: orders.filter(o => o.status === 'Processing').length, color: '#f59e0b' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: '#10b981' },
    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#ef4444' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Sales Orders</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Orders</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
            onClick={() => setShowModal(true)}
          >
            + New Order
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <DataTable
          columns={[
            { key: 'id', label: 'Order ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
            { key: 'customer', label: 'Customer', render: v => <span className="font-semibold">{v}</span> },
            { key: 'items', label: 'Items' },
            { key: 'value', label: 'Value', render: v => <span className="font-bold">{v}</span> },
            { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} type={v === 'Urgent' ? 'danger' : v === 'High' ? 'warning' : v === 'Low' ? 'gray' : 'info'} /> },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            {
              key: 'id', label: 'Actions', render: (_, row) => (
                <div className="flex gap-1.5">
                  <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]"
                    onClick={() => setSelectedOrder(row)}
                  >
                    View
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-800 font-semibold cursor-pointer font-[inherit] border-0">
                    Edit
                  </button>
                </div>
              )
            },
          ]}
          data={orders}
        />
      </div>

      {/* New Order Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Order"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Create Order</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Customer *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Customer name" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Order Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Delivery Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Priority</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Normal</option><option>High</option><option>Urgent</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4 col-span-2"><label className="text-xs font-semibold text-gray-600">Remarks</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Order notes..." /></div>
        </div>
      </Modal>

      {/* View Order Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order — ${selectedOrder?.id || ''}`}
        footer={
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setSelectedOrder(null)}>Close</button>
        }
      >
        {selectedOrder && [
          ['Customer', selectedOrder.customer],
          ['Order Date', selectedOrder.date],
          ['Items', selectedOrder.items],
          ['Value', selectedOrder.value],
          ['Priority', selectedOrder.priority],
          ['Status', selectedOrder.status],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-2 border-b border-gray-200 text-sm last:border-0">
            <span className="text-gray-500">{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </Modal>
    </div>
  );
}
