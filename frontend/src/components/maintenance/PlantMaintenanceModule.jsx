import React, { useState } from 'react';
import AssetRegistry from './submodules/AssetRegistry';
import WorkOrderPortal from './submodules/WorkOrderPortal';
import PreventiveMaintenance from './submodules/PreventiveMaintenance';
import HvacMonitoring from './submodules/HvacMonitoring';
import CalibrationManager from './submodules/CalibrationManager';
import './styles/maintenance.css';

export default function PlantMaintenanceModule() {
  const [activeTab, setActiveTab] = useState('assets');

  return (
    <div className="pm-module-container">
      <div className="pm-module-header">
        <h1>Enterprise Plant Maintenance (PM) Module</h1>
        <p className="pm-subtext">Amico Laboratories Limited (Savar, Dhaka) — ERP Technical Framework</p>
      </div>

      <div className="pm-tabs-navigation" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px' }}>
        <button 
          className={activeTab === 'assets' ? 'pm-btn-primary' : 'pm-btn-secondary'}
          onClick={() => setActiveTab('assets')}
        >
          Asset Registry
        </button>
        <button 
          className={activeTab === 'workorders' ? 'pm-btn-primary' : 'pm-btn-secondary'}
          onClick={() => setActiveTab('workorders')}
        >
          Work Order Portal
        </button>
        <button 
          className={activeTab === 'pm' ? 'pm-btn-primary' : 'pm-btn-secondary'}
          onClick={() => setActiveTab('pm')}
        >
          Preventive Maintenance
        </button>
        <button 
          className={activeTab === 'hvac' ? 'pm-btn-primary' : 'pm-btn-secondary'}
          onClick={() => setActiveTab('hvac')}
        >
          HVAC & Cleanroom Telemetry
        </button>
        <button 
          className={activeTab === 'calibration' ? 'pm-btn-primary' : 'pm-btn-secondary'}
          onClick={() => setActiveTab('calibration')}
        >
          Calibration & Compliance Lock
        </button>
      </div>

      <div className="pm-tab-content">
        {activeTab === 'assets' && <AssetRegistry />}
        {activeTab === 'workorders' && <WorkOrderPortal />}
        {activeTab === 'pm' && <PreventiveMaintenance />}
        {activeTab === 'hvac' && <HvacMonitoring />}
        {activeTab === 'calibration' && <CalibrationManager />}
      </div>
    </div>
  );
}