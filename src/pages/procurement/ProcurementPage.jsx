import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import Stepper from '../../components/common/Stepper';
import DataTable from '../../components/tables/DataTable';

const tabs = ['Vendors', 'RFQ', 'Purchase Requisition', 'Purchase Orders', 'GRN', 'Quality Check'];

const vendors = [
  { id: 'V-001', name: 'Shree Metals Pvt Ltd', category: 'Raw Material', contact: 'Ramesh Gupta', phone: '9876543210', city: 'Pune', status: 'Active', rating: '4.5' },
  { id: 'V-002', name: 'Precision Parts Co.', category: 'Components', contact: 'Suresh Jain', phone: '9812345678', city: 'Mumbai', status: 'Active', rating: '4.2' },
  { id: 'V-003', name: 'Global Bearings Ltd', category: 'Bearings', contact: 'Anil Mehta', phone: '9823456789', city: 'Ahmedabad', status: 'Active', rating: '4.8' },
  { id: 'V-004', name: 'Apex Castings', category: 'Castings', contact: 'Vijay Rao', phone: '9834567890', city: 'Nashik', status: 'Inactive', rating: '3.9' },
  { id: 'V-005', name: 'National Seals', category: 'Seals & Gaskets', contact: 'Pradeep Kumar', phone: '9845678901', city: 'Delhi', status: 'Active', rating: '4.6' },
];

const rfqs = [
  { id: 'RFQ-2024-012', vendor: 'Shree Metals Pvt Ltd', items: 8, value: '₹8,40,000', dueDate: '20 Apr', status: 'Open' },
  { id: 'RFQ-2024-011', vendor: 'Global Bearings Ltd', items: 4, value: '₹2,10,000', dueDate: '18 Apr', status: 'Closed' },
  { id: 'RFQ-2024-010', vendor: 'Precision Parts Co.', items: 12, value: '₹5,60,000', dueDate: '15 Apr', status: 'Open' },
];

const prs = [
  { id: 'PR-2024-034', dept: 'Production', items: 6, value: '₹1,20,000', requestedBy: 'Priya Nair', status: 'Pending', date: '12 Apr' },
  { id: 'PR-2024-033', dept: 'Maintenance', items: 3, value: '₹45,000', requestedBy: 'Sunil Das', status: 'Approved', date: '11 Apr' },
  { id: 'PR-2024-032', dept: 'Production', items: 9, value: '₹2,80,000', requestedBy: 'Ravi Sharma', status: 'Approved', date: '10 Apr' },
];

const pos = [
  { id: 'PO-2024-089', vendor: 'Shree Metals Pvt Ltd', items: 8, subtotal: '₹4,20,000', gst: '₹75,600', total: '₹4,95,600', status: 'Pending', date: '14 Apr' },
  { id: 'PO-2024-088', vendor: 'Global Bearings Ltd', items: 4, subtotal: '₹1,80,000', gst: '₹32,400', total: '₹2,12,400', status: 'Approved', date: '13 Apr' },
  { id: 'PO-2024-087', vendor: 'Precision Parts Co.', items: 12, subtotal: '₹4,80,000', gst: '₹86,400', total: '₹5,66,400', status: 'Received', date: '12 Apr' },
];

const grns = [
  { id: 'GRN-0234', po: 'PO-2024-087', vendor: 'Precision Parts Co.', items: 12, received: 12, status: 'Completed', date: '13 Apr' },
  { id: 'GRN-0233', po: 'PO-2024-086', vendor: 'National Seals', items: 6, received: 4, status: 'Partial', date: '12 Apr' },
];

