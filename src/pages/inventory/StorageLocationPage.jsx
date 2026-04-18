import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const zones = [
  {
    id: 'Z-A', name: 'Zone A — Raw Materials', color: '#3b82f6',
    racks: [
      { id: 'R-A1', name: 'Rack A1', shelves: [
        { id: 'S-A1-1', bins: ['BIN-A1-1-01', 'BIN-A1-1-02', 'BIN-A1-1-03'], sku: 'SKU-1042', qty: 12 },
        { id: 'S-A1-2', bins: ['BIN-A1-2-01', 'BIN-A1-2-02'], sku: 'SKU-2187', qty: 8 },
      ]},
      { id: 'R-A2', name: 'Rack A2', shelves: [
        { id: 'S-A2-1', bins: ['BIN-A2-1-01', 'BIN-A2-1-02', 'BIN-A2-1-03'], sku: 'SKU-0934', qty: 5 },
      ]},
    ],
  },
  {
    id: 'Z-B', name: 'Zone B — Finished Goods', color: '#10b981',
    racks: [
      { id: 'R-B1', name: 'Rack B1', shelves: [
        { id: 'S-B1-1', bins: ['BIN-B1-1-01', 'BIN-B1-1-02'], sku: 'SKU-3301', qty: 340 },
        { id: 'S-B1-2', bins: ['BIN-B1-2-01'], sku: 'SKU-4412', qty: 220 },
      ]},
    ],
  },
  {
    id: 'Z-C', name: 'Zone C — Defective / QC Hold', color: '#ef4444',
    racks: [
      { id: 'R-C1', name: 'Rack C1', shelves: [
        { id: 'S-C1-1', bins: ['BIN-C1-1-01'], sku: 'SKU-6634', qty: 0 },
      ]},
    ],
  },
];

const pickingSeq = [
  { step: 1, zone: 'Z-A', rack: 'R-A1', shelf: 'S-A1-1', bin: 'BIN-A1-1-01', sku: 'SKU-1042', qty: 5 },
  { step: 2, zone: 'Z-B', rack: 'R-B1', shelf: 'S-B1-1', bin: 'BIN-B1-1-01', sku: 'SKU-3301', qty: 20 },
  { step: 3, zone: 'Z-B', rack: 'R-B1', shelf: 'S-B1-2', bin: 'BIN-B1-2-01', sku: 'SKU-4412', qty: 10 },
];

export default function StorageLocationPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedZone, setSelectedZone] = useState(zones[0]);
  const [selectedRack, setSelectedRack] = useState(zones[0].racks[0]);
  const [showModal, setShowModal] = useState(false);

  const tabs = ['Warehouse Map', 'Picking Sequence', 'Location Config'];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Storage Location Mapping</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Storage Locations</span>
          </div>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
          + Add Location
        </button>
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer flex-shrink-0 bg-transparent font-[inherit] ${activeTab === i ? 'text-red-700 border-red-600' : 'text-gray-400 border-transparent hover:text-red-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab 0: Warehouse Map */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Zone selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Zones</div>
            {zones.map((z, i) => (
              <div key={i} onClick={() => { setSelectedZone(z); setSelectedRack(z.racks[0]); }}
                className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selectedZone?.id === z.id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: z.color }} />
                  <span className="font-semibold text-sm">{z.name}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{z.racks.length} racks</div>
              </div>
            ))}
          </div>

          {/* Rack selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Racks — {selectedZone?.name}</div>
            {selectedZone?.racks.map((r, i) => (
              <div key={i} onClick={() => setSelectedRack(r)}
                className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selectedRack?.id === r.id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
                <div className="font-semibold text-sm">{r.name}</div>
                <div className="text-xs text-gray-400 mt-1">{r.shelves.length} shelves</div>
              </div>
            ))}
          </div>

          {/* Shelf & Bin detail */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3">Shelves & Bins — {selectedRack?.name}</div>
            {selectedRack?.shelves.map((s, i) => (
              <div key={i} className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-semibold text-sm mb-2">{s.id}</div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {s.bins.map((b, j) => (
                    <span key={j} className="text-[10px] font-mono px-2 py-0.5 bg-white border border-gray-200 rounded-md text-gray-600">{b}</span>
                  ))}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SKU: <span className="font-semibold text-red-700">{s.sku}</span></span>
                  <span className={`font-bold ${s.qty < 10 ? 'text-red-500' : 'text-green-600'}`}>{s.qty} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 1: Picking Sequence */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Picking & Sorting Sequence</div>
              <div className="text-xs text-gray-400 mt-0.5">Optimized pick path for current order</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Optimize Route</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>{['Step', 'Zone', 'Rack', 'Shelf', 'Bin', 'SKU', 'Qty to Pick', 'Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {pickingSeq.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">{row.step}</span>
                    </td>
                    <td className="px-4 py-3 align-middle font-semibold text-blue-600">{row.zone}</td>
                    <td className="px-4 py-3 align-middle">{row.rack}</td>
                    <td className="px-4 py-3 align-middle">{row.shelf}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px]">{row.bin}</td>
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{row.sku}</td>
                    <td className="px-4 py-3 align-middle font-bold">{row.qty}</td>
                    <td className="px-4 py-3 align-middle">
                      <button className="px-2 py-1 text-[11px] rounded bg-green-100 text-green-800 font-semibold border-0 cursor-pointer font-[inherit]">✓ Picked</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Location Config */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Add New Location</div>
            <div className="flex flex-col gap-3">
              {[['Zone', ['Zone A', 'Zone B', 'Zone C']], ['Rack', ['R-A1', 'R-A2', 'R-B1', 'R-C1']]].map(([label, opts]) => (
                <div key={label} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">{label}</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]">
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Shelf ID</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. S-A1-3" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Number of Bins</label>
                <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600">Assign SKU</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="SKU-XXXX" />
              </div>
              <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
                Save Location
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Zone Summary</div>
            {zones.map((z, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: z.color }} />
                  <span className="font-semibold text-sm">{z.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{z.racks.length} racks</div>
                  <div className="text-xs text-gray-400">{z.racks.reduce((s, r) => s + r.shelves.length, 0)} shelves</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Storage Location"
        footer={<>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Save</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Zone</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Zone ID" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Rack</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Rack ID" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Shelf</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Shelf ID" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Bin Count</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0" /></div>
        </div>
      </Modal>
    </div>
  );
}
