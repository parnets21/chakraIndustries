import StatusBadge from '../../components/common/StatusBadge';

const pendingApprovals = [
  { id: 'PO-2024-089', type: 'Purchase Order',       amount: '₹4,82,000', requestedBy: 'Ravi Sharma',  dept: 'Procurement', age: '2d', level: 'L2 — Manager',  status: 'Pending'   },
  { id: 'PR-2024-034', type: 'Purchase Requisition', amount: '₹1,20,000', requestedBy: 'Priya Nair',   dept: 'Production',  age: '1d', level: 'L1 — HOD',      status: 'Pending'   },
  { id: 'RFQ-2024-012',type: 'RFQ',                  amount: '₹8,40,000', requestedBy: 'Amit Patel',   dept: 'Procurement', age: '3d', level: 'L3 — Director',  status: 'Pending'   },
  { id: 'PO-2024-085', type: 'Purchase Order',       amount: '₹2,10,000', requestedBy: 'Suresh Jain',  dept: 'Maintenance', age: '4d', level: 'L2 — Manager',  status: 'Escalated' },
];

export default function ApprovalsPage() {
  const th = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
  const td = 'px-4 py-3 text-sm text-gray-800 align-middle';

  return (
    <div>
      <div className="mb-4">
        <div className="text-xl font-black text-gray-900 tracking-tight">Multi-Level Approval System</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs text-gray-400">Procurement</span>
          <span className="text-xs text-gray-400">›</span>
          <span className="text-xs text-red-600 font-semibold">Approvals</span>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="text-sm font-bold text-gray-800">Pending Approvals</div>
          <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">{pendingApprovals.length}</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr>{['Doc ID','Type','Amount','Requested By','Dept','Age','Level','Status','Actions'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {pendingApprovals.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors">
                  <td className={`${td} font-semibold text-red-700`}>{a.id}</td>
                  <td className={td}>{a.type}</td>
                  <td className={`${td} font-bold`}>{a.amount}</td>
                  <td className={td}>{a.requestedBy}</td>
                  <td className={td}>{a.dept}</td>
                  <td className={`${td} font-bold ${parseInt(a.age) > 2 ? 'text-red-500' : 'text-amber-500'}`}>{a.age}</td>
                  <td className={td}>{a.level}</td>
                  <td className={td}><StatusBadge status={a.status} type={a.status === 'Escalated' ? 'danger' : 'warning'} /></td>
                  <td className={td}>
                    <div className="flex gap-1.5">
                      <button className="px-3 py-1.5 text-xs rounded-lg bg-green-100 text-green-800 font-semibold border-0 cursor-pointer font-[inherit]">✓ Approve</button>
                      <button className="px-3 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 font-semibold border-0 cursor-pointer font-[inherit]">✗ Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
