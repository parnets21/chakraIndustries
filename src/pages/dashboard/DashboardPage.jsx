import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import StatusBadge from '../../components/common/StatusBadge';

const kpis = [
  { label: 'Total Sales', value: '₹48.2L', change: '+12.4%', up: true, color: '#fdf0ef', iconColor: '#c0392b', icon: <SalesIcon /> },
  { label: 'Active Orders', value: '284', change: '+8.1%', up: true, color: '#eafaf1', iconColor: '#27ae60', icon: <OrderIcon /> },
  { label: 'Inventory Value', value: '₹1.2Cr', change: '-2.3%', up: false, color: '#fef9e7', iconColor: '#f39c12', icon: <BoxIcon /> },
  { label: 'Production Today', value: '1,840', change: '+5.6%', up: true, color: '#f5eef8', iconColor: '#8e44ad', icon: <FactoryIcon /> },
  { label: 'Pending Dispatch', value: '37', change: '-4.2%', up: false, color: '#eaf4fb', iconColor: '#2980b9', icon: <TruckIcon /> },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 18, marginBottom: 22 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="kpi-icon" style={{ background: k.color }}>
                <span style={{ color: k.iconColor }}>{k.icon}</span>
              </div>
              <span className={`kpi-change ${k.up ? 'up' : 'down'}`}>
                {k.up ? '↑' : '↓'} {k.change}
              </span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 22 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div className="section-title">Sales Trend</div>
              <div className="section-sub">Monthly revenue — FY 2024-25</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#c0392b', letterSpacing: '-0.5px' }}>₹82.4L</div>
              <div style={{ fontSize: 11, color: '#27ae60', fontWeight: 700 }}>↑ 18.2% vs last year</div>
            </div>
          </div>
          <LineChart data={salesTrend} color="#c0392b" height={160} />
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Order Status</div>
          <div className="section-sub" style={{ marginBottom: 18 }}>Current distribution</div>
          <DonutChart data={donutData} size={120} />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Inventory Status</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>Units by category</div>
          <BarChart data={inventoryStatus} height={150} />
        </div>
        <div className="card">
          <div className="section-title" style={{ marginBottom: 4 }}>Production Efficiency</div>
          <div className="section-sub" style={{ marginBottom: 14 }}>This week (%)</div>
          <BarChart data={productionEff} height={150} />
        </div>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="section-title" style={{ color: '#922b21', marginBottom: 14 }}>Recent Orders</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Value', 'Status', 'Date'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{o.items}</td>
                    <td style={{ fontWeight: 600 }}>{o.value}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ color: '#718096' }}>{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Low Stock */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-title" style={{ color: '#922b21' }}>Low Stock Alerts</div>
              <span className="status-badge danger">{lowStock.length} items</span>
            </div>
            {lowStock.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < lowStock.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#718096' }}>{s.sku} · {s.warehouse}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e74c3c' }}>{s.qty}</div>
                  <div style={{ fontSize: 10, color: '#718096' }}>min: {s.min}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending Approvals */}
          <div className="card">
            <div className="section-title" style={{ color: '#922b21', marginBottom: 12 }}>Pending Approvals</div>
            {pendingApprovals.map((a, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < pendingApprovals.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#c0392b' }}>{a.id}</span>
                  <span style={{ fontSize: 11, color: '#718096' }}>{a.age} ago</span>
                </div>
                <div style={{ fontSize: 11, color: '#718096' }}>{a.type} · {a.requestedBy}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f39c12', marginTop: 2 }}>{a.amount}</div>
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
