import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import { debitNoteApi } from '../../api/debitNoteApi';
import { grnApi } from '../../api/grnApi';
import { poApi } from '../../api/poApi';
import { toast } from '../../components/common/Toast';

const EMPTY_FORM = {
  vendorName: '', grnId: '', poId: '', debitAmount: 0,
  reason: '', gstAmount: 0, totalAmount: 0, approvalStatus: 'Pending',
  damageType: 'Quality Rejection', recoveryAmount: 0, taxReversal: 0,
  items: [{ productName: '', quantity: 1, rate: 0, amount: 0, gstRate: 18 }],
  attachments: [], vendorEmail: '', vendorGST: '', vendorAddress: ''
};

const DAMAGE_TYPES = ['Quality Rejection', 'Damage in Transit', 'Wrong Item', 'Quantity Shortage', 'Expired Product'];

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const lbl = 'text-xs font-semibold text-gray-600';
const fld = 'flex flex-col gap-1.5';

export default function DebitNotePage({ initialTab = 0 }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [debitNotes, setDebitNotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, posted: 0 });
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [grns, setGrns] = useState([]);
  const [pos, setPOs] = useState([]);

  useEffect(() => {
    if (location.state?.invoice) {
      const inv = location.state.invoice;
      setShowCreate(true);
      setForm({
        ...EMPTY_FORM,
        vendorName: inv.vendorName || '',
        invoiceNo: inv.invoiceNo || '',
        grnId: inv.poRef || inv.grnRef || '',
        poId: inv.poRef || '',
        debitAmount: inv.grandTotal || 0,
        totalAmount: inv.grandTotal || 0,
        recoveryAmount: inv.grandTotal || 0,
        items: (inv.items || []).map(item => ({
          productName: item.itemName || item.description || '',
          quantity: item.quantity || item.invoicedQty || 1,
          rate: item.rate || item.basePrice || 0,
          amount: item.amount || item.lineTotal || 0,
          gstRate: item.gstRate || item.gst || 18
        }))
      });
    }
  }, [location.state]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, statsRes, grnsRes, posRes] = await Promise.all([
        debitNoteApi.getAll(),
        debitNoteApi.getStats(),
        grnApi.getAll(),
        poApi.getAll()
      ]);
      setDebitNotes(notesRes.data || []);
      setStats(statsRes.data || {});
      setGrns(grnsRes.data || []);
      setPOs(posRes.data || []);
      if (!selected && notesRes.data?.length > 0) setSelected(notesRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.vendorName || !form.debitAmount || !form.reason) {
      toast('Vendor Name, Debit Amount, and Reason are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await debitNoteApi.create(form);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      await fetchAll();
      toast('Debit note created successfully');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };
  const handleStatusUpdate = async (id, status) => {
    try {
      await debitNoteApi.updateStatus(id, status);
      await fetchAll();
      toast(`Status updated to ${status}`);
    } catch (e) { toast(e.message, 'error'); }
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', quantity: 1, rate: 0, amount: 0, gstRate: 18 }]
    }));
  };

  const removeItem = (index) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'rate') {
        const qty = field === 'quantity' ? parseFloat(value) || 0 : newItems[index].quantity;
        const rate = field === 'rate' ? parseFloat(value) || 0 : newItems[index].rate;
        newItems[index].amount = qty * rate;
      }
      
      const totalAmount = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const gstAmount = newItems.reduce((sum, item) => {
        const gst = (item.amount || 0) * (item.gstRate || 0) / 100;
        return sum + gst;
      }, 0);
      
      return {
        ...prev,
        items: newItems,
        debitAmount: totalAmount,
        gstAmount: gstAmount,
        totalAmount: totalAmount + gstAmount,
        recoveryAmount: totalAmount,
        taxReversal: gstAmount
      };
    });
  };

  const handleGRNSelect = (grnId) => {
    const grnData = grns.find(g => g.grnId === grnId);
    if (grnData) {
      setForm(prev => ({
        ...prev,
        grnId: grnData.grnId,
        poId: grnData.poId || '',
        vendorName: grnData.vendor?.name || grnData.vendor || '',
        vendorEmail: grnData.vendor?.email || '',
        vendorGST: grnData.vendor?.gstNo || '',
        vendorAddress: grnData.vendor?.address || '',
        items: grnData.items?.map(item => ({
          productName: item.productName || item.itemName || '',
          quantity: item.receivedQty || item.quantity || 1,
          rate: item.rate || item.price || 0,
          amount: (item.receivedQty || item.quantity || 1) * (item.rate || item.price || 0),
          gstRate: 18
        })) || [{ productName: '', quantity: 1, rate: 0, amount: 0, gstRate: 18 }]
      }));
    }
  };

  const handlePOSelect = (poId) => {
    const poData = pos.find(p => p.poId === poId);
    if (poData) {
      setForm(prev => ({
        ...prev,
        poId: poData.poId,
        vendorName: poData.vendor?.name || poData.vendor || '',
        vendorEmail: poData.vendor?.email || '',
        vendorGST: poData.vendor?.gstNo || '',
        vendorAddress: poData.vendor?.address || poData.shippingAddress || '',
        items: poData.items?.map(item => ({
          productName: item.productName || item.itemName || '',
          quantity: item.quantity || 1,
          rate: item.rate || item.price || 0,
          amount: (item.quantity || 1) * (item.rate || item.price || 0),
          gstRate: 18
        })) || [{ productName: '', quantity: 1, rate: 0, amount: 0, gstRate: 18 }]
      }));
    }
  };

  const kpis = [
    { label: 'Total Debit Notes', value: stats.total || 0, color: '#1c2833' },
    { label: 'Pending Approval', value: stats.pending || 0, color: '#f59e0b' },
    { label: 'Approved', value: stats.approved || 0, color: '#10b981' },
    { label: 'Posted to Ledger', value: stats.posted || 0, color: '#3b82f6' },
  ];

  const tabLabels = ['Vendor Info', 'GRN/PO Link', 'Damage/QC', 'Recovery Amount', 'Tax Reversal', 'Finance Approval', 'Posting'];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Debit Note Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor debit notes for quality rejections and damages</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10,
          background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
        }}>+ New Debit Note</button>
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
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
      )}

      {/* Debit Notes List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Debit Notes ({debitNotes.length})</div>
            {debitNotes.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No debit notes yet. Click "+ New Debit Note" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr>{['DN ID', 'Vendor', 'GRN/PO', 'Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {debitNotes.map((dn) => (
                      <tr key={dn._id} onClick={() => setSelected(dn)}
                        className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected?._id === dn._id ? 'bg-red-50/60' : 'hover:bg-red-50/40'}`}>
                        <td className="px-4 py-3 font-semibold text-red-700">{dn.dnId}</td>
                        <td className="px-4 py-3 font-semibold">{dn.vendorName}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{dn.grnId || dn.poId || '—'}</td>
                        <td className="px-4 py-3 font-bold">₹{(dn.totalAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                            dn.approvalStatus === 'Approved' ? 'bg-green-500' :
                            dn.approvalStatus === 'Rejected' ? 'bg-red-500' : 'bg-amber-500'
                          }`}>{dn.approvalStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {dn.approvalStatus === 'Pending' && (
                              <>
                                <button onClick={e => { e.stopPropagation(); handleStatusUpdate(dn._id, 'Approved'); }}
                                  className="px-2 py-1 text-[11px] rounded bg-green-100 text-green-700 border border-green-200 cursor-pointer font-[inherit]">
                                  Approve
                                </button>
                                <button onClick={e => { e.stopPropagation(); handleStatusUpdate(dn._id, 'Rejected'); }}
                                  className="px-2 py-1 text-[11px] rounded bg-red-100 text-red-700 border border-red-200 cursor-pointer font-[inherit]">
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}