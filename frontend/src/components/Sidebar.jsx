import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
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
  BrainCircuit, 
  Settings 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management (RBAC)', icon: Users },
    { id: 'procurement', label: 'Procurement & Vendor Mgmt', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory & Quarantine', icon: PackageCheck },
    { id: 'production', label: 'Production & Batch (BOM)', icon: Factory },
    { id: 'quality', label: 'Quality Assurance (QA/QC)', icon: ShieldCheck },
    { id: 'sales', label: 'Sales & Multi-Depot Distribution', icon: Truck },
    { id: 'finance', label: 'Finance & Accounting', icon: DollarSign },
    { id: 'hrm', label: 'HRM & Plant Personnel', icon: UserCheck },
    { id: 'maintenance', label: 'Plant Maintenance (EHS)', icon: Wrench },
    { id: 'compliance', label: 'Regulatory Compliance (cGMP)', icon: FileText },
    { id: 'crm', label: 'CRM & Institutional Clients', icon: Network },
    { id: 'rmd', label: 'R&D Formulation Lab', icon: FlaskConical },
    { id: 'ai-analytics', label: 'AI Predictive Analytics', icon: BrainCircuit },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wide">AMICO LAB ERP</h1>
        <p className="text-xs text-emerald-400 font-medium mt-1">Pharma Enterprise Edition v3.4</p>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}