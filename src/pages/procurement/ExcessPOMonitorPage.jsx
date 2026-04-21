import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';

const poLoadData = [
  { supplier: 'Shree Metals',      sku: 'SKU-3301', item: 'Piston Ring 80mm',  planned: 400, poQty: 620, excess: 220, forecastCover: 45, status: 'Excess' },
  { supplier: 'Global Bearings',   sku: 'SKU-1042', item: 'Bearing 6205',       planned: 500, poQty: 500, excess: 0,   forecastCover: 33, status: 'OK' },
  { supplier: 'National Seals',    sku: 'SKU-4412', item: 'Crankshaft Seal',    planned: 250, poQty: 410, excess: 160, forecastCover: 62, status: 'Excess' },
  { supplier: 'Apex Gaskets',      sku: 'SKU-0934', item: 'Gasket Set A',       planned: 200, poQty: 200, excess: 0,   forecastCover: 28, status: 'OK' },
  { supplier: 'Precision Parts',   sku: 'SKU-5523', item: 'Valve Spring Set',   planned: 200, poQty: 350, excess: 150, forecastCover: 58, status: 'Excess' },
  { supplier: 'Prime Seals',       sku: 'SKU-2187', item: 'Oil Seal 35x52',     planned: 300, poQty: 280, excess: 0,   forecastCover: 30, status: 'Under' },
];

const supplierSummary = [
  { supplier: 'Shree Metals',    totalPO: '₹8,40,000', planned: '₹5,20,000', excess: '₹3,20,000', excessPct: '38%', status: 'Excess' },
  { supplier: 'National Seals',  totalPO: '₹6,15,000', planned: '₹3,75,000', excess: '₹2,40,000', excessPct: '39%', status: 'Excess' },
  { supplier: 'Precision Parts', totalPO: '₹5,25,000', planned: '₹3,00,000', excess: '₹2,25,000', excessPct: '43%', status: 'Excess' },
  { supplier: 'Global Bearings', totalPO: '₹4,50,000', planned: '₹4,50,000', excess: '₹0',        excessPct: '0%',  status: 'OK' },
  { supplier: 'Apex Gaskets',    totalPO: '₹2,80,000', planned: '₹2,80,000', excess: '₹0',        excessPct: '0%',  status: 'OK' },
  { supplier: 'Prime Seals',     totalPO: '₹1,96,000', planned: '₹2,10,000', excess: '₹0',        excessPct: '0%',  status: 'Under' },
];

