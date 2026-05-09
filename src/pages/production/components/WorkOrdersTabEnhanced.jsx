import React, { useState, useEffect } from 'react';
import { getWorkOrders, approveWorkOrder, rejectWorkOrder, completeWorkOrder } from '../../../api/productionApi';
import InventoryAvailabilityModal from './InventoryAvailabilityModal';
import StatusBadge from '../../../components/common/StatusBadge';
import './WorkOrdersTabEnhanced.css';

export default function WorkOrdersTabEnhanced() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWO, setSelectedWO] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const result = await getWorkOrders();
      setWorkOrders(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (wo) => {
    setSelectedWO(wo);
    setShowInventoryModal(true);
  };

  const handleApproveWithInventory = async () => {
    try {
      setActionInProgress(true);
      await approveWorkOrder(selectedWO._id);
      setShowInventoryModal(false);
      await fetchWorkOrders();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectWO = async (reason) => {
    try {
      setActionInProgress(true);
      await rejectWorkOrder(selectedWO._id, reason);
      setShowInventoryModal(false);
      await fetchWorkOrders();
    } catch (err) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCompleteWO = async (wo) => {
    const actualProduced = prompt(`Enter actual produced quantity for ${wo.woId}:`, wo.qty);
    if (actualProduced === null) return;

    try {
      setActionInProgress(true);
      await completeWorkOrder(wo._id, parseInt(actualProduced));
      await fetchWorkOrders();
    } catch (err) {
      alert(`Completion failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) return <div className="loading">Loading work orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="work-orders-tab">
      <div className="tab-header">
        <h3>Work Orders</h3>
        <span className="count">{workOrders.length} orders</span>
      </div>

      <div className="work-orders-list">
        {workOrders.length === 0 ? (
          <div className="empty-state">No work orders found</div>
        ) : (
          workOrders.map((wo) => (
            <div key={wo._id} className="work-order-card">
              <div className="card-header">
                <div className="wo-id">{wo.woId}</div>
                <div className="status-badges">
                  <StatusBadge status={wo.status} />
                  <StatusBadge status={wo.approvalStatus} />
                  {wo.inventoryStatus && <StatusBadge status={wo.inventoryStatus} />}
                </div>
              </div>

              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Product</label>
                    <span>{wo.product}</span>
                  </div>
                  <div className="info-item">
                    <label>Quantity</label>
                    <span>{wo.qty} units</span>
                  </div>
                  <div className="info-item">
                    <label>Produced</label>
                    <span>{wo.produced} units</span>
                  </div>
                  <div className="info-item">
                    <label>Priority</label>
                    <span className={`priority-${wo.priority.toLowerCase()}`}>{wo.priority}</span>
                  </div>
                  <div className="info-item">
                    <label>Shift</label>
                    <span>{wo.shift}</span>
                  </div>
                  <div className="info-item">
                    <label>Start Date</label>
                    <span>{new Date(wo.startDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Required Materials Summary */}
                {wo.requiredMaterials && wo.requiredMaterials.length > 0 && (
                  <div className="materials-summary">
                    <h4>Required Materials</h4>
                    <div className="materials-list">
                      {wo.requiredMaterials.slice(0, 3).map((mat, idx) => (
                        <div key={idx} className={`material-item status-${mat.status.toLowerCase()}`}>
                          <span className="mat-name">{mat.itemName}</span>
                          <span className="mat-qty">{mat.requiredQty} {mat.unit}</span>
                          <span className={`mat-status ${mat.status.toLowerCase()}`}>{mat.status}</span>
                        </div>
                      ))}
                      {wo.requiredMaterials.length > 3 && (
                        <div className="more-materials">+{wo.requiredMaterials.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                {wo.approvalStatus === 'Pending' && (
                  <button
                    className="btn-approve"
                    onClick={() => handleApproveClick(wo)}
                    disabled={actionInProgress}
                  >
                    Check Inventory & Approve
                  </button>
                )}
                {wo.approvalStatus === 'Approved' && wo.status === 'Scheduled' && (
                  <button
                    className="btn-start"
                    onClick={() => handleCompleteWO(wo)}
                    disabled={actionInProgress}
                  >
                    Mark as Completed
                  </button>
                )}
                {wo.approvalStatus === 'Rejected' && (
                  <span className="rejection-reason">{wo.remarks}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showInventoryModal && selectedWO && (
        <InventoryAvailabilityModal
          woId={selectedWO._id}
          onClose={() => setShowInventoryModal(false)}
          onApprove={handleApproveWithInventory}
          onReject={handleRejectWO}
        />
      )}
    </div>
  );
}
