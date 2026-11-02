import React, { useState } from 'react';

export default function HvacMonitoring() {
  // Simulated Cleanroom Air Handling Units (AHU) & Differential Pressure ($\Delta P$) telemetry
  const [hvacUnits] = useState([
    {
      id: 'AHU-GPB-01',
      zone: 'Oral Liquid Filling & Sealing (Class C)',
      supplyTemp: '20.5°C',
      humidity: '45.2%',
      differentialPressure: '+15.2 Pa',
      status: 'OPTIMAL',
      filterLifespan: '78%'
    },
    {
      id: 'AHU-GPB-02',
      zone: 'Solid Tablet Compression (Class D)',
      supplyTemp: '21.0°C',
      humidity: '48.0%',
      differentialPressure: '+12.5 Pa',
      status: 'OPTIMAL',
      filterLifespan: '65%'
    },
    {
      id: 'AHU-QC-01',
      zone: 'Quality Control Instrumental Lab',
      supplyTemp: '19.8°C',
      humidity: '42.1%',
      differentialPressure: '+18.0 Pa',
      status: 'OPTIMAL',
      filterLifespan: '90%'
    },
    {
      id: 'AHU-MIC-01',
      zone: 'Microbiology Cleanroom (Class B/A)',
      supplyTemp: '20.1°C',
      humidity: '40.5%',
      differentialPressure: '+25.4 Pa',
      status: 'OPTIMAL',
      filterLifespan: '42%'
    }
  ]);

  return (
    <div className="pm-hvac-monitoring">
      <div className="pm-header-actions">
        <h2>Cleanroom HVAC & Environmental Telemetry</h2>
        <span className="badge badge-success">BMS Live Integration Active</span>
      </div>
      <p className="pm-subtext">
        Real-time tracking of differential pressures ($\Delta P$), HEPA filter lifespans, and cleanroom environmental parameters across production buildings and labs.
      </p>

      <table className="pm-table">
        <thead>
          <tr>
            <th>AHU Unit ID</th>
            <th>Controlled Cleanroom Zone</th>
            <th>Supply Temp</th>
            <th>Humidity</th>
            <th>Diff. Pressure ($\Delta P$)</th>
            <th>HEPA Filter Life</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {hvacUnits.map((unit) => (
            <tr key={unit.id}>
              <td><code>{unit.id}</code></td>
              <td><strong>{unit.zone}</strong></td>
              <td>{unit.supplyTemp}</td>
              <td>{unit.humidity}</td>
              <td><span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{unit.differentialPressure}</span></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', background: '#e0e0e0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: unit.filterLifespan, background: '#1976d2', height: '100%' }}></div>
                  </div>
                  <span>{unit.filterLifespan}</span>
                </div>
              </td>
              <td>
                <span className="badge status-operational">{unit.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}