import { useState } from 'react';
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

  const kpis = [
    { label: 'Total Revenue', value: '₹48.2L', color: '#10b981' },
    { label: 'Total Expenses', value: '₹32.1L', color: '#ef4444' },
    { label: 'Net Profit', value: '₹16.1L', color: '#3b82f6' },
    { label: 'Receivables', value: '₹8.4L', color: '#f59e0b' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="page-title">Finance</div>
          <div className="breadcrumb"><span>Home</span><span>›</span><span className="current">Finance</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPayModal(true)}>+ Add Payment</button>
      </div>

      <div className="grid-4" style={{ marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi-card">
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {tabs.map((t, i) => <div key={i} className={`tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>)}
      </div>

      {activeTab === 0 && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 14 }}>General Ledger</div>
          <div className="table-container">
            <table>
              <thead><tr>{['Date','Reference','Description','Debit (₹)','Credit (₹)','Balance'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {ledgerEntries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.date}</td>
                    <td style={{ fontWeight: 600, color: '#c0392b' }}>{e.ref}</td>
                    <td>{e.description}</td>
                    <td style={{ color: '#e74c3c', fontWeight: e.debit ? 600 : 400 }}>{e.debit || '—'}</td>
                    <td style={{ color: '#27ae60', fontWeight: e.credit ? 600 : 400 }}>{e.credit || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="grid-2">
          {[
            { title: 'Bank Statement', entries: bankEntries, titleColor: '#c0392b', balanceColor: '#27ae60', balanceBg: '#f0fdf4', balance: '₹43,24,400', balanceLabel: 'Bank Balance' },
            { title: 'System Records', entries: systemEntries, titleColor: '#f39c12', balanceColor: '#f39c12', balanceBg: '#fffbeb', balance: '₹43,24,400', balanceLabel: 'System Balance' }
          ].map((section, si) => (
            <div key={si} className="card">
              <div className="section-title" style={{ color: section.titleColor, marginBottom: 14 }}>{section.title}</div>
              <div className="table-container">
                <table>
                  <thead><tr>{['Date','Description','Amount','Type'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {section.entries.map((e, i) => (
                      <tr key={i}>
                        <td>{e.date}</td>
                        <td>{e.description}</td>
                        <td style={{ fontWeight: 700, color: e.type === 'Credit' ? '#27ae60' : '#e74c3c' }}>{e.amount}</td>
                        <td><StatusBadge status={e.type} type={e.type === 'Credit' ? 'success' : 'danger'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 14, padding: 12, borderRadius: 8, display: 'flex', justifyContent: 'space-between', background: section.balanceBg }}>
                <span style={{ fontWeight: 600 }}>{section.balanceLabel}</span>
                <span style={{ fontWeight: 800, color: section.balanceColor }}>{section.balance}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 2 && (
        <div className="card">
          <DataTable
            columns={[
              { key: 'id', label: 'Payment ID', render: v => <span style={{ fontWeight: 600, color: '#c0392b' }}>{v}</span> },
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

      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Payment</span>
              <button className="btn btn-sm" style={{ background: 'none', color: '#718096', fontSize: 20, padding: '0 4px' }} onClick={() => setShowPayModal(false)}>×</button>
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
