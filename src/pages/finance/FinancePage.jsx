import React, { useState } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/tables/DataTable';

const tabs = ['Ledger', 'BRS', 'Payments'];

const ledgerEntries = [
  { date: '14 Apr', ref: 'INV-2024-089', description: 'Sales — Tata Motors', debit: '', credit: '₹2,84,000', balance: '₹48,20,000' },
  { date: '14 Apr', ref: 'PO-2024-089', description: 'Purchase — Shree Metals', debit: '₹4,95,600', credit: '', balance: '₹43,24,400' },
  { date: '13 Apr', ref: 'INV-2024-088', description: 'Sales — Mahindra', debit: '', credit: '₹1,56,000', balance: '₹48,20,000' },
  { date: '13 Apr', ref: 'PAY-0234', description: 'Payment Received — Bajaj Auto', debit: '', credit: '₹4,12,000', balance: '₹46,64,000' },
  { date: '12 Apr', ref: 'EXP-0089', description: 'Salary — April 2024', debit: '₹8,40,000', credit: '', balance: '₹42,52,000' },
];

const bankEntries = [
  { date: '14 Apr', description: 'NEFT Credit — Tata Motors', amount: '₹2,84,000', type: 'Credit' },
  { date: '14 Apr', description: 'RTGS Debit — Shree Metals', amount: '₹4,95,600', type: 'Debit' },
  { date: '13 Apr', description: 'NEFT Credit — Mahindra', amount: '₹1,56,000', type: 'Credit' },
];

const systemEntries = [
  { date: '14 Apr', description: 'Invoice INV-2024-089', amount: '₹2,84,000', type: 'Credit' },
  { date: '14 Apr', description: 'PO Payment PO-2024-089', amount: '₹4,95,600', type: 'Debit' },
  { date: '13 Apr', description: 'Invoice INV-2024-088', amount: '₹1,56,000', type: 'Credit' },
];

const payments = [
  { id: 'PAY-0234', party: 'Bajaj Auto', type: 'Received', amount: '₹4,12,000', mode: 'NEFT', date: '13 Apr', status: 'Completed' },
  { id: 'PAY-0233', party: 'Shree Metals', type: 'Made', amount: '₹4,95,600', mode: 'RTGS', date: '14 Apr', status: 'Completed' },
  { id: 'PAY-0232', party: 'Hero MotoCorp', type: 'Received', amount: '₹98,000', mode: 'Cheque', date: '12 Apr', status: 'Pending' },
];

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Finance</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Finance</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>+ Add Payment</button>
      </div>

      {/* KPIs */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Revenue', value: '₹48.2L', color: '#d1fae5', textColor: '#10b981' },
          { label: 'Total Expenses', value: '₹32.1L', color: '#fee2e2', textColor: '#ef4444' },
          { label: 'Net Profit', value: '₹16.1L', color: '#dbeafe', textColor: '#3b82f6' },
          { label: 'Receivables', value: '₹8.4L', color: '#fef3c7', textColor: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="kpi-card" style={{ background: k.color, border: 'none' }}>
            <div className="kpi-value" style={{ color: k.textColor }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {tabs.map((t, i) => <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      {/* Ledger */}
      {activeTab === 0 && (
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 14 }}>General Ledger</div>
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Balance</th></tr></thead>
              <tbody>
                {ledgerEntries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.date}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{e.ref}</td>
                    <td>{e.description}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: e.debit ? 600 : 400 }}>{e.debit || '—'}</td>
                    <td style={{ color: 'var(--success)', fontWeight: e.credit ? 600 : 400 }}>{e.credit || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BRS */}
      {activeTab === 1 && (
        <div className="grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14, color: 'var(--primary)' }}>Bank Statement</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th></tr></thead>
                <tbody>
                  {bankEntries.map((e, i) => (
                    <tr key={i}>
                      <td>{e.date}</td>
                      <td>{e.description}</td>
                      <td style={{ fontWeight: 700, color: e.type === 'Credit' ? 'var(--success)' : 'var(--danger)' }}>{e.amount}</td>
                      <td><StatusBadge status={e.type} type={e.type === 'Credit' ? 'success' : 'danger'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: '#f0fdf4', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>Bank Balance</span>
              <span style={{ fontWeight: 800, color: 'var(--success)' }}>₹43,24,400</span>
            </div>
          </div>
          <div className="card">
            <div style={{ fontWeight: 700, marginBottom: 14, color: 'var(--accent)' }}>System Records</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th></tr></thead>
                <tbody>
                  {systemEntries.map((e, i) => (
                    <tr key={i}>
                      <td>{e.date}</td>
                      <td>{e.description}</td>
                      <td style={{ fontWeight: 700, color: e.type === 'Credit' ? 'var(--success)' : 'var(--danger)' }}>{e.amount}</td>
                      <td><StatusBadge status={e.type} type={e.type === 'Credit' ? 'success' : 'danger'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: '#fffbeb', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600 }}>System Balance</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>₹43,24,400</span>
            </div>
          </div>
        </div>
      )}

      {/* Payments */}
      {activeTab === 2 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'Payment ID', render: v => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{v}</span> },
              { key: 'party', label: 'Party' },
              { key: 'type', label: 'Type', render: v => <StatusBadge status={v} type={v === 'Received' ? 'success' : 'info'} /> },
              { key: 'amount', label: 'Amount', render: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { key: 'mode', label: 'Mode' },
              { key: 'date', label: 'Date' },
              { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
            ]}
            data={payments}
          />
        </div>
      )}

      {/* Add Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Payment</span>
              <button onClick={() => setShowPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label className="form-label">Party Name *</label><input className="form-input" placeholder="Customer / Vendor" /></div>
                <div className="form-group"><label className="form-label">Payment Type</label><select className="form-select"><option>Received</option><option>Made</option></select></div>
                <div className="form-group"><label className="form-label">Amount (₹) *</label><input type="number" className="form-input" placeholder="0.00" /></div>
                <div className="form-group"><label className="form-label">Payment Mode</label><select className="form-select"><option>NEFT</option><option>RTGS</option><option>Cheque</option><option>Cash</option></select></div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" /></div>
                <div className="form-group"><label className="form-label">Reference No.</label><input className="form-input" placeholder="UTR / Cheque No." /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn btn-primary">Save Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
