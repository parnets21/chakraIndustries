import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';
import Modal from '../../components/common/Modal';

const tabs = ['Ledger', 'BRS', 'Payments', 'Credit / Debit Notes', 'Ledger Matching'];

const brsUnmatched = [
  { id: 'BRS-U01', date: '14 Apr', bankDesc: 'NEFT Credit — Unknown Party', bankAmt: '₹1,20,000', ledgerRef: '—', ledgerAmt: '—', diff: '₹1,20,000', status: 'Unmatched' },
  { id: 'BRS-U02', date: '13 Apr', bankDesc: 'Cheque Debit — 004521', bankAmt: '₹45,000', ledgerRef: '—', ledgerAmt: '—', diff: '₹45,000', status: 'Unmatched' },
  { id: 'BRS-U03', date: '12 Apr', bankDesc: 'RTGS Credit — Eicher Motors', bankAmt: '₹3,80,000', ledgerRef: 'INV-2024-086', ledgerAmt: '₹3,80,000', diff: '₹0', status: 'Matched' },
];

const brsMatched = [
  { bank: 'NEFT Credit — Tata Motors', bankAmt: '₹2,84,000', ledger: 'INV-2024-089', ledgerAmt: '₹2,84,000', date: '14 Apr', status: 'Matched' },
  { bank: 'RTGS Debit — Shree Metals', bankAmt: '₹4,95,600', ledger: 'PO-2024-089', ledgerAmt: '₹4,95,600', date: '14 Apr', status: 'Matched' },
  { bank: 'NEFT Credit — Mahindra', bankAmt: '₹1,56,000', ledger: 'INV-2024-088', ledgerAmt: '₹1,56,000', date: '13 Apr', status: 'Matched' },
];

const ledgerEntries = [
  { date: '14 Apr', ref: 'INV-2024-089', description: 'Sales — Tata Motors', debit: '', credit: '₹2,84,000', balance: '₹48,20,000' },
  { date: '14 Apr', ref: 'PO-2024-089', description: 'Purchase — Shree Metals', debit: '₹4,95,600', credit: '', balance: '₹43,24,400' },
  { date: '13 Apr', ref: 'INV-2024-088', description: 'Sales — Mahindra', debit: '', credit: '₹1,56,000', balance: '₹48,20,000' },
  { date: '13 Apr', ref: 'PAY-0234', description: 'Payment Received — Bajaj Auto', debit: '', credit: '₹4,12,000', balance: '₹46,64,000' },
  { date: '12 Apr', ref: 'EXP-0089', description: 'Salary — April 2024', debit: '₹8,40,000', credit: '', balance: '₹42,52,000' },
];

const bankEntries = [
  { date: '14 Apr', description: 'NEFT Credit — Tata Motors', amount: '₹2,84,000', type: 'Credit' },
  { date: '14 Apr', description: 'RTGS Debit — Shree Metals', amount: '₹4,95,600', type: 'Debit' },
  { date: '13 Apr', description: 'NEFT Credit — Mahindra', amount: '₹1,56,000', type: 'Credit' },
];

const systemEntries = [
  { date: '14 Apr', description: 'Invoice INV-2024-089', amount: '₹2,84,000', type: 'Credit' },
  { date: '14 Apr', description: 'PO Payment PO-2024-089', amount: '₹4,95,600', type: 'Debit' },
  { date: '13 Apr', description: 'Invoice INV-2024-088', amount: '₹1,56,000', type: 'Credit' },
];

const payments = [
  { id: 'PAY-0234', party: 'Bajaj Auto', type: 'Received', amount: '₹4,12,000', mode: 'NEFT', date: '13 Apr', status: 'Completed' },
  { id: 'PAY-0233', party: 'Shree Metals', type: 'Made', amount: '₹4,95,600', mode: 'RTGS', date: '14 Apr', status: 'Completed' },
  { id: 'PAY-0232', party: 'Hero MotoCorp', type: 'Received', amount: '₹98,000', mode: 'Cheque', date: '12 Apr', status: 'Pending' },
];

