import { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal';
import { poApi } from '../../../../api/poApi';
import { grnApi } from '../../../../api/grnApi';

export default function CreateGRNModal({ open, onClose, onSaved }) {
  const [pos, setPOs]           = useState([]);
  const [selectedPO, setSelectedPO] = useState('');
  const [poData, setPoData]     = useState(null);
  const [receiptDate, setReceiptDate] = useState('');
  const [receivedBy, setReceivedBy]   = useState('');
  const [remarks, setRemarks]   = useState('');
  const [items, setItems]       = useState([]);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (open) {
      loadPOs();
      setSelectedPO(''); setPoData(null); setItems([]);
      setReceiptDate(''); setReceivedBy(''); setRemarks('');
    }
  }, [open]);

  const loadPOs = async () => {
    setLoading(true);
    try {
      // Fetch all POs then filter out Draft and Cancelled on the frontend
      const res = await poApi.getAll();
      const usable = (res.data || []).filter(p => p.status !== 'Draft' && p.status !== 'Cancelled');
      setPOs(usable);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePOSelect = async (poId) => {
    setSelectedPO(poId);
    if (!poId) { setPoData(null); setItems([]); return; }
    try {
      const res = await poApi.getById(poId);
      const po = res.data;
      setPoData(po);
      setItems((po.items || []).map(it => ({
        name: it.name,
        ordered: it.qty,
        received: '',
        condition: 'Good',
        remarks: '',
      })));
    } catch (e) { alert(e.message); }
  };

  const updateItem = (i, k, v) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const handleSave = async () => {
    if (!selectedPO) { alert('Please select a PO'); return; }
    if (!receiptDate) { alert('Please enter receipt date'); return; }
    if (!receivedBy.trim()) { alert('Please enter received by'); return; }

    const totalOrdered  = items.reduce((s, i) => s + i.ordered, 0);
    const totalReceived = items.reduce((s, i) => s + (parseInt(i.received) || 0), 0);

    if (totalReceived === 0) { alert('Please enter received quantities'); return; }

    const status = totalReceived >= totalOrdered ? 'Completed' : totalReceived > 0 ? 'Partial' : 'Pending';

    setSaving(true);
    try {
      await grnApi.create({
        poId: selectedPO,
        vendorId: poData?.vendor?._id || poData?.vendor,
        orderedQuantity: totalOrdered,
        receivedQuantity: totalReceived,
        receivedDate: receiptDate,
        status,
        remarks: remarks.trim(),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalOrdered  = items.reduce((s, i) => s + i.ordered, 0);
  const totalReceived = items.reduce((s, i) => s + (parseInt(i.received) || 0), 0);
  const totalPending  = Math.max(0, totalOrdered - totalReceived);

  return (
    <Modal open={open} onClose={onClose} title="Create GRN" size="lg"
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save GRN'}
          </button>
        </>
      }>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading POs...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div className="form-group">
              <label className="form-label">PO Reference *</label>
              <select className="form-select" value={selectedPO} onChange={e => handlePOSelect(e.target.value)}>
                <option value="">— Select PO —</option>
                {pos.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.poId} — {p.vendor?.companyName || 'Unknown Vendor'} [{p.status}]
                  </option>
                ))}
              </select>
              {pos.length === 0 && !loading && (
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No POs available. Create a PO first.</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Receipt Date *</label>
              <input type="date" className="form-input" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Received By *</label>
              <input className="form-input" placeholder="Staff name" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <input className="form-input" placeholder="Optional notes" value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>

          {/* Vendor info */}
          {poData && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
              <span style={{ fontWeight: 600, color: '#15803d' }}>Vendor: </span>
              <span>{poData.vendor?.companyName || '—'}</span>
              <span style={{ marginLeft: 16, fontWeight: 600, color: '#15803d' }}>PO Value: </span>
              <span>₹{(poData.grandTotal || 0).toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Items Received</div>
              <div className="table-container" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Ordered Qty</th>
                      <th>Received Qty</th>
                      <th>Condition</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td style={{ color: '#64748b', textAlign: 'center' }}>{item.ordered}</td>
                        <td>
                          <input type="number" className="form-input" style={{ width: 80 }}
                            placeholder="0" value={item.received}
                            onChange={e => updateItem(i, 'received', e.target.value)} />
                        </td>
                        <td>
                          <select className="form-select" style={{ width: 110 }}
                            value={item.condition} onChange={e => updateItem(i, 'condition', e.target.value)}>
                            <option>Good</option>
                            <option>Damaged</option>
                            <option>Partial</option>
                          </select>
                        </td>
                        <td>
                          <input className="form-input" placeholder="Optional"
                            value={item.remarks} onChange={e => updateItem(i, 'remarks', e.target.value)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div style={{ background: '#f8fafc', borderRadius: 9, padding: 14, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>RECEIPT SUMMARY</div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Ordered</div>
                    <div style={{ fontWeight: 700 }}>{totalOrdered} units</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Received</div>
                    <div style={{ fontWeight: 700, color: '#16a34a' }}>{totalReceived} units</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Pending</div>
                    <div style={{ fontWeight: 700, color: '#d97706' }}>{totalPending} units</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Status</div>
                    <div style={{ fontWeight: 700, color: totalReceived >= totalOrdered ? '#16a34a' : totalReceived > 0 ? '#d97706' : '#94a3b8' }}>
                      {totalReceived >= totalOrdered ? 'Completed' : totalReceived > 0 ? 'Partial' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
