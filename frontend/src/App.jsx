// App.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { setErpSessionToken } from './api/erpAuthTransport';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import AnalyticsModule from './components/AnalyticsModule';
import ProcurementModule from './components/procurement/ProcurementModule';
import InventoryModule from './components/inventory/InventoryModule';
import RequisitionsModule from './components/requisitions/RequisitionsModule';
import ProductionModule from './components/production/ProductionModule';
import QualityModule from './components/quality/QualityModule';
import SalesModule from './components/sales/SalesModule';
import FinanceModule from './components/finance/FinanceModule';
import HrmModule from './components/hrm/HrmModule';
import PlantMaintenanceModule from './components/maintenance/PlantMaintenanceModule';
import ComplianceModule from './components/compliance/ComplianceModule';
import CrmModule from './components/crm/CrmModule';
import RnDModule from './components/rnd/RnDModule';
import DashboardOverview from './components/dashboard/DashboardOverview';
import amicoLogo from './amicologo.jpg';

import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  PackageCheck, 
  Factory, 
  ShieldCheck, 
  Truck, 
  DollarSign, 
  UserCheck, 
  Wrench, 
  FileText, 
  Network, 
  FlaskConical, 
  Settings, 
  LogOut, 
  Layers,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const [users, setUsers] = useState([
    { 
      id: 1, 
      name: 'Shahnawaz Iqbal Sadik', 
      email: 'shahnawaz@amicolab.com', 
      password: 'password123', 
      role: 'Administrator / Technical Lead', 
      status: 'Active', 
      permissions: ['overview', 'users', 'procurement', 'inventory', 'production', 'quality', 'sales', 'finance', 'hrm', 'maintenance', 'compliance', 'crm', 'rnd', 'analytics', 'settings'] 
    },
    {
      id: 2,
      name: 'Ruszlan Islam',
      email: 'ruzlan@amicolab.com',
      password: 'password123',
      role: 'Administrator / Executive Director',
      status: 'Active',
      permissions: ['overview', 'users', 'procurement', 'inventory', 'production', 'quality', 'sales', 'finance', 'hrm', 'maintenance', 'compliance', 'crm', 'rnd', 'analytics', 'settings']
    }
  ]);

  const [user, setUser] = useState(null);

  // Synchronize the shared in-memory API token with dashboard login.
  useEffect(() => {
    setErpSessionToken(
      user?.authSource === 'backend' ? user.token : null
    );
    return () => setErpSessionToken(null);
  }, [user?.authSource, user?.token]);

  const [activeTab, setActiveTab] = useState('overview');
  const [depotFilter, setDepotFilter] = useState('Depot - Dhaka');
  const [isDarkMode, setIsDarkMode] = useState(true);


  // ERP_SESSION_REVALIDATION_V1
  // The backend remains the authorization authority.
  useEffect(() => {
    if (user?.authSource !== 'backend') return undefined;

    const sessionToken = user.token;
    const sessionUsername = user.username;
    let active = true;
    let pending = false;
    let expiryTimer;

    const closeSession = () => {
      if (!active) return;
      setUser((current) =>
        current?.authSource === 'backend' &&
        current.token === sessionToken ? null : current
      );
    };

    let expiryMs;

    try {
      if (typeof sessionToken !== 'string' || !sessionToken) {
        closeSession();
        return undefined;
      }

      const payloadPart = sessionToken.split('.')[1];
      if (!payloadPart) throw new Error('Invalid JWT');

      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalized));

      if (
        typeof payload.exp !== 'number' ||
        !Number.isFinite(payload.exp)
      ) {
        throw new Error('JWT expiration missing');
      }

      expiryMs = payload.exp * 1000;

      if (expiryMs <= Date.now()) {
        closeSession();
        return undefined;
      }
    } catch {
      closeSession();
      return undefined;
    }

    const expireAfter = Math.min(
      Math.max(expiryMs - Date.now(), 0),
      2147483647
    );

    expiryTimer = window.setTimeout(() => {
      if (expiryMs <= Date.now()) closeSession();
    }, expireAfter);

    const apiBase = (
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    ).replace(/\/+$/, '');

    const revalidate = async () => {
      if (!active || pending) return;
      if (expiryMs <= Date.now()) {
        closeSession();
        return;
      }

      pending = true;

      try {
        const response = await axios.get(
          `${apiBase}/auth/me/permissions`,
          {
            headers: { Authorization: `Bearer ${sessionToken}` },
            timeout: 15000,
          }
        );

        if (!active) return;

        const verified = response.data;

        if (
          !verified ||
          verified.username !== sessionUsername ||
          !Array.isArray(verified.permissions) ||
          !verified.permissions.every(
            (code) =>
              typeof code === 'string' &&
              /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(code)
          )
        ) {
          closeSession();
          return;
        }

        setUser((current) => {
          if (
            current?.authSource !== 'backend' ||
            current.token !== sessionToken
          ) {
            return current;
          }

          const oldPermissions = current.permissions;
          const nextPermissions = verified.permissions;

          if (
            Array.isArray(oldPermissions) &&
            oldPermissions.length === nextPermissions.length &&
            nextPermissions.every((code) =>
              oldPermissions.includes(code)
            )
          ) {
            return current;
          }

          return { ...current, permissions: nextPermissions };
        });
      } catch (error) {
        if (!active) return;
        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          closeSession();
        }
      } finally {
        pending = false;
      }
    };

    const onFocus = () => { void revalidate(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void revalidate();
      }
    };

    void revalidate();
    const interval = window.setInterval(() => {
      void revalidate();
    }, 30000);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      window.clearTimeout(expiryTimer);
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener(
        'visibilitychange', onVisibilityChange
      );
    };
  }, [user?.authSource, user?.token, user?.username]);


  const moduleIds = [
    'overview', 'users', 'procurement', 'inventory',
    'production', 'quality', 'sales', 'finance', 'hrm',
    'maintenance', 'compliance', 'crm', 'rnd',
    'analytics', 'settings',
  ];

  const allowedTabs = user?.authSource === 'backend'
    ? moduleIds.filter((tab) =>
        Array.isArray(user.permissions) &&
        user.permissions.includes(`${tab}.view`)
      )
    : moduleIds;

  const selectedTab = allowedTabs.includes(activeTab)
    ? activeTab
    : allowedTabs[0] || null;


  // Navigation handler supporting direct depot cross-linking across modules
  const handleNavigate = (tab, depotName) => {
    if (!allowedTabs.includes(tab)) return;
    if (depotName) {
      setDepotFilter(depotName);
    }
    setActiveTab(tab);
  };

  // If user is not authenticated, render the Login component completely standalone
  if (!user) {
    return (
      <Login 
        onLoginSuccess={(userData) => setUser(userData)} 
        demoUsers={users} 
      />
    );
  }

  if (user?.authSource === 'backend' && !selectedTab) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-xl font-bold">AMICO LAB ERP</h1>
          <p className="mt-3 text-indigo-300">
            Signed in as {user.username}
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Your account has no authorized ERP modules.
            Contact an administrator to review your assigned roles.
          </p>
          <button
            type="button"
            onClick={() => setUser(null)}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-500"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management (RBAC)', icon: Users },
    { id: 'procurement', label: 'Procurement & Vendors', icon: ShoppingCart },
    { id: 'inventory', label: 'Raw Materials & Quarantine', icon: PackageCheck },
    { id: 'requisitions', label: 'Requisitions', icon: FileText },
    { id: 'production', label: 'Production & BOM Batch Mgmt', icon: Factory },
    { id: 'quality', label: 'Quality Assurance (QA/QC)', icon: ShieldCheck },
    { id: 'sales', label: 'Multi-Depot Sales (Depot 1-N)', icon: Truck },
    { id: 'finance', label: 'Finance & Accounting', icon: DollarSign },
    { id: 'hrm', label: 'HRM & Plant Personnel', icon: UserCheck },
    { id: 'maintenance', label: 'Plant Maintenance & EHS', icon: Wrench },
    { id: 'compliance', label: 'Regulatory Compliance (cGMP)', icon: FileText },
    { id: 'crm', label: 'CRM & Institutional Clients', icon: Network },
    { id: 'rnd', label: 'R&D Formulation Lab', icon: FlaskConical },
    { id: 'analytics', label: 'Predictive Analytics (AI)', icon: TrendingUp },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex transition-colors duration-300`}>
      {/* Sidebar Navigation */}
      <aside className={`w-72 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} border-r flex flex-col justify-between hidden md:flex sticky top-0 h-screen z-20 transition-colors duration-300`}>
        <div>
          <div className={`p-6 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} flex items-center gap-3`}>
            <img 
              src={amicoLogo} 
              alt="Amico Logo" 
              className="w-10 h-10 rounded-xl object-contain shadow-md bg-white p-0.5 border border-indigo-500/30" 
            />
            <div>
              <h1 className={`font-bold text-sm tracking-wide ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AMICO LAB ERP</h1>
              <p className="text-[10px] text-emerald-500 font-semibold">Pharma Enterprise Edition</p>
            </div>
          </div>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)] custom-scrollbar">
            {menuItems.filter((item) => allowedTabs.includes(item.id)).map((item) => {
              const Icon = item.icon;
              const isActive = selectedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isDarkMode 
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={() => setUser(null)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className={`h-16 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/80'} backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-300`}>
          <h2 className={`text-sm font-semibold capitalize ${isDarkMode ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>{selectedTab.replace('-', ' ')} Pharmaceutical Module</span>
          </h2>

          <div className="flex items-center gap-6">
            {/* Central Light / Dark Mode Toggle Active Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-sm cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'
              }`}
              title="Toggle Light/Dark Mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <div className="text-right hidden sm:block">
              <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.email || 'shahnawaz@amicolab.com'}</p>
              <p className="text-[10px] text-emerald-500 flex items-center gap-1 justify-end font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> cGMP Live Pipeline
              </p>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          {selectedTab === 'overview' && <DashboardOverview onNavigate={handleNavigate} />}
          {selectedTab === 'users' && <UserManagement users={users} setUsers={setUsers} />}
          {selectedTab === 'analytics' && <AnalyticsModule />}
          {selectedTab === 'procurement' && <ProcurementModule />}
          {selectedTab === 'inventory' && <InventoryModule />}
          {selectedTab === 'production' && <ProductionModule />}
          {selectedTab === 'quality' && <QualityModule />}
          {selectedTab === 'sales' && <SalesModule activeDepotFilter={depotFilter} onNavigate={handleNavigate} />}
          {selectedTab === 'finance' && <FinanceModule />}
          {selectedTab === 'hrm' && <HrmModule />}
          {selectedTab === 'maintenance' && <PlantMaintenanceModule />}
          {selectedTab === 'compliance' && <ComplianceModule />}
          {selectedTab === 'crm' && <CrmModule />}
          {selectedTab === 'rnd' && <RnDModule />}
          {activeTab === 'overview' && <DashboardOverview onNavigate={handleNavigate} />}
          {activeTab === 'users' && <UserManagement users={users} setUsers={setUsers} />}
          {activeTab === 'analytics' && <AnalyticsModule />}
          {activeTab === 'procurement' && <ProcurementModule />}
          {activeTab === 'inventory' && <InventoryModule />}
          {activeTab === 'production' && <ProductionModule />}
          {activeTab === 'quality' && <QualityModule />}
          {activeTab === 'sales' && <SalesModule activeDepotFilter={depotFilter} onNavigate={handleNavigate} />}
          {activeTab === 'finance' && <FinanceModule />}
          {activeTab === 'hrm' && <HrmModule />}
          {activeTab === 'maintenance' && <PlantMaintenanceModule />}
          {activeTab === 'compliance' && <ComplianceModule />}

          {activeTab === 'requisitions' && <RequisitionsModule />}
          {activeTab === 'crm' && <CrmModule />}
          {activeTab === 'rnd' && <RnDModule />}

          {/* Fallback for modules still under generic placeholder construction */}
          {['settings'].includes(selectedTab) && (
            <div className={`${isDarkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-2xl p-12 text-center space-y-3 shadow-sm`}>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold capitalize">{selectedTab.replace('-', ' ')} Module</h3>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-xs max-w-md mx-auto`}>
                High-end pharmaceutical workflow connected to NestJS backend controllers with automated audit trails and batch tracking.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}