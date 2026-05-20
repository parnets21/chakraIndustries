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

// ── Universal PO Parser ───────────────────────────────────────────────────────
function parsePOFromText({ flatText, lines }) {
  const text = flatText;
  const result = { poNumber: '', vendor: '', buyerName: '', buyerAddress: '', buyerGSTIN: '', shipToName: '', shipToAddress: '', items: [], total: '', taxTotal: '', subTotal: '' };

  const GSTIN_RE = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])\b/;
  const PRICE_RE = /^(?:Rs\.?|INR|₹)?\s*[\d,]+(?:\.\d{1,4})?$/i;
  const UOM_RE   = /^(Nos?\.?|Numbers?|Pcs?\.?|Kgs?\.?|Units?|EA|Sets?|Ltrs?\.?|Mtrs?\.?|Boxes?|Rolls?|Pairs?|Bags?|Sheets?|MT|MTs?|Ton|Tons?|Tonne|Tonnes?|Quintal|Quintals?|Sqft|Sqm|RMT|Mtr|Mtrs?|Ltr|Ltrs?|Gms?|Grams?|Dozen|Bale|Bundle|Coil|Drum|Packet|Pkt)$/i;

  const toNum = (v) => { const n = parseFloat(String(v || '').replace(/[₹Rs\.INR,\s]/gi, '')); return isFinite(n) ? n : 0; };

  // Price = has currency/comma/2-decimal marker, OR plain integer ≥ 100
  const isPrice = (t) => {
    const raw = String(t || '').trim();
    if (!PRICE_RE.test(raw)) return false;
    const n = toNum(raw);
    if (n <= 0) return false;
    if (/[₹]|Rs\.?|INR/i.test(raw) || /,/.test(raw) || /\.\d{2}$/.test(raw)) return true;
    return /^\d+$/.test(raw) && n >= 100;
  };

  // Strip date tokens — handles "Friday, 15 May, 2026" as a single token
  const stripDates = (toks) => toks.filter(t => {
    if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(t)) return false;
    if (/^(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(t)) return false;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(t) || /^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(t)) return false;
    if (/^\d{4}$/.test(t) && +t >= 1900 && +t <= 2099) return false;
    return true;
  });

  const isSerial = (t) => /^\d{1,3}\.?$/.test(String(t || '').trim());

  // ── PO Number ────────────────────────────────────────────────────────────
  const poM = text.match(/(?:PO|Purchase\s+Order)\s*(?:No\.?|Number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,29})/i)
    || text.match(/Order\s+(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{2,29})/i);
  if (poM && /\d/.test(poM[1])) result.poNumber = poM[1].trim();

  // ── Vendor ───────────────────────────────────────────────────────────────
  const vendM = text.match(/Vendor\s+Name\s*[:\-]\s*([^\n]{3,80})/i)
    || text.match(/Supplier\s*[:\-]\s*([^\n]{3,80})/i)
    || text.match(/From\s*[:\-]\s*([^\n,]{3,80})/i)
    || text.match(/Vendor\s*[:\-]\s*([^\n,]{3,80})/i);
  if (vendM) {
    let v = vendM[1].trim().replace(/\s*Purchase\s+Order.*$/i, '').replace(/\s*(PO\s*No\.?|Order\s*No\.?)\s*[:\-].*$/i, '').trim();
    if (v.length >= 3) result.vendor = v.slice(0, 80);
  }

  // ── Buyer ────────────────────────────────────────────────────────────────
  const billingIdx = text.search(/(?:BILLING|SHIPPING|SHIP\s*TO|DELIVER(?:Y)?\s*TO|SOLD\s*TO)\s+(?:ADDRESS)?\s*[:\-]/i);
  if (billingIdx !== -1) {
    const block = text.slice(billingIdx, billingIdx + 800);
    const nm = block.match(/(?:BILLING|SHIPPING|SHIP\s*TO|DELIVER(?:Y)?\s*TO|SOLD\s*TO)\s+(?:ADDRESS)?\s*[:\-]+\s*([^\n]{3,120})/i);
    if (nm) {
      let nl = nm[1].trim();
      const ig = nl.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
      if (ig) { result.buyerGSTIN = ig[1]; nl = nl.replace(ig[0], '').trim(); }
      const bg = nl.match(GSTIN_RE);
      if (bg) { result.buyerGSTIN = result.buyerGSTIN || bg[1]; nl = nl.replace(bg[0], '').trim(); }
      result.buyerName = nl.replace(/[,\s]+$/, '').trim();
    }
    const addrLines = [];
    for (const ln of block.split('\n').slice(1)) {
      const t = ln.trim(); if (!t) continue;
      const gm = t.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
      if (gm) { if (!result.buyerGSTIN) result.buyerGSTIN = gm[1]; const r = t.replace(gm[0], '').trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, ''); if (r) addrLines.push(r); continue; }
      if (/^(PAN\s*No|CIN\s*No|BRANCH|E-Mail|Contact|Tel\s*No|Mob\s*No|Payment|Warranty|Delivery\s*At|PO\s*No|PO\s*Date|Vendor)/i.test(t)) break;
      if (GSTIN_RE.test(t) && t.length < 20) { if (!result.buyerGSTIN) result.buyerGSTIN = t.match(GSTIN_RE)[1]; continue; }
      addrLines.push(t);
    }
    result.buyerAddress = addrLines.slice(0, 6).join('\n');
  } else {
    // Bill to / Ship to format — extract both separately using line-by-line approach
    const allTextLines = text.split('\n');

    const findLabelLineIdx = (re) => {
      for (let i = 0; i < allTextLines.length; i++) {
        if (re.test(allTextLines[i].trim())) return i;
      }
      return -1;
    };

    // ── Handle "Ship/Bill To" combined label (e.g. D-Mart POs) ──────────────
    // Some POs use "Ship/Bill To" as a single label meaning both addresses are the same
    const shipBillCombinedIdx = findLabelLineIdx(/Ship\s*\/\s*Bill\s+[Tt]o|Bill\s*\/\s*Ship\s+[Tt]o/i);
    if (shipBillCombinedIdx !== -1) {
      const blockLines = allTextLines.slice(shipBillCombinedIdx, shipBillCombinedIdx + 12);
      let name = '', gstin = '';
      const addrParts = [];
      // First line may have inline name after the label
      const inlineM = blockLines[0].match(/(?:Ship\s*\/\s*Bill\s+To|Bill\s*\/\s*Ship\s+To)\s*[:\-]?\s*(.+)/i);
      if (inlineM && inlineM[1].trim().length >= 3) name = inlineM[1].trim().replace(/[,\s]+$/, '').slice(0, 120);
      for (let i = 1; i < blockLines.length; i++) {
        const ln = blockLines[i].trim();
        if (!ln) continue;
        if (/^(Phone|Attn|Email|Buyer|Vendor|Validity|CIN|PAN|GSTIN|Terms|Payment|Delivery|PO\s*No|PO\s*Date|Sno|S\.?\s*No|Sr\.?\s*No|Item|Qty|HSN)/i.test(ln)) {
          const gm = ln.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
          if (gm) { gstin = gm[1]; }
          break;
        }
        const gm = ln.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
        if (gm) { gstin = gm[1]; const r = ln.replace(gm[0], '').trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, ''); if (r) addrParts.push(r); continue; }
        if (GSTIN_RE.test(ln) && ln.length < 25) { gstin = ln.match(GSTIN_RE)[1]; continue; }
        if (!name) name = ln.replace(/[,\s]+$/, '').trim().slice(0, 120);
        else addrParts.push(ln);
        if (addrParts.length >= 5) break;
      }
      result.buyerName    = name;
      result.buyerAddress = addrParts.join(', ');
      result.buyerGSTIN   = result.buyerGSTIN || gstin;
      // Ship To = same as Bill To for this format
      result.shipToName    = name;
      result.shipToAddress = addrParts.join(', ');
    }

    // Check for two-column same-line header: "Bill to:   Ship to:" on one line
    const twoColHeaderIdx = shipBillCombinedIdx !== -1 ? -1 : findLabelLineIdx(/Bill\s+[Tt]o.*Ship\s+[Tt]o/i);

    if (twoColHeaderIdx !== -1) {
      // Two-column layout: Bill To on left, Ship To on right
      // The address lines below are also side-by-side — left half = Bill To, right half = Ship To
      // We use x-position data from the `lines` array (not flatText) for accurate column splitting
      const headerLine = lines.find(l => {
        const ls = l.tokens.map(t => t.str).join(' ');
        return /Bill\s+[Tt]o/i.test(ls) && /Ship\s+[Tt]o/i.test(ls);
      });

      // Find the x midpoint between Bill To and Ship To tokens
      let splitX = 0;
      if (headerLine) {
        const billTok = headerLine.tokens.find(t => /Bill/i.test(t.str));
        const shipTok = headerLine.tokens.find(t => /Ship/i.test(t.str));
        if (billTok && shipTok) splitX = Math.round((billTok.x + shipTok.x) / 2);
        else splitX = Math.round(headerLine.tokens[Math.floor(headerLine.tokens.length / 2)]?.x || 300);
      } else {
        splitX = 300; // fallback midpoint
      }

      // Collect lines below the header until we hit the item table
      const STOP_RE = /^(Item|Description|S\.?\s*No|Sr\.?\s*No|Sl\.?\s*No|Qty|HSN|SAC|Terms|Payment|Indented|Approved|Authorized)/i;
      const headerY = headerLine?.y ?? 0;
      const addrLines = lines.filter(l => l.y > headerY && l.page === (headerLine?.page ?? 1))
        .filter(l => !STOP_RE.test(l.tokens.map(t => t.str).join(' ').trim()))
        .slice(0, 10);

      const billLines = [], shipLines = [];
      for (const l of addrLines) {
        const leftToks  = l.tokens.filter(t => t.x < splitX).map(t => t.str).join(' ').trim();
        const rightToks = l.tokens.filter(t => t.x >= splitX).map(t => t.str).join(' ').trim();
        if (leftToks)  billLines.push(leftToks);
        if (rightToks) shipLines.push(rightToks);
      }

      // Extract name (first non-label line) and address from each column
      const parseColumn = (colLines) => {
        let name = '', gstin = '';
        const addrParts = [];
        for (const ln of colLines) {
          const t = ln.trim();
          if (!t) continue;
          if (/^(Bill|Ship|Deliver)\s*(To|to)\s*[:\-]?\s*$/i.test(t)) continue; // skip label-only lines
          const gm = t.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
          if (gm) { gstin = gm[1]; const r = t.replace(gm[0], '').trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, ''); if (r) addrParts.push(r); continue; }
          if (GSTIN_RE.test(t) && t.length < 25) { gstin = t.match(GSTIN_RE)[1]; continue; }
          if (/^(Delivery\s+Contact|Contact|Tel|Mob|Email|Indented|Approved)/i.test(t)) break;
          if (!name) name = t.replace(/[,\s]+$/, '').trim().slice(0, 120);
          else addrParts.push(t);
          if (addrParts.length >= 5) break;
        }
        return { name, address: addrParts.join(', '), gstin };
      };

      const billTo = parseColumn(billLines);
      const shipTo = parseColumn(shipLines);

      result.buyerName     = billTo.name || shipTo.name;
      result.buyerAddress  = billTo.address;
      result.buyerGSTIN    = result.buyerGSTIN || billTo.gstin || shipTo.gstin;
      result.shipToName    = (shipTo.name && shipTo.name !== billTo.name) ? shipTo.name : '';
      result.shipToAddress = (shipTo.address && shipTo.address !== billTo.address) ? shipTo.address : '';

    } else {
      // Single-column or separate-line labels
      const billToLineIdx    = findLabelLineIdx(/^Bill\s+To\s*[:\-]?\s*$/i);
      const shipToLineIdx    = findLabelLineIdx(/^Ship\s*To\s*[:\-]?\s*$/i);
      const deliverToLineIdx = findLabelLineIdx(/^Deliver(?:y)?\s*To\s*[:\-]?\s*$/i);
      const billToInlineIdx  = findLabelLineIdx(/Bill\s+To\s*[:\-]/i);
      const shipToInlineIdx  = findLabelLineIdx(/Ship\s*To\s*[:\-]/i);
      const deliverToInlineIdx = findLabelLineIdx(/Deliver(?:y)?\s*To\s*[:\-]/i);

      const extractFromLineIdx = (lineIdx, labelOnSameLine) => {
        if (lineIdx === -1) return { name: '', address: '', gstin: '' };
        const blockLines = allTextLines.slice(lineIdx, lineIdx + 12);
        let name = '', gstin = '';
        const addrLines = [];
        let startIdx = 0;

        if (labelOnSameLine) {
          const labelLine = blockLines[0];
          const inlineMatch = labelLine.match(/(?:Bill\s+To|Ship\s*To|Deliver(?:y)?\s*To)\s*[:\-]\s*(.+)/i);
          if (inlineMatch) {
            let c = inlineMatch[1].trim().replace(GSTIN_RE, '').trim();
            const half = c.slice(0, Math.floor(c.length / 2)).trim();
            if (half.length >= 5 && c.toLowerCase().startsWith(half.toLowerCase())) c = half;
            name = c.replace(/[,\s]+$/, '').trim().slice(0, 120);
          }
          startIdx = 1;
        } else {
          startIdx = 1;
        }

        for (let i = startIdx; i < blockLines.length; i++) {
          const ln = blockLines[i].trim();
          if (!ln) continue;
          if (/^(GSTIN|PAN\s*No|CIN\s*No|Contact|Tel|Mob|Email|Ship\s*To|Bill\s*To|Deliver|Indented|Approved|Item|Qty|S\.?\s*No|Sr\.?\s*No|Sl\.?\s*No|Description|Product|Material|Terms|Payment|Warranty|Authorized)/i.test(ln)) {
            const gm = ln.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
            if (gm) { gstin = gm[1]; continue; }
            break;
          }
          const gm = ln.match(/GSTIN\s*[:\-]?\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])/i);
          if (gm) { gstin = gm[1]; const r = ln.replace(gm[0], '').trim().replace(/^[,:\-\s]+|[,:\-\s]+$/g, ''); if (r) addrLines.push(r); continue; }
          if (GSTIN_RE.test(ln) && ln.length < 25) { gstin = ln.match(GSTIN_RE)[1]; continue; }
          let cleanLn = ln;
          const half = cleanLn.slice(0, Math.floor(cleanLn.length / 2)).trim();
          if (half.length >= 8 && cleanLn.toLowerCase().startsWith(half.toLowerCase())) cleanLn = half;
          if (!name) { name = cleanLn.replace(/[,\s]+$/, '').trim().slice(0, 120); }
          else { addrLines.push(cleanLn); }
          if (addrLines.length >= 5) break;
        }
        return { name, address: addrLines.join(', '), gstin };
      };

      const billToIdx = billToLineIdx !== -1 ? billToLineIdx : billToInlineIdx;
      const shipToIdx = shipToLineIdx !== -1 ? shipToLineIdx : (shipToInlineIdx !== -1 ? shipToInlineIdx : deliverToLineIdx !== -1 ? deliverToLineIdx : deliverToInlineIdx);
      const billLabelOnSameLine = billToLineIdx === -1 && billToInlineIdx !== -1;
      const shipLabelOnSameLine = shipToLineIdx === -1 && (shipToInlineIdx !== -1 || deliverToLineIdx === -1);

      const billTo = extractFromLineIdx(billToIdx, billLabelOnSameLine);
      const shipTo = extractFromLineIdx(shipToIdx, shipLabelOnSameLine);

      result.buyerName     = billTo.name || shipTo.name;
      result.buyerAddress  = billTo.address;
      result.buyerGSTIN    = result.buyerGSTIN || billTo.gstin || shipTo.gstin;
      result.shipToName    = (shipTo.name && shipTo.name !== billTo.name) ? shipTo.name : '';
      result.shipToAddress = (shipTo.address && shipTo.address !== billTo.address) ? shipTo.address : '';
    }
  }
  if (!result.buyerGSTIN) {
    const all = [...text.matchAll(/\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9][Z][A-Z0-9])\b/g)].map(m => m[1]);
    result.buyerGSTIN = all[1] || all[0] || '';
  }

  // ── Totals ───────────────────────────────────────────────────────────────
  const grandM = text.match(/Grand\s+Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Net\s+Amount\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Total\s+Amount\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Amount\s+Payable\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Invoice\s+Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Order\s+Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/\bTotal\s*[:\-]\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (grandM) result.total = grandM[1].replace(/,/g, '');
  const taxM = text.match(/(?:Total\s+)?Tax\s+Amount\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (taxM) result.taxTotal = taxM[1].replace(/,/g, '');
  const subM = text.match(/Sub\s*Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i) || text.match(/Total\s+(?:Base|Taxable)\s+(?:Value|Amount)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (subM) result.subTotal = subM[1].replace(/,/g, '');

  // ── Core item extractor ───────────────────────────────────────────────────
  // Given raw tokens for one row, extract item data or return null
  const extractItem = (rawToks) => {
    const toks = stripDates(rawToks);
    if (toks.length < 3) return null;

    // Broader numeric check: any token that looks like a number (with or without currency)
    const isNumeric = (t) => {
      const raw = String(t || '').trim().replace(/^[₹Rs\.INR,\s]+/i, '').replace(/,/g, '');
      return /^\d+(\.\d{1,4})?$/.test(raw) && parseFloat(raw) > 0;
    };

    // All numeric entries with position
    const nums = toks.map((t, i) => ({ t, i, n: toNum(t), ok: isNumeric(t) })).filter(x => x.ok);
    if (nums.length < 2) return null;

    // Last number = line total (largest value, or last if ambiguous)
    const totalE = nums.reduce((best, x) => x.n >= best.n ? x : best, nums[nums.length - 1]);
    const lineTotal = totalE.n;

    // Qty detection — try multiple strategies
    let qtyE = null;

    // Strategy 1: find a number where rate × qty ≈ lineTotal (within 2%), both numbers present
    for (let a = 0; a < nums.length && !qtyE; a++) {
      for (let b = a + 1; b < nums.length && !qtyE; b++) {
        const na = nums[a], nb = nums[b];
        if (na.i === totalE.i || nb.i === totalE.i) continue;
        if (na.i === 0 || nb.i === 0) continue; // skip serial
        // Check if na × nb ≈ lineTotal
        const prod = na.n * nb.n;
        if (prod > 0 && Math.abs(prod - lineTotal) / Math.max(prod, lineTotal) < 0.03) {
          // Smaller = qty, larger = rate
          if (na.n <= nb.n) { qtyE = na; }
          else { qtyE = nb; }
          break;
        }
      }
    }

    // Strategy 2: first number after serial that is < 10000 and not the total
    if (!qtyE) {
      qtyE = nums.find(x => x.i > 0 && x.i !== totalE.i && x.n < 10000 && x.n > 0);
    }

    // Strategy 3: lineTotal / candidate = reasonable qty
    if (!qtyE) {
      for (const x of nums) {
        if (x.i === 0 || x.i === totalE.i) continue;
        const q = lineTotal / x.n;
        if (q >= 0.001 && q <= 100000) {
          qtyE = { t: String(+q.toFixed(3)), i: -1, n: +q.toFixed(3), ok: true };
          break;
        }
      }
    }

    if (!qtyE) return null;
    const qty = qtyE.n;

    // Unit rate = number where rate × qty ≈ lineTotal (within 3%)
    let rateE = nums.find(x => {
      if (x.i === 0 || x.i === totalE.i || x.i === qtyE.i) return false;
      const c = x.n * qty;
      return c > 0 && Math.abs(c - lineTotal) / Math.max(c, lineTotal) < 0.03;
    });
    const unitRate = rateE ? rateE.n : +(lineTotal / qty).toFixed(2);
    if (!unitRate || unitRate <= 0) return null;

    // Name = text tokens before first number after serial
    const firstNumIdx = nums.filter(x => x.i > 0).reduce((m, x) => Math.min(m, x.i), Infinity);
    let nameToks = toks.slice(1, firstNumIdx === Infinity ? toks.length : firstNumIdx).filter(t => t.trim() && !UOM_RE.test(t));
    if (!nameToks.length) nameToks = toks.filter((t, i) => i > 0 && /[A-Za-z]/.test(t) && !UOM_RE.test(t));
    let name = nameToks.join(' ').replace(/\s+/g, ' ').replace(/\s*\/?\s*\d{6,10}\s*$/, '').trim();
    if (name.length < 2) return null;

    // GST inference — only used as a display hint, not for calculation
    const taxable = +(unitRate * qty).toFixed(2);
    const rawPct = taxable > 0 ? (lineTotal - taxable) / taxable * 100 : 0;
    // Snap to nearest standard slab — 0 wins when there's no tax difference
    const gst = [0, 5, 12, 18, 28].reduce((p, c) => Math.abs(c - rawPct) < Math.abs(p - rawPct) ? c : p, 0);

    // Tax breakdown — only extract if tokens look like genuine GST columns
    // Valid GST slabs only; must not be the qty or rate token; tax value must be << lineTotal
    const GST_SLABS = new Set([5, 12, 18, 28, 2.5, 6, 9, 14]);
    let cgst = 0, sgst = 0, igst = 0, cgstVal = 0, sgstVal = 0, igstVal = 0;
    const usedIdx = new Set([0, qtyE?.i, rateE?.i, totalE?.i].filter(x => x != null && x >= 0));
    // Pre-compute pdfLineTotal and taxDiff — used in multiple passes below
    const pdfLineTotal = +lineTotal.toFixed(2);
    const taxDiff = +(pdfLineTotal - taxable).toFixed(2);

    // Pass A: look for GST % followed by a matching tax amount (within 20% tolerance)
    for (let i = 0; i < toks.length - 1; i++) {
      if (usedIdx.has(i)) continue;
      const pctRaw = parseFloat(toks[i]);
      if (!isFinite(pctRaw) || !GST_SLABS.has(pctRaw)) continue;
      const valRaw = toNum(toks[i + 1]);
      if (valRaw <= 0) continue;
      // Sanity check: pct% of taxable ≈ val (within 20% — wider tolerance for PDFs with different taxable base)
      if (taxable > 0) {
        const expected = taxable * pctRaw / 100;
        if (Math.abs(expected - valRaw) / Math.max(expected, valRaw) > 0.20) continue;
      }
      if (!cgst) { cgst = pctRaw; cgstVal = valRaw; }
      else if (!sgst) { sgst = pctRaw; sgstVal = valRaw; }
      else if (!igst) { igst = pctRaw; igstVal = valRaw; }
    }

    // Pass B: if no tax found yet, look for GST % values alone (no adjacent amount)
    // This handles PDFs where tax % columns exist but amounts are computed from line total
    if (cgst === 0 && sgst === 0 && igst === 0) {
      const slabTokens = [];
      for (let i = 0; i < toks.length; i++) {
        if (usedIdx.has(i)) continue;
        const v = parseFloat(toks[i]);
        if (isFinite(v) && GST_SLABS.has(v)) slabTokens.push({ v, i });
      }
      // Two equal slab values → CGST + SGST (intra-state)
      if (slabTokens.length >= 2 && slabTokens[0].v === slabTokens[1].v) {
        cgst = slabTokens[0].v;
        sgst = slabTokens[1].v;
        cgstVal = +(taxable * cgst / 100).toFixed(2);
        sgstVal = +(taxable * sgst / 100).toFixed(2);
      }
      // One slab value → could be IGST (inter-state) or single CGST
      else if (slabTokens.length === 1) {
        // Check if lineTotal - taxable ≈ taxable * slab / 100 (IGST)
        const slab = slabTokens[0].v;
        const expectedTax = taxable * slab / 100;
        const actualTax = pdfLineTotal - taxable;
        if (actualTax > 0.5 && Math.abs(expectedTax - actualTax) / Math.max(expectedTax, actualTax) < 0.10) {
          igst = slab;
          igstVal = +(taxable * igst / 100).toFixed(2);
        }
      }
    }

    // ── Back-calculate tax ONLY when lineTotal > taxable by a meaningful margin
    // AND the difference snaps cleanly to a known GST slab.
    // If lineTotal ≈ taxable (no-tax PDF), taxDiff ≈ 0 → skip entirely.
    if (cgst === 0 && sgst === 0 && igst === 0 && taxDiff > 0.5) {
      const rawPctCalc = taxable > 0 ? taxDiff / taxable * 100 : 0;
      // Only infer if it snaps tightly to a known slab (within 1.5%)
      const nearestSlab = [5, 12, 18, 28].find(s => Math.abs(s - rawPctCalc) < 1.5);
      if (nearestSlab) {
        cgst = nearestSlab / 2;
        sgst = nearestSlab / 2;
        cgstVal = +(taxable * cgst / 100).toFixed(2);
        sgstVal = +(taxable * sgst / 100).toFixed(2);
        igstVal = 0;
      }
      // If it doesn't snap to a slab, leave all tax as 0 — PDF has no tax
    }

    // ── Special case: rate already includes tax (taxable ≈ lineTotal) ──────────
    // This happens when the parser picks the "landed price" (post-tax) as the rate.
    // Detect by finding a GST slab % in the tokens and back-computing the base price.
    if (cgst === 0 && sgst === 0 && igst === 0 && Math.abs(taxDiff) < 1.0) {
      // Look for a GST slab % token in the row
      const slabTokens = [];
      for (let i = 0; i < toks.length; i++) {
        if (usedIdx.has(i)) continue;
        const v = parseFloat(toks[i]);
        if (isFinite(v) && GST_SLABS.has(v) && v > 0) slabTokens.push({ v, i });
      }
      if (slabTokens.length > 0) {
        // Use the first non-zero slab found
        const slab = slabTokens[0].v;
        // Back-compute: basePrice = landedPrice / (1 + slab/100)
        const baseRate = +(unitRate / (1 + slab / 100)).toFixed(2);
        const baseTaxable = +(baseRate * qty).toFixed(2);
        const taxFromSlab = +(baseTaxable * slab / 100).toFixed(2);
        // Verify: baseTaxable + taxFromSlab ≈ lineTotal (within 2%)
        if (Math.abs(baseTaxable + taxFromSlab - pdfLineTotal) / pdfLineTotal < 0.02) {
          // Determine CGST/SGST vs IGST based on number of slab tokens
          if (slabTokens.length >= 2 && slabTokens[0].v === slabTokens[1].v) {
            cgst = slab; sgst = slab;
            cgstVal = +(baseTaxable * cgst / 100).toFixed(2);
            sgstVal = +(baseTaxable * sgst / 100).toFixed(2);
          } else {
            // Single slab — check if it's CGST only (half of total) or IGST
            // If slab appears once and total tax = slab% of base, it's IGST
            igst = slab;
            igstVal = +(baseTaxable * igst / 100).toFixed(2);
          }
          // Update taxable and rate to use base (pre-tax) values
          return {
            name,
            qty,
            unit: toks.find(t => UOM_RE.test(t)) || 'Nos',
            rate: baseRate,
            gst: slab,
            cgst, cgstVal,
            sgst, sgstVal,
            igst, igstVal,
            discount: 0,
            taxableValue: baseTaxable,
            lineAmount: pdfLineTotal,
            hsn,
          };
        }
      }
    }

    // HSN
    let hsn = '';
    const hsnL = toks.join(' ').match(/\b(?:HSN|SAC)\b\s*(?:Code)?\s*[:-]?\s*(\d{4,10})/i);
    if (hsnL) hsn = hsnL[1];
    else { const sl = toks.join(' ').match(/\/\s*(\d{6,10})(?=\s|$)/); if (sl) hsn = sl[1]; }
    if (!hsn) { const st = toks.find((t, i) => i > 0 && /^\d{6,10}$/.test(t) && !isPrice(t) && t !== String(qtyE.n)); if (st) hsn = st; }

    // Recompute final gst total percentage
    const finalGstPct = cgst + sgst + igst || gst;

    return {
      name,
      qty,
      unit: toks.find(t => UOM_RE.test(t)) || 'Nos',
      rate: +unitRate.toFixed(2),
      gst: finalGstPct,
      cgst, cgstVal,
      sgst, sgstVal,
      igst, igstVal,
      discount: 0,
      taxableValue: taxable,
      lineAmount: pdfLineTotal,
      hsn,
    };
  };

  const seen = new Set();
  const addItem = (item) => {
    if (!item || item.name.length < 2) return false;
    const key = `${item.name.toLowerCase()}|${item.qty}`;
    if (seen.has(key)) return false;
    seen.add(key); result.items.push(item); return true;
  };

  // ── Pass 1: scan every line ───────────────────────────────────────────────
  const HDRLINE = /^(sl\.?\s*no\.?|s\.?\s*no\.?|sr\.?\s*no\.?|item\s*(name|description|code)|qty\.?|quantity|uom|unit\s*(price|rate)?|base\s*price|cgst|sgst|igst|gst\s*%?|amount|total\s*amount|tax\s*amount|discount|hsn\s*(code)?|sac\s*(code)?|taxable|page\s*\d|terms|dear\s+sir|we\s+hereby|vendor\s*(name|no)|billing\s*address|shipping\s*address|contact\s*(person|no)|gstin\s*[:\-]|pan\s*(no|number)|cin\s*(no|number)|ifsc|bank\s*(name|account)|payment\s*terms?|warranty|delivery\s*(date|address)|purchase\s*order\s*(no|date|number)|po\s*(no|date|number)|authorized\s*signatory|e\s*&\s*oe)/i;

  for (const line of lines) {
    const rawToks = line.tokens.map(t => t.str);
    const toks = stripDates(rawToks);
    const ls = toks.join(' ');
    if (ls.length < 5) continue;
    if (!toks.some(isPrice) && HDRLINE.test(ls.trim())) continue;
    const item = extractItem(rawToks);
    if (item) { addItem(item); console.log('✅ Pass1:', item.name, 'qty=', item.qty, 'rate=', item.rate); }
  }

  // ── Pass 2: table-aware ───────────────────────────────────────────────────
  if (result.items.length === 0) {
    const TBLHDR = /(\bHSN\b|\bSAC\b|\bQty\b|\bQuantity\b|\bDescription\b|\bItem\b|\bProduct\b|\bMaterial\b|\bRate\b|\bAmount\b|\bUnit\s*Price\b|\bMRP\b|\bNeed\s*By\b)/i;
    const TBLEND = /^(Sub\s*Total|Grand\s*Total|Net\s+Amount|Total\s+Amount|Amount\s+in\s+Words|Terms|Declaration|For\s+|Authorized\s+Signatory|E\s*&\s*OE)/i;
    let inTable = false;
    const tableLines = [];
    for (const line of lines) {
      const ls = line.tokens.map(t => t.str).join(' ').trim();
      if (!ls) continue;
      if (!inTable && (ls.match(TBLHDR) || []).length >= 2) { inTable = true; continue; }
      if (inTable && TBLEND.test(ls)) break;
      if (inTable) tableLines.push(line);
    }
    // Group lines into rows: a new row starts when the first token is a serial number
    // OR when the line contains numeric values (price/qty) suggesting it's a data row
    const rows = []; let cur = [];
    for (const line of tableLines) {
      const t0 = line.tokens[0]?.str || '';
      const lineHasNums = line.tokens.some(t => /^\d+(\.\d+)?$/.test(t.str) && parseFloat(t.str) > 0);
      if (isSerial(t0) && cur.length) { rows.push(cur); cur = []; }
      // If no serial detected but line has numbers and cur already has a description line, start new row
      else if (!isSerial(t0) && cur.length > 0 && lineHasNums) {
        const curHasNums = cur.some(l => l.tokens.some(t => /^\d+(\.\d+)?$/.test(t.str) && parseFloat(t.str) > 0));
        // If current row already has numbers, this might be a new row without serial
        if (curHasNums) { rows.push(cur); cur = []; }
      }
      cur.push(line);
    }
    if (cur.length) rows.push(cur);
    console.log(`📋 Table: ${rows.length} rows`);
    for (const row of rows) {
      // Merge all tokens from all lines in this row
      const rawToks = row.flatMap(l => l.tokens.map(t => t.str));
      console.log('  Row:', rawToks.join(' ').substring(0, 120));
      const item = extractItem(rawToks);
      console.log('  →', item ? `✅ ${item.name} qty=${item.qty} rate=${item.rate}` : '❌ failed');
      addItem(item);
    }
  }

  // ── Pass 3: loose scan ────────────────────────────────────────────────────
  if (result.items.length === 0) {
    for (const line of lines) {
      const rawToks = line.tokens.map(t => t.str);
      const toks = stripDates(rawToks);
      if (toks.filter(isPrice).length >= 1 && toks.some(t => /^\d{1,4}$/.test(t) && +t > 0 && +t < 10000)) addItem(extractItem(rawToks));
    }
    console.log(`✅ Pass3: ${result.items.length} items`);
  }

  console.log('📊 Summary:', { items: result.items.length, poNumber: result.poNumber, vendor: result.vendor, buyer: result.buyerName, total: result.total });
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>PO Upload & Invoice Generation</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Upload any PO PDF — data is auto-extracted, edit if needed, then create invoice</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input ref={fileRef} type="file" accept="application/pdf" onChange={handlePDFUpload} style={{ display: 'none' }} />
          <button onClick={() => navigate('/po-generator/invoice-history')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#fff', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <MdHistory size={15} /> Invoice History
          </button>
          <button onClick={() => fileRef.current?.click()} disabled={parsing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 22px', background: parsing ? '#94a3b8' : 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: parsing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(192,57,43,0.3)' }}>
            <MdPictureAsPdf size={18} /> {parsing ? 'Reading PDF...' : 'Upload PO PDF'}
          </button>
        </div>
      </div>

      {parseError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '11px 15px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
          <span>❌ {parseError}</span>
          <button onClick={() => setParseError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><MdClose size={15} /></button>
        </div>
      )}

      {/* Day-wise summary */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 13, padding: '18px 20px', marginBottom: 22, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#0f172a' }}><MdCalendarToday size={18} color="#c0392b" /> Uploaded PO Today View</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Use the calendar to see uploaded POs and invoice data for the selected day.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="date" value={selectedUploadDate} onChange={e => setSelectedUploadDate(e.target.value)} style={{ height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', color: '#0f172a', background: '#fff' }} />
            <button onClick={() => loadUploadSummary(selectedUploadDate)} disabled={summaryLoading} style={{ height: 38, width: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: 8, background: summaryLoading ? '#f1f5f9' : '#fff', color: '#475569', cursor: summaryLoading ? 'not-allowed' : 'pointer' }}><MdRefresh size={18} /></button>
          </div>
        </div>
        {summaryError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>{summaryError}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'POs Uploaded', value: uploadSummary?.selected?.uploadedPOs || 0, color: '#c0392b', bg: '#fef2f2', border: '#fecaca' },
            { label: 'Invoices Created', value: uploadSummary?.selected?.invoiceCount || 0, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Line Items', value: uploadSummary?.selected?.itemCount || 0, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Invoice Value', value: money(uploadSummary?.selected?.totalValue), color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: card.color, lineHeight: 1.1 }}>{card.value}</div>
            </div>
          ))}
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Upload Time','PO Number','Invoice No','Vendor','Buyer','Items','Amount','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryLoading && <tr><td colSpan={9} style={{ padding: 18, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>Loading...</td></tr>}
              {!summaryLoading && (uploadSummary?.selected?.invoices || []).map(inv => (
                <tr key={inv._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDateTime(inv.createdAt)}</td>
                  <td style={{ padding: '10px 12px', color: '#0f172a', fontWeight: 800, whiteSpace: 'nowrap' }}>{inv.poRef || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#1d4ed8', fontWeight: 800, whiteSpace: 'nowrap' }}>{inv.invoiceNo}</td>
                  <td style={{ padding: '10px 12px', color: '#334155', minWidth: 140 }}>{inv.vendorName || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#334155', minWidth: 140 }}>{inv.buyerName || '-'}</td>
                  <td style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>{inv.itemCount || 0}</td>
                  <td style={{ padding: '10px 12px', color: '#7c3aed', fontWeight: 900, whiteSpace: 'nowrap' }}>{money(inv.grandTotal)}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 999, background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 800 }}>{inv.status}</span></td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <button onClick={() => handleViewInvoice(inv)} disabled={viewLoading === inv._id} title="View" style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe', borderRadius: 8, background: viewLoading === inv._id ? '#f1f5f9' : '#eff6ff', color: '#1d4ed8', cursor: viewLoading === inv._id ? 'not-allowed' : 'pointer' }}><MdVisibility size={17} /></button>
                      <button onClick={() => handleDeleteInvoice(inv)} disabled={deletingInvoice === inv._id} title="Delete" style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fecaca', borderRadius: 8, background: deletingInvoice === inv._id ? '#f1f5f9' : '#fef2f2', color: '#dc2626', cursor: deletingInvoice === inv._id ? 'not-allowed' : 'pointer' }}><MdDelete size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!summaryLoading && !(uploadSummary?.selected?.invoices || []).length && <tr><td colSpan={9} style={{ padding: 18, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>No PO uploads found for this date.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Invoice Modal */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title={`Invoice: ${viewInvoice?.invoiceNo || ''}`} size="lg" footer={<button onClick={() => setViewInvoice(null)} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>}>
        {viewInvoice && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 16 }}>
              {[['PO Number', viewInvoice.poRef || '-'], ['Invoice No', viewInvoice.invoiceNo || '-'], ['Vendor', viewInvoice.vendorName || '-'], ['Status', viewInvoice.status || '-'], ['Grand Total', money(viewInvoice.grandTotal)]].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{value}</div>
                </div>
              ))}
              {/* Bill To */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', background: '#f8fafc', gridColumn: 'span 2' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Bill To</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{viewInvoice.buyerName || '-'}</div>
                {viewInvoice.buyerAddress && <div style={{ fontSize: 12, color: '#475569', marginTop: 3, whiteSpace: 'pre-line' }}>{viewInvoice.buyerAddress}</div>}
                {viewInvoice.buyerGSTIN && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>GSTIN: {viewInvoice.buyerGSTIN}</div>}
              </div>
              {/* Ship To */}
              {(viewInvoice.shipToName || viewInvoice.shipToAddress) && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 12px', background: '#f8fafc', gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Ship To</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{viewInvoice.shipToName || viewInvoice.buyerName || '-'}</div>
                  {viewInvoice.shipToAddress && <div style={{ fontSize: 12, color: '#475569', marginTop: 3, whiteSpace: 'pre-line' }}>{viewInvoice.shipToAddress}</div>}
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: '#f8fafc' }}>{['#','Item','HSN','Qty','Rate','Taxable','Total'].map(h => <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>{h}</th>)}</tr></thead>
                <tbody>
                  {(viewInvoice.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '9px 10px', color: '#94a3b8', fontWeight: 800 }}>{i + 1}</td>
                      <td style={{ padding: '9px 10px', color: '#334155', minWidth: 180 }}>{item.itemName || item.name || '-'}</td>
                      <td style={{ padding: '9px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{item.hsn || '-'}</td>
                      <td style={{ padding: '9px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{Number(item.invoicedQty || item.qty || 0).toLocaleString('en-IN')} {item.unit || ''}</td>
                      <td style={{ padding: '9px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{money(item.basePrice || item.rate)}</td>
                      <td style={{ padding: '9px 10px', color: '#475569', whiteSpace: 'nowrap' }}>{money(item.taxableValue)}</td>
                      <td style={{ padding: '9px 10px', color: '#c0392b', fontWeight: 900, whiteSpace: 'nowrap' }}>{money(item.lineTotal || item.lineAmount)}</td>
                    </tr>
                  ))}
                  {!(viewInvoice.items || []).length && <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>No line items found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* PDF Preview Panel */}
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
              { label: 'Grand Total', value: parsedPO.total ? `₹${parseFloat(parsedPO.total).toLocaleString('en-IN')}` : 'Not detected', ok: !!parsedPO.total },
              { label: 'Items',     value: `${parsedPO.items.length} found`, ok: parsedPO.items.length > 0 },
            ].map(f => (
              <div key={f.label} style={{ background: f.ok ? '#f0fdf4' : '#fef9f0', border: `1px solid ${f.ok ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 9, padding: '11px 13px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: f.ok ? '#15803d' : '#92400e' }}>{f.value}</div>
              </div>
            ))}
            {/* Bill To card */}
            <div style={{ background: parsedPO.buyerName ? '#f0fdf4' : '#fef9f0', border: `1px solid ${parsedPO.buyerName ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Bill To</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: parsedPO.buyerName ? '#15803d' : '#92400e' }}>{parsedPO.buyerName || 'Not detected'}</div>
              {parsedPO.buyerAddress && <div style={{ fontSize: 11, color: '#475569', marginTop: 3, whiteSpace: 'pre-line' }}>{parsedPO.buyerAddress}</div>}
              {parsedPO.buyerGSTIN && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>GSTIN: {parsedPO.buyerGSTIN}</div>}
            </div>
            {/* Ship To card */}
            <div style={{ background: (parsedPO.shipToName || parsedPO.buyerName) ? '#f0fdf4' : '#fef9f0', border: `1px solid ${(parsedPO.shipToName || parsedPO.buyerName) ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Ship To</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: (parsedPO.shipToName || parsedPO.buyerName) ? '#15803d' : '#92400e' }}>{parsedPO.shipToName || parsedPO.buyerName || 'Not detected'}</div>
              {parsedPO.shipToAddress && <div style={{ fontSize: 11, color: '#475569', marginTop: 3, whiteSpace: 'pre-line' }}>{parsedPO.shipToAddress}</div>}
            </div>
          </div>

          {parsedPO.items.length === 0 && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
              ⚠️ Could not auto-detect items from this PDF. Please enter them manually below.
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MdTableChart size={14} /> {parsedPO.items.length > 0 ? 'Line Items (auto-filled — edit if needed)' : 'Line Items — enter manually'}
            </span>
            <button onClick={() => setEditableItems(prev => [...prev, { name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, cgst: 0, sgst: 0, igst: 0, gst: 0, taxableValue: 0, lineAmount: 0 }])} style={{ padding: '4px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Row</button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#fff' }}>
                  {['#','Item Name','HSN','Qty','UOM','Unit Rate','Disc%','CGST%','CGST Val','SGST%','SGST Val','IGST%','IGST Val','Taxable Val','Tax Amt','Total Amt',''].map(h => (
                    <th key={h} style={{ padding: '8px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#cbd5e1' }}>{h}</th>
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
                  // Use PDF lineAmount as fallback when no tax % entered yet
                  const pdfLine = Number(item.lineAmount) || 0;
                  const total   = taxAmt > 0 ? +(taxable + taxAmt).toFixed(2) : (pdfLine > taxable ? pdfLine : +(taxable + taxAmt).toFixed(2));
                  const upd = (f, v) => setEditableItems(prev => prev.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
                  const inp = (f, w, type = 'text', step) => <input type={type} value={item[f]} onChange={e => upd(f, e.target.value)} step={step} min="0" style={{ width: w, padding: '4px 6px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '4px 8px', color: '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '3px 4px' }}>{inp('name', 160)}</td>
                      <td style={{ padding: '3px 4px' }}>{inp('hsn', 72)}</td>
                      <td style={{ padding: '3px 4px' }}>{inp('qty', 52, 'number', '0.001')}</td>
                      <td style={{ padding: '3px 4px' }}><select value={item.unit} onChange={e => upd('unit', e.target.value)} style={{ width: 60, padding: '4px 4px', border: '1px solid #e2e8f0', borderRadius: 5, fontSize: 11, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>{['Nos','Numbers','Pcs','Kgs','Units','EA','Sets','Ltrs','Mtrs','Boxes','Rolls','Pairs','Bags','Sheets'].map(u => <option key={u}>{u}</option>)}</select></td>
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
                      <td style={{ padding: '3px 4px' }}><button onClick={() => setEditableItems(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '3px' }}><MdClose size={15} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={8} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: 12 }}>Totals →</td>
                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#1d4ed8', fontSize: 12 }}>₹{editableItems.reduce((s, it) => {
                    const t = +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                    return s + +(t*(Number(it.cgst)||0)/100).toFixed(2);
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td />
                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#1d4ed8', fontSize: 12 }}>₹{editableItems.reduce((s, it) => {
                    const t = +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                    return s + +(t*(Number(it.sgst)||0)/100).toFixed(2);
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td />
                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#7c3aed', fontSize: 12 }}>₹{editableItems.reduce((s, it) => {
                    const t = +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                    return s + +(t*(Number(it.igst)||0)/100).toFixed(2);
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#475569', fontSize: 12 }}>₹{editableItems.reduce((s, it) => {
                    return s + +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '8px 8px', fontWeight: 700, color: '#a16207', fontSize: 12 }}>₹{editableItems.reduce((s, it) => {
                    const t = +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                    const tax = +((t*(Number(it.cgst)||0)/100)+(t*(Number(it.sgst)||0)/100)+(t*(Number(it.igst)||0)/100)).toFixed(2);
                    return s + tax;
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '8px 8px', fontWeight: 900, color: '#c0392b', fontSize: 14 }}>₹{editableItems.reduce((s, it) => {
                    const taxable = +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                    const cgstV = +(taxable*(Number(it.cgst)||0)/100).toFixed(2);
                    const sgstV = +(taxable*(Number(it.sgst)||0)/100).toFixed(2);
                    const igstV = +(taxable*(Number(it.igst)||0)/100).toFixed(2);
                    const taxAmt = cgstV + sgstV + igstV;
                    const pdfLine = Number(it.lineAmount) || 0;
                    const rowTotal = taxAmt > 0 ? +(taxable + taxAmt).toFixed(2) : (pdfLine > taxable ? pdfLine : +(taxable + taxAmt).toFixed(2));
                    return s + rowTotal;
                  }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {pdfInvoiceMsg && (
            <div style={{ background: pdfInvoiceMsg.startsWith('Error') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${pdfInvoiceMsg.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`, borderRadius: 9, padding: '11px 15px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: pdfInvoiceMsg.startsWith('Error') ? '#dc2626' : '#15803d' }}>{pdfInvoiceMsg.startsWith('Error') ? '❌' : '✅'} {pdfInvoiceMsg}</div>
              {!pdfInvoiceMsg.startsWith('Error') && <button onClick={() => navigate('/po-generator/invoice-history')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><MdHistory size={14} /> View Invoice</button>}
            </div>
          )}

          {!pdfInvoiceMsg && (
            <button onClick={handleCreateFromPDF} disabled={pdfInvoicing} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 24px', background: pdfInvoicing ? '#94a3b8' : 'linear-gradient(135deg,#c0392b,#922b21)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: pdfInvoicing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(192,57,43,0.35)' }}>
              <MdReceipt size={20} />
              {pdfInvoicing ? 'Creating Invoice...' : `Create Invoice from PDF  ·  ${editableItems.filter(it => it.name.trim()).length} item(s)  ·  ₹${editableItems.reduce((s, it) => {
                const taxable = +(Number(it.rate)*Number(it.qty)*(1-(Number(it.discount)||0)/100)).toFixed(2);
                const cgstV = +(taxable*(Number(it.cgst)||0)/100).toFixed(2);
                const sgstV = +(taxable*(Number(it.sgst)||0)/100).toFixed(2);
                const igstV = +(taxable*(Number(it.igst)||0)/100).toFixed(2);
                const taxAmt = cgstV + sgstV + igstV;
                const pdfLine = Number(it.lineAmount) || 0;
                const rowTotal = taxAmt > 0 ? +(taxable + taxAmt).toFixed(2) : (pdfLine > taxable ? pdfLine : +(taxable + taxAmt).toFixed(2));
                return s + rowTotal;
              }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
