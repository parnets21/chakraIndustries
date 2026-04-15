import StatusBadge from '../../components/common/StatusBadge';
import LineChart from '../../components/charts/LineChart';

const demandData = [
  { label: 'Jan', value: 4200 }, { label: 'Feb', value: 4800 }, { label: 'Mar', value: 5100 },
  { label: 'Apr', value: 4900 }, { label: 'May', value: 5600 }, { label: 'Jun', value: 6200 },
  { label: 'Jul', value: 5800 }, { label: 'Aug', value: 6800 }, { label: 'Sep', value: 7200 },
  { label: 'Oct', value: 7800 }, { label: 'Nov', value: 8400 }, { label: 'Dec', value: 9200 },
];

const forecastData = [
  { label: 'May', value: 6200 }, { label: 'Jun', value: 6800 }, { label: 'Jul', value: 7100 },
  { label: 'Aug', value: 7600 }, { label: 'Sep', value: 8200 }, { label: 'Oct', value: 8900 },
];

const suggestedPurchases = [
  { sku: 'SKU-1042', name: 'Bearing 6205', currentStock: 12, forecastDemand: 450, suggestedQty: 500, vendor: 'Global Bearings Ltd', urgency: 'Critical' },
  { sku: 'SKU-2187', name: 'Oil Seal 35x52', currentStock: 8, forecastDemand: 280, suggestedQty: 300, vendor: 'National Seals', urgency: 'Critical' },
  { sku: 'SKU-3301', name: 'Piston Ring 80mm', currentStock: 340, forecastDemand: 600, suggestedQty: 400, vendor: 'Shree Metals', urgency: 'Normal' },
  { sku: 'SKU-4412', name: 'Crankshaft Seal', currentStock: 220, forecastDemand: 400, suggestedQty: 250, vendor: 'National Seals', urgency: 'Normal' },
  { sku: 'SKU-5523', name: 'Valve Spring Set', currentStock: 180, forecastDemand: 350, suggestedQty: 200, vendor: 'Precision Parts', urgency: 'Low' },
];

export default function ForecastingPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Demand Forecasting</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Forecasting</span></div>
        </div>
        <button className="btn btn-primary">Generate Forecast</button>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Historical Demand</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>Units sold — FY 2024-25</div>
          <LineChart data={demandData} color="#c0392b" height={180} />
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Demand Forecast</div>
          <div className="section-sub" style={{ marginBottom: 12 }}>Projected — Next 6 months</div>
          <LineChart data={forecastData} color="#f39c12" height={180} />
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="section-title">Suggested Purchase Orders</div>
          <button className="btn btn-accent btn-sm">Auto-Generate POs</button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {['SKU','Item Name','Current Stock','Forecast Demand','Suggested Qty','Preferred Vendor','Urgency','Action'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {suggestedPurchases.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: '#c0392b', fontFamily: 'monospace' }}>{s.sku}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ fontWeight: 700, color: s.currentStock < 50 ? '#e74c3c' : '#27ae60' }}>{s.currentStock}</td>
                  <td>{s.forecastDemand}</td>
                  <td style={{ fontWeight: 700 }}>{s.suggestedQty}</td>
                  <td>{s.vendor}</td>
                  <td><StatusBadge status={s.urgency} type={s.urgency === 'Critical' ? 'danger' : s.urgency === 'Normal' ? 'warning' : 'info'} /></td>
                  <td><button className="btn btn-primary btn-sm">Create PO</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
