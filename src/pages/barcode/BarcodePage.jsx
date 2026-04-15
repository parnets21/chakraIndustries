import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';

const movementLogs = [
  { id: 'LOG-001', barcode: 'BC-SKU1042-001', item: 'Bearing 6205', action: 'Inward', location: 'WH-01 / Rack A3', operator: 'Ramesh', time: '14 Apr, 09:15 AM' },
  { id: 'LOG-002', barcode: 'BC-SKU4412-022', item: 'Crankshaft Seal', action: 'Outward', location: 'Production Line 2', operator: 'Suresh', time: '14 Apr, 10:30 AM' },
  { id: 'LOG-003', barcode: 'BC-SKU3301-045', item: 'Piston Ring 80mm', action: 'Transfer', location: 'WH-01 → WH-03', operator: 'Anil', time: '13 Apr, 03:00 PM' },
  { id: 'LOG-004', barcode: 'BC-SKU5523-012', item: 'Valve Spring Set', action: 'Inward', location: 'WH-02 / Rack B1', operator: 'Vijay', time: '13 Apr, 11:00 AM' },
];

function BarcodeDisplay({ value }) {
  return (
    <div className="flex flex-col items-center gap-2 p-5 bg-white rounded-lg border border-gray-200">
      <div className="flex gap-px h-15 items-end" style={{ height: 60 }}>
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} className="bg-blue-900 rounded-sm" style={{ width: i % 3 === 0 ? 3 : 1.5, height: i % 5 === 0 ? 60 : i % 3 === 0 ? 50 : 40 }} />
        ))}
      </div>
      <div className="font-mono text-xs tracking-widest text-gray-800">{value}</div>
    </div>
  );
}

const thCls = "bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap";
const tdCls = "px-4 py-3 text-gray-800 align-middle";
const trCls = "border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors";

export default function BarcodePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [scanInput, setScanInput] = useState('');
  const [scanned, setScanned] = useState(null);
  const [genSKU, setGenSKU] = useState('SKU-1042');

  const handleScan = () => {
    if (scanInput) {
      setScanned({ sku: scanInput, name: 'Bearing 6205', location: 'WH-01 / Rack A3', qty: 12, status: 'Active' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Barcode System</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Barcode</span>
          </div>
        </div>
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {['Generate Barcode', 'Scan & Lookup', 'Movement Logs'].map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer flex-shrink-0 bg-transparent font-[inherit] ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Generate Barcode</div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-600">Select SKU</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" value={genSKU} onChange={e => setGenSKU(e.target.value)}>
                <option>SKU-1042</option><option>SKU-2187</option><option>SKU-3301</option><option>SKU-4412</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-600">Batch Number</label>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" defaultValue="B-2024-04" />
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-600">Quantity</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" defaultValue="100" />
            </div>
            <div className="flex gap-2.5">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">Generate</button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">Print Labels</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col items-center justify-center gap-4">
            <BarcodeDisplay value={`BC-${genSKU.replace('-', '')}-B202404`} />
            <div className="text-xs text-gray-400 text-center">
              Barcode generated for <strong>{genSKU}</strong><br />Batch: B-2024-04
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Scan Barcode</div>
            <div className="flex gap-2.5 mb-5">
              <input
                className="flex-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]"
                placeholder="Scan or enter barcode..."
                value={scanInput}
                onChange={e => setScanInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
              />
              <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={handleScan}>Lookup</button>
            </div>
            <div className="text-center p-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="text-5xl mb-2">📷</div>
              <div className="text-[13px] text-gray-400">Point camera at barcode or type manually above</div>
            </div>
          </div>
          {scanned && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-green-600 mb-4">✓ Item Found</div>
              {[['SKU', scanned.sku], ['Item Name', scanned.name], ['Location', scanned.location], ['Current Qty', scanned.qty], ['Status', scanned.status]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-gray-200 text-[13px]">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-gray-800">{v}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <button className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Inward</button>
                <button className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">Outward</button>
                <button className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-800 font-semibold border-0 cursor-pointer font-[inherit]">Transfer</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Movement Logs</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Log ID','Barcode','Item','Action','Location','Operator','Time'].map(h => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movementLogs.map((l, i) => (
                  <tr key={i} className={trCls}>
                    <td className={`${tdCls} font-semibold text-red-700`}>{l.id}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{l.barcode}</td>
                    <td className={`${tdCls} font-semibold`}>{l.item}</td>
                    <td className={tdCls}><StatusBadge status={l.action} type={l.action === 'Inward' ? 'success' : l.action === 'Outward' ? 'danger' : 'info'} /></td>
                    <td className={tdCls}>{l.location}</td>
                    <td className={tdCls}>{l.operator}</td>
                    <td className={`${tdCls} text-gray-400 text-xs`}>{l.time}</td>
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
