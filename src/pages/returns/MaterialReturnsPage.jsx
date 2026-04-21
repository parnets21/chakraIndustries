import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const STAGES = ['Initiated', 'In-transit', 'Received', 'QC', 'Closed'];

const materialReturns = [
  { id: 'MR-001', docket: 'DKT-2024-051', supplier: 'Shree Metals', items: 5, value: '₹62,000', stage: 'QC', date: '15 Apr', transport: 'BlueDart', awb: 'BD112233445', cn: 'CN-2024-015', dn: 'DN-2024-015' },
  { id: 'MR-002', docket: 'DKT-2024-048', supplier: 'Global Bearings', items: 3, value: '₹28,500', stage: 'In-transit', date: '14 Apr', transport: 'DTDC', awb: 'DT998877665', cn: '', dn: 'DN-2024-014' },
  { id: 'MR-003', docket: 'DKT-2024-044', supplier: 'Apex Gaskets', items: 8, value: '₹44,000', stage: 'Closed', date: '12 Apr', transport: 'Delhivery', awb: 'DL556677889', cn: 'CN-2024-013', dn: 'DN-2024-013' },
  { id: 'MR-004', docket: 'DKT-2024-042', supplier: 'Prime Seals', items: 2, value: '₹15,000', stage: 'Initiated', date: '11 Apr', transport: '—', awb: '—', cn: '', dn: '' },
];

const cnDnData = [
  { id: 'MR-001', supplier: 'Shree Metals', dn: 'DN-2024-015', dnAmt: '₹62,000', cn: 'CN-2024-015', cnAmt: '₹62,000', diff: '₹0', returnReceived: true, status: 'Matched' },
  { id: 'MR-002', supplier: 'Global Bearings', dn: 'DN-2024-014', dnAmt: '₹28,500', cn: '—', cnAmt: '—', diff: '₹28,500', returnReceived: false, status: 'Mismatch' },
  { id: 'MR-003', supplier: 'Apex Gaskets', dn: 'DN-2024-013', dnAmt: '₹44,000', cn: 'CN-2024-013', cnAmt: '₹40,000', diff: '₹4,000', returnReceived: true, status: 'Mismatch' },
  { id: 'MR-004', supplier: 'Prime Seals', dn: '—', dnAmt: '—', cn: '—', cnAmt: '—', diff: '—', returnReceived: false, status: 'Pending' },
];

const stageColor = { Initiated: '#6b7280', 'In-transit': '#3b82f6', Received: '#f59e0b', QC: '#8b5cf6', Closed: '#10b981' };

