import { useCallback, useEffect, useState, useRef } from 'react';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import { useNavigate } from 'react-router-dom';
import {
  MdPictureAsPdf, MdClose, MdTableChart,
  MdReceipt, MdHistory, MdCalendarToday, MdRefresh,
  MdVisibility, MdDelete,
} from 'react-icons/md';
import Modal from '../../components/common/Modal';

const todayKey = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const money = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDateTime = (v) => v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

// ── PDF text extraction ───────────────────────────────────────────────────────
async function extractTextFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const allItems = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const vp = page.getViewport({ scale: 1 });
    for (const item of content.items) {
      if (!item.str.trim()) continue;
      allItems.push({ str: item.str.trim(), x: Math.round(item.transform[4]), y: Math.round(vp.height - item.transform[5]), page: p });
    }
  }
  const lines = [];
  for (const item of allItems) {
    const ex = lines.find(l => l.page === item.page && Math.abs(l.y - item.y) <= 12);
    if (ex) { ex.tokens.push(item); ex.tokens.sort((a, b) => a.x - b.x); }
    else lines.push({ y: item.y, page: item.page, tokens: [item] });
  }
  lines.sort((a, b) => a.page !== b.page ? a.page - b.page : a.y - b.y);
  const flatText = lines.map(l => l.tokens.map(t => t.str).join(' ')).join('\n');
  return { flatText, lines };
}

