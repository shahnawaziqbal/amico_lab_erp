import React, { useState } from 'react';

export default function PreventiveMaintenance() {
  const [schedules] = useState([
    {
      id: 'PM-2026-001',
      assetTag: 'GPB-MFG-101-LBW-001',
      equipmentName: 'Liquid Bottle Washing M/C-01',
      taskDescription: 'Lubricate drive gears, inspect water spray nozzles & sanitize manifold lines',
      frequency: 'Monthly',
      lastService: '2026-07-05',
      nextDue: '2026-08-05 (Due Today)',
      status: 'PENDING'
    },
    {
      id: 'PM-2026-002',
      assetTag: 'GPB-MFG-119-TCM-001',
      equipmentName: 'Tablet Compression-01',
      taskDescription: 'Check upper/lower punch guides, clean die table & grease main bearings',
      frequency: 'Bi-Weekly',
      lastService: '2026-07-20',
      nextDue: '2026-08-10',
      status: 'SCHEDULED'
    },
    {
      id: 'PM-2026-003',
      assetTag: 'EQ QC 045',
      equipmentName: 'Shimadzu HPLC with RI Detector',
      taskDescription: 'System suitability test, flow cell flush & lamp intensity verification',
      frequency: 'Quarterly',
      lastService: '2026-05-10',
      nextDue: '2026-08-10',
      status: 'SCHEDULED'
    }
  ]);

  return (
    <div className="pm-preventive-maintenance">
      <div className="pm-header-actions">
        <h2>Preventive Maintenance (PM) & Meter Schedules</h2>
        <button className="pm-btn-primary">+ Add PM Schedule</button>
      </div>
      <p className="pm-subtext">
        Calendar and run-hour based recurring servicing schedules designed to eliminate unplanned shop-floor downtime.
      </p>

      <table className="pm-table">
        <thead>
          <tr>
            <th>Schedule ID</th>
            <th>Asset Tag & Name</th>
            <th>Task Description</th>
            <th>Frequency</th>
            <th>Last Service</th>
            <th>Next Due</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((pm) => (
            <tr key={pm.id}>
              <td><code>{pm.id}</code></td>
              <td><strong>{pm.assetTag}</strong><br/><span style={{ fontSize: '0.85rem', color: '#666' }}>{pm.equipmentName}</span></td>
              <td>{pm.taskDescription}</td>
              <td>{pm.frequency}</td>
              <td>{pm.lastService}</td>
              <td style={{ fontWeight: '500', color: pm.status === 'PENDING' ? '#d32f2f' : 'inherit' }}>{pm.nextDue}</td>
              <td>
                <span className={`badge status-${pm.status.toLowerCase()}`}>
                  {pm.status}
                </span>
              </td>
              <td>
                <button className="pm-btn-secondary">Execute Task</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}