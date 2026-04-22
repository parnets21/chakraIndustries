import { useState } from 'react';
import Modal from '../../../components/common/Modal';
import { MdUploadFile, MdCheckCircle, MdError } from 'react-icons/md';
import { poApi } from '../../../api/poApi';

export default function BulkPOUpload({ onSuccess }) {
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== 'string') return;

      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = [];

      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        data.push(row);
      }

      setPreview(data);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) {
      alert('Please select a valid file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await poApi.bulkUpload(formData);
      setUploadResult({
        success: res.data.successful || 0,
        failed: res.data.failed || 0,
        errors: res.data.errors || []
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setUploadResult(null);
    setShowModal(false);
    if (onSuccess) onSuccess();
  };

  return (
    <>
      <button className="btn btn-outline btn-sm" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MdUploadFile size={16} /> Bulk Upload
      </button>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Bulk Upload Purchase Orders" size="lg"
        footer={
          uploadResult ? (
            <button className="btn btn-primary" onClick={handleReset}>Done</button>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={uploading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || preview.length === 0}>
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </>
          )
        }>
        {uploadResult ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ marginBottom: 20 }}>
              {uploadResult.failed === 0 ? (
                <MdCheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto' }} />
              ) : (
                <MdError size={48} style={{ color: '#dc2626', margin: '0 auto' }} />
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              {uploadResult.failed === 0 ? 'Upload Successful!' : 'Upload Completed with Errors'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              <div>✓ {uploadResult.success} POs created successfully</div>
              {uploadResult.failed > 0 && <div>✗ {uploadResult.failed} POs failed</div>}
            </div>
            {uploadResult.errors.length > 0 && (
              <div style={{ background: '#fee2e2', padding: 12, borderRadius: 8, textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
                <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 8, fontSize: 12 }}>Errors:</div>
                {uploadResult.errors.map((err, idx) => (
                  <div key={idx} style={{ fontSize: 11, color: '#7f1d1d', marginBottom: 4 }}>
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
                Select CSV or Excel File
              </label>
              <div style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f8fafc',
                transition: 'all 0.2s'
              }}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onDrop={e => { e.preventDefault(); handleFileSelect({ target: { files: e.dataTransfer.files } }); }}>
                <input type="file" accept=".csv,.xlsx" onChange={handleFileSelect} style={{ display: 'none' }} id="file-input" />
                <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                  <MdUploadFile size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>CSV or Excel files only</div>
                </label>
              </div>
            </div>

            {preview.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Preview ({preview.length} rows)</div>
                <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                        {Object.keys(preview[0] || {}).map(key => (
                          <th key={key} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                            {key.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          {Object.values(row).map((val, vidx) => (
                            <td key={vidx} style={{ padding: '8px 12px', color: '#374151' }}>
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                  Showing first {preview.length} rows of the file
                </div>
              </div>
            )}

            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, marginTop: 16, fontSize: 12, color: '#166534' }}>
              <strong>Required columns:</strong> vendor, item_name, qty, unit, base_price, gst, delivery_date
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
