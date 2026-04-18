import { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const creditNotes = [
  { id: 'CN-2024-015', party: 'Shree Metals', against: 'MR-001', amount: '₹62,000', date: '15 Apr', daysOpen: 0, status: 'Open', reason: 'Material Return' },
  { id: 'CN-2024-013', party: 'Apex Gaskets', against: 'MR-003', amount: '₹40,000', date: '12 Apr', daysOpen: 3, status: 'Open', reason: 'Quality Rejection' },
  { id: 'CN-2024-012', party: 'Hero MotoCorp', against: 'RET-002', amount: '₹22,000', date: '14 Apr', daysOpen: 1, status: 'Open', reason: 'Wrong Item Return' },
  { id: 'CN-2024-009', party: 'TVS Motor', against: 'RET-003', amount: '₹80,000', date: '10 Apr', daysOpen: 5, status: 'Open', reason: 'Defective Return' },
  { id: 'CN-2024-005', party: 'Bajaj Auto', against: 'RET-001', amount: '₹48,000', date: '5 Apr', daysOpen: 10, status: 'Open', reason: 'Excess Supply' },
  { id: 'CN-2024-001', party: 'Tata Motors', against: 'RET-004', amount: '₹12,000', date: '1 Apr', daysOpen: 14, status: 'Closed', reason: 'Resolved' },
];

const escalationRules = [
  { days: 7, action: 'Email reminder to party', enabled: true },
  { days: 14, action: 'Escalate to Finance Manager', enabled: true },
  { days: 21, action: 'Escalate to Management', enabled: false },
  { days: 30, action: 'Legal notice trigger', enabled: false },
];

const agingBuckets = [
  { label: '0–7 days', count: creditNotes.filter(c => c.daysOpen <= 7 && c.status === 'Open').length, color: '#10b981' },
  { label: '8–15 days', count: creditNotes.filter(c => c.daysOpen > 7 && c.daysOpen <= 15 && c.status === 'Open').length, color: '#f59e0b' },
  { label: '15+ days', count: creditNotes.filter(c => c.daysOpen > 15 && c.status === 'Open').length, color: '#ef4444' },
];

export default function CreditNoteTrackingPage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showReminder, setShowReminder] = useState(false);
  const [loginAlert] = useState(creditNotes.filter(c => c.daysOpen >= 7 && c.status === 'Open'));

  const tabs = ['Open Credit Notes', 'Aging & Reminders', 'Escalation Rules'];

  const totalOpen = creditNotes.filter(c => c.status === 'Open').reduce((s, c) => {
    const num = parseFloat(c.amount.replace(/[₹,]/g, ''));
    return s + num;
  }, 0);

  return (
    <div>
      {/* Login popup alert */}
      {loginAlert.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <div className="font-bold text-amber-800 text-sm mb-1">Credit Note Reminders</div>
            <div className="text-xs text-amber-700">{loginAlert.length} credit note{loginAlert.length > 1 ? 's' : ''} are overdue for collection: {loginAlert.map(c => c.id).join(', ')}</div>
          </div>
          <button onClick={() => setShowReminder(true)} className="px-3 py-1.5 text-xs rounded-lg bg-amber-400 text-white font-semibold border-0 cursor-pointer font-[inherit]">View All</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="text-xl font-black text-gray-900 tracking-tight">Credit Note Tracking</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs text-gray-400">Home</span>
            <span className="text-xs text-gray-400">›</span>
            <span className="text-xs text-red-600 font-semibold">Credit Notes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="text-2xl font-black tracking-tight text-red-600">{creditNotes.filter(c => c.status === 'Open').length}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Open Credit Notes</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="text-2xl font-black tracking-tight text-amber-500">₹{(totalOpen / 100000).toFixed(1)}L</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Total Open Value</div>
        </div>
        {agingBuckets.map((b, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: b.color }}>{b.count}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{b.label}</div>
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

      {/* Tab 0: Open Credit Notes */}
      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-3.5">Open Credit Notes</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>{['CN No.', 'Party', 'Against', 'Amount', 'Date', 'Days Open', 'Reason', 'Status', 'Action'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {creditNotes.map((cn, i) => (
                  <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors ${cn.daysOpen >= 7 && cn.status === 'Open' ? 'bg-amber-50/40' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 align-middle font-semibold text-red-700">{cn.id}</td>
                    <td className="px-4 py-3 align-middle font-semibold">{cn.party}</td>
                    <td className="px-4 py-3 align-middle font-mono text-[11px]">{cn.against}</td>
                    <td className="px-4 py-3 align-middle font-bold text-green-600">{cn.amount}</td>
                    <td className="px-4 py-3 align-middle text-gray-500">{cn.date}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`font-bold text-sm ${cn.daysOpen >= 14 ? 'text-red-500' : cn.daysOpen >= 7 ? 'text-amber-500' : 'text-green-600'}`}>{cn.daysOpen}d</span>
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-gray-500">{cn.reason}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={cn.status} type={cn.status === 'Closed' ? 'success' : 'warning'} /></td>
                    <td className="px-4 py-3 align-middle">
                      {cn.status === 'Open' && (
                        <button className="px-2 py-1 text-[11px] rounded bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">Send Reminder</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Aging & Reminders */}
      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Aging Buckets</div>
            {agingBuckets.map((b, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold" style={{ color: b.color }}>{b.label}</span>
                  <span className="font-bold">{b.count} notes</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(b.count / creditNotes.length) * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm font-bold text-gray-800 mb-3">Overdue Reminders</div>
              {creditNotes.filter(c => c.daysOpen >= 7 && c.status === 'Open').map((cn, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="font-semibold text-sm">{cn.id} — {cn.party}</div>
                    <div className="text-xs text-gray-400">{cn.amount} · {cn.daysOpen} days open</div>
                  </div>
                  <button className="px-2 py-1 text-[11px] rounded bg-amber-100 text-amber-800 font-semibold border-0 cursor-pointer font-[inherit]">Remind</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-4">Reminder Log</div>
            {[
              { cn: 'CN-2024-009', party: 'TVS Motor', sent: '12 Apr, 10:00 AM', type: 'Email', status: 'Sent' },
              { cn: 'CN-2024-005', party: 'Bajaj Auto', sent: '10 Apr, 09:00 AM', type: 'Email', status: 'Sent' },
              { cn: 'CN-2024-005', party: 'Bajaj Auto', sent: '13 Apr, 09:00 AM', type: 'Escalation', status: 'Sent' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <div>
                  <div className="font-semibold text-sm">{r.cn} — {r.party}</div>
                  <div className="text-xs text-gray-400">{r.type} · {r.sent}</div>
                </div>
                <StatusBadge status={r.status} type="success" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Escalation Rules */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-bold text-gray-800">Auto-Escalation Rules</div>
              <div className="text-xs text-gray-400 mt-0.5">Configure automatic reminders and escalations</div>
            </div>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-red-400 to-red-700 text-white font-semibold border-0 cursor-pointer font-[inherit]">+ Add Rule</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr>{['Trigger (Days)', 'Action', 'Status', 'Toggle'].map(h => (
                  <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {escalationRules.map((rule, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 align-middle font-bold text-red-700">{rule.days} days</td>
                    <td className="px-4 py-3 align-middle font-semibold">{rule.action}</td>
                    <td className="px-4 py-3 align-middle"><StatusBadge status={rule.enabled ? 'Active' : 'Inactive'} type={rule.enabled ? 'success' : 'gray'} /></td>
                    <td className="px-4 py-3 align-middle">
                      <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${rule.enabled ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${rule.enabled ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showReminder} onClose={() => setShowReminder(false)} title="Overdue Credit Notes">
        <div className="flex flex-col gap-2">
          {loginAlert.map((cn, i) => (
            <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="font-bold text-sm text-amber-800">{cn.id} — {cn.party}</div>
              <div className="text-xs text-amber-700 mt-0.5">{cn.amount} · {cn.daysOpen} days open · {cn.reason}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
