import React, { useState, useEffect } from 'react';
import { fetchWorkOrders, createWorkOrder, closeWorkOrder, fetchAssets } from '../api/maintenanceApi';

export default function WorkOrderPortal() {
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState(null);

  // Form state for new ticket
  const [form, setForm] = useState({
    workOrderNumber: `WO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
    assetId: '',
    type: 'BREAKDOWN',
    priority: 'HIGH',
    description: '',
    assignedTechnician: ''
  });

  // Closeout form state
  const [closeForm, setCloseForm] = useState({
    rootCauseAnalysis: '',
    assignedTechnician: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [woData, assetData] = await Promise.all([
        fetchWorkOrders(),
        fetchAssets()
      ]);
      setWorkOrders(woData);
      setAssets(assetData);
    } catch (err) {
      console.error('Failed to load work orders or assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWorkOrder(form);
      setShowCreateModal(false);
      loadData();
      // Reset form ID for next entry
      setForm({
        workOrderNumber: `WO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random() * 900)}`,
        assetId: '',
        type: 'BREAKDOWN',
        priority: 'HIGH',
        description: '',
        assignedTechnician: ''
      });
    } catch (err) {
      alert('Error creating work order. Check console.');
    }
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    try {
      await closeWorkOrder(selectedWoId, closeForm.rootCauseAnalysis, closeForm.assignedTechnician);
      setShowCloseModal(false);
      setSelectedWoId(null);
      setCloseForm({ rootCauseAnalysis: '', assignedTechnician: '' });
      loadData();
    } catch (err) {
      alert('Error closing work order. Check console.');
    }
  };

  return (
    <div className="pm-work-order-portal">
      <div className="pm-header-actions">
        <h2>Shop-Floor Breakdown & Work Order Ticketing</h2>
        <button className="pm-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Log New Breakdown / Ticket
        </button>
      </div>

      {loading ? (
        <div className="pm-loading">Loading Work Orders...</div>
      ) : (
        <table className="pm-table">
          <thead>
            <tr>
              <th>WO Number</th>
              <th>Asset Tag / ID</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Description</th>
              <th>Assigned Tech</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#888' }}>
                  No active work orders logged. Click the button above to create one.
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => (
                <tr key={wo.id}>
                  <td><code>{wo.workOrderNumber}</code></td>
                  <td>{wo.asset ? wo.asset.assetTag : wo.assetId}</td>
                  <td>{wo.type}</td>
                  <td><span className={`badge priority-${wo.priority?.toLowerCase()}`}>{wo.priority}</span></td>
                  <td>{wo.description}</td>
                  <td>{wo.assignedTechnician || 'Unassigned'}</td>
                  <td><span className={`badge status-${wo.status?.toLowerCase()}`}>{wo.status}</span></td>
                  <td>
                    {wo.status !== 'COMPLIANT' && wo.status !== 'COMPLETED' && (
                      <button 
                        className="pm-btn-secondary"
                        onClick={() => {
                          setSelectedWoId(wo.id);
                          setShowCloseModal(true);
                        }}
                      >
                        Close / RCA
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal">
            <h3>Log Maintenance Ticket</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>WO Number</label>
                <input type="text" value={form.workOrderNumber} disabled className="pm-input" />
              </div>
              <div className="form-group">
                <label>Select Asset / Machine</label>
                <select 
                  required
                  value={form.assetId} 
                  onChange={(e) => setForm({...form, assetId: e.target.value})}
                  className="pm-select"
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetTag} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={form.type} 
                  onChange={(e) => setForm({...form, type: e.target.value})}
                  className="pm-select"
                >
                  <option value="BREAKDOWN">Breakdown</option>
                  <option value="PREVENTIVE">Preventive Maintenance</option>
                  <option value="CALIBRATION">Calibration</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select 
                  value={form.priority} 
                  onChange={(e) => setForm({...form, priority: e.target.value})}
                  className="pm-select"
                >
                  <option value="EMERGENCY">Emergency</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Problem Description</label>
                <textarea 
                  required
                  placeholder="Describe breakdown symptoms..."
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="pm-textarea"
                />
              </div>
              <div className="form-group">
                <label>Assigned Technician</label>
                <input 
                  type="text" 
                  placeholder="e.g., Eng. Rahim"
                  value={form.assignedTechnician}
                  onChange={(e) => setForm({...form, assignedTechnician: e.target.value})}
                  className="pm-input"
                />
              </div>
              <div className="pm-modal-actions">
                <button type="button" className="pm-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="pm-btn-primary">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSEOUT & RCA MODAL */}
      {showCloseModal && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal">
            <h3>Work Order Closeout & Root Cause Analysis (RCA)</h3>
            <form onSubmit={handleCloseSubmit}>
              <div className="form-group">
                <label>Root Cause Analysis (5-Why / Ishikawa Notes)</label>
                <textarea 
                  required
                  placeholder="Enter detailed repair findings and root cause..."
                  value={closeForm.rootCauseAnalysis}
                  onChange={(e) => setCloseForm({...closeForm, rootCauseAnalysis: e.target.value})}
                  className="pm-textarea"
                />
              </div>
              <div className="form-group">
                <label>Technician Sign-off</label>
                <input 
                  type="text" 
                  placeholder="Technician Name"
                  value={closeForm.assignedTechnician}
                  onChange={(e) => setCloseForm({...closeForm, assignedTechnician: e.target.value})}
                  className="pm-input"
                />
              </div>
              <div className="pm-modal-actions">
                <button type="button" className="pm-btn-secondary" onClick={() => setShowCloseModal(false)}>Cancel</button>
                <button type="submit" className="pm-btn-primary">Verify & Close Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}