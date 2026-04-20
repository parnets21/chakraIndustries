import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';
import { MdDeleteOutline } from 'react-icons/md';

const initialAssets = [
  { id: 'AST-001', name: 'CNC Machine M-200', category: 'Machinery', location: 'Plant A', purchaseDate: '15 Jan 2022', value: '₹24,00,000', status: 'Active', nextMaint: '20 Apr 2024' },
  { id: 'AST-002', name: 'Hydraulic Press HP-50', category: 'Machinery', location: 'Plant B', purchaseDate: '10 Mar 2021', value: '₹8,50,000', status: 'Active', nextMaint: '25 Apr 2024' },
  { id: 'AST-003', name: 'Forklift FL-3T', category: 'Material Handling', location: 'WH-01', purchaseDate: '5 Jun 2020', value: '₹6,20,000', status: 'Maintenance', nextMaint: '15 Apr 2024' },
  { id: 'AST-004', name: 'Compressor AC-100', category: 'Utilities', location: 'Plant A', purchaseDate: '20 Aug 2023', value: '₹3,80,000', status: 'Active', nextMaint: '30 Apr 2024' },
  { id: 'AST-005', name: 'Lathe Machine LM-400', category: 'Machinery', location: 'Plant A', purchaseDate: '12 Feb 2019', value: '₹12,00,000', status: 'Inactive', nextMaint: '—' },
];

const maintenanceSchedule = [
  { date: '15 Apr', asset: 'Forklift FL-3T', type: 'Corrective', technician: 'Ravi Kumar', status: 'In Progress' },
  { date: '20 Apr', asset: 'CNC Machine M-200', type: 'Preventive', technician: 'Suresh Patil', status: 'Scheduled' },
  { date: '25 Apr', asset: 'Hydraulic Press HP-50', type: 'Preventive', technician: 'Anil Rao', status: 'Scheduled' },
  { date: '30 Apr', asset: 'Compressor AC-100', type: 'Preventive', technician: 'Vijay Singh', status: 'Scheduled' },
];

const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);
const maintDays = [15, 20, 25, 30];

export default function AssetsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab]       = useState(initialTab);
  const [showModal, setShowModal]       = useState(false);
  const [assets, setAssets]             = useState(initialAssets);
  const [deleteAsset, setDeleteAsset]   = useState(null);

  const confirmDelete = () => {
    setAssets(prev => prev.filter(a => a.id !== deleteAsset.id));
    setDeleteAsset(null);
  };

  const kpis = [
    { label: 'Total Assets', value: assets.length, color: '#3b82f6' },
    { label: 'Active', value: assets.filter(a => a.status === 'Active').length, color: '#10b981' },
    { label: 'Under Maintenance', value: assets.filter(a => a.status === 'Maintenance').length, color: '#f59e0b' },
    { label: 'Total Value', value: '₹54.5L', color: '#8b5cf6' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'Asset ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'name', label: 'Asset Name', render: v => <span className="font-semibold">{v}</span> },
              { key: 'category', label: 'Category' },
              { key: 'location', label: 'Location' },
              { key: 'value', label: 'Value', render: v => <span className="font-bold">{v}</span> },
              { key: 'nextMaint', label: 'Next Maintenance' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
              { key: 'id', label: 'Actions', render: (_, row) => (
                <button
                  className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-600 hover:text-white transition-all cursor-pointer font-[inherit]"
                  title="Delete" onClick={() => setDeleteAsset(row)}
                >
                  <MdDeleteOutline size={15} />
                </button>
              )},
            ]}
            data={assets}
          />
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">April 2024</div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              <div />
              {calendarDays.map(d => (
                <div key={d} className={`text-center px-0.5 py-1.5 rounded-md text-xs cursor-default
                  ${maintDays.includes(d) ? 'bg-amber-400 text-white font-bold cursor-pointer' : d === 14 ? 'bg-red-700 text-white' : 'text-gray-800'}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-3 text-[11px]">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Maintenance</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-red-700" /> Today</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Maintenance Schedule</div>
            {maintenanceSchedule.map((m, i) => (
              <div key={i} className={`flex items-center gap-3 py-2.5 ${i < maintenanceSchedule.length - 1 ? 'border-b border-gray-200' : ''}`}>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex flex-col items-center justify-center flex-shrink-0">
                  <div className="text-sm font-extrabold text-red-700">{m.date.split(' ')[0]}</div>
                  <div className="text-[9px] text-gray-400">APR</div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[13px] text-gray-800">{m.asset}</div>
                  <div className="text-[11px] text-gray-400">{m.type} · {m.technician}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Asset Lifecycle Tracking</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Asset ID','Asset Name','Purchase Date','Purchase Value','Current Value','Depreciation','Age','Lifecycle Stage','Action'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { id: 'AST-001', name: 'CNC Machine M-200', purchaseDate: 'Jan 2022', purchaseVal: '₹24,00,000', currentVal: '₹18,00,000', dep: '25%', age: '2.3 yrs', stage: 'Active' },
                  { id: 'AST-002', name: 'Hydraulic Press HP-50', purchaseDate: 'Mar 2021', purchaseVal: '₹8,50,000', currentVal: '₹5,10,000', dep: '40%', age: '3.1 yrs', stage: 'Active' },
                  { id: 'AST-003', name: 'Forklift FL-3T', purchaseDate: 'Jun 2020', purchaseVal: '₹6,20,000', currentVal: '₹2,48,000', dep: '60%', age: '3.9 yrs', stage: 'Maintenance' },
                  { id: 'AST-005', name: 'Lathe Machine LM-400', purchaseDate: 'Feb 2019', purchaseVal: '₹12,00,000', currentVal: '₹1,20,000', dep: '90%', age: '5.2 yrs', stage: 'End of Life' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.id}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.name}</td>
                    <td className="px-4 py-3 align-middle text-gray-500">{r.purchaseDate}</td>
                    <td className="px-4 py-3 align-middle font-bold">{r.purchaseVal}</td>
                    <td className="px-4 py-3 align-middle font-bold text-green-600">{r.currentVal}</td>
                    <td className="px-4 py-3 align-middle font-bold text-red-500">{r.dep}</td>
                    <td className="px-4 py-3 align-middle">{r.age}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.stage === 'Active' ? 'bg-green-100 text-green-700' : r.stage === 'End of Life' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.stage}</span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {r.stage === 'End of Life'
                        ? <button className="px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">Dispose</button>
                        : <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">View History</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteAsset} onClose={() => setDeleteAsset(null)} title="Delete Asset"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold cursor-pointer font-[inherit]" onClick={() => setDeleteAsset(null)}>Cancel</button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold cursor-pointer font-[inherit] border-0" onClick={confirmDelete}>Delete</button>
          </>
        }>
        <p className="text-sm text-gray-700">Are you sure you want to delete <strong>{deleteAsset?.name}</strong>? This action cannot be undone.</p>
      </Modal>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Asset"
        footer={<>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Save Asset</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Asset Name *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. CNC Machine M-300" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Category *</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Machinery</option><option>Material Handling</option><option>Utilities</option><option>IT Equipment</option><option>Vehicles</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Location *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. Plant A" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Purchase Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Purchase Value (₹) *</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0.00" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Condition</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>New</option><option>Good</option><option>Fair</option><option>Poor</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Vendor / Supplier</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Supplier name" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Warranty Expiry</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Next Maintenance</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Assigned To</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Department / Person" /></div>
        </div>
        <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Description / Notes</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Asset details..." /></div>
      </Modal>
    </div>
  );
}
