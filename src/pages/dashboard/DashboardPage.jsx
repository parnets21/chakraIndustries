import { useNavigate } from 'react-router-dom';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import StatusBadge from '../../components/common/StatusBadge';
import { MdProductionQuantityLimits } from 'react-icons/md';
import { GiReturnArrow } from 'react-icons/gi';

// ── Data ──────────────────────────────────────────────────────────────────────
const kpis = [
  { label: 'Total Revenue',    value: '₹48.2L', change: '+12.4%', up: true,  gradient: 'linear-gradient(135deg,#ef4444,#b91c1c)', glow: 'rgba(239,68,68,0.3)',   icon: <SalesIcon />,   sub: 'vs last month'     },
  { label: 'Active Orders',    value: '284',    change: '+8.1%',  up: true,  gradient: 'linear-gradient(135deg,#22c55e,#15803d)', glow: 'rgba(34,197,94,0.3)',   icon: <OrderIcon />,   sub: 'in progress'       },
  { label: 'Inventory Value',  value: '₹1.2Cr', change: '-2.3%',  up: false, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.3)',  icon: <BoxIcon />,     sub: 'across warehouses' },
  { label: 'Production Today', value: '1,840',  change: '+5.6%',  up: true,  gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', glow: 'rgba(168,85,247,0.3)',  icon: <FactoryIcon />, sub: 'units produced'    },
  { label: 'Pending Dispatch', value: '37',     change: '-4.2%',  up: false, gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', glow: 'rgba(59,130,246,0.3)',  icon: <TruckIcon />,   sub: 'awaiting shipment' },
];

const operationalAlerts = [
  { label: 'Pending GRNs',        value: 8,     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <ClipboardIcon /> },
  { label: 'Return Requests',      value: 3,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <GiReturnArrow size={24} /> },
  { label: "Today's Dispatches",   value: 12,    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <TruckDispatchIcon /> },
  { label: 'Production vs Target', value: '94%', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: <MdProductionQuantityLimits size={24} /> },
];

const productionTarget = [
  { product: 'Engine Assembly A', target: 50, actual: 50, pct: 100 },
  { product: 'Gearbox Unit B',    target: 30, actual: 18, pct: 60  },
  { product: 'Clutch Assembly C', target: 80, actual: 0,  pct: 0   },
];

const salesTrend = [
  { label: 'Jan', value: 320000 }, { label: 'Feb', value: 410000 }, { label: 'Mar', value: 380000 },
  { label: 'Apr', value: 520000 }, { label: 'May', value: 490000 }, { label: 'Jun', value: 610000 },
  { label: 'Jul', value: 580000 }, { label: 'Aug', value: 720000 }, { label: 'Sep', value: 680000 },
  { label: 'Oct', value: 790000 }, { label: 'Nov', value: 850000 }, { label: 'Dec', value: 920000 },
];

const inventoryStatus = [
  { label: 'Raw Mat',  value: 4200, color: '#ef4444' },
  { label: 'WIP',      value: 1800, color: '#f59e0b' },
  { label: 'Finished', value: 3100, color: '#22c55e' },
  { label: 'Dead',     value: 420,  color: '#64748b' },
  { label: 'Quarant.', value: 280,  color: '#a855f7' },
];

const productionEff = [
  { label: 'Mon', value: 88, color: '#ef4444' }, { label: 'Tue', value: 92, color: '#ef4444' },
  { label: 'Wed', value: 85, color: '#ef4444' }, { label: 'Thu', value: 94, color: '#ef4444' },
  { label: 'Fri', value: 90, color: '#ef4444' }, { label: 'Sat', value: 78, color: '#f59e0b' },
];

const donutData = [
  { label: 'Delivered',  value: 142, color: '#22c55e' },
  { label: 'Processing', value: 87,  color: '#ef4444' },
  { label: 'Pending',    value: 55,  color: '#f59e0b' },
];

const recentOrders = [
  { id: 'ORD-2024-089', customer: 'Tata Motors Ltd',     items: 12, value: '₹2,84,000', status: 'Processing', date: '14 Apr' },
  { id: 'ORD-2024-088', customer: 'Mahindra & Mahindra', items: 8,  value: '₹1,56,000', status: 'Delivered',  date: '13 Apr' },
  { id: 'ORD-2024-087', customer: 'Bajaj Auto',           items: 24, value: '₹4,12,000', status: 'Pending',    date: '13 Apr' },
  { id: 'ORD-2024-086', customer: 'Hero MotoCorp',        items: 6,  value: '₹98,000',   status: 'Delivered',  date: '12 Apr' },
  { id: 'ORD-2024-085', customer: 'TVS Motor',            items: 18, value: '₹3,24,000', status: 'Shipped',    date: '12 Apr' },
];

const lowStock = [
  { sku: 'SKU-1042', name: 'Bearing 6205',     qty: 12, min: 50, warehouse: 'WH-01' },
  { sku: 'SKU-2187', name: 'Oil Seal 35x52',   qty: 8,  min: 30, warehouse: 'WH-02' },
  { sku: 'SKU-0934', name: 'Gasket Set A',      qty: 5,  min: 25, warehouse: 'WH-01' },
  { sku: 'SKU-3301', name: 'Piston Ring 80mm', qty: 18, min: 40, warehouse: 'WH-03' },
];

const pendingApprovals = [
  { id: 'PO-2024-089',  type: 'Purchase Order',       amount: '₹4,82,000', requestedBy: 'Ravi Sharma', age: '2d', color: '#ef4444' },
  { id: 'PR-2024-034',  type: 'Purchase Requisition', amount: '₹1,20,000', requestedBy: 'Priya Nair',  age: '1d', color: '#f59e0b' },
  { id: 'RFQ-2024-012', type: 'RFQ',                  amount: '₹8,40,000', requestedBy: 'Amit Patel',  age: '3d', color: '#a855f7' },
];

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #e8edf2',
      boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 18px 0', marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div style={{ flexShrink: 0, marginLeft: 8 }}>{right}</div>}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const go = (path) => navigate(path);

  return (
    <>
      {/* ── Responsive styles ── */}
      <style>{`
        .db-wrap { display:flex; flex-direction:column; gap:16px; }

        /* Welcome banner */
        .db-banner {
          background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#0f172a 100%);
          border-radius:16px;
          padding:20px 22px;
          display:flex; align-items:center; justify-content:space-between;
          position:relative; overflow:hidden;
          box-shadow:0 6px 24px rgba(15,23,42,0.18);
          gap:16px;
        }
        .db-banner-stats {
          display:flex; gap:10px; flex-shrink:0; flex-wrap:nowrap;
        }
        .db-banner-chip {
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:12px; padding:10px 14px; text-align:center;
          min-width:72px;
        }

        /* KPI grid — 2 cols on mobile, 3 on tablet, 5 on desktop */
        .db-kpi-grid {
          display:grid;
          grid-template-columns: repeat(2, 1fr);
          gap:12px;
        }
        @media(min-width:640px)  { .db-kpi-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:1024px) { .db-kpi-grid { grid-template-columns:repeat(5,1fr); } }

        /* Charts row 1 — stacked on mobile, side-by-side on desktop */
        .db-charts-1 {
          display:grid; grid-template-columns:1fr; gap:14px;
        }
        @media(min-width:768px) { .db-charts-1 { grid-template-columns:2fr 1fr; } }

        /* Operational alerts — 2 cols on mobile, 4 on desktop */
        .db-alerts {
          display:grid; grid-template-columns:repeat(2,1fr); gap:12px;
        }
        @media(min-width:768px) { .db-alerts { grid-template-columns:repeat(4,1fr); } }

        /* Charts row 2 — stacked on mobile, side-by-side on desktop */
        .db-charts-2 {
          display:grid; grid-template-columns:1fr; gap:14px;
        }
        @media(min-width:768px) { .db-charts-2 { grid-template-columns:1fr 1fr; } }

        /* Bottom tables — stacked on mobile, side-by-side on desktop */
        .db-bottom {
          display:grid; grid-template-columns:1fr; gap:14px;
        }
        @media(min-width:900px) { .db-bottom { grid-template-columns:2fr 1fr; } }

        /* Banner responsive — stack on very small screens */
        @media(max-width:480px) {
          .db-banner { flex-direction:column; align-items:flex-start; }
          .db-banner-stats { width:100%; justify-content:space-between; }
          .db-banner-chip { flex:1; }
        }

        /* KPI card hover */
        .db-kpi-card { transition:transform 0.2s, box-shadow 0.2s; }
        .db-kpi-card:hover { transform:translateY(-2px); }
      `}</style>

      <div className="db-wrap">

        {/* ── Welcome Banner ── */}
        <div className="db-banner">
          {/* Decorative blobs */}
          <div style={{ position:'absolute', top:-40, right:80, width:160, height:160, borderRadius:'50%', background:'rgba(239,68,68,0.1)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-20, right:30, width:100, height:100, borderRadius:'50%', background:'rgba(168,85,247,0.08)', pointerEvents:'none' }} />

          <div style={{ position:'relative', zIndex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.8)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>
              Good Morning 👋
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.4px', marginBottom:4, lineHeight:1.2 }}>
              Chakra Industries ERP
            </div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>{today}</div>
          </div>

          <div className="db-banner-stats" style={{ position:'relative', zIndex:1 }}>
            {[
              { label:'FY Revenue', value:'₹82.4L', color:'#ef4444' },
              { label:'Open POs',   value:'23',     color:'#f59e0b' },
              { label:'Efficiency', value:'94%',    color:'#22c55e' },
            ].map((s, i) => (
              <div key={i} className="db-banner-chip">
                <div style={{ fontSize:17, fontWeight:800, color:s.color, letterSpacing:'-0.3px' }}>{s.value}</div>
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:2, fontWeight:500, whiteSpace:'nowrap' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="db-kpi-grid">
          {kpis.map((k, i) => {
            const kpiLinks = ['/finance/ledger', '/orders', '/inventory/dashboard', '/production/workorders', '/logistics/dispatch'];
            return (
            <div key={i} className="db-kpi-card" onClick={() => go(kpiLinks[i])} style={{
              background:'#fff', borderRadius:14,
              border:'1px solid #e8edf2', padding:'16px',
              boxShadow:'0 2px 8px rgba(15,23,42,0.05)',
              position:'relative', overflow:'hidden', cursor:'pointer',
              transition:'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(15,23,42,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(15,23,42,0.05)'; }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.gradient, borderRadius:'14px 14px 0 0' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{
                  width:36, height:36, borderRadius:10,
                  background:k.gradient,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', flexShrink:0,
                }}>
                  {k.icon}
                </div>
                <span style={{
                  fontSize:10.5, fontWeight:700, padding:'2px 7px', borderRadius:20,
                  background: k.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: k.up ? '#16a34a' : '#dc2626',
                }}>
                  {k.up ? '↑' : '↓'} {k.change}
                </span>
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px', lineHeight:1 }}>{k.value}</div>
              <div style={{ fontSize:11.5, color:'#64748b', fontWeight:500, marginTop:4 }}>{k.label}</div>
              <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>{k.sub}</div>
            </div>
            );
          })}
        </div>

        {/* ── Charts Row 1: Revenue + Order Status ── */}
        <div className="db-charts-1">
          <Card>
            <CardHead
              title="Revenue Trend"
              sub="Monthly revenue — FY 2024-25"
              right={
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#ef4444', letterSpacing:'-0.4px' }}>₹82.4L</div>
                  <div style={{ fontSize:10.5, fontWeight:700, color:'#22c55e' }}>↑ 18.2% vs last year</div>
                </div>
              }
            />
            <div style={{ padding:'0 18px 18px' }}>
              <LineChart data={salesTrend} color="#ef4444" height={150} />
            </div>
          </Card>

          <Card>
            <CardHead title="Order Status" sub="Current distribution" />
            <div style={{ padding:'0 18px 18px' }}>
              <DonutChart data={donutData} size={110} />
            </div>
          </Card>
        </div>

        {/* ── Operational Alerts ── */}
        <div className="db-alerts">
          {operationalAlerts.map((a, i) => {
            const alertLinks = ['/procurement/grn', '/returns/requests', '/logistics/dispatch', '/production/tracking'];
            return (
            <Card key={i} style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
              onClick={() => go(alertLinks[i])}
            >
              <div style={{
                width:42, height:42, borderRadius:12, flexShrink:0,
                background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:a.color, letterSpacing:'-0.5px', lineHeight:1 }}>{a.value}</div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:3, fontWeight:500 }}>{a.label}</div>
              </div>
            </Card>
            );
          })}
        </div>

        {/* ── Charts Row 2: Inventory + Production Efficiency ── */}
        <div className="db-charts-2">
          <Card>
            <CardHead title="Inventory Status" sub="Units by category" />
            <div style={{ padding:'0 18px 18px' }}>
              <BarChart data={inventoryStatus} height={140} />
            </div>
          </Card>
          <Card>
            <CardHead title="Production Efficiency" sub="This week (%)" />
            <div style={{ padding:'0 18px 18px' }}>
              <BarChart data={productionEff} height={140} />
            </div>
          </Card>
        </div>

        {/* ── Production vs Target ── */}
        <Card>
          <CardHead
            title="Production vs Target — Today"
            sub="Work order progress"
            right={<StatusBadge status="Active" />}
          />
          <div style={{ padding:'0 18px 18px', display:'flex', flexDirection:'column', gap:14 }}>
            {productionTarget.map((p, i) => {
              const color = p.pct === 100 ? '#22c55e' : p.pct > 50 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7, flexWrap:'wrap', gap:4 }}>
                    <span style={{ fontSize:12.5, fontWeight:600, color:'#1e293b' }}>{p.product}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:11.5, color:'#94a3b8' }}>{p.actual}/{p.target} units</span>
                      <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20, background:color+'18', color }}>{p.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:7, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:99, width:`${p.pct}%`,
                      background: p.pct===100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : p.pct>50 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#b91c1c)',
                      transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Bottom: Recent Orders + Side panels ── */}
        <div className="db-bottom">

          {/* Recent Orders */}
          <Card>
            <CardHead
              title="Recent Orders"
              sub="Latest customer orders"
              right={
                <button style={{
                  fontSize:11.5, fontWeight:600, color:'#ef4444',
                  background:'rgba(239,68,68,0.08)', border:'none',
                  padding:'4px 10px', borderRadius:7, cursor:'pointer',
                }}>View all →</button>
              }
            />
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:460 }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['Order ID','Customer','Value','Status','Date'].map(h => (
                      <th key={h} style={{
                        padding:'9px 16px', textAlign:'left', fontSize:10.5,
                        fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                        letterSpacing:'0.7px', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f8fafc', cursor:'pointer' }}
                      onClick={() => go('/orders')}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'11px 16px', fontSize:12, fontWeight:700, color:'#ef4444' }}>{o.id}</td>
                      <td style={{ padding:'11px 16px', fontSize:12, color:'#1e293b' }}>{o.customer}</td>
                      <td style={{ padding:'11px 16px', fontSize:12, fontWeight:600, color:'#1e293b' }}>{o.value}</td>
                      <td style={{ padding:'11px 16px' }}><StatusBadge status={o.status} /></td>
                      <td style={{ padding:'11px 16px', fontSize:11.5, color:'#94a3b8' }}>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Side: Low Stock + Pending Approvals */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            <Card>
              <CardHead
                title="Low Stock Alerts"
                sub="Items below minimum"
                right={<StatusBadge status="Critical" />}
              />
              <div style={{ padding:'0 18px 14px' }}>
                {lowStock.map((s, i) => (
                  <div key={i} onClick={() => go('/inventory/stock')} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'9px 0', cursor:'pointer',
                    borderBottom: i < lowStock.length-1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:600, color:'#1e293b' }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{s.sku} · {s.warehouse}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#ef4444' }}>{s.qty}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>min: {s.min}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHead title="Pending Approvals" sub="Awaiting your action" />
              <div style={{ padding:'0 18px 14px' }}>
                {pendingApprovals.map((a, i) => (
                  <div key={i} onClick={() => go('/procurement/approvals')} style={{
                    padding:'9px 0', cursor:'pointer',
                    borderBottom: i < pendingApprovals.length-1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:a.color }}>{a.id}</span>
                      <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:20, background:'rgba(239,68,68,0.08)', color:'#ef4444' }}>{a.age} ago</span>
                    </div>
                    <div style={{ fontSize:11.5, color:'#64748b' }}>{a.type} · {a.requestedBy}</div>
                    <div style={{ fontSize:12.5, fontWeight:700, color:'#f59e0b', marginTop:3 }}>{a.amount}</div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>

      </div>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function SalesIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>; }
function OrderIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>; }
function BoxIcon()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>; }
function FactoryIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/></svg>; }
function TruckIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>; }

// Operational Alert Icons
function ClipboardIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="16" x2="15" y2="16"/></svg>; }
function ReturnIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>; }
function TruckDispatchIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>; }
function FactoryProductionIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V8l6-4v4l6-4v4l6-4v16H2z"/><line x1="6" y1="12" x2="6" y2="16"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="18" y1="12" x2="18" y2="16"/></svg>; }
