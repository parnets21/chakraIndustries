import { useCallback, useEffect, useState, useRef } from 'react';
import { poGeneratorApi } from '../../api/poGeneratorApi';
import { useNavigate } from 'react-router-dom';
import {
  MdPictureAsPdf, MdClose, MdTableChart,
  MdReceipt, MdHistory, MdRefresh,
  MdVisibility, MdDelete, MdBusiness,
  MdCheckCircle, MdWarning, MdEdit, MdSave,
} from 'react-icons/md';
import Modal from '../../components/common/Modal';

const money = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (v) => v ? new Date(v).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';
const formatDateTime = (v) => v ? new Date(v).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const DISPATCH_STATUS_COLORS = {
  Pending:        { bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
  Sent:           { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  'Not Sent':     { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Partially Sent': { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
};

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

  const toNum = (v) => {
    const cleaned = String(v || '').replace(/[₹]/g, '').replace(/\bRs\.?\s*/gi, '').replace(/\bINR\s*/gi, '').replace(/,/g, '').trim();
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : 0;
  };

  const GSTIN_RE = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])\b/;
  const UOM_RE   = /^(Nos?\.?|Numbers?|Pcs?\.?|Kgs?\.?|Units?|EA|Sets?|Ltrs?\.?|Mtrs?\.?|Boxes?|Rolls?|Pairs?|Bags?|Sheets?|MT|MTs?|Ton|Tons?|Tonne|Tonnes?|Quintal|Quintals?|Sqft|Sqm|RMT|Mtr|Mtrs?|Ltr|Ltrs?|Gms?|Grams?|Dozen|Bale|Bundle|Coil|Drum|Packet|Pkt)$/i;
  const DATE_TOK_RE = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})$/i;

  const poM = text.match(/(?:PO\s+(?:No\.?|Number|#)|Purchase\s+Order\s+(?:No\.?|Number))\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,29})/i)
    || text.match(/Order\s+(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,29})/i);
  if (poM && /\d/.test(poM[1])) result.poNumber = poM[1].trim();

  const vendM = text.match(/Vendor\s+Name\s*[:\-]\s*([^\n]{3,80})/i)
    || text.match(/Supplier\s*[:\-]\s*([^\n]{3,80})/i)
    || text.match(/Vendor\s*[:\-]\s*([^\n,]{3,80})/i);
  if (vendM) {
    let v = vendM[1].trim().replace(/\s*Purchase\s+Order.*$/i, '').replace(/\s*(PO\s*No\.?)\s*[:\-].*$/i, '').trim();
    if (v.length >= 3) result.vendor = v.slice(0, 80);
  }

  const EMDI_RE = /^[\u2013\u2014\-]+$/;
  const extractSection = (labelRe, maxLines = 6) => {
    const idx = text.search(labelRe);
    if (idx === -1) return [];
    const block = text.slice(idx, idx + 500).split('\n').slice(1, maxLines + 1);
    return block.map(l => l.trim()).filter(l => l && !EMDI_RE.test(l));
  };

  const billLines = extractSection(/(?:BILL\s+TO|BILLING\s+ADDRESS|BILLING\s*:)/i);
  if (billLines.length) {
    for (const ln of billLines) {
      if (GSTIN_RE.test(ln)) { result.buyerGSTIN = ln.match(GSTIN_RE)[1]; continue; }
      if (/^(GSTIN|GST\s*No|PAN|CIN|Tel|Mob|Email)/i.test(ln)) {
        const gm = ln.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
        if (gm) result.buyerGSTIN = gm[1];
        continue;
      }
      if (!result.buyerName && ln.length >= 3) { result.buyerName = ln.slice(0, 120); continue; }
      if (result.buyerName && !result.buyerAddress) { result.buyerAddress = ln.slice(0, 200); }
    }
  }

  const shipLines = extractSection(/(?:SHIP\s+TO|SHIPPING\s+ADDRESS|DELIVER\s+TO)/i);
  if (shipLines.length) {
    for (const ln of shipLines) {
      if (GSTIN_RE.test(ln)) continue;
      if (/^(GSTIN|GST\s*No|PAN|CIN|Tel|Mob|Email)/i.test(ln)) continue;
      if (!result.shipToName && ln.length >= 3) { result.shipToName = ln.slice(0, 120); continue; }
      if (result.shipToName && !result.shipToAddress) { result.shipToAddress = ln.slice(0, 200); }
    }
  }

  if (!result.buyerGSTIN) {
    const allGSTINs = [...text.matchAll(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])\b/g)].map(m => m[1]);
    result.buyerGSTIN = allGSTINs.length > 1 ? allGSTINs[1] : (allGSTINs[0] || '');
  }

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

  const COL_KEYWORDS = {
    sl:      ['sl','sl.','slno','slno.','sno','sno.','srno','srno.','#','no.'],
    desc:    ['description','descriptionhsncode','item','itemdescription','product','material','particulars','goods','namedescription','itemname'],
    hsn:     ['hsn','sac','hsncode','saccode','hsnsac','hsnno'],
    qty:     ['qty','qty.','quantity','nos','nos.','pcs','pcs.'],
    uom:     ['uom','unit','units','uomunit'],
    rate:    ['unitprice','rate','unitrate','basicrate','ratepers','price'],
    mrp:     ['mrp','listprice','maxretailprice'],
    needby:  ['needby','deliverydate','requiredby','expecteddelivery','deliveryon','shipby'],
    disc:    ['disc','disc.','discount','disc%','discount%'],
    cgstPct: ['cgst%','cgst'],
    cgstVal: ['cgstvalue','cgstval','cgstamt','cgstamount','cgstrs'],
    sgstPct: ['sgst%','sgst'],
    sgstVal: ['sgstvalue','sgstval','sgstamt','sgstamount','sgstrs'],
    igstPct: ['igst%','igst'],
    igstVal: ['igstvalue','igstval','igstamt','igstamount','igstrs'],
    taxable: ['taxablevalue','taxableamt','taxableamount','baseamount','assessable','taxable','taxablebvalue','basicvalue','basicamt'],
    taxAmt:  ['taxamount','taxamt','totaltax','totalgst'],
    total:   ['totalamount','linetotal','total','nettotal','netamount','nettaxableamount'],
  };

  const norm = (s) => String(s || '').toLowerCase().replace(/[\s\/\-\.]/g, '');
  let colMap = {};
  let headerLineIdx = -1;

  const tryMatchHeader = (toks) => {
    const found = {};
    for (let ti = 0; ti < toks.length; ti++) {
      for (let len = 1; len <= 3 && ti + len - 1 < toks.length; len++) {
        const combined = norm(toks.slice(ti, ti + len).map(t => t.str).join(''));
        for (const [col, keywords] of Object.entries(COL_KEYWORDS)) {
          if (!found[col] && keywords.includes(combined)) {
            const midTok = toks[ti + Math.floor((len - 1) / 2)];
            found[col] = midTok.x;
          }
        }
      }
    }
    return found;
  };

  for (let i = 0; i < lines.length; i++) {
    let found = tryMatchHeader(lines[i].tokens);
    if (Object.keys(found).length < 3 && i + 1 < lines.length) {
      const merged = [...lines[i].tokens, ...lines[i + 1].tokens].sort((a, b) => a.x - b.x);
      const mergedFound = tryMatchHeader(merged);
      if (Object.keys(mergedFound).length > Object.keys(found).length) found = mergedFound;
    }
    if (Object.keys(found).length >= 3) { colMap = found; headerLineIdx = i; break; }
  }

  if (headerLineIdx >= 0 && Object.keys(colMap).length >= 3) {
    const nearestCol = (x) => {
      let best = null, bestDist = Infinity;
      for (const [col, cx] of Object.entries(colMap)) {
        const d = Math.abs(x - cx);
        if (d < bestDist) { bestDist = d; best = col; }
      }
      return bestDist <= 120 ? best : null;
    };

    const FOOTER_RE = /^(total\s*base|total\s*taxable|sub\s*total|grand\s*total|net\s*amount|amount\s*payable|cgst\s*amount|sgst\s*amount|igst\s*amount|amount\s*in\s*words|terms|dear\s*sir|authorized|page\s*\d)/i;
    const dataLines = [];
    for (let i = headerLineIdx + 1; i < lines.length; i++) {
      const ls = lines[i].tokens.map(t => t.str).join(' ').trim();
      if (!ls) continue;
      if (FOOTER_RE.test(ls)) break;
      dataLines.push(lines[i]);
    }

    const slX = colMap.sl ?? colMap.desc ?? -1;
    const itemRows = [];
    let cur = [];
    for (const line of dataLines) {
      const ft = line.tokens[0];
      const isSerial = ft && /^\d{1,3}\.?$/.test(ft.str.trim()) && (slX < 0 ? true : Math.abs(ft.x - slX) < 120);
      if (isSerial && cur.length > 0) { itemRows.push(cur); cur = []; }
      cur.push(line);
    }
    if (cur.length > 0) itemRows.push(cur);

    for (const rowLines of itemRows) {
      const allToks = rowLines.flatMap(l => l.tokens);
      const colVals = {};
      for (const tok of allToks) {
        const col = nearestCol(tok.x);
        if (col === 'mrp' || col === 'needby') continue;
        if (DATE_TOK_RE.test(tok.str.trim())) continue;
        if (col) { if (!colVals[col]) colVals[col] = []; colVals[col].push(tok.str.trim()); }
      }

      const getStr = (col) => (colVals[col] || []).join(' ').trim();
      const getN   = (col) => toNum(getStr(col));

      let name = getStr('desc');
      if (name.length < 2) {
        const qtyX = colMap.qty ?? colMap.uom ?? colMap.rate ?? 999;
        const nameToks = allToks.filter(t => t.x < qtyX - 20 && !/^[\d,]+(\.\d+)?$/.test(t.str.trim()) && !/^\d{1,3}\.?$/.test(t.str.trim())).sort((a, b) => a.x - b.x || a.y - b.y).map(t => t.str.trim());
        name = nameToks.join(' ').trim();
      }

      const hsnM = name.match(/\/\s*(\d{6,10})(?:\s|$)/);
      let hsn = getStr('hsn') || (hsnM ? hsnM[1] : '');
      if (hsnM) name = name.replace(hsnM[0], '').trim();
      name = name.replace(/\s+/g, ' ').replace(/[^\w\s\-\/\.&,()]/g, '').trim();
      if (name.length < 2) continue;

      const uom = getStr('uom') || 'Nos';
      const disc = getN('disc') || 0;
      const cgstPct = getN('cgstPct'), cgstVal = getN('cgstVal');
      const sgstPct = getN('sgstPct'), sgstVal = getN('sgstVal');
      const igstPct = getN('igstPct'), igstVal = getN('igstVal');
      let qty = getN('qty'), rate = getN('rate'), taxable = getN('taxable');
      const lineAmtRaw = getN('total');
      if (!taxable && qty && rate) taxable = +(qty * rate * (1 - disc / 100)).toFixed(2);
      if (qty && !rate && taxable > 0) rate = +(taxable / qty).toFixed(2);
      if (rate && !qty && taxable > 0) qty = Math.round(taxable / rate) || 1;
      if (!rate && !qty && taxable > 0) { qty = 1; rate = taxable; }
      const lineAmt = lineAmtRaw || taxable || (qty && rate ? +(qty * rate).toFixed(2) : 0);
      if (!qty || !rate || !lineAmt) continue;
      if (!taxable) taxable = +(rate * qty * (1 - disc / 100)).toFixed(2);
      const fCgstVal = cgstVal || +(taxable * cgstPct / 100).toFixed(2);
      const fSgstVal = sgstVal || +(taxable * sgstPct / 100).toFixed(2);
      const fIgstVal = igstVal || +(taxable * igstPct / 100).toFixed(2);
      result.items.push({ name, qty, unit: uom, hsn, rate, discount: disc, cgst: cgstPct, cgstVal: fCgstVal, sgst: sgstPct, sgstVal: fSgstVal, igst: igstPct, igstVal: fIgstVal, gst: cgstPct + sgstPct + igstPct, taxableValue: taxable, lineAmount: lineAmt });
    }
  }

  if (result.items.length === 0) {
    const SKIP = /total|subtotal|grand|net\s+amount|amount\s+payable|tax\s+amount|in\s+words|terms|dear\s+sir|authorized|page\s+\d|cgst\s+amount|sgst\s+amount|igst\s+amount/i;
    const isIGST = /\bIGST\b/.test(text);
    for (const line of lines) {
      const toks = line.tokens.map(t => t.str);
      if (SKIP.test(toks.join(' '))) continue;
      if (!/^\d{1,3}\.?$/.test(toks[0])) continue;
      const nums = toks.map(t => toNum(t)).filter(n => n > 0);
      if (nums.length < 3) continue;
      const uomTok = toks.find(t => UOM_RE.test(t)) || 'Nos';
      const firstNumIdx = toks.findIndex((t, i) => i > 0 && toNum(t) > 0);
      let name = toks.slice(1, firstNumIdx > 0 ? firstNumIdx : 5).join(' ').trim().replace(/\/\s*\d{6,10}/, '').replace(UOM_RE, '').trim();
      if (name.length < 2) continue;
      const lineAmt = nums[nums.length - 1];
      let taxable = 0, taxAmt = 0, qty = 0, rate = 0;
      if (nums.length >= 4) {
        taxAmt = nums[nums.length - 2]; taxable = nums[nums.length - 3];
        const candidates = nums.slice(0, nums.length - 3);
        for (let a = 0; a < candidates.length && !qty; a++) {
          for (let b = a + 1; b < candidates.length && !qty; b++) {
            const prod = +(candidates[a] * candidates[b]).toFixed(2);
            if (taxable > 0 && Math.abs(prod - taxable) / taxable < 0.05) { qty = Math.min(candidates[a], candidates[b]); rate = Math.max(candidates[a], candidates[b]); }
          }
        }
        if (!qty && candidates.length >= 2) { qty = candidates[0]; rate = candidates[1]; if (!taxable) taxable = +(qty * rate).toFixed(2); }
        else if (!qty && candidates.length === 1) { qty = 1; rate = candidates[0]; if (!taxable) taxable = rate; }
      } else if (nums.length === 3) { qty = nums[0]; rate = nums[1]; taxable = +(qty * rate).toFixed(2); taxAmt = +(lineAmt - taxable).toFixed(2); }
      else { qty = 1; rate = nums[0]; taxable = rate; taxAmt = +(lineAmt - taxable).toFixed(2); }
      if (!qty || !rate) continue;
      const gstPct = taxable > 0 && taxAmt > 0 ? Math.round(taxAmt / taxable * 100) : 18;
      result.items.push({ name, qty, unit: uomTok, hsn: '', rate, discount: 0, cgst: isIGST ? 0 : gstPct / 2, cgstVal: isIGST ? 0 : +(taxable * gstPct / 200).toFixed(2), sgst: isIGST ? 0 : gstPct / 2, sgstVal: isIGST ? 0 : +(taxable * gstPct / 200).toFixed(2), igst: isIGST ? gstPct : 0, igstVal: isIGST ? taxAmt : 0, gst: gstPct, taxableValue: taxable, lineAmount: lineAmt });
    }
  }

  return result;
}

