import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import {
  MdSearch, MdReceipt, MdVisibility, MdCheckCircle,
  MdPrint, MdDownload, MdClose, MdArrowBack, MdDelete,
} from 'react-icons/md';
import Modal from '../../components/common/Modal';
import { CHAKRA_LOGO_B64 } from '../../assets/chakraLogoB64';

const STATUS_COLORS = {
  Draft:     { bg: '#f1f5f9', color: '#64748b' },
  Approved:  { bg: '#dcfce7', color: '#16a34a' },
  Sent:      { bg: '#dbeafe', color: '#1d4ed8' },
  Paid:      { bg: '#f0fdf4', color: '#15803d' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626' },
};

// ── Generate printable HTML for a POInvoice ───────────────────────────────────
function buildInvoiceHTML(inv) {
  const fmt  = (n) => `₹${(Number(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtD = (d) => { try { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'}); } catch { return d||'—'; } };

  const rows = (inv.items||[]).map((it,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${it.itemName||'—'}</td>
      <td style="text-align:right">${it.requestedQty} ${it.unit}</td>
      <td style="text-align:right;color:#1d4ed8;font-weight:700">${it.invoicedQty} ${it.unit}</td>
      <td style="text-align:right;color:${it.pendingQty>0?'#dc2626':'#94a3b8'};font-weight:${it.pendingQty>0?700:400}">${it.pendingQty>0?`${it.pendingQty} ${it.unit}`:'—'}</td>
      <td style="text-align:right">${fmt(it.basePrice)}</td>
      <td style="text-align:right">${it.gst}%</td>
      <td style="text-align:right;font-weight:700">${fmt(it.lineTotal)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Invoice ${inv.invoiceNo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:12px;color:#111;background:#fff}
.page{max-width:820px;margin:0 auto;padding:28px 32px;border:1px solid #ccc}
.top{text-align:right;font-size:10px;font-weight:700;letter-spacing:1px;margin-bottom:10px}
.top span{border:1px solid #999;padding:2px 10px;margin-left:8px}
.header{display:flex;align-items:flex-start;gap:14px;padding-bottom:14px;border-bottom:2px solid #111;margin-bottom:0}
.logo-wrap{flex-shrink:0}
.logo-wrap img{width:64px;height:64px;object-fit:contain;border-radius:6px}
.co-name{font-size:18px;font-weight:900;color:#111}
.co-detail{font-size:11px;color:#333;line-height:1.6;margin-top:3px}
.inv-box{text-align:right;min-width:200px}
.inv-box table{margin-left:auto;border-collapse:collapse}
.inv-box td{padding:2px 6px;font-size:12px}
.inv-box td:first-child{font-weight:700;text-align:right}
.party-grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;border-top:none}
.party-cell{padding:10px 12px}
.party-cell+.party-cell{border-left:1px solid #ccc}
.party-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#555;margin-bottom:4px}
.party-name{font-size:13px;font-weight:800;color:#111;margin-bottom:3px}
.items-wrap{border:1px solid #ccc;border-top:none}
table.items{width:100%;border-collapse:collapse}
table.items th{background:#f0f0f0;padding:7px 10px;font-size:10px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ccc;text-align:left}
table.items td{padding:7px 10px;font-size:12px;border-bottom:1px solid #eee;vertical-align:top}
.total-row td{font-weight:800;font-size:13px;background:#f5f5f5;border-top:2px solid #ccc}
.summary{border:1px solid #ccc;border-top:none;padding:12px 16px;display:flex;justify-content:flex-end}
.summary-box{min-width:260px}
.summary-row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}
.summary-total{display:flex;justify-content:space-between;border-top:2px solid #111;padding-top:8px;font-size:15px;font-weight:900;color:#c0392b}
.type-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-left:8px}
.partial{background:#fef9c3;color:#a16207}
.full{background:#dcfce7;color:#16a34a}
.footer{border:1px solid #ccc;border-top:none;padding:12px 16px;font-size:11px;color:#555;text-align:center}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{border:none;padding:10px}}
</style></head><body><div class="page">
<div class="top">PO INVOICE <span>${inv.invoiceType==='partial'?'PARTIAL':'FULL'}</span><span>ORIGINAL</span></div>
<div class="header">
  <div class="logo-wrap">
    <img src="${CHAKRA_LOGO_B64}" alt="Sri Chakra Industries" />
  </div>
  <div style="flex:1">
    <div class="co-name">Sri Chakra Industries</div>
    <div class="co-detail">#13/14, Azeez Sait Industrial Estate, Mysore Road, Nayandahalli, Bangalore - 560039<br/>GSTIN: 29ABWFS0002M1ZR</div>
  </div>
  <div class="inv-box">
    <table>
      <tr><td>Invoice No.</td><td>${inv.invoiceNo}</td></tr>
      <tr><td>Invoice Date</td><td>${fmtD(inv.createdAt)}</td></tr>
      <tr><td>PO Reference</td><td>${inv.poRef||'—'}</td></tr>
      <tr><td>Invoice Type</td><td><span class="type-badge ${inv.invoiceType}">${inv.invoiceType==='partial'?'Partial':'Full'}</span></td></tr>
    </table>
  </div>
</div>
<div class="party-grid">
  <div class="party-cell">
    <div class="party-label">Vendor / Supplier</div>
    <div class="party-name">${inv.vendorName||'—'}</div>
  </div>
  <div class="party-cell">
    <div class="party-label">Billed By</div>
    <div class="party-name">Sri Chakra Industries</div>
    <div style="font-size:11px;color:#333">#13/14, Mysore Road, Nayandahalli, Bangalore - 560039</div>
  </div>
</div>
<div class="items-wrap">
  <table class="items">
    <thead><tr>
      <th style="width:32px">#</th>
      <th>Item Name</th>
      <th style="text-align:right">Requested</th>
      <th style="text-align:right;color:#1d4ed8">Invoiced</th>
      <th style="text-align:right;color:#dc2626">Pending</th>
      <th style="text-align:right">Unit Price</th>
      <th style="text-align:right">GST</th>
      <th style="text-align:right">Line Total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr class="total-row">
      <td colspan="7" style="text-align:right;padding-right:12px">GRAND TOTAL</td>
      <td style="text-align:right">${fmt(inv.grandTotal)}</td>
    </tr></tfoot>
  </table>
</div>
<div class="summary">
  <div class="summary-box">
    <div class="summary-row"><span>Subtotal</span><span>${fmt(inv.subtotal)}</span></div>
    <div class="summary-row"><span>GST Total</span><span>${fmt(inv.gstTotal)}</span></div>
    <div class="summary-total"><span>Grand Total</span><span>${fmt(inv.grandTotal)}</span></div>
  </div>
</div>
${inv.notes?`<div style="border:1px solid #ccc;border-top:none;padding:10px 16px;font-size:12px;color:#475569"><strong>Notes:</strong> ${inv.notes}</div>`:''}
<div class="footer">This is a computer-generated invoice. All disputes subject to Bangalore jurisdiction only.</div>
</div></body></html>`;
}

export default function InvoiceHistoryPage() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const printRef  = useRef(null);

  const [invoices, setInvoices]     = useState([]);
  const [stats, setStats]           = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('');
  const [viewInv, setViewInv]       = useState(null);
  const [successMsg, setSuccessMsg] = useState(location.state?.successMsg || '');
  const [updating, setUpdating]     = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Delivery tracking state
  const [deliveryInv, setDeliveryInv]       = useState(null);   // invoice open in delivery modal
  const [deliveryItems, setDeliveryItems]   = useState([]);     // local editable copy of items
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [deliverySaved, setDeliverySaved]   = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const [invRes, statsRes] = await Promise.all([
        poGeneratorApi.listInvoices(params),
        poGeneratorApi.getStats(),
      ]);
      setInvoices(invRes.data || []);
      setStats(statsRes.data || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [filter]);

  useEffect(() => {
    if (successMsg) { const t = setTimeout(() => setSuccessMsg(''), 6000); return () => clearTimeout(t); }
  }, [successMsg]);

  // ── Print invoice ──────────────────────────────────────────────────────────
  const handlePrint = (inv) => {
    const w = window.open('', '_blank');
    w.document.write(buildInvoiceHTML(inv));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  // ── Download as HTML file ──────────────────────────────────────────────────
  const handleDownload = (inv) => {
    const html  = buildInvoiceHTML(inv);
    const blob  = new Blob([html], { type: 'text/html' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `${inv.invoiceNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdating(id);
    try {
      await poGeneratorApi.updateInvoiceStatus(id, status);
      fetchAll();
      if (viewInv?._id === id) setViewInv(prev => ({ ...prev, status }));
    } catch (e) { alert(e.message); }
    finally { setUpdating(null); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await poGeneratorApi.deleteInvoice(id);
      setSuccessMsg('Invoice deleted successfully');
      fetchAll();
      if (viewInv?._id === id) setViewInv(null);
      setDeleteConfirm(null);
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  // ── Delivery tracking ──────────────────────────────────────────────────────
  const openDeliveryModal = (inv) => {
    setDeliveryInv(inv);
    setDeliverySaved(false);
    // Build editable items list with current delivery state
    setDeliveryItems((inv.items || []).map(it => ({
      itemId:         it._id,
      itemName:       it.itemName,
      invoicedQty:    it.invoicedQty,
      unit:           it.unit,
      deliveryStatus: it.deliveryStatus || 'Pending',
      deliveredQty:   it.deliveredQty   ?? it.invoicedQty,
      deliveryDate:   it.deliveryDate   ? new Date(it.deliveryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      deliveryNotes:  it.deliveryNotes  || '',
    })));
  };

  const updateDeliveryItem = (idx, field, value) => {
    setDeliveryItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const markAllDelivered = () => {
    setDeliveryItems(prev => prev.map(it => ({
      ...it,
      deliveryStatus: 'Delivered',
      deliveredQty:   it.invoicedQty,
      deliveryDate:   it.deliveryDate || new Date().toISOString().split('T')[0],
    })));
  };

  const markAllNotDelivered = () => {
    setDeliveryItems(prev => prev.map(it => ({
      ...it,
      deliveryStatus: 'Not Delivered',
      deliveredQty:   0,
    })));
  };

  const saveDelivery = async () => {
    if (!deliveryInv) return;
    setSavingDelivery(true);
    try {
      const res = await poGeneratorApi.updateDelivery(deliveryInv._id, deliveryItems);
      setDeliverySaved(true);
      // Update the invoice in the list
      setInvoices(prev => prev.map(inv =>
        inv._id === deliveryInv._id ? { ...inv, ...res.data } : inv
      ));
      // Update viewInv if open
      if (viewInv?._id === deliveryInv._id) setViewInv(res.data);
      setTimeout(() => setDeliverySaved(false), 3000);
    } catch (e) { alert(e.message); }
    finally { setSavingDelivery(false); }
  };

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Invoice History</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>All PO-based invoices — view, print, download</p>
        </div>
        <button onClick={() => navigate('/po-generator/upload')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <MdReceipt size={15} /> + New Invoice
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
          <MdCheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total',    value: stats.totalInvoices   || 0, color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Partial',  value: stats.partialInvoices || 0, color: '#a16207', bg: '#fefce8' },
          { label: 'Full',     value: stats.fullInvoices    || 0, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Paid',     value: stats.paidInvoices    || 0, color: '#15803d', bg: '#dcfce7' },
          { label: 'Value',    value: `₹${((stats.totalValue||0)/100000).toFixed(1)}L`, color: '#c0392b', bg: '#fef2f2' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.color}20` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <MdSearch size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchAll()}
            placeholder="Search invoice no, PO ref, vendor..."
            style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
          <option value="Sent">Sent</option>
          <option value="Paid">Paid</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <MdReceipt size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No invoices yet</div>
            <button onClick={() => navigate('/po-generator/upload')}
              style={{ marginTop: 12, padding: '8px 18px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>
              Generate First Invoice
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['#','Invoice No','PO Ref','Vendor','Type','Grand Total','Status','Date','Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => {
                  const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.Draft;
                  return (
                    <tr key={inv._id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '11px 12px', fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{i+1}</td>
                      <td style={{ padding: '11px 12px', fontWeight: 700, color: '#c0392b', fontSize: 13 }}>{inv.invoiceNo}</td>
                      <td style={{ padding: '11px 12px', fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>{inv.poRef||'—'}</td>
                      <td style={{ padding: '11px 12px', fontSize: 13, color: '#1e293b' }}>{inv.vendorName||'—'}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: inv.invoiceType==='partial'?'#fef9c3':'#dcfce7', color: inv.invoiceType==='partial'?'#a16207':'#16a34a' }}>
                          {inv.invoiceType==='partial'?'Partial':'Full'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: 13, fontWeight: 800, color: '#1e293b' }}>₹{Math.round(inv.grandTotal||0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{inv.status}</span>
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => setViewInv(inv)} title="View Invoice"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            <MdVisibility size={14} /> View
                          </button>
                          <button onClick={() => handlePrint(inv)} title="Print"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#f0fdf4', color: '#16a34a', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            <MdPrint size={14} /> Print
                          </button>
                          <button onClick={() => handleDownload(inv)} title="Download"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fef9c3', color: '#a16207', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                            <MdDownload size={14} />
                          </button>
                          <button onClick={() => setDeleteConfirm(inv)} title="Delete Invoice" disabled={deleting === inv._id}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, fontSize: 12, cursor: deleting === inv._id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: deleting === inv._id ? 0.6 : 1 }}>
                            <MdDelete size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invoice View Modal ── */}
      <Modal
        open={!!viewInv}
        onClose={() => setViewInv(null)}
        title={`Invoice: ${viewInv?.invoiceNo}`}
        size="xl"
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {viewInv?.status === 'Draft' && (
                <button onClick={() => handleStatusUpdate(viewInv._id, 'Approved')} disabled={!!updating}
                  style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✓ Approve
                </button>
              )}
              {viewInv?.status === 'Approved' && (
                <button onClick={() => handleStatusUpdate(viewInv._id, 'Paid')} disabled={!!updating}
                  style={{ padding: '8px 16px', background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ₹ Mark Paid
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => viewInv && handlePrint(viewInv)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <MdPrint size={15} /> Print
              </button>
              <button onClick={() => viewInv && handleDownload(viewInv)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#fefce8', color: '#a16207', border: '1px solid #fde68a', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <MdDownload size={15} /> Download
              </button>
              <button onClick={() => setViewInv(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Close
              </button>
            </div>
          </div>
        }
      >
        {viewInv && (
          <div>
            {/* Invoice preview rendered inline */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 0 }}
              dangerouslySetInnerHTML={{ __html: buildInvoiceHTML(viewInv) }} />
          </div>
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Invoice"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={() => setDeleteConfirm(null)} disabled={!!deleting}
              style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={() => deleteConfirm && handleDelete(deleteConfirm._id)} disabled={!!deleting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.6 : 1 }}>
              <MdDelete size={15} /> {deleting ? 'Deleting...' : 'Delete Invoice'}
            </button>
          </div>
        }
      >
        {deleteConfirm && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 16 }}>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Invoice Details:</div>
              <div style={{ fontSize: 13, color: '#475569' }}>
                <strong>Invoice No:</strong> {deleteConfirm.invoiceNo}<br />
                <strong>PO Ref:</strong> {deleteConfirm.poRef}<br />
                <strong>Vendor:</strong> {deleteConfirm.vendorName}<br />
                <strong>Amount:</strong> ₹{Math.round(deleteConfirm.grandTotal || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
