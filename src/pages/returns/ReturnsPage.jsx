import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const returns = [
  { id: 'RET-001', docket: 'DKT-2024-041', order: 'ORD-2024-080', customer: 'Bajaj Auto', items: 4, value: '₹48,000', type: 'Defective', status: 'Pending', date: '13 Apr', debitNote: '', creditNote: '' },
  { id: 'RET-002', docket: 'DKT-2024-038', order: 'ORD-2024-075', customer: 'Hero MotoCorp', items: 2, value: '₹22,000', type: 'Wrong Item', status: 'Approved', date: '12 Apr', debitNote: 'DN-2024-012', creditNote: 'CN-2024-012' },
  { id: 'RET-003', docket: 'DKT-2024-031', order: 'ORD-2024-070', customer: 'TVS Motor', items: 6, value: '₹84,000', type: 'Defective', status: 'Completed', date: '10 Apr', debitNote: 'DN-2024-009', creditNote: 'CN-2024-009' },
  { id: 'RET-004', docket: 'DKT-2024-025', order: 'ORD-2024-065', customer: 'Tata Motors', items: 1, value: '₹12,000', type: 'Excess', status: 'Rejected', date: '8 Apr', debitNote: '', creditNote: '' },
];

const docketTimeline = {
  'RET-001': [
    { event: 'Return Requested', time: '13 Apr, 10:00 AM', status: 'success' },
    { event: 'Docket Created — DKT-2024-041', time: '13 Apr, 10:30 AM', status: 'success' },
    { event: 'Pickup Scheduled', time: '14 Apr, 09:00 AM', status: 'warning' },
    { event: 'Material Received at Warehouse', time: 'Pending', status: 'gray' },
    { event: 'Quality Inspection', time: 'Pending', status: 'gray' },
    { event: 'Credit Note Issued', time: 'Pending', status: 'gray' },
  ],
  'RET-002': [
    { event: 'Return Requested', time: '12 Apr, 11:00 AM', status: 'success' },
    { event: 'Docket Created — DKT-2024-038', time: '12 Apr, 11:30 AM', status: 'success' },
    { event: 'Material Received', time: '13 Apr, 02:00 PM', status: 'success' },
    { event: 'Inspection Passed', time: '13 Apr, 04:00 PM', status: 'success' },
    { event: 'Debit Note DN-2024-012 Raised', time: '14 Apr, 09:00 AM', status: 'success' },
    { event: 'Credit Note CN-2024-012 Issued', time: '14 Apr, 10:00 AM', status: 'success' },
  ],
};

const debitCreditMatching = [
  { returnId: 'RET-002', customer: 'Hero MotoCorp', debitNote: 'DN-2024-012', debitAmt: '₹22,000', creditNote: 'CN-2024-012', creditAmt: '₹22,000', diff: '₹0', status: 'Matched' },
  { returnId: 'RET-003', customer: 'TVS Motor', debitNote: 'DN-2024-009', debitAmt: '₹84,000', creditNote: 'CN-2024-009', creditAmt: '₹80,000', diff: '₹4,000', status: 'Mismatch' },
];

const lossTracking = [
  { id: 'RET-003', customer: 'TVS Motor', returnValue: '₹84,000', recoverable: '₹80,000', loss: '₹4,000', reason: 'Damaged beyond repair (2 units)', status: 'Loss Confirmed' },
  { id: 'RET-004', customer: 'Tata Motors', returnValue: '₹12,000', recoverable: '₹0', loss: '₹12,000', reason: 'Return rejected — no defect found', status: 'Disputed' },
];

