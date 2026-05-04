import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import BarChart from '../../components/charts/BarChart';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';

const brands = ['Tata Motors', 'Mahindra', 'Bajaj Auto'];

const bomTrees = {
  'BOM-TM-001': [
    { level: 0, item: 'Engine Seal Kit',       qty: 1,  unit: 'Set',  type: 'Finished' },
    { level: 1, item: '├─ Front Crankshaft Seal', qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '├─ Rear Crankshaft Seal',  qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '├─ Valve Stem Seal Set',   qty: 8, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '├─ Oil Pan Gasket',         qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '├─ Head Gasket',            qty: 1, unit: 'Nos', type: 'Sub-Assembly' },
    { level: 2, item: '│  ├─ MLS Layer Sheet',     qty: 3, unit: 'Nos', type: 'Raw' },
    { level: 2, item: '│  └─ Fire Ring',           qty: 4, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '├─ Timing Cover Seal',      qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '└─ O-Ring Kit',             qty: 1, unit: 'Set', type: 'Raw' },
  ],
  'BOM-TM-002': [
    { level: 0, item: 'Gearbox Gasket Set',     qty: 1, unit: 'Set',  type: 'Finished' },
    { level: 1, item: '├─ Input Shaft Seal',    qty: 1, unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '├─ Output Shaft Seal',   qty: 1, unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '├─ Gearbox Cover Gasket',qty: 1, unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '└─ Drain Plug Washer',   qty: 2, unit: 'Nos',  type: 'Raw' },
  ],
  'BOM-MH-001': [
    { level: 0, item: 'Clutch Assembly',          qty: 1,  unit: 'Set',  type: 'Finished' },
    { level: 1, item: '├─ Clutch Plate',          qty: 1,  unit: 'Nos',  type: 'Sub-Assembly' },
    { level: 2, item: '│  ├─ Friction Disc',      qty: 1,  unit: 'Nos',  type: 'Raw' },
    { level: 2, item: '│  └─ Steel Plate',        qty: 1,  unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '├─ Pressure Plate',        qty: 1,  unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '├─ Release Bearing',       qty: 1,  unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '├─ Clutch Spring Set',     qty: 6,  unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '└─ Pilot Bearing',         qty: 1,  unit: 'Nos',  type: 'Raw' },
  ],
  'BOM-BJ-001': [
    { level: 0, item: 'Piston Kit 2-Wheeler',   qty: 1, unit: 'Set',  type: 'Finished' },
    { level: 1, item: '├─ Piston',              qty: 1, unit: 'Nos',  type: 'Raw' },
    { level: 1, item: '├─ Piston Ring Set',     qty: 1, unit: 'Set',  type: 'Sub-Assembly' },
    { level: 2, item: '│  ├─ Top Compression Ring', qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 2, item: '│  ├─ 2nd Compression Ring', qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 2, item: '│  └─ Oil Control Ring',     qty: 1, unit: 'Nos', type: 'Raw' },
    { level: 1, item: '└─ Gudgeon Pin',         qty: 1, unit: 'Nos',  type: 'Raw' },
  ],
};

const brandData = {
  'Tata Motors': {
    color: '#c0392b',
    bom: [
      { id: 'BOM-TM-001', product: 'Engine Seal Kit',    components: 12, status: 'Active' },
      { id: 'BOM-TM-002', product: 'Gearbox Gasket Set', components: 8,  status: 'Active' },
    ],
    production: [
      { wo: 'WO-TM-041', product: 'Engine Seal Kit',    qty: 500, produced: 480, status: 'Completed'   },
      { wo: 'WO-TM-042', product: 'Gearbox Gasket Set', qty: 300, produced: 210, status: 'In-Progress' },
    ],
    billing: 'Per Unit', monthlyTarget: 800, achieved: 690,
    chartData: [{ label: 'Jan', value: 620 }, { label: 'Feb', value: 680 }, { label: 'Mar', value: 710 }, { label: 'Apr', value: 690 }],
  },
  'Mahindra': {
    color: '#8e44ad',
    bom: [{ id: 'BOM-MH-001', product: 'Clutch Assembly', components: 18, status: 'Active' }],
    production: [{ wo: 'WO-MH-021', product: 'Clutch Assembly', qty: 200, produced: 200, status: 'Completed' }],
    billing: 'Lump Sum', monthlyTarget: 200, achieved: 200,
    chartData: [{ label: 'Jan', value: 180 }, { label: 'Feb', value: 195 }, { label: 'Mar', value: 200 }, { label: 'Apr', value: 200 }],
  },
  'Bajaj Auto': {
    color: '#27ae60',
    bom: [{ id: 'BOM-BJ-001', product: 'Piston Kit 2-Wheeler', components: 6, status: 'Active' }],
    production: [{ wo: 'WO-BJ-031', product: 'Piston Kit 2-Wheeler', qty: 1000, produced: 850, status: 'In-Progress' }],
    billing: 'Per Unit', monthlyTarget: 1000, achieved: 850,
    chartData: [{ label: 'Jan', value: 920 }, { label: 'Feb', value: 980 }, { label: 'Mar', value: 1000 }, { label: 'Apr', value: 850 }],
  },
};

