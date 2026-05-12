import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../../components/common/Modal';
import { invoiceApi } from '../../api/invoiceApi';
import { toast } from '../../components/common/Toast';
import { MdUpload, MdDownload, MdPrint, MdDelete, MdDeleteSweep, MdVisibility, MdWarning, MdCheckCircle, MdError, MdShare, MdContentCopy } from 'react-icons/md';
import { FaWhatsapp, FaEnvelope } from 'react-icons/fa';
import { CHAKRA_LOGO_B64 } from '../../assets/chakraLogoB64';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Design tokens
const RED = '#c0392b';
const RED_LIGHT = '#ef4444';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const TEXT_DARK = '#0f172a';
const TEXT_MID = '#475569';
const TEXT_LIGHT = '#94a3b8';

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 10,
  background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
  color: '#fff', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
};

const btnOutline = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 10,
  background: 'transparent', color: RED,
  border: `1.5px solid ${RED}`, cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
};

export default function InvoiceGeneratorPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showView, setShowView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [uploadPreviewData, setUploadPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  // Pagination
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchAll = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        invoiceApi.getAll({ page: p, limit: PAGE_SIZE }),
        invoiceApi.getStats(),
      ]);
      setInvoices(listRes.data || []);
      setTotalCount(listRes.total || 0);
      setStats(statsRes.data || {});
    } catch (e) {
      console.error(e);
      toast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(page); }, [fetchAll, page]);

  // Close share dropdown when clicking outside
  useEffect(() => {
    const close = () => setShareMenuInv(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  // ── Parse Orders Excel (the BI/vendor orders format) ─────────────────────
  // Each row in the Excel = one invoice (one order line to one customer).
  // UniqueId is the unique order identifier per row.
  const parseOrdersExcel = (rows) => {
    const valid = [];
    const errors = [];

    // Normalize a row's keys — trim whitespace, handle case variations
    // Also build a case-insensitive lookup helper
    const getField = (row, ...keys) => {
      for (const k of keys) {
        // exact match first
        if (row[k] !== undefined && row[k] !== '') return String(row[k]);
        // case-insensitive match
        const lower = k.toLowerCase();
        const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === lower);
        if (found !== undefined && row[found] !== '') return String(row[found]);
      }
      return '';
    };

    // Helper: parse date from Excel serial number or string
    const parseDateField = (val) => {
      if (!val && val !== 0) return new Date().toISOString().split('T')[0];
      if (typeof val === 'number') {
        try {
          const d = XLSX.SSF.parse_date_code(val);
          return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        } catch { return new Date().toISOString().split('T')[0]; }
      }
      const s = String(val).trim();
      if (!s) return new Date().toISOString().split('T')[0];
      // MM/DD/YYYY
      const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m1) return `${m1[3]}-${m1[1].padStart(2,'0')}-${m1[2].padStart(2,'0')}`;
      // DD-MM-YYYY
      const m2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
      return s;
    };

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;

      const uniqueId    = getField(row, 'UniqueId', 'UniqueID', 'Unique Id', 'UNIQUEID').trim();
      const po          = getField(row, 'PurchaseOrder', 'Purchase Order', 'PO', 'PURCHASEORDER').trim();
      const productDesc = getField(row, 'ProductDescription', 'Product Description', 'PRODUCTDESCRIPTION').trim();
      const productCode = getField(row, 'ProductCode', 'Product Code', 'BIPartNumber', 'BI Part Number', 'PRODUCTCODE').trim();
      const shipToName  = getField(row, 'ShipToName', 'Ship To Name', 'SHIPTONAME').trim();

      // Validation
      if (!uniqueId && !po) {
        errors.push({ row: rowNum, field: 'UniqueId', message: 'Missing UniqueId and PurchaseOrder' });
        return;
      }
      if (!shipToName) {
        errors.push({ row: rowNum, field: 'ShipToName', message: `Row ${rowNum}: Missing ShipToName` });
        return;
      }
      if (!productDesc && !productCode) {
        errors.push({ row: rowNum, field: 'ProductDescription', message: `Row ${rowNum}: Missing product description` });
        return;
      }

      // Build full address
      const addrParts = [
        getField(row, 'ShipToAddress1', 'Ship To Address1'),
        getField(row, 'ShipToAddress2', 'Ship To Address2'),
        getField(row, 'ShipToAddress3', 'Ship To Address3'),
        getField(row, 'ShipToAddress4', 'Ship To Address4'),
        getField(row, 'City'),
        getField(row, 'State'),
        getField(row, 'Postal'),
        getField(row, 'Country'),
      ].map(v => v.trim()).filter(Boolean);
      const address = addrParts.join(', ');

      // Phone/email — handle "(D)xxx (E)xxx" format
      const rawPhone = getField(row, 'Phone').trim();
      const phoneMatch = rawPhone.match(/\(D\)([^\s(]+)/);
      const emailMatch = rawPhone.match(/\(E\)([^\s(]+)/);
      const phone = phoneMatch
        ? phoneMatch[1].replace(/\//g, '')
        : rawPhone.replace(/[^0-9+]/g, '').slice(0, 15);
      const emailFromPhone = emailMatch ? emailMatch[1] : '';
      const email = (getField(row, 'Email') || emailFromPhone).trim();

      const qty  = parseFloat(getField(row, 'Quantity', 'Qty') || '1') || 1;
      const rate = parseFloat(getField(row, 'UnitPrice', 'Unit Price', 'Rate') || '0') || 0;

      valid.push({
        partyName:    shipToName,
        partyAddress: address,
        partyGST:     '',
        partyEmail:   email,
        partyPhone:   phone,
        // Individual address parts
        partyCity:    getField(row, 'City').trim(),
        partyState:   getField(row, 'State').trim(),
        partyPostal:  getField(row, 'Postal').trim(),
        partyCountry: getField(row, 'Country').trim(),

        invoiceDate: parseDateField(getField(row, 'PODate', 'PO Date', 'InvoiceDate', 'Invoice Date') || ''),
        dueDate:     '',

        // ALL Excel columns
        uniqueId:            getField(row, 'UniqueId', 'UniqueID', 'Unique Id').trim(),
        purchaseOrderRef:    getField(row, 'PurchaseOrder', 'Purchase Order', 'PO').trim(),
        poDate:              getField(row, 'PODate', 'PO Date').trim(),
        lineNbr:             getField(row, 'LineNbr', 'Line Nbr', 'LineNumber').trim(),
        biPartNumber:        getField(row, 'BIPartNumber', 'BI Part Number').trim(),
        vendorCode:          getField(row, 'VendorCode', 'Vendor Code').trim(),
        programNumber:       getField(row, 'ProgramNumber', 'Program Number').trim(),
        accountNumber:       getField(row, 'AccountNumber', 'Account Number').trim(),
        brandName:           getField(row, 'BrandName', 'Brand Name').trim(),
        orderStatus:         getField(row, 'OrderStatus', 'Order Status').trim(),
        biwpo:               getField(row, 'BIWPO').trim(),
        dispatchDate:        getField(row, 'DispatchDate', 'Dispatch Date').trim(),
        awb:                 getField(row, 'AWB').trim(),
        courierName:         getField(row, 'CourierName', 'Courier Name').trim(),
        vendorInvoiceNumber: getField(row, 'VendorInvoiceNumber', 'Vendor Invoice Number', 'VendorInvoiceNo').trim(),
        poValue:             parseFloat(getField(row, 'PoValue', 'PO Value') || '0') || 0,
        totalQuantity:       parseFloat(getField(row, 'TotalQuantity', 'Total Quantity') || '0') || 0,
        totalPoValue:        parseFloat(getField(row, 'TotalPoValue', 'Total PO Value') || '0') || 0,
        courierValue:        parseFloat(getField(row, 'CourierValue', 'Courier Value') || '0') || 0,
        totalCourier:        parseFloat(getField(row, 'TotalCourier', 'Total Courier') || '0') || 0,
        deliveryDate:        getField(row, 'DeliveryDate', 'Delivery Date').trim(),
        weightKg:            parseFloat(getField(row, 'Weight (in Kg)', 'WeightKg', 'Weight') || '0') || 0,
        modeOfTransport:     getField(row, 'Mode of Transportation', 'ModeOfTransportation', 'Mode').trim(),
        lbh:                 getField(row, 'LBH').trim(),
        totalFaceValue:      parseFloat(getField(row, 'TotalFaceValue', 'Total Face Value') || '0') || 0,
        podSharedLink:       getField(row, 'PodSharedLink', 'POD Shared Link', 'Pod Shared Link').trim(),

        notes: getField(row, 'Comments').trim(),
        terms: 'Payment due within 30 days.',

        items: [{
          description: productDesc || productCode,
          hsn:         productCode,
          qty,
          unit:        getField(row, 'UOM', 'Unit').trim() || 'EA',
          rate,
          discount:    0,
          taxRate:     0,
        }],
      });
    });

    return { valid, errors };
  };

  // ── Excel Upload Handler ──────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: false });

      // Find the "Orders" sheet or fall back to first sheet
      const sheetName = workbook.SheetNames.find(n => /orders/i.test(n)) || workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Read as raw arrays to find the real header row (handles blank first column)
      const rawArrays = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (!rawArrays.length) {
        toast('Excel file is empty or unreadable', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Find the header row — it's the first row that contains known column names
      const knownCols = ['uniqueid','purchaseorder','shiptoname','productdescription','vendorcode','bipartnumber'];
      let headerRowIdx = 0;
      for (let i = 0; i < Math.min(5, rawArrays.length); i++) {
        const rowLower = rawArrays[i].map(c => String(c).trim().toLowerCase());
        if (knownCols.some(k => rowLower.includes(k))) {
          headerRowIdx = i;
          break;
        }
      }

      // Build header map: colIndex -> trimmed header name
      const headers = rawArrays[headerRowIdx].map(h => String(h).trim());
      console.log('[Invoice Upload] Sheet:', sheetName, '| Header row:', headerRowIdx);
      console.log('[Invoice Upload] Headers:', headers);

      // Convert data rows to objects using our clean headers
      const rows = [];
      for (let i = headerRowIdx + 1; i < rawArrays.length; i++) {
        const arr = rawArrays[i];
        // Skip completely empty rows
        if (arr.every(c => c === '' || c === null || c === undefined)) continue;
        const obj = {};
        headers.forEach((h, idx) => {
          if (h) obj[h] = arr[idx] !== undefined ? arr[idx] : '';
        });
        rows.push(obj);
      }

      console.log('[Invoice Upload] Data rows:', rows.length);
      if (rows.length > 0) console.log('[Invoice Upload] First data row:', rows[0]);

      if (!rows.length) {
        toast('No data rows found in Excel', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Detect format: Orders format has known order columns
      const firstRow = rows[0];
      const allKeys = Object.keys(firstRow).map(k => k.toLowerCase());
      const isOrdersFormat = allKeys.some(k => ['purchaseorder','uniqueid','shiptoname','bipartnumber','productdescription'].includes(k));

      let parsed;
      if (isOrdersFormat) {
        parsed = parseOrdersExcel(rows);
      } else {
        // Legacy generic format
        const invoicesToCreate = [];
        let currentInvoice = null;
        rows.forEach(row => {
          if (row.PartyName && row.PartyName !== currentInvoice?.partyName) {
            if (currentInvoice) invoicesToCreate.push(currentInvoice);
            currentInvoice = {
              partyName: row.PartyName || '',
              partyAddress: row.PartyAddress || '',
              partyGST: row.PartyGST || '',
              partyEmail: row.PartyEmail || '',
              partyPhone: row.PartyPhone || '',
              invoiceDate: row.InvoiceDate || new Date().toISOString().split('T')[0],
              dueDate: row.DueDate || '',
              items: [],
              notes: row.Notes || '',
              terms: row.Terms || 'Payment due within 30 days.',
            };
          }
          if (currentInvoice && row.ItemDescription) {
            currentInvoice.items.push({
              description: row.ItemDescription || '',
              hsn: row.HSN || '',
              qty: parseFloat(row.Qty) || 1,
              unit: row.Unit || 'Nos',
              rate: parseFloat(row.Rate) || 0,
              discount: parseFloat(row.Discount) || 0,
              taxRate: parseFloat(row.TaxRate) || 18,
            });
          }
        });
        if (currentInvoice) invoicesToCreate.push(currentInvoice);
        parsed = { valid: invoicesToCreate, errors: [] };
      }

      if (!parsed.valid.length && !parsed.errors.length) {
        toast('No data found in Excel', 'warning');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Show preview/validation modal before submitting
      setUploadPreviewData(parsed);
      setShowUploadPreview(true);
    } catch (e) {
      console.error(e);
      toast(e.message || 'Failed to read Excel file', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Confirm Upload after preview ─────────────────────────────────────────
  const handleConfirmUpload = async () => {
    if (!uploadPreviewData?.valid?.length) return;
    setUploading(true);
    try {
      const res = await invoiceApi.bulkUpload({ invoices: uploadPreviewData.valid });
      toast(`${res.data.created} invoice${res.data.created !== 1 ? 's' : ''} created successfully`);
      if (res.data.errors?.length) {
        toast(`${res.data.errors.length} rows had server-side errors`, 'warning');
      }
      setShowUploadPreview(false);
      setUploadPreviewData(null);
      setPage(1);
      await fetchAll(1);
    } catch (e) {
      console.error(e);
      toast(e.message || 'Failed to upload invoices', 'error');
    } finally {
      setUploading(false);
    }
  };

  // ── Print/Download Invoice ────────────────────────────────────────────────
  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateInvoiceHTML(invoice));
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = async (invoice) => {
    toast('Generating PDF…', 'info');
    try {
      await generateInvoicePDF(invoice);
      toast(`Invoice ${invoice.invoiceNo}.pdf downloaded`);
    } catch (err) {
      console.error(err);
      // Fallback to HTML download
      const html = generateInvoiceHTML(invoice);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNo}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Invoice downloaded as HTML (PDF failed)', 'warning');
    }
  };

  const generateInvoiceHTML = (inv) => {
    const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }); } catch { return d || '—'; } };
    const fmtAmt  = (n) => `₹ ${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtNum  = (n) => (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Compute per-item tax breakdown for HSN summary table
    const hsnMap = {};
    (inv.items || []).forEach(item => {
      const key = item.hsn || '—';
      const taxableAmt = (item.qty || 0) * (item.rate || 0) * (1 - (item.discount || 0) / 100);
      const cgstRate   = (item.taxRate || 0) / 2;
      const sgstRate   = (item.taxRate || 0) / 2;
      const cgstAmt    = taxableAmt * cgstRate / 100;
      const sgstAmt    = taxableAmt * sgstRate / 100;
      if (!hsnMap[key]) hsnMap[key] = { taxable: 0, cgstRate, sgstRate, cgst: 0, sgst: 0 };
      hsnMap[key].taxable += taxableAmt;
      hsnMap[key].cgst    += cgstAmt;
      hsnMap[key].sgst    += sgstAmt;
    });
    const hsnRows = Object.entries(hsnMap);
    const totalTaxable = hsnRows.reduce((s, [, v]) => s + v.taxable, 0);
    const totalCGST    = hsnRows.reduce((s, [, v]) => s + v.cgst, 0);
    const totalSGST    = hsnRows.reduce((s, [, v]) => s + v.sgst, 0);
    const totalTax     = totalCGST + totalSGST;

    // Amount in words
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const toWords = (n) => {
      n = Math.round(n);
      if (n === 0) return 'Zero';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
      if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + toWords(n%100) : '');
      if (n < 100000) return toWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + toWords(n%1000) : '');
      if (n < 10000000) return toWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + toWords(n%100000) : '');
      return toWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + toWords(n%10000000) : '');
    };
    const grand = Number(inv.grandTotal) || 0;
    const rupees = Math.floor(grand);
    const paise  = Math.round((grand - rupees) * 100);
    const amtWords = toWords(rupees) + ' Rupees' + (paise > 0 ? ' and ' + toWords(paise) + ' Paise' : ' Only');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${inv.invoiceNo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; color: #111; font-size: 12px; }
  .page { max-width: 820px; margin: 0 auto; padding: 24px 28px; border: 1px solid #ccc; }

  /* ── Top label ── */
  .top-label { text-align: right; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 10px; }
  .top-label span { border: 1px solid #999; padding: 2px 10px; font-size: 10px; margin-left: 8px; }

  /* ── Header ── */
  .header { display: flex; align-items: flex-start; gap: 14px; padding-bottom: 14px; border-bottom: 2px solid #111; margin-bottom: 0; }
  .logo-wrap { flex-shrink: 0; }
  .logo-wrap img { width: 64px; height: 64px; object-fit: contain; border-radius: 6px; }
  .company-info { flex: 1; }
  .company-name { font-size: 18px; font-weight: 900; color: #111; }
  .company-detail { font-size: 11px; color: #333; line-height: 1.6; margin-top: 3px; }
  .inv-box { text-align: right; min-width: 200px; }
  .inv-box table { margin-left: auto; border-collapse: collapse; }
  .inv-box td { padding: 2px 6px; font-size: 12px; }
  .inv-box td:first-child { font-weight: 700; text-align: right; }
  .inv-box td:last-child { font-weight: 400; text-align: left; }

  /* ── Bill/Ship grid ── */
  .party-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ccc; border-top: none; }
  .party-cell { padding: 10px 12px; }
  .party-cell + .party-cell { border-left: 1px solid #ccc; }
  .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 4px; }
  .party-name { font-size: 13px; font-weight: 800; color: #111; margin-bottom: 3px; }
  .party-line { font-size: 11px; color: #333; line-height: 1.55; }

  /* ── Items table ── */
  .items-wrap { border: 1px solid #ccc; border-top: none; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { background: #f0f0f0; padding: 7px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ccc; text-align: left; }
  .items-table th.r { text-align: right; }
  .items-table td { padding: 7px 10px; font-size: 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  .items-table td.r { text-align: right; }
  .items-table td.mono { font-family: monospace; font-size: 11px; }
  .items-table tbody tr:last-child td { border-bottom: none; }
  .tax-row td { background: #fafafa; font-size: 11px; color: #444; border-bottom: 1px solid #eee; }
  .total-row td { font-weight: 800; font-size: 13px; background: #f5f5f5; border-top: 2px solid #ccc; }

  /* ── HSN summary ── */
  .hsn-wrap { border: 1px solid #ccc; border-top: none; }
  .hsn-table { width: 100%; border-collapse: collapse; }
  .hsn-table th { background: #f0f0f0; padding: 6px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #ccc; text-align: left; }
  .hsn-table th.r { text-align: right; }
  .hsn-table td { padding: 6px 10px; font-size: 11px; border-bottom: 1px solid #eee; }
  .hsn-table td.r { text-align: right; }
  .hsn-table .total-row td { font-weight: 700; background: #f5f5f5; border-top: 1px solid #ccc; border-bottom: none; }

  /* ── Amount in words ── */
  .amt-words { border: 1px solid #ccc; border-top: none; padding: 8px 12px; font-size: 11px; }
  .amt-words strong { font-size: 11px; }

  /* ── Footer grid ── */
  .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #ccc; border-top: none; }
  .footer-cell { padding: 10px 12px; }
  .footer-cell + .footer-cell { border-left: 1px solid #ccc; }
  .footer-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 6px; }
  .footer-line { font-size: 11px; color: #333; line-height: 1.6; }
  .footer-line strong { font-weight: 700; }

  /* ── Sig ── */
  .sig-cell { text-align: right; display: flex; flex-direction: column; justify-content: space-between; }
  .sig-line { border-top: 1px solid #999; margin-top: 36px; padding-top: 5px; font-size: 11px; color: #555; text-align: center; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { border: none; padding: 10px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- TAX INVOICE label -->
  <div class="top-label">TAX INVOICE <span>ORIGINAL</span></div>

  <!-- Company Header -->
  <div class="header">
    <div class="logo-wrap">
      <img src="${CHAKRA_LOGO_B64}" alt="Chakra Industries" />
    </div>
    <div class="company-info">
      <div class="company-name">Chakra Industries</div>
      <div class="company-detail">
        ${inv.companyAddress || 'B-47, Industrial Area, Phase-2, Peenya, Bengaluru, Karnataka, 560058'}<br/>
        ${inv.companyGST ? `GSTIN: ${inv.companyGST}` : 'GSTIN: 29AABCC1234D1ZK'}&nbsp;&nbsp;&nbsp;
        PAN Number: AABCC1234D
      </div>
    </div>
    <div class="inv-box">
      <table>
        <tr><td>Invoice No.</td><td>${inv.invoiceNo}</td></tr>
        <tr><td>Invoice Date</td><td>${fmtDate(inv.invoiceDate)}</td></tr>
        <tr><td>Due Date</td><td>${inv.dueDate ? fmtDate(inv.dueDate) : fmtDate(inv.invoiceDate)}</td></tr>
        ${inv.purchaseOrderRef ? `<tr><td>PO No.</td><td>${inv.purchaseOrderRef}</td></tr>` : ''}
      </table>
    </div>
  </div>

  <!-- Bill To / Ship To -->
  <div class="party-grid">
    <div class="party-cell">
      <div class="party-label">Bill To</div>
      <div class="party-name">${inv.partyName}</div>
      <div class="party-line">
        ${inv.partyAddress ? `Address: ${inv.partyAddress}<br/>` : ''}
        ${inv.partyGST ? `GSTIN: ${inv.partyGST}&nbsp;&nbsp;&nbsp;Place of Supply: ${inv.partyState || 'Karnataka'}<br/>` : ''}
        ${inv.partyPhone ? `Mobile: ${inv.partyPhone}&nbsp;&nbsp;&nbsp;` : ''}
        ${inv.partyGST ? `PAN Number: ${inv.partyGST.substring(2,12)}` : ''}
      </div>
    </div>
    <div class="party-cell">
      <div class="party-label">Ship To</div>
      <div class="party-name">${inv.partyName}</div>
      <div class="party-line">
        ${inv.partyAddress ? `Address: ${inv.partyAddress}` : ''}
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <div class="items-wrap">
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:36px">S.NO.</th>
          <th>ITEMS</th>
          <th>HSN</th>
          <th class="r">QTY.</th>
          <th class="r">RATE</th>
          <th class="r">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${(inv.items || []).map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.description || '—'}</td>
          <td class="mono">${item.hsn || '—'}</td>
          <td class="r">${item.qty} ${item.unit || 'PCS'}</td>
          <td class="r">${fmtNum(item.rate)}</td>
          <td class="r">${fmtNum(item.total || item.amount || (item.qty * item.rate))}</td>
        </tr>`).join('')}

        <!-- Tax rows -->
        ${totalCGST > 0 ? `
        <tr class="tax-row">
          <td colspan="5" style="text-align:right;padding-right:12px;">CGST @${hsnRows[0]?.[1]?.cgstRate || 0}%</td>
          <td class="r">₹ ${fmtNum(totalCGST)}</td>
        </tr>
        <tr class="tax-row">
          <td colspan="5" style="text-align:right;padding-right:12px;">SGST @${hsnRows[0]?.[1]?.sgstRate || 0}%</td>
          <td class="r">₹ ${fmtNum(totalSGST)}</td>
        </tr>` : ''}

        <!-- Total row -->
        <tr class="total-row">
          <td colspan="3" style="text-align:right;font-weight:800;">TOTAL</td>
          <td class="r">${(inv.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0)}</td>
          <td></td>
          <td class="r">₹ ${fmtNum(grand)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- HSN/SAC Tax Summary -->
  <div class="hsn-wrap">
    <table class="hsn-table">
      <thead>
        <tr>
          <th>HSN/SAC</th>
          <th class="r">Taxable Value</th>
          <th class="r">CGST Rate</th>
          <th class="r">CGST Amount</th>
          <th class="r">SGST Rate</th>
          <th class="r">SGST Amount</th>
          <th class="r">Total Tax Amount</th>
        </tr>
      </thead>
      <tbody>
        ${hsnRows.map(([hsn, v]) => `
        <tr>
          <td>${hsn}</td>
          <td class="r">${fmtNum(v.taxable)}</td>
          <td class="r">${v.cgstRate}%</td>
          <td class="r">${fmtNum(v.cgst)}</td>
          <td class="r">${v.sgstRate}%</td>
          <td class="r">${fmtNum(v.sgst)}</td>
          <td class="r">₹ ${fmtNum(v.cgst + v.sgst)}</td>
        </tr>`).join('')}
        <tr class="total-row">
          <td><strong>Total</strong></td>
          <td class="r">${fmtNum(totalTaxable)}</td>
          <td></td>
          <td class="r">${fmtNum(totalCGST)}</td>
          <td></td>
          <td class="r">${fmtNum(totalSGST)}</td>
          <td class="r"><strong>₹ ${fmtNum(totalTax)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Amount in Words -->
  <div class="amt-words">
    <strong>Total Amount (in words)</strong><br/>
    ${amtWords}
  </div>

  <!-- Footer: Bank Details | Terms | Signature -->
  <div class="footer-grid">
    <div class="footer-cell">
      <div class="footer-label">Bank Details</div>
      <div class="footer-line">
        <strong>Name:</strong> Chakra Industries Pvt. Ltd.<br/>
        <strong>IFSC Code:</strong> ${inv.bankIfsc || 'HDFC0002847'}<br/>
        <strong>Account No:</strong> ${inv.bankAccount || '50200081374926'}<br/>
        <strong>Bank:</strong> ${inv.bankName || 'HDFC Bank, Peenya Branch, Bengaluru'}
      </div>
    </div>
    <div class="footer-cell">
      <div class="footer-label">Terms and Conditions</div>
      <div class="footer-line">
        1. Goods once sold will not be taken back or exchanged<br/>
        2. All disputes are subject to Bangalore jurisdiction only<br/>
        3. This is computer generated invoice &amp; doesn't require any signature.
      </div>
    </div>
    <div class="footer-cell sig-cell">
      <div>
        <div class="footer-label">For Chakra Industries</div>
      </div>
      <div class="sig-line">Authorised Signatory</div>
    </div>
  </div>

</div>
</body>
</html>`.trim();
  };

  const handleStatusChange = async (id, status) => {
    try {
      await invoiceApi.updateStatus(id, status);
      toast('Status updated');
      await fetchAll(page);
    } catch (e) {
      toast(e.message || 'Failed to update status', 'error');
    }
  };

  // ── Delete All Invoices ───────────────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!window.confirm(`This will permanently delete all ${totalCount} invoices. This cannot be undone. Continue?`)) return;
    try {
      const res = await invoiceApi.deleteAll();
      toast(`${res.deleted} invoices deleted`);
      setPage(1);
      await fetchAll(1);
    } catch (e) {
      toast(e.message || 'Failed to delete all invoices', 'error');
    }
  };

  // ── Delete Invoice ────────────────────────────────────────────────────────
  const handleDelete = async (id, invoiceNo) => {
    if (!window.confirm(`Delete invoice ${invoiceNo}?`)) return;
    try {
      await invoiceApi.delete(id);
      toast('Invoice deleted');
      // If we deleted the last item on this page, go back one page
      const newPage = invoices.length === 1 && page > 1 ? page - 1 : page;
      setPage(newPage);
      await fetchAll(newPage);
    } catch (e) {
      toast(e.message || 'Failed to delete', 'error');
    }
  };

  // ── Share Invoice ─────────────────────────────────────────────────────────
  const [shareMenuInv, setShareMenuInv] = useState(null); // invoice being shared

  const handleShare = (inv) => {
    // Always show our custom dropdown (WhatsApp, Gmail, Copy)
    setShareMenuInv(shareMenuInv?._id === inv._id ? null : inv);
  };

  const shareViaWhatsApp = (inv) => {
    const text = encodeURIComponent(
      `Invoice ${inv.invoiceNo} | ${inv.partyName} | Order: ${inv.purchaseOrderRef || '—'} | Product: ${inv.items?.[0]?.description || '—'} | Qty: ${inv.items?.[0]?.qty || '—'} | Status: ${inv.orderStatus || inv.status} — Chakra Industries`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShareMenuInv(null);
  };

  // ── Core PDF renderer — returns jsPDF object, never downloads ────────────
  const renderInvoiceToPDF = async (inv) => {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;width:860px;background:#fff;z-index:-1;';
    container.innerHTML = generateInvoiceHTML(inv);
    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const imgH    = (canvas.height * pageW) / canvas.width;
      let yPos = 0, remaining = imgH;
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, -yPos, pageW, imgH);
        remaining -= pageH; yPos += pageH;
        if (remaining > 0) pdf.addPage();
      }
      return pdf;
    } finally {
      document.body.removeChild(container);
    }
  };

  // ── Download button — explicitly saves the PDF ────────────────────────────
  const generateInvoicePDF = async (inv) => {
    const pdf = await renderInvoiceToPDF(inv);
    pdf.save(`${inv.invoiceNo}.pdf`);
  };

  // ── Gmail — opens Gmail compose with professional body (original approach) ─
  const shareViaGmail = async (inv) => {
    setShareMenuInv(null);

    const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d || ''; } };
    const fmtAmt  = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    const item    = inv.items?.[0] || {};

    // Step 1 — silently generate & download the PDF
    const filename = `${inv.invoiceNo}.pdf`;
    try {
      const pdf = await renderInvoiceToPDF(inv);
      pdf.save(filename);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }

    // Step 2 — build professional email body
    const lines = [
      `Dear ${inv.partyName},`,
      ``,
      `Greetings from Chakra Industries!`,
      ``,
      `Please find the invoice PDF (${filename}) attached to this email for your records.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  INVOICE DETAILS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  Invoice No.    : ${inv.invoiceNo}`,
      `  Invoice Date   : ${fmtDate(inv.invoiceDate)}`,
      inv.purchaseOrderRef ? `  Purchase Order : ${inv.purchaseOrderRef}` : null,
      inv.poDate           ? `  PO Date        : ${inv.poDate}` : null,
      inv.uniqueId         ? `  Unique ID      : ${inv.uniqueId}` : null,
      inv.vendorCode       ? `  Vendor Code    : ${inv.vendorCode}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  PRODUCT DETAILS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      item.description     ? `  Product        : ${item.description}` : null,
      item.hsn             ? `  Product Code   : ${item.hsn}` : null,
      inv.brandName        ? `  Brand          : ${inv.brandName}` : null,
      item.qty != null     ? `  Quantity       : ${item.qty} ${item.unit || ''}`.trim() : null,
      inv.grandTotal       ? `  Grand Total    : ${fmtAmt(inv.grandTotal)}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `  SHIPMENT DETAILS`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      inv.orderStatus      ? `  Order Status   : ${inv.orderStatus}` : null,
      inv.dispatchDate     ? `  Dispatch Date  : ${inv.dispatchDate}` : null,
      inv.awb              ? `  AWB No.        : ${inv.awb}` : null,
      inv.courierName      ? `  Courier        : ${inv.courierName}` : null,
      inv.deliveryDate     ? `  Delivery Date  : ${inv.deliveryDate}` : null,
      inv.podSharedLink    ? `  POD Link       : ${inv.podSharedLink}` : null,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `Kindly review and confirm receipt. For any queries, please reply to this email.`,
      ``,
      `Terms: ${inv.terms || 'Payment due within 30 days.'}`,
      ``,
      `Warm regards,`,
      `Chakra Industries`,
      `ERP & Operations Team`,
    ].filter(l => l !== null).join('\n');

    // Step 3 — open Gmail compose (pre-filled)
    const to      = inv.partyEmail ? encodeURIComponent(inv.partyEmail) : '';
    const subject = encodeURIComponent(`Invoice ${inv.invoiceNo} from Chakra Industries — ${inv.partyName}`);
    const body    = encodeURIComponent(lines);
    window.open(
      `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`,
      '_blank'
    );

    // Step 4 — guide the user
    toast(`📎 ${filename} downloaded — Gmail is open. Click the paperclip icon in Gmail to attach it.`, 'success');
  };

  const shareViaCopy = (inv) => {
    const text = `Invoice ${inv.invoiceNo} | ${inv.partyName} | PO: ${inv.purchaseOrderRef || '—'} | Product: ${inv.items?.[0]?.description || '—'} | Qty: ${inv.items?.[0]?.qty || '—'} | AWB: ${inv.awb || '—'} | Courier: ${inv.courierName || '—'} | Status: ${inv.orderStatus || inv.status}`;
    navigator.clipboard.writeText(text).then(() => {
      toast('Invoice details copied to clipboard');
    });
    setShareMenuInv(null);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: TEXT_DARK, margin: 0 }}>Invoice Generator</h1>
          <p style={{ fontSize: 13, color: TEXT_LIGHT, margin: '4px 0 0' }}>Create, upload, and manage invoices</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ ...btnOutline, opacity: uploading ? 0.6 : 1 }}
          >
            <MdUpload size={16} />
            {uploading ? 'Uploading...' : 'Upload Excel'}
          </button>
          {totalCount > 0 && (
            <button
              onClick={handleDeleteAll}
              style={{ ...btnOutline, color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
            >
              <MdDeleteSweep size={16} />
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Invoices', value: stats.total || 0, color: BLUE },
          { label: 'Draft', value: stats.draft || 0, color: TEXT_MID },
          { label: 'Sent', value: stats.sent || 0, color: '#f59e0b' },
          { label: 'Paid', value: stats.paid || 0, color: GREEN },
          { label: 'Overdue', value: stats.overdue || 0, color: RED_LIGHT },
          { label: 'Total Value', value: `₹${((stats.totalValue || 0) / 100000).toFixed(2)}L`, color: RED },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #e8edf2', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: TEXT_LIGHT, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Invoice Table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e8edf2', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8edf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>All Invoices</div>
          <div style={{ fontSize: 12, color: TEXT_LIGHT }}>{totalCount} total</div>
        </div>
        {invoices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: TEXT_LIGHT }}>No invoices yet. Upload from Excel.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Invoice No', 'Unique ID', 'PO Number', 'PO Date', 'Ship To', 'City', 'State', 'Product', 'Brand', 'Qty', 'UOM', 'Dispatch Date', 'AWB', 'Courier', 'Order Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8edf2', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {invoices.map((inv, i) => {
                  const item = inv.items?.[0] || {};
                  return (
                    <tr key={inv._id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                      <td style={{ padding: '9px 12px', color: TEXT_LIGHT, fontWeight: 700, fontSize: 11 }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 700, color: RED, whiteSpace: 'nowrap' }}>{inv.invoiceNo}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: TEXT_MID, whiteSpace: 'nowrap' }}>{inv.uniqueId || '—'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: BLUE, whiteSpace: 'nowrap' }}>{inv.purchaseOrderRef || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.poDate || '—'}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: TEXT_DARK, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.partyName}>{inv.partyName}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.partyCity || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.partyState || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>{item.description || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap' }}>{inv.brandName || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_DARK, fontWeight: 600, textAlign: 'center' }}>{item.qty ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{item.unit || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.dispatchDate || '—'}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11, color: TEXT_MID, whiteSpace: 'nowrap' }}>{inv.awb || '—'}</td>
                      <td style={{ padding: '9px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.courierName || '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                          style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Sent">Sent</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setSelectedInvoice(inv); setShowView(true); }} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="View">
                            <MdVisibility size={13} color={BLUE} />
                          </button>
                          <button onClick={() => handlePrint(inv)} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Print">
                            <MdPrint size={13} color={TEXT_MID} />
                          </button>
                          <button onClick={() => handleDownload(inv)} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Download">
                            <MdDownload size={13} color={GREEN} />
                          </button>
                          {/* Share button with dropdown */}
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShare(inv); }}
                              style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #dbeafe', background: '#eff6ff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              title="Share"
                            >
                              <MdShare size={13} color="#3b82f6" />
                            </button>
                            {shareMenuInv?._id === inv._id && (
                              <div style={{
                                position: 'absolute', right: 0, top: '110%', zIndex: 999,
                                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 180, overflow: 'hidden',
                              }}>
                                <button
                                  onClick={() => shareViaWhatsApp(inv)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#1a1a2e', fontFamily: 'inherit' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <FaWhatsapp size={16} color="#25D366" /> WhatsApp
                                </button>
                                <button
                                  onClick={() => shareViaGmail(inv)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#1a1a2e', fontFamily: 'inherit' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <FaEnvelope size={16} color="#EA4335" /> Gmail
                                </button>
                                <button
                                  onClick={() => shareViaCopy(inv)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#1a1a2e', fontFamily: 'inherit', borderTop: '1px solid #f1f5f9' }}
                                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <MdContentCopy size={16} color="#64748b" /> Copy Details
                                </button>
                              </div>
                            )}
                          </div>
                          <button onClick={() => handleDelete(inv._id, inv.invoiceNo)} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete">
                            <MdDelete size={13} color={RED_LIGHT} />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #e8edf2', background: '#fafafa' }}>
            <div style={{ fontSize: 12, color: TEXT_LIGHT }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f1f5f9' : '#fff', color: page === 1 ? TEXT_LIGHT : TEXT_DARK, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}
              >«</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === 1 ? '#f1f5f9' : '#fff', color: page === 1 ? TEXT_LIGHT : TEXT_DARK, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}
              >‹ Prev</button>

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .reduce((acc, n, idx, arr) => {
                  if (idx > 0 && n - arr[idx - 1] > 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, idx) =>
                  n === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '5px 6px', fontSize: 12, color: TEXT_LIGHT }}>…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        border: n === page ? 'none' : '1px solid #e2e8f0',
                        background: n === page ? RED : '#fff',
                        color: n === page ? '#fff' : TEXT_DARK,
                        minWidth: 32,
                      }}
                    >{n}</button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === totalPages ? '#f1f5f9' : '#fff', color: page === totalPages ? TEXT_LIGHT : TEXT_DARK, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}
              >Next ›</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: page === totalPages ? '#f1f5f9' : '#fff', color: page === totalPages ? TEXT_LIGHT : TEXT_DARK, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, fontWeight: 600 }}
              >»</button>
            </div>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {selectedInvoice && (
        <Modal
          open={showView}
          onClose={() => { setShowView(false); setSelectedInvoice(null); }}
          title={`Invoice ${selectedInvoice.invoiceNo}`}
          size="xl"
          footer={
            <>
              <button onClick={() => { setShowView(false); setSelectedInvoice(null); }} style={btnOutline}>Close</button>
              <button
                onClick={() => shareViaWhatsApp(selectedInvoice)}
                style={{ ...btnOutline, color: '#25D366', borderColor: '#bbf7d0', gap: 6 }}
              >
                <FaWhatsapp size={15} /> WhatsApp
              </button>
              <button
                onClick={() => shareViaGmail(selectedInvoice)}
                style={{ ...btnOutline, color: '#EA4335', borderColor: '#fecaca', gap: 6 }}
              >
                <FaEnvelope size={14} /> Gmail
              </button>
              <button onClick={() => handlePrint(selectedInvoice)} style={btnPrimary}>
                <MdPrint size={16} /> Print
              </button>
            </>
          }
        >
          <div dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(selectedInvoice) }} />
        </Modal>
      )}

      {/* Upload Preview / Validation Modal */}
      {uploadPreviewData && (
        <Modal
          open={showUploadPreview}
          onClose={() => { setShowUploadPreview(false); setUploadPreviewData(null); }}
          title="Excel Upload Preview"
          size="xl"
          footer={
            <>
              <button
                onClick={() => { setShowUploadPreview(false); setUploadPreviewData(null); }}
                style={btnOutline}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading || !uploadPreviewData.valid.length}
                style={{ ...btnPrimary, opacity: (uploading || !uploadPreviewData.valid.length) ? 0.6 : 1 }}
              >
                {uploading ? 'Creating...' : `Create ${uploadPreviewData.valid.length} Invoice${uploadPreviewData.valid.length !== 1 ? 's' : ''}`}
              </button>
            </>
          }
        >
          {/* Summary bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MdCheckCircle size={20} color="#22c55e" />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{uploadPreviewData.valid.length}</div>
                <div style={{ fontSize: 11, color: '#15803d' }}>Valid invoices ready to create</div>
                {uploadPreviewData.valid[0]?.uniqueId && (
                  <div style={{ fontSize: 10, color: '#15803d', marginTop: 2 }}>
                    ✓ UniqueId detected · ✓ PO Number detected · ✓ Brand detected
                  </div>
                )}
              </div>
            </div>
            {uploadPreviewData.errors.length > 0 && (
              <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <MdError size={20} color="#ef4444" />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{uploadPreviewData.errors.length}</div>
                  <div style={{ fontSize: 11, color: '#b91c1c' }}>Rows with errors (will be skipped)</div>
                </div>
              </div>
            )}
          </div>

          {/* Errors list */}
          {uploadPreviewData.errors.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MdWarning size={16} color="#f59e0b" /> Validation Errors
              </div>
              <div style={{ background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', maxHeight: 160, overflowY: 'auto' }}>
                {uploadPreviewData.errors.map((err, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#92400e', padding: '3px 0', borderBottom: i < uploadPreviewData.errors.length - 1 ? '1px solid #fde68a' : 'none' }}>
                    <span style={{ fontWeight: 700 }}>Row {err.row}</span> — {err.field}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid invoices preview table */}
          {uploadPreviewData.valid.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK, marginBottom: 8 }}>Invoices to be Created</div>
              <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto', border: '1px solid #e8edf2', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                    <tr>
                      {['#', 'Unique ID', 'PO Number', 'PO Date', 'Ship To', 'City', 'State', 'Product', 'Brand', 'Qty', 'Dispatch Date', 'AWB', 'Courier', 'Order Status'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8edf2', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadPreviewData.valid.map((inv, i) => {
                      const item = inv.items?.[0] || {};
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                          <td style={{ padding: '7px 12px', color: TEXT_LIGHT, fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 11, color: TEXT_MID, whiteSpace: 'nowrap' }}>{inv.uniqueId || '—'}</td>
                          <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 11, color: BLUE, whiteSpace: 'nowrap' }}>{inv.purchaseOrderRef || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.poDate || '—'}</td>
                          <td style={{ padding: '7px 12px', fontWeight: 600, color: TEXT_DARK, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.partyName}>{inv.partyName}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.partyCity || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.partyState || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>{item.description || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap' }}>{inv.brandName || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_DARK, fontWeight: 600, textAlign: 'center' }}>{item.qty ?? '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.dispatchDate || '—'}</td>
                          <td style={{ padding: '7px 12px', fontFamily: 'monospace', fontSize: 11, color: TEXT_MID, whiteSpace: 'nowrap' }}>{inv.awb || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.courierName || '—'}</td>
                          <td style={{ padding: '7px 12px', color: TEXT_MID, whiteSpace: 'nowrap', fontSize: 11 }}>{inv.orderStatus || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {uploadPreviewData.valid.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: TEXT_LIGHT }}>
              <MdError size={40} color="#fca5a5" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: RED }}>No valid invoices found</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Please fix the errors above and re-upload.</div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
