import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Cpu, KeyRound } from 'lucide-react';
import axios from 'axios';

export default function Login({ onLoginSuccess, demoUsers = [] }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Attempt connection to NestJS backend endpoint
      const response = await axios.post('http://localhost:3000/auth/login', {
        email,
        password,
      });
      
      onLoginSuccess(response.data);
    } catch (err) {
      // Graceful fallback: check against dynamic App.jsx demoUsers state (synced from User Management)
      const matchedUser = demoUsers.find(
        (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
      );

      const validPassword = matchedUser?.password || matchedUser?.pass;

      if (matchedUser && password === validPassword) {
        onLoginSuccess({ 
          token: `demo-token-${Date.now()}`, 
          email: matchedUser.email, 
          name: matchedUser.name,
          role: matchedUser.role,
          permissions: matchedUser.permissions
        });
      } else {
        setError('Invalid work email or password. Select a verified profile from the quick assistant below.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass || 'password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            <Cpu className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">AMICO LAB ERP</h2>
          <p className="text-slate-400 text-sm mt-1">Pharmaceutical Enterprise & AI Core</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Work Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@amicolab.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500" />
              <span>Remember this device</span>
            </label>
            <a href="#forgot" onClick={(e) => e.preventDefault()} className="hover:text-indigo-400 transition-colors">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Enterprise Secure 256-bit Encrypted Session</span>
        </div>
      </div>

      {/* Quick Demo Credentials Assistant Box (Dynamically synced from UserManagement) */}
      <div className="max-w-md w-full mt-6 bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-left backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-indigo-400">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Quick Login Test Credentials (Synced from Directory):</span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
          {demoUsers.map((u, idx) => (
            <button
              key={u.id || idx}
              type="button"
              onClick={() => fillDemoCreds(u.email, u.password)}
              className="w-full text-left px-3 py-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/60 transition-all flex items-center justify-between text-xs cursor-pointer group"
            >
              <div>
                <span className="font-semibold text-white group-hover:text-indigo-300">{u.name}</span>
                <span className="text-slate-400 block text-[10px]">{u.role} ({u.email})</span>
              </div>
              <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Auto-fill →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}