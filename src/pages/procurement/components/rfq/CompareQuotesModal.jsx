import Modal from '../../../../components/common/Modal';
import { vendorQuotes } from '../data';

export default function CompareQuotesModal({ open, onClose, rfq }) {
  if (!rfq) return null;
  const quotes = vendorQuotes[rfq.id] || [];

  const getTotal = (items) =>
    items.reduce((sum, i) => {
      const baseTotal = i.qty * i.unitPrice;
      const gstAmount = baseTotal * (i.gst / 100);
      return sum + baseTotal + gstAmount;
    }, 0);

  const totals = quotes.map(q => getTotal(q.items));
  const minTotal = Math.min(...totals);

  const formatCurrency = (val) => `₹${Math.round(val).toLocaleString()}`;

  return (
    <Modal open={open} onClose={onClose} title={`Compare Quotes — ${rfq.id}`} size="lg"
      footer={<button className="btn btn-outline" onClick={onClose}>Close</button>}>

      {quotes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No quotes received yet.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(quotes.length, 3)}, 1fr)`, gap: 12, marginBottom: 20 }}>
            {quotes.map((q, i) => {
              const total = totals[i];
              const baseTotal = q.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
              const gstTotal = total - baseTotal;
              const isBest = total === minTotal;
              return (
                <div key={i} style={{
                  padding: 14, borderRadius: 10, border: `2px solid ${isBest ? 'var(--primary)' : 'var(--border)'}`,
                  background: isBest ? '#fdf5f5' : '#f8fafc', position: 'relative',
                }}>
                  {isBest && (
                    <span style={{ position: 'absolute', top: -10, right: 10, background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                      BEST PRICE
                    </span>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{q.vendor}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Submitted: {q.submittedOn} · Delivery: {q.deliveryDays}d</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    <div>Base: {formatCurrency(baseTotal)}</div>
                    <div>GST: {formatCurrency(gstTotal)}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: isBest ? 'var(--primary)' : '#1c2833', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                    {formatCurrency(total)}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>incl. GST</div>
                </div>
              );
            })}
          </div>

          {/* Item-wise comparison */}
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Item-wise Comparison</div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Item</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>SKU</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Qty</th>
                  {quotes.map(q => (
                    <th key={q.vendor} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      {q.vendor}
                      <div style={{ fontSize: 9, fontWeight: 400, color: '#94a3b8' }}>Unit Price / GST</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes[0]?.items.map((item, i) => {
                  const prices = quotes.map(q => q.items[i]?.unitPrice || 0);
                  const minPrice = Math.min(...prices);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{item.sku || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: '#1e293b' }}>{item.qty}</td>
                      {quotes.map((q, qi) => {
                        const qItem = q.items[i];
                        const price = qItem?.unitPrice || 0;
                        const gst = qItem?.gst || 0;
                        const isBest = price === minPrice && price > 0;
                        return (
                          <td key={qi} style={{ padding: '10px 12px', textAlign: 'center', fontWeight: isBest ? 700 : 400, color: isBest ? 'var(--primary)' : 'inherit', background: isBest ? '#fdf5f5' : 'transparent' }}>
                            <div style={{ fontSize: 12 }}>₹{price}/unit</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>{gst}% GST</div>
                            {isBest && <span style={{ marginLeft: 4, fontSize: 10, color: '#27ae60' }}>✓ Best</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary">Convert Best Quote to PO</button>
          </div>
        </>
      )}
    </Modal>
  );
}
