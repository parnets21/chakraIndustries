import { useState, useEffect, useCallback } from 'react';
import { 
  MdRefresh, MdAdd, MdEdit, MdDelete, MdSync, 
  MdReceipt, MdCheckCircle, MdWarning, MdInfo,
  MdClose, MdSearch, MdCurrencyRupee, MdPerson,
  MdDescription, MdLocalShipping, MdVerifiedUser
} from 'react-icons/md';

// ─── Toast Component ───────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
    error: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    info: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
  };

  const style = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      background: style.bg,
      color: style.text,
      borderLeft: `4px solid ${style.border}`,
      padding: '12px 20px',
      borderRadius: 10,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      {type === 'success' && <MdCheckCircle size={18} />}
      {type === 'error' && <MdWarning size={18} />}
      {type === 'info' && <MdInfo size={18} />}
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
    </div>
  );
};

// ─── Complete Seed Data (No API dependency) ─────────────────────────────────
const SEED_DATA = [
  {
    id: 'MR-2026-00101',
    party: 'Rajesh Traders',
    invoice: 'INV-2026-1001',
    invoiceDate: '2026-04-10',
    creditNote: 'CN-2026-501',
    cnAmount: 15000,
    debitNote: 'DN-2026-301',
    dnAmount: 15000,
    difference: 0,
    matchStatus: 'Matched',
    tallySync: 'Synced',
    returnValue: 15000,
    returnType: 'Material Return',
    gst: '18%',
    financeStatus: 'Closed',
    voucherNo: 'V-2026-801',
    assignedTo: 'Amit Kumar',
    lastUpdated: '2026-04-15',
    aging: '35 days',
  },
  {
    id: 'MR-2026-00102',
    party: 'Sunita Enterprises',
    invoice: 'INV-2026-1002',
    invoiceDate: '2026-04-12',
    creditNote: 'CN-2026-502',
    cnAmount: 22000,
    debitNote: 'DN-2026-302',
    dnAmount: 20000,
    difference: 2000,
    matchStatus: 'Partial',
    tallySync: 'Not synced',
    returnValue: 22000,
    returnType: 'Sales Return',
    gst: '12%',
    financeStatus: 'Pending',
    voucherNo: '—',
    assignedTo: 'Kiran Sharma',
    lastUpdated: '2026-04-20',
    aging: '28 days',
  },
  {
    id: 'MR-2026-00103',
    party: 'Mehta & Co.',
    invoice: 'INV-2026-1003',
    invoiceDate: '2026-04-18',
    creditNote: 'Not generated',
    cnAmount: 0,
    debitNote: '—',
    dnAmount: 0,
    difference: 8500,
    matchStatus: 'Open',
    tallySync: 'Not synced',
    returnValue: 8500,
    returnType: 'Damage Return',
    gst: '18%',
    financeStatus: 'Pending',
    voucherNo: '—',
    assignedTo: 'Self',
    lastUpdated: '2026-04-18',
    aging: '12 days',
  },
  {
    id: 'MR-2026-00104',
    party: 'Patel Distributors',
    invoice: 'INV-2026-1004',
    invoiceDate: '2026-03-25',
    creditNote: 'CN-2026-503',
    cnAmount: 31000,
    debitNote: 'DN-2026-303',
    dnAmount: 31000,
    difference: 0,
    matchStatus: 'Matched',
    tallySync: 'Synced',
    returnValue: 31000,
    returnType: 'Material Return',
    gst: '18%',
    financeStatus: 'Closed',
    voucherNo: 'V-2026-802',
    assignedTo: 'Adarsh Singh',
    lastUpdated: '2026-04-02',
    aging: '55 days',
  },
  {
    id: 'MR-2026-00105',
    party: 'Verma Suppliers',
    invoice: 'INV-2026-1005',
    invoiceDate: '2026-05-01',
    creditNote: 'Not generated',
    cnAmount: 0,
    debitNote: '—',
    dnAmount: 0,
    difference: 12750,
    matchStatus: 'Open',
    tallySync: 'Not synced',
    returnValue: 12750,
    returnType: 'Sales Return',
    gst: '5%',
    financeStatus: 'Pending',
    voucherNo: '—',
    assignedTo: 'Self',
    lastUpdated: '2026-05-01',
    aging: '0 days',
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────
function getMatchStatusColor(status) {
  switch (status) {
    case 'Matched': return 'bg-green-100 text-green-700';
    case 'Partial': return 'bg-yellow-100 text-yellow-700';
    case 'Open': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getTallySyncIcon(sync) {
  if (sync === 'Synced') return { icon: <MdCheckCircle size={14} />, cls: 'text-green-600' };
  if (sync === 'Not synced') return { icon: <MdWarning size={14} />, cls: 'text-red-500' };
  return { icon: <MdSync size={14} />, cls: 'text-yellow-500' };
}

function formatCurrency(n) {
  if (!n || n === 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

// ─── Field Component ──────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DebitCreditMatchingPage({ linkedReturns = [] }) {
  const [matchingData, setMatchingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState(null);

  const [stats, setStats] = useState({
    fullyMatched: 0,
    partialMismatch: 0,
    cnNotGenerated: 0,
    totalLossAmount: 0,
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const emptyEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    return {
      docket: `MR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      returnType: 'Material Return',
      party: '',
      invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
      invoiceDate: today,
      cnNo: 'Not generated',
      cnAmount: 0,
      dnNo: '—',
      dnAmount: 0,
      difference: 0,
      gst: '18%',
      financeStatus: 'Pending',
      matchStatus: 'Open',
      tallySync: 'Not synced',
      voucherNo: '—',
      assignedTo: 'Self',
      lastUpdated: today,
      returnValue: '',
    };
  };

  const [newEntry, setNewEntry] = useState(emptyEntry);
  const [editForm, setEditForm] = useState(null);

  // ─── Load Data from Local Storage or Seed Data ────────────────────────────────
  const loadMatchingData = useCallback(() => {
    setLoading(true);
    try {
      const savedData = localStorage.getItem('debit_credit_matching_data');
      
      if (savedData && JSON.parse(savedData).length > 0) {
        const parsedData = JSON.parse(savedData);
        setMatchingData(parsedData);
        showToast(`Loaded ${parsedData.length} records from local storage`, 'success');
      } else if (linkedReturns && linkedReturns.length > 0) {
        const linkedRows = linkedReturns.map(r => ({
          id: r.mrId || r.id,
          party: r.supplierName || r.customerName || 'Unknown',
          invoice: r.invoiceNo || '',
          invoiceDate: r.invoiceDate || new Date().toISOString().split('T')[0],
          creditNote: 'Not generated',
          cnAmount: 0,
          debitNote: '—',
          dnAmount: 0,
          difference: r.value || 0,
          matchStatus: 'Open',
          tallySync: 'Not synced',
          returnValue: r.value || 0,
          returnType: r.returnType || 'Material Return',
          gst: '18%',
          financeStatus: 'Pending',
          voucherNo: '—',
          assignedTo: 'Accounts',
          lastUpdated: new Date().toISOString().split('T')[0],
          aging: '0 days',
        }));
        setMatchingData(linkedRows);
        showToast(`Loaded ${linkedRows.length} records from linked returns`, 'info');
      } else {
        setMatchingData(SEED_DATA);
        showToast('Using sample data', 'info');
      }
    } catch (err) {
      console.error('loadMatchingData error:', err);
      setMatchingData(SEED_DATA);
      showToast('Error loading data. Using sample data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [linkedReturns]);

  // ─── Save to Local Storage ──────────────────────────────────────────────────
  const saveToLocalStorage = useCallback((data) => {
    try {
      localStorage.setItem('debit_credit_matching_data', JSON.stringify(data));
    } catch (err) {
      console.error('Save to localStorage failed:', err);
    }
  }, []);

  // ─── updateStats ─────────────────────────────────────────────────────────────
  const updateStats = useCallback((data) => {
    setStats({
      fullyMatched: data.filter(r => r.matchStatus === 'Matched').length,
      partialMismatch: data.filter(r => r.matchStatus === 'Partial').length,
      cnNotGenerated: data.filter(r => r.creditNote === 'Not generated' || r.cnAmount === 0).length,
      totalLossAmount: data.reduce((acc, r) => acc + (Number(r.difference) || 0), 0),
    });
  }, []);

  // ─── filterData ──────────────────────────────────────────────────────────────
  const filterData = useCallback(() => {
    let result = [...matchingData];

    if (statusFilter !== 'All') {
      result = result.filter(r => r.matchStatus === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(r =>
        (r.id || '').toLowerCase().includes(q) ||
        (r.party || '').toLowerCase().includes(q) ||
        (r.invoice || '').toLowerCase().includes(q) ||
        (r.creditNote || '').toLowerCase().includes(q)
      );
    }

    setFilteredData(result);
    updateStats(matchingData);
  }, [matchingData, searchTerm, statusFilter, updateStats]);

  // ─── handleGenerateCreditNote ────────────────────────────────────────────────
  const handleGenerateCreditNote = (id) => {
    setMatchingData(prev => {
      const updated = prev.map(r => {
        if (r.id !== id) return r;
        const cnNo = `CN-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
        const cnAmount = r.returnValue || r.cnAmount || 0;
        const diff = Math.abs(cnAmount - (r.dnAmount || 0));
        return {
          ...r,
          creditNote: cnNo,
          cnAmount: cnAmount,
          difference: diff,
          matchStatus: diff === 0 ? 'Matched' : 'Partial',
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      });
      saveToLocalStorage(updated);
      return updated;
    });
    showToast(`Credit Note generated for ${id}`, 'success');
  };

  // ─── handleSyncWithTally ─────────────────────────────────────────────────────
  const handleSyncWithTally = (id) => {
    setMatchingData(prev => {
      const updated = prev.map(r => {
        if (r.id !== id) return r;
        const vNo = `V-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
        return {
          ...r,
          tallySync: 'Synced',
          voucherNo: vNo,
          financeStatus: 'Closed',
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      });
      saveToLocalStorage(updated);
      return updated;
    });
    showToast(`Tally sync successful for ${id}`, 'success');
  };

  // ─── handleEdit ──────────────────────────────────────────────────────────────
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      id: item.id,
      party: item.party,
      invoice: item.invoice,
      invoiceDate: item.invoiceDate,
      returnValue: item.returnValue,
      returnType: item.returnType,
      gst: item.gst,
      assignedTo: item.assignedTo,
      creditNote: item.creditNote,
      cnAmount: item.cnAmount,
      debitNote: item.debitNote,
      dnAmount: item.dnAmount,
      matchStatus: item.matchStatus,
      tallySync: item.tallySync,
      financeStatus: item.financeStatus,
      voucherNo: item.voucherNo,
    });
    setShowEditModal(true);
  };

  // ─── handleUpdateSubmit ──────────────────────────────────────────────────────
  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    
    setMatchingData(prev => {
      const updated = prev.map(r => {
        if (r.id !== editingItem.id) return r;
        const diff = Math.abs((editForm.cnAmount || 0) - (editForm.dnAmount || 0));
        return {
          ...r,
          party: editForm.party,
          invoice: editForm.invoice,
          invoiceDate: editForm.invoiceDate,
          returnValue: parseFloat(editForm.returnValue) || 0,
          returnType: editForm.returnType,
          gst: editForm.gst,
          assignedTo: editForm.assignedTo,
          creditNote: editForm.creditNote,
          cnAmount: parseFloat(editForm.cnAmount) || 0,
          debitNote: editForm.debitNote,
          dnAmount: parseFloat(editForm.dnAmount) || 0,
          difference: diff,
          matchStatus: diff === 0 && editForm.creditNote !== 'Not generated' ? 'Matched' : diff > 0 ? 'Partial' : 'Open',
          tallySync: editForm.tallySync,
          financeStatus: editForm.financeStatus,
          voucherNo: editForm.voucherNo,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      });
      saveToLocalStorage(updated);
      return updated;
    });
    
    setShowEditModal(false);
    setEditingItem(null);
    setEditForm(null);
    showToast(`Record ${editingItem.id} updated successfully`, 'success');
  };

  // ─── handleDelete ────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    if (window.confirm(`Are you sure you want to delete ${id}?`)) {
      setMatchingData(prev => {
        const updated = prev.filter(r => r.id !== id);
        saveToLocalStorage(updated);
        return updated;
      });
      showToast(`Record ${id} deleted successfully`, 'success');
    }
  };

  // ─── handleCreateNew ─────────────────────────────────────────────────────────
  const handleCreateNew = () => {
    setNewEntry(emptyEntry());
    setShowCreateModal(true);
  };

  // ─── handleSubmitCreate ──────────────────────────────────────────────────────
  const handleSubmitCreate = (e) => {
    e.preventDefault();

    if (!newEntry.party || !newEntry.returnValue) {
      showToast('Party Name and Return Value are required', 'error');
      return;
    }

    const item = {
      id: newEntry.docket,
      party: newEntry.party,
      invoice: newEntry.invoiceNo,
      invoiceDate: newEntry.invoiceDate,
      creditNote: newEntry.cnNo,
      cnAmount: parseFloat(newEntry.cnAmount) || 0,
      debitNote: newEntry.dnNo,
      dnAmount: parseFloat(newEntry.dnAmount) || 0,
      difference: parseFloat(newEntry.difference) || 0,
      matchStatus: newEntry.matchStatus,
      tallySync: newEntry.tallySync,
      returnValue: parseFloat(newEntry.returnValue) || 0,
      returnType: newEntry.returnType,
      gst: newEntry.gst,
      financeStatus: newEntry.financeStatus,
      voucherNo: newEntry.voucherNo,
      assignedTo: newEntry.assignedTo,
      lastUpdated: newEntry.lastUpdated,
      aging: '0 days',
    };

    setMatchingData(prev => {
      const updated = [item, ...prev];
      saveToLocalStorage(updated);
      return updated;
    });
    setShowCreateModal(false);
    showToast('New Debit/Credit Matching created successfully!', 'success');
  };

  // ─── handleResetData ─────────────────────────────────────────────────────────
  const handleResetData = () => {
    if (window.confirm('Reset all data to default sample data?')) {
      setMatchingData(SEED_DATA);
      saveToLocalStorage(SEED_DATA);
      showToast('Data reset to default sample data', 'info');
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadMatchingData();
  }, [loadMatchingData]);

  useEffect(() => {
    filterData();
  }, [filterData]);

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (loading && matchingData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 text-lg">Loading matching data...</div>
      </div>
    );
  }

  // ─── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Toast */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MdReceipt className="text-red-600" size={28} />
            Debit / Credit Matching
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and reconcile debit/credit notes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <MdRefresh size={18} /> Reset Data
          </button>
          <button
            onClick={handleCreateNew}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <MdAdd size={18} /> New Entry
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-green-600">{stats.fullyMatched}</p>
            <MdCheckCircle className="text-green-500" size={24} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Fully Matched</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-yellow-600">{stats.partialMismatch}</p>
            <MdWarning className="text-yellow-500" size={24} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Partial Mismatch</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-red-600">{stats.cnNotGenerated}</p>
            <MdReceipt className="text-red-500" size={24} />
          </div>
          <p className="text-sm text-gray-500 mt-1">CN Not Generated</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalLossAmount)}</p>
            <MdCurrencyRupee className="text-purple-500" size={24} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Total Loss Amount</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex-1 min-w-[220px] relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by party, invoice, docket..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Matched', 'Partial', 'Open'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-auto">{filteredData.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Docket', 'Party', 'Invoice', 'CN No', 'CN Amt', 'DN No', 'DN Amt', 'Diff', 'Status', 'Tally', 'Actions'].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-10 text-gray-400">No records found</td>
              </tr>
            ) : (
              filteredData.map((r, idx) => {
                const sync = getTallySyncIcon(r.tallySync);
                return (
                  <tr key={r.id || idx} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-3 py-3 font-mono text-xs text-blue-600 font-medium whitespace-nowrap">{r.id}</td>
                    <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{r.party}</td>
                    <td className="px-3 py-3 text-gray-600 text-xs whitespace-nowrap">{r.invoice}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{r.creditNote}</td>
                    <td className="px-3 py-3 text-right text-green-700 font-medium">{r.cnAmount > 0 ? formatCurrency(r.cnAmount) : '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{r.debitNote}</td>
                    <td className="px-3 py-3 text-right text-blue-700 font-medium">{r.dnAmount > 0 ? formatCurrency(r.dnAmount) : '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-red-600">{r.difference > 0 ? formatCurrency(r.difference) : '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMatchStatusColor(r.matchStatus)}`}>
                        {r.matchStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={sync.cls} title={r.tallySync}>{sync.icon}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5 flex-nowrap">
                        {r.creditNote === 'Not generated' && (
                          <button
                            onClick={() => handleGenerateCreditNote(r.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg whitespace-nowrap transition-colors flex items-center gap-1"
                            title="Generate Credit Note"
                          >
                            <MdReceipt size={12} /> Gen CN
                          </button>
                        )}
                        {r.tallySync !== 'Synced' && r.creditNote !== 'Not generated' && (
                          <button
                            onClick={() => handleSyncWithTally(r.id)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg whitespace-nowrap transition-colors flex items-center gap-1"
                            title="Sync with Tally"
                          >
                            <MdSync size={12} /> Sync
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(r)}
                          className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg whitespace-nowrap transition-colors flex items-center gap-1"
                          title="Edit Record"
                        >
                          <MdEdit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg whitespace-nowrap transition-colors flex items-center gap-1"
                          title="Delete Record"
                        >
                          <MdDelete size={12} /> Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MdAdd className="text-red-600" size={24} />
                Create New Debit / Credit Matching
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="p-6 overflow-y-auto max-h-[75vh] bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Docket (Auto-generated)">
                  <input type="text" readOnly value={newEntry.docket}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm" />
                </Field>

                <Field label="Return Type">
                  <select value={newEntry.returnType}
                    onChange={e => setNewEntry({...newEntry, returnType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>Material Return</option>
                    <option>Sales Return</option>
                    <option>Damage Return</option>
                  </select>
                </Field>

                <Field label="Supplier / Party *">
                  <input type="text" required placeholder="e.g. Rajesh Traders"
                    value={newEntry.party}
                    onChange={e => setNewEntry({...newEntry, party: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Invoice No">
                  <input type="text" value={newEntry.invoiceNo}
                    onChange={e => setNewEntry({...newEntry, invoiceNo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Invoice Date">
                  <input type="date" value={newEntry.invoiceDate}
                    onChange={e => setNewEntry({...newEntry, invoiceDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="GST (%)">
                  <select value={newEntry.gst}
                    onChange={e => setNewEntry({...newEntry, gst: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>5%</option><option>12%</option><option>18%</option><option>28%</option>
                  </select>
                </Field>

                <Field label="Return Value (₹) *">
                  <input type="number" required placeholder="50000" min="1"
                    value={newEntry.returnValue}
                    onChange={e => {
                      const val = e.target.value;
                      setNewEntry({...newEntry, returnValue: val});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Assigned To">
                  <input type="text" value={newEntry.assignedTo}
                    onChange={e => setNewEntry({...newEntry, assignedTo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="CN No (Auto)">
                  <input type="text" readOnly value="Not generated"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm" />
                </Field>
                <Field label="DN No (Auto)">
                  <input type="text" readOnly value="—"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm" />
                </Field>
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors text-sm flex items-center justify-center gap-2">
                  <MdAdd size={18} /> Create Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MdEdit className="text-blue-600" size={24} />
                Edit Debit / Credit Matching
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 overflow-y-auto max-h-[75vh] bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Docket">
                  <input type="text" readOnly value={editForm.id}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm" />
                </Field>

                <Field label="Return Type">
                  <select value={editForm.returnType}
                    onChange={e => setEditForm({...editForm, returnType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>Material Return</option>
                    <option>Sales Return</option>
                    <option>Damage Return</option>
                  </select>
                </Field>

                <Field label="Supplier / Party *">
                  <input type="text" required value={editForm.party}
                    onChange={e => setEditForm({...editForm, party: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Invoice No">
                  <input type="text" value={editForm.invoice}
                    onChange={e => setEditForm({...editForm, invoice: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Invoice Date">
                  <input type="date" value={editForm.invoiceDate}
                    onChange={e => setEditForm({...editForm, invoiceDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="GST (%)">
                  <select value={editForm.gst}
                    onChange={e => setEditForm({...editForm, gst: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>5%</option><option>12%</option><option>18%</option><option>28%</option>
                  </select>
                </Field>

                <Field label="Return Value (₹)">
                  <input type="number" value={editForm.returnValue}
                    onChange={e => setEditForm({...editForm, returnValue: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Assigned To">
                  <input type="text" value={editForm.assignedTo}
                    onChange={e => setEditForm({...editForm, assignedTo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Credit Note No">
                  <input type="text" value={editForm.creditNote}
                    onChange={e => setEditForm({...editForm, creditNote: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Credit Note Amount (₹)">
                  <input type="number" value={editForm.cnAmount}
                    onChange={e => setEditForm({...editForm, cnAmount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Debit Note No">
                  <input type="text" value={editForm.debitNote}
                    onChange={e => setEditForm({...editForm, debitNote: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Debit Note Amount (₹)">
                  <input type="number" value={editForm.dnAmount}
                    onChange={e => setEditForm({...editForm, dnAmount: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>

                <Field label="Match Status">
                  <select value={editForm.matchStatus}
                    onChange={e => setEditForm({...editForm, matchStatus: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>Open</option><option>Partial</option><option>Matched</option>
                  </select>
                </Field>

                <Field label="Finance Status">
                  <select value={editForm.financeStatus}
                    onChange={e => setEditForm({...editForm, financeStatus: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>Pending</option><option>Closed</option>
                  </select>
                </Field>

                <Field label="Tally Sync">
                  <select value={editForm.tallySync}
                    onChange={e => setEditForm({...editForm, tallySync: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none">
                    <option>Not synced</option><option>Synced</option>
                  </select>
                </Field>

                <Field label="Voucher No">
                  <input type="text" value={editForm.voucherNo}
                    onChange={e => setEditForm({...editForm, voucherNo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                </Field>
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3.5 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors text-sm flex items-center justify-center gap-2">
                  <MdEdit size={18} /> Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}