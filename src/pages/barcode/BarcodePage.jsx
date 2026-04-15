import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';

const movementLogs = [
  { id: 'LOG-001', barcode: 'BC-SKU1042-001', item: 'Bearing 6205', action: 'Inward', location: 'WH-01 / Rack A3', operator: 'Ramesh', time: '14 Apr, 09:15 AM' },
  { id: 'LOG-002', barcode: 'BC-SKU4412-022', item: 'Crankshaft Seal', action: 'Outward', location: 'Production Line 2', operator: 'Suresh', time: '14 Apr, 10:30 AM' },
  { id: 'LOG-003', barcode: 'BC-SKU3301-045', item: 'Piston Ring 80mm', action: 'Transfer', location: 'WH-01 → WH-03', operator: 'Anil', time: '13 Apr, 03:00 PM' },
  { id: 'LOG-004', barcode: 'BC-SKU5523-012', item: 'Valve Spring Set', action: 'Inward', location: 'WH-02 / Rack B1', operator: 'Vijay', time: '13 Apr, 11:00 AM' },
];

function BarcodeDisplay({ value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 20, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', gap: 1, height: 60, alignItems: 'flex-end' }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} style={{ background: '#1a3c6e', borderRadius: 1, width: i % 3 === 0 ? 3 : 1.5, height: i % 5 === 0 ? 60 : i % 3 === 0 ? 50 : 40 }} />
        ))}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 12, letterSpacing: 2, color: '#1c2833' }}>{value}</div>
    </div>
  );
}

export default function BarcodePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scanInput, setScanInput] = useState('');
  const [scanned, setScanned] = useState(null);
  const [genSKU, setGenSKU] = useState('SKU-1042');

  const handleScan = () => {
    if (scanInput) {
      setScanned({ sku: scanInput, name: 'Bearing 6205', location: 'WH-01 / Rack A3', qty: 12, status: 'Active' });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Barcode System</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Barcode</span></div>
        </div>
      </div>

      <div className="tabs">
        {['Generate Barcode', 'Scan & Lookup', 'Movement Logs'].map((t, i) => (
          <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Generate Barcode</div>
            <div className="form-group">
              <label className="form-label">Select SKU</label>
              <select className="form-select" value={genSKU} onChange={e => setGenSKU(e.target.value)}>
                <option>SKU-1042</option><option>SKU-2187</option><option>SKU-3301</option><option>SKU-4412</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Batch Number</label>
              <input className="form-input" defaultValue="B-2024-04" />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" defaultValue="100" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>Generate</button>
              <button className="btn btn-outline" style={{ flex: 1 }}>Print Labels</button>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <BarcodeDisplay value={`BC-${genSKU.replace('-', '')}-B202404`} />
            <div style={{ fontSize: 12, color: '#718096', textAlign: 'center' }}>
              Barcode generated for <strong>{genSKU}</strong><br />Batch: B-2024-04
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid-2">
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>Scan Barcode</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Scan or enter barcode..."
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
              />
              <button className="btn btn-primary" onClick={handleScan}>Lookup</button>
            </div>
            <div style={{ textAlign: 'center', padding: 40, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 13, color: '#718096' }}>Point camera at barcode or type manually above</div>
            </div>
          </div>
          {scanned && (
            <div className="card">
              <div className="section-title" style={{ color: '#27ae60', marginBottom: 16 }}>✓ Item Found</div>
              {[['SKU', scanned.sku], ['Item Name', scanned.name], ['Location', scanned.location], ['Current Qty', scanned.qty], ['Status', scanned.status]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                  <span style={{ color: '#718096' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>Inward</button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>Outward</button>
                <button className="btn btn-sm" style={{ flex: 1, background: '#f1f5f9', color: '#1c2833' }}>Transfer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>Movement Logs</div>
          <div className="table-container">
            <table>
              <thead><tr>{['Log ID','Barcode','Item','Action','Location','Operator','Time'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {movementLogs.map((l, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>{l.id}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.barcode}</td>
                    <td style={{ fontWeight: 600 }}>{l.item}</td>
                    <td><StatusBadge status={l.action} type={l.action === 'Inward' ? 'success' : l.action === 'Outward' ? 'danger' : 'info'} /></td>
                    <td>{l.location}</td>
                    <td>{l.operator}</td>
                    <td style={{ color: '#718096', fontSize: 12 }}>{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
