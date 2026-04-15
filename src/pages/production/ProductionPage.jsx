import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import BarChart from '../../components/charts/BarChart';

const tabs = ['BOM', 'Work Orders', 'Production Tracking', 'Wastage'];

const bom = [
  { id: 'BOM-001', product: 'Engine Assembly A', components: 14, version: 'v2.1', status: 'Active' },
  { id: 'BOM-002', product: 'Gearbox Unit B', components: 22, version: 'v1.4', status: 'Active' },
  { id: 'BOM-003', product: 'Clutch Assembly C', components: 8, version: 'v3.0', status: 'Active' },
];

const bomTree = [
  { level: 0, item: 'Engine Assembly A', qty: 1, unit: 'Set', type: 'Finished' },
  { level: 1, item: '├─ Cylinder Block', qty: 1, unit: 'Nos', type: 'Sub-Assembly' },
  { level: 2, item: '│  ├─ Piston Ring 80mm', qty: 4, unit: 'Nos', type: 'Raw' },
  { level: 2, item: '│  └─ Cylinder Liner', qty: 4, unit: 'Nos', type: 'Raw' },
  { level: 1, item: '├─ Crankshaft Assembly', qty: 1, unit: 'Nos', type: 'Sub-Assembly' },
  { level: 2, item: '│  ├─ Crankshaft Seal', qty: 2, unit: 'Nos', type: 'Raw' },
  { level: 2, item: '│  └─ Bearing 6205', qty: 4, unit: 'Nos', type: 'Raw' },
  { level: 1, item: '└─ Valve Train', qty: 1, unit: 'Set', type: 'Sub-Assembly' },
  { level: 2, item: '   ├─ Valve Spring Set', qty: 8, unit: 'Nos', type: 'Raw' },
  { level: 2, item: '   └─ Timing Chain Kit', qty: 1, unit: 'Set', type: 'Raw' },
];

const workOrders = [
  { id: 'WO-0891', product: 'Engine Assembly A', qty: 50, produced: 50, status: 'Completed', startDate: '10 Apr', endDate: '14 Apr', shift: 'Morning' },
  { id: 'WO-0892', product: 'Gearbox Unit B', qty: 30, produced: 18, status: 'In-Progress', startDate: '12 Apr', endDate: '16 Apr', shift: 'General' },
  { id: 'WO-0893', product: 'Clutch Assembly C', qty: 80, produced: 0, status: 'Pending', startDate: '15 Apr', endDate: '18 Apr', shift: 'Night' },
];

