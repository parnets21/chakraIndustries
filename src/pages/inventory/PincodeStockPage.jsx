import { useState } from 'react';

const pincodeData = [
  {
    pincode: '411001', city: 'Pune Central',
    godowns: [
      { id: 'GD-PUN-01', name: 'Pune Main Godown', locations: [
        { loc: 'Zone A / Rack 1', sku: 'SKU-1042', name: 'Bearing 6205', qty: 12 },
        { loc: 'Zone B / Rack 2', sku: 'SKU-3301', name: 'Piston Ring 80mm', qty: 340 },
      ]},
    ],
  },
  {
    pincode: '411014', city: 'Pune Sector 4',
    godowns: [
      { id: 'GD-PUN-02', name: 'WH-01 Main Warehouse', locations: [
        { loc: 'Zone A / Rack 1', sku: 'SKU-4412', name: 'Crankshaft Seal', qty: 220 },
        { loc: 'Zone C / Rack 1', sku: 'SKU-6634', name: 'Timing Chain Kit', qty: 0 },
      ]},
      { id: 'GD-PUN-03', name: 'WH-02 Secondary Store', locations: [
        { loc: 'Zone A / Rack 2', sku: 'SKU-5523', name: 'Valve Spring Set', qty: 180 },
      ]},
    ],
  },
  {
    pincode: '422001', city: 'Nashik Plant',
    godowns: [
      { id: 'GD-NSK-01', name: 'WH-03 Finished Goods', locations: [
        { loc: 'Zone B / Rack 1', sku: 'SKU-7745', name: 'Clutch Plate Set', qty: 95 },
      ]},
    ],
  },
];

export default function PincodeStockPage() {
  const [selectedPincode, setSelectedPincode] = useState(pincodeData[0]);
  const [selectedGodown, setSelectedGodown] = useState(pincodeData[0].godowns[0]);
  const [search, setSearch] = useState('');

  const filtered = pincodeData.filter(p =>
    p.pincode.includes(search) || p.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pincode list */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">Select Pincode</div>
          <input
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit] mb-3"
            placeholder="Search pincode or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {filtered.map((p, i) => (
            <div key={i} onClick={() => { setSelectedPincode(p); setSelectedGodown(p.godowns[0]); }}
              className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selectedPincode?.pincode === p.pincode ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
              <div className="font-bold text-sm text-red-700">{p.pincode}</div>
              <div className="text-xs text-gray-500">{p.city} · {p.godowns.length} godown{p.godowns.length > 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>

        {/* Godown list */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">Godowns — {selectedPincode?.city}</div>
          {selectedPincode?.godowns.map((g, i) => (
            <div key={i} onClick={() => setSelectedGodown(g)}
              className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selectedGodown?.id === g.id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
              <div className="font-semibold text-sm">{g.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{g.id} · {g.locations.length} SKUs</div>
            </div>
          ))}
        </div>

        {/* Stock detail */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3">Stock — {selectedGodown?.name}</div>
          {selectedGodown?.locations.map((loc, i) => (
            <div key={i} className={`p-3 rounded-xl border mb-2 ${loc.qty === 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm text-red-700">{loc.sku}</span>
                <span className={`text-sm font-extrabold ${loc.qty === 0 ? 'text-red-500' : loc.qty < 20 ? 'text-amber-500' : 'text-green-600'}`}>{loc.qty} units</span>
              </div>
              <div className="text-xs text-gray-600 font-medium">{loc.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">📍 {loc.loc}</div>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Total Units</span>
            <span className="font-extrabold text-gray-800">
              {selectedGodown?.locations.reduce((s, l) => s + l.qty, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
