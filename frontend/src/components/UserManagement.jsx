import React, { useState } from 'react';
import SecureEmployeeDirectory from './SecureEmployeeDirectory';
import { UserPlus, Shield, Trash2, X, Lock, Check } from 'lucide-react';

const MODULE_LIST = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'users', label: 'User Management (RBAC)' },
  { id: 'procurement', label: 'Procurement & Vendors' },
  { id: 'inventory', label: 'Raw Materials & Quarantine' },
  { id: 'production', label: 'Production & BOM Batch Mgmt' },
  { id: 'quality', label: 'Quality Assurance (QA/QC)' },
  { id: 'sales', label: 'Multi-Depot Sales (Depot 1-N)' },
  { id: 'finance', label: 'Finance & Accounting' },
  { id: 'hrm', label: 'HRM & Plant Personnel' },
  { id: 'maintenance', label: 'Plant Maintenance & EHS' },
  { id: 'compliance', label: 'Regulatory Compliance (cGMP)' },
  { id: 'crm', label: 'CRM & Institutional Clients' },
  { id: 'rnd', label: 'R&D Formulation Lab' },
  { id: 'analytics', label: 'Predictive Analytics (AI)' },
  { id: 'settings', label: 'System Settings' },
];

const ALL_MODULE_IDS = MODULE_LIST.map(m => m.id);

export default function UserManagement({ users, setUsers }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Department Officer');
  const [selectedPermissions, setSelectedPermissions] = useState(['overview']);

  const handleTogglePermission = (modId) => {
    if (selectedPermissions.includes(modId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== modId));
    } else {
      setSelectedPermissions([...selectedPermissions, modId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(ALL_MODULE_IDS);
  };

  const handleClearAll = () => {
    setSelectedPermissions(['overview']);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    const newUser = {
      id: Date.now(),
      name: newName,
      email: newEmail,
      password: newPassword, // Automatically synced to App.jsx users state -> Login quick-fill
      role: newRole,
      status: 'Active',
      permissions: selectedPermissions,
    };

    setUsers([...users, newUser]);
    setIsModalOpen(false);
    
    // Reset form fields
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('Department Officer');
    setSelectedPermissions(['overview']);
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <SecureEmployeeDirectory />
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">System User Directory & RBAC</h3>
          <p className="text-slate-400 text-sm">Manage access control and department-specific permissions across the ERP. Newly created users instantly sync with the Login assistant.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users Directory Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="p-4">User Details</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Accessible Modules</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                    <Shield className="w-3 h-3" /> {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    {u.permissions.length === ALL_MODULE_IDS.length ? 'Full Access (All Modules)' : `${u.permissions.length} Modules Assigned`}
                  </span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {u.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Add New ERP User & Sync Credentials</h4>
                  <p className="text-xs text-slate-400">Creates profile and adds credentials to the login quick-fill assistant.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="tanvir@amicolab.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Login Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Role / Designation</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Executive Director">Executive Director</option>
                    <option value="Chairman">Chairman</option>
                    <option value="Technical Lead">Technical Lead</option>
                    <option value="Department Head">Department Head</option>
                    <option value="Department Officer">Department Officer</option>
                    <option value="Auditor / Inspector">Auditor / Inspector</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-300">Department / Module Access Permissions</label>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={handleSelectAll}
                      className="text-[10px] text-indigo-400 hover:underline cursor-pointer font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button 
                      type="button" 
                      onClick={handleClearAll}
                      className="text-[10px] text-slate-400 hover:underline cursor-pointer font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 max-h-44 overflow-y-auto">
                  {MODULE_LIST.map((mod) => {
                    const isChecked = selectedPermissions.includes(mod.id);
                    return (
                      <div 
                        key={mod.id}
                        onClick={() => handleTogglePermission(mod.id)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-indigo-600/10 border-indigo-500/40 text-white font-medium' 
                            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="truncate">{mod.label}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isChecked ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700 bg-slate-950'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Save User & Sync Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}