export default function FinancePage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPayModal, setShowPayModal] = useState(false);

  const kpis = [
    { label: 'Total Revenue', value: '₹48.2L', color: '#10b981' },
    { label: 'Total Expenses', value: '₹32.1L', color: '#ef4444' },
    { label: 'Net Profit', value: '₹16.1L', color: '#3b82f6' },
    { label: 'Receivables', value: '₹8.4L', color: '#f59e0b' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Finance</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Finance</span>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]"
          onClick={() => setShowPayModal(true)}
        >
          + Add Payment
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="flex border-b-2 border-gray-200 mb-5 overflow-x-auto">
        {tabs.map((t, i) => (
          <button
            key={i}
            className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-0.5 cursor-pointer flex-shrink-0 bg-transparent font-[inherit] ${
              activeTab === i
                ? 'text-red-700 border-red-600'
                : 'text-gray-400 border-transparent hover:text-red-600'
            }`}
            onClick={() => setActiveTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">General Ledger</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date','Reference','Description','Debit (₹)','Credit (₹)','Balance'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((e, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 text-gray-800 align-middle">{e.date}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle font-semibold text-red-700">{e.ref}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle">{e.description}</td>
                    <td className={`px-4 py-3 align-middle ${e.debit ? 'text-red-500 font-semibold' : 'text-gray-800'}`}>{e.debit || '—'}</td>
                    <td className={`px-4 py-3 align-middle ${e.credit ? 'text-green-600 font-semibold' : 'text-gray-800'}`}>{e.credit || '—'}</td>
                    <td className="px-4 py-3 text-gray-800 align-middle font-bold">{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div>
          {/* Upload + Auto-match controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">Upload Bank Statement</div>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 mb-3 cursor-pointer hover:border-red-300 transition-colors">
                <div className="text-3xl mb-1">📄</div>
                <div className="font-semibold text-sm text-gray-700">Drag & drop bank statement or click to browse</div>
                <div className="text-xs text-gray-400 mt-1">CSV, XLS, PDF — Max 10MB</div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]">
                  ⚡ Auto-Match with Ledger
                </button>
                <button className="px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]">
                  Export BRS
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-sm font-bold text-gray-800 mb-3">BRS Summary</div>
              {[
                { label: 'Bank Balance', value: '₹43,24,400', color: 'text-green-600' },
                { label: 'System Balance', value: '₹43,24,400', color: 'text-blue-600' },
                { label: 'Matched', value: '3 entries', color: 'text-green-600' },
                { label: 'Unmatched', value: '2 entries', color: 'text-red-500' },
              ].map(([, k, v, c] = [null, ...Object.values({label: '', value: '', color: ''})], i) => null) && null}
              {[
                { label: 'Bank Balance', value: '₹43,24,400', color: 'text-green-600' },
                { label: 'System Balance', value: '₹43,24,400', color: 'text-blue-600' },
                { label: 'Matched Entries', value: '3', color: 'text-green-600' },
                { label: 'Unmatched', value: '2', color: 'text-red-500' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Unmatched transactions */}
          <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-red-700">⚠ Unmatched Transactions</div>
                <div className="text-xs text-gray-400 mt-0.5">Transactions in bank statement not found in ledger</div>
              </div>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white font-semibold border-0 cursor-pointer font-[inherit]">Resolve All</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr>{['ID', 'Date', 'Bank Description', 'Bank Amount', 'Ledger Ref', 'Ledger Amount', 'Difference', 'Status', 'Action'].map(h => (
                    <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {brsUnmatched.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors ${row.status === 'Unmatched' ? 'bg-red-50/30' : 'bg-green-50/20'}`}>
                      <td className="px-4 py-3 align-middle font-mono text-xs text-red-700">{row.id}</td>
                      <td className="px-4 py-3 align-middle text-gray-500">{row.date}</td>
                      <td className="px-4 py-3 align-middle font-semibold">{row.bankDesc}</td>
                      <td className="px-4 py-3 align-middle font-bold text-green-600">{row.bankAmt}</td>
                      <td className="px-4 py-3 align-middle font-mono text-xs">{row.ledgerRef}</td>
                      <td className="px-4 py-3 align-middle font-bold">{row.ledgerAmt}</td>
                      <td className={`px-4 py-3 align-middle font-extrabold ${row.diff === '₹0' ? 'text-green-600' : 'text-red-500'}`}>{row.diff}</td>
                      <td className="px-4 py-3 align-middle"><StatusBadge status={row.status} type={row.status === 'Matched' ? 'success' : 'danger'} /></td>
                      <td className="px-4 py-3 align-middle">
                        {row.status === 'Unmatched' ? (
                          <div className="flex gap-1">
                            <button className="px-2 py-1 text-[11px] rounded bg-green-100 text-green-800 font-semibold border-0 cursor-pointer font-[inherit]">Match</button>
                            <button className="px-2 py-1 text-[11px] rounded bg-gray-100 text-gray-700 font-semibold border-0 cursor-pointer font-[inherit]">Ignore</button>
                          </div>
                        ) : <span className="text-green-600 text-xs font-bold">✓ Confirmed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matched transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Bank Statement', entries: bankEntries, titleColor: 'text-red-700', balanceColor: 'text-green-600', balanceBg: 'bg-green-50', balance: '₹43,24,400', balanceLabel: 'Bank Balance' },
              { title: 'System Records', entries: systemEntries, titleColor: 'text-amber-500', balanceColor: 'text-amber-500', balanceBg: 'bg-amber-50', balance: '₹43,24,400', balanceLabel: 'System Balance' }
            ].map((section, si) => (
              <div key={si} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className={`text-sm font-bold mb-3.5 ${section.titleColor}`}>{section.title}</div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr>
                        {['Date','Description','Amount','Type'].map(h => (
                          <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.entries.map((e, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                          <td className="px-4 py-3 text-gray-800 align-middle">{e.date}</td>
                          <td className="px-4 py-3 text-gray-800 align-middle">{e.description}</td>
                          <td className={`px-4 py-3 align-middle font-bold ${e.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`}>{e.amount}</td>
                          <td className="px-4 py-3 text-gray-800 align-middle"><StatusBadge status={e.type} type={e.type === 'Credit' ? 'success' : 'danger'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`mt-3.5 p-3 rounded-lg flex justify-between ${section.balanceBg}`}>
                  <span className="font-semibold text-sm">{section.balanceLabel}</span>
                  <span className={`font-extrabold text-sm ${section.balanceColor}`}>{section.balance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <DataTable
            columns={[
              { key: 'id', label: 'Payment ID', render: v => <span className="font-semibold text-red-700">{v}</span> },
              { key: 'party', label: 'Party' },
              { key: 'type', label: 'Type', render: v => <StatusBadge status={v} type={v === 'Received' ? 'success' : 'info'} /> },
              { key: 'amount', label: 'Amount', render: v => <span className="font-bold">{v}</span> },
              { key: 'mode', label: 'Mode' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={payments}
          />
        </div>
      )}

      {activeTab === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Credit / Debit Note Register</div>
              <div className="text-xs text-gray-400 mt-0.5">All credit and debit notes issued</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded-lg border border-red-600 text-red-700 bg-transparent font-semibold cursor-pointer font-[inherit]">+ Debit Note</button>
              <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">+ Credit Note</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Note No.','Type','Party','Against','Amount','Date','Reason','Status'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { no: 'CN-2024-012', type: 'Credit Note', party: 'Hero MotoCorp', against: 'INV-2024-075', amount: '₹22,000', date: '14 Apr', reason: 'Return — Wrong Item', status: 'Issued' },
                  { no: 'CN-2024-009', type: 'Credit Note', party: 'TVS Motor', against: 'INV-2024-070', amount: '₹80,000', date: '13 Apr', reason: 'Return — Defective', status: 'Issued' },
                  { no: 'DN-2024-012', type: 'Debit Note', party: 'Shree Metals', against: 'PO-2024-080', amount: '₹15,000', date: '12 Apr', reason: 'Short Supply', status: 'Issued' },
                  { no: 'DN-2024-009', type: 'Debit Note', party: 'Global Bearings', against: 'PO-2024-075', amount: '₹8,400', date: '11 Apr', reason: 'Quality Rejection', status: 'Pending' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.no}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.type === 'Credit Note' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.type}</span>
                    </td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.party}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs">{r.against}</td>
                    <td className={`px-4 py-3 align-middle font-bold ${r.type === 'Credit Note' ? 'text-green-600' : 'text-red-500'}`}>{r.amount}</td>
                    <td className="px-4 py-3 align-middle text-gray-500">{r.date}</td>
                    <td className="px-4 py-3 align-middle text-xs text-gray-500">{r.reason}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={r.status} type={r.status === 'Issued' ? 'success' : 'warning'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Ledger Matching Engine</div>
              <div className="text-xs text-gray-400 mt-0.5">Auto-match invoices, payments and credit notes</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">Run Auto-Match</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead><tr>{['Invoice','Party','Invoice Amt','Payment Ref','Payment Amt','Credit Note','Net Balance','Match Status'].map(h => (
                <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
              ))}</tr></thead>
              <tbody>
                {[
                  { inv: 'INV-2024-089', party: 'Tata Motors', invAmt: '₹2,84,000', payRef: 'PAY-0234', payAmt: '₹2,84,000', cn: '—', balance: '₹0', status: 'Matched' },
                  { inv: 'INV-2024-088', party: 'Mahindra', invAmt: '₹1,56,000', payRef: 'PAY-0231', payAmt: '₹1,34,000', cn: '—', balance: '₹22,000', status: 'Partial' },
                  { inv: 'INV-2024-087', party: 'Bajaj Auto', invAmt: '₹4,12,000', payRef: '—', payAmt: '—', cn: '—', balance: '₹4,12,000', status: 'Unmatched' },
                  { inv: 'INV-2024-075', party: 'Hero MotoCorp', invAmt: '₹98,000', payRef: 'PAY-0228', payAmt: '₹76,000', cn: 'CN-2024-012', balance: '₹0', status: 'Matched' },
                ].map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{r.inv}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{r.party}</td>
                    <td className="px-4 py-3 align-middle font-bold">{r.invAmt}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs">{r.payRef}</td>
                    <td className="px-4 py-3 align-middle font-bold text-green-600">{r.payAmt}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs text-green-600">{r.cn}</td>
                    <td className={`px-4 py-3 align-middle font-extrabold ${r.balance === '₹0' ? 'text-green-600' : 'text-red-500'}`}>{r.balance}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={r.status} type={r.status === 'Matched' ? 'success' : r.status === 'Partial' ? 'warning' : 'danger'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Add Payment"
        footer={<>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-600 text-red-700 bg-transparent rounded-xl text-sm font-semibold hover:bg-red-700 hover:text-white transition-all cursor-pointer font-[inherit]" onClick={() => setShowPayModal(false)}>Cancel</button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-red-400 to-red-700 text-white rounded-xl text-sm font-semibold shadow-md hover:-translate-y-px transition-all border-0 cursor-pointer font-[inherit]" onClick={() => setShowPayModal(false)}>Save Payment</button>
        </>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Party Name *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="Customer / Vendor" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Payment Type</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>Received</option><option>Made</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Amount (₹) *</label><input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="0.00" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Payment Mode</label><select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Cash</option></select></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Date</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 font-[inherit]" /></div>
          <div className="flex flex-col gap-1.5 mb-4"><label className="text-xs font-semibold text-gray-600">Reference No.</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]" placeholder="UTR / Cheque No." /></div>
        </div>
      </Modal>
    </div>
  );
}