const innerTabs = ['BOM', 'Production', 'Billing'];

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const btnP = 'inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]';
const btnO = 'inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]';

export default function OEMPage() {
  const [activeBrand, setActiveBrand] = useState('Tata Motors');
  const [innerTab, setInnerTab]       = useState('BOM');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showBOMModal, setShowBOMModal]     = useState(false);
  const [selectedBOM, setSelectedBOM]       = useState(null);
  const [showWOModal, setShowWOModal]       = useState(false);

  const data = brandData[activeBrand];

  const kpis = [
    { label: 'Monthly Target',  value: data.monthlyTarget.toLocaleString() },
    { label: 'Achieved',        value: data.achieved.toLocaleString() },
    { label: 'Achievement %',   value: `${Math.round((data.achieved / data.monthlyTarget) * 100)}%` },
    { label: 'Billing Type',    value: data.billing },
  ];

  const handleViewBOM = (bom) => {
    setSelectedBOM(bom);
    setShowBOMModal(true);
  };

  return (
    <div>
      {/* ── Action Bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={() => setShowBrandModal(true)} style={{
          display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
          background:'linear-gradient(135deg,#ef4444,#b91c1c)', color:'#fff', border:'none',
          cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          boxShadow:'0 3px 10px rgba(185,28,28,0.3)',
        }}>+ Add OEM Brand</button>
        {innerTab === 'BOM' && (
          <button onClick={() => toast('BOM form coming soon')} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b',
            cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>+ New BOM</button>
        )}
        {innerTab === 'Production' && (
          <button onClick={() => setShowWOModal(true)} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b',
            cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>+ New Work Order</button>
        )}
        {innerTab === 'Billing' && (
          <button onClick={() => toast('Invoice generated')} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10,
            background:'transparent', color:'#c0392b', border:'1.5px solid #c0392b',
            cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit',
          }}>Generate Invoice</button>
        )}
      </div>

      {/* ── Brand Tabs ── */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        {brands.map(b => (
          <button key={b} onClick={() => setActiveBrand(b)}
            className="px-6 py-2.5 rounded-xl border-2 font-bold text-sm cursor-pointer transition-all font-[inherit]"
            style={{
              borderColor: activeBrand === b ? brandData[b].color : '#e2e8f0',
              background:  activeBrand === b ? brandData[b].color : '#fff',
              color:       activeBrand === b ? '#fff' : '#1c2833',
            }}>
            {b}
          </button>
        ))}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: data.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Inner Tab Bar ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'#f8fafc', borderRadius:12, padding:4, width:'fit-content' }}>
        {innerTabs.map(t => (
          <button key={t} onClick={() => setInnerTab(t)}
            style={{
              padding:'7px 20px', borderRadius:9, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all 0.15s',
              background: innerTab === t ? '#fff' : 'transparent',
              color:      innerTab === t ? data.color : '#64748b',
              boxShadow:  innerTab === t ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── BOM Tab ── */}
      {innerTab === 'BOM' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Bill of Materials — {activeBrand}</div>
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
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{b.id}</td>
                    <td className="px-4 py-3 align-middle font-semibold text-gray-800">{b.product}</td>
                    <td className="px-4 py-3 align-middle text-gray-800">{b.components}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3 align-middle">
                      <button
                        onClick={() => handleViewBOM(b)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
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

      {/* ── Production Tab ── */}
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
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{p.wo}</td>
                    <td className="px-4 py-3 align-middle font-semibold text-gray-800">{p.product}</td>
                    <td className="px-4 py-3 align-middle text-gray-800">{p.qty}</td>
                    <td className="px-4 py-3 align-middle font-bold text-gray-800">{p.produced}</td>
                    <td className="px-4 py-3 align-middle min-w-[140px]">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width:`${(p.produced/p.qty)*100}%`, background: data.color }} />
                      </div>
                      <span className="text-[11px] text-gray-500">{Math.round((p.produced/p.qty)*100)}%</span>
                    </td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Billing Tab ── */}
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
            <button onClick={() => toast('Invoice generated')}
              className="inline-flex items-center justify-center gap-1.5 w-full mt-4 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
              Generate Invoice
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          BOM Tree Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        open={showBOMModal}
        onClose={() => setShowBOMModal(false)}
        title={selectedBOM ? `BOM — ${selectedBOM.product}` : 'BOM Details'}
        footer={
          <button className={btnO} onClick={() => setShowBOMModal(false)}>Close</button>
        }
      >
        {selectedBOM && (
          <div>
            {/* Header info */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[['BOM ID', selectedBOM.id], ['Components', selectedBOM.components], ['Status', selectedBOM.status]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-sm font-bold text-gray-800">{v}</div>
                </div>
              ))}
            </div>

            {/* BOM Tree */}
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Component Tree</div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Component', 'Qty', 'Unit', 'Type'].map(h => (
                      <th key={h} className="bg-gray-100 px-4 py-2.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(bomTrees[selectedBOM.id] || []).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2.5 align-middle">
                        <span className="font-mono text-xs" style={{
                          color: row.level === 0 ? data.color : row.level === 1 ? '#1c2833' : '#718096',
                          fontWeight: row.level === 0 ? 700 : 400,
                        }}>{row.item}</span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-xs font-bold text-gray-700">{row.qty}</td>
                      <td className="px-4 py-2.5 align-middle text-xs text-gray-500">{row.unit}</td>
                      <td className="px-4 py-2.5 align-middle">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.type === 'Finished'     ? 'bg-green-100 text-green-700' :
                          row.type === 'Sub-Assembly' ? 'bg-blue-100 text-blue-700'  :
                                                        'bg-gray-100 text-gray-600'
                        }`}>{row.type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════
          Add OEM Brand Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        open={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title="Add OEM Brand"
        footer={
          <>
            <button className={btnO} onClick={() => setShowBrandModal(false)}>Cancel</button>
            <button className={btnP} onClick={() => { setShowBrandModal(false); toast('OEM brand added'); }}>Add Brand</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Brand Name *</label><input className={inp} placeholder="e.g. Maruti Suzuki" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Brand Code *</label><input className={inp} placeholder="e.g. MS" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Billing Type *</label>
            <select className={inp}><option>Per Unit</option><option>Lump Sum</option><option>Monthly Contract</option></select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Rate per Unit (₹)</label><input type="number" className={inp} placeholder="0.00" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Monthly Target</label><input type="number" className={inp} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">GST Rate</label>
            <select className={inp}><option>18%</option><option>12%</option><option>5%</option></select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Contact Person</label><input className={inp} placeholder="Name" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Contact Email</label><input type="email" className={inp} placeholder="email@brand.com" /></div>
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-gray-600">Contract Notes</label>
          <textarea className={inp} rows={3} placeholder="Any special terms or notes..." />
        </div>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          New Work Order Modal
      ══════════════════════════════════════════════════════ */}
      <Modal
        open={showWOModal}
        onClose={() => setShowWOModal(false)}
        title={`New Work Order — ${activeBrand}`}
        footer={
          <>
            <button className={btnO} onClick={() => setShowWOModal(false)}>Cancel</button>
            <button className={btnP} onClick={() => { setShowWOModal(false); toast('Work order created'); }}>Create Work Order</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Product *</label>
            <select className={inp}>{data.bom.map(b => <option key={b.id}>{b.product}</option>)}</select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Target Quantity *</label><input type="number" className={inp} placeholder="0" /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Start Date *</label><input type="date" className={inp} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">End Date</label><input type="date" className={inp} /></div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Shift</label>
            <select className={inp}><option>Morning</option><option>General</option><option>Night</option></select>
          </div>
          <div className="flex flex-col gap-1.5"><label className="text-xs font-semibold text-gray-600">Priority</label>
            <select className={inp}><option>Normal</option><option>High</option><option>Urgent</option></select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-gray-600">Remarks</label>
          <textarea className={inp} rows={2} placeholder="Additional instructions..." />
        </div>
      </Modal>
    </div>
  );
}