export default function MaterialReturnsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selected, setSelected] = useState(materialReturns[0]);
  const [showModal, setShowModal] = useState(false);

  const tabs = ['Returns Dashboard', 'Docket Tracking', 'CN / DN Reconciliation'];

  const kpis = [
    { label: 'Total Returns', value: materialReturns.length, color: '#1c2833' },
    { label: 'In-transit', value: materialReturns.filter(r => r.stage === 'In-transit').length, color: '#3b82f6' },
    { label: 'Pending QC', value: materialReturns.filter(r => r.stage === 'QC').length, color: '#8b5cf6' },
    { label: 'Closed', value: materialReturns.filter(r => r.stage === 'Closed').length, color: '#10b981' },
  ];

  const stageIdx = (s) => STAGES.indexOf(s);

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

      {/* Tab 0: Returns Dashboard */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Return Requests</div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>{['MR ID', 'Docket', 'Supplier', 'Stage', 'Value'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {materialReturns.map((r, i) => (
                    <tr key={i} onClick={() => setSelected(r)}
                      className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected?.id === r.id ? 'bg-red-50/60' : 'hover:bg-red-50/40'}`}>
                      <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.id}</td>
                      <td className="px-4 py-3 align-middle font-mono text-[11px]">{r.docket}</td>
                      <td className="px-4 py-3 align-middle font-semibold">{r.supplier}</td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: stageColor[r.stage] }}>{r.stage}</span>
                      </td>
                      <td className="px-4 py-3 align-middle font-bold">{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-4">Stage Tracker — {selected.id}</div>
              {/* Stage stepper */}
              <div className="flex items-center mb-6 overflow-x-auto pb-1">
                {STAGES.map((s, i) => {
                  const cur = stageIdx(selected.stage);
                  const done = i < cur;
                  const active = i === cur;
                  return (
                    <div key={s} className="flex items-center flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                          done ? 'bg-green-500 border-green-500 text-white' :
                          active ? 'border-red-600 text-red-700 bg-red-50' :
                          'border-gray-200 text-gray-400 bg-white'
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <div className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${active ? 'text-red-700' : done ? 'text-green-600' : 'text-gray-400'}`}>{s}</div>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`h-0.5 w-8 mx-1 rounded ${i < cur ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[['Docket ID', selected.docket], ['Supplier', selected.supplier], ['Items', selected.items], ['Value', selected.value], ['Transport', selected.transport], ['AWB No.', selected.awb], ['Debit Note', selected.dn || '—'], ['Credit Note', selected.cn || 'Not issued']].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-gray-500 mb-0.5">{k}</div>
                    <div className="text-sm font-semibold">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 text-xs rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-white font-semibold border-0 cursor-pointer font-[inherit]">Update Stage</button>
                <button className="flex-1 px-3 py-2 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Issue Credit Note</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Docket Tracking */}
      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Docket List</div>
            {materialReturns.map((r, i) => (
              <div key={i} onClick={() => setSelected(r)}
                className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selected?.id === r.id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 hover:border-red-300'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-red-700 text-sm">{r.docket}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: stageColor[r.stage] }}>{r.stage}</span>
                </div>
                <div className="text-xs text-gray-500">{r.id} · {r.supplier} · {r.date}</div>
                <div className="text-xs text-gray-400 mt-0.5">Transport: {r.transport} {r.awb !== '—' ? `· AWB: ${r.awb}` : ''}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Lifecycle — {selected?.docket}</div>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-gray-200 rounded" />
              {STAGES.map((s, i) => {
                const cur = stageIdx(selected?.stage || 'Initiated');
                const done = i <= cur;
                return (
                  <div key={s} className="relative mb-5 last:mb-0">
                    <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full ring-2 ring-offset-1 ${done ? 'bg-green-500 ring-green-500' : 'bg-gray-300 ring-gray-300'}`} />
                    <div className={`text-sm font-semibold ${done ? 'text-gray-800' : 'text-gray-400'}`}>{s}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{done ? (i === cur ? 'Current stage' : 'Completed') : 'Pending'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: CN/DN Reconciliation */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Credit Note vs Debit Note Reconciliation</div>
              <div className="text-xs text-gray-400 mt-0.5">Side-by-side view of CN/DN raised vs material received</div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">
                {cnDnData.filter(r => r.status === 'Mismatch').length} Mismatches
              </span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 mb-4">
            <table className="w-full">
              <thead>
                <tr>{['MR ID', 'Supplier', 'Debit Note', 'DN Amount', 'Credit Note', 'CN Amount', 'Difference', 'Return Rcvd', 'Status'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {cnDnData.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors ${row.status === 'Mismatch' ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{row.id}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{row.supplier}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px]">{row.dn}</td>
                    <td className="px-4 py-3 align-middle font-bold text-red-500">{row.dnAmt}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px]">{row.cn}</td>
                    <td className="px-4 py-3 align-middle font-bold text-green-600">{row.cnAmt}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${row.diff === '₹0' ? 'text-green-600' : row.diff === '—' ? 'text-gray-400' : 'text-red-500'}`}>{row.diff}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.returnReceived ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.returnReceived ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={row.status} type={row.status === 'Matched' ? 'success' : row.status === 'Pending' ? 'warning' : 'danger'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Alerts */}
          {cnDnData.filter(r => r.status === 'Mismatch').map((row, i) => (
            <div key={i} className="mb-2 p-3.5 bg-red-50 rounded-lg border border-red-200">
              <div className="font-bold text-sm text-red-800 mb-1">⚠ Mismatch Alert — {row.id} ({row.supplier})</div>
              {!row.returnReceived
                ? <div className="text-xs text-red-700">Debit Note {row.dn} raised but no return material received yet.</div>
                : <div className="text-xs text-red-700">DN amount {row.dnAmt} does not match CN amount {row.cnAmt}. Difference: {row.diff}.</div>
              }
              <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-semibold border-0 cursor-pointer font-[inherit]">Resolve</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Material Return"
        footer={<>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Submit</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Supplier *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Supplier name" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">PO Reference *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="PO-2024-XXX" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">No. of Items *</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Return Value (₹) *</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0.00" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Transport Partner</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Courier name" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">AWB / Tracking No.</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="AWB number" /></div>
        </div>
        <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Reason *</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Reason for return..." /></div>
      </Modal>
    </div>
  );
}
