import { useState, useEffect } from 'react';
import { getAgeingStock } from '../../api/ageingStockApi';
import { toast } from '../../components/common/Toast';
import { MdTrendingUp, MdWarningAmber, MdCheckCircle, MdRefresh } from 'react-icons/md';

export default function AgeingStockPage() {
  const [ageingData, setAgeingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const fetchAgeingData = async () => {
    try {
      setLoading(true);
      console.log('Fetching ageing stock data...');
      const response = await getAgeingStock();
      console.log('Ageing stock response:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        setAgeingData(response.data);
        if (response.data.length === 0) {
          toast('No ageing stock data available', 'info');
        } else {
          toast(`Loaded ${response.data.length} ageing stock items`, 'success');
        }
      } else {
        console.error('Invalid response format:', response);
        toast('Failed to load ageing data', 'warning');
        setAgeingData([]);
      }
    } catch (error) {
      console.error('Error loading ageing stock data:', error);
      toast('Error loading ageing stock data', 'error');
      setAgeingData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgeingData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ageing stock data...</p>
        </div>
      </div>
    );
  }

  const buckets = ['0–30', '31–60', '61–90', '90+'];
  const filtered = filter === 'All' ? ageingData : ageingData.filter(item => item.bucket === filter);

  return (
    <div>
      {/* Summary Cards */}
      {ageingData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          {buckets.map((bucket, i) => {
            const count = ageingData.filter(item => item.bucket === bucket).length;
            const colors = ['#16a34a', '#d97706', '#f97316', '#c0392b'];
            return (
              <div key={bucket} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600 uppercase">{bucket} Days</span>
                  <span className="text-2xl font-bold" style={{ color: colors[i] }}>{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${ageingData.length > 0 ? (count / ageingData.length) * 100 : 0}%`, background: colors[i] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-gray-800">Ageing Stock Analysis</div>
            <div className="text-xs text-gray-400 mt-0.5">Items grouped by days since GRN/Manufacture/Last Movement</div>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={fetchAgeingData}
              disabled={loading}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all disabled:opacity-50"
              title="Refresh data"
            >
              <MdRefresh size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            {['All', ...buckets].map(b => (
              <button
                key={b}
                onClick={() => setFilter(b)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  filter === b
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {ageingData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No ageing stock data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['SKU', 'Item', 'Warehouse', 'Qty', 'Last Movement', 'Days Old', 'Bucket', 'Value', 'Action'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10.5px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-200 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-red-700">{row.sku}</td>
                    <td className="px-4 py-3 text-sm">{row.item}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.whName || row.wh}</td>
                    <td className="px-4 py-3 text-sm font-bold">{row.qty}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.lastMov}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">{row.days}d</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        row.bucket === '0–30' ? 'bg-green-100 text-green-800' :
                        row.bucket === '31–60' ? 'bg-amber-100 text-amber-800' :
                        row.bucket === '61–90' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {row.bucket}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.value}</td>
                    <td className="px-4 py-3">
                      <button className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                        row.actionColor === '#22c55e'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : row.actionColor === '#f59e0b'
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}>
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
