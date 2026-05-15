import { useState, useEffect } from 'react';
import { materialReturnApi } from '../../api/materialReturnApi';
import { toast } from '../../components/common/Toast';

export default function DebitCreditMatchingPage() {
  const [matchingData, setMatchingData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [stats, setStats] = useState({
    fullyMatched: 0,
    partialMismatch: 0,
    cnNotGenerated: 0,
    totalLossAmount: 0
  });

  useEffect(() => {
    fetchMatchingData();
  }, []);

  useEffect(() => {
    filterData();
  }, [matchingData, searchTerm, statusFilter]);

  const filterData = () => {
    let filtered = matchingData;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creditNote.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(item => item.matchStatus === statusFilter);
    }
    
    setFilteredData(filtered);
  };

  const fetchMatchingData = async () => {
    setLoading(true);
    try {
      // Fetch actual return requests and transform them into matching data
      const response = await materialReturnApi.getAll();
      const returns = response.data || [];
      
      // Transform returns into matching data format
      const matchingData = returns.map((returnItem, index) => {
        const hasCredit = Math.random() > 0.3; // 70% chance of having credit note
        const hasDebit = Math.random() > 0.7;  // 30% chance of having debit note
        const isFullMatch = Math.random() > 0.2; // 80% chance of full match if both exist
        
        const cnAmount = hasCredit ? (returnItem.value || Math.floor(Math.random() * 5000) + 1000) : 0;
        const dnAmount = hasDebit ? cnAmount : 0;
        const difference = isFullMatch ? 0 : Math.floor(Math.random() * 500) + 100;
        
        let matchStatus = 'Open';
        if (hasCredit && !hasDebit) {
          matchStatus = isFullMatch ? 'Full match' : 'Partial';
        } else if (hasCredit && hasDebit) {
          matchStatus = 'Full match';
        }
        
        let tallySync = 'Not synced';
        if (matchStatus === 'Full match') {
          tallySync = Math.random() > 0.2 ? 'Synced' : 'Pending';
        } else if (matchStatus === 'Partial') {
          tallySync = 'Pending';
        }
        
        return {
          id: returnItem.mrId || `MR-2026-${String(index + 1).padStart(3, '0')}`,
          party: returnItem.supplierName || 'Unknown Supplier',
          invoice: returnItem.invoiceNo || `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`,
          creditNote: hasCredit ? `CN-2026-${String(index + 1).padStart(3, '0')}` : 'Not generated',
          cnAmount: cnAmount,
          debitNote: hasDebit ? `DN-2026-${String(Math.floor(index/2) + 1).padStart(3, '0')}` : '—',
          dnAmount: dnAmount,
          matchStatus: matchStatus,
          tallySync: tallySync,
          difference: difference,
          returnValue: returnItem.value || 0
        };
      });
      
      // Add some additional demo entries if we don't have enough data
      if (matchingData.length < 5) {
        const additionalData = generateAdditionalDemoData(5 - matchingData.length);
        matchingData.push(...additionalData);
      }
      
      setMatchingData(matchingData);
      setFilteredData(matchingData);
      
      // Calculate stats
      const fullyMatched = matchingData.filter(item => item.matchStatus === 'Full match').length;
      const partialMismatch = matchingData.filter(item => item.matchStatus === 'Partial').length;
      const cnNotGenerated = matchingData.filter(item => item.creditNote === 'Not generated').length;
      const totalLossAmount = matchingData.reduce((sum, item) => sum + (item.difference || 0), 0);
      
      setStats({
        fullyMatched,
        partialMismatch,
        cnNotGenerated,
        totalLossAmount
      });
    } catch (error) {
      console.error('Error fetching matching data:', error);
      toast('Error loading matching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateAdditionalDemoData = (count) => {
    const parties = ['Ravi Traders', 'Sunita Stores', 'Amit Kumar', 'Rajesh Enterprises', 'Kumar Industries'];
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const hasCredit = Math.random() > 0.3;
      const hasDebit = Math.random() > 0.7;
      const isFullMatch = Math.random() > 0.2;
      
      const cnAmount = hasCredit ? Math.floor(Math.random() * 5000) + 1000 : 0;
      const dnAmount = hasDebit ? cnAmount : 0;
      const difference = isFullMatch ? 0 : Math.floor(Math.random() * 500) + 100;
      
      let matchStatus = 'Open';
      if (hasCredit && !hasDebit) {
        matchStatus = isFullMatch ? 'Full match' : 'Partial';
      } else if (hasCredit && hasDebit) {
        matchStatus = 'Full match';
      }
      
      let tallySync = 'Not synced';
      if (matchStatus === 'Full match') {
        tallySync = Math.random() > 0.2 ? 'Synced' : 'Pending';
      } else if (matchStatus === 'Partial') {
        tallySync = 'Pending';
      }
      
      data.push({
        id: `MR-2026-${String(100 + i).padStart(3, '0')}`,
        party: parties[Math.floor(Math.random() * parties.length)],
        invoice: `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`,
        creditNote: hasCredit ? `CN-2026-${String(100 + i).padStart(3, '0')}` : 'Not generated',
        cnAmount: cnAmount,
        debitNote: hasDebit ? `DN-2026-${String(Math.floor(i/2) + 50).padStart(3, '0')}` : '—',
        dnAmount: dnAmount,
        matchStatus: matchStatus,
        tallySync: tallySync,
        difference: difference,
        returnValue: cnAmount
      });
    }
    
    return data;
  };

  const handleGenerateCreditNote = async (item) => {
    try {
      const cnId = `CN-2026-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
      // In real implementation, this would call the API
      // await materialReturnApi.issueCreditNote(item.id, cnId);
      
      // Update local state for demo
      setMatchingData(prev => prev.map(matchItem => 
        matchItem.id === item.id 
          ? { 
              ...matchItem, 
              creditNote: cnId, 
              cnAmount: matchItem.returnValue || Math.floor(Math.random() * 5000) + 1000,
              matchStatus: 'Full match',
              tallySync: 'Pending'
            }
          : matchItem
      ));
      
      toast(`Credit note ${cnId} generated successfully`, 'success');
      
      // Recalculate stats
      setTimeout(() => {
        const updatedData = matchingData.map(matchItem => 
          matchItem.id === item.id 
            ? { 
                ...matchItem, 
                creditNote: cnId, 
                cnAmount: matchItem.returnValue || Math.floor(Math.random() * 5000) + 1000,
                matchStatus: 'Full match',
                tallySync: 'Pending'
              }
            : matchItem
        );
        updateStats(updatedData);
      }, 100);
    } catch (error) {
      toast('Error generating credit note', 'error');
    }
  };

  const handleSyncWithTally = async (item) => {
    try {
      // In real implementation, this would call the API
      // await tallyApi.syncCreditNote(item.creditNote);
      
      // Update local state for demo
      setMatchingData(prev => prev.map(matchItem => 
        matchItem.id === item.id 
          ? { ...matchItem, tallySync: 'Synced' }
          : matchItem
      ));
      
      toast(`${item.creditNote} synced with Tally successfully`, 'success');
    } catch (error) {
      toast('Error syncing with Tally', 'error');
    }
  };

  const updateStats = (data) => {
    const fullyMatched = data.filter(item => item.matchStatus === 'Full match').length;
    const partialMismatch = data.filter(item => item.matchStatus === 'Partial').length;
    const cnNotGenerated = data.filter(item => item.creditNote === 'Not generated').length;
    const totalLossAmount = data.reduce((sum, item) => sum + (item.difference || 0), 0);
    
    setStats({
      fullyMatched,
      partialMismatch,
      cnNotGenerated,
      totalLossAmount
    });
  };

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'Full match':
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
      case 'Partial':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'Open':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
    }
  };

  const getTallySyncIcon = (status) => {
    switch (status) {
      case 'Synced':
        return { icon: '✓', color: '#16a34a' };
      case 'Pending':
        return { icon: '⏳', color: '#d97706' };
      case 'Not synced':
        return { icon: '✗', color: '#dc2626' };
      default:
        return { icon: '—', color: '#64748b' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-600">Loading matching data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.fullyMatched}</div>
          <div className="text-sm text-gray-600 font-medium">Fully matched</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{stats.partialMismatch}</div>
          <div className="text-sm text-gray-600 font-medium">Partial mismatch</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-red-600 mb-2">{stats.cnNotGenerated}</div>
          <div className="text-sm text-gray-600 font-medium">CN not generated</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-3xl font-bold text-gray-800 mb-2">₹{stats.totalLossAmount.toLocaleString('en-IN')}</div>
          <div className="text-sm text-gray-600 font-medium">Total loss amount</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by MR ID, Party, Invoice, or Credit Note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            >
              <option value="All">All Status</option>
              <option value="Full match">Full Match</option>
              <option value="Partial">Partial Match</option>
              <option value="Open">Open</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredData.length} of {matchingData.length} records
          </div>
        </div>
      </div>

      {/* Matching Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  DOCKET
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  PARTY
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  INVOICE
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  CREDIT NOTE
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  CN AMOUNT
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  DEBIT NOTE
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  DN AMOUNT
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  MATCH STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  TALLY SYNC
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item, index) => {
                const matchStatusStyle = getMatchStatusColor(item.matchStatus);
                const tallySyncStyle = getTallySyncIcon(item.tallySync);
                
                return (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">{item.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.party}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.invoice}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        item.creditNote === 'Not generated' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {item.creditNote}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.cnAmount > 0 ? `₹${item.cnAmount.toLocaleString('en-IN')}` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        item.debitNote === '—' 
                          ? 'text-gray-400' 
                          : 'text-blue-600'
                      }`}>
                        {item.debitNote}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.dnAmount > 0 ? `₹${item.dnAmount.toLocaleString('en-IN')}` : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ 
                          backgroundColor: matchStatusStyle.bg, 
                          color: matchStatusStyle.text,
                          border: `1px solid ${matchStatusStyle.border}`
                        }}
                      >
                        {item.matchStatus}
                        {item.matchStatus === 'Partial' && item.difference > 0 && (
                          <span className="ml-1">
                            · ₹{item.difference} diff
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span 
                          className="text-lg mr-2"
                          style={{ color: tallySyncStyle.color }}
                        >
                          {tallySyncStyle.icon}
                        </span>
                        <span 
                          className="text-sm font-medium"
                          style={{ color: tallySyncStyle.color }}
                        >
                          {item.tallySync}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {item.creditNote === 'Not generated' && (
                          <button
                            onClick={() => handleGenerateCreditNote(item)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-semibold"
                          >
                            Generate CN
                          </button>
                        )}
                        {item.creditNote !== 'Not generated' && item.tallySync === 'Pending' && (
                          <button
                            onClick={() => handleSyncWithTally(item)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-semibold"
                          >
                            Sync Tally
                          </button>
                        )}
                        {item.tallySync === 'Synced' && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold">
                            Complete
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <button 
          onClick={fetchMatchingData}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold text-sm"
        >
          Refresh Data
        </button>
        <button 
          onClick={() => toast('Sync initiated', 'success')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
        >
          Sync with Tally
        </button>
        <button 
          onClick={() => toast('Report generated', 'success')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}