const wastageData = [
  { label: 'Mon', value: 12, color: '#e74c3c' }, { label: 'Tue', value: 8, color: '#e74c3c' },
  { label: 'Wed', value: 15, color: '#e74c3c' }, { label: 'Thu', value: 6, color: '#e74c3c' },
  { label: 'Fri', value: 10, color: '#e74c3c' }, { label: 'Sat', value: 4, color: '#e74c3c' },
];
const goodData = [
  { label: 'Mon', value: 188, color: '#27ae60' }, { label: 'Tue', value: 192, color: '#27ae60' },
  { label: 'Wed', value: 185, color: '#27ae60' }, { label: 'Thu', value: 194, color: '#27ae60' },
  { label: 'Fri', value: 190, color: '#27ae60' }, { label: 'Sat', value: 176, color: '#27ae60' },
];

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBOM, setSelectedBOM] = useState('BOM-001');
  const [showWOModal, setShowWOModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Production</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Production</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowBOMModal(true)}>+ New BOM</button>
          <button className="btn btn-primary" onClick={() => setShowWOModal(true)}>+ New Work Order</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t, i) => <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      {activeTab === 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>BOM List</div>
            {bom.map(b => (
              <div key={b.id} onClick={() => setSelectedBOM(b.id)}
                style={{ padding: 12, borderRadius: 8, marginBottom: 8, cursor: 'pointer', border: `2px solid ${selectedBOM === b.id ? '#c0392b' : '#e2e8f0'}`, background: selectedBOM === b.id ? '#fdf5f5' : '#fff', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.product}</div>
                    <div style={{ fontSize: 11, color: '#718096' }}>{b.id} · {b.version} · {b.components} components</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>BOM Tree — Engine Assembly A</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {bomTree.map((row, i) => (
                <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: row.level === 0 ? '#c0392b' : row.level === 1 ? '#1c2833' : '#718096', fontWeight: row.level === 0 ? 700 : 400 }}>{row.item}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ color: '#718096' }}>{row.qty} {row.unit}</span>
                    <span className={`status-badge ${row.type === 'Finished' ? 'success' : row.type === 'Sub-Assembly' ? 'info' : 'gray'}`}>{row.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'WO ID', render: v => <span style={{ fontWeight: 600, color: '#c0392b' }}>{v}</span> },
              { key: 'product', label: 'Product', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
              { key: 'qty', label: 'Target Qty' },
              { key: 'produced', label: 'Produced', render: (v, row) => <span style={{ fontWeight: 700, color: v >= row.qty ? '#27ae60' : '#f39c12' }}>{v}</span> },
              { key: 'shift', label: 'Shift' },
              { key: 'startDate', label: 'Start' },
              { key: 'endDate', label: 'End' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={workOrders}
          />
        </div>
      )}

      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {workOrders.filter(w => w.status === 'In-Progress').map(wo => (
            <div key={wo.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{wo.product}</div>
                  <div style={{ fontSize: 12, color: '#718096' }}>{wo.id} · {wo.shift} Shift</div>
                </div>
                <StatusBadge status={wo.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span>Progress: <strong>{wo.produced}/{wo.qty}</strong></span>
                <span style={{ fontWeight: 700, color: '#c0392b' }}>{Math.round((wo.produced / wo.qty) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(wo.produced / wo.qty) * 100}%`, background: '#c0392b' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 3 && (
        <div className="grid-2">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 4 }}>Good Units (This Week)</div>
            <div className="section-sub" style={{ marginBottom: 12 }}>Daily production output</div>
            <BarChart data={goodData} height={180} />
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: 4 }}>Rejected / Wastage</div>
            <div className="section-sub" style={{ marginBottom: 12 }}>Daily rejection count</div>
            <BarChart data={wastageData} height={180} />
          </div>
        </div>
      )}

      {showWOModal && (
        <div className="modal-overlay" onClick={() => setShowWOModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create Work Order</span>
              <button className="btn btn-sm" style={{ background: 'none', color: '#718096', fontSize: 20, padding: '0 4px' }} onClick={() => setShowWOModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="form-label">Work Order ID</label><input className="form-input" placeholder="Auto-generated" disabled /></div>
                <div className="form-group"><label className="form-label">Product *</label><select className="form-select"><option>Engine Assembly A</option><option>Gearbox Unit B</option><option>Clutch Assembly C</option></select></div>
                <div className="form-group"><label className="form-label">Target Quantity *</label><input type="number" className="form-input" placeholder="0" /></div>
                <div className="form-group"><label className="form-label">Shift</label><select className="form-select"><option>Morning</option><option>General</option><option>Night</option></select></div>
                <div className="form-group"><label className="form-label">Start Date *</label><input type="date" className="form-input" /></div>
                <div className="form-group"><label className="form-label">End Date *</label><input type="date" className="form-input" /></div>
                <div className="form-group"><label className="form-label">BOM Reference</label><select className="form-select"><option>BOM-001 — Engine Assembly A</option><option>BOM-002 — Gearbox Unit B</option><option>BOM-003 — Clutch Assembly C</option></select></div>
                <div className="form-group"><label className="form-label">Priority</label><select className="form-select"><option>Normal</option><option>High</option><option>Urgent</option></select></div>
              </div>
              <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-textarea" placeholder="Additional instructions..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowWOModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowWOModal(false)}>Create Work Order</button>
            </div>
          </div>
        </div>
      )}

      {showBOMModal && (
        <div className="modal-overlay" onClick={() => setShowBOMModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Create New BOM</span>
              <button className="btn btn-sm" style={{ background: 'none', color: '#718096', fontSize: 20, padding: '0 4px' }} onClick={() => setShowBOMModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" placeholder="e.g. Engine Assembly D" /></div>
                <div className="form-group"><label className="form-label">Version</label><input className="form-input" placeholder="v1.0" /></div>
                <div className="form-group"><label className="form-label">Product Type</label><select className="form-select"><option>Finished Good</option><option>Sub-Assembly</option><option>Semi-Finished</option></select></div>
                <div className="form-group"><label className="form-label">Unit of Measure</label><input className="form-input" placeholder="e.g. Set" /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" placeholder="BOM description..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowBOMModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowBOMModal(false)}>Save BOM</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
