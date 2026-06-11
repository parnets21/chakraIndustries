import { useState, useEffect, useCallback, useRef } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import CreditNoteTrackerEnhanced from './components/CreditNoteTrackerEnhanced';
import { accountsLedgerApi } from '../../api/accountsLedgerApi';
import { tallyApi } from '../../api/tallyApi';
import { brsApi } from '../../api/brsApi';

const tabs = ['Ledger', 'BRS', 'Payments', 'Credit / Debit Notes', 'Ledger Matching'];

const th = 'bg-gray-50 px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap';
const td = 'px-4 py-3 text-gray-800 align-middle';
const tr = 'border-b border-gray-50 last:border-0 hover:bg-red-50/40 transition-colors';

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 10,
  background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
  color: '#fff', border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  boxShadow: '0 3px 10px rgba(185,28,28,0.3)',
};
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 10,
  background: 'transparent', color: '#c0392b',
  border: '1.5px solid #c0392b', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
};

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, border: '3px solid #f1f5f9', borderTop: '3px solid #c0392b', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function fmt(n) {
  if (n == null) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export default function FinancePage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // ── Ledger tab state ──────────────────────────────────────────────────────
  const [ledgers, setLedgers]         = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerSearch, setLedgerSearch]   = useState('');
  const [ledgerGroup, setLedgerGroup]     = useState('');

  // ── Payments tab state ────────────────────────────────────────────────────
  const [vouchers, setVouchers]           = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherType, setVoucherType]     = useState('');
  const [voucherSearch, setVoucherSearch] = useState('');

  // ── BRS tab state ─────────────────────────────────────────────────────────
  const [brsStatements, setBrsStatements] = useState([]);
  const [brsLoading, setBrsLoading] = useState(false);
  const [brsFile, setBrsFile] = useState(null);
  const [brsBankName, setBrsBankName] = useState('');
  const [brsUploading, setBrsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ partyName: '', voucherType: 'Receipt', amount: '', narration: '', voucherDate: '' });
  const [saving, setSaving] = useState(false);

  // ── KPI summary ───────────────────────────────────────────────────────────
  const totalDebtors  = ledgers.filter(l => l.ledgerGroup === 'Sundry Debtors').reduce((s, l) => s + (l.currentBalance || l.openingBalance || 0), 0);
  const totalCreditors = ledgers.filter(l => l.ledgerGroup === 'Sundry Creditors').reduce((s, l) => s + (l.currentBalance || l.openingBalance || 0), 0);
  const totalReceipts  = vouchers.filter(v => v.voucherType === 'Receipt').reduce((s, v) => s + (v.amount || 0), 0);
  const totalPayments  = vouchers.filter(v => v.voucherType === 'Payment').reduce((s, v) => s + (v.amount || 0), 0);

  // ── Load ledgers ──────────────────────────────────────────────────────────
  const loadLedgers = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const params = {};
      if (ledgerSearch.trim()) params.search = ledgerSearch.trim();
      if (ledgerGroup) params.ledgerGroup = ledgerGroup; // not a direct filter but passed for future use
      const res = await accountsLedgerApi.getAll(params);
      let data = res.data || [];
      if (ledgerGroup) data = data.filter(l => l.ledgerGroup === ledgerGroup);
      setLedgers(data);
    } catch (e) {
      toast(e.message || 'Failed to load ledgers', 'error');
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerSearch, ledgerGroup]);

  // ── Load vouchers ─────────────────────────────────────────────────────────
  const loadVouchers = useCallback(async () => {
    setVoucherLoading(true);
    try {
      const params = {};
      if (voucherType) params.type = voucherType;
      if (voucherSearch.trim()) params.partyName = voucherSearch.trim();
      const res = await tallyApi.getVouchers(params);
      setVouchers(res.data || []);
    } catch (e) {
      toast(e.message || 'Failed to load vouchers', 'error');
    } finally {
      setVoucherLoading(false);
    }
  }, [voucherType, voucherSearch]);

  // ── Load BRS statements ───────────────────────────────────────────────────
  const loadBrsStatements = useCallback(async () => {
    setBrsLoading(true);
    try {
      const res = await brsApi.getStatements();
      setBrsStatements(res.data || []);
    } catch (e) {
      toast(e.message || 'Failed to load BRS statements', 'error');
    } finally {
      setBrsLoading(false);
    }
  }, []);

  // ── Handle BRS file upload ────────────────────────────────────────────────
  const handleBrsUpload = async () => {
    if (!brsFile) {
      toast('Please select a file to upload', 'error');
      return;
    }
    setBrsUploading(true);
    try {
      await brsApi.uploadStatement(brsFile, brsBankName);
      toast('Bank statement uploaded successfully!', 'success');
      setBrsFile(null);
      setBrsBankName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadBrsStatements();
    } catch (e) {
      toast(e.message || 'Failed to upload statement', 'error');
    } finally {
      setBrsUploading(false);
    }
  };

  // Load on tab switch
  useEffect(() => { if (activeTab === 0) loadLedgers(); }, [activeTab, loadLedgers]);
  useEffect(() => { if (activeTab === 1) loadBrsStatements(); }, [activeTab, loadBrsStatements]);
  useEffect(() => { if (activeTab === 2) loadVouchers(); }, [activeTab, loadVouchers]);

  // ── Save voucher ──────────────────────────────────────────────────────────
  const handleSaveVoucher = async () => {
    if (!payForm.partyName || !payForm.amount) {
      toast('Party name and amount are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await tallyApi.createVoucher({ ...payForm, amount: Number(payForm.amount), source: 'ERP' });
      toast('Voucher created — will sync to Tally on next sync', 'success');
      setShowPayModal(false);
      setPayForm({ partyName: '', voucherType: 'Receipt', amount: '', narration: '', voucherDate: '' });
      loadVouchers();
    } catch (e) {
      toast(e.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const kpis = [
    { label: 'Total Receivables',  value: fmt(totalDebtors),   color: '#10b981' },
    { label: 'Total Payables',     value: fmt(totalCreditors),  color: '#ef4444' },
    { label: 'Total Receipts',     value: fmt(totalReceipts),   color: '#3b82f6' },
    { label: 'Total Payments Out', value: fmt(totalPayments),   color: '#f59e0b' },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9', flexWrap: 'wrap' }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            color: activeTab === i ? '#c0392b' : '#64748b',
            borderBottom: activeTab === i ? '2px solid #c0392b' : '2px solid transparent',
            marginBottom: -2,
          }}>{t}</button>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {activeTab === 2 && <button onClick={() => setShowPayModal(true)} style={primaryBtn}>+ Add Voucher</button>}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tab 0: Ledger ─────────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="text-sm font-bold text-gray-800">Accounts Ledger</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {ledgers.length} ledger{ledgers.length !== 1 ? 's' : ''} — synced from Tally
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                placeholder="Search name / GST..."
                value={ledgerSearch}
                onChange={e => setLedgerSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadLedgers()}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 200 }}
              />
              <select
                value={ledgerGroup}
                onChange={e => setLedgerGroup(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                <option value="">All Groups</option>
                <option value="Sundry Debtors">Sundry Debtors</option>
                <option value="Sundry Creditors">Sundry Creditors</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
              <button onClick={loadLedgers} style={outlineBtn}>🔍 Search</button>
            </div>
          </div>

          {ledgerLoading ? <Spinner /> : ledgers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No ledgers found. Sync from Tally to populate this list.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Ledger Code', 'Name', 'Group', 'Type', 'GST No.', 'Opening Bal.', 'Current Bal.', 'Tally Synced', 'Last Sync'].map(h => (
                      <th key={h} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledgers.map((l, i) => (
                    <tr key={l._id || i} className={tr}>
                      <td className={td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c0392b', fontSize: 11 }}>{l.ledgerCode}</td>
                      <td className={td} style={{ fontWeight: 600 }}>{l.ledgerName}</td>
                      <td className={td}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: l.ledgerGroup === 'Sundry Debtors' ? '#dbeafe' : l.ledgerGroup === 'Sundry Creditors' ? '#fce7f3' : '#f1f5f9',
                          color: l.ledgerGroup === 'Sundry Debtors' ? '#1e40af' : l.ledgerGroup === 'Sundry Creditors' ? '#9d174d' : '#475569',
                        }}>{l.ledgerGroup || '—'}</span>
                      </td>
                      <td className={td} style={{ fontSize: 12, color: '#475569' }}>{l.ledgerType || '—'}</td>
                      <td className={td} style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.gstNumber || '—'}</td>
                      <td className={td} style={{ fontWeight: 600, color: (l.openingBalance || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {fmt(l.openingBalance)}
                      </td>
                      <td className={td} style={{ fontWeight: 700, color: (l.currentBalance || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                        {fmt(l.currentBalance)}
                        {l.balanceType && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>{l.balanceType}</span>}
                      </td>
                      <td className={td}>
                        <StatusBadge status={l.syncedWithTally ? 'Synced' : 'Pending'} type={l.syncedWithTally ? 'success' : 'warning'} />
                      </td>
                      <td className={td} style={{ fontSize: 11, color: '#94a3b8' }}>
                        {l.lastTallySync ? new Date(l.lastTallySync).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 1: BRS ────────────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Bank Reconciliation Statement</div>
          <div className="text-xs text-gray-400 mb-4">Upload your bank statement to reconcile with ERP ledger entries</div>
          
          <div style={{ border: '2px dashed #e2e8f0', borderRadius: 12, padding: '24px', background: '#f8fafc', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Bank Name (optional)"
                  value={brsBankName}
                  onChange={(e) => setBrsBankName(e.target.value)}
                  style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBrsFile(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <button
                    style={{ ...outlineBtn }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </button>
                  {brsFile && (
                    <span style={{ fontSize: 13, color: '#334155' }}>
                      Selected: {brsFile.name}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  style={{ ...primaryBtn }}
                  onClick={handleBrsUpload}
                  disabled={brsUploading || !brsFile}
                >
                  {brsUploading ? 'Uploading...' : 'Upload Statement'}
                </button>
              </div>
            </div>
          </div>

          {brsLoading ? (
            <Spinner />
          ) : brsStatements.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No bank statements uploaded yet
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Statement ID', 'Bank', 'File', 'Date', 'Status'].map(h => (
                      <th key={h} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {brsStatements.map((stmt, i) => (
                    <tr key={stmt._id || i} className={tr}>
                      <td className={td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c0392b' }}>
                        {stmt.statementId || stmt._id?.substring(0, 8) || '—'}
                      </td>
                      <td className={td}>{stmt.bankName || '—'}</td>
                      <td className={td}>{stmt.fileName || '—'}</td>
                      <td className={td} style={{ fontSize: 12, color: '#475569' }}>
                        {stmt.uploadDate ? new Date(stmt.uploadDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className={td}>
                        <StatusBadge status={stmt.status || 'Pending'} type={stmt.status === 'Reconciled' ? 'success' : 'info'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Payments / Vouchers ────────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="text-sm font-bold text-gray-800">Payment & Receipt Vouchers</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} — synced from Tally
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                placeholder="Search party..."
                value={voucherSearch}
                onChange={e => setVoucherSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadVouchers()}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 180 }}
              />
              <select
                value={voucherType}
                onChange={e => setVoucherType(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              >
                <option value="">All Types</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
                <option value="Journal">Journal</option>
              </select>
              <button onClick={loadVouchers} style={outlineBtn}>🔍 Filter</button>
              <button onClick={() => setShowPayModal(true)} style={primaryBtn}>+ Add Voucher</button>
            </div>
          </div>

          {voucherLoading ? <Spinner /> : vouchers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No vouchers found. They sync automatically when Tally pushes Payment / Receipt data.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Voucher No.', 'Type', 'Party', 'Date', 'Amount', 'Narration', 'Source', 'Synced At'].map(h => (
                      <th key={h} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v, i) => (
                    <tr key={v._id || i} className={tr}>
                      <td className={td} style={{ fontFamily: 'monospace', fontWeight: 700, color: '#c0392b', fontSize: 11 }}>
                        {v.voucherNumber || '—'}
                      </td>
                      <td className={td}>
                        <StatusBadge
                          status={v.voucherType}
                          type={v.voucherType === 'Receipt' ? 'success' : v.voucherType === 'Payment' ? 'danger' : 'info'}
                        />
                      </td>
                      <td className={td} style={{ fontWeight: 600 }}>{v.partyName || v.partyLedgerName || '—'}</td>
                      <td className={td} style={{ fontSize: 12, color: '#475569' }}>
                        {v.voucherDate ? new Date(v.voucherDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className={td} style={{ fontWeight: 700, color: v.voucherType === 'Receipt' ? '#10b981' : '#ef4444' }}>
                        {fmt(v.amount)}
                      </td>
                      <td className={td} style={{ fontSize: 12, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.narration || '—'}
                      </td>
                      <td className={td}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: v.source === 'Tally' ? '#dcfce7' : '#dbeafe',
                          color: v.source === 'Tally' ? '#166534' : '#1e40af',
                        }}>{v.source || 'Tally'}</span>
                      </td>
                      <td className={td} style={{ fontSize: 11, color: '#94a3b8' }}>
                        {v.syncedAt ? new Date(v.syncedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Credit / Debit Notes ───────────────────────────────────────── */}
      {activeTab === 3 && <CreditNoteTrackerEnhanced />}

      {/* ── Tab 4: Ledger Matching ────────────────────────────────────────────── */}
      {activeTab === 4 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-bold text-gray-800 mb-1">Ledger Matching Engine</div>
          <div className="text-xs text-gray-400 mb-4">Auto-match invoices, payments and credit notes</div>
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Coming soon — will auto-match Tally vouchers against ERP invoices.
          </div>
        </div>
      )}

      {/* ── Add Voucher Modal ─────────────────────────────────────────────────── */}
      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Add Payment / Receipt Voucher">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Party Name *', key: 'partyName', type: 'text', placeholder: 'Customer / Vendor' },
            { label: 'Amount (₹) *', key: 'amount', type: 'number', placeholder: '0.00' },
            { label: 'Date', key: 'voucherDate', type: 'date', placeholder: '' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type}
                value={payForm[key]}
                onChange={e => setPayForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Voucher Type</label>
            <select
              value={payForm.voucherType}
              onChange={e => setPayForm(p => ({ ...p, voucherType: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            >
              <option value="Receipt">Receipt</option>
              <option value="Payment">Payment</option>
              <option value="Journal">Journal</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Narration</label>
            <input
              value={payForm.narration}
              onChange={e => setPayForm(p => ({ ...p, narration: e.target.value }))}
              placeholder="Optional note"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setShowPayModal(false)} style={{ ...outlineBtn, padding: '8px 20px' }}>Cancel</button>
          <button onClick={handleSaveVoucher} disabled={saving} style={{ ...primaryBtn, padding: '8px 20px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Voucher'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
