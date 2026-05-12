import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../../components/common/Modal';
import { invoiceApi } from '../../api/invoiceApi';
import { toast } from '../../components/common/Toast';
import { MdUpload, MdDownload, MdPrint, MdAdd, MdDelete, MdVisibility } from 'react-icons/md';

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

const inp = {
  width: '100%', padding: '8px 12px',
  border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, outline: 'none', background: '#fff',
  color: TEXT_DARK, fontFamily: 'inherit',
};

export default function InvoiceGeneratorPage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form state for manual creation
  const [form, setForm] = useState({
    partyName: '', partyAddress: '', partyGST: '', partyEmail: '', partyPhone: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, taxRate: 18 }],
    notes: '', terms: 'Payment due within 30 days.',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([invoiceApi.getAll(), invoiceApi.getStats()]);
      setInvoices(listRes.data || []);
      setStats(statsRes.data || {});
    } catch (e) {
      console.error(e);
      toast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Excel Upload Handler ──────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      // Expected Excel format:
      // PartyName | PartyAddress | PartyGST | InvoiceDate | DueDate | ItemDescription | HSN | Qty | Unit | Rate | Discount | TaxRate
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
            invoiceDate: row.InvoiceDate || new Date().toISOString(),
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

      if (!invoicesToCreate.length) {
        toast('No valid invoices found in Excel', 'warning');
        return;
      }

      const res = await invoiceApi.bulkUpload({ invoices: invoicesToCreate });
      toast(`${res.data.created} invoices created successfully`);
      if (res.data.errors?.length) {
        console.warn('Upload errors:', res.data.errors);
        toast(`${res.data.errors.length} rows had errors`, 'warning');
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      toast(e.message || 'Failed to upload Excel', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Manual Invoice Creation ───────────────────────────────────────────────
  const handleAddItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, taxRate: 18 }],
    }));
  };

  const handleRemoveItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, items };
    });
  };

  const handleCreateInvoice = async () => {
    if (!form.partyName || !form.items.length) {
      toast('Party name and at least one item are required', 'error');
      return;
    }
    try {
      await invoiceApi.create(form);
      toast('Invoice created successfully');
      setShowCreate(false);
      setForm({
        partyName: '', partyAddress: '', partyGST: '', partyEmail: '', partyPhone: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        items: [{ description: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, taxRate: 18 }],
        notes: '', terms: 'Payment due within 30 days.',
      });
      await fetchAll();
    } catch (e) {
      toast(e.message || 'Failed to create invoice', 'error');
    }
  };

  // ── Print/Download Invoice ────────────────────────────────────────────────
  const handlePrint = (invoice) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generateInvoiceHTML(invoice));
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = (invoice) => {
    const html = generateInvoiceHTML(invoice);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Invoice downloaded');
  };

  const generateInvoiceHTML = (inv) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${inv.invoiceNo}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .company { font-size: 24px; font-weight: bold; color: #c0392b; }
    .invoice-no { font-size: 18px; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; background: #f9f9f9; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #c0392b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${inv.companyName || 'Chakra Industries'}</div>
      <div>${inv.companyAddress || ''}</div>
      <div>GST: ${inv.companyGST || ''}</div>
    </div>
    <div style="text-align: right;">
      <div class="invoice-no">Invoice #${inv.invoiceNo}</div>
      <div>Date: ${new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</div>
      ${inv.dueDate ? `<div>Due: ${new Date(inv.dueDate).toLocaleDateString('en-IN')}</div>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="label">Bill To:</div>
    <div><strong>${inv.partyName}</strong></div>
    <div>${inv.partyAddress || ''}</div>
    <div>GST: ${inv.partyGST || ''}</div>
    ${inv.partyEmail ? `<div>Email: ${inv.partyEmail}</div>` : ''}
    ${inv.partyPhone ? `<div>Phone: ${inv.partyPhone}</div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Discount</th>
        <th>Amount</th>
        <th>Tax</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${inv.items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.description}</td>
          <td>${item.hsn || '—'}</td>
          <td>${item.qty}</td>
          <td>${item.unit}</td>
          <td>₹${item.rate.toFixed(2)}</td>
          <td>${item.discount}%</td>
          <td>₹${item.amount.toFixed(2)}</td>
          <td>₹${item.taxAmount.toFixed(2)} (${item.taxRate}%)</td>
          <td>₹${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="7" style="text-align: right;">Subtotal:</td>
        <td colspan="3">₹${inv.subtotal.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="7" style="text-align: right;">Total Discount:</td>
        <td colspan="3">-₹${inv.totalDiscount.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="7" style="text-align: right;">Total Tax:</td>
        <td colspan="3">₹${inv.totalTax.toFixed(2)}</td>
      </tr>
      <tr class="total-row" style="background: #c0392b; color: white;">
        <td colspan="7" style="text-align: right; font-size: 16px;">Grand Total:</td>
        <td colspan="3" style="font-size: 16px;">₹${inv.grandTotal.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  ${inv.notes ? `<div class="section"><div class="label">Notes:</div><div>${inv.notes}</div></div>` : ''}
  ${inv.terms ? `<div class="section"><div class="label">Terms & Conditions:</div><div>${inv.terms}</div></div>` : ''}

  <div class="footer">
    <div style="text-align: center; color: #999;">Thank you for your business!</div>
  </div>
</body>
</html>
    `.trim();
  };

  // ── Download Excel Template ──────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        PartyName: 'Tata Motors Ltd',
        PartyAddress: '123 Industrial Area, Mumbai',
        PartyGST: '27AAACT2727Q1ZW',
        PartyEmail: 'accounts@tata.com',
        PartyPhone: '9876543210',
        InvoiceDate: '2026-05-11',
        DueDate: '2026-06-10',
        Notes: 'Thank you for your business',
        Terms: 'Payment due within 30 days.',
        ItemDescription: 'Steel Bolts M10',
        HSN: '73181500',
        Qty: 500,
        Unit: 'Nos',
        Rate: 12.5,
        Discount: 5,
        TaxRate: 18,
      },
      {
        PartyName: 'Tata Motors Ltd',
        PartyAddress: '',
        PartyGST: '',
        PartyEmail: '',
        PartyPhone: '',
        InvoiceDate: '',
        DueDate: '',
        Notes: '',
        Terms: '',
        ItemDescription: 'Hex Nuts M10',
        HSN: '73181600',
        Qty: 500,
        Unit: 'Nos',
        Rate: 8,
        Discount: 5,
        TaxRate: 18,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'invoice-upload-template.xlsx');
    toast('Template downloaded');
  };
  const handleStatusChange = async (id, status) => {
    try {
      await invoiceApi.updateStatus(id, status);
      toast('Status updated');
      await fetchAll();
    } catch (e) {
      toast(e.message || 'Failed to update status', 'error');
    }
  };

  // ── Delete Invoice ────────────────────────────────────────────────────────
  const handleDelete = async (id, invoiceNo) => {
    if (!window.confirm(`Delete invoice ${invoiceNo}?`)) return;
    try {
      await invoiceApi.delete(id);
      toast('Invoice deleted');
      await fetchAll();
    } catch (e) {
      toast(e.message || 'Failed to delete', 'error');
    }
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
          <button onClick={handleDownloadTemplate} style={{ ...btnOutline, color: TEXT_MID, borderColor: '#e2e8f0' }}>
            <MdDownload size={16} />
            Excel Template
          </button>
          <button onClick={() => setShowCreate(true)} style={btnPrimary}>
            <MdAdd size={16} />
            Create Invoice
          </button>
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
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8edf2' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>All Invoices</div>
        </div>
        {invoices.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: TEXT_LIGHT }}>No invoices yet. Create one or upload from Excel.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Invoice No', 'Party', 'Date', 'Due Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: TEXT_LIGHT, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e8edf2' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv._id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#f8fafc' : '#fff' }}>
                    <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 700, color: RED }}>{inv.invoiceNo}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: TEXT_DARK }}>{inv.partyName}</td>
                    <td style={{ padding: '11px 16px', color: TEXT_MID }}>{new Date(inv.invoiceDate).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '11px 16px', color: TEXT_MID }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: BLUE }}>₹{inv.grandTotal.toFixed(2)}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setSelectedInvoice(inv); setShowView(true); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="View">
                          <MdVisibility size={14} color={BLUE} />
                        </button>
                        <button onClick={() => handlePrint(inv)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Print">
                          <MdPrint size={14} color={TEXT_MID} />
                        </button>
                        <button onClick={() => handleDownload(inv)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Download">
                          <MdDownload size={14} color={GREEN} />
                        </button>
                        <button onClick={() => handleDelete(inv._id, inv.invoiceNo)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Delete">
                          <MdDelete size={14} color={RED_LIGHT} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Invoice"
        size="xl"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} style={btnOutline}>Cancel</button>
            <button onClick={handleCreateInvoice} style={btnPrimary}>Create Invoice</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Party Name *</label>
            <input value={form.partyName} onChange={e => setForm(f => ({ ...f, partyName: e.target.value }))} style={inp} placeholder="Customer name" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Party GST</label>
            <input value={form.partyGST} onChange={e => setForm(f => ({ ...f, partyGST: e.target.value }))} style={inp} placeholder="GST number" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Invoice Date</label>
            <input type="date" value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Due Date</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Party Address</label>
          <textarea value={form.partyAddress} onChange={e => setForm(f => ({ ...f, partyAddress: e.target.value }))} style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Full address" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: TEXT_DARK }}>Items</label>
            <button onClick={handleAddItem} style={{ ...btnOutline, padding: '4px 12px', fontSize: 12 }}>
              <MdAdd size={14} /> Add Item
            </button>
          </div>
          {form.items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 0.7fr 1fr 0.7fr 0.7fr 40px', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <input value={item.description} onChange={e => handleItemChange(idx, 'description', e.target.value)} style={inp} placeholder="Description" />
              <input value={item.hsn} onChange={e => handleItemChange(idx, 'hsn', e.target.value)} style={inp} placeholder="HSN" />
              <input type="number" value={item.qty} onChange={e => handleItemChange(idx, 'qty', e.target.value)} style={inp} placeholder="Qty" />
              <input value={item.unit} onChange={e => handleItemChange(idx, 'unit', e.target.value)} style={inp} placeholder="Unit" />
              <input type="number" value={item.rate} onChange={e => handleItemChange(idx, 'rate', e.target.value)} style={inp} placeholder="Rate" />
              <input type="number" value={item.discount} onChange={e => handleItemChange(idx, 'discount', e.target.value)} style={inp} placeholder="Disc%" />
              <input type="number" value={item.taxRate} onChange={e => handleItemChange(idx, 'taxRate', e.target.value)} style={inp} placeholder="Tax%" />
              <button onClick={() => handleRemoveItem(idx)} style={{ padding: '8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', cursor: 'pointer' }}>
                <MdDelete size={16} color={RED_LIGHT} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Additional notes" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: TEXT_MID, display: 'block', marginBottom: 4 }}>Terms & Conditions</label>
            <textarea value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} style={{ ...inp, minHeight: 60, resize: 'vertical' }} placeholder="Payment terms" />
          </div>
        </div>
      </Modal>

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
              <button onClick={() => handlePrint(selectedInvoice)} style={btnPrimary}>
                <MdPrint size={16} /> Print
              </button>
            </>
          }
        >
          <div dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(selectedInvoice) }} />
        </Modal>
      )}
    </div>
  );
}
