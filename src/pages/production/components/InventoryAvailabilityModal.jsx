import React, { useState, useEffect } from 'react';
import { checkInventoryStatus } from '../../../api/productionApi';
import StatusBadge from '../../../components/common/StatusBadge';
import './InventoryAvailabilityModal.css';

export default function InventoryAvailabilityModal({ woId, onClose, onApprove, onReject }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInventoryStatus = async () => {
      try {
        setLoading(true);
        const result = await checkInventoryStatus(woId);
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (woId) fetchInventoryStatus();
  }, [woId]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading inventory status...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error-message">{error}</div>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  const { requiredMaterials, allAvailable, totalShortfall } = data;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Inventory Availability Check</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Summary */}
          <div className={`availability-summary ${allAvailable ? 'available' : 'unavailable'}`}>
            <div className="summary-status">
              <span className="status-icon">{allAvailable ? '✓' : '⚠'}</span>
              <div>
                <h3>{allAvailable ? 'All Materials Available' : 'Inventory Shortfall'}</h3>
                {!allAvailable && (
                  <p className="shortfall-text">Total Shortfall: {totalShortfall} units</p>
                )}
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="materials-table">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Required Qty</th>
                  <th>Available Qty</th>
                  <th>Shortfall</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requiredMaterials.map((material, idx) => (
                  <tr key={idx} className={`status-${material.status.toLowerCase()}`}>
                    <td>{material.itemName}</td>
                    <td className="sku">{material.sku || 'N/A'}</td>
                    <td className="qty">{material.requiredQty}</td>
                    <td className="qty">{material.availableQty}</td>
                    <td className={`qty ${material.shortfall > 0 ? 'shortfall' : ''}`}>
                      {material.shortfall > 0 ? `-${material.shortfall}` : '0'}
                    </td>
                    <td>
                      <StatusBadge status={material.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          {allAvailable ? (
            <button onClick={() => onApprove()} className="btn-primary">
              Approve & Reserve Inventory
            </button>
          ) : (
            <button onClick={() => onReject('Insufficient inventory')} className="btn-danger">
              Reject - Insufficient Inventory
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
