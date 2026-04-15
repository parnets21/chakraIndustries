import Modal from '../../../../components/common/Modal';
import { vendorQuotes } from '../data';

export default function CompareQuotesModal({ open, onClose, rfq }) {
  if (!rfq) return null;
  const quotes = vendorQuotes[rfq.id] || [];

  const getTotal = (items) =>
    items.reduce((sum, i) => sum + i.qty * i.unitPrice * (1 + i.gst / 100), 0);

  const totals = quotes.map(q => getTotal(q.items));
  const minTotal = Math.min(...totals);

  return (
    <Modal open={open} onClose={onClose} title={`Compare Quotes — ${rfq.id}`} size="lg"
      footer={<button className="btn btn-outline" onClick={onClose}>Close</button>}>

      {quotes.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No quotes received yet.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${quotes.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
            {quotes.map((q, i) => {
              const total = totals[i];
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
                  <div style={{ fontSize: 18, fontWeight: 900, color: isBest ? 'var(--primary)' : '#1c2833' }}>
                    ₹{Math.round(total).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>incl. GST</div>
                </div>
              );
            })}
          </div>

          {/* Item-wise comparison */}
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Item-wise Comparison</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  {quotes.map(q => <th key={q.vendor}>{q.vendor}</th>)}
                </tr>
              </thead>
              <tbody>
                {quotes[0].items.map((item, i) => {
                  const prices = quotes.map(q => q.items[i]?.unitPrice || 0);
                  const minPrice = Math.min(...prices);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>{item.qty}</td>
                      {quotes.map((q, qi) => {
                        const price = q.items[i]?.unitPrice || 0;
                        const isBest = price === minPrice;
                        return (
                          <td key={qi} style={{ fontWeight: isBest ? 700 : 400, color: isBest ? 'var(--primary)' : 'inherit' }}>
                            ₹{price}/unit
                            {isBest && <span style={{ marginLeft: 4, fontSize: 10, color: '#27ae60' }}>✓</span>}
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
