import React, { useState, useEffect } from 'react';
import { getOEMOrders, getOEMOrderById } from '../../api/oemOrderApi';
import { createWorkOrderFromOEM, getWorkOrders, getWorkOrderById, startProduction, updateProducedQty, completeWorkOrder } from '../../api/workOrderApi';
import './WorkOrderPage.css';

const WorkOrderPage = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [oemOrders, setOemOrders] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedOEM, setSelectedOEM] = useState(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    bomId: '',
    shift: 'Morning',
    priority: 'Normal'
  });

  // Fetch OEM Orders
  useEffect(() => {
    fetchOEMOrders();
  }, []);

  const fetchOEMOrders = async () => {
    try {
      setLoading(true);
      const response = await getOEMOrders({ status: 'BOM-Loaded' });
      setOemOrders(response.data || []);
    } catch (error) {
      setMessage('Error fetching OEM orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await getWorkOrders();
      setWorkOrders(response.data || []);
    } catch (error) {
      setMessage('Error fetching work orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OEM Order Selection
  const handleSelectOEM = async (oemOrder) => {
    try {
      setSelectedOEM(oemOrder);
      // Auto-populate form with OEM order data
      setFormData({
        product: oemOrder.product,
        quantity: oemOrder.quantity,
        bomId: oemOrder.bomId._id || oemOrder.bomId,
        shift: 'Morning',
        priority: 'Normal'
      });
      setMessage('');
    } catch (error) {
      setMessage('Error selecting OEM order: ' + error.message);
    }
  };

  // Create Work Order from OEM
  const handleCreateFromOEM = async () => {
    if (!selectedOEM) {
      setMessage('Please select an OEM order');
      return;
    }

    try {
      setLoading(true);
      const response = await createWorkOrderFromOEM(selectedOEM._id);
      setMessage('Work Order created successfully: ' + response.data.woId);
      setSelectedOEM(null);
      setFormData({
        product: '',
        quantity: '',
        bomId: '',
        shift: 'Morning',
        priority: 'Normal'
      });
      fetchWorkOrders();
    } catch (error) {
      setMessage('Error creating work order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Work Order Selection
  const handleSelectWorkOrder = async (workOrder) => {
    try {
      const response = await getWorkOrderById(workOrder._id);
      setSelectedWorkOrder(response.data);
    } catch (error) {
      setMessage('Error fetching work order details: ' + error.message);
    }
  };

  // Start Production
  const handleStartProduction = async () => {
    if (!selectedWorkOrder) {
      setMessage('Please select a work order');
      return;
    }

    try {
      setLoading(true);
      const response = await startProduction(selectedWorkOrder._id);
      setMessage('Production started: ' + response.data.woId);
      setSelectedWorkOrder(response.data);
    } catch (error) {
      setMessage('Error starting production: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update Production Quantity
  const handleUpdateProduction = async (produced) => {
    if (!selectedWorkOrder) {
      setMessage('Please select a work order');
      return;
    }

    try {
      setLoading(true);
      const response = await updateProducedQty(selectedWorkOrder._id, produced);
      setMessage(`Production updated: ${produced}/${selectedWorkOrder.qty} units`);
      setSelectedWorkOrder(response.data);
    } catch (error) {
      setMessage('Error updating production: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete Work Order
  const handleCompleteWorkOrder = async () => {
    if (!selectedWorkOrder) {
      setMessage('Please select a work order');
      return;
    }

    try {
      setLoading(true);
      const response = await completeWorkOrder(selectedWorkOrder._id);
      setMessage('Work order completed: ' + response.data.woId);
      setSelectedWorkOrder(response.data);
    } catch (error) {
      setMessage('Error completing work order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="work-order-page">
      <div className="page-header">
        <h1>Work Order Management</h1>
        <p>Create and manage production work orders from OEM orders</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Work Order
        </button>
        <button
          className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('manage');
            fetchWorkOrders();
          }}
        >
          Manage Work Orders
        </button>
      </div>

      {/* Create Work Order Tab */}
      {activeTab === 'create' && (
        <div className="tab-content">
          <div className="create-section">
            <h2>Create Work Order from OEM Order</h2>

            {/* OEM Orders List */}
            <div className="oem-orders-section">
              <h3>Available OEM Orders</h3>
              <div className="oem-orders-list">
                {loading ? (
                  <p>Loading OEM orders...</p>
                ) : oemOrders.length === 0 ? (
                  <p>No OEM orders available</p>
                ) : (
                  oemOrders.map((oemOrder) => (
                    <div
                      key={oemOrder._id}
                      className={`oem-order-card ${selectedOEM?._id === oemOrder._id ? 'selected' : ''}`}
                      onClick={() => handleSelectOEM(oemOrder)}
                    >
                      <div className="oem-order-header">
                        <h4>{oemOrder.oemOrderId}</h4>
                        <span className={`status ${oemOrder.status}`}>{oemOrder.status}</span>
                      </div>
                      <div className="oem-order-details">
                        <p><strong>Product:</strong> {oemOrder.product}</p>
                        <p><strong>Quantity:</strong> {oemOrder.quantity} {oemOrder.unit}</p>
                        <p><strong>Inventory Status:</strong> {oemOrder.inventoryStatus}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Auto-Populated Form */}
            {selectedOEM && (
              <div className="form-section">
                <h3>Work Order Details (Auto-Populated)</h3>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    value={formData.product}
                    disabled
                    className="input-disabled"
                  />
                  <small>Auto-populated from OEM order</small>
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    disabled
                    className="input-disabled"
                  />
                  <small>Auto-populated from OEM order</small>
                </div>

                <div className="form-group">
                  <label>Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    <option value="Morning">Morning</option>
                    <option value="General">General</option>
                    <option value="Night">Night</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleCreateFromOEM}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Work Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Work Orders Tab */}
      {activeTab === 'manage' && (
        <div className="tab-content">
          <div className="manage-section">
            <h2>Manage Work Orders</h2>

            <div className="work-orders-grid">
              {/* Work Orders List */}
              <div className="work-orders-list">
                <h3>Work Orders</h3>
                {workOrders.length === 0 ? (
                  <p>No work orders found</p>
                ) : (
                  workOrders.map((wo) => (
                    <div
                      key={wo._id}
                      className={`work-order-card ${selectedWorkOrder?._id === wo._id ? 'selected' : ''}`}
                      onClick={() => handleSelectWorkOrder(wo)}
                    >
                      <div className="wo-header">
                        <h4>{wo.woId}</h4>
                        <span className={`status ${wo.status}`}>{wo.status}</span>
                      </div>
                      <div className="wo-details">
                        <p><strong>Product:</strong> {wo.product}</p>
                        <p><strong>Qty:</strong> {wo.qty}</p>
                        <p><strong>Produced:</strong> {wo.produced}/{wo.qty}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Work Order Details */}
              {selectedWorkOrder && (
                <div className="work-order-details">
                  <h3>Work Order Details</h3>

                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-row">
                      <span className="label">Work Order ID:</span>
                      <span className="value">{selectedWorkOrder.woId}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Product:</span>
                      <span className="value">{selectedWorkOrder.product}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Quantity:</span>
                      <span className="value">{selectedWorkOrder.qty}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Status:</span>
                      <span className={`value status ${selectedWorkOrder.status}`}>
                        {selectedWorkOrder.status}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Production Progress</h4>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(selectedWorkOrder.produced / selectedWorkOrder.qty) * 100}%`
                        }}
                      >
                        {Math.round((selectedWorkOrder.produced / selectedWorkOrder.qty) * 100)}%
                      </div>
                    </div>
                    <p className="progress-text">
                      {selectedWorkOrder.produced} / {selectedWorkOrder.qty} units produced
                    </p>
                  </div>

                  <div className="detail-section">
                    <h4>Materials Required</h4>
                    <div className="materials-list">
                      {selectedWorkOrder.requiredMaterials?.map((material, idx) => (
                        <div key={idx} className="material-item">
                          <span className="material-name">{material.itemName}</span>
                          <span className="material-qty">
                            {material.requiredQty} {material.unit}
                          </span>
                          <span className={`material-status ${material.status}`}>
                            {material.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="actions">
                    {selectedWorkOrder.status === 'Scheduled' && (
                      <button
                        className="btn btn-primary"
                        onClick={handleStartProduction}
                        disabled={loading}
                      >
                        Start Production
                      </button>
                    )}

                    {selectedWorkOrder.status === 'In-Progress' && (
                      <>
                        <div className="production-controls">
                          <label>Update Produced Quantity:</label>
                          <div className="qty-buttons">
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleUpdateProduction(25)}
                              disabled={loading}
                            >
                              25 Units
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleUpdateProduction(50)}
                              disabled={loading}
                            >
                              50 Units
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleUpdateProduction(75)}
                              disabled={loading}
                            >
                              75 Units
                            </button>
                            <button
                              className="btn btn-success"
                              onClick={() => handleUpdateProduction(selectedWorkOrder.qty)}
                              disabled={loading}
                            >
                              Complete ({selectedWorkOrder.qty} Units)
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {selectedWorkOrder.status === 'Completed' && (
                      <div className="completed-message">
                        <p>✓ Work order completed successfully</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderPage;
