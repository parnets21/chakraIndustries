import { useState, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { toast } from '../../components/common/Toast';
import { financeApi } from '../../api/financeApi';

const tabs = [
  'Dashboard',
  'Accounts Payable',
  'Accounts Receivable',
  'Supplier Payments',
  'Dealer Receipts',
  'Supplier Ledger',
  'Dealer Ledger',
  'Outstanding Invoices',
  'Bank & Cash Accounts',
  'Payment History',
  'Financial Reports',
  'Vendor Credit Notes',
  'Vendor Debit Notes',
];

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

function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration
  const MOCK_STATS = {
    totalAccountsPayable: 1250000,
    totalAccountsReceivable: 875000,
    totalSupplierOutstanding: 1250000,
    totalDealerOutstanding: 875000,
    paymentsMadeToday: 45000,
    paymentsReceivedToday: 25000,
    overdueSupplierInvoices: 3,
    overdueDealerInvoices: 2,
  };

  const MOCK_TRANSACTIONS = [
    { id: 1, type: 'Payment', party: 'ABC Suppliers', amount: -25000, date: '2026-06-15', status: 'Completed' },
    { id: 2, type: 'Receipt', party: 'XYZ Dealers', amount: 15000, date: '2026-06-15', status: 'Completed' },
    { id: 3, type: 'Invoice', party: 'PQR Vendors', amount: -50000, date: '2026-06-14', status: 'Unpaid' },
    { id: 4, type: 'Invoice', party: 'LMN Traders', amount: 30000, date: '2026-06-14', status: 'Partially Paid' },
    { id: 5, type: 'Payment', party: 'DEF Suppliers', amount: -10000, date: '2026-06-13', status: 'Completed' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from API, if fails use mock data
        const [statsRes, txRes] = await Promise.allSettled([
          financeApi.getDashboardStats(),
          financeApi.getRecentTransactions()
        ]);
        
        if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(statsRes.value.data);
        }
        if (txRes.status === 'fulfilled' && txRes.value?.success) {
          setTransactions(txRes.value.data || []);
        }
      } catch (e) {
        // If anything fails, just use mock data
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Spinner />;

  const mockStats = stats || MOCK_STATS;
  const mockTransactions = transactions.length ? transactions : MOCK_TRANSACTIONS;

  const kpis = [
    { label: 'Total Accounts Payable', value: fmt(mockStats.totalAccountsPayable), color: '#ef4444' },
    { label: 'Total Accounts Receivable', value: fmt(mockStats.totalAccountsReceivable), color: '#10b981' },
    { label: 'Total Supplier Outstanding', value: fmt(mockStats.totalSupplierOutstanding), color: '#f59e0b' },
    { label: 'Total Dealer Outstanding', value: fmt(mockStats.totalDealerOutstanding), color: '#3b82f6' },
    { label: 'Payments Made Today', value: fmt(mockStats.paymentsMadeToday), color: '#8b5cf6' },
    { label: 'Payments Received Today', value: fmt(mockStats.paymentsReceivedToday), color: '#06b6d4' },
  ];

  return (
    <div>
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-2xl font-black tracking-tight" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Overdue Invoices</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center p-4 bg-red-50 rounded-xl">
              <div className="text-3xl font-bold text-red-600">{mockStats.overdueSupplierInvoices}</div>
              <div className="text-xs text-gray-500">Supplier</div>
            </div>
            <div className="flex-1 text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600">{mockStats.overdueDealerInvoices}</div>
              <div className="text-xs text-gray-500">Dealer</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button style={primaryBtn}>Record Payment</button>
            <button style={outlineBtn}>Record Receipt</button>
            <button style={outlineBtn}>Generate Invoice</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Date', 'Type', 'Party', 'Amount', 'Status'].map(h => (
                  <th key={h} className={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((tx) => (
                <tr key={tx.id} className={tr}>
                  <td className={td}>{tx.date}</td>
                  <td className={td}><StatusBadge status={tx.type} type={tx.type === 'Receipt' ? 'success' : tx.type === 'Payment' ? 'danger' : 'info'} /></td>
                  <td className={td} style={{ fontWeight: 600 }}>{tx.party}</td>
                  <td className={td} style={{ fontWeight: 700, color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                    {fmt(Math.abs(tx.amount))}
                  </td>
                  <td className={td}><StatusBadge status={tx.status} type={tx.status === 'Completed' ? 'success' : tx.status === 'Partially Paid' ? 'info' : 'warning'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AccountsPayableTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const MOCK_DATA = [
    { id: 1, supplierName: 'ABC Suppliers', invoiceNumber: 'INV-001', invoiceAmount: 50000, paidAmount: 25000, balanceAmount: 25000, dueDate: '2026-06-20', paymentStatus: 'Partially Paid' },
    { id: 2, supplierName: 'XYZ Vendors', invoiceNumber: 'INV-002', invoiceAmount: 30000, paidAmount: 0, balanceAmount: 30000, dueDate: '2026-06-18', paymentStatus: 'Unpaid' },
    { id: 3, supplierName: 'PQR Traders', invoiceNumber: 'INV-003', invoiceAmount: 45000, paidAmount: 45000, balanceAmount: 0, dueDate: '2026-06-10', paymentStatus: 'Paid' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getAccountsPayable();
        setData(res.data || []);
      } catch (e) {
        // Use mock data if API fails
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : MOCK_DATA;

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Accounts Payable</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} invoices</div>
        </div>
        <button style={primaryBtn}>+ New Payable</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Supplier Name', 'Invoice No', 'Invoice Amount', 'Paid Amount', 'Balance', 'Due Date', 'Status'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td} style={{ fontWeight: 600 }}>{item.supplierName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td}>{fmt(item.invoiceAmount)}</td>
                <td className={td}>{fmt(item.paidAmount)}</td>
                <td className={td} style={{ fontWeight: 700, color: item.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>{fmt(item.balanceAmount)}</td>
                <td className={td}>{item.dueDate}</td>
                <td className={td}>
                  <StatusBadge status={item.paymentStatus} type={item.paymentStatus === 'Paid' ? 'success' : item.paymentStatus === 'Partially Paid' ? 'info' : 'warning'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountsReceivableTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getAccountsReceivable();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load accounts receivable', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, dealerName: 'LMN Dealers', invoiceNumber: 'INV-101', invoiceAmount: 40000, paidAmount: 20000, balanceAmount: 20000, dueDate: '2026-06-25', paymentStatus: 'Partially Paid' },
    { id: 2, dealerName: 'OPQ Traders', invoiceNumber: 'INV-102', invoiceAmount: 25000, paidAmount: 0, balanceAmount: 25000, dueDate: '2026-06-22', paymentStatus: 'Unpaid' },
    { id: 3, dealerName: 'RST Enterprises', invoiceNumber: 'INV-103', invoiceAmount: 60000, paidAmount: 60000, balanceAmount: 0, dueDate: '2026-06-05', paymentStatus: 'Paid' },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Accounts Receivable</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} invoices</div>
        </div>
        <button style={primaryBtn}>+ New Receivable</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Dealer Name', 'Invoice No', 'Invoice Amount', 'Paid Amount', 'Balance', 'Due Date', 'Status'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td} style={{ fontWeight: 600 }}>{item.dealerName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td}>{fmt(item.invoiceAmount)}</td>
                <td className={td}>{fmt(item.paidAmount)}</td>
                <td className={td} style={{ fontWeight: 700, color: item.balanceAmount > 0 ? '#ef4444' : '#10b981' }}>{fmt(item.balanceAmount)}</td>
                <td className={td}>{item.dueDate}</td>
                <td className={td}>
                  <StatusBadge status={item.paymentStatus} type={item.paymentStatus === 'Paid' ? 'success' : item.paymentStatus === 'Partially Paid' ? 'info' : 'warning'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplierPaymentsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getSupplierPayments();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load supplier payments', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, supplierName: 'ABC Suppliers', invoiceNumber: 'INV-001', amount: 25000, date: '2026-06-15', paymentMethod: 'Bank Transfer', status: 'Completed' },
    { id: 2, supplierName: 'PQR Traders', invoiceNumber: 'INV-003', amount: 45000, date: '2026-06-10', paymentMethod: 'Cheque', status: 'Completed' },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Supplier Payments</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} payments</div>
        </div>
        <button style={primaryBtn} onClick={() => setShowModal(true)}>+ Record Payment</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Date', 'Supplier', 'Invoice No', 'Amount', 'Payment Method', 'Status'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td}>{item.date}</td>
                <td className={td} style={{ fontWeight: 600 }}>{item.supplierName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td} style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(item.amount)}</td>
                <td className={td}>{item.paymentMethod}</td>
                <td className={td}><StatusBadge status={item.status} type="success" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Supplier Payment">
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Supplier *</label>
            <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              <option>Select Supplier</option>
              <option>ABC Suppliers</option>
              <option>XYZ Vendors</option>
              <option>PQR Traders</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Invoice *</label>
            <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              <option>Select Invoice</option>
              <option>INV-001 - ₹50,000</option>
              <option>INV-002 - ₹30,000</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Amount *</label>
            <input type="number" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} placeholder="0.00" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Payment Method</label>
            <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              <option>Bank Transfer</option>
              <option>Cheque</option>
              <option>Cash</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={outlineBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button style={primaryBtn}>Save Payment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DealerReceiptsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getDealerReceipts();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load dealer receipts', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, dealerName: 'LMN Dealers', invoiceNumber: 'INV-101', amount: 20000, date: '2026-06-15', paymentMethod: 'UPI', status: 'Completed' },
    { id: 2, dealerName: 'RST Enterprises', invoiceNumber: 'INV-103', amount: 60000, date: '2026-06-05', paymentMethod: 'Bank Transfer', status: 'Completed' },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Dealer Receipts</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} receipts</div>
        </div>
        <button style={primaryBtn} onClick={() => setShowModal(true)}>+ Record Receipt</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Date', 'Dealer', 'Invoice No', 'Amount', 'Payment Method', 'Status'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td}>{item.date}</td>
                <td className={td} style={{ fontWeight: 600 }}>{item.dealerName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td} style={{ fontWeight: 700, color: '#10b981' }}>{fmt(item.amount)}</td>
                <td className={td}>{item.paymentMethod}</td>
                <td className={td}><StatusBadge status={item.status} type="success" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Dealer Receipt">
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Dealer *</label>
            <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              <option>Select Dealer</option>
              <option>LMN Dealers</option>
              <option>OPQ Traders</option>
              <option>RST Enterprises</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Invoice *</label>
            <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              <option>Select Invoice</option>
              <option>INV-101 - ₹40,000</option>
              <option>INV-102 - ₹25,000</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Amount *</label>
            <input type="number" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} placeholder="0.00" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 6 }}>Payment Method</label>
            <select style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
              <option>Bank Transfer</option>
              <option>UPI</option>
              <option>Cash</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button style={outlineBtn} onClick={() => setShowModal(false)}>Cancel</button>
            <button style={primaryBtn}>Save Receipt</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SupplierLedgerTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getSupplierLedger();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load supplier ledger', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, date: '2026-06-01', type: 'Invoice', reference: 'INV-001', debit: 50000, credit: 0, balance: 50000 },
    { id: 2, date: '2026-06-10', type: 'Payment', reference: 'PAY-001', debit: 0, credit: 25000, balance: 25000 },
    { id: 3, date: '2026-06-15', type: 'Payment', reference: 'PAY-002', debit: 0, credit: 25000, balance: 0 },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Supplier Ledger</div>
          <div className="text-xs text-gray-400 mt-0.5">View supplier transactions</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            <option value="">All Suppliers</option>
            <option>ABC Suppliers</option>
            <option>XYZ Vendors</option>
            <option>PQR Traders</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Date', 'Type', 'Reference', 'Debit', 'Credit', 'Balance'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td}>{item.date}</td>
                <td className={td}><StatusBadge status={item.type} type={item.type === 'Invoice' ? 'danger' : 'success'} /></td>
                <td className={td}>{item.reference}</td>
                <td className={td} style={{ fontWeight: 700, color: item.debit > 0 ? '#ef4444' : '#64748b' }}>{item.debit > 0 ? fmt(item.debit) : '—'}</td>
                <td className={td} style={{ fontWeight: 700, color: item.credit > 0 ? '#10b981' : '#64748b' }}>{item.credit > 0 ? fmt(item.credit) : '—'}</td>
                <td className={td} style={{ fontWeight: 700, color: item.balance > 0 ? '#ef4444' : '#10b981' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DealerLedgerTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getDealerLedger();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load dealer ledger', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, date: '2026-06-01', type: 'Invoice', reference: 'INV-101', debit: 0, credit: 40000, balance: 40000 },
    { id: 2, date: '2026-06-10', type: 'Receipt', reference: 'REC-001', debit: 20000, credit: 0, balance: 20000 },
    { id: 3, date: '2026-06-15', type: 'Receipt', reference: 'REC-002', debit: 20000, credit: 0, balance: 0 },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Dealer Ledger</div>
          <div className="text-xs text-gray-400 mt-0.5">View dealer transactions</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedDealer} onChange={(e) => setSelectedDealer(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            <option value="">All Dealers</option>
            <option>LMN Dealers</option>
            <option>OPQ Traders</option>
            <option>RST Enterprises</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Date', 'Type', 'Reference', 'Debit', 'Credit', 'Balance'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td}>{item.date}</td>
                <td className={td}><StatusBadge status={item.type} type={item.type === 'Invoice' ? 'success' : 'danger'} /></td>
                <td className={td}>{item.reference}</td>
                <td className={td} style={{ fontWeight: 700, color: item.debit > 0 ? '#ef4444' : '#64748b' }}>{item.debit > 0 ? fmt(item.debit) : '—'}</td>
                <td className={td} style={{ fontWeight: 700, color: item.credit > 0 ? '#10b981' : '#64748b' }}>{item.credit > 0 ? fmt(item.credit) : '—'}</td>
                <td className={td} style={{ fontWeight: 700, color: item.balance > 0 ? '#ef4444' : '#10b981' }}>{fmt(item.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutstandingInvoicesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getOutstandingInvoices();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load outstanding invoices', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, type: 'Payable', partyName: 'XYZ Vendors', invoiceNumber: 'INV-002', invoiceAmount: 30000, paidAmount: 0, balanceAmount: 30000, dueDate: '2026-06-18', daysOverdue: -3 },
    { id: 2, type: 'Receivable', partyName: 'OPQ Traders', invoiceNumber: 'INV-102', invoiceAmount: 25000, paidAmount: 0, balanceAmount: 25000, dueDate: '2026-06-10', daysOverdue: 5 },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Outstanding Invoices</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} outstanding invoices</div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Type', 'Party', 'Invoice No', 'Amount', 'Paid', 'Balance', 'Due Date', 'Days Overdue'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td}><StatusBadge status={item.type} type={item.type === 'Payable' ? 'danger' : 'success'} /></td>
                <td className={td} style={{ fontWeight: 600 }}>{item.partyName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td}>{fmt(item.invoiceAmount)}</td>
                <td className={td}>{fmt(item.paidAmount)}</td>
                <td className={td} style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(item.balanceAmount)}</td>
                <td className={td}>{item.dueDate}</td>
                <td className={td} style={{ fontWeight: 700, color: item.daysOverdue > 0 ? '#ef4444' : '#10b981' }}>
                  {item.daysOverdue > 0 ? `${item.daysOverdue} days` : 'Not due'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BankCashAccountsTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getBankCashAccounts();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load bank accounts', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, accountName: 'HDFC Current Account', accountNumber: 'XXXX-XXXX-1234', type: 'Bank', balance: 2500000 },
    { id: 2, accountName: 'SBI Savings Account', accountNumber: 'XXXX-XXXX-5678', type: 'Bank', balance: 1500000 },
    { id: 3, accountName: 'Petty Cash', accountNumber: '—', type: 'Cash', balance: 50000 },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Bank & Cash Accounts</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} accounts</div>
        </div>
        <button style={primaryBtn}>+ Add Account</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockData.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="text-sm font-bold text-gray-800">{item.accountName}</div>
                <div className="text-xs text-gray-500">{item.type} • {item.accountNumber}</div>
              </div>
              <StatusBadge status={item.type} type={item.type === 'Bank' ? 'info' : 'warning'} />
            </div>
            <div className="text-2xl font-black text-gray-800">{fmt(item.balance)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentHistoryTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getPaymentHistory();
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load payment history', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mockData = data.length ? data : [
    { id: 1, date: '2026-06-15', type: 'Payment', party: 'ABC Suppliers', amount: 25000, reference: 'PAY-002', method: 'Bank Transfer', status: 'Completed' },
    { id: 2, date: '2026-06-15', type: 'Receipt', party: 'LMN Dealers', amount: 20000, reference: 'REC-002', method: 'UPI', status: 'Completed' },
    { id: 3, date: '2026-06-10', type: 'Payment', party: 'PQR Traders', amount: 45000, reference: 'PAY-001', method: 'Cheque', status: 'Completed' },
    { id: 4, date: '2026-06-05', type: 'Receipt', party: 'RST Enterprises', amount: 60000, reference: 'REC-001', method: 'Bank Transfer', status: 'Completed' },
  ];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Payment History</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} transactions</div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Date', 'Type', 'Party', 'Reference', 'Amount', 'Method', 'Status'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td}>{item.date}</td>
                <td className={td}><StatusBadge status={item.type} type={item.type === 'Receipt' ? 'success' : 'danger'} /></td>
                <td className={td} style={{ fontWeight: 600 }}>{item.party}</td>
                <td className={td}>{item.reference}</td>
                <td className={td} style={{ fontWeight: 700, color: item.type === 'Receipt' ? '#10b981' : '#ef4444' }}>
                  {fmt(item.amount)}
                </td>
                <td className={td}>{item.method}</td>
                <td className={td}><StatusBadge status={item.status} type="success" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancialReportsTab() {
  const reportTypes = ['Profit & Loss', 'Balance Sheet', 'Cash Flow Statement', 'Trial Balance'];
  const [selectedReport, setSelectedReport] = useState(reportTypes[0]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Financial Reports</div>
          <div className="text-xs text-gray-400 mt-0.5">Generate financial statements</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button style={primaryBtn}>Generate Report</button>
          <button style={outlineBtn}>Export</button>
        </div>
      </div>
      <div className="p-8 text-center text-gray-500">
        <div className="text-lg font-medium mb-2">{selectedReport}</div>
        <div className="text-sm">Select date range and click "Generate Report" to view the {selectedReport.toLowerCase()}</div>
      </div>
    </div>
  );
}

function VendorCreditNotesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getVendorCreditNotes(selectedVendor);
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load vendor credit notes', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedVendor]);

  const mockData = data.length ? data : [
    { id: 1, cnId: 'CN-001', vendorName: 'ABC Suppliers', invoiceNumber: 'INV-001', amount: 25000, status: 'Open', date: '2026-06-15' },
    { id: 2, cnId: 'CN-002', vendorName: 'XYZ Vendors', invoiceNumber: 'INV-002', amount: 15000, status: 'Closed', date: '2026-06-10' },
  ];

  const uniqueVendors = [...new Set(mockData.map(item => item.vendorName))];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Vendor Credit Notes</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} credit notes</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            <option value="">All Vendors</option>
            {uniqueVendors.map(vendor => <option key={vendor} value={vendor}>{vendor}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['CN ID', 'Vendor Name', 'Invoice No', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td} style={{ fontWeight: 600, color: '#3b82f6' }}>{item.cnId}</td>
                <td className={td} style={{ fontWeight: 600 }}>{item.vendorName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td} style={{ fontWeight: 700, color: '#10b981' }}>{fmt(item.amount)}</td>
                <td className={td}>
                  <StatusBadge status={item.status} type={item.status === 'Closed' ? 'success' : item.status === 'Disputed' ? 'danger' : 'warning'} />
                </td>
                <td className={td}>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorDebitNotesTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await financeApi.getVendorDebitNotes(selectedVendor);
        setData(res.data || []);
      } catch (e) {
        toast('Failed to load vendor debit notes', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedVendor]);

  const mockData = data.length ? data : [
    { id: 1, dnId: 'DN-001', vendorName: 'ABC Suppliers', invoiceNumber: 'INV-001', amount: 30000, status: 'Pending', date: '2026-06-15' },
    { id: 2, dnId: 'DN-002', vendorName: 'XYZ Vendors', invoiceNumber: 'INV-002', amount: 20000, status: 'Approved', date: '2026-06-10' },
  ];

  const uniqueVendors = [...new Set(mockData.map(item => item.vendorName))];

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="text-sm font-bold text-gray-800">Vendor Debit Notes</div>
          <div className="text-xs text-gray-400 mt-0.5">{mockData.length} debit notes</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
            <option value="">All Vendors</option>
            {uniqueVendors.map(vendor => <option key={vendor} value={vendor}>{vendor}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['DN ID', 'Vendor Name', 'Invoice No', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} className={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockData.map((item) => (
              <tr key={item.id} className={tr}>
                <td className={td} style={{ fontWeight: 600, color: '#ef4444' }}>{item.dnId}</td>
                <td className={td} style={{ fontWeight: 600 }}>{item.vendorName}</td>
                <td className={td}>{item.invoiceNumber}</td>
                <td className={td} style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(item.amount)}</td>
                <td className={td}>
                  <StatusBadge status={item.status} type={item.status === 'Approved' ? 'success' : item.status === 'Rejected' ? 'danger' : 'warning'} />
                </td>
                <td className={td}>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tabComponents = {
  0: DashboardTab,
  1: AccountsPayableTab,
  2: AccountsReceivableTab,
  3: SupplierPaymentsTab,
  4: DealerReceiptsTab,
  5: SupplierLedgerTab,
  6: DealerLedgerTab,
  7: OutstandingInvoicesTab,
  8: BankCashAccountsTab,
  9: PaymentHistoryTab,
  10: FinancialReportsTab,
  11: VendorCreditNotesTab,
  12: VendorDebitNotesTab,
};

export default function FinancePage({ initialTab = 0 }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const ActiveTabComponent = tabComponents[activeTab];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '2px solid #f1f5f9', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 2 }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            padding: '8px 18px', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
            border: 'none', background: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            color: activeTab === i ? '#c0392b' : '#64748b',
            borderBottom: activeTab === i ? '2px solid #c0392b' : '2px solid transparent',
            marginBottom: -2, whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>

      <ActiveTabComponent />
    </div>
  );
}
