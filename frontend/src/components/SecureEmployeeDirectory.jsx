import { useState } from 'react';
import { UserPlus, UserCog, Eye, EyeOff } from 'lucide-react';
import SecureUserAccountActions from './SecureUserAccountActions';
import axios from 'axios';
import {
  userManagementApi,
  getUserManagementError,
} from '../api/userManagementApi';

const API_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

const CREATABLE_ROLES = [
  ['ADMINISTRATOR', 'Full Access — Administrator (Super Admin only)'],
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

const blankEmployee = () => ({
  username: '',
  fullName: '',
  email: '',
  password: '',
  roleCodes: '',
});

export default function SecureEmployeeDirectory() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [employees, setEmployees] = useState([]);
  const [managedUserId, setManagedUserId] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(blankEmployee);
  const [creating, setCreating] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const clearSession = () => {
    setToken('');
    setPassword('');
    setEmployees([]);
    setTotal(0);
    setPage(1);
    setCreating(false);
    setForm(blankEmployee());
  };

  const fetchPage = async (jwt, nextPage) => {
    const result = await userManagementApi.list(jwt, {
      page: nextPage,
      limit: 25,
    });

    if (!Array.isArray(result?.users)) {
      throw new Error('Unexpected ERP user directory response.');
    }

    setEmployees(result.users);
    setTotal(Number(result.total) || 0);
    setPage(nextPage);
  };

  const reportError = (err) => {
    if (err?.response?.status === 401) {
      clearSession();
    }
    setError(getUserManagementError(err));
  };

  const signIn = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const result = await axios.post(`${API_URL}/auth/login`, {
        username: username.trim(),
        pass: password,
      }, { timeout: 15000 });

      const jwt = result.data?.access_token;

      if (typeof jwt !== 'string' || !jwt) {
        throw new Error('No backend JWT returned.');
      }

      // Backend authorization must succeed before the session
      // becomes available to User Management.
      await fetchPage(jwt, 1);
      setToken(jwt);
      setPassword('');
      setNotice('Authenticated backend directory.');
    } catch (err) {
      clearSession();
      reportError(err);
    } finally {
      setBusy(false);
    }
  };

  const loadPage = async (nextPage) => {
    if (!token || busy) return;
    setBusy(true);
    setError('');

    try {
      await fetchPage(token, nextPage);
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  };

  const createEmployee = async (event) => {
    event.preventDefault();
    if (!token || busy) return;
    if (!form.roleCodes.split(',').filter(Boolean).length) {
      setError('Select at least one ERP access role.');
      return;
    }


    setBusy(true);
    setError('');
    setNotice('');

    try {
      await userManagementApi.create(token, {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        roleCodes: form.roleCodes.split(',')
          .map(code => code.trim().toUpperCase())
          .filter(Boolean),
      });

      // ERP_USER_CREATED_SUCCESS_V1
      const createdSummary = {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        roleCount: form.roleCodes.split(',').filter(Boolean).length,
      };
      setForm(blankEmployee());
      setCreating(false);
      setCreatedUser(createdSummary);
      setNotice('');

      try {
        await fetchPage(token, 1);
      } catch (err) {
        reportError(err);
      }
    } catch (err) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-indigo-500/30 bg-slate-900/70 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Secure ERP User Directory</h3>
          <p className="text-sm text-slate-400">
            Real ERP login accounts. Separate from demonstration users.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (open) clearSession();
            setOpen(!open);
            setError('');
            setNotice('');
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm"
        >
          {open ? 'Close secure directory' : 'Open secure directory'}
        </button>
      </div>

      {open && !token && (
        <form onSubmit={signIn} className="mt-4 grid max-w-lg gap-3">
          <p className="text-sm text-amber-300">
            Requires a real backend account with users.view permission.
            Demonstration credentials do not grant database access.
          </p>
          <input
            required
            aria-label="Backend username"
            autoComplete="username"
            value={username}
            onChange={event => setUsername(event.target.value)}
            placeholder="Backend username"
            className="rounded-lg border border-slate-700 bg-slate-950 p-3"
          />
          <input
            required
            aria-label="Backend password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="Backend password"
            className="rounded-lg border border-slate-700 bg-slate-950 p-3"
          />
          <button
            disabled={busy}
            type="submit"
            className="rounded-lg bg-indigo-600 p-3 disabled:opacity-50"
          >
            {busy ? 'Verifying...' : 'Sign in to backend'}
          </button>
        </form>
      )}

      {open && token && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-emerald-300">
              Backend authenticated — {total} ERP users
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => loadPage(page)}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm"
              >
                Refresh
              </button>
              {!creating && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setForm(blankEmployee());
                    setError('');
                    setCreating(true);
                  }}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm"
                >
                  Create ERP User
                </button>
              )}
              <button
                type="button"
                onClick={clearSession}
                className="rounded-lg bg-slate-700 px-3 py-2 text-sm"
              >
                Sign out
              </button>
            </div>
          </div>

          {creating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-erp-user-title"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 id="create-erp-user-title" className="text-base font-bold text-white">
                        Add New ERP User
                      </h3>
                      <p className="text-xs text-slate-400">
                        Create a login and assign ERP access roles.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close Create ERP User"
                    disabled={busy}
                    onClick={() => {
                      setCreating(false);
                      setForm(blankEmployee());
                      setError('');
                    }}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <form
                  onSubmit={createEmployee}
                  className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2"
                >
              {[
                ['username', 'Username'],
                ['fullName', 'Full name'],
                ['email', 'Email'],
                ['password', 'Temporary password'],
                ['roleCodes', 'ERP Access Role'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className={
                    'grid gap-1 text-sm min-w-0 ' +
                    (key === 'roleCodes' ? 'sm:col-span-2' : '')
                  }
                >
                  {label}
                  {key === 'roleCodes' ? (
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-400">
                          Select one or more ERP access roles
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm(current => ({
                            ...current,
                            roleCodes: '',
                          }))}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                        {CREATABLE_ROLES.map(([code, name]) => {
                          const selected = form.roleCodes
                            .split(',')
                            .filter(Boolean);
                          const checked = selected.includes(code);

                          return (
                            <label
                              key={code}
                              className={
                                'flex min-w-0 items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ' +
                                (checked
                                  ? 'border-indigo-500/40 bg-indigo-600/10 text-white'
                                  : 'border-slate-800 bg-slate-900 text-slate-400')
                              }
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setForm(current => {
                                  const previous = current.roleCodes
                                    .split(',')
                                    .filter(Boolean);
                                  const next = previous.includes(code)
                                    ? previous.filter(item => item !== code)
                                    : code === 'ADMINISTRATOR'
                                      ? ['ADMINISTRATOR']
                                      : [...previous.filter(
                                          item => item !== 'ADMINISTRATOR'
                                        ), code];

                                  return {
                                    ...current,
                                    roleCodes: next.join(','),
                                  };
                                })}
                                className="accent-indigo-600"
                              />
                              {name}
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400">
                        {form.roleCodes.split(',').filter(Boolean).length}
                        {' '}role(s) selected
                      </p>
                    </div>
                  ) : (
                  <div className="relative w-full min-w-0">
<input
                    required
                    type={
                      key === 'password' ? (showCreatePassword ? 'text' : 'password')
                        : key === 'email' ? 'email' : 'text'
                    }
                    minLength={key === 'password' ? 8 : undefined}
                    autoComplete={
                      key === 'password' ? 'new-password' : 'off'
                    }
                    value={form[key]}
                    onChange={event => setForm(previous => ({
                      ...previous,
                      [key]: event.target.value,
                    }))}
                    className="rounded-lg border border-slate-700 bg-slate-950 p-2 w-full min-w-0 pr-12"
                  />
{key === 'password' && (
<button
                        type="button"
                        aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showCreatePassword}
                        onClick={() => setShowCreatePassword(value => !value)}
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-slate-400 hover:text-indigo-300"
                      >
                        {showCreatePassword
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                  )}
                  </div>
                  )}
                </label>
              ))}
              <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setCreating(false);
                    setForm(blankEmployee());
                    setError('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !form.roleCodes.split(',').filter(Boolean).length}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {busy ? 'Creating...' : 'Create ERP User'}
                </button>
              </div>
            </form>
              </section>
            </div>
          )}




          {createdUser && (
            <div
              className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
              role="presentation"
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="erp-created-title"
                aria-describedby="erp-created-description"
                className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 text-white shadow-2xl"
              >
                <div className="mb-5 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <svg
                      className="h-9 w-9 text-emerald-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m7 12 3 3 7-7" />
                    </svg>
                  </div>
                </div>

                <h3
                  id="erp-created-title"
                  className="text-center text-xl font-bold"
                >
                  ERP User Created Successfully
                </h3>
                <p
                  id="erp-created-description"
                  className="mt-2 text-center text-sm text-slate-400"
                >
                  The backend confirmed the new ERP account was created.
                </p>

                <div className="mt-6 space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                  <div>
                    <p className="text-xs text-slate-400">Full name</p>
                    <p className="mt-1 font-medium">
                      {createdUser.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Username</p>
                    <p className="mt-1 font-medium">
                      {createdUser.username}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">
                      Assigned ERP access roles
                    </p>
                    <p className="mt-1 font-medium">
                      {createdUser.roleCount}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  For security, the temporary password is not shown.
                </p>

                <button
                  type="button"
                  autoFocus
                  onClick={() => setCreatedUser(null)}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  Done
                </button>
              </section>
            </div>
          )}

          {managedUserId && (
            <div
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
              onMouseDown={event => {
                if (event.target === event.currentTarget) {
                  setManagedUserId('');
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="erp-account-title"
                className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <header className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400">
                      <UserCog className="h-5 w-5" />
                    </div>
                    <div>
                      <h3
                        id="erp-account-title"
                        className="font-bold text-white text-base"
                      >
                        Manage ERP User Account
                      </h3>
                      <p className="text-xs text-slate-400">
                        Profile, account status, roles and password management.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close account management"
                    onClick={() => setManagedUserId('')}
                    className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    ✕
                  </button>
                </header>

                <div className="p-6 overflow-y-auto flex-1">
                  {employees
                    .filter(account => String(account.id) === managedUserId)
                    .map(account => (
                      <div key={account.id}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-600/20 text-base font-bold text-indigo-300">
                            {(account.fullName || account.username)
                              .charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              {account.fullName || account.username}
                            </p>
                            <p className="text-xs text-slate-400">
                              @{account.username}
                            </p>
                          </div>
                        </div>
                        <SecureUserAccountActions
                          key={[
                            account.id,
                            account.fullName,
                            account.email,
                            account.status,
                            ...(account.roles || []),
                          ].join(':')}
                          account={account}
                          token={token}
                          onUpdated={() => fetchPage(token, page)}
                          onUnauthorized={clearSession}
                        />
                      </div>
                    ))}
                </div>

                <footer className="p-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setManagedUserId('')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </footer>
              </section>
            </div>
          )}

<div className="overflow-x-auto">
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
                {employees.map(account => {
                  const roles = Array.isArray(account.roles)
                    ? account.roles
                    : [];

                  const isSuperAdmin = roles.includes('SUPER_ADMIN');
                  const isActive = account.status === 'ACTIVE';

                  const displayName =
                    account.fullName || account.username;

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                            {displayName.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              {displayName}
                            </p>
                            <p className="text-xs text-slate-400">
                              {account.email || account.username}
                            </p>
                            <p className="text-xs text-slate-500">
                              @{account.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {roles.length ? roles.map(role => (
                            <span
                              key={role}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20"
                            >
                              {role.replaceAll('_', ' ')}
                            </span>
                          )) : (
                            <span className="text-xs text-amber-300">
                              No assigned role
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="text-xs text-slate-300 font-medium bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                          {isSuperAdmin
                            ? 'Full Access (RBAC)'
                            : roles.length
                              ? 'Role-based access'
                              : 'No role access'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={
                            'inline-flex items-center gap-1.5 text-xs font-medium ' +
                            (isActive
                              ? 'text-emerald-400'
                              : 'text-amber-400')
                          }
                        >
                          <span
                            className={
                              'w-2 h-2 rounded-full ' +
                              (isActive
                                ? 'bg-emerald-500'
                                : 'bg-amber-500')
                            }
                          />
                          {account.status || 'UNKNOWN'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setManagedUserId(
                            String(account.id)
                          )}
                          className="px-3 py-2 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer text-xs font-medium"
                          aria-label={
                            'Manage ERP user ' + account.username
                          }
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {employees.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-sm text-slate-400"
                    >
                      No ERP user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {employees.length === 0 && (
              <p className="p-3 text-sm text-slate-400">
                No database employees found.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              disabled={busy || page <= 1}
              onClick={() => loadPage(page - 1)}
              className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              disabled={busy || page * 25 >= total}
              onClick={() => loadPage(page + 1)}
              className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {open && notice && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {open && error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
}