const poItems = [
  { item: 'Bearing 6205', qty: 100, basePrice: 450, gst: 18, total: 53100 },
  { item: 'Oil Seal 35x52', qty: 200, basePrice: 120, gst: 18, total: 28320 },
  { item: 'Gasket Set A', qty: 50, basePrice: 680, gst: 18, total: 40120 },
];

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [prStep, setPrStep] = useState(1);

  const subtotal   = poItems.reduce((s, i) => s + i.qty * i.basePrice, 0);
  const gstTotal   = poItems.reduce((s, i) => s + (i.qty * i.basePrice * i.gst / 100), 0);
  const grandTotal = subtotal + gstTotal;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Procurement</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">/procurement</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowVendorModal(true)}>+ Add Vendor</button>
          <button className="btn btn-primary" onClick={() => setShowPOModal(true)}>+ New PO</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t, i) => <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      {activeTab === 0 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'Vendor ID' },
              { key: 'name', label: 'Vendor Name', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
              { key: 'category', label: 'Category' },
              { key: 'contact', label: 'Contact' },
              { key: 'city', label: 'City' },
              { key: 'rating', label: 'Rating', render: v => <span style={{ color: 'var(--accent)', fontWeight: 700 }}>★ {v}</span> },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              { key: 'id', label: 'Actions', render: () => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm">Edit</button>
                  <button className="btn btn-sm" style={{ background: '#f1f5f9', color: 'var(--text)' }}>View</button>
                </div>
              )},
            ]}
            data={vendors}
          />
        </div>
      )}

      {activeTab === 1 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'RFQ ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
              { key: 'vendor', label: 'Vendor' },
              { key: 'items', label: 'Items' },
              { key: 'value', label: 'Est. Value', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { key: 'dueDate', label: 'Due Date' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={rfqs}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Create Purchase Requisition</div>
            <Stepper steps={['Details', 'Items', 'Review', 'Submit']} current={prStep} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label className="form-label">Department</label><select className="form-select"><option>Production</option><option>Maintenance</option><option>Admin</option></select></div>
              <div className="form-group"><label className="form-label">Required By</label><input type="date" className="form-input" /></div>
              <div className="form-group"><label className="form-label">Priority</label><select className="form-select"><option>Normal</option><option>Urgent</option><option>Critical</option></select></div>
              <div className="form-group"><label className="form-label">Remarks</label><input className="form-input" placeholder="Optional remarks" /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setPrStep(Math.max(0, prStep - 1))}>Back</button>
              <button className="btn btn-primary" onClick={() => setPrStep(Math.min(3, prStep + 1))}>Next</button>
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 12 }}>PR List</div>
            <DataTable
              columns={[
                { key: 'id', label: 'PR ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
                { key: 'dept', label: 'Department' },
                { key: 'items', label: 'Items' },
                { key: 'value', label: 'Value', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
                { key: 'requestedBy', label: 'Requested By' },
                { key: 'date', label: 'Date' },
                { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              ]}
              data={prs}
            />
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'PO ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
              { key: 'vendor', label: 'Vendor' },
              { key: 'items', label: 'Items' },
              { key: 'subtotal', label: 'Subtotal' },
              { key: 'gst', label: 'GST' },
              { key: 'total', label: 'Grand Total', render: v => <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>{v}</span> },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={pos}
          />
        </div>
      )}

      {activeTab === 4 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'GRN ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
              { key: 'po', label: 'PO Ref' },
              { key: 'vendor', label: 'Vendor' },
              { key: 'items', label: 'Ordered' },
              { key: 'received', label: 'Received' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={grns}
          />
        </div>
      )}

      {activeTab === 5 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>Quality Check — GRN-0234</div>
          <div className="table-container">
            <table>
              <thead><tr><th>Item</th><th>Received Qty</th><th>Inspected</th><th>Pass</th><th>Fail</th><th>Result</th><th>Remarks</th></tr></thead>
              <tbody>
                {poItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{item.item}</td>
                    <td>{item.qty}</td>
                    <td>{item.qty}</td>
                    <td><input type="number" className="form-input" style={{ width: 70 }} defaultValue={item.qty - (i === 1 ? 2 : 0)} /></td>
                    <td><input type="number" className="form-input" style={{ width: 70 }} defaultValue={i === 1 ? 2 : 0} /></td>
                    <td><StatusBadge status={i === 1 ? 'Partial' : 'Passed'} /></td>
                    <td><input className="form-input" placeholder="Remarks..." /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-danger">Reject Batch</button>
            <button className="btn btn-success">Approve & Close</button>
          </div>
        </div>
      )}

      <Modal open={showVendorModal} onClose={() => setShowVendorModal(false)} title="Add New Vendor"
        footer={<><button className="btn btn-outline" onClick={() => setShowVendorModal(false)}>Cancel</button><button className="btn btn-primary">Save Vendor</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group"><label className="form-label">Vendor Name *</label><input className="form-input" placeholder="Company name" /></div>
          <div className="form-group"><label className="form-label">Category *</label><select className="form-select"><option>Raw Material</option><option>Components</option><option>Bearings</option><option>Castings</option></select></div>
          <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" placeholder="Name" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" placeholder="10-digit number" /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="email@company.com" /></div>
          <div className="form-group"><label className="form-label">City</label><input className="form-input" placeholder="City" /></div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">GST Number</label><input className="form-input" placeholder="GSTIN" /></div>
        </div>
      </Modal>

      <Modal open={showPOModal} onClose={() => setShowPOModal(false)} title="Create Purchase Order" size="lg"
        footer={<><button className="btn btn-outline" onClick={() => setShowPOModal(false)}>Cancel</button><button className="btn btn-primary">Create PO</button></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="form-group"><label className="form-label">Vendor *</label><select className="form-select">{vendors.map(v => <option key={v.id}>{v.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Delivery Date</label><input type="date" className="form-input" /></div>
        </div>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13 }}>Items</div>
        <div className="table-container" style={{ marginBottom: 16 }}>
          <table>
            <thead><tr><th>Item</th><th>Qty</th><th>Base Price (₹)</th><th>GST %</th><th>Total (₹)</th></tr></thead>
            <tbody>
              {poItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{item.item}</td>
                  <td><input type="number" className="form-input" style={{ width: 70 }} defaultValue={item.qty} /></td>
                  <td><input type="number" className="form-input" style={{ width: 90 }} defaultValue={item.basePrice} /></td>
                  <td>{item.gst}%</td>
                  <td style={{ fontWeight: 700 }}>₹{item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginLeft: 'auto', maxWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span>Subtotal</span><span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span>GST (18%)</span><span style={{ fontWeight: 600 }}>₹{Math.round(gstTotal).toLocaleString()}</span></div>
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--primary-dark)' }}><span>Grand Total</span><span>₹{Math.round(grandTotal).toLocaleString()}</span></div>
        </div>
      </Modal>
    </div>
  );
}