export default function ReturnsPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selected, setSelected] = useState(returns[0]);
  const [showModal, setShowModal] = useState(false);

  const kpis = [
    { label: 'Total Returns', value: returns.length, color: '#1c2833' },
    { label: 'Pending', value: returns.filter(r => r.status === 'Pending').length, color: '#f59e0b' },
    { label: 'Approved', value: returns.filter(r => r.status === 'Approved').length, color: '#3b82f6' },
    { label: 'Completed', value: returns.filter(r => r.status === 'Completed').length, color: '#10b981' },
  ];

  const tabLabels = ['Return Requests', 'Docket Tracking', 'Debit / Credit Matching', 'Loss Tracking'];

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
        }}>+ New Return</button>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab 0: Return Requests */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Returns List</div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Return ID', 'Docket', 'Customer', 'Type', 'Status'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returns.map((r, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelected(r)}
                      className={`border-b border-gray-50 last:border-0 transition-colors cursor-pointer ${selected?.id === r.id ? 'bg-red-50/60' : 'hover:bg-red-50/40'}`}
                    >
                      <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.id}</td>
                      <td className="px-4 py-3 align-middle font-mono text-[11px] text-gray-800">{r.docket}</td>
                      <td className="px-4 py-3 align-middle font-semibold text-gray-800">{r.customer}</td>
                      <td className="px-4 py-3 align-middle"><StatusBadge status={r.type} type="warning" /></td>
                      <td className="px-4 py-3 align-middle"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-3">Material Validation — {selected.id}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5">
                  {[['Return ID', selected.id], ['Docket', selected.docket], ['Customer', selected.customer], ['Return Type', selected.type], ['Items', selected.items], ['Date', selected.date]].map(([k, v]) => (
                    <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                      <div className="text-[10px] text-gray-500 mb-0.5">{k}</div>
                      <div className="text-sm font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 mb-4">
                  <label className="text-xs font-semibold text-gray-600">Inspection Remarks</label>
                  <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Enter inspection findings..." />
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">✓ Accept</button>
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold border-0 cursor-pointer font-[inherit]">✗ Reject</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="text-sm font-bold text-gray-800 mb-3">Financial Processing</div>
                {[['Return Value', selected.value], ['GST Credit', '₹7,200'], ['Net Refund', selected.value], ['Credit Note', 'CN-2024-' + selected.id.split('-')[1]]].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-100 text-sm last:border-0">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-bold">{v}</span>
                  </div>
                ))}
                <button className="inline-flex items-center justify-center gap-1.5 w-full mt-3.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
                  Issue Credit Note
                </button>
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
            {returns.map((r, i) => (
              <div
                key={i}
                onClick={() => setSelected(r)}
                className={`p-3 rounded-lg mb-2 cursor-pointer border-2 transition-all ${selected?.id === r.id ? 'border-red-600 bg-red-50/60' : 'border-gray-200 bg-white hover:border-red-300'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-red-700 text-sm">{r.docket}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="text-xs text-gray-500">{r.id} · {r.customer} · {r.date}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Docket Timeline — {selected?.docket}</div>
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-1.5 bottom-1.5 w-0.5 bg-gray-200 rounded" />
              {(docketTimeline[selected?.id] || docketTimeline['RET-001']).map((item, i) => (
                <div key={i} className="relative mb-5 last:mb-0">
                  <div className={`absolute -left-[17px] top-1 w-3 h-3 rounded-full ring-2 ring-offset-1 ${
                    item.status === 'success' ? 'bg-green-500 ring-green-500' :
                    item.status === 'warning' ? 'bg-amber-400 ring-amber-400' :
                    'bg-gray-300 ring-gray-300'
                  }`} />
                  <div className="text-sm font-semibold text-gray-800">{item.event}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Debit / Credit Matching */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Debit vs Credit Note Matching</div>
              <div className="text-xs text-gray-400 mt-0.5">Reconcile debit notes raised against credit notes issued</div>
            </div>
            <StatusBadge status="1 Mismatch" type="warning" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Return ID', 'Customer', 'Debit Note', 'Debit Amt', 'Credit Note', 'Credit Amt', 'Difference', 'Status'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {debitCreditMatching.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{row.returnId}</td>
                    <td className="px-4 py-3 align-middle font-semibold text-gray-800">{row.customer}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] text-gray-800">{row.debitNote}</td>
                    <td className="px-4 py-3 align-middle font-bold text-red-500">{row.debitAmt}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px] text-gray-800">{row.creditNote}</td>
                    <td className="px-4 py-3 align-middle font-bold text-green-600">{row.creditAmt}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${row.diff === '₹0' ? 'text-green-600' : 'text-red-500'}`}>{row.diff}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={row.status} type={row.status === 'Matched' ? 'success' : 'danger'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3.5 bg-amber-50 rounded-lg border border-amber-300">
            <div className="font-bold text-sm text-amber-800 mb-1">⚠ Mismatch Alert — RET-003</div>
            <div className="text-xs text-amber-700">Debit Note DN-2024-009 (₹84,000) does not match Credit Note CN-2024-009 (₹80,000). Difference of ₹4,000 needs resolution.</div>
            <button className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-amber-400 text-white font-semibold border-0 cursor-pointer font-[inherit]">
              Resolve Mismatch
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Loss Tracking */}
      {activeTab === 3 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {[
              { label: 'Total Loss Value', value: '₹16,000', color: '#ef4444' },
              { label: 'Disputed Cases', value: lossTracking.filter(l => l.status === 'Disputed').length, color: '#f59e0b' },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Loss-End Tracking</div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Return ID', 'Customer', 'Return Value', 'Recoverable', 'Loss Amount', 'Reason', 'Status', 'Action'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lossTracking.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                      <td className="px-4 py-3 align-middle font-semibold text-red-700">{row.id}</td>
                      <td className="px-4 py-3 align-middle font-semibold text-gray-800">{row.customer}</td>
                      <td className="px-4 py-3 align-middle text-gray-800">{row.returnValue}</td>
                      <td className="px-4 py-3 align-middle font-bold text-green-600">{row.recoverable}</td>
                      <td className="px-4 py-3 align-middle font-extrabold text-red-500">{row.loss}</td>
                      <td className="px-4 py-3 align-middle text-[11px] text-gray-500 max-w-[180px]">{row.reason}</td>
                      <td className="px-4 py-3 align-middle"><StatusBadge status={row.status} type={row.status === 'Loss Confirmed' ? 'danger' : 'warning'} /></td>
                      <td className="px-4 py-3 align-middle">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
                          Write Off
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Return Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Return"
        footer={
          <>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowModal(false)}>Submit Return</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Order Reference *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="e.g. ORD-2024-089" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Customer Name *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Customer name" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Return Type *</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Defective</option><option>Wrong Item</option><option>Excess</option><option>Damaged in Transit</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Number of Items *</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Return Value (₹) *</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0.00" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Return Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
        </div>
        <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Reason / Description *</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Describe the reason for return..." /></div>
      </Modal>
    </div>
  );
}
