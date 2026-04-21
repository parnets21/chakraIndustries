import { useState } from 'react';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DonutChart from '../../components/charts/DonutChart';
import StatusBadge from '../../components/common/StatusBadge';

const tabLabels = ['Sales Analytics', 'Profit & Loss', 'Inventory Turnover', 'Stock Summary', 'Purchase Register', 'Production Report', 'Return Reconciliation'];

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
  { label: 'Jan', value: 820000, color: '#10b981' }, { label: 'Feb', value: 1100000, color: '#10b981' },
  { label: 'Mar', value: 950000, color: '#10b981' }, { label: 'Apr', value: 1400000, color: '#10b981' },
  { label: 'May', value: 1200000, color: '#10b981' }, { label: 'Jun', value: 1600000, color: '#10b981' },
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

const salesKpis = [
  { label: 'Total Revenue', value: '₹82.4L', change: '+18.2%', up: true },
  { label: 'Total Orders', value: '284', change: '+8.1%', up: true },
  { label: 'Avg Order Value', value: '₹2.9L', change: '+9.3%', up: true },
  { label: 'Top Customer', value: 'Bajaj Auto', change: '₹41.2L', up: true },
];

const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";

export default function ReportsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const outlineBtn = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'8px 16px', borderRadius:10,
    background:'transparent', color:'#c0392b',
    border:'1.5px solid #c0392b', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
  };
  const primaryBtn = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'8px 16px', borderRadius:10,
    background:'linear-gradient(135deg,#ef4444,#b91c1c)',
    color:'#fff', border:'none', cursor:'pointer',
    fontSize:13, fontWeight:600, fontFamily:'inherit',
    boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
  };

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button style={outlineBtn}>⬇ Export PDF</button>
        <button style={primaryBtn}>⬇ Export Excel</button>
      </div>
      {activeTab === 0 && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {salesKpis.map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight">{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
                <div className={`text-xs font-semibold mt-1 ${k.up ? 'text-green-600' : 'text-red-500'}`}>{k.up ? '↑' : '↓'} {k.change}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-1">Monthly Revenue Trend</div>
              <div className="text-xs text-gray-400 mt-0.5 mb-3">FY 2024-25</div>
              <LineChart data={salesByMonth} color="#c0392b" height={180} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-1">Sales by Customer</div>
              <div className="text-xs text-gray-400 mt-0.5 mb-3">Top 5 customers</div>
              <BarChart data={salesByCustomer} height={180} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-1">Monthly Profit</div>
              <div className="text-xs text-gray-400 mt-0.5 mb-3">H1 FY 2024-25</div>
              <BarChart data={profitData} height={180} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-1">Expense Breakdown</div>
              <div className="text-xs text-gray-400 mt-0.5 mb-3">Current month</div>
              <DonutChart data={expenseBreakdown} size={140} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">P&L Summary — April 2024</div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['Category','Budget','Actual','Variance','%'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { cat: 'Revenue', budget: '₹50,00,000', actual: '₹52,00,000', var: '+₹2,00,000', pct: '+4%', pos: true },
                    { cat: 'Raw Material Cost', budget: '₹20,00,000', actual: '₹21,50,000', var: '-₹1,50,000', pct: '-7.5%', pos: false },
                    { cat: 'Labour Cost', budget: '₹8,00,000', actual: '₹7,80,000', var: '+₹20,000', pct: '+2.5%', pos: true },
                    { cat: 'Overhead', budget: '₹4,00,000', actual: '₹4,20,000', var: '-₹20,000', pct: '-5%', pos: false },
                    { cat: 'Net Profit', budget: '₹18,00,000', actual: '₹18,50,000', var: '+₹50,000', pct: '+2.8%', pos: true },
                  ].map((r, i) => (
                    <tr key={i} className={`${trCls} ${r.cat === 'Net Profit' ? 'bg-green-50' : ''}`}>
                      <td className={`${tdCls} ${r.cat === 'Net Profit' ? 'font-bold' : ''}`}>{r.cat}</td>
                      <td className={tdCls}>{r.budget}</td>
                      <td className={`${tdCls} font-semibold`}>{r.actual}</td>
                      <td className={`${tdCls} font-semibold ${r.pos ? 'text-green-600' : 'text-red-500'}`}>{r.var}</td>
                      <td className={`${tdCls} font-bold ${r.pos ? 'text-green-600' : 'text-red-500'}`}>{r.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Inventory Turnover Analysis</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['SKU','Item Name','Opening Stock','Closing Stock','Units Sold','Turnover Ratio','Category'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {turnoverData.map((t, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold text-red-700 font-mono`}>{t.sku}</td>
                    <td className={`${tdCls} font-semibold`}>{t.name}</td>
                    <td className={tdCls}>{t.openingStock}</td>
                    <td className={tdCls}>{t.closingStock}</td>
                    <td className={`${tdCls} font-bold`}>{t.sold}</td>
                    <td className={`${tdCls} font-extrabold ${t.status === 'Dead' ? 'text-red-500' : t.status === 'Fast Moving' ? 'text-green-600' : 'text-red-700'}`}>{t.turnover}</td>
                    <td className={tdCls}><StatusBadge status={t.status} type={t.status === 'Dead' ? 'danger' : t.status === 'Fast Moving' ? 'success' : 'info'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Stock Summary Report</div>
              <div className="text-xs text-gray-400 mt-0.5">Current stock position across all warehouses</div>
            </div>
            <div className="flex gap-2">
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit] w-36"><option>All Warehouses</option><option>WH-01</option><option>WH-02</option><option>WH-03</option></select>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Export PDF</button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">Export Excel</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['SKU','Item Name','Category','WH-01','WH-02','WH-03','Total Qty','Min Qty','Value (₹)','Status'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { sku: 'SKU-1042', name: 'Bearing 6205', cat: 'Bearings', wh1: 12, wh2: 0, wh3: 0, min: 50, rate: 450, status: 'Critical' },
                  { sku: 'SKU-2187', name: 'Oil Seal 35x52', cat: 'Seals', wh1: 0, wh2: 8, wh3: 0, min: 30, rate: 120, status: 'Critical' },
                  { sku: 'SKU-3301', name: 'Piston Ring 80mm', cat: 'Pistons', wh1: 120, wh2: 80, wh3: 140, min: 40, rate: 380, status: 'Active' },
                  { sku: 'SKU-4412', name: 'Crankshaft Seal', cat: 'Seals', wh1: 220, wh2: 0, wh3: 0, min: 20, rate: 210, status: 'Active' },
                  { sku: 'SKU-5523', name: 'Valve Spring Set', cat: 'Engine', wh1: 0, wh2: 180, wh3: 0, min: 30, rate: 650, status: 'Active' },
                  { sku: 'SKU-6634', name: 'Timing Chain Kit', cat: 'Engine', wh1: 0, wh2: 0, wh3: 0, min: 10, rate: 1200, status: 'Dead' },
                ].map((row, i) => {
                  const total = row.wh1 + row.wh2 + row.wh3;
                  return (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-semibold text-red-700 font-mono`}>{row.sku}</td>
                      <td className={`${tdCls} font-semibold`}>{row.name}</td>
                      <td className={tdCls}>{row.cat}</td>
                      <td className={`${tdCls} text-center`}>{row.wh1}</td>
                      <td className={`${tdCls} text-center`}>{row.wh2}</td>
                      <td className={`${tdCls} text-center`}>{row.wh3}</td>
                      <td className={`${tdCls} font-extrabold text-center ${total < row.min ? 'text-red-500' : 'text-green-600'}`}>{total}</td>
                      <td className={`${tdCls} text-center text-gray-400`}>{row.min}</td>
                      <td className={`${tdCls} font-bold`}>₹{(total * row.rate).toLocaleString()}</td>
                      <td className={tdCls}><StatusBadge status={row.status} type={row.status === 'Critical' ? 'danger' : row.status === 'Dead' ? 'gray' : 'success'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Purchase Register</div>
              <div className="text-xs text-gray-400 mt-0.5">All purchase orders — April 2024</div>
            </div>
            <div className="flex gap-2">
              <input type="month" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit] w-36" defaultValue="2024-04" />
              <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Export PDF</button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">Export Excel</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['PO No.','Date','Vendor','Items','Taxable Amt','CGST','SGST','IGST','Total','GRN Status'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { po: 'PO-2024-089', date: '14 Apr', vendor: 'Shree Metals', items: 8, taxable: '₹4,20,000', cgst: '₹37,800', sgst: '₹37,800', igst: '—', total: '₹4,95,600', grn: 'Pending' },
                  { po: 'PO-2024-088', date: '13 Apr', vendor: 'Global Bearings', items: 4, taxable: '₹1,80,000', cgst: '₹16,200', sgst: '₹16,200', igst: '—', total: '₹2,12,400', grn: 'Completed' },
                  { po: 'PO-2024-087', date: '12 Apr', vendor: 'Precision Parts', items: 12, taxable: '₹4,80,000', cgst: '₹43,200', sgst: '₹43,200', igst: '—', total: '₹5,66,400', grn: 'Completed' },
                  { po: 'PO-2024-086', date: '11 Apr', vendor: 'National Seals', items: 6, taxable: '₹1,20,000', cgst: '₹10,800', sgst: '₹10,800', igst: '—', total: '₹1,41,600', grn: 'Partial' },
                ].map((row, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold text-red-700`}>{row.po}</td>
                    <td className={tdCls}>{row.date}</td>
                    <td className={`${tdCls} font-semibold`}>{row.vendor}</td>
                    <td className={`${tdCls} text-center`}>{row.items}</td>
                    <td className={tdCls}>{row.taxable}</td>
                    <td className={`${tdCls} text-gray-400`}>{row.cgst}</td>
                    <td className={`${tdCls} text-gray-400`}>{row.sgst}</td>
                    <td className={`${tdCls} text-gray-400`}>{row.igst}</td>
                    <td className={`${tdCls} font-extrabold text-red-700`}>{row.total}</td>
                    <td className={tdCls}><StatusBadge status={row.grn} type={row.grn === 'Completed' ? 'success' : row.grn === 'Partial' ? 'warning' : 'info'} /></td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="px-4 py-3 text-right text-gray-400">Total</td>
                  <td className={tdCls}>₹12,00,000</td>
                  <td className={tdCls}>₹1,08,000</td>
                  <td className={tdCls}>₹1,08,000</td>
                  <td className={tdCls}>—</td>
                  <td className={`${tdCls} text-red-700`}>₹14,16,000</td>
                  <td className={tdCls}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 5 && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total Produced', value: '1,125', color: '#27ae60' },
              { label: 'Total Rejected', value: '55', color: '#ef4444' },
              { label: 'Rejection Rate', value: '4.7%', color: '#f59e0b' },
              { label: 'Efficiency', value: '94%', color: '#8b5cf6' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-gray-800">Production Report — April 2024</div>
                <div className="text-xs text-gray-400 mt-0.5">Work order wise production summary</div>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Export PDF</button>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">Export Excel</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['WO No.','Product','BOM Ref','Target','Produced','Rejected','Wastage (kg)','Efficiency','Start','End','Status'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { wo: 'WO-0891', product: 'Engine Assembly A', bom: 'BOM-001', target: 50, produced: 50, rejected: 0, wastage: 2.1, start: '10 Apr', end: '14 Apr', status: 'Completed' },
                    { wo: 'WO-0892', product: 'Gearbox Unit B', bom: 'BOM-002', target: 30, produced: 18, rejected: 2, wastage: 1.4, start: '12 Apr', end: '16 Apr', status: 'In-Progress' },
                    { wo: 'WO-0893', product: 'Clutch Assembly C', bom: 'BOM-003', target: 80, produced: 0, rejected: 0, wastage: 0, start: '15 Apr', end: '18 Apr', status: 'Pending' },
                  ].map((row, i) => {
                    const eff = row.target > 0 ? Math.round((row.produced / row.target) * 100) : 0;
                    return (
                      <tr key={i} className={trCls}>
                        <td className={`${tdCls} font-semibold text-red-700`}>{row.wo}</td>
                        <td className={`${tdCls} font-semibold`}>{row.product}</td>
                        <td className={`${tdCls} font-mono text-xs`}>{row.bom}</td>
                        <td className={`${tdCls} text-center`}>{row.target}</td>
                        <td className={`${tdCls} text-center font-bold text-green-600`}>{row.produced}</td>
                        <td className={`${tdCls} text-center font-bold ${row.rejected > 0 ? 'text-red-500' : 'text-gray-400'}`}>{row.rejected}</td>
                        <td className={`${tdCls} text-center`}>{row.wastage}</td>
                        <td className={`${tdCls} font-bold ${eff >= 90 ? 'text-green-600' : eff >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{eff}%</td>
                        <td className={tdCls}>{row.start}</td>
                        <td className={tdCls}>{row.end}</td>
                        <td className={tdCls}><StatusBadge status={row.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 6 && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total Returns', value: 4, color: '#1c2833' },
              { label: 'Total Return Value', value: '₹1,66,000', color: '#ef4444' },
              { label: 'Credit Notes Issued', value: 2, color: '#27ae60' },
              { label: 'Unrecovered Loss', value: '₹16,000', color: '#f59e0b' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-gray-800">Return Reconciliation Report</div>
                <div className="text-xs text-gray-400 mt-0.5">Return vs credit note matching summary</div>
              </div>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Export PDF</button>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">Export Excel</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead><tr>{['Return ID','Docket','Customer','Return Type','Return Value','Debit Note','Credit Note','Difference','Loss','Reconciled'].map(h => <th key={h} className={thCls}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    { id: 'RET-001', docket: 'DKT-2024-041', customer: 'Bajaj Auto', type: 'Defective', value: '₹48,000', dn: '—', cn: '—', diff: '—', loss: '—', rec: 'No' },
                    { id: 'RET-002', docket: 'DKT-2024-038', customer: 'Hero MotoCorp', type: 'Wrong Item', value: '₹22,000', dn: 'DN-2024-012', cn: 'CN-2024-012', diff: '₹0', loss: '₹0', rec: 'Yes' },
                    { id: 'RET-003', docket: 'DKT-2024-031', customer: 'TVS Motor', type: 'Defective', value: '₹84,000', dn: 'DN-2024-009', cn: 'CN-2024-009', diff: '₹4,000', loss: '₹4,000', rec: 'Partial' },
                    { id: 'RET-004', docket: 'DKT-2024-025', customer: 'Tata Motors', type: 'Excess', value: '₹12,000', dn: '—', cn: '—', diff: '—', loss: '₹12,000', rec: 'No' },
                  ].map((row, i) => (
                    <tr key={i} className={trCls}>
                      <td className={`${tdCls} font-semibold text-red-700`}>{row.id}</td>
                      <td className={`${tdCls} font-mono text-xs`}>{row.docket}</td>
                      <td className={`${tdCls} font-semibold`}>{row.customer}</td>
                      <td className={tdCls}>{row.type}</td>
                      <td className={`${tdCls} font-bold`}>{row.value}</td>
                      <td className={`${tdCls} font-mono text-xs text-red-500`}>{row.dn}</td>
                      <td className={`${tdCls} font-mono text-xs text-green-600`}>{row.cn}</td>
                      <td className={`${tdCls} font-bold ${row.diff === '₹0' ? 'text-green-600' : row.diff === '—' ? 'text-gray-400' : 'text-red-500'}`}>{row.diff}</td>
                      <td className={`${tdCls} font-bold ${row.loss === '₹0' || row.loss === '—' ? 'text-gray-400' : 'text-red-500'}`}>{row.loss}</td>
                      <td className={tdCls}><StatusBadge status={row.rec} type={row.rec === 'Yes' ? 'success' : row.rec === 'Partial' ? 'warning' : 'danger'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
