import { useState, useEffect, useRef } from 'react';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import { useNavigate } from 'react-router-dom';
import {
  MdSearch, MdInventory2, MdPictureAsPdf, MdClose,
  MdCheckCircle, MdWarning, MdError, MdTableChart,
  MdReceipt, MdRefresh, MdArrowForward, MdHistory, MdDelete,
} from 'react-icons/md';
import Modal from '../../components/common/Modal';

const STATUS_COLORS = {
  Draft:     { bg: '#f1f5f9', color: '#64748b' },
  Pending:   { bg: '#fef9c3', color: '#a16207' },
  Approved:  { bg: '#dcfce7', color: '#16a34a' },
  Received:  { bg: '#dbeafe', color: '#1d4ed8' },
  Cancelled: { bg: '#fee2e2', color: '#dc2626' },
};

const stockBadge = (s) => ({
  Ready:          { bg: '#dcfce7', color: '#16a34a', icon: '✅' },
  'Low Stock':    { bg: '#fef9c3', color: '#a16207', icon: '⚠️' },
  'Out of Stock': { bg: '#fee2e2', color: '#dc2626', icon: '❌' },
}[s] || { bg: '#f1f5f9', color: '#64748b', icon: '—' });

// PDF extractor
async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
  ).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const c = await page.getTextContent();
    text += c.items.map(x => x.str).join(' ') + '\n';
  }
  return text;
}