// ── React Component ───────────────────────────────────────────────────────────
export default function POUploadPage() {
  const fileRef  = useRef(null);
  const navigate = useNavigate();

  // PDF upload / parse
  const [parsing, setParsing]             = useState(false);
  const [parseError, setParseError]       = useState('');
  const [parsedPO, setParsedPO]           = useState(null);
  const [showPDFPanel, setShowPDFPanel]   = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [pdfInvoicing, setPdfInvoicing]   = useState(false);
  const [pdfInvoiceMsg, setPdfInvoiceMsg] = useState('');
  const [pdfCompanyId, setPdfCompanyId]   = useState('');

  // Companies
  const [companies, setCompanies]           = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Date filter
  const [dateFrom, setDateFrom]             = useState('');
  const [dateTo, setDateTo]                 = useState('');

  // Company-items view
  const [companyItems, setCompanyItems]     = useState([]);
  const [itemsLoading, setItemsLoading]     = useState(false);
  const [itemsError, setItemsError]         = useState('');

  // Item-wise edit modal
  const [editingItem, setEditingItem]       = useState(null); // full item object
  const [editForm, setEditForm]             = useState({});
  const [savingItem, setSavingItem]         = useState(false);

  // Invoice view modal
  const [viewInvoice, setViewInvoice]       = useState(null);
  const [viewLoading, setViewLoading]       = useState('');

  const loadCompanies = useCallback(async () => {
    try { const res = await poGeneratorApi.listCompanies(); setCompanies(res.data || []); }
    catch { /* non-critical */ }
  }, []);

  const loadCompanyItems = useCallback(async (companyId) => {
    if (!companyId) { setCompanyItems([]); return; }
    setItemsLoading(true); setItemsError('');
    try {
      const res = await poGeneratorApi.getCompanyItems(companyId);
      setCompanyItems(res.data || []);
    } catch (err) {
      setItemsError(err.message || 'Failed to load items');
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);
  useEffect(() => { loadCompanyItems(selectedCompany); }, [selectedCompany, loadCompanyItems]);

  // ── PDF handlers ─────────────────────────────────────────────────────────
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
        ? parsed.items.map(it => ({ name: it.name, hsn: it.hsn || '', qty: it.qty, unit: it.unit || 'Nos', rate: it.rate, discount: it.discount || 0, cgst: it.cgst ?? 0, sgst: it.sgst ?? 0, igst: it.igst ?? 0, gst: it.gst ?? 0, taxableValue: it.taxableValue || +(it.qty * it.rate).toFixed(2), lineAmount: it.lineAmount || +(it.qty * it.rate).toFixed(2) }))
        : [{ name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, cgst: 0, sgst: 0, igst: 0, gst: 0, taxableValue: 0, lineAmount: 0 }]);
      setPdfCompanyId('');
      setShowPDFPanel(true);
    } catch (err) {
      setParseError(`Failed to read PDF: ${err.message || 'Unknown error'}. Make sure it is a text-based PDF.`);
    } finally { setParsing(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleCreateFromPDF = async () => {
    const validItems = editableItems.filter(it => it.name.trim() && Number(it.qty) > 0 && Number(it.rate) > 0);
    if (!parsedPO || validItems.length === 0) { alert('Please add at least one item with name, qty and rate.'); return; }
    setPdfInvoicing(true); setPdfInvoiceMsg('');
    try {
      const chosenCompany = pdfCompanyId ? companies.find(c => c._id === pdfCompanyId) : null;
      const res = await poGeneratorApi.generateInvoiceFromPDF({
        poNumber: parsedPO.poNumber,
        vendorName: parsedPO.vendor,
        buyerName: chosenCompany ? chosenCompany.companyName : parsedPO.buyerName,
        companyId: pdfCompanyId || undefined,
        buyerAddress: parsedPO.buyerAddress || '', buyerGSTIN: parsedPO.buyerGSTIN || '',
        shipToName: parsedPO.shipToName || '', shipToAddress: parsedPO.shipToAddress || '',
        items: validItems.map(it => {
          const qty = Number(it.qty), rate = Number(it.rate), disc = Number(it.discount) || 0;
          const cgstPct = Number(it.cgst) || 0, sgstPct = Number(it.sgst) || 0, igstPct = Number(it.igst) || 0, gstPct = Number(it.gst) || 0;
          const taxable = +(rate * qty * (1 - disc / 100)).toFixed(2);
          let cgstVal = +(taxable * cgstPct / 100).toFixed(2), sgstVal = +(taxable * sgstPct / 100).toFixed(2), igstVal = +(taxable * igstPct / 100).toFixed(2);
          const pdfLineAmt = Number(it.lineAmount) || 0;
          const taxFromPDF = +(pdfLineAmt - taxable).toFixed(2);
          if (cgstPct === 0 && sgstPct === 0 && igstPct === 0 && taxFromPDF > 0.01) {
            const halfTax = +(taxFromPDF / 2).toFixed(2);
            cgstVal = halfTax; sgstVal = +(taxFromPDF - halfTax).toFixed(2); igstVal = 0;
          }
          const lineAmount = +(taxable + cgstVal + sgstVal + igstVal).toFixed(2);
          const effectiveGst = cgstPct + sgstPct + igstPct || gstPct || (taxable > 0 ? Math.round((cgstVal + sgstVal + igstVal) / taxable * 100) : 18);
          return { name: it.name.trim(), qty, unit: it.unit || 'Nos', rate, discount: disc, cgst: cgstPct || (cgstVal > 0 ? +(cgstVal / taxable * 100).toFixed(2) : 0), cgstVal, sgst: sgstPct || (sgstVal > 0 ? +(sgstVal / taxable * 100).toFixed(2) : 0), sgstVal, igst: igstPct || (igstVal > 0 ? +(igstVal / taxable * 100).toFixed(2) : 0), igstVal, gst: effectiveGst, hsn: it.hsn || '', taxableValue: taxable, lineAmount };
        }),
        total: parsedPO.total, notes: `Created from PDF: ${parsedPO.fileName}`,
      });
      setPdfInvoiceMsg(res.message || 'Invoice created!');
      await loadCompanies();
      // Refresh company items if that company is selected
      const targetCompanyId = pdfCompanyId || res.data?.invoice?.companyId;
      if (targetCompanyId && selectedCompany === targetCompanyId) {
        await loadCompanyItems(targetCompanyId);
      } else if (targetCompanyId) {
        setSelectedCompany(targetCompanyId);
      }
    } catch (e) { setPdfInvoiceMsg('Error: ' + e.message); }
    finally { setPdfInvoicing(false); }
  };

  // ── Item dispatch tracking ────────────────────────────────────────────────
  const openEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      dispatchStatus:   item.dispatchStatus   || 'Pending',
      notSentReason:    item.notSentReason     || '',
      expectedSendDate: item.expectedSendDate  ? new Date(item.expectedSendDate).toISOString().split('T')[0] : '',
      dispatchRemarks:  item.dispatchRemarks   || '',
    });
  };

  const handleSaveItemDispatch = async () => {
    if (!editingItem) return;
    setSavingItem(true);
    try {
      const res = await poGeneratorApi.updateItemDispatch(editingItem.invoiceId, editingItem._id, editForm);
      // Update the item in local state
      setCompanyItems(prev => prev.map(it =>
        String(it._id) === String(editingItem._id) ? { ...it, ...res.data } : it
      ));
      setEditingItem(null);
    } catch (err) {
      alert(err.message || 'Failed to save');
    } finally { setSavingItem(false); }
  };

  const handleViewInvoice = async (invoiceId) => {
    if (!invoiceId) return;
    setViewLoading(invoiceId);
    try { const res = await poGeneratorApi.getInvoiceById(invoiceId); setViewInvoice(res.data); }
    catch (err) { alert(err.message || 'Failed to load invoice details'); }
    finally { setViewLoading(''); }
  };

  // ── Derived: date-filtered items ────────────────────────────────────────
  const filteredItems = companyItems.filter(item => {
    if (!item.invoiceCreatedAt) return true;
    const d = new Date(item.invoiceCreatedAt);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo   && d > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  // ── Derived summary stats for selected company ───────────────────────────
  const totalItems    = filteredItems.length;
  const sentItems     = filteredItems.filter(i => i.dispatchStatus === 'Sent').length;
  const notSentItems  = filteredItems.filter(i => i.dispatchStatus === 'Not Sent').length;
  const pendingItems  = filteredItems.filter(i => i.dispatchStatus === 'Pending' || i.dispatchStatus === 'Partially Sent').length;
  const totalValue    = filteredItems.reduce((s, i) => s + (i.lineTotal || 0), 0);

  return (
    <div style={{ padding: '24px 28px', background: '#f8fafc', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .po-page { display:flex; flex-direction:column; gap:20px; }
        .po-banner { background:linear-gradient(135deg,#0f172a 0%,#7f1d1d 60%,#0f172a 100%); border-radius:16px; padding:22px 26px; display:flex; align-items:center; justify-content:space-between; position:relative; overflow:hidden; box-shadow:0 6px 24px rgba(15,23,42,0.18); gap:16px; }
        .po-card { background:#fff; border-radius:16px; border:1px solid #e8edf2; box-shadow:0 2px 10px rgba(15,23,42,0.05); overflow:hidden; }
        .po-card-head { display:flex; align-items:flex-start; justify-content:space-between; padding:16px 20px 0; margin-bottom:14px; }
        .po-table th { white-space:nowrap; }
        .po-table tr:hover td { background:#fef2f2 !important; }
        .po-btn-ghost { display:inline-flex; align-items:center; gap:6px; padding:9px 16px; background:#fff; color:#475569; border:1.5px solid #e2e8f0; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; transition:border-color 0.15s,color 0.15s; }
        .po-btn-ghost:hover { border-color:#c0392b; color:#c0392b; }
        .po-btn-primary { display:inline-flex; align-items:center; gap:7px; padding:10px 22px; background:linear-gradient(135deg,#c0392b,#922b21); color:#fff; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; box-shadow:0 3px 12px rgba(192,57,43,0.3); transition:opacity 0.15s,transform 0.15s; }
        .po-btn-primary:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
        .po-btn-primary:disabled { background:#94a3b8; box-shadow:none; cursor:not-allowed; }
        .po-status-badge { display:inline-flex; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:700; }
        .po-action-btn { width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center; border-radius:8px; cursor:pointer; transition:opacity 0.15s; border:none; }
        .po-action-btn:hover { opacity:0.75; }
        .po-input { padding:5px 8px; border:1px solid #e2e8f0; border-radius:6px; font-size:12px; outline:none; font-family:inherit; background:#fff; transition:border-color 0.15s; }
        .po-input:focus { border-color:#c0392b; }
        .po-select { padding:5px 6px; border:1px solid #e2e8f0; border-radius:6px; font-size:11px; outline:none; font-family:inherit; background:#fff; }
      `}</style>

      <div className="po-page">

      {/* ── Banner ── */}
      <div className="po-banner">
        <div style={{ position:'absolute', top:-40, right:100, width:180, height:180, borderRadius:'50%', background:'rgba(239,68,68,0.08)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:600, color:'rgba(148,163,184,0.8)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:6 }}>Finance · Procurement</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#f1f5f9', letterSpacing:'-0.4px', marginBottom:4 }}>PO Upload &amp; Invoice Generation</div>
          <div style={{ fontSize:12, color:'#94a3b8' }}>Upload PO PDF → auto-extract company &amp; items → track dispatch item-by-item</div>
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
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, fontSize:13, color:'#dc2626' }}>
          <span>❌</span><span style={{ flex:1, fontWeight:500 }}>{parseError}</span>
          <button onClick={() => setParseError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', padding:4, borderRadius:6, display:'flex' }}><MdClose size={16} /></button>
        </div>
      )}

      {/* ── Company-First View ── */}
      <div className="po-card">
        <div className="po-card-head">
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, color:'#0f172a' }}>
              <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#c0392b,#922b21)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
                <MdBusiness size={16} />
              </div>
              Company-wise Item Tracking
            </div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:4, marginLeft:40 }}>Select a company to view all its items across all uploaded POs</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              style={{ height:38, padding:'0 12px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:13, fontFamily:'inherit', color:'#0f172a', background:'#fff', outline:'none', minWidth:200, cursor:'pointer' }}
            >
              <option value="">— Select a Company —</option>
              {companies.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
            </select>

            {/* Date range filter */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 10px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, height:38 }}>
              <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8' }}>From</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ border:'none', background:'transparent', fontSize:12, fontFamily:'inherit', color:'#0f172a', outline:'none', cursor:'pointer' }} />
              <span style={{ fontSize:11, fontWeight:600, color:'#cbd5e1' }}>—</span>
              <span style={{ fontSize:11, fontWeight:600, color:'#94a3b8' }}>To</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ border:'none', background:'transparent', fontSize:12, fontFamily:'inherit', color:'#0f172a', outline:'none', cursor:'pointer' }} />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                  style={{ display:'inline-flex', alignItems:'center', border:'none', background:'none', cursor:'pointer', color:'#94a3b8', padding:2 }}>
                  <MdClose size={13} />
                </button>
              )}
            </div>

            {selectedCompany && (
              <button onClick={() => loadCompanyItems(selectedCompany)} disabled={itemsLoading}
                style={{ height:38, width:38, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #e2e8f0', borderRadius:9, background:'#fff', color:'#475569', cursor:'pointer' }}>
                <MdRefresh size={17} style={{ animation: itemsLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            )}
          </div>
        </div>

        {/* KPI chips — shown when company selected */}
        {selectedCompany && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, padding:'0 20px 16px' }}>
            {[
              { label:'Total Items',  value: totalItems,   gradient:'linear-gradient(135deg,#3b82f6,#1d4ed8)', icon:'📋' },
              { label:'Sent',         value: sentItems,    gradient:'linear-gradient(135deg,#22c55e,#15803d)', icon:'✅' },
              { label:'Not Sent',     value: notSentItems, gradient:'linear-gradient(135deg,#ef4444,#b91c1c)', icon:'⛔' },
              { label:'Pending',      value: pendingItems, gradient:'linear-gradient(135deg,#f59e0b,#b45309)', icon:'⏳' },
            ].map(card => (
              <div key={card.label} style={{ background:'#fff', border:'1px solid #e8edf2', borderRadius:12, padding:'12px 14px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:card.gradient, borderRadius:'12px 12px 0 0' }} />
                <div style={{ fontSize:18, marginBottom:4 }}>{card.icon}</div>
                <div style={{ fontSize:22, fontWeight:900, color:'#0f172a', lineHeight:1 }}>{itemsLoading ? '—' : card.value}</div>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600, marginTop:3, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  {card.label}
                  {(dateFrom || dateTo) && <span style={{ marginLeft:4, color:'#94a3b8', fontWeight:400, textTransform:'none' }}>filtered</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {itemsError && (
          <div style={{ margin:'0 20px 14px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, fontWeight:600 }}>{itemsError}</div>
        )}

        {/* Items table */}
        <div style={{ overflowX:'auto', borderTop:'1px solid #f1f5f9' }}>
          {!selectedCompany ? (
            <div style={{ padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🏢</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#334155', marginBottom:6 }}>Select a Company to Begin</div>
              <div style={{ fontSize:12, color:'#94a3b8' }}>Choose a company from the dropdown above to see all its PO items and manage dispatch status</div>
            </div>
          ) : itemsLoading ? (
            <div style={{ padding:'36px', textAlign:'center', color:'#94a3b8', fontSize:13 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                <div style={{ width:16, height:16, border:'2px solid #e2e8f0', borderTopColor:'#c0392b', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                Loading items...
              </div>
            </div>
          ) : companyItems.length === 0 ? (
            <div style={{ padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
              <div style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>No items found for {companies.find(c => c._id === selectedCompany)?.companyName}</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Upload a PO PDF for this company to start tracking items</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ padding:'40px 24px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
              <div style={{ fontSize:13, color:'#94a3b8', fontWeight:600 }}>No items match the selected date range</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>
                {dateFrom && dateTo ? `${dateFrom} — ${dateTo}` : dateFrom ? `From ${dateFrom}` : `Until ${dateTo}`}
              </div>
              <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                style={{ marginTop:12, padding:'6px 16px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                Clear date filter
              </button>
            </div>
          ) : (
            <table className="po-table" style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Item','HSN','Qty','Rate','Total','Invoice','PO Ref','Upload Date','Dispatch Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.7px', borderBottom:'1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, ri) => {
                  const sc = DISPATCH_STATUS_COLORS[item.dispatchStatus] || DISPATCH_STATUS_COLORS.Pending;
                  return (
                    <tr key={String(item._id)} style={{ borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'11px 14px', color:'#94a3b8', fontWeight:700 }}>{ri + 1}</td>
                      <td style={{ padding:'11px 14px', color:'#1e293b', fontWeight:600, minWidth:160 }}>{item.itemName}</td>
                      <td style={{ padding:'11px 14px', color:'#64748b' }}>{item.hsn || '—'}</td>
                      <td style={{ padding:'11px 14px', color:'#475569', whiteSpace:'nowrap' }}>{item.invoicedQty} {item.unit}</td>
                      <td style={{ padding:'11px 14px', color:'#475569', whiteSpace:'nowrap' }}>{money(item.basePrice)}</td>
                      <td style={{ padding:'11px 14px', color:'#c0392b', fontWeight:800, whiteSpace:'nowrap' }}>{money(item.lineTotal)}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <button onClick={() => handleViewInvoice(item.invoiceId)} disabled={viewLoading === String(item.invoiceId)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#1d4ed8', fontWeight:700, fontSize:11, padding:0, fontFamily:'inherit', textDecoration:'underline' }}>
                          {item.invoiceNo}
                        </button>
                      </td>
                      <td style={{ padding:'11px 14px', color:'#c0392b', fontWeight:700 }}>{item.poRef || '—'}</td>
                      <td style={{ padding:'11px 14px', color:'#94a3b8', fontSize:11, whiteSpace:'nowrap' }}>{formatDateTime(item.invoiceCreatedAt)}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <div>
                          <span className="po-status-badge" style={{ background: sc.bg, color: sc.color, border:`1px solid ${sc.border}` }}>
                            {item.dispatchStatus === 'Sent' ? <MdCheckCircle size={11} style={{ marginRight:3 }} /> : item.dispatchStatus === 'Not Sent' ? <MdWarning size={11} style={{ marginRight:3 }} /> : null}
                            {item.dispatchStatus}
                          </span>
                          {item.dispatchStatus === 'Not Sent' && item.notSentReason && (
                            <div style={{ fontSize:10, color:'#dc2626', marginTop:3, maxWidth:140, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={item.notSentReason}>
                              ⚠ {item.notSentReason}
                            </div>
                          )}
                          {item.expectedSendDate && item.dispatchStatus !== 'Sent' && (
                            <div style={{ fontSize:10, color:'#7c3aed', marginTop:2 }}>📅 {formatDate(item.expectedSendDate)}</div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <button className="po-action-btn" onClick={() => openEditItem(item)} title="Update dispatch status"
                          style={{ background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe' }}>
                          <MdEdit size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {companyItems.length > 0 && (
                <tfoot>
                  <tr style={{ background:'#f8fafc', borderTop:'2px solid #e2e8f0' }}>
                    <td colSpan={5} style={{ padding:'10px 14px', fontWeight:700, color:'#64748b', fontSize:12 }}>
                      {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                      {(dateFrom || dateTo) && <span style={{ marginLeft:6, fontSize:11, color:'#94a3b8' }}>(filtered)</span>}
                    </td>
                    <td style={{ padding:'10px 14px', fontWeight:900, color:'#c0392b', fontSize:13 }}>{money(totalValue)}</td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* ── Item Dispatch Edit Modal ── */}
      <Modal open={!!editingItem} onClose={() => setEditingItem(null)}
        title={editingItem ? `Update Dispatch — ${editingItem.itemName}` : ''}
        size="md"
        footer={
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setEditingItem(null)} style={{ padding:'8px 18px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
            <button onClick={handleSaveItemDispatch} disabled={savingItem}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:'linear-gradient(135deg,#c0392b,#922b21)', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:savingItem?'not-allowed':'pointer', fontFamily:'inherit', opacity:savingItem?0.7:1 }}>
              <MdSave size={15} /> {savingItem ? 'Saving...' : 'Save'}
            </button>
          </div>
        }>
        {editingItem && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Item summary */}
            <div style={{ background:'#f8fafc', border:'1px solid #e8edf2', borderRadius:10, padding:'12px 14px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[['Item', editingItem.itemName], ['Qty', `${editingItem.invoicedQty} ${editingItem.unit}`], ['Invoice', editingItem.invoiceNo]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#0f172a', marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Dispatch Status */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Dispatch Status *</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['Pending', 'Sent', 'Not Sent', 'Partially Sent'].map(s => {
                  const sc = DISPATCH_STATUS_COLORS[s];
                  const active = editForm.dispatchStatus === s;
                  return (
                    <button key={s} onClick={() => setEditForm(f => ({ ...f, dispatchStatus: s }))}
                      style={{ padding:'7px 16px', borderRadius:8, border:`2px solid ${active ? sc.border : '#e2e8f0'}`, background: active ? sc.bg : '#fff', color: active ? sc.color : '#64748b', fontWeight: active ? 700 : 500, fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason — shown when Not Sent or Partially Sent */}
            {(editForm.dispatchStatus === 'Not Sent' || editForm.dispatchStatus === 'Partially Sent') && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Reason for Not Sending *</label>
                <input value={editForm.notSentReason} onChange={e => setEditForm(f => ({ ...f, notSentReason: e.target.value }))}
                  placeholder="e.g. Stock unavailable, Material in transit..."
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #fecaca', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
              </div>
            )}

            {/* Expected Send Date */}
            {editForm.dispatchStatus !== 'Sent' && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Expected Send Date</label>
                <input type="date" value={editForm.expectedSendDate} onChange={e => setEditForm(f => ({ ...f, expectedSendDate: e.target.value }))}
                  style={{ padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none' }} />
              </div>
            )}

            {/* Remarks */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Remarks / Notes</label>
              <textarea value={editForm.dispatchRemarks} onChange={e => setEditForm(f => ({ ...f, dispatchRemarks: e.target.value }))}
                placeholder="Any additional notes about this item..."
                rows={3}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', resize:'vertical', boxSizing:'border-box' }} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── View Invoice Modal ── */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice: ${viewInvoice?.invoiceNo || ''}`} size="lg"
        footer={
          <button onClick={() => setViewInvoice(null)} style={{ padding:'8px 20px', background:'#f1f5f9', color:'#475569', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>Close</button>
        }>
        {viewInvoice && (
          <div>
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
                {viewInvoice.buyerAddress && <div style={{ fontSize:12, color:'#475569', marginTop:3 }}>{viewInvoice.buyerAddress}</div>}
                {viewInvoice.buyerGSTIN && <div style={{ fontSize:11, color:'#64748b', marginTop:3 }}>GSTIN: {viewInvoice.buyerGSTIN}</div>}
              </div>
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
                  {(viewInvoice.items||[]).map((item, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'10px 12px', color:'#94a3b8', fontWeight:700 }}>{i+1}</td>
                      <td style={{ padding:'10px 12px', color:'#334155', minWidth:180, fontWeight:500 }}>{item.itemName||'—'}</td>
                      <td style={{ padding:'10px 12px', color:'#64748b' }}>{item.hsn||'—'}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{Number(item.invoicedQty||0).toLocaleString('en-IN')} {item.unit||''}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{money(item.basePrice)}</td>
                      <td style={{ padding:'10px 12px', color:'#475569', whiteSpace:'nowrap' }}>{money(item.taxableValue)}</td>
                      <td style={{ padding:'10px 12px', color:'#c0392b', fontWeight:800, whiteSpace:'nowrap' }}>{money(item.lineTotal)}</td>
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
                { label:'Grand Total', value: parsedPO.total ? `Rs.${parseFloat(parsedPO.total).toLocaleString('en-IN')}` : 'Not detected', ok: !!parsedPO.total },
                { label:'Items Found', value: `${parsedPO.items.length} item${parsedPO.items.length!==1?'s':''}`, ok: parsedPO.items.length > 0 },
              ].map(f => (
                <div key={f.label} style={{ background: f.ok?'#f0fdf4':'#fef9f0', border:`1px solid ${f.ok?'#bbf7d0':'#fed7aa'}`, borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{f.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: f.ok?'#15803d':'#92400e' }}>{f.value}</div>
                </div>
              ))}
              <div style={{ background: parsedPO.buyerName?'#f0fdf4':'#fef9f0', border:`1px solid ${parsedPO.buyerName?'#bbf7d0':'#fed7aa'}`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>Bill To</div>
                <div style={{ fontSize:13, fontWeight:700, color: parsedPO.buyerName?'#15803d':'#92400e' }}>{parsedPO.buyerName||'Not detected'}</div>
                {parsedPO.buyerGSTIN && <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>GSTIN: {parsedPO.buyerGSTIN}</div>}
              </div>
              {/* Company selector */}
              <div style={{ background:'#f0f4ff', border:'1.5px solid #bfdbfe', borderRadius:10, padding:'12px 14px', gridColumn:'span 2' }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#1d4ed8', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Assign to Company</div>
                <select value={pdfCompanyId} onChange={e => setPdfCompanyId(e.target.value)}
                  style={{ width:'100%', height:34, padding:'0 10px', border:'1.5px solid #bfdbfe', borderRadius:8, fontSize:13, fontFamily:'inherit', color:'#0f172a', background:'#fff', outline:'none', cursor:'pointer' }}>
                  <option value="">— Auto-detect from Bill To ({parsedPO.buyerName || 'unknown'}) —</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                </select>
                <div style={{ fontSize:11, color:'#475569', marginTop:5 }}>
                  {pdfCompanyId ? `✅ Will be tagged to: ${companies.find(c => c._id === pdfCompanyId)?.companyName}` : 'Auto-detect will match or create a company from the "Bill To" name'}
                </div>
              </div>
            </div>

            {parsedPO.items.length === 0 && (
              <div style={{ background:'#fef9c3', border:'1px solid #fde68a', borderRadius:9, padding:'10px 14px', marginBottom:14, fontSize:12.5, color:'#92400e', display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠️</span> Could not auto-detect items. Please enter them manually below.
              </div>
            )}

            {/* Line items table */}
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

            <div style={{ overflowX:'auto', border:'1px solid #e2e8f0', borderRadius:12, marginBottom:16 }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)' }}>
                    {['#','Item Name','HSN','Qty','UOM','Rate','Disc%','CGST%','SGST%','IGST%','Total',''].map(h => (
                      <th key={h} style={{ padding:'9px 10px', textAlign:'left', fontSize:10, fontWeight:700, textTransform:'uppercase', whiteSpace:'nowrap', color:'#94a3b8', letterSpacing:'0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {editableItems.map((item, i) => {
                    const qty = Number(item.qty)||0, rate = Number(item.rate)||0, disc = Number(item.discount)||0;
                    const cgstPct = Number(item.cgst)||0, sgstPct = Number(item.sgst)||0, igstPct = Number(item.igst)||0;
                    const taxable = +(rate * qty * (1 - disc/100)).toFixed(2);
                    const total   = +(taxable * (1 + (cgstPct + sgstPct + igstPct)/100)).toFixed(2);
                    const upd = (f, v) => setEditableItems(prev => prev.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
                    const inp = (f, w, type='text', step) => (
                      <input type={type} value={item[f]} onChange={e => upd(f, e.target.value)} step={step} min="0" className="po-input" style={{ width: w }} />
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
                        <td style={{ padding:'3px 5px' }}>{inp('sgst', 44, 'number', '0.5')}</td>
                        <td style={{ padding:'3px 5px' }}>{inp('igst', 44, 'number', '0.5')}</td>
                        <td style={{ padding:'5px 10px', fontWeight:800, color:'#c0392b', whiteSpace:'nowrap', fontSize:12 }}>Rs.{total.toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
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
              </table>
            </div>

            {/* Success / Error message */}
            {pdfInvoiceMsg && (
              <div style={{ background: pdfInvoiceMsg.startsWith('Error')?'#fef2f2':'#f0fdf4', border:`1px solid ${pdfInvoiceMsg.startsWith('Error')?'#fecaca':'#bbf7d0'}`, borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color: pdfInvoiceMsg.startsWith('Error')?'#dc2626':'#15803d', display:'flex', alignItems:'center', gap:8 }}>
                  <span>{pdfInvoiceMsg.startsWith('Error')?'❌':'✅'}</span>
                  {pdfInvoiceMsg}
                </div>
                {!pdfInvoiceMsg.startsWith('Error') && (
                  <button onClick={() => { setShowPDFPanel(false); setPdfInvoiceMsg(''); }}
                    style={{ padding:'7px 14px', background:'#c0392b', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Done
                  </button>
                )}
              </div>
            )}

            {!pdfInvoiceMsg && (
              <button onClick={handleCreateFromPDF} disabled={pdfInvoicing}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'14px 24px', background: pdfInvoicing?'#94a3b8':'linear-gradient(135deg,#c0392b,#922b21)', color:'#fff', border:'none', borderRadius:12, fontSize:15, fontWeight:800, cursor: pdfInvoicing?'not-allowed':'pointer', fontFamily:'inherit', boxShadow: pdfInvoicing?'none':'0 4px 16px rgba(192,57,43,0.35)' }}>
                <MdReceipt size={20} />
                {pdfInvoicing ? 'Creating Invoice...' : `Create Invoice from PDF · ${editableItems.filter(it=>it.name.trim()).length} item(s)`}
              </button>
            )}
          </div>
        </div>
      )}

      </div>{/* end .po-page */}
    </div>
  );
}
