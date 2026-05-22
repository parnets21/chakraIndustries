import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import {
  MdUploadFile, MdInventory2, MdApproval, MdReceipt,
  MdHourglassEmpty, MdHistory, MdArrowForward,
} from 'react-icons/md';

const MODULES = [
  { icon: MdUploadFile,    label: 'PO Upload',       path: '/po-generator/upload',          color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  { icon: MdInventory2,    label: 'Stock Verify',     path: '/po-generator/upload',          color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { icon: MdApproval,      label: 'Approval Queue',   path: '/po-generator/upload',          color: '#a16207', bg: '#fefce8', border: '#fde68a' },
  { icon: MdReceipt,       label: 'Partial Invoice',  path: '/po-generator/partial-invoice', color: '#c0392b', bg: '#fef2f2', border: '#fecaca' },
  { icon: MdHourglassEmpty,label: 'Pending Orders',   path: '/po-generator/pending-orders',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { icon: MdHistory,       label: 'Invoice History',  path: '/po-generator/invoice-history', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
];

// ── Pure SVG Bar Chart ────────────────────────────────────────────────────────
function BarChart({ data, keys, colors, labels, height = 160 }) {
  const W = 560, H = height, PAD = { top: 16, right: 16, bottom: 32, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1);
  const barGroupW = chartW / data.length;
  const barW = Math.min(18, (barGroupW - 8) / keys.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD.top + chartH * (1 - t);
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {Math.round(maxVal * t)}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const groupX = PAD.left + i * barGroupW + barGroupW / 2 - (keys.length * (barW + 2)) / 2;
        return (
          <g key={i}>
            {keys.map((k, ki) => {
              const val = d[k] || 0;
              const bh  = (val / maxVal) * chartH;
              const bx  = groupX + ki * (barW + 2);
              const by  = PAD.top + chartH - bh;
              return (
                <g key={k}>
                  <rect x={bx} y={by} width={barW} height={Math.max(bh, 1)} rx="3" fill={colors[ki]} opacity="0.85" />
                  {val > 0 && (
                    <text x={bx + barW / 2} y={by - 3} textAnchor="middle" fontSize="9" fill={colors[ki]} fontWeight="700">{val}</text>
                  )}
                </g>
              );
            })}
            {/* X label */}
            <text x={PAD.left + i * barGroupW + barGroupW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#64748b">{d.label}</text>
          </g>
        );
      })}

      {/* Legend */}
      {keys.map((k, ki) => (
        <g key={k} transform={`translate(${PAD.left + ki * 90}, ${H - 2})`}>
          <rect x="0" y="-8" width="10" height="10" rx="2" fill={colors[ki]} />
          <text x="14" y="0" fontSize="10" fill="#64748b">{labels[ki]}</text>
        </g>
      ))}
    </svg>
  );
}

// ── Pure SVG Donut Chart ──────────────────────────────────────────────────────
function DonutChart({ segments, size = 140 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, inner = size * 0.24;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let angle = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, sweep };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} opacity="0.9" />
      ))}
      {/* Inner hole */}
      <circle cx={cx} cy={cy} r={inner} fill="#fff" />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="900" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">TOTAL</text>
    </svg>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color, height = 40, width = 120 }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * (height - 6) - 3;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

export default function POGeneratorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    poGeneratorApi.getStats()
      .then(res => setStats(res.data || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const trend = stats.trend || Array(7).fill({ label: '—', invoices: 0, partial: 0, full: 0, value: 0, pos: 0 });

  const kpis = [
    { label: 'Total POs',       value: stats.totalPOs        || 0, color: '#1d4ed8', sparkKey: 'pos' },
    { label: 'Total Invoices',  value: stats.totalInvoices   || 0, color: '#16a34a', sparkKey: 'invoices' },
    { label: 'Partial',         value: stats.partialInvoices || 0, color: '#a16207', sparkKey: 'partial' },
    { label: 'Full',            value: stats.fullInvoices    || 0, color: '#0891b2', sparkKey: 'full' },
    { label: 'Pending Orders',  value: stats.totalPending    || 0, color: '#dc2626', sparkKey: null },
    { label: 'Total Value',     value: `₹${((stats.totalValue || 0) / 100000).toFixed(1)}L`, color: '#c0392b', sparkKey: 'value', isValue: true },
  ];

  const donutSegments = [
    { label: 'Draft',    value: stats.draftInvoices    || 0, color: '#94a3b8' },
    { label: 'Approved', value: stats.approvedInvoices || 0, color: '#16a34a' },
    { label: 'Paid',     value: stats.paidInvoices     || 0, color: '#1d4ed8' },
    { label: 'Partial',  value: stats.partialInvoices  || 0, color: '#f59e0b' },
  ].filter(s => s.value > 0);

  if (donutSegments.length === 0) donutSegments.push({ label: 'No Data', value: 1, color: '#e2e8f0' });

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#c0392b,#922b21)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdReceipt size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>PO Generator</h1>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Partial Invoice Against PO with Stock Reconciliation</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {MODULES.slice(0, 3).map(m => (
            <button key={m.label} onClick={() => navigate(m.path)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: m.bg, color: m.color, border: `1px solid ${m.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <m.icon size={14} /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row with Sparklines ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.color, lineHeight: 1 }}>
                {loading ? '—' : k.value}
              </div>
              {k.sparkKey && !loading && (
                <Sparkline
                  data={trend.map(d => k.isValue ? (d.value / 1000) : (d[k.sparkKey] || 0))}
                  color={k.color}
                  width={80}
                  height={36}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Bar Chart — Daily Activity */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Daily Activity — Last 7 Days</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>POs created vs Invoices generated per day</div>
          </div>
          {loading ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : (
            <BarChart
              data={trend}
              keys={['pos', 'invoices']}
              colors={['#1d4ed8', '#16a34a']}
              labels={['POs', 'Invoices']}
              height={180}
            />
          )}
        </div>

        {/* Bar Chart — Invoice Types */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>Invoice Breakdown — Last 7 Days</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Partial vs Full invoices per day</div>
          </div>
          {loading ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : (
            <BarChart
              data={trend}
              keys={['partial', 'full']}
              colors={['#f59e0b', '#0891b2']}
              labels={['Partial', 'Full']}
              height={180}
            />
          )}
        </div>
      </div>

      {/* ── Bottom Row: Donut + Value Trend + Quick Nav ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Donut — Invoice Status */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 12, alignSelf: 'flex-start' }}>Invoice Status</div>
          {loading ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : (
            <>
              <DonutChart segments={donutSegments} size={130} />
              <div style={{ marginTop: 12, width: '100%' }}>
                {donutSegments.map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Value Trend */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>Invoice Value Trend</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Daily invoice value (₹) — last 7 days</div>
          </div>
          {loading ? (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
          ) : (
            <BarChart
              data={trend.map(d => ({ ...d, valueK: Math.round(d.value / 1000) }))}
              keys={['valueK']}
              colors={['#c0392b']}
              labels={['Value (₹K)']}
              height={150}
            />
          )}
        </div>

      </div>

    </div>
  );
}
