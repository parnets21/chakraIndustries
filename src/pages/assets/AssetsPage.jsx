import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { Input, Select, Textarea, Grid2, ModalBtn } from '../../components/forms/FormField';

const assets = [
  { id: 'AST-001', name: 'CNC Machine M-200', category: 'Machinery', location: 'Plant A', purchaseDate: '15 Jan 2022', value: '₹24,00,000', status: 'Active', nextMaint: '20 Apr 2024' },
  { id: 'AST-002', name: 'Hydraulic Press HP-50', category: 'Machinery', location: 'Plant B', purchaseDate: '10 Mar 2021', value: '₹8,50,000', status: 'Active', nextMaint: '25 Apr 2024' },
  { id: 'AST-003', name: 'Forklift FL-3T', category: 'Material Handling', location: 'WH-01', purchaseDate: '5 Jun 2020', value: '₹6,20,000', status: 'Maintenance', nextMaint: '15 Apr 2024' },
  { id: 'AST-004', name: 'Compressor AC-100', category: 'Utilities', location: 'Plant A', purchaseDate: '20 Aug 2023', value: '₹3,80,000', status: 'Active', nextMaint: '30 Apr 2024' },
  { id: 'AST-005', name: 'Lathe Machine LM-400', category: 'Machinery', location: 'Plant A', purchaseDate: '12 Feb 2019', value: '₹12,00,000', status: 'Inactive', nextMaint: '—' },
];

const maintenanceSchedule = [
  { date: '15 Apr', asset: 'Forklift FL-3T', type: 'Corrective', technician: 'Ravi Kumar', status: 'In Progress' },
  { date: '20 Apr', asset: 'CNC Machine M-200', type: 'Preventive', technician: 'Suresh Patil', status: 'Scheduled' },
  { date: '25 Apr', asset: 'Hydraulic Press HP-50', type: 'Preventive', technician: 'Anil Rao', status: 'Scheduled' },
  { date: '30 Apr', asset: 'Compressor AC-100', type: 'Preventive', technician: 'Vijay Singh', status: 'Scheduled' },
];

const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);
const maintDays = [15, 20, 25, 30];

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Asset Management</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Assets</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Asset</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Assets', value: assets.length, color: '#dbeafe', textColor: '#3b82f6' },
          { label: 'Active', value: assets.filter(a => a.status === 'Active').length, color: '#d1fae5', textColor: '#10b981' },
          { label: 'Under Maintenance', value: assets.filter(a => a.status === 'Maintenance').length, color: '#fef3c7', textColor: '#f59e0b' },
          { label: 'Total Value', value: '₹54.5L', color: '#ede9fe', textColor: '#8b5cf6' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ background: k.color, border: 'none' }}>
            <div className="kpi-value" style={{ color: k.textColor }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {['Asset Register', 'Maintenance Calendar'].map((t, i) => (
          <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'Asset ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
              { key: 'name', label: 'Asset Name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
              { key: 'category', label: 'Category' },
              { key: 'location', label: 'Location' },
              { key: 'value', label: 'Value', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { key: 'nextMaint', label: 'Next Maintenance' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={assets}
          />
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 16 }}>April 2024</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-light)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {/* Offset for April starting on Monday */}
              <div />
              {calendarDays.map(d => (
                <div key={d} style={{
                  textAlign: 'center',
                  padding: '6px 2px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: maintDays.includes(d) ? 700 : 400,
                  background: maintDays.includes(d) ? 'var(--accent)' : d === 14 ? 'var(--primary)' : 'transparent',
                  color: maintDays.includes(d) || d === 14 ? '#fff' : 'var(--text)',
                  cursor: maintDays.includes(d) ? 'pointer' : 'default',
                }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} /> Maintenance</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary)' }} /> Today</div>
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Maintenance Schedule</div>
            {maintenanceSchedule.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < maintenanceSchedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f0f4f8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{m.date.split(' ')[0]}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-light)' }}>APR</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.asset}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{m.type} · {m.technician}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Asset"
        footer={<><ModalBtn variant="outline" onClick={() => setShowModal(false)}>Cancel</ModalBtn><ModalBtn onClick={() => setShowModal(false)}>Save Asset</ModalBtn></>}>
        <Grid2>
          <Input label="Asset Name *" placeholder="e.g. CNC Machine M-300" />
          <Select label="Category *">
            <option>Machinery</option>
            <option>Material Handling</option>
            <option>Utilities</option>
            <option>IT Equipment</option>
            <option>Vehicles</option>
          </Select>
          <Input label="Location *" placeholder="e.g. Plant A" />
          <Input label="Purchase Date" type="date" />
          <Input label="Purchase Value (₹) *" type="number" placeholder="0.00" />
          <Select label="Condition">
            <option>New</option>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
          </Select>
          <Input label="Vendor / Supplier" placeholder="Supplier name" />
          <Input label="Warranty Expiry" type="date" />
          <Input label="Next Maintenance" type="date" />
          <Input label="Assigned To" placeholder="Department / Person" />
        </Grid2>
        <Textarea label="Description / Notes" placeholder="Asset details..." />
      </Modal>
    </div>
  );
}
