import { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/common/Modal';
import { creditNoteApi } from '../../api/creditNoteApi';
import { materialReturnApi } from '../../api/materialReturnApi';
import { toast } from '../../components/common/Toast';

const EMPTY_FORM = {
  customerName: '', invoiceNo: '', returnId: '', creditAmount: 0,
  reason: '', gstAmount: 0, totalAmount: 0, approvalStatus: 'Pending',
  items: [{ productName: '', quantity: 1, rate: 0, amount: 0, gstRate: 18 }],
  attachments: [], customerEmail: '', customerGST: '', customerAddress: ''
};

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const lbl = 'text-xs font-semibold text-gray-600';
const fld = 'flex flex-col gap-1.5';

export default function CreditNotePage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [creditNotes, setCreditNotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, posted: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, statsRes, returnsRes] = await Promise.all([
        creditNoteApi.getAll(),
        creditNoteApi.getStats(),
        materialReturnApi.getAll()
      ]);
      setCreditNotes(notesRes.data || []);
      setStats(statsRes.data || {});
      setReturns(returnsRes.data || []);
      if (!selected && notesRes.data?.length > 0) setSelected(notesRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const kpis = [
    { label: 'Total Credit Notes', value: stats.total || 0, color: '#3b82f6' },
    { label: 'Pending Approval', value: stats.pending || 0, color: '#f59e0b' },
    { label: 'Approved', value: stats.approved || 0, color: '#10b981' },
    { label: 'Posted to Accounts', value: stats.posted || 0, color: '#8b5cf6' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Credit Note Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer credit notes for returns and adjustments</p>
        </div>
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

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-sm text-gray-500">Loading credit notes...</div>
        </div>
      )}

      {!loading && creditNotes.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm">No credit notes found</div>
        </div>
      )}

      {!loading && creditNotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Credit Note #</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {creditNotes.map((cn, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                      <td className="py-3 px-2 text-sm">{cn.creditNoteNo || `CN-${cn._id?.slice(-6)}`}</td>
                      <td className="py-3 px-2 text-sm">{cn.customerName}</td>
                      <td className="py-3 px-2 text-sm">₹{(cn.creditAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          cn.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                          cn.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {cn.approvalStatus}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">{new Date(cn.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}