function parsePOFromText({ flatText, lines }) {
  const text = flatText;
  const result = { poNumber: '', vendor: '', buyerName: '', buyerAddress: '', buyerGSTIN: '', shipToName: '', shipToAddress: '', items: [], total: '', taxTotal: '', subTotal: '' };

  // Debug: log all lines so we can see exactly what pdfjs extracted
  console.log('=== RAW PDF LINES ===');
  lines.forEach((l, i) => {
    const toks = l.tokens.map(t => `[x${t.x}:"${t.str}"]`).join(' ');
    console.log(`L${i} y=${l.y} p=${l.page}: ${toks}`);
  });
  console.log('=== FLAT TEXT ===');
  console.log(text);
  console.log('=== END ===');

  const toNum = (v) => {
    // Remove currency symbols and thousand-separator commas, but keep decimal point
    const cleaned = String(v || '')
      .replace(/[₹]/g, '')
      .replace(/\bRs\.?\s*/gi, '')
      .replace(/\bINR\s*/gi, '')
      .replace(/,/g, '')   // remove thousand separators
      .trim();
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  };

  const GSTIN_RE = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])\b/;
  const UOM_RE   = /^(Nos?\.?|Numbers?|Pcs?\.?|Kgs?\.?|Units?|EA|Sets?|Ltrs?\.?|Mtrs?\.?|Boxes?|Rolls?|Pairs?|Bags?|Sheets?|MT|MTs?|Ton|Tons?|Tonne|Tonnes?|Quintal|Quintals?|Sqft|Sqm|RMT|Mtr|Mtrs?|Ltr|Ltrs?|Gms?|Grams?|Dozen|Bale|Bundle|Coil|Drum|Packet|Pkt)$/i;

  // ── PO Number ────────────────────────────────────────────────────────────
  const poM = text.match(/(?:PO|Purchase\s+Order)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,29})/i)
    || text.match(/Order\s+(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,29})/i);
  if (poM && /\d/.test(poM[1])) result.poNumber = poM[1].trim();

  // ── Vendor ───────────────────────────────────────────────────────────────
  const vendM = text.match(/Vendor\s+Name\s*[:\-]\s*([^\n]{3,80})/i)
    || text.match(/Supplier\s*[:\-]\s*([^\n]{3,80})/i)
    || text.match(/Vendor\s*[:\-]\s*([^\n,]{3,80})/i);
  if (vendM) {
    let v = vendM[1].trim().replace(/\s*Purchase\s+Order.*$/i, '').replace(/\s*(PO\s*No\.?)\s*[:\-].*$/i, '').trim();
    if (v.length >= 3) result.vendor = v.slice(0, 80);
  }

  // ── Buyer / Bill-To ───────────────────────────────────────────────────────
  const billingIdx = text.search(/(?:BILLING\s+ADDRESS|BILLING\s*[:\-])/i);
  if (billingIdx !== -1) {
    const block = text.slice(billingIdx, billingIdx + 600);
    const nm = block.match(/(?:BILLING\s+ADDRESS|BILLING)\s*[:\-]+\s*([^\n]{3,120})/i);
    if (nm) result.buyerName = nm[1].trim().replace(/[,\s]+$/, '').slice(0, 120);
    const gm = block.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
    if (gm) result.buyerGSTIN = gm[1];
    const addrLines = [];
    for (const ln of block.split('\n').slice(1, 8)) {
      const t = ln.trim();
      if (!t) continue;
      if (/^(PAN|CIN|BRANCH|E-Mail|Contact|Tel|Mob|Payment|Warranty|Delivery|PO\s*No|Vendor)/i.test(t)) break;
      if (GSTIN_RE.test(t) && t.length < 25) { if (!result.buyerGSTIN) result.buyerGSTIN = t.match(GSTIN_RE)[1]; continue; }
      addrLines.push(t);
    }
    result.buyerAddress = addrLines.slice(0, 5).join(', ');
  }
  if (!result.buyerGSTIN) {
    const all = [...text.matchAll(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])\b/g)].map(m => m[1]);
    result.buyerGSTIN = all[0] || '';
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  // Find ALL matches for each pattern and pick the largest value (avoids picking up 0.00 column headers)
  const findBestTotal = (re) => {
    const matches = [...text.matchAll(new RegExp(re.source, re.flags + 'g'))];
    if (!matches.length) return '';
    const vals = matches.map(m => parseFloat(m[1].replace(/,/g, ''))).filter(n => isFinite(n) && n > 0);
    return vals.length ? String(Math.max(...vals)) : '';
  };

  result.total = findBestTotal(/Net\s+Amount\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || findBestTotal(/Amount\s+Payable\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || findBestTotal(/Grand\s+Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || findBestTotal(/Invoice\s+Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || findBestTotal(/Total\s+Amount\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i);

  result.subTotal = findBestTotal(/Total\s+(?:Base|Taxable)\s+(?:Value|Amount)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || findBestTotal(/Sub\s*Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i);

  // ── STEP 1: Find table header row using x-position based column detection ──
  // pdfjs gives us tokens with exact x,y coordinates. We use x to identify columns.

  const COL_KEYWORDS = {
    sl:      ['sl', 'sl.', 'sl.no', 'sl.no.', 's.no', 's.no.', 'sr.no', 'sr.no.', '#', 'no'],
    desc:    ['description', 'description/hsncode', 'item', 'product', 'material', 'particulars', 'goods', 'itemdescription'],
    hsn:     ['hsn', 'sac', 'hsncode', 'saccode', 'hsn/sac'],
    qty:     ['qty', 'qty.', 'quantity', 'nos', 'nos.'],
    uom:     ['uom', 'unit', 'units'],
    rate:    ['rate', 'unitrate', 'price', 'unitprice', 'mrp', 'basicrate'],
    disc:    ['disc', 'disc.', 'discount', 'disc%', 'discount%'],
    cgstPct: ['cgst%', 'cgst'],
    cgstVal: ['cgstvalue', 'cgstval', 'cgstamt', 'cgstamount'],
    sgstPct: ['sgst%', 'sgst'],
    sgstVal: ['sgstvalue', 'sgstval', 'sgstamt', 'sgstamount'],
    igstPct: ['igst%', 'igst'],
    igstVal: ['igstvalue', 'igstval', 'igstamt', 'igstamount'],
    taxable: ['taxablevalue', 'taxableamt', 'taxableamount', 'baseamount', 'assessable', 'taxable'],
    taxAmt:  ['taxamount', 'taxamt', 'totaltax'],
    total:   ['totalamount', 'amount', 'linetotal', 'total'],
  };

  // Normalize a token string for keyword matching
  const norm = (s) => String(s || '').toLowerCase().replace(/[\s\/\-\.]/g, '');

  // Find header: scan lines, try to match tokens (including adjacent token combos) to column keywords
  let colMap = {};   // colName → x position
  let headerLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const toks = lines[i].tokens;
    const found = {};

    for (let ti = 0; ti < toks.length; ti++) {
      // Try 1, 2, and 3 token combinations
      for (let len = 1; len <= 3 && ti + len - 1 < toks.length; len++) {
        const combined = norm(toks.slice(ti, ti + len).map(t => t.str).join(''));
        for (const [col, keywords] of Object.entries(COL_KEYWORDS)) {
          if (!found[col] && keywords.includes(combined)) {
            // Use x of the middle token as column center
            const midTok = toks[ti + Math.floor((len - 1) / 2)];
            found[col] = midTok.x;
          }
        }
      }
    }

    const matchCount = Object.keys(found).length;
    if (matchCount >= 5) {
      colMap = found;
      headerLineIdx = i;
      console.log(`📋 Header at line ${i} with ${matchCount} cols:`, found);
      break;
    }
  }

  // ── STEP 2: If header found, parse data rows by x-column proximity ────────
  if (headerLineIdx >= 0 && Object.keys(colMap).length >= 5) {

    const nearestCol = (x) => {
      let best = null, bestDist = Infinity;
      for (const [col, cx] of Object.entries(colMap)) {
        const d = Math.abs(x - cx);
        if (d < bestDist) { bestDist = d; best = col; }
      }
      return bestDist <= 80 ? best : null;
    };

    const FOOTER_RE = /^(total\s*base|total\s*taxable|sub\s*total|grand\s*total|net\s*amount|amount\s*payable|cgst\s*amount|sgst\s*amount|igst\s*amount|amount\s*in\s*words|terms|dear\s*sir|authorized|page\s*\d)/i;

    // Collect data lines after header
    const dataLines = [];
    for (let i = headerLineIdx + 1; i < lines.length; i++) {
      const ls = lines[i].tokens.map(t => t.str).join(' ').trim();
      if (!ls) continue;
      if (FOOTER_RE.test(ls)) break;
      dataLines.push(lines[i]);
    }

    // Group into item rows — new row when first token is at sl column and is a number
    const slX = colMap.sl ?? colMap.desc ?? 0;
    const itemRows = [];
    let cur = [];
    for (const line of dataLines) {
      const ft = line.tokens[0];
      const isSerial = ft && /^\d{1,3}\.?$/.test(ft.str.trim()) && Math.abs(ft.x - slX) < 80;
      if (isSerial && cur.length > 0) { itemRows.push(cur); cur = []; }
      cur.push(line);
    }
    if (cur.length > 0) itemRows.push(cur);

    console.log(`📦 ${itemRows.length} item rows`);

    for (const rowLines of itemRows) {
      const allToks = rowLines.flatMap(l => l.tokens);

      console.log('🔍 Row tokens:', allToks.map(t => `[x${t.x}:"${t.str}"]`).join(' '));

      const colVals = {};
      for (const tok of allToks) {
        const col = nearestCol(tok.x);
        if (col) { if (!colVals[col]) colVals[col] = []; colVals[col].push(tok.str.trim()); }
      }

      console.log('🗂️ ColVals:', JSON.stringify(colVals));

      const getStr = (col) => (colVals[col] || []).join(' ').trim();
      const getN   = (col) => toNum(getStr(col));

      // Name: try desc column first, then fall back to any non-numeric text tokens
      // that are to the LEFT of the qty column (leftmost numeric column)
      let name = getStr('desc');

      if (name.length < 2) {
        // Fallback: collect all text tokens that are clearly in the left portion of the row
        // (x position less than the qty column x, or less than half the page width)
        const qtyX = colMap.qty ?? colMap.uom ?? colMap.rate ?? 999;
        const descX = colMap.desc ?? colMap.sl ?? 0;
        const nameToks = allToks
          .filter(t => {
            // Must be to the left of qty column
            if (t.x >= qtyX - 20) return false;
            // Must not be a pure number
            if (/^[\d,]+(\.\d+)?$/.test(t.str.trim())) return false;
            // Must not be a serial number (first token)
            if (/^\d{1,3}\.?$/.test(t.str.trim())) return false;
            return true;
          })
          .sort((a, b) => a.x - b.x || a.y - b.y)
          .map(t => t.str.trim());
        name = nameToks.join(' ').trim();
        console.log('📝 Name fallback from left tokens:', name);
      }

      const hsnM = name.match(/\/\s*(\d{6,10})(?:\s|$)/);
      let hsn = getStr('hsn') || (hsnM ? hsnM[1] : '');
      if (hsnM) name = name.replace(hsnM[0], '').trim();
      name = name.replace(/\s+/g, ' ').replace(/[^\w\s\-\/\.&,()]/g, '').trim();
      if (name.length < 2) { console.log('⚠️ Skip: no name even after fallback', colVals); continue; }

      const qty     = getN('qty');
      const uom     = getStr('uom') || 'Nos';
      const rate    = getN('rate');
      const disc    = getN('disc') || 0;
      const cgstPct = getN('cgstPct');
      const cgstVal = getN('cgstVal');
      const sgstPct = getN('sgstPct');
      const sgstVal = getN('sgstVal');
      const igstPct = getN('igstPct');
      const igstVal = getN('igstVal');
      let taxable   = getN('taxable');
      const lineAmt = getN('total');

      if (!qty || !rate || !lineAmt) {
        console.log('⚠️ Skip row missing qty/rate/total:', name, { qty, rate, lineAmt, colVals });
        continue;
      }

      if (!taxable) taxable = +(rate * qty * (1 - disc / 100)).toFixed(2);
      const fCgstVal = cgstVal || +(taxable * cgstPct / 100).toFixed(2);
      const fSgstVal = sgstVal || +(taxable * sgstPct / 100).toFixed(2);
      const fIgstVal = igstVal || +(taxable * igstPct / 100).toFixed(2);

      const item = { name, qty, unit: uom, hsn, rate, discount: disc,
        cgst: cgstPct, cgstVal: fCgstVal, sgst: sgstPct, sgstVal: fSgstVal,
        igst: igstPct, igstVal: fIgstVal, gst: cgstPct + sgstPct + igstPct,
        taxableValue: taxable, lineAmount: lineAmt };
      console.log('✅ Item:', name, '| qty:', qty, '| rate:', rate, '| igst%:', igstPct, '| igstVal:', fIgstVal, '| taxable:', taxable, '| total:', lineAmt);
      result.items.push(item);
    }
  }

  // ── STEP 3: Fallback — parse by reading each line's tokens positionally ───
  // Used when header detection fails. Each data row starts with a serial number.
  // We read numbers from right-to-left: total, taxAmt, taxable, then find qty×rate.
  if (result.items.length === 0) {
    console.log('⚠️ Header parse failed, using positional fallback');
    const SKIP = /total|subtotal|grand|net\s+amount|amount\s+payable|tax\s+amount|in\s+words|terms|dear\s+sir|authorized|page\s+\d|cgst\s+amount|sgst\s+amount|igst\s+amount/i;

    for (const line of lines) {
      const toks = line.tokens.map(t => t.str);
      if (SKIP.test(toks.join(' '))) continue;
      if (!/^\d{1,3}\.?$/.test(toks[0])) continue;  // must start with serial

      // Extract all positive numbers from the line
      const nums = [];
      for (const t of toks) {
        const n = toNum(t);
        if (n > 0) nums.push(n);
      }
      if (nums.length < 5) continue;

      // Find UOM token
      const uomTok = toks.find(t => UOM_RE.test(t)) || 'Nos';

      // Name = text tokens before first number (excluding serial)
      const firstNumIdx = toks.findIndex((t, i) => i > 0 && toNum(t) > 0);
      let name = toks.slice(1, firstNumIdx > 0 ? firstNumIdx : 4).join(' ').trim();
      name = name.replace(/\/\s*\d{6,10}/, '').replace(UOM_RE, '').trim();
      if (name.length < 2) continue;

      // From right: total, taxAmt, taxable
      const lineAmt = nums[nums.length - 1];
      const taxAmt  = nums[nums.length - 2];
      const taxable = nums[nums.length - 3];

      // Find qty × rate ≈ taxable
      let qty = 0, rate = 0;
      const candidates = nums.slice(0, nums.length - 3);
      for (let a = 0; a < candidates.length && !qty; a++) {
        for (let b = a + 1; b < candidates.length && !qty; b++) {
          const prod = candidates[a] * candidates[b];
          if (taxable > 0 && Math.abs(prod - taxable) / taxable < 0.02) {
            qty  = Math.min(candidates[a], candidates[b]);
            rate = Math.max(candidates[a], candidates[b]);
          }
        }
      }
      if (!qty || !rate) continue;

      const gstPct = taxable > 0 ? Math.round(taxAmt / taxable * 100) : 18;
      // Inter-state if IGST column present in text
      const isIGST = /\bIGST\b/.test(text);
      const item = {
        name, qty, unit: uomTok, hsn: '', rate, discount: 0,
        cgst: isIGST ? 0 : gstPct / 2,
        cgstVal: isIGST ? 0 : +(taxable * gstPct / 200).toFixed(2),
        sgst: isIGST ? 0 : gstPct / 2,
        sgstVal: isIGST ? 0 : +(taxable * gstPct / 200).toFixed(2),
        igst: isIGST ? gstPct : 0,
        igstVal: isIGST ? taxAmt : 0,
        gst: gstPct, taxableValue: taxable, lineAmount: lineAmt,
      };
      console.log('✅ Fallback item:', name, '| qty:', qty, '| rate:', rate, '| total:', lineAmt);
      result.items.push(item);
    }
  }

  console.log('📊 Result:', { items: result.items.length, poNumber: result.poNumber, vendor: result.vendor, total: result.total });
  return result;
}

// ── React Component ───────────────────────────────────────────────────────────
export default function POUploadPage() {
  const fileRef  = useRef(null);
  const navigate = useNavigate();
  const [parsing, setParsing]             = useState(false);
  const [parseError, setParseError]       = useState('');
  const [parsedPO, setParsedPO]           = useState(null);
  const [showPDFPanel, setShowPDFPanel]   = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [pdfInvoicing, setPdfInvoicing]   = useState(false);
  const [pdfInvoiceMsg, setPdfInvoiceMsg] = useState('');
  const [selectedUploadDate, setSelectedUploadDate] = useState(todayKey());
  const [uploadSummary, setUploadSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError]   = useState('');
  const [viewInvoice, setViewInvoice]     = useState(null);
  const [viewLoading, setViewLoading]     = useState('');
  const [deletingInvoice, setDeletingInvoice] = useState('');

  const loadUploadSummary = useCallback(async (date = selectedUploadDate) => {
    setSummaryLoading(true); setSummaryError('');
    try { const res = await poGeneratorApi.getUploadSummary({ date }); setUploadSummary(res.data); }
    catch (err) { setSummaryError(err.message || 'Failed to load uploaded PO summary'); }
    finally { setSummaryLoading(false); }
  }, [selectedUploadDate]);

  useEffect(() => { loadUploadSummary(selectedUploadDate); }, [loadUploadSummary, selectedUploadDate]);

  const handleViewInvoice = async (invoice) => {
    if (!invoice?._id) return;
    setViewLoading(invoice._id);
    try { const res = await poGeneratorApi.getInvoiceById(invoice._id); setViewInvoice(res.data || invoice); }
    catch (err) { alert(err.message || 'Failed to load invoice details'); }
    finally { setViewLoading(''); }
  };

  const handleDeleteInvoice = async (invoice) => {
    if (!invoice?._id) return;
    if (!window.confirm(`Delete ${invoice.invoiceNo || 'this invoice'}?`)) return;
    setDeletingInvoice(invoice._id);
    try { await poGeneratorApi.deleteInvoice(invoice._id); await loadUploadSummary(selectedUploadDate); }
    catch (err) { alert(err.message || 'Failed to delete invoice'); }
    finally { setDeletingInvoice(''); }
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'))) { setParseError('Please upload a valid PDF file.'); return; }
    setParsing(true); setParseError(''); setParsedPO(null);
    try {
      const extracted = await extractTextFromPDF(file);
      const parsed = parsePOFromText(extracted);
      parsed.fileName = file.name;
      setParsedPO(parsed);
      setEditableItems(parsed.items.length > 0
        ? parsed.items.map(it => ({
            name: it.name,
            hsn: it.hsn || '',
            qty: it.qty,
            unit: it.unit || 'Nos',
            rate: it.rate,
            discount: it.discount || 0,
            cgst: it.cgst ?? 0,
            sgst: it.sgst ?? 0,
            igst: it.igst ?? 0,
            gst: it.gst ?? 0,
            // Store the PDF-sourced values so the table shows them correctly
            taxableValue: it.taxableValue || +(it.qty * it.rate).toFixed(2),
            lineAmount: it.lineAmount || +(it.qty * it.rate).toFixed(2),
          }))
        : [{ name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, cgst: 0, sgst: 0, igst: 0, gst: 0, taxableValue: 0, lineAmount: 0 }]);
      setShowPDFPanel(true);
    } catch (err) {
      console.error('PDF parse error:', err);
      setParseError(`Failed to read PDF: ${err.message || 'Unknown error'}. Make sure it is a text-based PDF.`);
    } finally { setParsing(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleCreateFromPDF = async () => {
    const validItems = editableItems.filter(it => it.name.trim() && Number(it.qty) > 0 && Number(it.rate) > 0);
    if (!parsedPO || validItems.length === 0) { alert('Please add at least one item with name, qty and rate.'); return; }
    setPdfInvoicing(true); setPdfInvoiceMsg('');
    try {
      const res = await poGeneratorApi.generateInvoiceFromPDF({
        poNumber: parsedPO.poNumber, vendorName: parsedPO.vendor, buyerName: parsedPO.buyerName,
        buyerAddress: parsedPO.buyerAddress || '', buyerGSTIN: parsedPO.buyerGSTIN || '',
        shipToName: parsedPO.shipToName || '', shipToAddress: parsedPO.shipToAddress || '',
        items: validItems.map(it => {
          const qty     = Number(it.qty);
          const rate    = Number(it.rate);
          const disc    = Number(it.discount) || 0;
          const cgstPct = Number(it.cgst) || 0;
          const sgstPct = Number(it.sgst) || 0;
          const igstPct = Number(it.igst) || 0;
          const gstPct  = Number(it.gst)  || 0;

          // Taxable = base after discount
          const taxable = +(rate * qty * (1 - disc / 100)).toFixed(2);

          // Tax values — compute from percentages if available
          let cgstVal = +(taxable * cgstPct / 100).toFixed(2);
          let sgstVal = +(taxable * sgstPct / 100).toFixed(2);
          let igstVal = +(taxable * igstPct / 100).toFixed(2);

          // If all tax percentages are 0 but we have a PDF lineAmount larger than taxable,
          // back-calculate tax from the PDF line total (ground truth)
          const pdfLineAmt = Number(it.lineAmount) || 0;
          const taxFromPDF = +(pdfLineAmt - taxable).toFixed(2);

          if (cgstPct === 0 && sgstPct === 0 && igstPct === 0 && taxFromPDF > 0.01) {
            // Use PDF line total as the authoritative total; split tax as CGST+SGST
            const halfTax = +(taxFromPDF / 2).toFixed(2);
            cgstVal = halfTax;
            sgstVal = +(taxFromPDF - halfTax).toFixed(2); // handles odd penny
            igstVal = 0;
          }

          // Final line total = taxable + all tax amounts
          const lineAmount = +(taxable + cgstVal + sgstVal + igstVal).toFixed(2);

          // Effective GST %
          const effectiveGst = cgstPct + sgstPct + igstPct || gstPct ||
            (taxable > 0 ? Math.round((cgstVal + sgstVal + igstVal) / taxable * 100) : 18);

          return {
            name: it.name.trim(),
            qty,
            unit: it.unit || 'Nos',
            rate,
            discount: disc,
            cgst: cgstPct || (cgstVal > 0 ? +(cgstVal / taxable * 100).toFixed(2) : 0),
            cgstVal,
            sgst: sgstPct || (sgstVal > 0 ? +(sgstVal / taxable * 100).toFixed(2) : 0),
            sgstVal,
            igst: igstPct || (igstVal > 0 ? +(igstVal / taxable * 100).toFixed(2) : 0),
            igstVal,
            gst: effectiveGst,
            hsn: it.hsn || '',
            taxableValue: taxable,
            lineAmount,
          };
        }),
        total: parsedPO.total, notes: `Created from PDF: ${parsedPO.fileName}`,
      });
      const today = todayKey(); setSelectedUploadDate(today);
      setPdfInvoiceMsg(res.message || 'Invoice created!');
      await loadUploadSummary(today);
    } catch (e) { setPdfInvoiceMsg('Error: ' + e.message); }
    finally { setPdfInvoicing(false); }
  };

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        .po-page { display:flex; flex-direction:column; gap:20px; }
        .po-banner {
          background: linear-gradient(135deg,#0f172a 0%,#7f1d1d 60%,#0f172a 100%);
          border-radius:16px; padding:22px 26px;
          display:flex; align-items:center; justify-content:space-between;
          position:relative; overflow:hidden;
          box-shadow:0 6px 24px rgba(15,23,42,0.18); gap:16px;
        }
        .po-kpi-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:12px;
        }
        @media(min-width:640px)  { .po-kpi-grid { grid-template-columns:repeat(4,1fr); } }
        .po-card {
          background:#fff; border-radius:16px;
          border:1px solid #e8edf2;
          box-shadow:0 2px 10px rgba(15,23,42,0.05);
          overflow:hidden;
        }
        .po-card-head {
          display:flex; align-items:flex-start; justify-content:space-between;
          padding:16px 20px 0; margin-bottom:14px;
        }
        .po-table th { white-space:nowrap; }
        .po-table tr:hover td { background:#fef2f2 !important; }
        .po-btn-ghost {
          display:inline-flex; align-items:center; gap:6px;
          padding:9px 16px; background:#fff; color:#475569;
          border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:13px; font-weight:600; cursor:pointer;
          font-family:inherit; transition:border-color 0.15s,color 0.15s;
        }
        .po-btn-ghost:hover { border-color:#c0392b; color:#c0392b; }
        .po-btn-primary {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 22px;
          background:linear-gradient(135deg,#c0392b,#922b21);
          color:#fff; border:none; border-radius:10px;
          font-size:14px; font-weight:700; cursor:pointer;
          font-family:inherit; box-shadow:0 3px 12px rgba(192,57,43,0.3);
          transition:opacity 0.15s,transform 0.15s;
        }
        .po-btn-primary:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
        .po-btn-primary:disabled { background:#94a3b8; box-shadow:none; cursor:not-allowed; }
        .po-status-badge {
          display:inline-flex; padding:3px 10px; border-radius:999px;
          font-size:11px; font-weight:700;
        }
        .po-action-btn {
          width:32px; height:32px; display:inline-flex; align-items:center;
          justify-content:center; border-radius:8px; cursor:pointer;
          transition:opacity 0.15s;
        }
        .po-action-btn:hover { opacity:0.75; }
        .po-input {
          padding:5px 8px; border:1px solid #e2e8f0; border-radius:6px;
          font-size:12px; outline:none; font-family:inherit; background:#fff;
          transition:border-color 0.15s;
        }
        .po-input:focus { border-color:#c0392b; }
        .po-select {
          padding:5px 6px; border:1px solid #e2e8f0; border-radius:6px;
          font-size:11px; outline:none; font-family:inherit; background:#fff;
        }
      `}</style>

      <div className="po-page">

      {/* ── Banner ── */}
      <div className="po-banner">
        <div style={{ position:'absolute', top:-40, right:100, width:180, height:180, borderRadius:'50%', background:'rgba(239,68,68,0.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-30, right:40, width:120, height:120, borderRadius:'50%', background:'rgba(192,57,43,0.06)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.8)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>
            Finance · Procurement
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.4px', marginBottom:4 }}>
            PO Upload &amp; Invoice Generation
          </div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>
            Upload any PO PDF — data is auto-extracted, edit if needed, then create invoice
          </div>
        </div>
        <div style={{ position:'relative', zIndex:1, display:'flex', gap:10, flexShrink:0, flexWrap:'wrap' }}>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePDFUpload} style={{ display:'none' }} />
          <button className="po-btn-ghost" onClick={() => navigate('/po-generator/invoice-history')}>
            <MdHistory size={15} /> Invoice History
          </button>
          <button className="po-btn-primary" onClick={() => fileRef.current?.click()} disabled={parsing}>
            <MdPictureAsPdf size={18} /> {parsing ? 'Reading PDF...' : 'Upload PO PDF'}
          </button>
        </div>
      </div>

      {/* ── Parse Error ── */}
      {parseError && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#dc2626', boxShadow:'0 1px 4px rgba(220,38,38,0.08)' }}>
          <span style={{ fontSize:16 }}>❌</span>
          <span style={{ flex:1, fontWeight:500 }}>{parseError}</span>
          <button onClick={() => setParseError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4, borderRadius:6, display:'flex' }}><MdClose size={16} /></button>
        </div>
      )}


      {/* ── Day-wise Summary Card ── */}
      <div className="po-card">
        {/* Card header */}
        <div className="po-card-head">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, color:'#0f172a' }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#c0392b,#922b21)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
                <MdCalendarToday size={16} />
              </div>
              Daily PO Upload View
            </div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginLeft:40 }}>Select a date to review uploaded POs and generated invoices</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            <input type="date" value={selectedUploadDate} onChange={e => setSelectedUploadDate(e.target.value)}
              style={{ height:36, padding:'0 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, fontFamily:'inherit', color:'#0f172a', background:'#fff', outline:'none' }} />
            <button onClick={() => loadUploadSummary(selectedUploadDate)} disabled={summaryLoading}
              style={{ height:36, width:36, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #e2e8f0', borderRadius:9, background:summaryLoading?'#f1f5f9':'#fff', color:'#475569', cursor:summaryLoading?'not-allowed':'pointer', transition:'border-color 0.15s' }}>
              <MdRefresh size={17} style={{ animation: summaryLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {summaryError && (
          <div style={{ margin:'0 20px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, fontWeight:600 }}>
            {summaryError}
          </div>
        )}

        {/* KPI chips */}
        <div className="po-kpi-grid" style={{ padding:'0 20px 16px' }}>
          {[
            { label:'POs Uploaded',    value: uploadSummary?.selected?.uploadedPOs || 0,          gradient:'linear-gradient(135deg,#ef4444,#b91c1c)', icon:'📄' },
            { label:'Invoices Created', value: uploadSummary?.selected?.invoiceCount || 0,         gradient:'linear-gradient(135deg,#3b82f6,#1d4ed8)', icon:'🧾' },
            { label:'Line Items',       value: uploadSummary?.selected?.itemCount || 0,            gradient:'linear-gradient(135deg,#22c55e,#15803d)', icon:'📋' },
            { label:'Invoice Value',    value: money(uploadSummary?.selected?.totalValue),         gradient:'linear-gradient(135deg,#a855f7,#7c3aed)', icon:'💰' },
          ].map(card => (
            <div key={card.label} style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:12, padding:'14px 16px', position:'relative', overflow:'hidden', boxShadow:'0 1px 4px rgba(15,23,42,0.04)' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:card.gradient, borderRadius:'12px 12px 0 0' }} />
              <div style={{ fontSize:20, marginBottom:6 }}>{card.icon}</div>
              <div style={{ fontSize:20, fontWeight:900, color:'#0f172a', letterSpacing:'-0.5px', lineHeight:1 }}>
                {summaryLoading ? <span style={{ color:'#e2e8f0' }}>—</span> : card.value}
              </div>
              <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginTop:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto', borderTop:'1px solid #f1f5f9' }}>
          <table className="po-table" style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Upload Time','PO Number','Invoice No','Vendor','Buyer','Items','Amount','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.7px', borderBottom:'1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryLoading && (
                <tr><td colSpan={9} style={{ padding:28, textAlign:'center', color:'#94a3b8', fontSize:13 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:16, height:16, border:'2px solid #e2e8f0', borderTopColor:'#c0392b', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    Loading...
                  </div>
                </td></tr>
              )}
              {!summaryLoading && (uploadSummary?.selected?.invoices || []).map((inv, ri) => (
                <tr key={inv._id} style={{ borderBottom:'1px solid #f8fafc', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'11px 14px', color:'#94a3b8', whiteSpace:'nowrap', fontSize:11.5 }}>{formatDateTime(inv.createdAt)}</td>
                  <td style={{ padding:'11px 14px', color:'#c0392b', fontWeight:800, whiteSpace:'nowrap' }}>{inv.poRef || '—'}</td>
                  <td style={{ padding:'11px 14px', color:'#1d4ed8', fontWeight:700, whiteSpace:'nowrap' }}>{inv.invoiceNo}</td>
                  <td style={{ padding:'11px 14px', color:'#334155', minWidth:140 }}>{inv.vendorName || '—'}</td>
                  <td style={{ padding:'11px 14px', color:'#334155', minWidth:140 }}>{inv.buyerName || '—'}</td>
                  <td style={{ padding:'11px 14px', textAlign:'center' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, background:'#f1f5f9', color:'#475569', fontWeight:700, fontSize:12 }}>{inv.itemCount || 0}</span>
                  </td>
                  <td style={{ padding:'11px 14px', color:'#7c3aed', fontWeight:800, whiteSpace:'nowrap' }}>{money(inv.grandTotal)}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span className="po-status-badge" style={{ background:'rgba(34,197,94,0.1)', color:'#15803d' }}>{inv.status}</span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                      <button className="po-action-btn" onClick={() => handleViewInvoice(inv)} disabled={viewLoading === inv._id} title="View"
                        style={{ border:'1px solid #dbeafe', background: viewLoading===inv._id?'#f1f5f9':'#eff6ff', color:'#1d4ed8' }}>
                        <MdVisibility size={16} />
                      </button>
                      <button className="po-action-btn" onClick={() => handleDeleteInvoice(inv)} disabled={deletingInvoice === inv._id} title="Delete"
                        style={{ border:'1px solid #fecaca', background: deletingInvoice===inv._id?'#f1f5f9':'#fef2f2', color:'#dc2626' }}>
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!summaryLoading && !(uploadSummary?.selected?.invoices || []).length && (
                <tr><td colSpan={9} style={{ padding:32, textAlign:'center' }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
                  <div style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>No PO uploads found for this date</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ── View Invoice Modal ── */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice: ${viewInvoice?.invoiceNo || ''}`} size="lg"
        footer={
          <button onClick={() => setViewInvoice(null)} style={{ padding:'8px 20px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Close
          </button>
        }>
        {viewInvoice && (
          <div>
            {/* Meta grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
              {[['PO Number', viewInvoice.poRef||'—'], ['Invoice No', viewInvoice.invoiceNo||'—'], ['Vendor', viewInvoice.vendorName||'—'], ['Status', viewInvoice.status||'—'], ['Grand Total', money(viewInvoice.grandTotal)]].map(([label, value]) => (
                <div key={label} style={{ border:'1px solid #e8edf2', borderRadius:10, padding:'10px 14px', background:'#f8fafc' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{value}</div>
                </div>
              ))}
              <div style={{ border:'1px solid #e8edf2', borderRadius:10, padding:'10px 14px', background:'#f8fafc', gridColumn:'span 2' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Bill To</div>
                <div style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{viewInvoice.buyerName||'—'}</div>
                {viewInvoice.buyerAddress && <div style={{ fontSize:12, color:'#475569', marginTop:3, whiteSpace:'pre-line' }}>{viewInvoice.buyerAddress}</div>}
                {viewInvoice.buyerGSTIN && <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>GSTIN: {viewInvoice.buyerGSTIN}</div>}
              </div>
              {(viewInvoice.shipToName || viewInvoice.shipToAddress) && (
                <div style={{ border:'1px solid #e8edf2', borderRadius:10, padding:'10px 14px', background:'#f8fafc', gridColumn:'span 2' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Ship To</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#0f172a' }}>{viewInvoice.shipToName||viewInvoice.buyerName||'—'}</div>
                  {viewInvoice.shipToAddress && <div style={{ fontSize:12, color:'#475569', marginTop:3, whiteSpace:'pre-line' }}>{viewInvoice.shipToAddress}</div>}
                </div>
              )}
            </div>
            {/* Items table */}
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
                  {(viewInvoice.items||[]).map((item, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'10px 12px', color:'#94a3b8', fontWeight:700 }}>{i+1}</td>
                      <td style={{ padding:'10px 12px', color:'#334155', minWidth:180, fontWeight:500 }}>{item.itemName||item.name||'—'}</td>
                      <td style={{ padding:'10px 12px', color:'#64748b', whiteSpace:'nowrap' }}>{item.hsn||'—'}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{Number(item.invoicedQty||item.qty||0).toLocaleString('en-IN')} {item.unit||''}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{money(item.basePrice||item.rate)}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{money(item.taxableValue)}</td>
                      <td style={{ padding:'10px 12px', color:'#c0392b', fontWeight:800, whiteSpace:'nowrap' }}>{money(item.lineTotal||item.lineAmount)}</td>
                    </tr>
                  ))}
                  {!(viewInvoice.items||[]).length && (
                    <tr><td colSpan={7} style={{ padding:24, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No line items found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>


      {/* ── PDF Preview Panel ── */}
      {showPDFPanel && parsedPO && (
        <div className="po-card" style={{ border:'2px solid #c0392b', boxShadow:'0 4px 20px rgba(192,57,43,0.12)' }}>
          {/* Panel header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #fef2f2', background:'linear-gradient(135deg,#fff5f5,#fff)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'linear-gradient(135deg,#c0392b,#922b21)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
                <MdPictureAsPdf size={20} />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#1e293b' }}>PDF Parsed — {parsedPO.fileName}</div>
                <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:2 }}>Review extracted data below and edit if needed</div>
              </div>
            </div>
            <button onClick={() => setShowPDFPanel(false)} style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9', border:'none', borderRadius:8, cursor:'pointer', color:'#64748b' }}>
              <MdClose size={17} />
            </button>
          </div>

          <div style={{ padding:'16px 20px' }}>
            {/* Extracted fields */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginBottom:16 }}>
              {[
                { label:'PO Number',   value: parsedPO.poNumber||'Not detected', ok: !!parsedPO.poNumber },
                { label:'Vendor',      value: parsedPO.vendor||'Not detected',   ok: !!parsedPO.vendor },
                { label:'Grand Total', value: parsedPO.total ? `₹${parseFloat(parsedPO.total).toLocaleString('en-IN')}` : 'Not detected', ok: !!parsedPO.total },
                { label:'Items Found', value: `${parsedPO.items.length} item${parsedPO.items.length!==1?'s':''}`, ok: parsedPO.items.length > 0 },
              ].map(f => (
                <div key={f.label} style={{ background: f.ok?'#f0fdf4':'#fef9f0', border:`1px solid ${f.ok?'#bbf7d0':'#fed7aa'}`, borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{f.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: f.ok?'#15803d':'#92400e' }}>{f.value}</div>
                </div>
              ))}
              {/* Bill To */}
              <div style={{ background: parsedPO.buyerName?'#f0fdf4':'#fef9f0', border:`1px solid ${parsedPO.buyerName?'#bbf7d0':'#fed7aa'}`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Bill To</div>
                <div style={{ fontSize:13, fontWeight:700, color: parsedPO.buyerName?'#15803d':'#92400e' }}>{parsedPO.buyerName||'Not detected'}</div>
                {parsedPO.buyerAddress && <div style={{ fontSize:11, color:'#475569', marginTop:3, whiteSpace:'pre-line' }}>{parsedPO.buyerAddress}</div>}
                {parsedPO.buyerGSTIN && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>GSTIN: {parsedPO.buyerGSTIN}</div>}
              </div>
              {/* Ship To */}
              <div style={{ background:(parsedPO.shipToName||parsedPO.buyerName)?'#f0fdf4':'#fef9f0', border:`1px solid ${(parsedPO.shipToName||parsedPO.buyerName)?'#bbf7d0':'#fed7aa'}`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Ship To</div>
                <div style={{ fontSize:13, fontWeight:700, color:(parsedPO.shipToName||parsedPO.buyerName)?'#15803d':'#92400e' }}>{parsedPO.shipToName||parsedPO.buyerName||'Not detected'}</div>
                {parsedPO.shipToAddress && <div style={{ fontSize:11, color:'#475569', marginTop:3, whiteSpace:'pre-line' }}>{parsedPO.shipToAddress}</div>}
              </div>
            </div>

            {parsedPO.items.length === 0 && (
              <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:9, padding:'10px 14px', marginBottom:14, fontSize:12.5, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>⚠️</span>
                Could not auto-detect items from this PDF. Please enter them manually below.
              </div>
            )}

            {/* Line items table header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                <MdTableChart size={15} color="#c0392b" />
                {parsedPO.items.length > 0 ? 'Line Items — auto-filled, edit if needed' : 'Line Items — enter manually'}
              </div>
              <button onClick={() => setEditableItems(prev => [...prev, { name:'', hsn:'', qty:1, unit:'Nos', rate:0, discount:0, cgst:0, sgst:0, igst:0, gst:0, taxableValue:0, lineAmount:0 }])}
                style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 14px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                + Add Row
              </button>
            </div>

            {/* Editable items table */}
            <div style={{ overflowX:'auto', border:'1px solid #e2e8f0', borderRadius:12, marginBottom:16 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)' }}>
                    {['#','Item Name','HSN','Qty','UOM','Unit Rate','Disc%','CGST%','CGST Val','SGST%','SGST Val','IGST%','IGST Val','Taxable','Tax Amt','Total',''].map(h => (
                      <th key={h} style={{ padding:'9px 10px', textAlign:'left', fontSize:10, fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap', color:'#94a3b8', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {editableItems.map((item, i) => {
                  const qty = Number(item.qty) || 0, rate = Number(item.rate) || 0, disc = Number(item.discount) || 0;
                  const cgstPct = Number(item.cgst) || 0, sgstPct = Number(item.sgst) || 0, igstPct = Number(item.igst) || 0;
                  const taxable = +(rate * qty * (1 - disc / 100)).toFixed(2);
                  const cgstVal = +(taxable * cgstPct / 100).toFixed(2);
                  const sgstVal = +(taxable * sgstPct / 100).toFixed(2);
                  const igstVal = +(taxable * igstPct / 100).toFixed(2);
                  const taxAmt  = +(cgstVal + sgstVal + igstVal).toFixed(2);
                  const pdfLine = Number(item.lineAmount) || 0;
                  const total   = taxAmt > 0 ? +(taxable + taxAmt).toFixed(2) : (pdfLine > taxable ? pdfLine : +(taxable + taxAmt).toFixed(2));
                  const upd = (f, v) => setEditableItems(prev => prev.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
                  const inp = (f, w, type = 'text', step) => (
                    <input type={type} value={item[f]} onChange={e => upd(f, e.target.value)} step={step} min="0"
                      className="po-input" style={{ width: w }} />
                  );
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0?'#fff':'#fafbfc' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'#fafbfc'}>
                      <td style={{ padding:'5px 10px', color:'#94a3b8', fontWeight:700, fontSize:11 }}>{i+1}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('name', 160)}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('hsn', 72)}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('qty', 52, 'number', '0.001')}</td>
                      <td style={{ padding:'3px 5px' }}>
                        <select value={item.unit} onChange={e => upd('unit', e.target.value)} className="po-select" style={{ width:64 }}>
                          {['Nos','Numbers','Pcs','Kgs','Units','EA','Sets','Ltrs','Mtrs','Boxes','Rolls','Pairs','Bags','Sheets'].map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:'3px 5px' }}>{inp('rate', 80, 'number', '0.01')}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('discount', 44, 'number', '0.1')}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('cgst', 44, 'number', '0.5')}</td>
                      <td style={{ padding:'5px 10px', color:'#1d4ed8', fontWeight:600, whiteSpace:'nowrap', fontSize:11.5 }}>₹{cgstVal.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('sgst', 44, 'number', '0.5')}</td>
                      <td style={{ padding:'5px 10px', color:'#1d4ed8', fontWeight:600, whiteSpace:'nowrap', fontSize:11.5 }}>₹{sgstVal.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                      <td style={{ padding:'3px 5px' }}>{inp('igst', 44, 'number', '0.5')}</td>
                      <td style={{ padding:'5px 10px', color:'#7c3aed', fontWeight:600, whiteSpace:'nowrap', fontSize:11.5 }}>₹{igstVal.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                      <td style={{ padding:'5px 10px', color:'#475569', fontWeight:600, whiteSpace:'nowrap', fontSize:11.5 }}>₹{taxable.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                      <td style={{ padding:'5px 10px', color:'#a16207', fontWeight:600, whiteSpace:'nowrap', fontSize:11.5 }}>₹{taxAmt.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                      <td style={{ padding:'5px 10px', fontWeight:800, color:'#c0392b', whiteSpace:'nowrap', fontSize:12 }}>₹{total.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                      <td style={{ padding:'3px 5px' }}>
                        <button onClick={() => setEditableItems(prev => prev.filter((_,idx) => idx!==i))}
                          style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer', color:'#dc2626' }}>
                          <MdClose size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
                <tfoot>
                  <tr style={{ background:'#f8fafc', borderTop:'2px solid #e2e8f0' }}>
                    <td colSpan={8} style={{ padding:'9px 12px', textAlign:'right', fontWeight:700, color:'#64748b', fontSize:12 }}>Totals →</td>
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#1d4ed8', fontSize:12 }}>₹{editableItems.reduce((s,it)=>{const t=+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);return s+(+(t*(Number(it.cgst)||0)/100).toFixed(2));},0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td />
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#1d4ed8', fontSize:12 }}>₹{editableItems.reduce((s,it)=>{const t=+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);return s+(+(t*(Number(it.sgst)||0)/100).toFixed(2));},0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td />
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#7c3aed', fontSize:12 }}>₹{editableItems.reduce((s,it)=>{const t=+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);return s+(+(t*(Number(it.igst)||0)/100).toFixed(2));},0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#475569', fontSize:12 }}>₹{editableItems.reduce((s,it)=>s+(+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2)),0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td style={{ padding:'9px 10px', fontWeight:700, color:'#a16207', fontSize:12 }}>₹{editableItems.reduce((s,it)=>{const t=+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);const tax=+((t*(Number(it.cgst)||0)/100)+(t*(Number(it.sgst)||0)/100)+(t*(Number(it.igst)||0)/100)).toFixed(2);return s+tax;},0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td style={{ padding:'9px 10px', fontWeight:900, color:'#c0392b', fontSize:14 }}>₹{editableItems.reduce((s,it)=>{const taxable=+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);const cgstV=+(taxable*(Number(it.cgst)||0)/100).toFixed(2);const sgstV=+(taxable*(Number(it.sgst)||0)/100).toFixed(2);const igstV=+(taxable*(Number(it.igst)||0)/100).toFixed(2);const taxAmt=cgstV+sgstV+igstV;const pdfLine=Number(it.lineAmount)||0;const rowTotal=taxAmt>0?+(taxable+taxAmt).toFixed(2):(pdfLine>taxable?pdfLine:+(taxable+taxAmt).toFixed(2));return s+rowTotal;},0).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Success / Error message */}
            {pdfInvoiceMsg && (
              <div style={{ background: pdfInvoiceMsg.startsWith('Error')?'#fef2f2':'#f0fdf4', border:`1px solid ${pdfInvoiceMsg.startsWith('Error')?'#fecaca':'#bbf7d0'}`, borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color: pdfInvoiceMsg.startsWith('Error')?'#dc2626':'#15803d', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>{pdfInvoiceMsg.startsWith('Error')?'❌':'✅'}</span>
                  {pdfInvoiceMsg}
                </div>
                {!pdfInvoiceMsg.startsWith('Error') && (
                  <button onClick={() => navigate('/po-generator/invoice-history')}
                    style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'7px 14px', background:'#c0392b', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    <MdHistory size={14} /> View Invoice
                  </button>
                )}
              </div>
            )}

            {/* Create Invoice CTA */}
            {!pdfInvoiceMsg && (
              <button onClick={handleCreateFromPDF} disabled={pdfInvoicing}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'14px 24px', background: pdfInvoicing?'#94a3b8':'linear-gradient(135deg,#c0392b,#922b21)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: pdfInvoicing?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: pdfInvoicing?'none':'0 4px 16px rgba(192,57,43,0.35)' }}
                onMouseEnter={e => { if(!pdfInvoicing){e.currentTarget.style.opacity='0.92';e.currentTarget.style.transform='translateY(-1px)';} }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1';e.currentTarget.style.transform='translateY(0)'; }}>
                <MdReceipt size={20} />
                {pdfInvoicing ? 'Creating Invoice...' : `Create Invoice from PDF  ·  ${editableItems.filter(it=>it.name.trim()).length} item(s)  ·  ₹${editableItems.reduce((s,it)=>{const taxable=+(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);const cgstV=+(taxable*(Number(it.cgst)||0)/100).toFixed(2);const sgstV=+(taxable*(Number(it.sgst)||0)/100).toFixed(2);const igstV=+(taxable*(Number(it.igst)||0)/100).toFixed(2);const taxAmt=cgstV+sgstV+igstV;const pdfLine=Number(it.lineAmount)||0;const rowTotal=taxAmt>0?+(taxable+taxAmt).toFixed(2):(pdfLine>taxable?pdfLine:+(taxable+taxAmt).toFixed(2));return s+rowTotal;},0).toLocaleString('en-IN',{minimumFractionDigits:2})}`}
              </button>
            )}
          </div>
        </div>
      )}

      </div>{/* end .po-page */}
    </div>
  );
}