import React, { useState } from 'react';
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Sales Orders</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Orders</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Order</button>
      </div>

      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Orders', value: orders.length, color: '#dbeafe', textColor: '#3b82f6' },
          { label: 'Processing', value: orders.filter(o => o.status === 'Processing').length, color: '#fef3c7', textColor: '#f59e0b' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: '#d1fae5', textColor: '#10b981' },
          { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#fee2e2', textColor: '#ef4444' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ background: k.color, border: 'none' }}>
            <div className="kpi-value" style={{ color: k.textColor }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <DataTable
          columns={[
            { key: 'id', label: 'Order ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
            { key: 'customer', label: 'Customer', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
            { key: 'items', label: 'Items' },
            { key: 'value', label: 'Value', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { key: 'priority', label: 'Priority', render: v => <StatusBadge status={v} type={v === 'Urgent' ? 'danger' : v === 'High' ? 'warning' : v === 'Low' ? 'gray' : 'info'} /> },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            { key: 'id', label: 'Actions', render: (_, row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setSelectedOrder(row)}>View</button>
                <button className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text)' }}>Edit</button>
              </div>
            )},
          ]}
          data={orders}
        />
      </div>

      {/* New Order Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Order"
        footer={<><button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary">Create Order</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label className="form-label">Customer *</label><input className="form-input" placeholder="Customer name" /></div>
          <div className="form-group"><label className="form-label">Order Date</label><input type="date" className="form-input" /></div>
          <div className="form-group"><label className="form-label">Delivery Date</label><input type="date" className="form-input" /></div>
          <div className="form-group"><label className="form-label">Priority</label><select className="form-select"><option>Normal</option><option>High</option><option>Urgent</option></select></div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Remarks</label><textarea className="form-textarea" placeholder="Order notes..." /></div>
        </div>
      </Modal>

      {/* View Order Modal */}
      {selectedOrder && (
        <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order — ${selectedOrder.id}`}
          footer={<button className="btn btn-primary" onClick={() => setSelectedOrder(null)}>Close</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Customer', selectedOrder.customer],
              ['Order Date', selectedOrder.date],
              ['Items', selectedOrder.items],
              ['Value', selectedOrder.value],
              ['Priority', selectedOrder.priority],
              ['Status', selectedOrder.status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-light)', fontSize: 13 }}>{k}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
