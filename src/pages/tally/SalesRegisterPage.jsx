/**
 * SalesRegisterPage.jsx
 *
 * Dedicated Sales Register import + viewer for Sri Chakra Industries.
 * Purpose: Import all Sales Register vouchers (April–June) from Tally
 *          and display them with full detail.
 *
 * DB storage: TallyVoucher (voucherType: 'Sales') + Invoice (source: 'Tally')
 * Route: /tally/sales-register
 */
import { useState, useCallback, useEffect } from 'react';
import { tallyApi } from '../../api/tallyApi.js';
import { toast } from '../../components/common/Toast.jsx';
import Pagination from '../../components/common/Pagination.jsx';

// ── Style tokens ─────────────────────────────────────────────────────────────
const th  = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
const td  = 'px-4 py-3 text-gray-800 align-middle text-sm';
const tr  = 'border-b border-gray-50 last:border-0 hover:bg-green-50/30 transition-colors';

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 10,
  background: 'linear-gradient(135deg,#16a34a,#15803d)',
  color: '#fff', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
  boxShadow: '0 3px 10px rgba(22,163,74,0.3)',
};
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', borderRadius: 10,
  background: 'transparent', color: '#16a34a',
  border: '1.5px solid #16a34a', cursor: 'pointer',
  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
};
const inputStyle = {
  padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid #e2e8f0', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', background: '#fff',
};

function fmt(n) {
  if (n == null || n === '') return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #f1f5f9', borderTop: '3px solid #16a34a', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Badge({ text, color = '#6b7280', bg = '#f1f5f9' }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: bg, color }}>{text}</span>
  );
}

