import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea, Grid2, ModalBtn } from '../../components/forms/FormField';

const tabs = ['Dispatch Dashboard', 'Vehicle Allocation', 'Delivery Tracking'];

const readyOrders = [
  { id: 'ORD-2024-085', customer: 'TVS Motor', items: 18, value: '₹3,24,000', warehouse: 'WH-01', weight: '420 kg' },
  { id: 'ORD-2024-082', customer: 'Ashok Leyland', items: 30, value: '₹6,80,000', warehouse: 'WH-03', weight: '780 kg' },
  { id: 'ORD-2024-079', customer: 'Force Motors', items: 10, value: '₹1,40,000', warehouse: 'WH-01', weight: '210 kg' },
];

const vehicles = [
  { id: 'VH-001', type: 'Truck', number: 'MH-12-AB-1234', driver: 'Ramesh Patil', capacity: '5 Ton', status: 'Available' },
  { id: 'VH-002', type: 'Mini Truck', number: 'MH-12-CD-5678', driver: 'Suresh Kumar', capacity: '2 Ton', status: 'In Transit' },
  { id: 'VH-003', type: 'Tempo', number: 'MH-14-EF-9012', driver: 'Anil Rao', capacity: '1 Ton', status: 'Available' },
  { id: 'VH-004', type: 'Truck', number: 'MH-15-GH-3456', driver: 'Vijay Singh', capacity: '8 Ton', status: 'Maintenance' },
];

const allocations = [
  { order: 'ORD-2024-085', driver: 'Suresh Kumar', vehicle: 'MH-12-CD-5678', destination: 'Chennai', status: 'In Transit', eta: '16 Apr' },
  { order: 'ORD-2024-080', driver: 'Ramesh Patil', vehicle: 'MH-12-AB-1234', destination: 'Pune', status: 'Delivered', eta: '13 Apr' },
];

const deliveryTimeline = [
  { event: 'Order Dispatched', time: '14 Apr, 09:00 AM', location: 'Nashik Plant', status: 'success' },
  { event: 'In Transit — Nashik to Pune', time: '14 Apr, 11:30 AM', location: 'NH-60, Igatpuri', status: 'success' },
  { event: 'Reached Hub', time: '14 Apr, 03:00 PM', location: 'Pune Distribution Hub', status: 'success' },
  { event: 'Out for Delivery', time: '15 Apr, 08:00 AM', location: 'Pune City', status: 'warning' },
  { event: 'Delivered', time: 'Expected: 15 Apr, 02:00 PM', location: 'Customer Warehouse', status: 'gray' },
];

export default function LogisticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Logistics</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Logistics</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Dispatch</button>
      </div>

      <div className="tabs">
        {tabs.map((t, i) => <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      {/* Dispatch Dashboard */}
      {activeTab === 0 && (
        <div>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Ready to Dispatch', value: readyOrders.length, color: '#fef3c7', textColor: '#f59e0b' },
              { label: 'In Transit', value: 2, color: '#dbeafe', textColor: '#3b82f6' },
              { label: 'Delivered Today', value: 5, color: '#d1fae5', textColor: '#10b981' },
              { label: 'Available Vehicles', value: vehicles.filter(v => v.status === 'Available').length, color: '#ede9fe', textColor: '#8b5cf6' },
            ].map((k, i) => (
              <div key={i} className="kpi-card" style={{ background: k.color, border: 'none' }}>
                <div className="kpi-value" style={{ color: k.textColor }}>{k.value}</div>
                <div className="kpi-label">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Orders Ready for Dispatch</div>
            <DataTable
              columns={[
                { key: 'id', label: 'Order ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
                { key: 'customer', label: 'Customer' },
                { key: 'items', label: 'Items' },
                { key: 'value', label: 'Value', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
                { key: 'warehouse', label: 'Warehouse' },
                { key: 'weight', label: 'Weight' },
                { key: 'id', label: 'Actions', render: () => <button className="btn btn-accent btn-sm">Assign Vehicle</button> },
              ]}
              data={readyOrders}
            />
          </div>
        </div>
      )}

      {/* Vehicle Allocation */}
      {activeTab === 1 && (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Fleet Status</div>
            {vehicles.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < vehicles.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚛</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{v.number}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{v.type} · {v.capacity} · {v.driver}</div>
                  </div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            ))}
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Active Allocations</div>
            <DataTable
              columns={[
                { key: 'order', label: 'Order', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
                { key: 'driver', label: 'Driver' },
                { key: 'destination', label: 'Destination' },
                { key: 'eta', label: 'ETA' },
                { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              ]}
              data={allocations}
            />
          </div>
        </div>
      )}

      {/* Delivery Tracking */}
      {activeTab === 2 && (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Tracking — ORD-2024-085</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 20 }}>TVS Motor · Chennai</div>
            <div className="timeline">
              {deliveryTimeline.map((t, i) => (
                <div key={i} className="timeline-item">
                  <div className={`timeline-dot ${t.status}`} />
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.event}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{t.time}</div>
                  <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 1 }}>📍 {t.location}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Delivery Summary</div>
            {[
              ['Order ID', 'ORD-2024-085'],
              ['Customer', 'TVS Motor'],
              ['Vehicle', 'MH-12-CD-5678'],
              ['Driver', 'Suresh Kumar'],
              ['Origin', 'Nashik Plant'],
              ['Destination', 'Chennai'],
              ['Dispatched', '14 Apr, 09:00 AM'],
              ['Expected Delivery', '15 Apr, 02:00 PM'],
              ['Status', 'In Transit'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ color: 'var(--text-light)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Dispatch Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Dispatch"
        footer={<><ModalBtn variant="outline" onClick={() => setShowModal(false)}>Cancel</ModalBtn><ModalBtn onClick={() => setShowModal(false)}>Create Dispatch</ModalBtn></>}>
        <Grid2>
          <Input label="Order Reference *" placeholder="e.g. ORD-2024-089" />
          <Input label="Customer Name *" placeholder="Customer" />
          <Select label="Vehicle *">
            <option>MH-12-AB-1234 — Truck (5 Ton)</option>
            <option>MH-14-EF-9012 — Tempo (1 Ton)</option>
          </Select>
          <Select label="Driver *">
            <option>Ramesh Patil</option>
            <option>Anil Rao</option>
          </Select>
          <Input label="Destination *" placeholder="City / Address" />
          <Input label="Dispatch Date" type="date" />
          <Input label="Expected Delivery" type="date" />
          <Input label="Total Weight (kg)" type="number" placeholder="0" />
        </Grid2>
        <Textarea label="Delivery Instructions" placeholder="Special handling notes..." />
      </Modal>
    </div>
  );
}