export default function ExcessPOMonitorPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const tabs = ['PO Load Overview', 'Supplier-wise Report', 'Threshold Config'];

  const excessCount = poLoadData.filter(r => r.status === 'Excess').length;
  const totalExcessVal = '₹7,85,000';

  return (
    <div>
      {/* Warning banner */}
      {excessCount > 0 && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold text-red-800 text-sm">{excessCount} SKUs have PO quantities exceeding planned/forecasted limits</div>
            <div className="text-xs text-red-600 mt-0.5">Total excess value: {totalExcessVal}. Review and adjust POs before approval.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total SKUs Monitored', value: poLoadData.length, color: '#1c2833' },
          { label: 'Excess Load SKUs', value: excessCount, color: '#ef4444' },
          { label: 'Under-ordered SKUs', value: poLoadData.filter(r => r.status === 'Under').length, color: '#f59e0b' },
          { label: 'Total Excess Value', value: totalExcessVal, color: '#8b5cf6' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer flex-shrink-0 bg-transparent font-[inherit] ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: PO Load Overview */}
      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-gray-800">SKU-wise PO vs Planned Quantity</div>
            <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">Export</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>{['Supplier', 'SKU', 'Item', 'Planned Qty', 'PO Qty', 'Excess Qty', 'Forecast Cover (days)', 'Status', 'Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {poLoadData.map((row, i) => (
                  <tr key={i} onClick={() => setSelected(row)}
                    className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${row.status === 'Excess' ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 align-middle font-semibold">{row.supplier}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs text-red-700">{row.sku}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{row.item}</td>
                    <td className="px-4 py-3 align-middle font-bold text-blue-600">{row.planned}</td>
                    <td className="px-4 py-3 align-middle font-bold">{row.poQty}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${row.excess > 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {row.excess > 0 ? `+${row.excess}` : '—'}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`font-bold text-sm ${row.forecastCover > 45 ? 'text-red-500' : row.forecastCover > 30 ? 'text-amber-500' : 'text-green-600'}`}>
                        {row.forecastCover}d
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <StatusBadge status={row.status} type={row.status === 'Excess' ? 'danger' : row.status === 'Under' ? 'warning' : 'success'} />
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {row.status === 'Excess' && (
                        <button className="px-2 py-1 text-[11px] rounded bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">Revise PO</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Inline bar chart for excess */}
          <div className="mt-5">
            <div className="text-sm font-bold text-gray-800 mb-3">Excess Load Visual</div>
            {poLoadData.filter(r => r.excess > 0).map((row, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">{row.item}</span>
                  <span className="text-red-500 font-bold">+{row.excess} excess ({Math.round(row.excess / row.planned * 100)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-400 rounded-l-full" style={{ width: `${(row.planned / row.poQty) * 100}%` }} />
                  <div className="h-full bg-red-400 rounded-r-full" style={{ width: `${(row.excess / row.poQty) * 100}%` }} />
                </div>
                <div className="flex gap-4 mt-1 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Planned: {row.planned}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Excess: {row.excess}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: Supplier-wise Report */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-4">Supplier-wise Excess Load Report</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>{['Supplier', 'Total PO Value', 'Planned Value', 'Excess Value', 'Excess %', 'Status', 'Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {supplierSummary.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors ${row.status === 'Excess' ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 align-middle font-bold">{row.supplier}</td>
                    <td className="px-4 py-3 align-middle font-bold">{row.totalPO}</td>
                    <td className="px-4 py-3 align-middle text-blue-600 font-semibold">{row.planned}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${row.excess === '₹0' ? 'text-green-600' : 'text-red-500'}`}>{row.excess}</td>
                    <td className={`px-4 py-3 align-middle font-bold ${parseFloat(row.excessPct) > 0 ? 'text-red-500' : 'text-green-600'}`}>{row.excessPct}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={row.status} type={row.status === 'Excess' ? 'danger' : row.status === 'Under' ? 'warning' : 'success'} /></td>
                    <td className="px-4 py-3 align-middle">
                      {row.status === 'Excess' && (
                        <button className="px-2 py-1 text-[11px] rounded bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]">Send Alert</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Threshold Config */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Excess Load Thresholds</div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Warning Threshold (%)</label>
                <input type="number" className={inp} defaultValue="10" />
                <span className="text-[10px] text-gray-400">Warn when PO qty exceeds planned by this %</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Critical Threshold (%)</label>
                <input type="number" className={inp} defaultValue="25" />
                <span className="text-[10px] text-gray-400">Block approval when PO qty exceeds planned by this %</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Max Forecast Cover (days)</label>
                <input type="number" className={inp} defaultValue="45" />
                <span className="text-[10px] text-gray-400">Flag POs that cover more than this many days of demand</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Alert Recipients</label>
                <input className={inp} defaultValue="purchase_manager, management" />
              </div>
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
                Save Thresholds
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Current Rules</div>
            {[
              { rule: 'Warn if PO > Planned + 10%', active: true },
              { rule: 'Block approval if PO > Planned + 25%', active: true },
              { rule: 'Alert if forecast cover > 45 days', active: true },
              { rule: 'Auto-email supplier on excess detection', active: false },
              { rule: 'Require manager sign-off for excess POs', active: true },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{r.rule}</span>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${r.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.active ? 'left-5' : 'left-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Set PO Load Thresholds"
        footer={<>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Save</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Warning %</label><input type="number" className={inp} defaultValue="10" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Critical %</label><input type="number" className={inp} defaultValue="25" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Max Cover Days</label><input type="number" className={inp} defaultValue="45" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Apply to Supplier</label><select className={inp}><option>All Suppliers</option><option>Shree Metals</option><option>Global Bearings</option></select></div>
        </div>
      </Modal>
    </div>
  );
}
