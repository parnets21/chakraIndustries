import { useState } from 'react';
import barcodeActions from '../../utils/barcodeActions';
import PageHeader from '../../components/common/PageHeader';
import PageShell from '../../components/common/PageShell';

export default function BarcodeTestPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Test data
  const testData = {
    sku: 'SKU-1042',
    batchId: 'B-2024-04',
    quantity: 10,
    barcodeValue: 'BC-SKU1042-001',
    location: 'WH-01/Rack-A3',
    toLocation: 'WH-02/Rack-B1',
  };

  const handleTest = async (testName, testFn) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testFn();
      setResult({
        name: testName,
        success: response.success,
        message: response.message,
        data: response.success ? response : response.error,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Barcode Actions Test"
        subtitle="Test all barcode functionality"
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {['Generate', 'Scan', 'Movements', 'Print'].map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === i ? '2px solid #ef4444' : 'none',
              color: activeTab === i ? '#ef4444' : '#6b7280',
              cursor: 'pointer', fontWeight: 600, fontSize: 14,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8,
          padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 13,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Result Alert */}
      {result && (
        <div style={{
          background: result.success ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${result.success ? '#86efac' : '#fecaca'}`,
          borderRadius: 8, padding: 12, m