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
      {/* Action Bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={() => setShowModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)',
          color:'#fff', border:'none', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ Add OEM Brand</button>
        {innerTab === 'BOM' && <button onClick={() => setShowModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'transparent', color:'#c0392b',
          border:'1.5px solid #c0392b', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
        }}>+ New BOM</button>}
        {innerTab === 'Production' && <button onClick={() => setShowModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'transparent', color:'#c0392b',
          border:'1.5px solid #c0392b', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
        }}>+ New Work Order</button>}
        {innerTab === 'Billing' && <button onClick={() => setShowModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding:'8px 16px', borderRadius:10,
          background:'transparent', color:'#c0392b',
          border:'1.5px solid #c0392b', cursor:'pointer',
          fontSize:13, fontWeight:600, fontFamily:'inherit',
        }}>Generate Invoice</button>}
      </div>
      {/* Brand Tabs */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {brands.map(b => (
          <button
            key={b}
            onClick={() => setActiveBrand(b)}
            className="px-6 py-2.5 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all font-[inherit]"
            style={{
              borderColor: activeBrand === b ? brandData[b].color : '#e2e8f0',
              background: activeBrand === b ? brandData[b].color : '#fff',
              color: activeBrand === b ? '#fff' : '#1c2833',
            }}
          >
            {b}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: data.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {innerTab === 'BOM' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">BOM — {activeBrand}</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['BOM ID', 'Product', 'Components', 'Status', 'Actions'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.bom.map((b, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold text-red-700">{b.id}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold">{b.product}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle">{b.components}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 text-gray-800 align-middle">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
                        View BOM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {innerTab === 'Production' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Production — {activeBrand}</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['WO ID', 'Product', 'Target', 'Produced', 'Progress', 'Status'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.production.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold text-red-700">{p.wo}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold">{p.product}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle">{p.qty}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle font-bold">{p.produced}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle min-w-[120px]">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.produced / p.qty) * 100}%`, background: data.color }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{Math.round((p.produced / p.qty) * 100)}%</span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 align-middle"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {innerTab === 'Billing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Monthly Production Trend</div>
            <BarChart data={data.chartData} color={data.color} height={160} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Billing Configuration</div>
            {[['Billing Type', data.billing], ['Rate per Unit', '₹1,200'], ['GST Rate', '18%'], ['Payment Terms', 'Net 30']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 border-b border-gray-200 text-sm last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
            <button className="inline-flex items-center justify-center gap-1.5 w-full mt-4 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
              Generate Invoice
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="text-base font-black text-gray-900">Add OEM Brand</span>
              <button className="text-gray-400 text-xl leading-none px-1 bg-transparent border-0 cursor-pointer" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Brand Name *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. Maruti Suzuki" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Brand Code *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. MS" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Billing Type *</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Per Unit</option><option>Lump Sum</option><option>Monthly Contract</option></select></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Rate per Unit (₹)</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0.00" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Monthly Target</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">GST Rate</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>18%</option><option>12%</option><option>5%</option></select></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Contact Person</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Name" /></div>
                <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Contact Email</label><input type="email" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="email@brand.com" /></div>
              </div>
              <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Contract Notes</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Any special terms or notes..." /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2.5 justify-end">
              <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Add Brand</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
