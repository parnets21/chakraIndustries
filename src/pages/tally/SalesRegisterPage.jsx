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
import { SIGNATURE_B64 } from '../../assets/signatureB64.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

// ── Helper function to format tax rates with proper precision ──
const formatTaxRate = (rate) => {
  if (rate == null) return null;
  // Handle floating-point precision issues, check if it's very close to an integer
  const epsilon = 1e-10;
  const roundedRate = Math.round(rate * 100) / 100; // Round to 2 decimal places first
  if (Math.abs(roundedRate - Math.round(roundedRate)) < epsilon) {
    return Math.round(roundedRate).toString();
  }
  // For non-integers, find the shortest representation
  const fixed2 = roundedRate.toFixed(2);
  const fixed1 = roundedRate.toFixed(1);
  if (Math.abs(parseFloat(fixed1) - roundedRate) < epsilon) return fixed1;
  return fixed2;
};

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
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .invoice-header { text-align: center; margin-bottom: 24px; }
        .invoice-header h2 { margin: 0; color: #1f2937; font-size: 22px; }
        .invoice-header p { margin: 4px 0 0; color: #64748b; }
        .invoice-title-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .invoice-title { font-size: 18px; font-weight: bold; }
        .invoice-basic { text-align: right; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-card { padding: 12px; background: #f8fafc; border-radius: 6px; }
        .meta-label { font-weight: bold; color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
        .meta-value { color: #111827; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        .items-table th { background-color: #f3f4f6; font-weight: bold; }
        .text-right { text-align: right; }
        .total-section { text-align: right; margin-top: 20px; }
        .total-section div { margin: 6px 0; }
        .sign-section { margin-top: 40px; display: flex; justify-content: flex-end; }
      </style>
      </head>
      <body>
        <div class="invoice-header">
          <h2>SRI CHAKRA INDUSTRIES</h2>
          <p>#13/14, Azeez Sait Industrial Estate, Mysore Road, Nayandahalli, Bangalore - 560039</p>
          <p>GSTIN: 29ABWFS0002M1ZR</p>
        </div>
        
        ${(invoice.irn || invoice.ackNo) ? `
          <div class="info-card grid-2">
            ${invoice.irn ? `<div><div class="meta-label">IRN</div><div class="meta-value">${invoice.irn}</div></div>` : ''}
            ${invoice.ackNo ? `<div><div class="meta-label">Ack No</div><div class="meta-value">${invoice.ackNo}</div></div>` : ''}
            ${invoice.ackDate ? `<div><div class="meta-label">Ack Date</div><div class="meta-value">${fmtDate(invoice.ackDate)}</div></div>` : ''}
          </div>
        ` : ''}
        
        <div class="invoice-title-row">
          <div class="invoice-title">TAX INVOICE</div>
          <div class="invoice-basic">
            <div>Invoice No.: ${invoice.invoiceNo || invoice.voucherNumber}</div>
            <div>Date: ${fmtDate(invoice.invoiceDate || invoice.voucherDate)}</div>
          </div>
        </div>
        
        <!-- Party Details -->
        <div style="margin-bottom: 20px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 700; color: #111827; text-decoration: underline;">Party Details</span>
          </div>
          <div class="grid-2">
            <!-- Bill To -->
            <div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 12px; color: #374151;">Buyer (Bill to)</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">:</div>
              </div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 12px; color: #374151;">Mailing Name</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToMailingName || invoice.billToName || invoice.partyName || '—'}</div>
              </div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 12px; color: #374151;">Address</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToAddress ? invoice.billToAddress.replace(/\n/g, '<br/>') : '—'}</div>
              </div>
              ${(invoice.billToCity || invoice.billToState || invoice.billToCountry) ? `
                ${invoice.billToCity ? `
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px; padding-left: 148px;">
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">${invoice.billToCity}</div>
                  </div>
                ` : ''}
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">State</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToState || '—'}</div>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Country</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToCountry || '—'}</div>
                </div>
              ` : ''}
              ${invoice.billToGstRegType ? `
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">GST Registration type</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToGstRegType}</div>
                </div>
              ` : ''}
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                <div style="font-size: 12px; color: #374151;">GSTIN/UIN</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToGST || invoice.partyGstin || '—'}</div>
              </div>
            </div>
            <!-- Ship To -->
            <div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 12px; color: #374151;">Consignee (Ship to)</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">:</div>
              </div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 12px; color: #374151;">Mailing Name</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToMailingName || invoice.shipToName || invoice.partyName || '—'}</div>
              </div>
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                <div style="font-size: 12px; color: #374151;">Address</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToAddress ? invoice.shipToAddress.replace(/\n/g, '<br/>') : '—'}</div>
              </div>
              ${(invoice.shipToCity || invoice.shipToState || invoice.shipToCountry) ? `
                ${invoice.shipToCity ? `
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px; padding-left: 148px;">
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">${invoice.shipToCity}</div>
                  </div>
                ` : ''}
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">State</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToState || '—'}</div>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Country</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToCountry || '—'}</div>
                </div>
              ` : ''}
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                <div style="font-size: 12px; color: #374151;">GSTIN/UIN</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToGST || '—'}</div>
              </div>
            </div>
          </div>
          ${invoice.placeOfSupply ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
              <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                <div style="font-size: 12px; color: #374151;">Place of Supply</div>
                <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.placeOfSupply}</div>
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="info-card grid-2">
          ${invoice.deliveryNote ? `<div><div class="meta-label">Delivery Note</div><div class="meta-value">${invoice.deliveryNote}</div></div>` : ''}
          ${invoice.referenceNo ? `<div><div class="meta-label">Reference No. & Date</div><div class="meta-value">${invoice.referenceNo}${invoice.referenceDate ? ` · ${fmtDate(invoice.referenceDate)}` : ''}</div></div>` : ''}
          ${invoice.buyersOrderNo ? `<div><div class="meta-label">Buyer's Order No.</div><div class="meta-value">${invoice.buyersOrderNo}${invoice.buyersOrderDate ? ` · ${fmtDate(invoice.buyersOrderDate)}` : ''}</div></div>` : ''}
          ${invoice.dispatchDocNo ? `<div><div class="meta-label">Dispatch Doc No.</div><div class="meta-value">${invoice.dispatchDocNo}</div></div>` : ''}
          ${invoice.dispatchedThrough ? `<div><div class="meta-label">Dispatched Through</div><div class="meta-value">${invoice.dispatchedThrough}</div></div>` : ''}
          ${invoice.destination ? `<div><div class="meta-label">Destination</div><div class="meta-value">${invoice.destination}</div></div>` : ''}
          ${invoice.billOfLadingNo ? `<div><div class="meta-label">Bill of Lading/LR-RR No.</div><div class="meta-value">${invoice.billOfLadingNo}</div></div>` : ''}
          ${invoice.motorVehicleNo ? `<div><div class="meta-label">Motor Vehicle No.</div><div class="meta-value">${invoice.motorVehicleNo}</div></div>` : ''}
          ${invoice.termsOfDelivery ? `<div style="grid-column: 1 / -1;"><div class="meta-label">Terms of Delivery</div><div class="meta-value">${invoice.termsOfDelivery}</div></div>` : ''}
        </div>
        
        ${invoice.narration ? `<div style="margin-bottom: 20px;"><div class="meta-label">Narration</div><div class="meta-value">${invoice.narration}</div></div>` : ''}

        <table class="items-table">
        <thead>
          <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Tax %</th>
          <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.inventoryEntries || invoice.items || []).map(item => {
            const formattedRate = item.taxRate != null ? formatTaxRate(item.taxRate) : null;
            return `
          <tr>
            <td>${item.stockItemName || item.description || '—'}</td>
            <td>${item.qty || 0}</td>
            <td>${item.rate || 0}</td>
            <td>${formattedRate != null ? formattedRate + '%' : '—'}</td>
            <td>${item.amount || 0}</td>
          </tr>
          `}).join('')}
          ${(!invoice.inventoryEntries || invoice.inventoryEntries.length === 0) && (!invoice.items || invoice.items.length === 0) ? '<tr><td colspan="5" style="text-align: center;">No items</td></tr>' : ''}
        </tbody>
        </table>

        <div class="total-section">
        ${invoice.subtotal ? `<div>Subtotal: ${fmt(invoice.subtotal)}</div>` : ''}
        ${(invoice.ledgerEntries || []).filter(le => 
          !le.ledgerName.toLowerCase().includes('cgst') && 
          !le.ledgerName.toLowerCase().includes('sgst') && 
          !le.ledgerName.toLowerCase().includes('igst') && 
          !le.ledgerName.toLowerCase().includes('cess') && 
          le.ledgerName.toLowerCase() !== (invoice.partyName || '').toLowerCase()
        ).map(le => `<div>${le.ledgerName}: ${fmt(Math.abs(le.amount))}</div>`).join('')}
        ${(invoice.taxLines || []).map(tl => `<div>${tl.ledgerName}: ${fmt(Math.abs(tl.amount))}</div>`).join('')}
        <div style="font-weight: bold; font-size: 18px;">GRAND TOTAL: ${fmt(invoice.grandTotal || invoice.amount)}</div>
        <div style="font-weight: normal; font-size: 12px; margin-top: 20px;">Narration: ${invoice.narration || '—'}</div>
        </div>
        
        <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
          <div style="text-align: right;">
            <div style="font-weight: bold; margin-bottom: 5px;">For Sri Chakra Industries</div>
            <img src="${SIGNATURE_B64}" alt="Signature" style="height: 60px; margin-bottom: 5px;"/>
            <div style="border-top: 1px solid #333; padding-top: 5px; font-size: 12px;">Authorised Signatory</div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadPDF = async () => {
    try {
      toast('Generating PDF...', 'info');
      // Create a temporary div to render the invoice HTML
      const tempDiv = document.createElement('div');
      // Build the invoice HTML (same as what we use for printing)
      tempDiv.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
        <title>Invoice ${invoice.invoiceNo || invoice.voucherNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
          .invoice-header { text-align: center; margin-bottom: 24px; }
          .invoice-header h2 { margin: 0; color: #1f2937; font-size: 22px; }
          .invoice-header p { margin: 4px 0 0; color: #64748b; }
          .invoice-title-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .invoice-title { font-size: 18px; font-weight: bold; }
          .invoice-basic { text-align: right; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-card { padding: 12px; background: #f8fafc; border-radius: 6px; }
          .meta-label { font-weight: bold; color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
          .meta-value { color: #111827; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          .items-table th { background: #f9fafb; font-weight: 600; }
          .items-table .text-right { text-align: right; }
          .total-row { font-weight: bold; font-size: 16px; }
          .sign-section { margin-top: 40px; display: flex; justify-content: flex-end; }
          .sign-block { text-align: right; }
        </style>
        </head>
        <body>
          <div class="invoice-header">
            <h2>Sri Chakra Industries</h2>
            <p>#13/14, Azeez Sait Industrial Estate, Mysore Road, Nayandahalli, Bangalore - 560039</p>
            <p>GSTIN: 29ABWFS0002M1ZR</p>
          </div>
          
          ${(invoice.irn || invoice.ackNo) ? `
            <div class="info-card grid-2">
              ${invoice.irn ? `<div><div class="meta-label">IRN</div><div class="meta-value">${invoice.irn}</div></div>` : ''}
              ${invoice.ackNo ? `<div><div class="meta-label">Ack No</div><div class="meta-value">${invoice.ackNo}</div></div>` : ''}
              ${invoice.ackDate ? `<div><div class="meta-label">Ack Date</div><div class="meta-value">${fmtDate(invoice.ackDate)}</div></div>` : ''}
            </div>
          ` : ''}
          
          <div class="invoice-title-row">
            <div class="invoice-title">TAX INVOICE</div>
            <div class="invoice-basic">
              <div>Invoice No.: ${invoice.invoiceNo || invoice.voucherNumber || '—'}</div>
              <div>Date: ${fmtDate(invoice.invoiceDate || invoice.voucherDate)}</div>
            </div>
          </div>
          
          <!-- Party Details -->
          <div style="margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 8px;">
              <span style="font-size: 14px; font-weight: 700; color: #111827; text-decoration: underline;">Party Details</span>
            </div>
            <div class="grid-2">
              <!-- Bill To -->
              <div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Buyer (Bill to)</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">:</div>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Mailing Name</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToMailingName || invoice.billToName || invoice.partyName || '—'}</div>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Address</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToAddress ? invoice.billToAddress.replace(/\n/g, '<br/>') : '—'}</div>
                </div>
                ${(invoice.billToCity || invoice.billToState || invoice.billToCountry) ? `
                  ${invoice.billToCity ? `
                    <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px; padding-left: 148px;">
                      <div style="font-size: 12px; color: #111827; font-weight: 600;">${invoice.billToCity}</div>
                    </div>
                  ` : ''}
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                    <div style="font-size: 12px; color: #374151;">State</div>
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToState || '—'}</div>
                  </div>
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                    <div style="font-size: 12px; color: #374151;">Country</div>
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToCountry || '—'}</div>
                  </div>
                ` : ''}
                ${invoice.billToGstRegType ? `
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                    <div style="font-size: 12px; color: #374151;">GST Registration type</div>
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToGstRegType}</div>
                  </div>
                ` : ''}
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                  <div style="font-size: 12px; color: #374151;">GSTIN/UIN</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.billToGST || invoice.partyGstin || '—'}</div>
                </div>
              </div>
              <!-- Ship To -->
              <div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Consignee (Ship to)</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">:</div>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Mailing Name</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToMailingName || invoice.shipToName || invoice.partyName || '—'}</div>
                </div>
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                  <div style="font-size: 12px; color: #374151;">Address</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToAddress ? invoice.shipToAddress.replace(/\n/g, '<br/>') : '—'}</div>
                </div>
                ${(invoice.shipToCity || invoice.shipToState || invoice.shipToCountry) ? `
                  ${invoice.shipToCity ? `
                    <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px; padding-left: 148px;">
                      <div style="font-size: 12px; color: #111827; font-weight: 600;">${invoice.shipToCity}</div>
                    </div>
                  ` : ''}
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                    <div style="font-size: 12px; color: #374151;">State</div>
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToState || '—'}</div>
                  </div>
                  <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px; margin-bottom: 4px;">
                    <div style="font-size: 12px; color: #374151;">Country</div>
                    <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToCountry || '—'}</div>
                  </div>
                ` : ''}
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                  <div style="font-size: 12px; color: #374151;">GSTIN/UIN</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.shipToGST || '—'}</div>
                </div>
              </div>
            </div>
            ${invoice.placeOfSupply ? `
              <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 140px 1fr; gap: 8px;">
                  <div style="font-size: 12px; color: #374151;">Place of Supply</div>
                  <div style="font-size: 12px; color: #111827; font-weight: 600;">: ${invoice.placeOfSupply}</div>
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="info-card grid-2">
            ${invoice.deliveryNote ? `<div><div class="meta-label">Delivery Note</div><div class="meta-value">${invoice.deliveryNote}</div></div>` : ''}
            ${invoice.referenceNo ? `<div><div class="meta-label">Reference No. & Date</div><div class="meta-value">${invoice.referenceNo}${invoice.referenceDate ? ` · ${fmtDate(invoice.referenceDate)}` : ''}</div></div>` : ''}
            ${invoice.buyersOrderNo ? `<div><div class="meta-label">Buyer's Order No.</div><div class="meta-value">${invoice.buyersOrderNo}${invoice.buyersOrderDate ? ` · ${fmtDate(invoice.buyersOrderDate)}` : ''}</div></div>` : ''}
            ${invoice.dispatchDocNo ? `<div><div class="meta-label">Dispatch Doc No.</div><div class="meta-value">${invoice.dispatchDocNo}</div></div>` : ''}
            ${invoice.dispatchedThrough ? `<div><div class="meta-label">Dispatched Through</div><div class="meta-value">${invoice.dispatchedThrough}</div></div>` : ''}
            ${invoice.destination ? `<div><div class="meta-label">Destination</div><div class="meta-value">${invoice.destination}</div></div>` : ''}
            ${invoice.billOfLadingNo ? `<div><div class="meta-label">Bill of Lading/LR-RR No.</div><div class="meta-value">${invoice.billOfLadingNo}</div></div>` : ''}
            ${invoice.motorVehicleNo ? `<div><div class="meta-label">Motor Vehicle No.</div><div class="meta-value">${invoice.motorVehicleNo}</div></div>` : ''}
            ${invoice.termsOfDelivery ? `<div style="grid-column: 1 / -1;"><div class="meta-label">Terms of Delivery</div><div class="meta-value">${invoice.termsOfDelivery}</div></div>` : ''}
          </div>
          
          ${invoice.narration ? `<div style="margin-bottom: 20px;"><div class="meta-label">Narration</div><div class="meta-value">${invoice.narration}</div></div>` : ''}

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50px;">S.No.</th>
                <th>Item</th>
                <th style="width: 100px;">HSN</th>
                <th class="text-right" style="width: 80px;">Qty</th>
                <th class="text-right" style="width: 120px;">Rate</th>
                <th class="text-right" style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.inventoryEntries || []).map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.stockItemName || '—'}</td>
                  <td>${item.hsnCode || '—'}</td>
                  <td class="text-right">${Number(item.qty || 0).toLocaleString('en-IN')} Nos</td>
                  <td class="text-right">₹ ${Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-right">₹ ${Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">Subtotal:</td>
                <td class="text-right">₹ ${Number(invoice.subtotal || invoice.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              ${(invoice.taxLines || (invoice.ledgerEntries || []).filter(le => ['cgst', 'sgst', 'igst', 'cess'].some(tax => (le.ledgerName || '').toLowerCase().includes(tax)))).map(tax => `
                <tr>
                  <td colspan="5" style="text-align: right;">${tax.ledgerName}:</td>
                  <td class="text-right">₹ ${Number(Math.abs(tax.amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">Grand Total:</td>
                <td class="text-right" style="color: #16a34a;">₹ ${Number(invoice.grandTotal || invoice.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        
          <div class="sign-section">
            <div class="sign-block">
              <div style="font-weight: bold; margin-bottom: 5px;">For Sri Chakra Industries</div>
              <img src="${SIGNATURE_B64}" alt="Signature" style="height: 60px; margin-bottom: 5px;"/>
              <div style="border-top: 1px solid #333; padding-top: 5px; font-size: 12px;">Authorised Signatory</div>
            </div>
          </div>
        </body>
        </html>
      `;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      // Capture with html2canvas
      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false });
      
      // Create PDF
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Download
      const fileName = `Invoice_${invoice.invoiceNo || invoice.voucherNumber || 'document'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      toast('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast('Failed to generate PDF', 'error');
    } finally {
      // Cleanup
      const tempDivs = document.querySelectorAll('div[style*="left: -9999px"]');
      tempDivs.forEach(div => div.remove());
    }
  };

  // Helper to categorize ledger entries
  const isTaxEntry = (le) => {
    const name = le.ledgerName.toLowerCase();
    return name.includes('cgst') || name.includes('sgst') || name.includes('igst') || name.includes('cess');
  };

  const isPartyEntry = (le) => {
    return le.ledgerName.toLowerCase() === (invoice.partyName || '').toLowerCase();
  };

  const additionalCharges = (invoice.ledgerEntries || []).filter(le => !isTaxEntry(le) && !isPartyEntry(le));
  const taxEntries = (invoice.taxLines || []).length > 0 ? invoice.taxLines : (invoice.ledgerEntries || []).filter(isTaxEntry);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 1000, maxHeight: '90vh',
        overflow: 'auto', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', position: 'relative'
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          fontSize: 24, cursor: 'pointer', color: '#6b7280', padding: 0
        }}>✕</button>

        {/* Header with Company Info */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 800 }}>SRI CHAKRA INDUSTRIES</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>#13/14, Azeez Sait Industrial Estate, Mysore Road, Nayandahalli, Bangalore - 560039</p>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: 12 }}>GSTIN: 29ABWFS0002M1ZR</p>
          </div>
        </div>

        {/* E-Invoice Details */}
        {(invoice.irn || invoice.ackNo) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
            {invoice.irn && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>IRN</label>
                <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12, wordBreak: 'break-all' }}>{invoice.irn}</p>
              </div>
            )}
            {invoice.ackNo && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Ack No</label>
                <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.ackNo}</p>
              </div>
            )}
            {invoice.ackDate && (
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Ack Date</label>
                <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{fmtDate(invoice.ackDate)}</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice Title and Basic Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>TAX INVOICE</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>Invoice No.: {invoice.invoiceNo || invoice.voucherNumber}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>Date: {fmtDate(invoice.invoiceDate || invoice.voucherDate)}</div>
          </div>
        </div>

        {/* Party Details - Bill To & Ship To */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', textDecoration: 'underline' }}>Party Details</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Bill To */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Buyer (Bill to)</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>:</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Mailing Name</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.billToMailingName || invoice.billToName || invoice.partyName || '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Address</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600, whiteSpace: 'pre-line' }}>: {invoice.billToAddress || '—'}</div>
              </div>
              {(invoice.billToCity || invoice.billToState || invoice.billToCountry) && (
                <>
                  {invoice.billToCity && (
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4, paddingLeft: '148px' }}>
                      <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{invoice.billToCity}</div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#374151' }}>State</div>
                    <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.billToState || '—'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#374151' }}>Country</div>
                    <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.billToCountry || '—'}</div>
                  </div>
                </>
              )}
              {invoice.billToGstRegType && (
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 12, color: '#374151' }}>GST Registration type</div>
                  <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.billToGstRegType}</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>GSTIN/UIN</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.billToGST || invoice.partyGstin || '—'}</div>
              </div>
            </div>

            {/* Ship To */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Consignee (Ship to)</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>:</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Mailing Name</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.shipToMailingName || invoice.shipToName || invoice.partyName || '—'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Address</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600, whiteSpace: 'pre-line' }}>: {invoice.shipToAddress || '—'}</div>
              </div>
              {(invoice.shipToCity || invoice.shipToState || invoice.shipToCountry) && (
                <>
                  {invoice.shipToCity && (
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4, paddingLeft: '148px' }}>
                      <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{invoice.shipToCity}</div>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#374151' }}>State</div>
                    <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.shipToState || '—'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#374151' }}>Country</div>
                    <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.shipToCountry || '—'}</div>
                  </div>
                </>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>GSTIN/UIN</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.shipToGST || '—'}</div>
              </div>
            </div>
          </div>
          {invoice.placeOfSupply && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8 }}>
                <div style={{ fontSize: 12, color: '#374151' }}>Place of Supply</div>
                <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>: {invoice.placeOfSupply}</div>
              </div>
            </div>
          )}
        </div>

        {/* Delivery & Reference Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
          {invoice.deliveryNote && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Delivery Note</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.deliveryNote}</p>
            </div>
          )}
          {invoice.referenceNo && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Reference No. & Date</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.referenceNo}{invoice.referenceDate ? ` · ${fmtDate(invoice.referenceDate)}` : ''}</p>
            </div>
          )}
          {invoice.buyersOrderNo && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Buyer's Order No.</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.buyersOrderNo}{invoice.buyersOrderDate ? ` · ${fmtDate(invoice.buyersOrderDate)}` : ''}</p>
            </div>
          )}
          {invoice.dispatchDocNo && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Dispatch Doc No.</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.dispatchDocNo}</p>
            </div>
          )}
          {invoice.dispatchedThrough && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Dispatched Through</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.dispatchedThrough}</p>
            </div>
          )}
          {invoice.destination && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Destination</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.destination}</p>
            </div>
          )}
          {invoice.billOfLadingNo && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Bill of Lading/LR-RR No.</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.billOfLadingNo}</p>
            </div>
          )}
          {invoice.motorVehicleNo && (
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Motor Vehicle No.</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.motorVehicleNo}</p>
            </div>
          )}
          {invoice.termsOfDelivery && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Terms of Delivery</label>
              <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 12 }}>{invoice.termsOfDelivery}</p>
            </div>
          )}
        </div>

        {/* Narration */}
        {invoice.narration && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Narration</label>
            <p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 13 }}>{invoice.narration}</p>
          </div>
        )}

        {/* Items */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Items</label>
          {((invoice.inventoryEntries && invoice.inventoryEntries.length > 0) || (invoice.items && invoice.items.length > 0)) ? (
            <div style={{ background: '#f8fafc', borderRadius: 8, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b' }}>Item Name</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Qty</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Rate</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Tax %</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.inventoryEntries || invoice.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', color: '#0f172a' }}>{item.stockItemName || item.description || '—'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>{item.qty || 0}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>₹{(item.rate || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#0f172a' }}>
                        {item.taxRate != null ? formatTaxRate(item.taxRate) + '%' : '—'}
                      </td>
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

        {/* Charges & Taxes */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Charges & Taxes</label>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: 13 }}>Subtotal</span>
              <span style={{ color: '#0f172a', fontWeight: 600 }}>{fmt(invoice.subtotal || (invoice.inventoryEntries || invoice.items || []).reduce((sum, item) => sum + (item.amount || 0), 0))}</span>
            </div>
            {additionalCharges.map((charge, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>{charge.ledgerName}</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{fmt(Math.abs(charge.amount))}</span>
              </div>
            ))}
            {taxEntries.map((tax, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', fontSize: 13 }}>{tax.ledgerName}</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{fmt(Math.abs(tax.amount))}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12 }}>
              <span style={{ color: '#0f172a', fontWeight: 700, fontSize: 14 }}>Grand Total</span>
              <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 18 }}>{fmt(invoice.grandTotal || invoice.amount)}</span>
            </div>
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
        setVouchers(res.data || []);
        setVTotal(res.total || 0);
        setInvoices(res.invoices || []);
        setITotal(res.invoiceTotal || 0);
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
                        {['#', 'Voucher No', 'Date', 'Party', 'Item Names', 'Amount', 'Actions'].map(h => (
                          <th key={h} className={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map((v, i) => (
                        <tr key={v.id || i} className={tr}>
                          <td className={td} style={{ color: '#94a3b8', fontSize: 11 }}>{(vPage - 1) * vPageSize + i + 1}</td>
                          <td className={td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#15803d', fontSize: 11 }}>{v.voucherNumber || '—'}</td>
                          <td className={td} style={{ whiteSpace: 'nowrap' }}>{fmtDate(v.date || v.voucherDate)}</td>
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
                          <td className={td} style={{ fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>{fmt(v.grandTotal || v.amount)}</td>
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
                            {(inv.inventoryEntries || inv.items || [])?.length > 0 ? (
                              <div style={{ maxWidth: 200 }}>
                                {(inv.inventoryEntries || inv.items || []).slice(0, 2).map((item, idx) => (
                                  <div key={idx} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.stockItemName || item.description || '—'}
                                  </div>
                                ))}
                                {(inv.inventoryEntries || inv.items || []).length > 2 && (
                                  <div style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic' }}>
                                    +{(inv.inventoryEntries || inv.items || []).length - 2} more
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
