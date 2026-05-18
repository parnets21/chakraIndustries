import { useState, useRef } from 'react';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import { useNavigate } from 'react-router-dom';
import {
  MdPictureAsPdf, MdClose, MdTableChart,
  MdReceipt, MdHistory,
} from 'react-icons/md';

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

// ── Extract text WITH position data from PDF ─────────────────────────────────
async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
  ).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  // Collect all text items with their Y positions across all pages
  const allItems = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page    = await pdf.getPage(p);
    const content = await page.getTextContent();
    const vp      = page.getViewport({ scale: 1 });
    for (const item of content.items) {
      if (!item.str.trim()) continue;
      allItems.push({
        str: item.str.trim(),
        x:   Math.round(item.transform[4]),
        y:   Math.round(vp.height - item.transform[5]), // flip Y so top=0
        page: p,
      });
    }
  }

  // Group items into lines by Y proximity (within 4px = same line)
  const lines = [];
  for (const item of allItems) {
    const existing = lines.find(l => l.page === item.page && Math.abs(l.y - item.y) <= 4);
    if (existing) {
      existing.tokens.push(item);
      existing.tokens.sort((a, b) => a.x - b.x);
    } else {
      lines.push({ y: item.y, page: item.page, tokens: [item] });
    }
  }
  lines.sort((a, b) => a.page !== b.page ? a.page - b.page : a.y - b.y);

  // Build flat text (for header/total parsing) and structured lines
  const flatText = lines.map(l => l.tokens.map(t => t.str).join(' ')).join('\n');
  return { flatText, lines };
}

