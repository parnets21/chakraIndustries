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
  const subM = text.match(/Sub\s*Total\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i) || text.match(/Total\s+(?:Base|Taxable)\s+(?:Value|Amount)\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i)
    || text.match(/Total\s+Amount\s*\(?Without\s+Tax\)?\s*[:\-]?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (subM) result.subTotal = subM[1].replace(/,/g, '');

  // ── Pass 0: Direct flatText regex extraction ──────────────────────────────
  // For structured POs where the item table has a known column order in flatText.
  // Pattern: serial, item_name, description?, qty, uom, hsn, unit_rate,
  //          cgst_amt (cgst_pct), sgst_amt (sgst_pct), igst_amt (igst_pct), amount
  // This is more reliable than token-based parsing for PDFs where pdfjs merges lines.
  {
    const NUM = '([\\d,]+(?:\\.\\d{1,4})?)';
    const PCT = `${NUM}\\s*\\(\\s*${NUM}\\s*\\)`;  // e.g. 2,505.98 (18.0)
    const ZERO_PCT = `0\\.00\\s*\\(\\s*0\\.0\\s*\\)`;  // 0.00 (0.0)
    const UOM_PAT = '(Nos?\\.?|Numbers?|Pcs?\\.?|Kgs?\\.?|Units?|EA|Sets?|Ltrs?\\.?|Mtrs?\\.?|Boxes?|Rolls?|Pairs?|Bags?|Sheets?|MT|Ton|Tonne|Quintal|Sqft|Sqm|RMT|Mtr|Ltr|Gms?|Grams?|Dozen|Bale|Bundle|Coil|Drum|Packet|Pkt)';

    // Pattern A: CGST=0, SGST=0, IGST=value (inter-state)
    // Row: <serial> <name> <qty> <uom> <hsn> <rate> 0.00 (0.0) 0.00 (0.0) <igst_amt> (<igst_pct>) <amount>
    const patA = new RegExp(
      `(\\d{1,3})[^\\d\\n]{1,80}?` +                    // serial + name
      `(\\d{1,6}(?:\\.\\d{1,3})?)\\s+` +                // qty
      `${UOM_PAT}\\s+` +                                 // uom
      `(\\d{4,8})\\s+` +                                 // hsn
      `${NUM}\\s+` +                                     // unit rate
      `${ZERO_PCT}\\s+` +                                // cgst 0.00 (0.0)
      `${ZERO_PCT}\\s+` +                                // sgst 0.00 (0.0)
      `${PCT}\\s+` +                                     // igst_amt (igst_pct)
      `${NUM}`,                                          // line total
      'gi'
    );

    // Pattern B: CGST=value, SGST=value, IGST=0 (intra-state)
    const patB = new RegExp(
      `(\\d{1,3})[^\\d\\n]{1,80}?` +
      `(\\d{1,6}(?:\\.\\d{1,3})?)\\s+` +
      `${UOM_PAT}\\s+` +
      `(\\d{4,8})\\s+` +
      `${NUM}\\s+` +
      `${PCT}\\s+` +                                     // cgst_amt (cgst_pct)
      `${PCT}\\s+` +                                     // sgst_amt (sgst_pct)
      `${ZERO_PCT}\\s+` +                                // igst 0.00 (0.0)
      `${NUM}`,
      'gi'
    );

    const tryRegexParse = (pat, isInterState) => {
      let m;
      pat.lastIndex = 0;
      while ((m = pat.exec(text)) !== null) {
        const fullMatch = m[0];
        // Skip if this looks like a footer/summary line
        if (/total|subtotal|grand|tax\s+amount/i.test(fullMatch)) continue;

        let qty, uom, hsn, rate, igstAmt, igstPct, cgstAmt, cgstPct, sgstAmt, sgstPct, lineAmt;

        if (isInterState) {
          // Groups: 1=serial, 2=qty, 3=uom, 4=hsn, 5=rate, 6=igst_amt, 7=igst_pct, 8=line_total
          qty      = parseFloat(m[2]);
          uom      = m[3];
          hsn      = m[4];
          rate     = parseFloat(m[5].replace(/,/g, ''));
          igstAmt  = parseFloat(m[6].replace(/,/g, ''));
          igstPct  = parseFloat(m[7]);
          lineAmt  = parseFloat(m[8].replace(/,/g, ''));
          cgstAmt = 0; cgstPct = 0; sgstAmt = 0; sgstPct = 0;
        } else {
          // Groups: 1=serial, 2=qty, 3=uom, 4=hsn, 5=rate, 6=cgst_amt, 7=cgst_pct, 8=sgst_amt, 9=sgst_pct, 10=line_total
          qty      = parseFloat(m[2]);
          uom      = m[3];
          hsn      = m[4];
          rate     = parseFloat(m[5].replace(/,/g, ''));
          cgstAmt  = parseFloat(m[6].replace(/,/g, ''));
          cgstPct  = parseFloat(m[7]);
          sgstAmt  = parseFloat(m[8].replace(/,/g, ''));
          sgstPct  = parseFloat(m[9]);
          lineAmt  = parseFloat(m[10].replace(/,/g, ''));
          igstAmt = 0; igstPct = 0;
        }

        if (!qty || !rate || !lineAmt) continue;
        const taxable = +(rate * qty).toFixed(2);
        if (taxable <= 0) continue;

        // Extract item name — text between serial and qty
        const serialEnd = m[0].indexOf(m[2]);
        let rawName = m[0].slice(m[1].length, serialEnd).trim();
        rawName = rawName.replace(/\s+/g, ' ').replace(/[^\w\s\-\/\.]/g, '').trim();
        if (rawName.length < 2) rawName = 'Item';

        const item = {
          name: rawName,
          qty, unit: uom || 'Nos', hsn,
          rate, discount: 0,
          cgst: cgstPct, cgstVal: cgstAmt,
          sgst: sgstPct, sgstVal: sgstAmt,
          igst: igstPct, igstVal: igstAmt,
          gst: cgstPct + sgstPct + igstPct,
          taxableValue: taxable,
          lineAmount: lineAmt,
        };

        const key = `${item.name.toLowerCase()}|${item.qty}`;
        if (!result.items.some(x => `${x.name.toLowerCase()}|${x.qty}` === key)) {
          result.items.push(item);
          console.log('✅ Pass0 regex:', item.name, 'qty=', item.qty, 'rate=', item.rate, 'igst=', item.igst, 'igstVal=', item.igstVal);
        }
      }
    };

    tryRegexParse(patA, true);   // inter-state (IGST only)
    if (result.items.length === 0) tryRegexParse(patB, false); // intra-state (CGST+SGST)
  }

  // ── Core item extractor ───────────────────────────────────────────────────
  // Given raw tokens for one row, extract item data or return null
  const extractItem = (rawToks) => {
    // Unwrap parenthesized numbers like (18.5) → "18.5", (0.0) → "0.0"
    // These appear in some POs as tax % hints in brackets
    const toks = stripDates(rawToks).map(t => {
      const pm = String(t).match(/^\((\d+(?:\.\d+)?)\)$/);
      return pm ? pm[1] : t;
    });
    if (toks.length < 3) return null;

    // ── Pre-extract HSN early so isNumeric can exclude it from the number pool ──
    let hsnEarly = '';
    {
      const joined = toks.join(' ');
      const hsnMatch = joined.match(/\b(?:HSN|SAC)\b\s*(?:Code)?\s*[:-]?\s*(\d{4,10})/i);
      if (hsnMatch) {
        hsnEarly = hsnMatch[1];
      } else {
        for (let i = 2; i < toks.length; i++) {
          if (/^\d{4,8}$/.test(toks[i])) {
            const v = parseInt(toks[i], 10);
            if (v >= 1000 && !(v >= 1900 && v <= 2099)) {
              hsnEarly = toks[i];
              break;
            }
          }
        }
      }
    }

    const isNumeric = (t) => {
      const raw = String(t || '').trim().replace(/^[₹Rs\.INR,\s]+/i, '').replace(/,/g, '');
      if (!/^\d+(\.\d{1,4})?$/.test(raw) || parseFloat(raw) <= 0) return false;
      // Exclude standalone 4-8 digit integers that look like HSN codes
      if (/^\d{4,8}$/.test(raw)) {
        const v = parseInt(raw, 10);
        if (hsnEarly && raw === hsnEarly) return false;
        if (v >= 1000 && v <= 9999 && !/[,.]/.test(String(t || ''))) return false;
      }
      return true;
    };

    const nums = toks.map((t, i) => ({ t, i, n: toNum(t), ok: isNumeric(t) })).filter(x => x.ok);
    if (nums.length < 2) return null;

    const totalE = nums.reduce((best, x) => x.n >= best.n ? x : best, nums[nums.length - 1]);
    const lineTotal = totalE.n;

    // ── Pre-scan: detect explicit tax columns by analysing the number sequence ──
    // Strategy: work backwards from the lineTotal in the nums array.
    // In POs with explicit tax columns the tail of nums looks like:
    //   [..., taxable, cgstAmt, sgstAmt, igstAmt, lineTotal]  (intra-state)
    //   [..., taxable, igstAmt, lineTotal]                     (inter-state)
    // We also scan tokens for slab% markers to identify which tax type each amount belongs to.
    const GST_SLABS = new Set([5, 12, 18, 28, 2.5, 6, 9, 14]);
    let preCgst = 0, preSgst = 0, preIgst = 0;
    let preCgstVal = 0, preSgstVal = 0, preIgstVal = 0;

    // Collect all GST slab % tokens from the row (including unwrapped ones like 18.0)
    const slabsInRow = [];
    for (let i = 0; i < toks.length; i++) {
      const v = parseFloat(toks[i]);
      if (isFinite(v) && GST_SLABS.has(v)) slabsInRow.push({ v, i });
    }

    // Collect all positive numbers < lineTotal that could be tax amounts
    // (exclude the lineTotal itself and numbers that look like qty/rate)
    const taxCandidates = nums.filter(x =>
      x.i !== totalE.i && x.n < lineTotal && x.n > 0
    );

    // Try to match slab% tokens to nearby numeric values (within ±5 positions)
    const matchedTaxIdx = new Set();
    for (const slab of slabsInRow) {
      // Look for a numeric token within 5 positions of the slab token
      let bestMatch = null;
      for (const tc of taxCandidates) {
        if (matchedTaxIdx.has(tc.i)) continue;
        const dist = Math.abs(tc.i - slab.i);
        if (dist > 5) continue;
        // Sanity: tc.n should be roughly slab.v% of something ≤ lineTotal
        const impliedBase = tc.n / (slab.v / 100);
        if (impliedBase <= 0 || impliedBase > lineTotal * 1.1) continue;
        if (!bestMatch || dist < Math.abs(bestMatch.i - slab.i)) bestMatch = tc;
      }
      if (bestMatch) {
        matchedTaxIdx.add(bestMatch.i);
        if (!preCgst && preCgstVal === 0) { preCgst = slab.v; preCgstVal = bestMatch.n; }
        else if (!preSgst && preSgstVal === 0) { preSgst = slab.v; preSgstVal = bestMatch.n; }
        else if (!preIgst) { preIgst = slab.v; preIgstVal = bestMatch.n; }
      } else {
        // Slab found but no matching amount nearby — register as zero-value tax
        if (!preCgst && preCgstVal === 0) { preCgst = slab.v; preCgstVal = 0; }
        else if (!preSgst && preSgstVal === 0) { preSgst = slab.v; preSgstVal = 0; }
      }
    }

    // Fallback: if only one slab found with no amount matched, try the number
    // second-from-last in nums (pattern: [..., taxAmt, total])
    if (preIgst === 0 && preCgst === 0 && preSgst === 0 && slabsInRow.length === 0) {
      // No slab tokens at all — try back-calculating from lineTotal
      // (handled later in taxDiff logic)
    } else if (preIgstVal === 0 && preCgstVal === 0 && preSgstVal === 0 && slabsInRow.length > 0) {
      // Slabs found but no amounts matched — try second-to-last number
      const nonTotalNums = nums.filter(x => x.i !== totalE.i);
      if (nonTotalNums.length >= 1) {
        const lastBeforeTotal = nonTotalNums[nonTotalNums.length - 1];
        if (lastBeforeTotal.n < lineTotal * 0.5) {
          const slab = slabsInRow[slabsInRow.length - 1];
          preIgst = slab.v; preIgstVal = lastBeforeTotal.n;
          matchedTaxIdx.add(lastBeforeTotal.i);
        }
      }
    }

    const preTaxSum = preCgstVal + preSgstVal + preIgstVal;
    const preTaxable = (preTaxSum > 0 && preTaxSum < lineTotal * 0.5)
      ? +(lineTotal - preTaxSum).toFixed(2) : 0;

    // ── Qty detection ─────────────────────────────────────────────────────
    let qtyE = null;

    // Helper: is this num a known pre-scanned tax amount?
    const isPreTaxAmt = (n, idx) => {
      if (idx !== undefined && matchedTaxIdx.has(idx)) return true;
      if (preTaxSum === 0) return false;
      return (
        (preCgstVal > 0 && Math.abs(n - preCgstVal) < 0.01) ||
        (preSgstVal > 0 && Math.abs(n - preSgstVal) < 0.01) ||
        (preIgstVal > 0 && Math.abs(n - preIgstVal) < 0.01)
      );
    };

    // Strategy 0: if we have pre-scanned taxable, find qty × rate ≈ preTaxable
    if (preTaxable > 0) {
      for (let a = 0; a < nums.length && !qtyE; a++) {
        for (let b = a + 1; b < nums.length && !qtyE; b++) {
          const na = nums[a], nb = nums[b];
          if (na.i === totalE.i || nb.i === totalE.i) continue;
          if (na.i === 0 || nb.i === 0) continue;
          if (isPreTaxAmt(na.n, na.i) || isPreTaxAmt(nb.n, nb.i)) continue;
          const prod = na.n * nb.n;
          if (prod > 0 && Math.abs(prod - preTaxable) / Math.max(prod, preTaxable) < 0.03) {
            qtyE = na.n <= nb.n ? na : nb;
            break;
          }
        }
      }
    }

    // Strategy 1: find qty × rate ≈ lineTotal
    for (let a = 0; a < nums.length && !qtyE; a++) {
      for (let b = a + 1; b < nums.length && !qtyE; b++) {
        const na = nums[a], nb = nums[b];
        if (na.i === totalE.i || nb.i === totalE.i) continue;
        if (na.i === 0 || nb.i === 0) continue;
        const prod = na.n * nb.n;
        if (prod > 0 && Math.abs(prod - lineTotal) / Math.max(prod, lineTotal) < 0.03) {
          qtyE = na.n <= nb.n ? na : nb;
          break;
        }
      }
    }

    // Strategy 2: first small number after serial, not a tax amount
    if (!qtyE) {
      qtyE = nums.find(x => x.i > 0 && x.i !== totalE.i && x.n < 10000 && !isPreTaxAmt(x.n, x.i));
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

    // Unit rate: find number where rate × qty ≈ preTaxable (preferred) or lineTotal
    const rateTarget = preTaxable > 0 ? preTaxable : lineTotal;
    let rateE = nums.find(x => {
      if (x.i === 0 || x.i === totalE.i || x.i === qtyE.i) return false;
      if (isPreTaxAmt(x.n, x.i)) return false;
      const c = x.n * qty;
      return c > 0 && Math.abs(c - rateTarget) / Math.max(c, rateTarget) < 0.03;
    });
    const unitRate = rateE ? rateE.n : +(rateTarget / qty).toFixed(2);
    if (!unitRate || unitRate <= 0) return null;

    // Name = text tokens before first number after serial
    const firstNumIdx = nums.filter(x => x.i > 0).reduce((m, x) => Math.min(m, x.i), Infinity);
    let nameToks = toks.slice(1, firstNumIdx === Infinity ? toks.length : firstNumIdx).filter(t => t.trim() && !UOM_RE.test(t));
    if (!nameToks.length) nameToks = toks.filter((t, i) => i > 0 && /[A-Za-z]/.test(t) && !UOM_RE.test(t));
    let name = nameToks.join(' ').replace(/\s+/g, ' ').replace(/\s*\/?\s*\d{6,10}\s*$/, '').trim();
    if (name.length < 2) return null;

    // Use pre-scanned taxable if available, else compute from rate × qty
    const taxable = preTaxable > 0 ? preTaxable : +(unitRate * qty).toFixed(2);
    const rawPct = taxable > 0 ? (lineTotal - taxable) / taxable * 100 : 0;
    const gst = [0, 5, 12, 18, 28].reduce((p, c) => Math.abs(c - rawPct) < Math.abs(p - rawPct) ? c : p, 0);

    // Use pre-scanned tax breakdown if available
    let cgst = preCgst, sgst = preSgst, igst = preIgst;
    let cgstVal = preCgstVal, sgstVal = preSgstVal, igstVal = preIgstVal;

    const usedIdx = new Set([0, qtyE?.i, rateE?.i, totalE?.i].filter(x => x != null && x >= 0));
    const pdfLineTotal = +lineTotal.toFixed(2);
    const taxDiff = +(pdfLineTotal - taxable).toFixed(2);

    if (cgst === 0 && sgst === 0 && igst === 0) {
      // Pass A: GST % followed by matching tax amount
      for (let i = 0; i < toks.length - 1; i++) {
        if (usedIdx.has(i)) continue;
        const pctRaw = parseFloat(toks[i]);
        if (!isFinite(pctRaw) || !GST_SLABS.has(pctRaw)) continue;
        const valRaw = toNum(toks[i + 1]);
        if (valRaw <= 0) continue;
        if (taxable > 0) {
          const expected = taxable * pctRaw / 100;
          if (Math.abs(expected - valRaw) / Math.max(expected, valRaw) > 0.20) continue;
        }
        if (!cgst) { cgst = pctRaw; cgstVal = valRaw; }
        else if (!sgst) { sgst = pctRaw; sgstVal = valRaw; }
        else if (!igst) { igst = pctRaw; igstVal = valRaw; }
      }
    }

    if (cgst === 0 && sgst === 0 && igst === 0) {
      // Pass B: GST % values alone
      const slabTokens = [];
      for (let i = 0; i < toks.length; i++) {
        if (usedIdx.has(i)) continue;
        const v = parseFloat(toks[i]);
        if (isFinite(v) && GST_SLABS.has(v)) slabTokens.push({ v, i });
      }
      if (slabTokens.length >= 2 && slabTokens[0].v === slabTokens[1].v) {
        cgst = slabTokens[0].v; sgst = slabTokens[1].v;
        cgstVal = +(taxable * cgst / 100).toFixed(2);
        sgstVal = +(taxable * sgst / 100).toFixed(2);
      } else if (slabTokens.length === 1) {
        const slab = slabTokens[0].v;
        const expectedTax = taxable * slab / 100;
        const actualTax = pdfLineTotal - taxable;
        if (actualTax > 0.5 && Math.abs(expectedTax - actualTax) / Math.max(expectedTax, actualTax) < 0.10) {
          igst = slab;
          igstVal = +(taxable * igst / 100).toFixed(2);
        }
      }
    }

    if (cgst === 0 && sgst === 0 && igst === 0 && taxDiff > 0.5) {
      const rawPctCalc = taxable > 0 ? taxDiff / taxable * 100 : 0;
      const nearestSlab = [5, 12, 18, 28].find(s => Math.abs(s - rawPctCalc) < 1.5);
      if (nearestSlab) {
        cgst = nearestSlab / 2; sgst = nearestSlab / 2;
        cgstVal = +(taxable * cgst / 100).toFixed(2);
        sgstVal = +(taxable * sgst / 100).toFixed(2);
        igstVal = 0;
      }
    }

    if (cgst === 0 && sgst === 0 && igst === 0 && Math.abs(taxDiff) < 1.0) {
      const slabTokens = [];
      for (let i = 0; i < toks.length; i++) {
        if (usedIdx.has(i)) continue;
        const v = parseFloat(toks[i]);
        if (isFinite(v) && GST_SLABS.has(v) && v > 0) slabTokens.push({ v, i });
      }
      if (slabTokens.length > 0) {
        const slab = slabTokens[0].v;
        const baseRate = +(unitRate / (1 + slab / 100)).toFixed(2);
        const baseTaxable = +(baseRate * qty).toFixed(2);
        const taxFromSlab = +(baseTaxable * slab / 100).toFixed(2);
        if (Math.abs(baseTaxable + taxFromSlab - pdfLineTotal) / pdfLineTotal < 0.02) {
          if (slabTokens.length >= 2 && slabTokens[0].v === slabTokens[1].v) {
            cgst = slab; sgst = slab;
            cgstVal = +(baseTaxable * cgst / 100).toFixed(2);
            sgstVal = +(baseTaxable * sgst / 100).toFixed(2);
          } else {
            igst = slab;
            igstVal = +(baseTaxable * igst / 100).toFixed(2);
          }
          let hsn = hsnEarly || '';
          if (!hsn) {
            const hsnL = toks.join(' ').match(/\b(?:HSN|SAC)\b\s*(?:Code)?\s*[:-]?\s*(\d{4,10})/i);
            if (hsnL) hsn = hsnL[1];
            else { const sl = toks.join(' ').match(/\/\s*(\d{6,10})(?=\s|$)/); if (sl) hsn = sl[1]; }
            if (!hsn) { const st = toks.find((t, i) => i > 0 && /^\d{6,10}$/.test(t) && !isPrice(t) && t !== String(qtyE.n)); if (st) hsn = st; }
          }
          return {
            name, qty, unit: toks.find(t => UOM_RE.test(t)) || 'Nos',
            rate: baseRate, gst: slab,
            cgst, cgstVal, sgst, sgstVal, igst, igstVal,
            discount: 0, taxableValue: baseTaxable, lineAmount: pdfLineTotal, hsn,
          };
        }
      }
    }

    // HSN — use pre-extracted value, or fall back to token scan
    let hsn = hsnEarly || '';
    if (!hsn) {
      const hsnL = toks.join(' ').match(/\b(?:HSN|SAC)\b\s*(?:Code)?\s*[:-]?\s*(\d{4,10})/i);
      if (hsnL) hsn = hsnL[1];
      else { const sl = toks.join(' ').match(/\/\s*(\d{6,10})(?=\s|$)/); if (sl) hsn = sl[1]; }
      if (!hsn) { const st = toks.find((t, i) => i > 0 && /^\d{6,10}$/.test(t) && !isPrice(t) && t !== String(qtyE.n)); if (st) hsn = st; }
    }

    const finalGstPct = cgst + sgst + igst || gst;
    return {
      name, qty, unit: toks.find(t => UOM_RE.test(t)) || 'Nos',
      rate: +unitRate.toFixed(2), gst: finalGstPct,
      cgst, cgstVal, sgst, sgstVal, igst, igstVal,
      discount: 0, taxableValue: taxable, lineAmount: pdfLineTotal, hsn,
    };
  };

  const seen = new Set();
  const addItem = (item) => {
    if (!item || item.name.length < 2) return false;
    // Reject if the item's line total matches the document grand total — it's a footer row
    if (result.total && Math.abs(item.lineAmount - parseFloat(result.total)) < 1) return false;
    // Reject if the item's taxable value matches the document subtotal — it's a summary row
    if (result.subTotal && Math.abs(item.taxableValue - parseFloat(result.subTotal)) < 1) return false;
    const key = `${item.name.toLowerCase()}|${item.qty}`;
    if (seen.has(key)) return false;
    seen.add(key); result.items.push(item); return true;
  };

  // ── Pass 1: scan every line ───────────────────────────────────────────────
  // Lines that are always headers/footers — skip even if they contain numbers
  const HDRLINE = /^(sl\.?\s*no\.?|s\.?\s*no\.?|sr\.?\s*no\.?|item\s*(name|description|code)|qty\.?|quantity|uom|unit\s*(price|rate)?|base\s*price|cgst|sgst|igst|gst\s*%?|amount|total\s*amount|tax\s*amount|discount|hsn\s*(code)?|sac\s*(code)?|taxable|page\s*\d|terms|dear\s+sir|we\s+hereby|vendor\s*(name|no)|billing\s*address|shipping\s*address|contact\s*(person|no)|gstin\s*[:\-]|pan\s*(no|number)|cin\s*(no|number)|ifsc|bank\s*(name|account)|payment\s*terms?|warranty|delivery\s*(date|address)|purchase\s*order\s*(no|date|number)|po\s*(no|date|number)|authorized\s*signatory|e\s*&\s*oe)/i;

  // Footer/summary lines — skip even when they contain prices
  const SKIPLINE = /(?:total\s+amount\s*(?:without|with|incl|excl)?|grand\s+total|sub\s*total|net\s+amount|amount\s+payable|total\s+tax|tax\s+amount|amount\s+in\s+words|taxable\s+value|total\s+value|invoice\s+total|order\s+total|balance\s+due|total\s+due|round\s+off|freight|shipping\s+charge|handling|packing|other\s+charge|terms\s+of\s+payment|gross\s+amount|total\s+without\s+tax|without\s+tax|total\s+igst|total\s+cgst|total\s+sgst)/i;

  for (const line of lines) {
    const rawToks = line.tokens.map(t => t.str);
    const toks = stripDates(rawToks);
    const ls = toks.join(' ');
    if (ls.length < 5) continue;
    if (SKIPLINE.test(ls)) continue;
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