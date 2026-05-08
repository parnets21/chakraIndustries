import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../auth/AuthContext';
import { prApi } from '../../api/prApi';
import { poApi } from '../../api/poApi';
import { grnApi } from '../../api/grnApi';
import { approvalApi } from '../../api/approvalApi';
import { rfqApi } from '../../api/rfqApi';
import { qualityCheckApi } from '../../api/qualityCheckApi';
import { vendorApi } from '../../api/vendorApi';
import { inventoryApi } from '../../api/inventoryApi';
import { inventoryFlowApi } from '../../api/inventoryFlowApi';
import { MdProductionQuantityLimits } from 'react-icons/md';
import { GiReturnArrow } from 'react-icons/gi';

// ── Greeting helper ───────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (h < 21) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Good Night', emoji: '🌙' };
}

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
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const go        = (path) => navigate(path);
  const greeting  = getGreeting();
  const today     = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const [loading, setLoading]             = useState(true);
  const [prStats, setPrStats]             = useState({ total: 0, pending: 0, approved: 0 });
  const [poStats, setPoStats]             = useState({ total: 0, pending: 0, approved: 0, totalValue: 0 });
  const [grnStats, setGrnStats]           = useState({ total: 0, pending: 0 });
  const [approvalStats, setApprovalStats] = useState({ pending: 0, approved: 0, total: 0 });
  const [qcStats, setQcStats]             = useState({ total: 0, passed: 0, pending: 0, partial: 0, rejected: 0 });
  const [vendorStats, setVendorStats]     = useState({ total: 0, active: 0 });
  const [inventoryStats, setInventoryStats] = useState({ total: 0, critical: 0 });
  const [recentPOs, setRecentPOs]         = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [lowStock, setLowStock]           = useState([]);
  const [flowData, setFlowData]           = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prRes, poRes, grnRes, approvalRes, qcRes, vendorRes, invRes, appListRes, flowRes] = await Promise.allSettled([
        prApi.getAll(),
        poApi.getAll(),
        grnApi.getAll(),
        approvalApi.getStats(),
        qualityCheckApi.getStats(),
        vendorApi.getAll(),
        inventoryApi.getAll(),
        approvalApi.getAll({ status: 'Pending' }),
        inventoryFlowApi.getDashboard(),
      ]);

      if (prRes.status === 'fulfilled') {
        const prs = prRes.value.data || [];
        setPrStats({ total: prs.length, pending: prs.filter(p => p.status === 'Pending').length, approved: prs.filter(p => p.status === 'Approved').length });
      }
      if (poRes.status === 'fulfilled') {
        const pos = poRes.value.data || [];
        setPoStats({ total: pos.length, pending: pos.filter(p => p.status === 'Pending').length, approved: pos.filter(p => p.status === 'Approved').length, totalValue: pos.reduce((s, p) => s + (p.grandTotal || 0), 0) });
        setRecentPOs(pos.slice(0, 5));
      }
      if (grnRes.status === 'fulfilled') {
        const grns = grnRes.value.data || [];
        setGrnStats({ total: grns.length, pending: grns.filter(g => g.qcStatus === 'Pending' || g.qcStatus === 'Not Started').length });
      }
      if (approvalRes.status === 'fulfilled') setApprovalStats(approvalRes.value.data || {});
      if (qcRes.status === 'fulfilled') setQcStats(qcRes.value.data || {});
      if (vendorRes.status === 'fulfilled') {
        const v = vendorRes.value.data || [];
        setVendorStats({ total: v.length, active: v.filter(x => x.status === 'Active').length });
      }
      if (invRes.status === 'fulfilled') {
        const items = invRes.value.data || [];
        setInventoryStats({ total: items.length, critical: items.filter(i => i.status === 'Critical').length });
        setLowStock(items.filter(i => i.status === 'Critical' || (i.minQty > 0 && i.qty < i.minQty)).slice(0, 4));
      }
      if (appListRes.status === 'fulfilled') setPendingApprovals((appListRes.value.data || []).slice(0, 4));
      if (flowRes.status === 'fulfilled') setFlowData(flowRes.value.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n||0).toLocaleString('en-IN')}`;

  const kpis = [
    { label: 'Total PO Value',     value: fmt(poStats.totalValue),          sub: `${poStats.total} purchase orders`,    gradient: 'linear-gradient(135deg,#ef4444,#b91c1c)', icon: <SalesIcon />,   link: '/procurement/po' },
    { label: 'Pending Approvals',  value: String(approvalStats.pending||0), sub: `${approvalStats.total||0} total`,     gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', icon: <OrderIcon />,   link: '/procurement/approvals' },
    { label: 'Inventory Items',    value: String(inventoryStats.total||0),  sub: `${inventoryStats.critical||0} critical`, gradient: 'linear-gradient(135deg,#22c55e,#15803d)', icon: <BoxIcon />,     link: '/inventory/stock' },
    { label: 'Active Vendors',     value: String(vendorStats.active||0),    sub: `${vendorStats.total||0} total`,       gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', icon: <FactoryIcon />, link: '/procurement/vendors' },
    { label: 'GRNs Pending QC',    value: String(grnStats.pending||0),      sub: `${grnStats.total||0} total GRNs`,     gradient: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', icon: <TruckIcon />,   link: '/procurement/grn' },
  ];

  const alerts = [
    { label: 'Pending PRs',       value: prStats.pending,           color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: <ClipboardIcon />,                        link: '/procurement/pr' },
    { label: 'Pending Approvals', value: approvalStats.pending||0,  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: <GiReturnArrow size={24} />,              link: '/procurement/approvals' },
    { label: 'QC Pending',        value: qcStats.pending||0,        color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <TruckDispatchIcon />,                    link: '/procurement/qc' },
    { label: 'Critical Stock',    value: inventoryStats.critical||0, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: <MdProductionQuantityLimits size={24} />, link: '/inventory/stock' },
  ];

  const procurementDonut = [
    { label: 'Approved PRs', value: prStats.approved||0,  color: '#22c55e' },
    { label: 'Pending PRs',  value: prStats.pending||0,   color: '#f59e0b' },
    { label: 'Approved POs', value: poStats.approved||0,  color: '#3b82f6' },
    { label: 'Pending POs',  value: poStats.pending||0,   color: '#ef4444' },
  ].filter(d => d.value > 0);

  const qcBar = [
    { label: 'Passed',   value: qcStats.passed||0,   color: '#22c55e' },
    { label: 'Partial',  value: qcStats.partial||0,  color: '#f59e0b' },
    { label: 'Pending',  value: qcStats.pending||0,  color: '#3b82f6' },
    { label: 'Rejected', value: qcStats.rejected||0, color: '#ef4444' },
  ];

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
              {greeting.text} {greeting.emoji}
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.4px', marginBottom:4, lineHeight:1.2 }}>
              {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Chakra Industries ERP'}
            </div>
            <div style={{ fontSize:11.5, color:'#64748b' }}>{today}</div>
            {user?.role && (
              <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'3px 10px' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e' }} />
                <span style={{ fontSize:10.5, color:'#94a3b8', fontWeight:600, textTransform:'capitalize' }}>{user.role.replace(/_/g,' ')}</span>
              </div>
            )}
          </div>

          <div className="db-banner-stats" style={{ position:'relative', zIndex:1 }}>
            {[
              { label:'Total POs',    value: loading ? '—' : poStats.total,              color:'#ef4444' },
              { label:'Pending Appr', value: loading ? '—' : approvalStats.pending||0,   color:'#f59e0b' },
              { label:'QC Passed',    value: loading ? '—' : qcStats.passed||0,          color:'#22c55e' },
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
          {kpis.map((k, i) => (
            <div key={i} className="db-kpi-card" onClick={() => go(k.link)} style={{
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
                }}>rr
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px', lineHeight:1 }}>
                {loading ? <span style={{ color:'#e2e8f0' }}>—</span> : k.value}
              </div>
              <div style={{ fontSize:11.5, color:'#64748b', fontWeight:500, marginTop:4 }}>{k.label}</div>
              <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:2 }}>{loading ? '...' : k.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Charts Row 1: Procurement Flow + QC Status ── */}
        <div className="db-charts-1">
          <Card>
            <CardHead
              title="Procurement Flow"
              sub="PR & PO status breakdown"
              right={
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'#ef4444', letterSpacing:'-0.4px' }}>{loading ? '—' : fmt(poStats.totalValue)}</div>
                  <div style={{ fontSize:10.5, fontWeight:600, color:'#64748b' }}>Total PO value</div>
                </div>
              }
            />
            <div style={{ padding:'0 18px 18px' }}>
              {procurementDonut.length > 0
                ? <DonutChart data={procurementDonut} size={110} />
                : <div style={{ height:130, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>
                    {loading ? 'Loading...' : 'No procurement data yet'}
                  </div>
              }
            </div>
          </Card>

          <Card>
            <CardHead title="Quality Check Status" sub="Inspection results" />
            <div style={{ padding:'0 18px 18px' }}>
              <BarChart data={qcBar} height={140} />
            </div>
          </Card>
        </div>

        {/* ── Inventory Flow Section ── */}
        {flowData && (
          <Card>
            <CardHead
              title="Inventory Flow Pipeline"
              sub="GRN → Inventory Increase → Sales → Inventory Decrease → Production → Returns → Final Stock"
            />
            <div style={{ padding:'0 18px 18px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
              }}>
                {[
                  { label: 'GRN Received', value: flowData.grnStats?.today || 0, icon: '📦', color: '#3b82f6' },
                  { label: 'Inventory ↑', value: flowData.flowTimeline?.grnReceived || 0, icon: '⬆️', color: '#22c55e' },
                  { label: 'Sales ↓', value: flowData.flowTimeline?.salesOutward || 0, icon: '📉', color: '#ef4444' },
                  { label: 'Production', value: flowData.flowTimeline?.productionUsage || 0, icon: '🏭', color: '#f59e0b' },
                  { label: 'Returns ↑', value: flowData.flowTimeline?.returnsInward || 0, icon: '↩️', color: '#a855f7' },
                  { label: 'Final Stock', value: flowData.inventoryStats?.availableQuantity || 0, icon: '📊', color: '#06b6d4' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: `2px solid ${item.color}`,
                    borderRadius: 12,
                    padding: 14,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: item.color, letterSpacing: '-0.3px' }}>
                      {loading ? '—' : item.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ── Operational Alerts ── */}
        <div className="db-alerts">
          {alerts.map((a, i) => (
            <Card key={i} style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
              onClick={() => go(a.link)}
            >
              <div style={{
                width:42, height:42, borderRadius:12, flexShrink:0,
                background:a.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              }}>{a.icon}</div>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:a.color, letterSpacing:'-0.5px', lineHeight:1 }}>
                  {loading ? '—' : a.value}
                </div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:3, fontWeight:500 }}>{a.label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Warehouse Breakdown ── */}
        {flowData && Object.keys(flowData.warehouseBreakdown || {}).length > 0 && (
          <Card>
            <CardHead
              title="Warehouse Stock Distribution"
              sub="Inventory levels by warehouse"
            />
            <div style={{ padding:'0 18px 14px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {Object.entries(flowData.warehouseBreakdown).map(([whName, data], i) => (
                  <div key={i} style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 12,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{whName}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>Items:</span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{data.items}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>Total Qty:</span>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{data.totalQty}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>Available:</span>
                        <span style={{ fontWeight: 600, color: '#22c55e' }}>{data.availableQty}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: '#64748b' }}>Reserved:</span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>{data.reservedQty}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#64748b' }}>Value:</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(data.value)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ── Bottom: Recent POs + Side panels ── */}
        <div className="db-bottom">

          {/* Recent Purchase Orders */}
          <Card>
            <CardHead
              title="Recent Purchase Orders"
              sub="Latest POs in the system"
              right={
                <button onClick={() => go('/procurement/po')} style={{
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
                    {['PO ID','Vendor','Grand Total','Status','Date'].map(h => (
                      <th key={h} style={{
                        padding:'9px 16px', textAlign:'left', fontSize:10.5,
                        fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                        letterSpacing:'0.7px', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>Loading...</td></tr>
                  ) : recentPOs.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No purchase orders yet</td></tr>
                  ) : recentPOs.map((po, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f8fafc', cursor:'pointer' }}
                      onClick={() => go('/procurement/po')}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'11px 16px', fontSize:12, fontWeight:700, color:'#ef4444' }}>{po.poId}</td>
                      <td style={{ padding:'11px 16px', fontSize:12, color:'#1e293b' }}>{po.vendor?.companyName || '—'}</td>
                      <td style={{ padding:'11px 16px', fontSize:12, fontWeight:600, color:'#1e293b' }}>{fmt(po.grandTotal)}</td>
                      <td style={{ padding:'11px 16px' }}><StatusBadge status={po.status} /></td>
                      <td style={{ padding:'11px 16px', fontSize:11.5, color:'#94a3b8' }}>{new Date(po.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</td>
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
                title="Low / Critical Stock"
                sub="Items needing attention"
                right={<StatusBadge status="Critical" />}
              />
              <div style={{ padding:'0 18px 14px' }}>
                {loading ? (
                  <div style={{ padding:16, textAlign:'center', color:'#94a3b8', fontSize:13 }}>Loading...</div>
                ) : lowStock.length === 0 ? (
                  <div style={{ padding:16, textAlign:'center', color:'#22c55e', fontSize:13 }}>✓ All stock levels healthy</div>
                ) : lowStock.map((s, i) => (
                  <div key={i} onClick={() => go('/inventory/stock')} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'9px 0', cursor:'pointer',
                    borderBottom: i < lowStock.length-1 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:600, color:'#1e293b' }}>{s.name}</div>
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{s.sku} · {s.warehouse || 'WH-01'}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0, marginLeft:8 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:'#ef4444' }}>{s.qty}</div>
                      <div style={{ fontSize:10, color:'#94a3b8' }}>min: {s.minQty || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHead
                title="Pending Approvals"
                sub="Awaiting action"
                right={
                  <button onClick={() => go('/procurement/approvals')} style={{
                    fontSize:11.5, fontWeight:600, color:'#ef4444',
                    background:'rgba(239,68,68,0.08)', border:'none',
                    padding:'4px 10px', borderRadius:7, cursor:'pointer',
                  }}>View all →</button>
                }
              />
              <div style={{ padding:'0 18px 14px' }}>
                {loading ? (
                  <div style={{ padding:16, textAlign:'center', color:'#94a3b8', fontSize:13 }}>Loading...</div>
                ) : pendingApprovals.length === 0 ? (
                  <div style={{ padding:16, textAlign:'center', color:'#22c55e', fontSize:13 }}>✓ No pending approvals</div>
                ) : pendingApprovals.map((a, i) => {
                  const typeColor = { GRN:'#ef4444', PO:'#f59e0b', PR:'#a855f7', QC:'#3b82f6' };
                  const c = typeColor[a.docType] || '#64748b';
                  return (
                    <div key={i} onClick={() => go('/procurement/approvals')} style={{
                      padding:'9px 0', cursor:'pointer',
                      borderBottom: i < pendingApprovals.length-1 ? '1px solid #f1f5f9' : 'none',
                    }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:c }}>{a.docRef || a.approvalId}</span>
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:20, background:'rgba(239,68,68,0.08)', color:'#ef4444' }}>{a.docType}</span>
                      </div>
                      <div style={{ fontSize:11.5, color:'#64748b' }}>{a.requestedBy || 'Procurement'} · {a.department}</div>
                      <div style={{ fontSize:12.5, fontWeight:700, color:'#f59e0b', marginTop:3 }}>{a.amount ? fmt(a.amount) : '—'}</div>
                    </div>
                  );
                })}
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