// ── Universal PDF PO Parser — works with ANY PO format ───────────────────────
// Uses positional line data to find item rows intelligently
function parsePOFromText({ flatText, lines }) {
  const text   = flatText;
  const result = { poNumber: '', vendor: '', vendorGST: '', buyerName: '', items: [], total: '', taxTotal: '', subTotal: '' };

  // ── Header fields from flat text ──────────────────────────────────────────
  const poMatch = text.match(/PO\s*No\.?\s*[:\-]?\s*([A-Z0-9\/\-]{5,30})/i)
    || text.match(/\b(PO[-\/][A-Z0-9\/\-]+)/i)
    || text.match(/Purchase\s+Order\s+(?:No\.?|#)\s*[:\-]?\s*([A-Z0-9\-\/]+)/i);
  if (poMatch) result.poNumber = poMatch[1].trim();

  const vendorMatch = text.match(/Vendor\s+Name\s*[:\-]\s*([^\n,]{3,60})/i)
    || text.match(/Vendor\s+Details?\s*[:\-]\s*([^\n,]{3,60})/i)
    || text.match(/Vendor\s*[:\-]\s*([^\n,]{3,60})/i);
  if (vendorMatch) result.vendor = vendorMatch[1].trim().slice(0, 80);

  const buyerMatch = text.match(/BILLING\s+ADDRESS\s*[:\-]?\s*([^\n]{3,60})/i)
    || text.match(/Bill\s+To\s*[:\-]?\s*([^\n]{3,60})/i)
    || text.match(/Entity\s+Details?\s*[:\-]?\s*([^\n]{3,60})/i);
  if (buyerMatch) result.buyerName = buyerMatch[1].trim().slice(0, 80);

  const netMatch   = text.match(/Net\s+Amount\s*[:\-]?\s*([\d,]+\.\d{2})/i);
  const grandMatch = text.match(/Grand\s+Total\s*[:\-]?\s*([\d,]+\.\d{2})/i)
    || text.match(/Total\s+Amount\s*[:\-]?\s*([\d,]+\.\d{2})/i);
  result.total = (netMatch || grandMatch)?.[1]?.replace(/,/g, '') || '';

  const taxMatch = text.match(/(?:Total\s+)?Tax\s+Amount\s*[:\-]?\s*([\d,]+\.\d{2})/i);
  if (taxMatch) result.taxTotal = taxMatch[1].replace(/,/g, '');

  const subMatch = text.match(/Total\s+(?:Base|Taxable)\s+(?:Value|Amount)\s*[:\-]?\s*([\d,]+\.\d{2})/i)
    || text.match(/Total\s+Amount\s*\(?Without\s+Tax\)?\s*[:\-]?\s*([\d,]+\.\d{2})/i)
    || text.match(/Sub\s*Total\s*[:\-]?\s*([\d,]+\.\d{2})/i);
  if (subMatch) result.subTotal = subMatch[1].replace(/,/g, '');

  // ── Item extraction using positional lines ────────────────────────────────
  const UOM_RE   = /^(Nos?\.?|Numbers?|Pcs?\.?|Kgs?\.?|Units?|EA|Sets?|Ltrs?\.?|Mtrs?\.?|Boxes?|Rolls?|Pairs?|Bags?|Sheets?)$/i;
  const PRICE_RE = /^[\d,]+\.\d{2}$/;
  const QTY_RE   = /^\d{1,5}(\.\d{1,3})?$/;
  const HSN_RE   = /^\d{6,10}$/;
  const PCT_RE   = /^\d{1,2}(\.\d)?$/; // percentage like 9, 2.5, 18
  const SKIP_LINE = /^(sl\.?|no\.?|description|item|qty|quantity|uom|unit|rate|price|cgst|sgst|igst|gst|amount|total|tax|discount|hsn|sac|value|page|terms|conditions|dear|we hereby|goods|please|vendor|billing|address|branch|contact|tel|mob|email|gstin|pan|cin|ifsc|bank|account|payment|warranty|delivery|shipping|purchase order|po date|po no)/i;

  const seen = new Set();

  for (const line of lines) {
    const tokens  = line.tokens.map(t => t.str);
    const lineStr = tokens.join(' ');

    if (SKIP_LINE.test(lineStr.trim())) continue;
    if (lineStr.length < 5) continue;

    // Need at least 2 prices
    const prices = tokens.filter(t => PRICE_RE.test(t)).map(t => parseFloat(t.replace(/,/g, '')));
    if (prices.length < 2) continue;

    // Need a qty
    const qtyToken = tokens.find(t => QTY_RE.test(t) && parseFloat(t) > 0 && parseFloat(t) < 10000);
    if (!qtyToken) continue;
    const qty = parseFloat(qtyToken);

    const uomToken  = tokens.find(t => UOM_RE.test(t)) || 'Nos';
    const hsnToken  = tokens.find(t => HSN_RE.test(t)) || '';

    // Line total = largest price
    const lineTotal = Math.max(...prices);

    // Unit rate: price where price * qty ≈ some other price in the line
    let unitRate = prices.find(p => {
      const computed = p * qty;
      return computed > 0 && prices.some(p2 => Math.abs(p2 - computed) / Math.max(p2, computed) < 0.35);
    });
    if (!unitRate) {
      const sorted = [...prices].sort((a, b) => b - a);
      unitRate = sorted[1] || sorted[0];
    }
    if (!unitRate || unitRate <= 0) continue;

    // Taxable value = unitRate * qty (before tax)
    const taxableValue = +(unitRate * qty).toFixed(2);

    // Extract percentage tokens (CGST%, SGST%, IGST%, Discount%)
    // Percentages are small numbers like 9, 2.5, 18 that appear between prices
    const pctTokens = tokens.filter(t => PCT_RE.test(t) && parseFloat(t) <= 28 && parseFloat(t) >= 0);

    // Identify CGST and SGST from percentage tokens
    // In GRT format: Discount% CGST% CGST_Val SGST% SGST_Val IGST% IGST_Val
    // We look for pairs of (pct, value) in the token sequence
    let cgst = 0, sgst = 0, igst = 0, discount = 0;
    let cgstVal = 0, sgstVal = 0, igstVal = 0;

    // Walk tokens in order to find pct→value pairs
    const taxPairs = [];
    for (let ti = 0; ti < tokens.length - 1; ti++) {
      const t = tokens[ti];
      const next = tokens[ti + 1];
      if (PCT_RE.test(t) && parseFloat(t) <= 28 && PRICE_RE.test(next)) {
        taxPairs.push({ pct: parseFloat(t), val: parseFloat(next.replace(/,/g, '')) });
      }
    }

    // Assign tax pairs: first non-zero pair = CGST, second = SGST, third = IGST
    const nonZeroPairs = taxPairs.filter(p => p.pct > 0);
    if (nonZeroPairs.length >= 2) {
      cgst = nonZeroPairs[0].pct; cgstVal = nonZeroPairs[0].val;
      sgst = nonZeroPairs[1].pct; sgstVal = nonZeroPairs[1].val;
    } else if (nonZeroPairs.length === 1) {
      igst = nonZeroPairs[0].pct; igstVal = nonZeroPairs[0].val;
    }

    // Total GST % = cgst + sgst + igst
    const totalGst = cgst + sgst + igst || Math.round((lineTotal - taxableValue) / taxableValue * 100);
    const gstSlabs = [0, 5, 12, 18, 28];
    const gst = gstSlabs.reduce((prev, curr) => Math.abs(curr - totalGst) < Math.abs(prev - totalGst) ? curr : prev, 18);

    // Item name: all non-numeric, non-UOM, non-HSN tokens
    const nameParts = tokens.filter(t => {
      if (PRICE_RE.test(t)) return false;
      if (QTY_RE.test(t) && parseFloat(t) === qty) return false;
      if (UOM_RE.test(t)) return false;
      if (HSN_RE.test(t)) return false;
      if (/^\d+$/.test(t) && t.length <= 3) return false;
      if (PCT_RE.test(t) && parseFloat(t) <= 28) return false;
      return true;
    });

    let name = nameParts.join(' ').trim()
      .replace(/\s+/g, ' ')
      .replace(/^[\d]+\s+/, '')
      .replace(/\s*\/\s*$/, '')
      .trim();

    if (name.length < 3 || SKIP_LINE.test(name)) continue;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    result.items.push({
      name,
      qty,
      unit:         typeof uomToken === 'string' ? uomToken : 'Nos',
      rate:         unitRate,
      gst,
      cgst,         sgstVal,
      sgst,         cgstVal,
      igst,         igstVal,
      discount,
      taxableValue,
      lineAmount:   lineTotal,
      hsn:          hsnToken,
    });
  }

  return result;
}

export default function POUploadPage() {
  const fileRef  = useRef(null);
  const navigate = useNavigate();

  // PDF upload state
  const [parsing, setParsing]           = useState(false);
  const [parseError, setParseError]     = useState('');
  const [parsedPO, setParsedPO]         = useState(null);
  const [showPDFPanel, setShowPDFPanel] = useState(false);
  const [editableItems, setEditableItems] = useState([]);

  // Invoice creation state
  const [pdfInvoicing, setPdfInvoicing] = useState(false);
  const [pdfInvoiceMsg, setPdfInvoiceMsg] = useState('');

  // PDF upload
  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setParseError('Please upload a valid PDF file.'); return; }
    setParsing(true); setParseError(''); setParsedPO(null);
    try {
      const extracted = await extractTextFromPDF(file);
      const parsed = parsePOFromText(extracted);
      parsed.fileName = file.name;
      setParsedPO(parsed);
      // Initialize editable items — always start with at least 1 blank row if nothing parsed
      setEditableItems(
        parsed.items.length > 0
          ? parsed.items.map(it => ({
              name:         it.name,
              hsn:          it.hsn || '',
              qty:          it.qty,
              unit:         it.unit || 'Nos',
              rate:         it.rate,
              discount:     it.discount || 0,
              cgst:         it.cgst || 0,
              sgst:         it.sgst || 0,
              igst:         it.igst || 0,
              gst:          it.gst || 18,
              taxableValue: it.taxableValue || +(it.qty * it.rate).toFixed(2),
              lineAmount:   it.lineAmount || +(it.qty * it.rate * (1 + (it.gst || 18) / 100)).toFixed(2),
            }))
          : [{ name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, cgst: 9, sgst: 9, igst: 0, gst: 18, taxableValue: 0, lineAmount: 0 }]
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
    const validItems = editableItems.filter(it => it.name.trim() && Number(it.qty) > 0 && Number(it.rate) > 0);
    if (!parsedPO || validItems.length === 0) { alert('Please add at least one item with name, qty and rate.'); return; }
    setPdfInvoicing(true);
    setPdfInvoiceMsg('');
    try {
      const res = await poGeneratorApi.generateInvoiceFromPDF({
        poNumber:   parsedPO.poNumber,
        vendorName: parsedPO.vendor,
        buyerName:  parsedPO.buyerName,
        items:      validItems.map(it => {
          const qty      = Number(it.qty);
          const rate     = Number(it.rate);
          const disc     = Number(it.discount) || 0;
          const cgst     = Number(it.cgst) || 0;
          const sgst     = Number(it.sgst) || 0;
          const igst     = Number(it.igst) || 0;
          const taxable  = +(rate * qty * (1 - disc / 100)).toFixed(2);
          const cgstVal  = +(taxable * cgst / 100).toFixed(2);
          const sgstVal  = +(taxable * sgst / 100).toFixed(2);
          const igstVal  = +(taxable * igst / 100).toFixed(2);
          const lineAmt  = +(taxable + cgstVal + sgstVal + igstVal).toFixed(2);
          return {
            name:         it.name.trim(),
            qty,
            unit:         it.unit || 'Nos',
            rate,
            discount:     disc,
            cgst,         cgstVal,
            sgst,         sgstVal,
            igst,         igstVal,
            gst:          cgst + sgst + igst || Number(it.gst) || 18,
            hsn:          it.hsn || '',
            taxableValue: taxable,
            lineAmount:   lineAmt,
          };
        }),
        total: parsedPO.total,
        notes: `Created from PDF: ${parsedPO.fileName}`,
      });
      setPdfInvoiceMsg(res.message || 'Invoice created!');
    } catch (e) {
      setPdfInvoiceMsg('Error: ' + e.message);
    } finally {
      setPdfInvoicing(false);
    }
  };

  const matchedPO = null; // PDF-only flow — no DB PO matching needed

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>PO Upload & Invoice Generation</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Upload any PO PDF — data is auto-extracted, edit if needed, then create invoice</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePDFUpload} style={{ display: 'none' }} />
          <button onClick={() => navigate('/po-generator/invoice-history')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <MdHistory size={15} /> Invoice History
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={parsing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: parsing ? '#94a3b8' : 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: parsing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(192,57,43,0.3)' }}>
            <MdPictureAsPdf size={18} /> {parsing ? 'Reading PDF...' : 'Upload PO PDF'}
          </button>
        </div>
      </div>

      {/* ── Empty state — show upload prompt when no PDF loaded ── */}
      {!showPDFPanel && !parseError && (
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed #e2e8f0', borderRadius: 16, padding: '60px 40px', textAlign: 'center', cursor: 'pointer', background: '#fff', marginBottom: 24, transition: 'border-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#c0392b'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <MdPictureAsPdf size={56} color="#c0392b" style={{ opacity: 0.6, marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Drop your PO PDF here or click to upload</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Supports any PO format — GRT, Zolo, or any standard purchase order PDF</div>
          <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700 }}>
            <MdPictureAsPdf size={18} /> Select PDF File
          </div>
        </div>
      )}
      {parseError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '11px 15px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
          <span>❌ {parseError}</span>
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
          {/* Editable items table — always shown, pre-filled from PDF or blank */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdTableChart size={14} />
                {parsedPO.items.length > 0 ? `Line Items (auto-filled — edit if needed)` : `Line Items — PDF could not extract items, enter manually`}
              </span>
              <button
                onClick={() => setEditableItems(prev => [...prev, { name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, cgst: 9, sgst: 9, igst: 0, gst: 18, taxableValue: 0, lineAmount: 0 }])}
                style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add Row
              </button>
            </div>

            {parsedPO.items.length === 0 && (
              <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                ⚠️ Could not auto-detect items from this PDF format. Please enter them manually below — all fields are editable.
              </div>
            )}

            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#fff' }}>
                    {['#', 'Item Name', 'HSN', 'Qty', 'UOM', 'Unit Rate', 'Disc%', 'CGST%', 'CGST Val', 'SGST%', 'SGST Val', 'IGST%', 'IGST Val', 'Taxable Val', 'Tax Amt', 'Total Amt', ''].map(h => (
                      <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#cbd5e1' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editableItems.map((item, i) => {
                    const qty      = Number(item.qty)  || 0;
                    const rate     = Number(item.rate) || 0;
                    const disc     = Number(item.discount) || 0;
                    const cgstPct  = Number(item.cgst) || 0;
                    const sgstPct  = Number(item.sgst) || 0;
                    const igstPct  = Number(item.igst) || 0;
                    const taxable  = +(rate * qty * (1 - disc / 100)).toFixed(2);
                    const cgstVal  = +(taxable * cgstPct / 100).toFixed(2);
                    const sgstVal  = +(taxable * sgstPct / 100).toFixed(2);
                    const igstVal  = +(taxable * igstPct / 100).toFixed(2);
                    const taxAmt   = +(cgstVal + sgstVal + igstVal).toFixed(2);
                    const total    = +(taxable + taxAmt).toFixed(2);
                    const updateItem = (field, val) => setEditableItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
                    const inp = (field, w, type='text', step) => (
                      <input type={type} value={item[field]} onChange={e => updateItem(field, type === 'number' ? e.target.value : e.target.value)}
                        step={step} min="0"
                        style={{ width: w, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                    );
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <td style={{ padding: '4px 8px', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('name', 160)}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('hsn', 72)}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('qty', 52, 'number', '0.001')}</td>
                        <td style={{ padding: '3px 4px' }}>
                          <select value={item.unit} onChange={e => updateItem('unit', e.target.value)}
                            style={{ width: 60, padding: '4px 4px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 11, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
                            {['Nos','Numbers','Pcs','Kgs','Units','EA','Sets','Ltrs','Mtrs','Boxes','Rolls','Pairs','Bags','Sheets'].map(u => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '3px 4px' }}>{inp('rate', 80, 'number', '0.01')}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('discount', 44, 'number', '0.1')}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('cgst', 44, 'number', '0.5')}</td>
                        <td style={{ padding: '4px 8px', color: '#1d4ed8', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{cgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('sgst', 44, 'number', '0.5')}</td>
                        <td style={{ padding: '4px 8px', color: '#1d4ed8', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{sgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '3px 4px' }}>{inp('igst', 44, 'number', '0.5')}</td>
                        <td style={{ padding: '4px 8px', color: '#7c3aed', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{igstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '4px 8px', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '4px 8px', color: '#a16207', fontWeight: 600, whiteSpace: 'nowrap' }}>₹{taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '4px 8px', fontWeight: 800, color: '#c0392b', whiteSpace: 'nowrap' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '3px 4px' }}>
                          <button onClick={() => setEditableItems(prev => prev.filter((_, idx) => idx !== i))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '3px' }}>
                            <MdClose size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={8} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: 12 }}>Totals →</td>
                    <td style={{ padding: '8px 8px', fontWeight: 700, color: '#1d4ed8', fontSize: 12 }}>
                      ₹{editableItems.reduce((s, it) => {
                        const t = +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2);
                        return s + +(t * (Number(it.cgst)||0) / 100).toFixed(2);
                      }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td />
                    <td style={{ padding: '8px 8px', fontWeight: 700, color: '#1d4ed8', fontSize: 12 }}>
                      ₹{editableItems.reduce((s, it) => {
                        const t = +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2);
                        return s + +(t * (Number(it.sgst)||0) / 100).toFixed(2);
                      }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td />
                    <td style={{ padding: '8px 8px', fontWeight: 700, color: '#7c3aed', fontSize: 12 }}>
                      ₹{editableItems.reduce((s, it) => {
                        const t = +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2);
                        return s + +(t * (Number(it.igst)||0) / 100).toFixed(2);
                      }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px 8px', fontWeight: 700, color: '#475569', fontSize: 12 }}>
                      ₹{editableItems.reduce((s, it) => s + +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px 8px', fontWeight: 700, color: '#a16207', fontSize: 12 }}>
                      ₹{editableItems.reduce((s, it) => {
                        const t = +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2);
                        const tax = +((t*(Number(it.cgst)||0)/100) + (t*(Number(it.sgst)||0)/100) + (t*(Number(it.igst)||0)/100)).toFixed(2);
                        return s + tax;
                      }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px 8px', fontWeight: 900, color: '#c0392b', fontSize: 14 }}>
                      ₹{editableItems.reduce((s, it) => {
                        const t = +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2);
                        const tax = +((t*(Number(it.cgst)||0)/100) + (t*(Number(it.sgst)||0)/100) + (t*(Number(it.igst)||0)/100)).toFixed(2);
                        return s + t + tax;
                      }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                {pdfInvoicing ? 'Creating Invoice...' : `Create Invoice from PDF  ·  ${editableItems.filter(it => it.name.trim()).length} item(s)  ·  ₹${editableItems.reduce((s, it) => {
                  const t = +(Number(it.rate) * Number(it.qty) * (1 - (Number(it.discount)||0)/100)).toFixed(2);
                  const tax = +((t*(Number(it.cgst)||0)/100) + (t*(Number(it.sgst)||0)/100) + (t*(Number(it.igst)||0)/100)).toFixed(2);
                  return s + t + tax;
                }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
