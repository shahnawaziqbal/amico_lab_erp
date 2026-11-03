import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  userManagementApi,
  getUserManagementError,
} from '../api/userManagementApi';

const ROLES = [
  ['AUDITOR', 'Auditor'],
  ['FINANCE_MANAGER', 'Finance Manager'],
  ['HR_MANAGER', 'HR Manager'],
  ['INVENTORY_MANAGER', 'Inventory Manager'],
  ['MAINTENANCE_MANAGER', 'Maintenance Manager'],
  ['PROCUREMENT_MANAGER', 'Procurement Manager'],
  ['PROCUREMENT_OFFICER', 'Procurement Officer'],
  ['PRODUCTION_MANAGER', 'Production Manager'],
  ['QUALITY_APPROVER', 'Quality Approver'],
  ['QUALITY_OFFICER', 'Quality Officer'],
  ['SALES_MANAGER', 'Sales Manager'],
];

export default function SecureUserAccountActions({
  account, token, onUpdated, onUnauthorized,
}) {
  const currentRoles = Array.isArray(account.roles) ? account.roles : [];
  const protectedAccount = currentRoles.some(
    role => role === 'SUPER_ADMIN' || role === 'ADMINISTRATOR'
  );

  const [fullName, setFullName] = useState(account.fullName || '');
  const [email, setEmail] = useState(account.email || '');
  const [status, setStatus] = useState(account.status || 'ACTIVE');
  const [roles, setRoles] = useState(
    currentRoles.filter(role => ROLES.some(([code]) => code === role))
  );
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (work, success) => {
    if (busy || !token) return;
    setBusy(true);
    setMessage('');
    try {
      await work();
      setMessage(success);
      await onUpdated();
    } catch (error) {
      setMessage(getUserManagementError(error));
      if (error?.response?.status === 401) onUnauthorized();
    } finally {
      setBusy(false);
    }
  };

  const updateProfile = event => {
    event.preventDefault();
    run(
      () => userManagementApi.updateProfile(token, account.id, {
        fullName: fullName.trim(),
        email: email.trim(),
      }),
      'Profile updated.'
    );
  };

  const updateStatus = event => {
    event.preventDefault();
    if (protectedAccount || status === account.status) return;
    if (!window.confirm(`Change ${account.username} status to ${status}?`)) return;
    run(
      () => userManagementApi.updateStatus(token, account.id, status),
      'Account status updated.'
    );
  };

  const updateRoles = event => {
    event.preventDefault();
    if (protectedAccount || roles.length === 0) return;
    if (!window.confirm(`Replace roles for ${account.username}?`)) return;
    run(
      () => userManagementApi.assignRoles(token, account.id, roles),
      'RBAC roles updated.'
    );
  };

  const resetPassword = event => {
    event.preventDefault();
    const bytes = new TextEncoder().encode(newPassword).length;
    if (protectedAccount || bytes < 8 || bytes > 128) {
      setMessage('Password must be between 8 and 128 UTF-8 bytes.');
      return;
    }
    if (!window.confirm(`Reset password for ${account.username}?`)) return;
    const value = newPassword;
    setNewPassword('');
    run(
      () => userManagementApi.resetPassword(token, account.id, value),
      'Password reset successfully.'
    );
  };

  return (
    <div className="mt-3 grid gap-4 lg:grid-cols-2">
      <form onSubmit={updateProfile} className="grid gap-3 rounded-xl border border-slate-700 p-4">
        <h4 className="font-semibold text-white">Edit ERP user profile</h4>
        <label className="grid gap-1 text-sm text-slate-300">
          Full name
          <input required minLength={2} maxLength={150}
            value={fullName}
            onChange={event => setFullName(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" />
        </label>
        <label className="grid gap-1 text-sm text-slate-300">
          Email address
          <input required type="email" maxLength={254}
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" />
        </label>
        <button disabled={busy} className="rounded-lg bg-indigo-600 p-2 text-sm disabled:opacity-50">
          Save profile
        </button>
      </form>

      <form onSubmit={updateStatus} className="grid content-start gap-3 rounded-xl border border-slate-700 p-4">
        <h4 className="font-semibold text-white">Account status</h4>
        <select value={status}
          disabled={busy || protectedAccount}
          onChange={event => setStatus(event.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-white">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        {protectedAccount && (
          <p className="text-xs text-amber-300">
            Administrator accounts require a separate protected procedure.
          </p>
        )}
        <button disabled={busy || protectedAccount || status === account.status}
          className="rounded-lg bg-indigo-600 p-2 text-sm disabled:opacity-50">
          Update status
        </button>
      </form>

      <form onSubmit={updateRoles} className="grid gap-3 rounded-xl border border-slate-700 p-4">
        <h4 className="font-semibold text-white">RBAC role assignment</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLES.map(([code, label]) => (
            <label key={code} className="flex items-start gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={roles.includes(code)}
                disabled={busy || protectedAccount}
                onChange={() => setRoles(previous =>
                  previous.includes(code)
                    ? previous.filter(item => item !== code)
                    : [...previous, code]
                )} />
              {label}
            </label>
          ))}
        </div>
        <button disabled={busy || protectedAccount || roles.length === 0}
          className="rounded-lg bg-indigo-600 p-2 text-sm disabled:opacity-50">
          Save roles
        </button>
      </form>

      <form onSubmit={resetPassword} className="grid content-start gap-3 rounded-xl border border-slate-700 p-4">
        <h4 className="font-semibold text-white">Reset login password</h4>
        <label className="grid gap-1 text-sm text-slate-300">
          New temporary password
          <div className="relative w-full min-w-0"><input required type={showResetPassword ? "text" : "password"} minLength={8}
            autoComplete="new-password"
            value={newPassword}
            disabled={busy || protectedAccount}
            onChange={event => setNewPassword(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-white w-full min-w-0 pr-12" /><button
                  type="button"
                  aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showResetPassword}
                  disabled={busy || protectedAccount}
                  onClick={() => setShowResetPassword(value => !value)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  {showResetPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button></div>
        </label>
        <button disabled={busy || protectedAccount}
          className="rounded-lg bg-indigo-600 p-2 text-sm disabled:opacity-50">
          Reset password
        </button>
      </form>

      {message && (
        <p role="status" className="text-sm text-slate-300 lg:col-span-2">
          {message}
        </p>
      )}
    </div>
  );
}