// ── Smart PDF PO Parser ───────────────────────────────────────────────────────
// Handles real-world PO formats like Zolo/standard procurement PDFs
// ── Universal PDF PO Parser ───────────────────────────────────────────────────
// Works with any PO format by using multiple strategies
function parsePOFromText(text) {
  const result = { poNumber: '', vendor: '', vendorGST: '', buyerName: '', items: [], total: '', taxTotal: '', subTotal: '' };

  // ── PO Number — many formats ──
  const poMatch = text.match(/\b(PO[-\/][A-Z0-9\/\-]+|PO\s*#?\s*:?\s*([A-Z0-9\-\/]+)|Purchase\s+Order\s+No\.?\s*:?\s*([A-Z0-9\-\/]+))/i);
  if (poMatch) result.poNumber = (poMatch[2] || poMatch[3] || poMatch[1]).trim().replace(/\s+/g, '');

  // ── Vendor name ──
  const vendorMatch = text.match(/Vendor\s+Details?\s*[:\-]?\s*([A-Z][A-Za-z0-9 &.,\-]+)/i)
    || text.match(/Supplier\s*[:\-]\s*([A-Z][A-Za-z0-9 &.,\-]+)/i)
    || text.match(/Vendor\s*[:\-]\s*([A-Z][A-Za-z0-9 &.,\-]+)/i);
  if (vendorMatch) result.vendor = vendorMatch[1].trim().slice(0, 80);

  // ── Buyer / Entity ──
  const entityMatch = text.match(/Entity\s+Details?\s*[:\-]?\s*([A-Z][A-Za-z0-9 &.,\-]+)/i)
    || text.match(/Bill\s+To\s*[:\-]?\s*([A-Z][A-Za-z0-9 &.,\-]+)/i)
    || text.match(/Buyer\s*[:\-]\s*([A-Z][A-Za-z0-9 &.,\-]+)/i);
  if (entityMatch) result.buyerName = entityMatch[1].trim().slice(0, 80);

  // ── Totals ──
  const grandMatch = text.match(/Grand\s+Total\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Total\s+Amount\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (grandMatch) result.total = grandMatch[1].replace(/,/g, '');

  const taxMatch = text.match(/Total\s+Tax\s+Amount\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Tax\s+Amount\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (taxMatch) result.taxTotal = taxMatch[1].replace(/,/g, '');

  const subMatch = text.match(/Total\s+Amount\s*\(?Without\s+Tax\)?\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Sub\s*Total\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (subMatch) result.subTotal = subMatch[1].replace(/,/g, '');

  // ── Items — Strategy 1: SL NO + UOM pattern (Zolo-style) ─────────────────
  // Row: "1 GEYSER GEYSER 3L 6 Numbers 8516 2,320.35 ... 16,428.08"
  const UOM = 'Numbers?|Nos?\\.?|Pcs?\\.?|Kgs?\\.?|Units?|EA|Sets?|Ltrs?\\.?|Mtr?s?\\.?|Boxes?|Rolls?|Pairs?|Bags?|Sheets?|Nos';
  const seen = new Set();

  const rowRegex = new RegExp(
    `\\b(\\d{1,3})\\s+` +
    `([A-Z][A-Z0-9 /&\\-]{1,39}?)\\s+` +
    `(?:[A-Za-z0-9][A-Za-z0-9 /&\\-.,]{0,60}?\\s+)?` +
    `(\\d{1,5}(?:\\.\\d+)?)\\s+` +
    `(${UOM})\\s+` +
    `(\\d{4,8})\\s+` +
    `([\\d,]+\\.\\d{2})` +
    `(?:\\s+[\\d,.]+\\s+\\([\\d.]+\\))*` +
    `\\s+([\\d,]+\\.\\d{2})`,
    'gi'
  );

  let m;
  while ((m = rowRegex.exec(text)) !== null) {
    const rawName = m[2].trim().replace(/^\d+\s+/, '');
    const qty     = parseFloat(m[3]);
    const uom     = m[4];
    const hsn     = m[5];
    const rate    = parseFloat(m[6].replace(/,/g, ''));
    const lineAmt = parseFloat(m[7].replace(/,/g, ''));
    const skipWords = /^(SL|NO|ITEM|NAME|DESC|QTY|UOM|HSN|UNIT|RATE|CGST|SGST|IGST|AMOUNT|TOTAL|TAX|SR)/i;
    if (skipWords.test(rawName) || rawName.length < 2 || qty <= 0 || rate <= 0) continue;
    if (seen.has(rawName.toLowerCase())) continue;
    seen.add(rawName.toLowerCase());
    const gstMatch = m[0].match(/\((\d+(?:\.\d+)?)\)\s*[\d,]+\.\d{2}\s*$/);
    const gst = gstMatch ? parseFloat(gstMatch[1]) : 18;
    result.items.push({ name: rawName, qty, unit: uom, rate, gst, lineAmount: lineAmt, hsn });
  }

  // ── Strategy 2: No UOM — just SL NO + name + qty + rate + amount ──────────
  if (result.items.length === 0) {
    // Matches rows like: "1  Item Name  10  500.00  5000.00"
    const simple = /\b(\d{1,3})\s+([A-Za-z][A-Za-z0-9 \-\/&]{2,50}?)\s+(\d{1,5}(?:\.\d+)?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/g;
    while ((m = simple.exec(text)) !== null) {
      const name = m[2].trim();
      const qty  = parseFloat(m[3]);
      const rate = parseFloat(m[4].replace(/,/g, ''));
      const amt  = parseFloat(m[5].replace(/,/g, ''));
      const skipWords = /^(SL|NO|ITEM|NAME|DESC|QTY|UOM|HSN|UNIT|RATE|CGST|SGST|IGST|AMOUNT|TOTAL|TAX|SR|PO|DATE)/i;
      if (skipWords.test(name) || name.length < 2 || qty <= 0 || rate <= 0) continue;
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      result.items.push({ name, qty, unit: 'Nos', rate, gst: 18, lineAmount: amt, hsn: '' });
    }
  }

  // ── Strategy 3: Find any line with a price pattern ────────────────────────
  if (result.items.length === 0) {
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Look for: some text, a small number (qty), a price
      const lm = line.match(/^(.{3,50}?)\s+(\d{1,4})\s+[\w.]*\s*([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/);
      if (lm) {
        const name = lm[1].trim().replace(/^\d+\.?\s*/, '');
        const qty  = parseFloat(lm[2]);
        const rate = parseFloat(lm[3].replace(/,/g, ''));
        const amt  = parseFloat(lm[4].replace(/,/g, ''));
        const skipWords = /^(SL|NO|ITEM|NAME|DESC|QTY|UOM|HSN|UNIT|RATE|CGST|SGST|IGST|AMOUNT|TOTAL|TAX|SR)/i;
        if (skipWords.test(name) || name.length < 2 || qty <= 0 || rate <= 0) continue;
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        result.items.push({ name, qty, unit: 'Nos', rate, gst: 18, lineAmount: amt, hsn: '' });
      }
    }
  }

  return result;
}

export default function POUploadPage() {
  const fileRef  = useRef(null);
  const navigate = useNavigate();

  // PO list
  const [pos, setPOs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');

  // PDF upload state
  const [parsing, setParsing]       = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedPO, setParsedPO]     = useState(null);
  const [showPDFPanel, setShowPDFPanel] = useState(false);
  const [editableItems, setEditableItems] = useState([]); // editable copy of parsed items

  // PDF direct invoice state
  const [pdfInvoicing, setPdfInvoicing]   = useState(false);
  const [pdfInvoiceMsg, setPdfInvoiceMsg] = useState('');

  // Invoice generation modal
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [selectedPO, setSelectedPO]     = useState(null);
  const [stockData, setStockData]       = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError]     = useState('');

  // Delete PO state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting]           = useState(null);
  const [notes, setNotes]               = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [createdInvoiceId, setCreatedInvoiceId] = useState(null);

  // Per-item delivery status: { [itemIndex]: 'Pending' | 'Delivered' | 'Not Delivered' }
  const [itemDelivery, setItemDelivery] = useState({});

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await poGeneratorApi.listPOs(params);
      setPOs(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeletePO = async (id) => {
    setDeleting(id);
    try {
      await poGeneratorApi.deletePO(id);
      fetchPOs();
      setDeleteConfirm(null);
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  useEffect(() => { fetchPOs(); }, [filter]);

  // Open invoice modal — auto-run stock check
  const openInvoiceModal = async (po) => {
    setSelectedPO(po);
    setStockData(null);
    setStockError('');
    setNotes('');
    setSubmitError('');
    setSuccessMsg('');
    setItemDelivery({});
    setInvoiceModal(true);
    setStockLoading(true);
    try {
      const res = await poGeneratorApi.stockCheck(po._id);
      setStockData(res.data);
      // Default all items to 'Pending'
      const defaults = {};
      (res.data?.items || []).forEach((_, i) => { defaults[i] = 'Pending'; });
      setItemDelivery(defaults);
    } catch (e) {
      setStockError(e.message);
    } finally {
      setStockLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!stockData || !selectedPO) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const items = stockData.items.map((it, i) => ({
        itemName:       it.itemName,
        requestedQty:   it.requestedQty,
        availableQty:   it.availableQty,
        invoicedQty:    it.dispatchableQty,
        pendingQty:     it.pendingQty,
        unit:           it.unit,
        basePrice:      it.basePrice,
        gst:            it.gst,
        deliveryStatus: itemDelivery[i] || 'Pending',
        deliveredQty:   itemDelivery[i] === 'Delivered' ? it.dispatchableQty : 0,
        deliveryDate:   itemDelivery[i] === 'Delivered' ? new Date().toISOString() : null,
      }));
      const res = await poGeneratorApi.generateInvoice({ poId: selectedPO._id, action: 'accept', items, notes });
      setCreatedInvoiceId(res.data?.invoice?._id || null);
      setSuccessMsg(res.message || 'Invoice generated successfully!');
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPO) return;
    setSubmitting(true);
    try {
      await poGeneratorApi.generateInvoice({ poId: selectedPO._id, action: 'reject', items: [], notes });
      setSuccessMsg('Invoice rejected. PO remains pending.');
    } catch (e) { setSubmitError(e.message); }
    finally { setSubmitting(false); }
  };

  const closeModal = () => {
    setInvoiceModal(false);
    setSelectedPO(null);
    setStockData(null);
    setSuccessMsg('');
    setSubmitError('');
    setCreatedInvoiceId(null);
    setItemDelivery({});
    if (successMsg) fetchPOs();
  };

  // PDF upload
  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setParseError('Please upload a valid PDF file.'); return; }
    setParsing(true); setParseError(''); setParsedPO(null);
    try {
      const text = await extractTextFromPDF(file);
      const parsed = parsePOFromText(text);
      parsed.fileName = file.name;
      setParsedPO(parsed);
      // Initialize editable items — always start with at least 1 blank row if nothing parsed
      setEditableItems(
        parsed.items.length > 0
          ? parsed.items.map(it => ({ name: it.name, qty: it.qty, unit: it.unit || 'Nos', rate: it.rate, gst: it.gst || 18, hsn: it.hsn || '' }))
          : [{ name: '', qty: 1, unit: 'Nos', rate: 0, gst: 18, hsn: '' }]
      );
      setShowPDFPanel(true);
    } catch (err) {
      setParseError('Failed to read PDF. Make sure it is a text-based PDF.');
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Create invoice directly from PDF data (no PO in DB needed)
  const handleCreateFromPDF = async () => {
    const validItems = editableItems.filter(it => it.name.trim() && it.qty > 0 && it.rate > 0);
    if (!parsedPO || validItems.length === 0) { alert('Please add at least one item with name, qty and rate.'); return; }
    setPdfInvoicing(true);
    setPdfInvoiceMsg('');
    try {
      const res = await poGeneratorApi.generateInvoiceFromPDF({
        poNumber:   parsedPO.poNumber,
        vendorName: parsedPO.vendor,
        buyerName:  parsedPO.buyerName,
        items:      validItems.map(it => ({
          name:  it.name.trim(),
          qty:   Number(it.qty),
          unit:  it.unit || 'Nos',
          rate:  Number(it.rate),
          gst:   Number(it.gst) || 18,
          hsn:   it.hsn || '',
        })),
        total:      parsedPO.total,
        notes:      `Created from PDF: ${parsedPO.fileName}`,
      });
      setPdfInvoiceMsg(res.message || 'Invoice created!');
    } catch (e) {
      setPdfInvoiceMsg('Error: ' + e.message);
    } finally {
      setPdfInvoicing(false);
    }
  };

  const matchedPO = parsedPO

  // Compute invoice totals from stock data
  const invoiceItems  = stockData?.items?.filter(it => it.dispatchableQty > 0) || [];
  const subtotal      = invoiceItems.reduce((s, it) => s + it.dispatchableQty * it.basePrice, 0);
  const gstTotal      = invoiceItems.reduce((s, it) => s + it.dispatchableQty * it.basePrice * it.gst / 100, 0);
  const grandTotal    = subtotal + gstTotal;
  const hasPending    = stockData?.items?.some(it => it.pendingQty > 0);
  const canFullInvoice = stockData?.canFullInvoice;
  const hasAnyStock   = stockData?.hasAnyStock;

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>PO Upload & Invoice Generation</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Select any PO and click <strong style={{ color: '#c0392b' }}>Generate Invoice</strong> to check stock and create invoice
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePDFUpload} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} disabled={parsing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: parsing ? '#94a3b8' : '#1e293b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: parsing ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            <MdPictureAsPdf size={17} /> {parsing ? 'Reading...' : 'Upload PO PDF'}
          </button>
        </div>
      </div>

      {/* ── Parse Error ── */}
      {parseError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '11px 15px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
          <MdError size={17} /> {parseError}
          <button onClick={() => setParseError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><MdClose size={15} /></button>
        </div>
      )}

      {/* ── PDF Preview Panel ── */}
      {showPDFPanel && parsedPO && (
        <div style={{ background: '#fff', border: '2px solid #c0392b', borderRadius: 13, padding: '18px 20px', marginBottom: 22, boxShadow: '0 4px 18px rgba(192,57,43,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <MdPictureAsPdf size={22} color="#c0392b" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>PDF Parsed — {parsedPO.fileName}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Review extracted data below</div>
              </div>
            </div>
            <button onClick={() => setShowPDFPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><MdClose size={19} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
            {[
              { label: 'PO Number', value: parsedPO.poNumber || 'Not detected', ok: !!parsedPO.poNumber },
              { label: 'Vendor',    value: parsedPO.vendor   || 'Not detected', ok: !!parsedPO.vendor },
              { label: 'Buyer',     value: parsedPO.buyerName|| 'Not detected', ok: !!parsedPO.buyerName },
              { label: 'Grand Total', value: parsedPO.total ? `₹${parseFloat(parsedPO.total).toLocaleString('en-IN')}` : 'Not detected', ok: !!parsedPO.total },
              { label: 'Items',     value: `${parsedPO.items.length} found`, ok: parsedPO.items.length > 0 },
            ].map(f => (
              <div key={f.label} style={{ background: f.ok ? '#f0fdf4' : '#fef9f0', border: `1px solid ${f.ok ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 9, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: f.ok ? '#15803d' : '#92400e' }}>{f.value}</div>
              </div>
            ))}
          </div>
          {/* If PO matched in system */}
          {matchedPO && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '11px 15px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdCheckCircle size={19} color="#16a34a" />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>
                  PO found in system: <span style={{ color: '#c0392b' }}>{matchedPO.poId}</span> — {matchedPO.vendor?.companyName}
                </div>
              </div>
              <button onClick={() => openInvoiceModal(matchedPO)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <MdReceipt size={15} /> Generate Invoice (with Stock Check)
              </button>
            </div>
          )}

          {/* Editable items table — always shown, pre-filled from PDF or blank */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdTableChart size={14} />
                {parsedPO.items.length > 0 ? `Line Items (auto-filled — edit if needed)` : `Line Items — PDF could not extract items, enter manually`}
              </span>
              <button
                onClick={() => setEditableItems(prev => [...prev, { name: '', qty: 1, unit: 'Nos', rate: 0, gst: 18, hsn: '' }])}
                style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add Row
              </button>
            </div>

            {parsedPO.items.length === 0 && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                ⚠️ Items not detected from PDF. Please enter them manually below.
              </div>
            )}

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['#', 'Item Name *', 'HSN', 'Qty *', 'Unit', 'Unit Rate *', 'GST %', 'Line Total', ''].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editableItems.map((item, i) => {
                    const lineTotal = Number(item.qty) * Number(item.rate) * (1 + Number(item.gst) / 100);
                    const updateItem = (field, val) => setEditableItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '6px 10px', color: '#94a3b8', fontWeight: 700, fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: '4px 6px' }}>
                          <input value={item.name} onChange={e => updateItem('name', e.target.value)} placeholder="Item name"
                            style={{ width: '100%', minWidth: 140, padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input value={item.hsn} onChange={e => updateItem('hsn', e.target.value)} placeholder="HSN"
                            style={{ width: 70, padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="number" value={item.qty} onChange={e => updateItem('qty', e.target.value)} min="0"
                            style={{ width: 60, padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <select value={item.unit} onChange={e => updateItem('unit', e.target.value)}
                            style={{ padding: '5px 6px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                            {['Nos','Numbers','Pcs','Kgs','Units','EA','Sets','Ltrs','Mtrs','Boxes','Rolls','Pairs','Bags','Sheets'].map(u => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <input type="number" value={item.rate} onChange={e => updateItem('rate', e.target.value)} min="0" step="0.01"
                            style={{ width: 90, padding: '5px 8px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <select value={item.gst} onChange={e => updateItem('gst', Number(e.target.value))}
                            style={{ padding: '5px 6px', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                            {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap' }}>
                          ₹{isNaN(lineTotal) ? '0.00' : lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '4px 6px' }}>
                          <button onClick={() => setEditableItems(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}>
                            <MdClose size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={7} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Grand Total</td>
                    <td style={{ padding: '10px 12px', fontWeight: 900, color: '#c0392b', fontSize: 14 }}>
                      ₹{editableItems.reduce((s, it) => s + (Number(it.qty) * Number(it.rate) * (1 + Number(it.gst) / 100)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {pdfInvoiceMsg && (
              <div style={{ background: pdfInvoiceMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${pdfInvoiceMsg.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 9, padding: '11px 15px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pdfInvoiceMsg.startsWith('Error') ? '#dc2626' : '#15803d' }}>
                  {pdfInvoiceMsg.startsWith('Error') ? '❌' : '✅'} {pdfInvoiceMsg}
                </div>
                {!pdfInvoiceMsg.startsWith('Error') && (
                  <button onClick={() => navigate('/po-generator/invoice-history')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <MdHistory size={14} /> View Invoice
                  </button>
                )}
              </div>
            )}

            {!pdfInvoiceMsg && (
              <button onClick={handleCreateFromPDF} disabled={pdfInvoicing}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 24px', background: pdfInvoicing ? '#94a3b8' : 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: pdfInvoicing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(192,57,43,0.35)' }}>
                <MdReceipt size={20} />
                {pdfInvoicing ? 'Creating Invoice...' : `Create Invoice from PDF  ·  ${editableItems.filter(it => it.name.trim()).length} item(s)  ·  ₹${editableItems.reduce((s, it) => s + (Number(it.qty) * Number(it.rate) * (1 + Number(it.gst) / 100)), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <form onSubmit={e => { e.preventDefault(); fetchPOs(); }} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MdSearch size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO ID..."
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ padding: '8px 15px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Search</button>
        </form>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
          <option value="">All Status</option>
          <option>Draft</option><option>Pending</option><option>Approved</option><option>Received</option>
        </select>
        <button onClick={fetchPOs} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 13px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          <MdRefresh size={15} /> Refresh
        </button>
      </div>

      {/* ── PO Table ── */}
      <div style={{ background: '#fff', borderRadius: 13, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading purchase orders...</div>
        ) : pos.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <MdInventory2 size={38} style={{ marginBottom: 8, opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No purchase orders found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Create POs from Procurement → Purchase Orders first</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 750 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['PO ID', 'Vendor', 'Items', 'Grand Total', 'Delivery Date', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pos.map((po, i) => {
                  const sc = STATUS_COLORS[po.status] || STATUS_COLORS.Draft;
                  const isMatched = matchedPO?._id === po._id;
                  return (
                    <tr key={po._id} style={{ borderBottom: '1px solid #f1f5f9', background: isMatched ? '#f0fdf4' : i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#c0392b', fontSize: 13 }}>
                        {po.poId}
                        {isMatched && <span style={{ marginLeft: 6, fontSize: 10, background: '#dcfce7', color: '#16a34a', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>PDF Match</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#1e293b' }}>{po.vendor?.companyName || '—'}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, color: '#475569' }}>{po.items?.length || 0} item{po.items?.length !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>₹{Math.round(po.grandTotal || 0).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: '#64748b' }}>{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{po.status}</span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <button onClick={() => openInvoiceModal(po)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(192,57,43,0.2)', whiteSpace: 'nowrap' }}>
                            <MdReceipt size={14} /> Generate Invoice
                          </button>
                          <button onClick={() => setDeleteConfirm(po)} disabled={deleting === po._id} title="Delete PO"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 12, cursor: deleting === po._id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting === po._id ? 0.6 : 1 }}>
                            <MdDelete size={16} />
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

      {/* ══════════════════════════════════════════════════════════════════
          GENERATE INVOICE MODAL — Stock Check + Accept/Reject in one place
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        open={invoiceModal}
        onClose={closeModal}
        title={selectedPO ? `Generate Invoice — ${selectedPO.poId}` : 'Generate Invoice'}
        size="xl"
        footer={
          successMsg ? (
            <button onClick={() => { closeModal(); navigate('/po-generator/invoice-history'); }}
              style={{ padding: '9px 22px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              View Invoice →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
              <button onClick={closeModal} style={{ padding: '9px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              {!stockLoading && hasAnyStock && !successMsg && (
                <>
                  <button onClick={handleReject} disabled={submitting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: '#fff', color: '#dc2626', border: '2px solid #fecaca', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 }}>
                    ✗ Not Accept
                  </button>
                  <button onClick={handleAccept} disabled={submitting || invoiceItems.length === 0}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px', background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: (submitting || invoiceItems.length === 0) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(22,163,74,0.3)', opacity: (submitting || invoiceItems.length === 0) ? 0.6 : 1 }}>
                    <MdReceipt size={16} /> {submitting ? 'Generating...' : canFullInvoice ? 'Accept — Full Invoice' : 'Accept — Partial Invoice'}
                  </button>
                </>
              )}
            </div>
          )
        }
      >
        {/* ── Success State ── */}
        {successMsg && (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d', marginBottom: 8 }}>{successMsg}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Your invoice has been created and saved successfully.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { closeModal(); navigate('/po-generator/invoice-history'); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(192,57,43,0.3)' }}>
                <MdHistory size={18} /> View Invoice
              </button>
              <button
                onClick={closeModal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Generate Another
              </button>
              {createdInvoiceId && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Delete this invoice?')) return;
                    try {
                      await poGeneratorApi.deleteInvoice(createdInvoiceId);
                      setSuccessMsg('');
                      setCreatedInvoiceId(null);
                      closeModal();
                    } catch (e) { alert(e.message); }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', background: '#fef2f2', color: '#dc2626', border: '2px solid #fecaca', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  🗑 Delete Invoice
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {submitError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '11px 15px', marginBottom: 14, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
            ❌ {submitError}
          </div>
        )}

        {/* ── Loading Stock ── */}
        {!successMsg && stockLoading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Checking warehouse stock...</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Comparing PO quantities against available inventory</div>
          </div>
        )}

        {/* ── Stock Error ── */}
        {!successMsg && stockError && (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#dc2626' }}>
            <MdError size={36} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>{stockError}</div>
          </div>
        )}

        {/* ── Stock Results ── */}
        {!successMsg && !stockLoading && stockData && (
          <div>
            {/* PO Summary */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>PO</div><div style={{ fontSize: 16, fontWeight: 800, color: '#c0392b' }}>{stockData.po.poId}</div></div>
              <div><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Vendor</div><div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{stockData.po.vendor?.companyName || '—'}</div></div>
              <div><div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Invoice Type</div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: canFullInvoice ? '#dcfce7' : '#fef9c3', color: canFullInvoice ? '#16a34a' : '#a16207' }}>
                  {canFullInvoice ? '✅ Full Invoice' : hasAnyStock ? '⚠️ Partial Invoice' : '❌ No Stock'}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Invoice Total</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#c0392b' }}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Summary pills */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Ready',        value: stockData.summary.readyItems,      bg: '#f0fdf4', color: '#16a34a' },
                { label: 'Low Stock',    value: stockData.summary.lowStockItems,   bg: '#fefce8', color: '#a16207' },
                { label: 'Out of Stock', value: stockData.summary.outOfStockItems, bg: '#fef2f2', color: '#dc2626' },
              ].map(s => (
                <div key={s.label} style={{ padding: '6px 14px', background: s.bg, borderRadius: 20, fontSize: 12, fontWeight: 700, color: s.color }}>
                  {s.value} {s.label}
                </div>
              ))}
            </div>

            {/* Items table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16 }}>
              {/* Quick mark-all bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mark All:</span>
                <button
                  onClick={() => {
                    const all = {};
                    stockData.items.forEach((_, i) => { all[i] = 'Delivered'; });
                    setItemDelivery(all);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✅ All Delivered
                </button>
                <button
                  onClick={() => {
                    const all = {};
                    stockData.items.forEach((_, i) => { all[i] = 'Not Delivered'; });
                    setItemDelivery(all);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ❌ All Not Delivered
                </button>
                <button
                  onClick={() => {
                    const all = {};
                    stockData.items.forEach((_, i) => { all[i] = 'Pending'; });
                    setItemDelivery(all);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ↺ Reset
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    {['Item Name', 'Requested', 'In Warehouse', 'Will Invoice', 'Pending', 'Unit Price', 'Line Total', 'Status', 'Delivery Status'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockData.items.map((item, i) => {
                    const badge = stockBadge(item.stockStatus);
                    const lineTotal = item.dispatchableQty * item.basePrice * (1 + item.gst / 100);
                    const delivery = itemDelivery[i] || 'Pending';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '11px 12px', fontWeight: 600, color: '#1e293b' }}>{item.itemName}</td>
                        <td style={{ padding: '11px 12px', color: '#475569' }}>{item.requestedQty} {item.unit}</td>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: item.availableQty >= item.requestedQty ? '#16a34a' : item.availableQty > 0 ? '#a16207' : '#dc2626' }}>
                          {item.availableQty} {item.unit}
                        </td>
                        <td style={{ padding: '11px 12px', fontWeight: 800, color: '#1d4ed8' }}>{item.dispatchableQty} {item.unit}</td>
                        <td style={{ padding: '11px 12px', fontWeight: item.pendingQty > 0 ? 700 : 400, color: item.pendingQty > 0 ? '#dc2626' : '#94a3b8' }}>
                          {item.pendingQty > 0 ? `${item.pendingQty} ${item.unit}` : '—'}
                        </td>
                        <td style={{ padding: '11px 12px', color: '#475569' }}>₹{(item.basePrice || 0).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '11px 12px', fontWeight: 700, color: item.dispatchableQty > 0 ? '#1e293b' : '#94a3b8' }}>
                          {item.dispatchableQty > 0 ? `₹${Math.round(lineTotal).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td style={{ padding: '11px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
                            {badge.icon} {item.stockStatus}
                          </span>
                        </td>
                        {/* ── Delivery Status ── */}
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                              <input
                                type="checkbox"
                                checked={delivery === 'Delivered'}
                                onChange={() => setItemDelivery(prev => ({ ...prev, [i]: delivery === 'Delivered' ? 'Pending' : 'Delivered' }))}
                                style={{ width: 15, height: 15, accentColor: '#16a34a', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 600, color: delivery === 'Delivered' ? '#16a34a' : '#94a3b8' }}>
                                ✅ Delivered
                              </span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
                              <input
                                type="checkbox"
                                checked={delivery === 'Not Delivered'}
                                onChange={() => setItemDelivery(prev => ({ ...prev, [i]: delivery === 'Not Delivered' ? 'Pending' : 'Not Delivered' }))}
                                style={{ width: 15, height: 15, accentColor: '#dc2626', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: 12, fontWeight: 600, color: delivery === 'Not Delivered' ? '#dc2626' : '#94a3b8' }}>
                                ❌ Not Delivered
                              </span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={7} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#64748b' }}>
                      Subtotal ₹{Math.round(subtotal).toLocaleString('en-IN')} + GST ₹{Math.round(gstTotal).toLocaleString('en-IN')} =
                      <span style={{ color: '#c0392b', fontSize: 15, fontWeight: 900, marginLeft: 6 }}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
                    </td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Status banners */}
            {!hasAnyStock && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#b91c1c' }}>
                <MdError size={18} /> <strong>No stock available.</strong> Invoice cannot be generated. All items will remain as pending orders.
              </div>
            )}
            {hasPending && hasAnyStock && (
              <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 9, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#78350f' }}>
                <MdWarning size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div><strong>Partial Invoice:</strong> Items with insufficient stock will be saved as <strong>Pending Orders</strong> and fulfilled when stock is replenished.</div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Add remarks for this invoice..."
                style={{ width: '100%', padding: '8px 11px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete PO Confirm Modal ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Purchase Order"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={() => setDeleteConfirm(null)} disabled={!!deleting}
              style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={() => deleteConfirm && handleDeletePO(deleteConfirm._id)} disabled={!!deleting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.6 : 1 }}>
              <MdDelete size={15} /> {deleting ? 'Deleting...' : 'Delete PO'}
            </button>
          </div>
        }
      >
        {deleteConfirm && (
          <div style={{ padding: '8px 0', fontSize: 14, color: '#475569' }}>
            Are you sure you want to delete <strong>{deleteConfirm.poId}</strong>? This cannot be undone.
          </div>
        )}
      </Modal>

    </div>
  );
}
