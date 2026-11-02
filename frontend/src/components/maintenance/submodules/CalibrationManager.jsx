import React, { useState, useEffect } from 'react';

export default function CalibrationManager() {
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="pm-calibration-manager">
      <div className="pm-header-actions">
        <h2>Calibration & Cleanroom HVAC Compliance Lockout</h2>
        <span className="badge badge-warning">21 CFR Part 11 Enforced</span>
      </div>
      <p className="pm-subtext">
        QC and Microbiology instruments with expired calibration dates automatically trigger production scheduling lockouts.
      </p>

      <table className="pm-table">
        <thead>
          <tr>
            <th>Instrument ID / Tag</th>
            <th>Name</th>
            <th>Last Calibration</th>
            <th>Next Due Date</th>
            <th>Compliance Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>EQ QC 001</code></td>
            <td>Shimadzu UV-VIS Spectrophotometer</td>
            <td>2025-08-10</td>
            <td>2026-08-06 (Due Today)</td>
            <td><span className="badge status-warning">PENDING RENEWAL</span></td>
            <td><button className="pm-btn-secondary">Log Calibration</button></td>
          </tr>
          <tr>
            <td><code>EQ MIC 021</code></td>
            <td>Airborne Particle Counter</td>
            <td>2026-01-15</td>
            <td>2027-01-15</td>
            <td><span className="badge status-operational">COMPLIANT</span></td>
            <td><button className="pm-btn-secondary">View Certificate</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}