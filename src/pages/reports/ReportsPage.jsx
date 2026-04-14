import React, { useState } from 'react';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';

const tabs = ['Sales Analytics', 'Profit & Loss', 'Inventory Turnover'];

const salesByMonth = [
  { label: 'Jan', value: 3200000 }, { label: 'Feb', value: 4100000 }, { label: 'Mar', value: 3800000 },
  { label: 'Apr', value: 5200000 }, { label: 'May', value: 4900000 }, { label: 'Jun', value: 6100000 },
  { label: 'Jul', value: 5800000 }, { label: 'Aug', value: 7200000 }, { label: 'Sep', value: 6800000 },
  { label: 'Oct', value: 7900000 }, { label: 'Nov', value: 8500000 }, { label: 'Dec', value: 9200000 },
];

const salesByCustomer = [
  { label: 'Tata', value: 2840000, color: '#1a3c6e' },
  { label: 'Mahindra', value: 1560000, color: '#c41e3a' },
  { label: 'Bajaj', value: 4120000, color: '#1a6e3c' },
  { label: 'Hero', value: 980000, color: '#f59e0b' },
  { label: 'TVS', value: 3240000, color: '#8b5cf6' },
];

const profitData = [
  { label: 'Jan', value: 820000, color: '#10b981' },
  { label: 'Feb', value: 1100000, color: '#10b981' },
  { label: 'Mar', value: 950000, color: '#10b981' },
  { label: 'Apr', value: 1400000, color: '#10b981' },
  { label: 'May', value: 1200000, color: '#10b981' },
  { label: 'Jun', value: 1600000, color: '#10b981' },
];

const expenseBreakdown = [
  { label: 'Raw Material', value: 4200000, color: '#3b82f6' },
  { label: 'Labour', value: 1800000, color: '#f59e0b' },
  { label: 'Overhead', value: 900000, color: '#8b5cf6' },
  { label: 'Logistics', value: 420000, color: '#ef4444' },
];

const turnoverData = [
  { sku: 'SKU-3301', name: 'Piston Ring 80mm', openingStock: 200, closingStock: 340, sold: 460, turnover: '2.3x', status: 'Good' },
  { sku: 'SKU-4412', name: 'Crankshaft Seal', openingStock: 150, closingStock: 220, sold: 380, turnover: '2.5x', status: 'Good' },
  { sku: 'SKU-1042', name: 'Bearing 6205', openingStock: 80, closingStock: 12, sold: 518, turnover: '6.5x', status: 'Fast Moving' },
  { sku: 'SKU-6634', name: 'Timing Chain Kit', openingStock: 20, closingStock: 0, sold: 0, turnover: '0x', status: 'Dead' },
  { sku: 'SKU-5523', name: 'Valve Spring Set', openingStock: 100, closingStock: 180, sold: 220, turnover: '2.2x', status: 'Good' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">BI Reports</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Reports</span></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-select" style={{ width: 140 }}><option>FY 2024-25</option><option>FY 2023-24</option></select>
          <button className="btn btn-outline">Export PDF</button>
          <button className="btn btn-primary">Export Excel</button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t, i) => <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      {/* Sales Analytics */}
      {activeTab === 0 && (
        <div>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Total Revenue', value: '₹82.4L', change: '+18.2%', up: true },
              { label: 'Total Orders', value: '284', change: '+8.1%', up: true },
              { label: 'Avg Order Value', value: '₹2.9L', change: '+9.3%', up: true },
              { label: 'Top Customer', value: 'Bajaj Auto', change: '₹41.2L', up: true },
            ].map((k, i) => (
              <div key={i} className="kpi-card">
                <div className="kpi-value" style={{ fontSize: 20 }}>{k.value}</div>
                <div className="kpi-label">{k.label}</div>
                <div className={`kpi-change ${k.up ? 'up' : 'down'}`}>{k.up ? '↑' : '↓'} {k.change}</div>
              </div>
            ))}
          </div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Monthly Revenue Trend</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>FY 2024-25</div>
              <LineChart data={salesByMonth} color="var(--primary)" height={180} />
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Sales by Customer</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>Top 5 customers</div>
              <BarChart data={salesByCustomer} height={180} />
            </div>
          </div>
        </div>
      )}

      {/* Profit & Loss */}
      {activeTab === 1 && (
        <div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Monthly Profit</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>H1 FY 2024-25</div>
              <BarChart data={profitData} height={180} />
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Expense Breakdown</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 12 }}>Current month</div>
              <DonutChart data={expenseBreakdown} size={140} />
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14 }}>P&L Summary — April 2024</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Category</th><th>Budget</th><th>Actual</th><th>Variance</th><th>%</th></tr></thead>
                <tbody>
                  {[
                    { cat: 'Revenue', budget: '₹50,00,000', actual: '₹52,00,000', var: '+₹2,00,000', pct: '+4%', pos: true },
                    { cat: 'Raw Material Cost', budget: '₹20,00,000', actual: '₹21,50,000', var: '-₹1,50,000', pct: '-7.5%', pos: false },
                    { cat: 'Labour Cost', budget: '₹8,00,000', actual: '₹7,80,000', var: '+₹20,000', pct: '+2.5%', pos: true },
                    { cat: 'Overhead', budget: '₹4,00,000', actual: '₹4,20,000', var: '-₹20,000', pct: '-5%', pos: false },
                    { cat: 'Net Profit', budget: '₹18,00,000', actual: '₹18,50,000', var: '+₹50,000', pct: '+2.8%', pos: true },
                  ].map((r, i) => (
                    <tr key={i} style={{ background: r.cat === 'Net Profit' ? '#f0fdf4' : '' }}>
                      <td style={{ fontWeight: r.cat === 'Net Profit' ? 700 : 400 }}>{r.cat}</td>
                      <td>{r.budget}</td>
                      <td style={{ fontWeight: 600 }}>{r.actual}</td>
                      <td style={{ color: r.pos ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{r.var}</td>
                      <td style={{ color: r.pos ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{r.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Turnover */}
      {activeTab === 2 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 14 }}>Inventory Turnover Analysis</div>
          <div className="table-container">
            <table>
              <thead><tr><th>SKU</th><th>Item Name</th><th>Opening Stock</th><th>Closing Stock</th><th>Units Sold</th><th>Turnover Ratio</th><th>Category</th></tr></thead>
              <tbody>
                {turnoverData.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{t.sku}</td>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td>{t.openingStock}</td>
                    <td>{t.closingStock}</td>
                    <td style={{ fontWeight: 700 }}>{t.sold}</td>
                    <td style={{ fontWeight: 800, color: t.status === 'Dead' ? 'var(--danger)' : t.status === 'Fast Moving' ? 'var(--success)' : 'var(--primary)' }}>{t.turnover}</td>
                    <td>
                      <span className={`status-badge ${t.status === 'Dead' ? 'danger' : t.status === 'Fast Moving' ? 'success' : 'info'}`}>{t.status}</span>
                    </td>
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
