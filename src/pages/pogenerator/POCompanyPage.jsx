import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import Modal from '../../components/common/Modal';
import {
  MdBusiness, MdArrowBack, MdEdit, MdSave, MdClose,
  MdCheckCircle, MdWarning, MdRefresh, MdUploadFile,
  MdReceipt, MdArrowForward,
} from 'react-icons/md';

const money   = (v) => `Rs. ${Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('en-IN',{dateStyle:'medium'}) : '—';
const fmtDT   = (v) => v ? new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '—';

const DS = {
  Pending:          { bg:'#fef9c3', color:'#92400e', border:'#fde68a' },
  Sent:             { bg:'#f0fdf4', color:'#15803d', border:'#bbf7d0' },
  'Not Sent':       { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  'Partially Sent': { bg:'#eff6ff', color:'#1d4ed8', border:'#bfdbfe' },
};

function Chip({ label, value, icon, gradient }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:14, padding:'14px 16px', position:'relative', overflow:'hidden', boxShadow:'0 2px 8px rgba(15,23,42,0.04)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:gradient, borderRadius:'14px 14px 0 0' }} />
      <div style={{ fontSize:20, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:24, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
    </div>
  );
}

export default function POCompanyPage() {
  const { companyId: paramId } = useParams();
  const navigate = useNavigate();

  const [companies, setCompanies]               = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedId, setSelectedId]             = useState(paramId || '');
  const [items, setItems]                       = useState([]);
  const [itemsLoading, setItemsLoading]         = useState(false);
  const [itemsError, setItemsError]             = useState('');
  const [dateFrom, setDateFrom]                 = useState('');
  const [dateTo, setDateTo]                     = useState('');
  const [editingItem, setEditingItem]           = useState(null);
  const [editForm, setEditForm]                 = useState({});
  const [savingItem, setSavingItem]             = useState(false);
  const [viewInvoice, setViewInvoice]           = useState(null);
  const [viewLoading, setViewLoading]           = useState('');

  const selectedCo = companies.find(c => String(c._id) === String(selectedId));

  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const res = await poGeneratorApi.getCompaniesSummary();
      const list = res.data || [];
      setCompanies(list);
      if (!selectedId && list.length) setSelectedId(String(list[0]._id));
    } catch (e) { console.error(e); }
    finally { setCompaniesLoading(false); }
  }, []); // eslint-disable-line

  const loadItems = useCallback(async (id) => {
    if (!id) return;
    setItemsLoading(true); setItemsError('');
    try {
      const res = await poGeneratorApi.getCompanyItems(id);
      setItems(res.data || []);
    } catch (e) { setItemsError(e.message || 'Failed to load'); }
    finally { setItemsLoading(false); }
  }, []);

  useEffect(() => { loadCompanies(); }, []); // eslint-disable-line

  useEffect(() => {
    if (selectedId) {
      loadItems(selectedId);
      navigate(`/po-generator/companies/${selectedId}`, { replace: true });
    }
  }, [selectedId]); // eslint-disable-line

  const filtered = items.filter(it => {
    const d = new Date(it.invoiceCreatedAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const totalItems   = filtered.length;
  const sentItems    = filtered.filter(i => i.dispatchStatus === 'Sent').length;
  const notSentItems = filtered.filter(i => i.dispatchStatus === 'Not Sent').length;
  const pendingItems = filtered.filter(i => !i.dispatchStatus || i.dispatchStatus === 'Pending' || i.dispatchStatus === 'Partially Sent').length;
  const totalValue   = filtered.reduce((s, i) => s + (i.lineTotal || 0), 0);

  const openEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      dispatchStatus:   item.dispatchStatus || 'Pending',
      notSentReason:    item.notSentReason  || '',
      expectedSendDate: item.expectedSendDate ? new Date(item.expectedSendDate).toISOString().split('T')[0] : '',
      dispatchRemarks:  item.dispatchRemarks || '',
    });
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    setSavingItem(true);
    try {
      const res = await poGeneratorApi.updateItemDispatch(editingItem.invoiceId, editingItem._id, editForm);
      setItems(prev => prev.map(it => String(it._id) === String(editingItem._id) ? { ...it, ...res.data } : it));
      loadCompanies();
      setEditingItem(null);
    } catch (e) { alert(e.message || 'Save failed'); }
    finally { setSavingItem(false); }
  };

  const viewInv = async (invoiceId) => {
    setViewLoading(String(invoiceId));
    try { const res = await poGeneratorApi.getInvoiceById(invoiceId); setViewInvoice(res.data); }
    catch (e) { alert(e.message); }
    finally { setViewLoading(''); }
  };

  const pct = selectedCo && selectedCo.totalItems > 0
    ? Math.round((selectedCo.sentItems / selectedCo.totalItems) * 100) : 0;

  return (
    <div style={{ padding:'24px 28px', background:'#f1f5f9', minHeight:'100vh', fontFamily:'inherit' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => navigate('/po-generator')}
            style={{ width:36, height:36, border:'1.5px solid #e2e8f0', borderRadius:10, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#64748b' }}>
            <MdArrowBack size={18} />
          </button>
          <div style={{ width:40, height:40, borderRadius:11, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(99,102,241,0.3)' }}>
            <MdBusiness size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:20, fontWeight:900, color:'#0f172a', margin:0 }}>PO Companies</h1>
            <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>Company-wise PO item tracking — detected from uploaded PO PDFs</p>
          </div>
        </div>
        <button onClick={() => navigate('/po-generator/upload')}
          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(99,102,241,0.3)' }}>
          <MdUploadFile size={16} /> Upload PO PDF
        </button>
      </div>

      {/* Company selector card */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8edf2', padding:'16px 20px', marginBottom:18, boxShadow:'0 2px 8px rgba(15,23,42,0.05)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <MdBusiness size={19} color="#fff" />
        </div>
        <div style={{ flex:1, minWidth:220 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:4 }}>Select Company</div>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ width:'100%', height:40, padding:'0 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontFamily:'inherit', fontWeight:700, color:'#0f172a', background:'#f8fafc', outline:'none', cursor:'pointer' }}>
            <option value="">— Select a company —</option>
            {companiesLoading
              ? <option disabled>Loading…</option>
              : companies.map(co => (
                <option key={co._id} value={co._id}>
                  {co.companyName} ({co.invoiceCount} inv · {co.sentItems}/{co.totalItems} sent)
                </option>
              ))
            }
          </select>
        </div>
        {selectedCo && (
          <div style={{ minWidth:200, flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>Dispatch progress</span>
              <span style={{ fontSize:11, fontWeight:800, color:'#6366f1' }}>{pct}%</span>
            </div>
            <div style={{ height:8, borderRadius:99, background:'#e0e7ff', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:99, width:`${pct}%`, transition:'width 0.6s ease', background: pct === 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#6366f1,#4f46e5)' }} />
            </div>
            <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>
              {selectedCo.sentItems} sent · {selectedCo.notSentItems} not sent · {selectedCo.pendingItems} pending
            </div>
          </div>
        )}
        <button onClick={() => { loadCompanies(); if (selectedId) loadItems(selectedId); }}
          style={{ height:40, width:40, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #e2e8f0', borderRadius:10, background:'#f8fafc', color:'#475569', cursor:'pointer', flexShrink:0 }}>
          <MdRefresh size={17} style={{ animation: (companiesLoading || itemsLoading) ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Detail area */}
      {!selectedId ? (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8edf2', padding:'64px 32px', textAlign:'center', boxShadow:'0 2px 8px rgba(15,23,42,0.05)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏢</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#334155', marginBottom:6 }}>Select a Company</div>
          <div style={{ fontSize:13, color:'#94a3b8' }}>Choose a company from the dropdown above to view its PO items</div>
          {companies.length === 0 && !companiesLoading && (
            <button onClick={() => navigate('/po-generator/upload')}
              style={{ marginTop:20, display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <MdUploadFile size={16} /> Upload Your First PO PDF
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Company banner */}
          <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#312e81 100%)', borderRadius:16, padding:'20px 24px', position:'relative', overflow:'hidden', boxShadow:'0 6px 24px rgba(15,23,42,0.18)' }}>
            <div style={{ position:'absolute', top:-40, right:80, width:160, height:160, borderRadius:'50%', background:'rgba(99,102,241,0.08)', pointerEvents:'none' }} />
            <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'rgba(99,102,241,0.2)', border:'1.5px solid rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <MdBusiness size={26} color="#a5b4fc" />
                </div>
                <div>
                  <div style={{ fontSize:20, fontWeight:900, color:'#f1f5f9' }}>{selectedCo?.companyName || '—'}</div>
                  {selectedCo?.gstNumber && (
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>GSTIN: {selectedCo.gstNumber}</div>
                  )}
                  <div style={{ fontSize:11, color:'#64748b', marginTop:1 }}>
                    {selectedCo?.invoiceCount} invoice{selectedCo?.invoiceCount !== 1 ? 's' : ''} · Last upload: {fmtDate(selectedCo?.lastUpload)}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => loadItems(selectedId)} disabled={itemsLoading}
                  style={{ height:36, width:36, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(99,102,241,0.3)', borderRadius:9, background:'rgba(99,102,241,0.1)', color:'#a5b4fc', cursor:'pointer' }}>
                  <MdRefresh size={16} style={{ animation: itemsLoading ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                <button onClick={() => navigate('/po-generator/invoice-history')}
                  style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', border:'1px solid rgba(99,102,241,0.3)', borderRadius:9, background:'rgba(99,102,241,0.1)', color:'#a5b4fc', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  <MdReceipt size={14} /> Invoices <MdArrowForward size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* KPI chips */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12 }}>
            <Chip label="Total Items" value={itemsLoading ? '—' : totalItems}   icon="📋" gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)" />
            <Chip label="Sent"        value={itemsLoading ? '—' : sentItems}    icon="✅" gradient="linear-gradient(135deg,#22c55e,#15803d)" />
            <Chip label="Not Sent"    value={itemsLoading ? '—' : notSentItems} icon="⛔" gradient="linear-gradient(135deg,#ef4444,#b91c1c)" />
            <Chip label="Pending"     value={itemsLoading ? '—' : pendingItems} icon="⏳" gradient="linear-gradient(135deg,#f59e0b,#b45309)" />
            <Chip label="Total Value" value={itemsLoading ? '—' : money(totalValue)} icon="💰" gradient="linear-gradient(135deg,#a855f7,#7c3aed)" />
          </div>

          {/* Date filter */}
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e8edf2', padding:'12px 18px', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(15,23,42,0.04)' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#475569' }}>Filter by upload date:</span>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9 }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8' }}>From</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ border:'none', background:'transparent', fontSize:12, fontFamily:'inherit', color:'#0f172a', outline:'none', cursor:'pointer' }} />
              <span style={{ color:'#cbd5e1' }}>—</span>
              <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8' }}>To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ border:'none', background:'transparent', fontSize:12, fontFamily:'inherit', color:'#0f172a', outline:'none', cursor:'pointer' }} />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                  style={{ display:'flex', border:'none', background:'none', cursor:'pointer', color:'#94a3b8', padding:2 }}>
                  <MdClose size={13} />
                </button>
              )}
            </div>
            {(dateFrom || dateTo) && (
              <span style={{ fontSize:11, color:'#6366f1', fontWeight:600 }}>
                Showing {filtered.length} of {items.length} items
              </span>
            )}
          </div>

          {/* Items table */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e8edf2', overflow:'hidden', boxShadow:'0 2px 8px rgba(15,23,42,0.05)' }}>
            {itemsError && (
              <div style={{ margin:'14px 18px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13 }}>{itemsError}</div>
            )}
            <div style={{ overflowX:'auto' }}>
              {itemsLoading ? (
                <div style={{ padding:'48px', textAlign:'center', color:'#94a3b8' }}>
                  <div style={{ width:22, height:22, border:'2px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 10px' }} />
                  Loading items…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding:'56px 32px', textAlign:'center' }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#334155', marginBottom:6 }}>
                    {items.length === 0 ? 'No items yet' : 'No items match the date filter'}
                  </div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>
                    {items.length === 0 ? 'Upload a PO PDF tagged to this company' : 'Clear the date filter to see all items'}
                  </div>
                  {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                      style={{ marginTop:14, padding:'7px 16px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                      Clear date filter
                    </button>
                  )}
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'linear-gradient(135deg,#0f172a,#1e1b4b)' }}>
                      {['#','Item','HSN','Qty','Rate','Total','Invoice','PO Ref','Upload Date','Dispatch Status','Actions'].map(h => (
                        <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.7px', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, ri) => {
                      const sc = DS[item.dispatchStatus] || DS.Pending;
                      return (
                        <tr key={String(item._id)} style={{ borderBottom:'1px solid #f8fafc' }}
                          onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'11px 14px', color:'#94a3b8', fontWeight:700 }}>{ri + 1}</td>
                          <td style={{ padding:'11px 14px', color:'#1e293b', fontWeight:600, minWidth:160 }}>{item.itemName}</td>
                          <td style={{ padding:'11px 14px', color:'#64748b' }}>{item.hsn || '—'}</td>
                          <td style={{ padding:'11px 14px', color:'#475569', whiteSpace:'nowrap' }}>{item.invoicedQty} {item.unit}</td>
                          <td style={{ padding:'11px 14px', color:'#475569', whiteSpace:'nowrap' }}>{money(item.basePrice)}</td>
                          <td style={{ padding:'11px 14px', color:'#c0392b', fontWeight:800, whiteSpace:'nowrap' }}>{money(item.lineTotal)}</td>
                          <td style={{ padding:'11px 14px' }}>
                            <button onClick={() => viewInv(item.invoiceId)} disabled={viewLoading === String(item.invoiceId)}
                              style={{ background:'none', border:'none', cursor:'pointer', color:'#6366f1', fontWeight:700, fontSize:11, padding:0, fontFamily:'inherit', textDecoration:'underline' }}>
                              {item.invoiceNo}
                            </button>
                          </td>
                          <td style={{ padding:'11px 14px', color:'#c0392b', fontWeight:700 }}>{item.poRef || '—'}</td>
                          <td style={{ padding:'11px 14px', color:'#94a3b8', fontSize:11, whiteSpace:'nowrap' }}>{fmtDT(item.invoiceCreatedAt)}</td>
                          <td style={{ padding:'11px 14px' }}>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
                              {item.dispatchStatus === 'Sent' && <MdCheckCircle size={11} />}
                              {item.dispatchStatus === 'Not Sent' && <MdWarning size={11} />}
                              {item.dispatchStatus || 'Pending'}
                            </span>
                            {item.dispatchStatus === 'Not Sent' && item.notSentReason && (
                              <div style={{ fontSize:10, color:'#dc2626', marginTop:3, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={item.notSentReason}>⚠ {item.notSentReason}</div>
                            )}
                            {item.expectedSendDate && item.dispatchStatus !== 'Sent' && (
                              <div style={{ fontSize:10, color:'#7c3aed', marginTop:2 }}>📅 {fmtDate(item.expectedSendDate)}</div>
                            )}
                          </td>
                          <td style={{ padding:'11px 14px' }}>
                            <button onClick={() => openEdit(item)}
                              style={{ width:32, height:32, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1px solid #e0e7ff', borderRadius:8, background:'#eef2ff', color:'#6366f1', cursor:'pointer' }}>
                              <MdEdit size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:'#f8fafc', borderTop:'2px solid #e2e8f0' }}>
                      <td colSpan={5} style={{ padding:'10px 14px', fontWeight:700, color:'#64748b', fontSize:12 }}>
                        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
                        {(dateFrom || dateTo) && <span style={{ marginLeft:6, fontSize:11, color:'#94a3b8', fontWeight:400 }}>(filtered)</span>}
                      </td>
                      <td style={{ padding:'10px 14px', fontWeight:900, color:'#c0392b', fontSize:13 }}>{money(totalValue)}</td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Edit dispatch modal */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)}
        title={editingItem ? `Update Dispatch — ${editingItem.itemName}` : ''} size="md"
        footer={
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setEditingItem(null)} style={{ padding:'8px 18px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={saveEdit} disabled={savingItem}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:savingItem?'not-allowed':'pointer', fontFamily:'inherit', opacity:savingItem?0.7:1 }}>
              <MdSave size={15} />{savingItem ? 'Saving…' : 'Save'}
            </button>
          </div>
        }>
        {editingItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'#f8fafc', border:'1px solid #e8edf2', borderRadius:10, padding:'12px 14px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[['Item', editingItem.itemName],['Qty',`${editingItem.invoicedQty} ${editingItem.unit}`],['Invoice', editingItem.invoiceNo]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Dispatch Status</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['Pending','Sent','Not Sent','Partially Sent'].map(s => {
                  const sc = DS[s]; const active = editForm.dispatchStatus === s;
                  return (
                    <button key={s} onClick={() => setEditForm(f => ({ ...f, dispatchStatus:s }))}
                      style={{ padding:'7px 16px', borderRadius:8, border:`2px solid ${active ? sc.border : '#e2e8f0'}`, background: active ? sc.bg : '#fff', color: active ? sc.color : '#64748b', fontWeight: active ? 700 : 500, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            {(editForm.dispatchStatus === 'Not Sent' || editForm.dispatchStatus === 'Partially Sent') && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Reason for Not Sending</label>
                <input value={editForm.notSentReason} onChange={e => setEditForm(f => ({ ...f, notSentReason:e.target.value }))}
                  placeholder="e.g. Stock unavailable, In transit…"
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #fecaca', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
              </div>
            )}
            {editForm.dispatchStatus !== 'Sent' && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Expected Send Date</label>
                <input type="date" value={editForm.expectedSendDate} onChange={e => setEditForm(f => ({ ...f, expectedSendDate:e.target.value }))}
                  style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Remarks</label>
              <textarea value={editForm.dispatchRemarks} onChange={e => setEditForm(f => ({ ...f, dispatchRemarks:e.target.value }))}
                placeholder="Any additional notes…" rows={3}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
            </div>
          </div>
        )}
      </Modal>

      {/* View invoice modal */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice: ${viewInvoice?.invoiceNo || ''}`} size="lg"
        footer={<button onClick={() => setViewInvoice(null)} style={{ padding:'8px 20px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Close</button>}>
        {viewInvoice && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
              {[['PO Ref', viewInvoice.poRef||'—'],['Invoice', viewInvoice.invoiceNo||'—'],['Vendor', viewInvoice.vendorName||'—'],['Status', viewInvoice.status||'—'],['Total', money(viewInvoice.grandTotal)]].map(([l,v]) => (
                <div key={l} style={{ border:'1px solid #e8edf2', borderRadius:10, padding:'10px 14px', background:'#f8fafc' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ overflowX:'auto', border:'1px solid #e8edf2', borderRadius:12 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    {['#','Item','HSN','Qty','Rate','Taxable','Total'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.6px', borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(viewInvoice.items||[]).map((it,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f5f3ff'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'10px 12px', color:'#94a3b8', fontWeight:700 }}>{i+1}</td>
                      <td style={{ padding:'10px 12px', color:'#334155', minWidth:180, fontWeight:500 }}>{it.itemName||'—'}</td>
                      <td style={{ padding:'10px 12px', color:'#64748b' }}>{it.hsn||'—'}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{Number(it.invoicedQty||0).toLocaleString('en-IN')} {it.unit||''}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{money(it.basePrice)}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{money(it.taxableValue)}</td>
                      <td style={{ padding:'10px 12px', color:'#c0392b', fontWeight:800, whiteSpace:'nowrap' }}>{money(it.lineTotal)}</td>
                    </tr>
                  ))}
                  {!(viewInvoice.items||[]).length && (
                    <tr><td colSpan={7} style={{ padding:24, textAlign:'center', color:'#94a3b8' }}>No items found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
