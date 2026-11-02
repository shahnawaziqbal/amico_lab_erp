import React, { useState, useEffect } from 'react';
import { fetchAssets, createAsset } from '../api/maintenanceApi';

export default function AssetRegistry() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [searchTag, setSearchTag] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state for new asset registration
  const [form, setForm] = useState({
    assetTag: `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    manufacturer: '',
    countryOfOrigin: '',
    building: 'General Production Building (GPB)',
    floor: 'Ground Floor',
    roomLocation: '',
    criticality: 'CLASS_B',
    requiresCalibration: false,
    nextCalibrationDueDate: ''
  });

  useEffect(() => {
    loadAssets();
  }, [filterBuilding]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const data = await fetchAssets(filterBuilding);
      setAssets(data);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await createAsset(form);
      setShowModal(false);
      loadAssets();
      // Reset form
      setForm({
        assetTag: `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        manufacturer: '',
        countryOfOrigin: '',
        building: 'General Production Building (GPB)',
        floor: 'Ground Floor',
        roomLocation: '',
        criticality: 'CLASS_B',
        requiresCalibration: false,
        nextCalibrationDueDate: ''
      });
    } catch (err) {
      alert('Error creating asset. Check console or unique asset tag.');
    }
  };

  const filteredAssets = assets.filter(a => 
    a.assetTag.toLowerCase().includes(searchTag.toLowerCase()) ||
    a.name.toLowerCase().includes(searchTag.toLowerCase())
  );

  return (
    <div className="pm-asset-registry">
      <div className="pm-header-actions">
        <h2>Master Asset Register</h2>
        <button className="pm-btn-primary" onClick={() => setShowModal(true)}>
          + Register New Asset
        </button>
      </div>

      <div className="pm-controls-bar" style={{ margin: '15px 0', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Search by ID tag or Name..." 
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
          className="pm-input"
          style={{ flex: 1 }}
        />
        <select 
          value={filterBuilding} 
          onChange={(e) => setFilterBuilding(e.target.value)}
          className="pm-select"
        >
          <option value="">All Buildings / Labs</option>
          <option value="General Production Building (GPB)">General Production Building (GPB)</option>
          <option value="QC Lab">Quality Control (QC) Lab</option>
          <option value="Microbiology Lab">Microbiology Lab</option>
          <option value="Warehouse">Warehouse</option>
        </select>
      </div>

      {loading ? (
        <div className="pm-loading">Loading Master Assets...</div>
      ) : (
        <table className="pm-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Equipment Name</th>
              <th>Manufacturer</th>
              <th>Location</th>
              <th>Criticality</th>
              <th>Calibration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#888' }}>
                  No assets found. Click the button above to register one.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => (
                <tr key={asset.id}>
                  <td><code>{asset.assetTag}</code></td>
                  <td><strong>{asset.name}</strong></td>
                  <td>{asset.manufacturer || 'N/A'}</td>
                  <td>{asset.building} - {asset.roomLocation}</td>
                  <td>
                    <span className={`badge criticality-${asset.criticality?.toLowerCase()}`}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td>{asset.requiresCalibration ? 'Yes' : 'No'}</td>
                  <td>
                    <span className={`badge status-${asset.status?.toLowerCase()}`}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* REGISTER ASSET MODAL */}
      {showModal && (
        <div className="pm-modal-backdrop">
          <div className="pm-modal">
            <h3>Register New Equipment / Machine</h3>
            <form onSubmit={handleCreateAsset}>
              <div className="form-group">
                <label>Asset Tag / ID</label>
                <input 
                  type="text" 
                  required
                  value={form.assetTag} 
                  onChange={(e) => setForm({...form, assetTag: e.target.value})}
                  className="pm-input" 
                />
              </div>
              <div className="form-group">
                <label>Equipment Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Liquid Bottle Washing M/C-01"
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="pm-input" 
                />
              </div>
              <div className="form-group">
                <label>Manufacturer</label>
                <input 
                  type="text" 
                  placeholder="e.g., Litco Machinery"
                  value={form.manufacturer} 
                  onChange={(e) => setForm({...form, manufacturer: e.target.value})}
                  className="pm-input" 
                />
              </div>
              <div className="form-group">
                <label>Building / Area</label>
                <select 
                  value={form.building} 
                  onChange={(e) => setForm({...form, building: e.target.value})}
                  className="pm-select"
                >
                  <option value="General Production Building (GPB)">General Production Building (GPB)</option>
                  <option value="QC Lab">Quality Control (QC) Lab</option>
                  <option value="Microbiology Lab">Microbiology Lab</option>
                  <option value="Warehouse">Warehouse</option>
                </select>
              </div>
              <div className="form-group">
                <label>Room Location</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Bottle Washing Room"
                  value={form.roomLocation} 
                  onChange={(e) => setForm({...form, roomLocation: e.target.value})}
                  className="pm-input" 
                />
              </div>
              <div className="form-group">
                <label>Criticality Class</label>
                <select 
                  value={form.criticality} 
                  onChange={(e) => setForm({...form, criticality: e.target.value})}
                  className="pm-select"
                >
                  <option value="CLASS_A">Class A (Critical / Line Stopper)</option>
                  <option value="CLASS_B">Class B (Important)</option>
                  <option value="CLASS_C">Class C (General Utility)</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="requiresCal"
                  checked={form.requiresCalibration} 
                  onChange={(e) => setForm({...form, requiresCalibration: e.target.checked})}
                />
                <label htmlFor="requiresCal">Requires Periodic Calibration</label>
              </div>
              {form.requiresCalibration && (
                <div className="form-group">
                  <label>Next Calibration Due Date</label>
                  <input 
                    type="date" 
                    value={form.nextCalibrationDueDate} 
                    onChange={(e) => setForm({...form, nextCalibrationDueDate: e.target.value})}
                    className="pm-input" 
                  />
                </div>
              )}
              <div className="pm-modal-actions">
                <button type="button" className="pm-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="pm-btn-primary">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}