import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import { creditNoteApi } from '../../api/creditNoteApi';
import { materialReturnApi } from '../../api/materialReturnApi';
import { toast } from '../../components/common/Toast';

const EMPTY_FORM = {
  vendorName: '', vendorEmail: '', vendorGST: '', vendorAddress: '',
  grnId: '', poId: '', invoiceNumber: '',
  amount: 0, reason: '',
  items: [{ productName: '', quantity: 1, rate: 0, amount: 0, gstRate: 18 }],
  attachments: []
};

const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder:text-gray-400 font-[inherit]';
const lbl = 'text-xs font-semibold text-gray-600';
const fld = 'flex flex-col gap-1.5';

export default function CreditNotePage({ initialTab = 0 }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [creditNotes, setCreditNotes] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, posted: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    if (location.state?.invoice) {
      const inv = location.state.invoice;
      setShowCreate(true);
      setForm({
        ...EMPTY_FORM,
        vendorName: inv.vendorName || '',
        invoiceNumber: inv.invoiceNo || '',
        grnId: inv.poRef || inv.grnRef || '',
        poId: inv.poRef || '',
        amount: inv.grandTotal || 0,
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
      const [notesRes, returnsRes] = await Promise.all([
        creditNoteApi.getAll(),
        materialReturnApi.getAll()
      ]);
      setCreditNotes(notesRes.data || []);
      const total = notesRes.data?.length || 0;
      const pending = notesRes.data?.filter(cn => cn.status === 'Open').length || 0;
      const approved = notesRes.data?.filter(cn => cn.status === 'Closed').length || 0;
      setStats({ total, pending, approved, posted: 0 });
      setReturns(returnsRes.data || []);
      if (!selected && notesRes.data?.length > 0) setSelected(notesRes.data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.vendorName || !form.amount || !form.reason) {
      toast('Vendor Name, Amount, and Reason are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await creditNoteApi.create(form);
      setShowCreate(false);
      setForm({ ...EMPTY_FORM });
      await fetchAll();
      toast('Credit note created successfully');
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
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
      
      return {
        ...prev,
        items: newItems,
        amount: totalAmount
      };
    });
  };

  const kpis = [
    { label: 'Total Credit Notes', value: stats.total || 0, color: '#3b82f6' },
    { label: 'Open', value: stats.pending || 0, color: '#f59e0b' },
    { label: 'Closed', value: stats.approved || 0, color: '#10b981' },
    { label: 'Posted', value: stats.posted || 0, color: '#8b5cf6' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Credit Note Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor credit notes</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 10,
          background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          boxShadow: '0 3px 10px rgba(59,130,246,0.3)',
        }}>+ New Credit Note</button>
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

      {/* Credit Notes List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="text-sm font-bold text-gray-800 mb-3.5">Credit Notes ({creditNotes.length})</div>
            {creditNotes.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No credit notes yet. Click "+ New Credit Note" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr>{['CN ID', 'Vendor', 'GRN/PO', 'Amount', 'Status'].map(h => (
                      <th key={h} className="bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {creditNotes.map((cn) => (
                      <tr key={cn._id} onClick={() => setSelected(cn)}
                        className={`border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${selected?._id === cn._id ? 'bg-blue-50/60' : 'hover:bg-blue-50/40'}`}>
                        <td className="px-4 py-3 font-semibold text-blue-700">{cn.cnId}</td>
                        <td className="px-4 py-3 font-semibold">{cn.vendorName}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{cn.grnId || cn.poId || '—'}</td>
                        <td className="px-4 py-3 font-bold">₹{(cn.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${
                            cn.status === 'Closed' ? 'bg-green-500' :
                            cn.status === 'Disputed' ? 'bg-red-500' : 'bg-amber-500'
                          }`}>{cn.status}</span>
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

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Credit Note" size="xl" footer={
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowCreate(false)} style={{
            padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
          }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving} style={{
            padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
          }}>{saving ? 'Saving...' : 'Create Credit Note'}</button>
        </div>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fld}>
              <label className={lbl}>Vendor Name</label>
              <input type="text" placeholder="Enter vendor name" className={inp} value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
            </div>
            <div className={fld}>
              <label className={lbl}>Vendor Email</label>
              <input type="email" placeholder="Enter vendor email" className={inp} value={form.vendorEmail} onChange={(e) => setForm({ ...form, vendorEmail: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fld}>
              <label className={lbl}>Vendor GST</label>
              <input type="text" placeholder="Enter vendor GST" className={inp} value={form.vendorGST} onChange={(e) => setForm({ ...form, vendorGST: e.target.value })} />
            </div>
            <div className={fld}>
              <label className={lbl}>Vendor Address</label>
              <input type="text" placeholder="Enter vendor address" className={inp} value={form.vendorAddress} onChange={(e) => setForm({ ...form, vendorAddress: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={fld}>
              <label className={lbl}>GRN ID</label>
              <input type="text" placeholder="Enter GRN ID" className={inp} value={form.grnId} onChange={(e) => setForm({ ...form, grnId: e.target.value })} />
            </div>
            <div className={fld}>
              <label className={lbl}>PO ID</label>
              <input type="text" placeholder="Enter PO ID" className={inp} value={form.poId} onChange={(e) => setForm({ ...form, poId: e.target.value })} />
            </div>
            <div className={fld}>
              <label className={lbl}>Invoice Number</label>
              <input type="text" placeholder="Enter invoice number" className={inp} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={fld}>
              <label className={lbl}>Amount</label>
              <input type="number" placeholder="Enter amount" className={inp} value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className={fld}>
              <label className={lbl}>Reason</label>
              <input type="text" placeholder="Enter reason" className={inp} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <label className={lbl}>Items</label>
              <button type="button" onClick={addItem} className="text-blue-600 text-xs font-bold">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end border border-gray-200 rounded-lg p-3">
                  <div className="flex-1">
                    <label className={lbl}>Product</label>
                    <input type="text" className={inp} placeholder="Product name" value={item.productName} onChange={(e) => updateItem(index, 'productName', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <label className={lbl}>Qty</label>
                    <input type="number" className={inp} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <label className={lbl}>Rate</label>
                    <input type="number" className={inp} placeholder="Rate" value={item.rate} onChange={(e) => updateItem(index, 'rate', e.target.value)} />
                  </div>
                  <div className="w-24">
                    <label className={lbl}>Amount</label>
                    <input type="number" className={inp} placeholder="Amount" value={item.amount} readOnly />
                  </div>
                  <div className="w-20">
                    <label className={lbl}>GST %</label>
                    <input type="number" className={inp} placeholder="GST" value={item.gstRate} onChange={(e) => updateItem(index, 'gstRate', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeItem(index)} className="text-red-500 text-xl pb-2">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}