// ── Modal for viewing invoice details ──
function InvoiceDetailModal({ invoice, isOpen, onClose }) {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNo || invoice.voucherNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .invoice-header h2 { margin: 0; color: #1f2937; }
          .invoice-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .meta-block { }
          .meta-label { font-weight: bold; color: #6b7280; font-size: 12px; }
          .meta-value { color: #111827; margin-top: 4px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          .items-table th { background-color: #f3f4f6; font-weight: bold; }
          .total-section { text-align: right; margin-top: 20px; }
          .total-section div { margin: 8px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h2>SRI CHAKRA INDUSTRIES</h2>
          <p>Invoice #${invoice.invoiceNo || invoice.voucherNumber}</p>
        </div>
        
        <div class="invoice-meta">
          <div class="meta-block">
            <div class="meta-label">DATE</div>
            <div class="meta-value">${fmtDate(invoice.invoiceDate || invoice.voucherDate)}</div>
          </div>
          <div class="meta-block">
            <div class="meta-label">BILL TO</div>
            <div class="meta-value">${invoice.partyName || '—'}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(invoice.inventoryEntries || []).map(item => `
              <tr>
                <td>${item.stockItemName || '—'}</td>
                <td>${item.qty || 0}</td>
                <td>${item.rate || 0}</td>
                <td>${item.amount || 0}</td>
              </tr>
            `).join('')}
            ${(!invoice.inventoryEntries || invoice.inventoryEntries.length === 0) ? '<tr><td colspan="4" style="text-align: center;">No items</td></tr>' : ''}
          </tbody>
        </table>

        <div class="total-section">
          <div>TOTAL: ${fmt(invoice.grandTotal || invoice.amount)}</div>
          <div style="font-weight: normal; font-size: 12px; margin-top: 20px;">Narration: ${invoice.narration || '—'}</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = () => {
    toast('PDF download feature coming soon', 'info');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 700, maxHeight: '90vh',
        overflow: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)'
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          fontSize: 24, cursor: 'pointer', color: '#6b7280', padding: 0
        }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: 20, fontWeight: 800 }}>
            Invoice Details
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
            {invoice.invoiceNo || invoice.voucherNumber}
          </p>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Invoice Number</label>
            <p style={{ margin: '6px 0 0', color: '#0f172a', fontWeight: 700, fontSize: 14 }}>{invoice.invoiceNo || invoice.voucherNumber}</p>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Date</label>
            <p style={{ margin: '6px 0 0', color: '#0f172a', fontWeight: 700, fontSize: 14 }}>{fmtDate(invoice.invoiceDate || invoice.voucherDate)}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Party Name</label>
            <p style={{ margin: '6px 0 0', color: '#0f172a', fontWeight: 700, fontSize: 14 }}>{invoice.partyName || '—'}</p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Narration</label>
            <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 13 }}>{invoice.narration || '—'}</p>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Items</label>
          {invoice.inventoryEntries && invoice.inventoryEntries.length > 0 ? (
            <div style={{ background: '#f8fafc', borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b' }}>Item Name</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Rate</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.inventoryEntries.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', color: '#0f172a' }}>{item.stockItemName || '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>{item.qty || 0}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>₹{(item.rate || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>₹{(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: 12 }}>No items found</p>
          )}
        </div>

        {/* Total */}
        <div style={{
          background: '#f0fdf4', border: '2px solid #86efac', borderRadius: 8,
          padding: 12, marginBottom: 24, textAlign: 'right'
        }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Amount</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
            {fmt(invoice.grandTotal || invoice.amount)}
          </div>
        </div>

        {/* Metadata */}
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 24, fontSize: 12, color: '#64748b' }}>
          <div><strong>Source:</strong> {invoice.source || 'Tally'}</div>
          <div><strong>Type:</strong> {invoice.voucherType || invoice.invoiceType || 'Sales'}</div>
          {invoice.tallyGuid && <div><strong>Tally GUID:</strong> <code style={{ fontSize: 10 }}>{invoice.tallyGuid.slice(0, 20)}...</code></div>}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit'
          }}>Close</button>
          <button onClick={handlePrint} style={{
            ...primaryBtn, background: 'linear-gradient(135deg,#0369a1,#0284c7)'
          }}>🖨️ Print</button>
          <button onClick={handleDownloadPDF} style={primaryBtn}>⬇️ Download PDF</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesRegisterPage() {
  // ── Date range (default: FY April–June current year) ─────────────────────
  const now = new Date();
  const fyYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const defaultFrom = `${fyYear}-04-01`;
  const defaultTo   = `${fyYear}-06-30`;

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate,   setToDate]   = useState(defaultTo);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [activeView, setActiveView] = useState('vouchers'); // 'vouchers' | 'invoices'

  // Vouchers state
  const [vouchers, setVouchers]       = useState([]);
  const [vTotal,   setVTotal]         = useState(0);
  const [vPage,    setVPage]          = useState(1);
  const [vPageSize, setVPageSize]     = useState(25);

  // Invoice state
  const [invoices, setInvoices]       = useState([]);
  const [iTotal,   setITotal]         = useState(0);
  const [iPage,    setIPage]          = useState(1);
  const [iPageSize, setIPageSize]     = useState(25);

  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [error,   setError]           = useState('');
  
  // ── Modal state ──
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ── Load Sales Register data ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    setError('');
    try {
      const res = await tallyApi.getSalesInvoices({
        fromDate,
        toDate,
        ...(search ? { search } : {}),
        page:  activeView === 'vouchers' ? vPage : iPage,
        limit: activeView === 'vouchers' ? vPageSize : iPageSize,
      });
      if (res.success) {
        setVouchers(res.data?.vouchers || []);
        setVTotal(res.data?.voucherTotal || 0);
        setInvoices(res.data?.invoices || []);
        setITotal(res.data?.invoiceTotal || 0);
      }
    } catch (e) {
      setError(e.message || 'Failed to load Sales Register data');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, search, activeView, vPage, vPageSize, iPage, iPageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── View invoice details ─────────────────────────────────────────────────
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedInvoice(null), 300);
  };

  // ── Import Sales Register from Tally ─────────────────────────────────────
  const handleImport = async () => {
    if (!fromDate || !toDate) {
      toast('Please select both From Date and To Date', 'error');
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      toast('From Date must be before To Date', 'error');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      toast(`Importing Sales Register (${fromDate} → ${toDate})…`, 'info');
      const res = await tallyApi.importSalesRegister({ fromDate, toDate });
      setImportResult(res);
      if (res.success) {
        const d = res.data || {};
        toast(`✅ ${res.message}`, 'success');
        await loadData();
      } else {
        toast(`Import failed: ${res.message}`, 'error');
      }
    } catch (e) {
      toast(`Import error: ${e.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  // ── CSV Download ───────────────────────────────────────────────────────────
  const handleDownload = () => {
    const rows = activeView === 'vouchers' ? vouchers : invoices;
    if (rows.length === 0) { toast('No data to download', 'error'); return; }

    const headers = activeView === 'vouchers'
      ? ['Voucher No', 'Date', 'Party', 'Amount', 'Narration', 'Source']
      : ['Invoice No', 'Date', 'Party', 'Total', 'Status', 'Source'];

    const csvRows = rows.map(r =>
      activeView === 'vouchers'
        ? [r.voucherNumber || '', fmtDate(r.voucherDate), `"${(r.partyName||'').replace(/"/g,'""')}"`, r.amount || 0, `"${(r.narration||'').replace(/"/g,'""')}"`, r.source || 'Tally']
        : [r.invoiceNo || '', fmtDate(r.invoiceDate), `"${(r.partyName||'').replace(/"/g,'""')}"`, r.grandTotal || 0, r.status || '', r.source || 'Tally']
    );

    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-register-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalSales = vTotal + iTotal;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>
          📊 Sales Register — Tally Import
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Import and view Sri Chakra Sales Register vouchers from Tally (April–June and any date range)
        </p>
      </div>

      {/* ── Import Panel ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          🔄 Import from Tally — Select Date Range
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>FROM DATE</label>
            <input
              type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>TO DATE</label>
            <input
              type="date" value={toDate}
              onChange={e => setToDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Quick-select buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { label: 'Apr–Jun', from: `${fyYear}-04-01`, to: `${fyYear}-06-30` },
              { label: 'Jul–Sep', from: `${fyYear}-07-01`, to: `${fyYear}-09-30` },
              { label: 'Oct–Dec', from: `${fyYear}-10-01`, to: `${fyYear}-12-31` },
              { label: 'Jan–Mar', from: `${fyYear+1}-01-01`, to: `${fyYear+1}-03-31` },
            ].map(q => (
              <button key={q.label}
                onClick={() => { setFromDate(q.from); setToDate(q.to); }}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                  background: fromDate === q.from && toDate === q.to ? '#f0fdf4' : '#f8fafc',
                  color: fromDate === q.from && toDate === q.to ? '#16a34a' : '#64748b',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                {q.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            style={{ ...primaryBtn, opacity: importing ? 0.6 : 1 }}
          >
            {importing ? '⏳ Importing…' : '⬇️ Import Sales Register'}
          </button>
        </div>

        {/* Import result banner */}
        {importResult && (
          <div style={{
            marginTop: 14,
            padding: '10px 14px',
            borderRadius: 10,
            background: importResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${importResult.success ? '#bbf7d0' : '#fecaca'}`,
            color: importResult.success ? '#15803d' : '#dc2626',
            fontSize: 13, fontWeight: 600,
          }}>
            {importResult.success ? '✅' : '❌'} {importResult.message}
            {importResult.success && importResult.data && (
              <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 400, color: '#64748b' }}>
                Created: {importResult.data.created ?? 0} · Updated: {importResult.data.updated ?? 0} · Skipped: {importResult.data.skipped ?? 0}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Results Panel ── */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Sales Register: {fromDate} → {toDate}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {vTotal} TallyVoucher records · {iTotal} Invoice records · <strong>{totalSales} total</strong>
            </div>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'vouchers', label: `📋 Vouchers (${vTotal})` },
              { key: 'invoices', label: `🧾 Invoices (${iTotal})` },
            ].map(v => (
              <button key={v.key} onClick={() => setActiveView(v.key)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                border: activeView === v.key ? '1.5px solid #16a34a' : '1.5px solid #e2e8f0',
                background: activeView === v.key ? '#f0fdf4' : '#f8fafc',
                color: activeView === v.key ? '#16a34a' : '#64748b',
              }}>{v.label}</button>
            ))}
          </div>

          {/* Search */}
          <input
            placeholder="Search party / voucher no…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: 220 }}
          />

          <button style={outlineBtn} onClick={handleDownload}>📥 Download CSV</button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? <Spinner /> : (
          <>
            {/* ── Vouchers Table ── */}
            {activeView === 'vouchers' && (
              vouchers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No Sales vouchers found for this date range.</div>
                  <div style={{ fontSize: 12, marginTop: 6, color: '#94a3b8' }}>
                    Click "Import Sales Register" above to pull data from Tally.
                  </div>
                  <div style={{ fontSize: 11, marginTop: 8, color: '#94a3b8' }}>
                    Tip: If import shows 0 records, check Tally → Gateway of Tally → Display → Day Book and verify the Sales voucher type name.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['#', 'Voucher No', 'Type', 'Date', 'Party', 'Item Names', 'Amount', 'Narration', 'Actions'].map(h => (
                          <th key={h} className={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map((v, i) => (
                        <tr key={v._id || i} className={tr}>
                          <td className={td} style={{ color: '#94a3b8', fontSize: 11 }}>{(vPage - 1) * vPageSize + i + 1}</td>
                          <td className={td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#15803d', fontSize: 11 }}>{v.voucherNumber || '—'}</td>
                          <td className={td} style={{ fontSize: 12 }}>
                            <Badge text={v.voucherType || 'Sales'} color="#0369a1" bg="#e0f2fe" />
                          </td>
                          <td className={td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(v.voucherDate)}</td>
                          <td className={td} style={{ fontWeight: 600 }}>{v.partyName || '—'}</td>
                          <td className={td} style={{ fontSize: 12, color: '#64748b' }}>
                            {v.inventoryEntries?.length > 0 ? (
                              <div style={{ maxWidth: 200 }}>
                                {v.inventoryEntries.slice(0, 2).map((item, idx) => (
                                  <div key={idx} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.stockItemName || '—'}
                                  </div>
                                ))}
                                {v.inventoryEntries.length > 2 && (
                                  <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                                    +{v.inventoryEntries.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td className={td} style={{ fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{fmt(v.amount)}</td>
                          <td className={td} style={{ fontSize: 12, color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.narration || '—'}
                          </td>
                          <td className={td}>
                            <button onClick={() => handleViewInvoice(v)} style={{
                              padding: '6px 12px', borderRadius: 6, background: '#0369a1', color: '#fff',
                              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                              fontFamily: 'inherit'
                            }}>View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ── Invoices Table ── */}
            {activeView === 'invoices' && (
              invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No Tally-sourced invoices found for this date range.</div>
                  <div style={{ fontSize: 12, marginTop: 6, color: '#94a3b8' }}>Run the import above to populate Invoice records.</div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['#', 'Invoice No', 'Date', 'Party Name', 'Item Names', 'Grand Total', 'Status', 'Actions'].map(h => (
                          <th key={h} className={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv, i) => (
                        <tr key={inv._id || i} className={tr}>
                          <td className={td} style={{ color: '#94a3b8', fontSize: 11 }}>{(iPage - 1) * iPageSize + i + 1}</td>
                          <td className={td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#15803d', fontSize: 11 }}>{inv.invoiceNo || inv.voucherNumber || '—'}</td>
                          <td className={td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.invoiceDate || inv.voucherDate)}</td>
                          <td className={td} style={{ fontWeight: 600 }}>{inv.partyName || '—'}</td>
                          <td className={td} style={{ fontSize: 12, color: '#64748b' }}>
                            {inv.inventoryEntries?.length > 0 ? (
                              <div style={{ maxWidth: 200 }}>
                                {inv.inventoryEntries.slice(0, 2).map((item, idx) => (
                                  <div key={idx} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.stockItemName || '—'}
                                  </div>
                                ))}
                                {inv.inventoryEntries.length > 2 && (
                                  <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                                    +{inv.inventoryEntries.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                          <td className={td} style={{ fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{fmt(inv.grandTotal || inv.amount)}</td>
                          <td className={td}>
                            <Badge
                              text={inv.status || 'Imported'}
                              color={inv.status === 'Paid' ? '#15803d' : inv.status === 'Sent' ? '#0369a1' : '#6b7280'}
                              bg={inv.status === 'Paid' ? '#f0fdf4' : inv.status === 'Sent' ? '#e0f2fe' : '#f1f5f9'}
                            />
                          </td>
                          <td className={td}>
                            <button onClick={() => handleViewInvoice(inv)} style={{
                              padding: '6px 12px', borderRadius: 6, background: '#0369a1', color: '#fff',
                              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                              fontFamily: 'inherit'
                            }}>View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Pagination */}
            {activeView === 'vouchers' && vTotal > 0 && (
              <Pagination total={vTotal} page={vPage} pageSize={vPageSize} onPage={setVPage} onPageSize={setVPageSize} />
            )}
            {activeView === 'invoices' && iTotal > 0 && (
              <Pagination total={iTotal} page={iPage} pageSize={iPageSize} onPage={setIPage} onPageSize={setIPageSize} />
            )}
          </>
        )}
      </div>

      {/* ── Debug Info Panel ── */}
      <div style={{ background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', padding: '14px 18px', marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>
          🔍 Troubleshooting Guide — If Sales Register shows 0 records after import
        </div>
        <ol style={{ fontSize: 12, color: '#78350f', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Verify Tally is running and the correct company <strong>"Sri Chakra Industries"</strong> is open</li>
          <li>In Tally: Gateway of Tally → Display → Day Book → check Sales voucher type name exactly</li>
          <li>The system matches these Sales voucher type names: <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>Sales, Sales Invoice, Tax Invoice, GST Invoice, GST Sales Invoice, Invoice, Retail Invoice, Sales Bill, Sales Order</code></li>
          <li>If your Tally uses a <strong>custom voucher type</strong> (e.g., "Sri Chakra Sales"), add it by opening <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>tallyFetchEngine.js</code> → find <code>Sales.voucherTypes</code> array and add the exact name</li>
          <li>Check backend logs for: <code style={{ background: '#fef3c7', padding: '1px 4px', borderRadius: 4 }}>[parseVouchers] All voucher types found in XML:</code> to see what types Tally is returning</li>
          <li>Tally DB storage: <strong>TallyVoucher</strong> collection (voucherType: 'Sales') + <strong>Invoice</strong> collection (source: 'Tally')</li>
        </ol>
      </div>

      {/* ── Invoice Detail Modal ── */}
      <InvoiceDetailModal
        invoice={selectedInvoice}
        isOpen={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
