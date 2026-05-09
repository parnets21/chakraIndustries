import React, { useState, useEffect } from 'react';
import { getBOMs, calculateMaterialRequirements } from '../../../api/productionApi';
import './BOMTabEnhanced.css';

export default function BOMTabEnhanced() {
  const [boms, setBOMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [productionQty, setProductionQty] = useState(1);
  const [calculatedMaterials, setCalculatedMaterials] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchBOMs();
  }, []);

  const fetchBOMs = async () => {
    try {
      setLoading(true);
      const result = await getBOMs();
      setBOMs(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateMaterials = async (bom) => {
    try {
      setCalculating(true);
      setSelectedBOM(bom);
      const result = await calculateMaterialRequirements(bom._id, productionQty);
      setCalculatedMaterials(result.data);
    } catch (err) {
      alert(`Calculation failed: ${err.message}`);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return <div className="loading">Loading BOMs...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="bom-tab">
      <div className="bom-container">
        {/* BOM List */}
        <div className="bom-list-section">
          <h3>Bill of Materials</h3>
          <div className="bom-list">
            {boms.length === 0 ? (
              <div className="empty-state">No BOMs found</div>
            ) : (
              boms.map((bom) => (
                <div
                  key={bom._id}
                  className={`bom-item ${selectedBOM?._id === bom._id ? 'selected' : ''}`}
                  onClick={() => setSelectedBOM(bom)}
                >
                  <div className="bom-item-header">
                    <h4>{bom.product}</h4>
                    <span className="version">{bom.version}</span>
                  </div>
                  <div className="bom-item-details">
                    <span className="type">{bom.type}</span>
                    <span className="components">{bom.components?.length || 0} components</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BOM Details & Calculation */}
        {selectedBOM && (
          <div className="bom-details-section">
            <div className="details-header">
              <h3>{selectedBOM.product}</h3>
              <span className={`status-badge status-${selectedBOM.status.toLowerCase()}`}>
                {selectedBOM.status}
              </span>
            </div>

            <div className="bom-info">
              <div className="info-row">
                <label>Type:</label>
                <span>{selectedBOM.type}</span>
              </div>
              <div className="info-row">
                <label>Version:</label>
                <span>{selectedBOM.version}</span>
              </div>
              <div className="info-row">
                <label>UOM:</label>
                <span>{selectedBOM.uom}</span>
              </div>
              {selectedBOM.description && (
                <div className="info-row">
                  <label>Description:</label>
                  <span>{selectedBOM.description}</span>
                </div>
              )}
            </div>

            {/* Production Quantity Input */}
            <div className="calculation-section">
              <div className="qty-input-group">
                <label>Production Quantity:</label>
                <div className="qty-input">
                  <input
                    type="number"
                    min="1"
                    value={productionQty}
                    onChange={(e) => setProductionQty(parseInt(e.target.value) || 1)}
                  />
                  <span className="unit">{selectedBOM.uom}</span>
                </div>
              </div>
              <button
                className="btn-calculate"
                onClick={() => handleCalculateMaterials(selectedBOM)}
                disabled={calculating}
              >
                {calculating ? 'Calculating...' : 'Calculate & Check Inventory'}
              </button>
            </div>

            {/* Components Table */}
            <div className="components-section">
              <h4>Components</h4>
              <div className="components-table">
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>SKU</th>
                      <th>Qty per Unit</th>
                      <th>Unit</th>
                      <th>Total Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBOM.components?.map((comp, idx) => (
                      <tr key={idx}>
                        <td>{comp.itemName}</td>
                        <td className="sku">{comp.sku || 'N/A'}</td>
                        <td className="qty">{comp.qty}</td>
                        <td>{comp.unit}</td>
                        <td className="qty total">{comp.qty * productionQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculated Materials with Inventory Status */}
            {calculatedMaterials && (
              <div className="calculated-materials-section">
                <h4>Inventory Availability</h4>
                <div className={`availability-summary ${calculatedMaterials.allAvailable ? 'available' : 'unavailable'}`}>
                  <span className="icon">{calculatedMaterials.allAvailable ? '✓' : '⚠'}</span>
                  <div>
                    <strong>{calculatedMaterials.allAvailable ? 'All Materials Available' : 'Inventory Shortfall'}</strong>
                    {!calculatedMaterials.allAvailable && (
                      <p>Total Shortfall: {calculatedMaterials.totalShortfall} units</p>
                    )}
                  </div>
                </div>

                <div className="materials-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Required</th>
                        <th>Available</th>
                        <th>Shortfall</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedMaterials.requiredMaterials.map((mat, idx) => (
                        <tr key={idx} className={`status-${mat.status.toLowerCase()}`}>
                          <td>{mat.itemName}</td>
                          <td className="qty">{mat.requiredQty}</td>
                          <td className="qty">{mat.availableQty}</td>
                          <td className={`qty ${mat.shortfall > 0 ? 'shortfall' : ''}`}>
                            {mat.shortfall > 0 ? `-${mat.shortfall}` : '0'}
                          </td>
                          <td>
                            <span className={`status-badge status-${mat.status.toLowerCase()}`}>
                              {mat.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
