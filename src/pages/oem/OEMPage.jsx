import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import BarChart from '../../components/charts/BarChart';

const brands = ['Tata Motors', 'Mahindra', 'Bajaj Auto'];

const brandData = {
  'Tata Motors': {
    color: '#c0392b', bom: [{ id: 'BOM-TM-001', product: 'Engine Seal Kit', components: 12, status: 'Active' }, { id: 'BOM-TM-002', product: 'Gearbox Gasket Set', components: 8, status: 'Active' }],
    production: [{ wo: 'WO-TM-041', product: 'Engine Seal Kit', qty: 500, produced: 480, status: 'Completed' }, { wo: 'WO-TM-042', product: 'Gearbox Gasket Set', qty: 300, produced: 210, status: 'In-Progress' }],
    billing: 'Per Unit', monthlyTarget: 800, achieved: 690,
    chartData: [{ label: 'Jan', value: 620 }, { label: 'Feb', value: 680 }, { label: 'Mar', value: 710 }, { label: 'Apr', value: 690 }],
  },
  'Mahindra': {
    color: '#8e44ad', bom: [{ id: 'BOM-MH-001', product: 'Clutch Assembly', components: 18, status: 'Active' }],
    production: [{ wo: 'WO-MH-021', product: 'Clutch Assembly', qty: 200, produced: 200, status: 'Completed' }],
    billing: 'Lump Sum', monthlyTarget: 200, achieved: 200,
    chartData: [{ label: 'Jan', value: 180 }, { label: 'Feb', value: 195 }, { label: 'Mar', value: 200 }, { label: 'Apr', value: 200 }],
  },
  'Bajaj Auto': {
    color: '#27ae60', bom: [{ id: 'BOM-BJ-001', product: 'Piston Kit 2-Wheeler', components: 6, status: 'Active' }],
    production: [{ wo: 'WO-BJ-031', product: 'Piston Kit 2-Wheeler', qty: 1000, produced: 850, status: 'In-Progress' }],
    billing: 'Per Unit', monthlyTarget: 1000, achieved: 850,
    chartData: [{ label: 'Jan', value: 920 }, { label: 'Feb', value: 980 }, { label: 'Mar', value: 1000 }, { label: 'Apr', value: 850 }],
  },
};

const innerTabs = ['BOM', 'Production', 'Billing'];

export default function OEMPage() {
  const [activeBrand, setActiveBrand] = useState('Tata Motors');
  const [innerTab, setInnerTab] = useState('BOM');
  const [showModal, setShowModal] = useState(false);
  const data = brandData[activeBrand];

  const kpis = [
    { label: 'Monthly Target', value: data.monthlyTarget.toLocaleString() },
    { label: 'Achieved', value: data.achieved.toLocaleString() },
    { label: 'Achievement %', value: `${Math.round((data.achieved / data.monthlyTarget) * 100)}%` },
    { label: 'Billing Type', value: data.billing },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">OEM Module</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">OEM</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add OEM Brand</button>
      </div>

      {/* Brand Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {brands.map(b => (
          <button key={b} onClick={() => setActiveBrand(b)}
            style={{
              padding: '10px 24px', borderRadius: 10, border: `2px solid ${activeBrand === b ? brandData[b].color : '#e2e8f0'}`,
              background: activeBrand === b ? brandData[b].color : '#fff',
              color: activeBrand === b ? '#fff' : '#1c2833',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>
            {b}
          </button>
        ))}
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-value" style={{ color: data.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {innerTabs.map((t, i) => <div key={i} className={`tab${innerTab === t ? ' active' : ''}`} onClick={() => setInnerTab(t)}>{t}</div>)}
      </div>

      {innerTab === 'BOM' && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>BOM — {activeBrand}</div>
          <div className="table-container">
            <table>
              <thead><tr>{['BOM ID','Product','Components','Status','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {data.bom.map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>{b.id}</td>
                    <td style={{ fontWeight: 600 }}>{b.product}</td>
                    <td>{b.components}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td><button className="btn btn-outline btn-sm">View BOM</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {innerTab === 'Production' && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Production — {activeBrand}</div>
          <div className="table-container">
            <table>
              <thead><tr>{['WO ID','Product','Target','Produced','Progress','Status'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {data.production.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>{p.wo}</td>
                    <td style={{ fontWeight: 600 }}>{p.product}</td>
                    <td>{p.qty}</td>
                    <td style={{ fontWeight: 700 }}>{p.produced}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(p.produced / p.qty) * 100}%`, background: data.color }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#718096' }}>{Math.round((p.produced / p.qty) * 100)}%</span>
                    </td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {innerTab === 'Billing' && (
        <div className="grid-2">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 12 }}>Monthly Production Trend</div>
            <BarChart data={data.chartData} color={data.color} height={160} />
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Billing Configuration</div>
            {[['Billing Type', data.billing], ['Rate per Unit', '₹1,200'], ['GST Rate', '18%'], ['Payment Terms', 'Net 30']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                <span style={{ color: '#718096' }}>{k}</span>
                <span style={{ fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }}>Generate Invoice</button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add OEM Brand</span>
              <button className="btn btn-sm" style={{ background: 'none', color: '#718096', fontSize: 20, padding: '0 4px' }} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="form-label">Brand Name *</label><input className="form-input" placeholder="e.g. Maruti Suzuki" /></div>
                <div className="form-group"><label className="form-label">Brand Code *</label><input className="form-input" placeholder="e.g. MS" /></div>
                <div className="form-group"><label className="form-label">Billing Type *</label><select className="form-select"><option>Per Unit</option><option>Lump Sum</option><option>Monthly Contract</option></select></div>
                <div className="form-group"><label className="form-label">Rate per Unit (₹)</label><input type="number" className="form-input" placeholder="0.00" /></div>
                <div className="form-group"><label className="form-label">Monthly Target</label><input type="number" className="form-input" placeholder="0" /></div>
                <div className="form-group"><label className="form-label">GST Rate</label><select className="form-select"><option>18%</option><option>12%</option><option>5%</option></select></div>
                <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" placeholder="Name" /></div>
                <div className="form-group"><label className="form-label">Contact Email</label><input type="email" className="form-input" placeholder="email@brand.com" /></div>
              </div>
              <div className="form-group"><label className="form-label">Contract Notes</label><textarea className="form-textarea" placeholder="Any special terms or notes..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>Add Brand</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
