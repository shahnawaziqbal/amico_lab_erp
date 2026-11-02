import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DepartmentView({ moduleName, endpoint }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3000/${endpoint}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(`Error loading ${moduleName}:`, err);
        setLoading(false);
      });
  }, [endpoint]);

  return (
    <div className="p-6 bg-[#0B0F19] text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-wide">{moduleName} Management</h1>
        <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition">
          + Add New Record
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400">Synchronizing with enterprise database...</div>
      ) : (
        <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                <th className="p-4">ID</th>
                <th className="p-4">Identifier / Title</th>
                <th className="p-4">Status / Metrics</th>
                <th className="p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">No records found in this sector.</td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/40 transition">
                    <td className="p-4 font-mono text-gray-400">#{item.id}</td>
                    <td className="p-4 font-medium">{item.companyName || item.projectName || item.equipmentName || item.regulationName || item.modelName || item.fullName || item.orderNumber || 'Standard Entity'}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.status || item.employmentStatus || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{item.createdAt || item.joiningDate || item.reportedDate || item.auditDate || item.startDate || item.lastUpdated || 'Live'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}