import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  MapPin, 
  FileText, 
  Search, 
  Plus, 
  Download,
  X,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Car,
  Calendar,
  CreditCard,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Phone,
  Mail
} from 'lucide-react';

export default function HrmModule() {
  const [activeTab, setActiveTab] = useState('directory');
  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic State Synced with NestJS Backend
  const [personnel, setPersonnel] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [metrics, setMetrics] = useState({ 
    totalHeadcount: 0, 
    totalSalariedPayroll: 0, 
    totalHourlyWagePool: 0,
    facilitiesActive: 15 
  });
  
  // Form & Execution States
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [targetMonth, setTargetMonth] = useState('October 2026');
  const [bonusInput, setBonusInput] = useState(0);
  const [customRemarks, setCustomRemarks] = useState('');

  // Enhanced Modal State with Phone & Email
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    phone: '',
    email: '',
    role: '',
    department: 'Sales & Distribution',
    facility: 'Head Office - Corporate',
    payrollType: 'Salaried',
    baseSalary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    probationEndDate: '',
    hasProvidentFund: true,
    providentFundRate: 10,
    hasGratuity: true,
    usesCompanyCar: false,
    carOverheadCost: 0,
    taxDeductionTds: 0,
    bankName: 'BRAC Bank PLC',
    bankAccountNumber: ''
  });

  const facilitiesList = [
    'ALL',
    'Head Office - Corporate',
    'Manufacturing Plant - Birulia',
    'Depot - Dhaka',
    'Depot - Mymensingh',
    'Depot - Dinajpur',
    'Depot - Rajshahi',
    'Depot - Bogra',
    'Depot - Chittagong',
    'Depot - Comilla',
    'Depot - Noakhali',
    'Depot - Sylhet',
    'Depot - Barisal',
    'Depot - Faridpur',
    'Depot - Jessore',
    'Depot - Kushtia'
  ];

  const departmentsList = [
    'ALL',
    'Executive Management',
    'Plant Operations',
    'Quality Assurance & R&D',
    'Sales & Distribution',
    'Finance & Accounting',
    'Information Technology',
    'Supply Chain & SCM',
    'Facility Maintenance'
  ];

  // Fetch live personnel, metrics, payroll dispatches & attendance from NestJS backend
  const fetchHrmData = async () => {
    setLoading(true);
    try {
      const [empRes, metRes, attRes, payRes] = await Promise.all([
        fetch('http://localhost:3000/hrm/employees').catch(() => ({ json: () => [] })),
        fetch('http://localhost:3000/hrm/metrics').catch(() => ({ json: () => ({}) })),
        fetch('http://localhost:3000/hrm/attendance').catch(() => ({ json: () => [] })),
        fetch('http://localhost:3000/hrm/payroll/dispatches').catch(() => ({ json: () => [] }))
      ]);

      const empData = await empRes.json();
      const metData = await metRes.json();
      const attData = await attRes.json();
      const payData = await payRes.json();

      setPersonnel(Array.isArray(empData) ? empData : []);
      setMetrics({
        totalHeadcount: metData.totalHeadcount || (Array.isArray(empData) ? empData.length : 0),
        totalSalariedPayroll: metData.totalSalariedPayroll || 0,
        totalHourlyWagePool: metData.totalHourlyWagePool || 0,
        facilitiesActive: metData.facilitiesActive || 15
      });
      setAttendanceLogs(Array.isArray(attData) ? attData : []);
      setPayrollHistory(Array.isArray(payData) ? payData : []);
    } catch (err) {
      console.error('Error syncing with HRM NestJS service:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHrmData();
  }, []);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!newEmployee.fullName || !newEmployee.role || !newEmployee.baseSalary || !newEmployee.joiningDate) {
      alert('Please fill out all mandatory fields (Name, Role, Base Salary, Joining Date).');
      return;
    }

    try {
      const payload = {
        ...newEmployee,
        baseSalary: Number(newEmployee.baseSalary),
        taxDeductionTds: Number(newEmployee.taxDeductionTds),
        providentFundRate: newEmployee.hasProvidentFund ? Number(newEmployee.providentFundRate) : 0,
        carOverheadCost: newEmployee.usesCompanyCar ? Number(newEmployee.carOverheadCost) : 0
      };

      const res = await fetch('http://localhost:3000/hrm/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowOnboardModal(false);
        setNewEmployee({
          fullName: '',
          phone: '',
          email: '',
          role: '',
          department: 'Sales & Distribution',
          facility: 'Head Office - Corporate',
          payrollType: 'Salaried',
          baseSalary: '',
          joiningDate: new Date().toISOString().split('T')[0],
          probationEndDate: '',
          hasProvidentFund: true,
          providentFundRate: 10,
          hasGratuity: true,
          usesCompanyCar: false,
          carOverheadCost: 0,
          taxDeductionTds: 0,
          bankName: 'BRAC Bank PLC',
          bankAccountNumber: ''
        });
        fetchHrmData();
      } else {
        alert('Failed to save personnel record to database.');
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
    }
  };

  const handleRunPayrollDispatch = async (e) => {
    e.preventDefault();
    setDispatching(true);
    try {
      const res = await fetch('http://localhost:3000/hrm/payroll/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: targetMonth,
          bonusAmount: Number(bonusInput) || 0,
          remarks: customRemarks || `Monthly Overhead Salary & Performance Bonus Disbursement for ${targetMonth}`
        })
      });
      
      if (!res.ok) {
        throw new Error('Server returned an error processing payroll.');
      }

      const data = await res.json();
      alert(`✓ ${targetMonth} Payroll Dispatched Successfully!\nGross Overhead: ৳ ${Number(data.totalGrossPayout || 0).toLocaleString()}\nNet Payout: ৳ ${Number(data.netPayableDisbursement || 0).toLocaleString()}\n(Credited to Account 21400 Salaries Payable in General Ledger)`);
      
      setBonusInput(0);
      setCustomRemarks('');
      fetchHrmData();
    } catch (err) {
      alert('Failed to dispatch payroll to General Ledger.');
    } finally {
      setDispatching(false);
    }
  };

  const filteredPersonnel = personnel.filter(item => {
    const matchesFacility = selectedFacility === 'ALL' || item.facility === selectedFacility;
    const matchesDepartment = selectedDepartment === 'ALL' || item.department === selectedDepartment;
    const matchesSearch = (item.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.employeeCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFacility && matchesDepartment && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 font-sans relative">
      
      {/* Top Glassmorphic Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-full text-xs font-mono font-bold">
              Amico Enterprise ERP • HRM Platform
            </span>
            <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-mono">
              Live DB Synced (NestJS + TypeORM)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-400 p-1.5 bg-cyan-500/10 rounded-xl" />
            Human Resources & Workforce Management
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Executive Governance (Chairman Mojibul Islam & ED Ruzlan Islam) • Fully synced with Accounts Ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHrmData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Refresh Database Sync"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowOnboardModal(true)}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 font-mono"
          >
            <Plus className="w-4 h-4" /> Onboard Personnel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400">Total Workforce</p>
            <h3 className="text-xl font-extrabold text-white mt-1">{metrics.totalHeadcount} Personnel</h3>
            <span className="text-xs text-emerald-400 font-mono mt-1 block">HQ, Birulia Plant & 13 Depots</span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400">Monthly Salaried Payroll</p>
            <h3 className="text-xl font-extrabold text-cyan-400 mt-1">৳ {Number(metrics.totalSalariedPayroll).toLocaleString()}</h3>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Accounts Ledger Synced</span>
          </div>
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400">Hourly Worker Wage Pool</p>
            <h3 className="text-xl font-extrabold text-purple-400 mt-1">৳ {Number(metrics.totalHourlyWagePool).toLocaleString()}</h3>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Birulia Factory Floor & Shift Labor</span>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-slate-400">Finance Ledger Posting</p>
            <h3 className="text-xl font-extrabold text-emerald-400 mt-1">100% Automated</h3>
            <span className="text-xs text-slate-400 font-mono mt-1 block">Direct Journal Entry Pipeline</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'directory' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Personnel Directory
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payroll' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Payroll & Finance Integration
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'attendance' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" /> Biometric & Depot GPS Tracking
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`px-5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'compliance' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> cGMP & Labor Safety Audits
        </button>
      </div>

      {/* Dynamic Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search personnel by name, role, employee code, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          >
            {departmentsList.map(dep => (
              <option key={dep} value={dep}>Dept: {dep}</option>
            ))}
          </select>

          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="w-full sm:w-56 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
          >
            {facilitiesList.map(fac => (
              <option key={fac} value={fac}>{fac}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table View */}
      {activeTab === 'directory' && (
        <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Live Database Table • hrm_employees</span>
            <span className="text-xs font-mono text-slate-400">Showing {filteredPersonnel.length} personnel records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950/40 uppercase">
                  <th className="p-4">Employee ID & Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Designation / Department</th>
                  <th className="p-4">Facility & Joining Date</th>
                  <th className="p-4">Benefit Allocations</th>
                  <th className="p-4 text-right">Base Compensation (৳)</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs font-mono">
                {filteredPersonnel.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-all">
                    <td className="p-4">
                      <div className="font-bold text-white">{item.fullName}</div>
                      <div className="text-[11px] text-cyan-400">{item.employeeCode}</div>
                    </td>
                    <td className="p-4 text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3 h-3 text-cyan-400" /> {item.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-500" /> {item.email || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-bold">{item.role}</div>
                      <div className="text-[11px] text-slate-400">{item.department}</div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {item.facility}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Joined: {item.joiningDate || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.hasProvidentFund && (
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold">
                            PF ({item.providentFundRate || 10}%)
                          </span>
                        )}
                        {item.hasGratuity && (
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold">
                            Gratuity
                          </span>
                        )}
                        {item.usesCompanyCar && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold flex items-center gap-1">
                            <Car className="w-3 h-3" /> Vehicle (৳{Number(item.carOverheadCost || 0).toLocaleString()})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-white">৳ {Number(item.baseSalary).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                        {item.employmentStatus || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payroll View */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Distinguished Payroll & Overhead Disbursement Form</span>
              <h3 className="text-base font-bold text-white mt-1">Real-Time Journal Sync to Account 21400 (Salaries Payable)</h3>
              <p className="text-xs text-slate-400">
                Configure monthly salary cycles, add performance/festival bonuses, and post real-time journal entries to General Ledger.
              </p>
            </div>

            <form onSubmit={handleRunPayrollDispatch} className="space-y-4 pt-2 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400">Disbursement Cycle Month</label>
                  <select
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="October 2026">October 2026</option>
                    <option value="November 2026">November 2026</option>
                    <option value="December 2026">December 2026</option>
                    <option value="January 2027">January 2027</option>
                    <option value="February 2027">February 2027</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Additional Performance / Festival Bonus (৳)</label>
                  <input
                    type="number"
                    placeholder="e.g., 50000"
                    value={bonusInput}
                    onChange={(e) => setBonusInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={dispatching}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" /> {dispatching ? 'Posting to GL...' : `Dispatch & Credit 21400`}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Transaction Narration / Journal Remarks</label>
                <input
                  type="text"
                  placeholder="e.g., Executive & Plant Staff October salary payout including Eid-ul-Fitr performance bonus allocation."
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40 space-y-4">
              <h4 className="text-xs font-mono text-cyan-400 uppercase">Live Overhead Computation Summary</h4>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Base Monthly Staff Payroll</span>
                  <span className="text-white font-bold">৳ {Number(metrics.totalSalariedPayroll + metrics.totalHourlyWagePool).toLocaleString()}</span>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Net Payable Pool (After TDS & PF)</span>
                  <span className="text-emerald-400 font-bold">৳ {Number(((metrics.totalSalariedPayroll + metrics.totalHourlyWagePool) + Number(bonusInput)) * 0.85).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40 space-y-4">
              <h4 className="text-xs font-mono text-purple-400 uppercase">Statutory Withholdings (NBR Tax & PF)</h4>
              <div className="space-y-3 text-xs font-mono">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Total NBR TDS Withholding</span>
                  <span className="text-cyan-400 font-bold">৳ {Number((metrics.totalSalariedPayroll + metrics.totalHourlyWagePool) * 0.08).toLocaleString()}</span>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Provident Fund Trust Allocation</span>
                  <span className="text-purple-400 font-bold">৳ {Number((metrics.totalSalariedPayroll + metrics.totalHourlyWagePool) * 0.07).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-mono text-cyan-400 uppercase">Archived Monthly Dispatches (Posted to General Ledger)</span>
              <span className="text-xs font-mono text-slate-400">{payrollHistory.length} Cycles Logged</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 bg-slate-950/40 uppercase">
                    <th className="p-4">Disbursement Cycle</th>
                    <th className="p-4 text-right">Gross Payout (৳)</th>
                    <th className="p-4 text-right">TDS Deduction (৳)</th>
                    <th className="p-4 text-right">PF Deduction (৳)</th>
                    <th className="p-4 text-right">Net Disbursement (৳)</th>
                    <th className="p-4 text-center">GL Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs font-mono">
                  {payrollHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-all">
                      <td className="p-4 font-bold text-white">{item.dispatchMonth}</td>
                      <td className="p-4 text-right text-slate-300">৳ {Number(item.totalGrossPayout).toLocaleString()}</td>
                      <td className="p-4 text-right text-cyan-400">৳ {Number(item.totalTdsDeductions).toLocaleString()}</td>
                      <td className="p-4 text-right text-purple-400">৳ {Number(item.totalPfDeductions).toLocaleString()}</td>
                      <td className="p-4 text-right font-bold text-emerald-400">৳ {Number(item.netPayableDisbursement).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold">
                          {item.ledgerStatus || 'POSTED_TO_FINANCE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payrollHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500">No past payroll dispatches found. Process your first monthly salary cycle above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance View */}
      {activeTab === 'attendance' && (
        <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40 space-y-4">
          <span className="text-xs font-mono text-cyan-400 uppercase">Biometric & Geo-Tracking Module</span>
          <h3 className="text-base font-bold text-white">Birulia Plant RFID Turnstiles & 13 Depot GPS Logs</h3>
          <p className="text-xs text-slate-400">
            Real-time biometric attendance verification syncing field sales reps across Dhaka, Chittagong, Sylhet, and manufacturing floor shifts.
          </p>

          <div className="pt-4 space-y-2">
            <h4 className="text-xs font-mono text-slate-400">Recent Attendance Records (hrm_attendance_logs)</h4>
            <div className="space-y-2 text-xs font-mono">
              {attendanceLogs.length > 0 ? (
                attendanceLogs.map((log, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex justify-between items-center">
                    <span>{log.employeeCode} ({log.facility})</span>
                    <span className="text-cyan-400">{log.checkInTime}</span>
                    <span className="text-emerald-400 font-bold">{log.status}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-500 text-center">
                  No attendance logs found in current session.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compliance View */}
      {activeTab === 'compliance' && (
        <div className="border border-slate-800 rounded-2xl p-6 bg-slate-900/40 space-y-4">
          <span className="text-xs font-mono text-emerald-400 uppercase">cGMP Safety & Labor Law Compliance</span>
          <h3 className="text-base font-bold text-white">Cleanroom Health Logs & Factory Audits</h3>
          <p className="text-xs text-slate-400">
            Supervised by Factory GM Mizanur Rahman and Pharmacist Dr. Farhana Yasmin. Maintains safety gear compliance, health logs, and labor law audits for all Birulia plant personnel.
          </p>
        </div>
      )}

      {/* ENHANCED ONBOARDING MODAL WIZARD WITH PHONE & EMAIL */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Goal-Oriented Onboarding Engine
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">Register New Personnel</h3>
              </div>
              <button 
                onClick={() => setShowOnboardModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-6 text-xs font-mono">
              
              {/* SECTION 1: BASIC IDENTIFICATION, PHONE & EMAIL */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  1. Basic Identification, Contact & Placement
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Tanvir Ahmed"
                      value={newEmployee.fullName}
                      onChange={(e) => setNewEmployee({...newEmployee, fullName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g., +8801700000000"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g., tanvir@amico.com"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400">Designation / Role *</label>
                    <input
                      type="text"
                      placeholder="e.g., Depot Sales Executive"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Department</label>
                    <select
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {departmentsList.filter(d => d !== 'ALL').map(dep => (
                        <option key={dep} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Facility / Operational Hub</label>
                    <select
                      value={newEmployee.facility}
                      onChange={(e) => setNewEmployee({...newEmployee, facility: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      {facilitiesList.filter(f => f !== 'ALL').map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DATES & TENURE SCHEDULE */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 2. Key Tenure & Date Controls
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400">Joining Date *</label>
                    <input
                      type="date"
                      value={newEmployee.joiningDate}
                      onChange={(e) => setNewEmployee({...newEmployee, joiningDate: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Probation Review End Date</label>
                    <input
                      type="date"
                      value={newEmployee.probationEndDate}
                      onChange={(e) => setNewEmployee({...newEmployee, probationEndDate: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: STATUTORY BENEFITS TOGGLES */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  3. Statutory Benefits & Facility Toggles
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Provident Fund Toggle */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-bold">Provident Fund</span>
                      <button
                        type="button"
                        onClick={() => setNewEmployee({...newEmployee, hasProvidentFund: !newEmployee.hasProvidentFund})}
                        className="text-cyan-400 cursor-pointer"
                      >
                        {newEmployee.hasProvidentFund ? <ToggleRight className="w-6 h-6 text-cyan-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                      </button>
                    </div>
                    {newEmployee.hasProvidentFund && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Rate (%)</label>
                        <input
                          type="number"
                          value={newEmployee.providentFundRate}
                          onChange={(e) => setNewEmployee({...newEmployee, providentFundRate: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Gratuity Toggle */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-bold">Gratuity Scheme</span>
                      <button
                        type="button"
                        onClick={() => setNewEmployee({...newEmployee, hasGratuity: !newEmployee.hasGratuity})}
                        className="text-cyan-400 cursor-pointer"
                      >
                        {newEmployee.hasGratuity ? <ToggleRight className="w-6 h-6 text-blue-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Statutory tenure entitlement</span>
                  </div>

                  {/* Company Vehicle Toggle */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 font-bold">Company Vehicle</span>
                      <button
                        type="button"
                        onClick={() => setNewEmployee({...newEmployee, usesCompanyCar: !newEmployee.usesCompanyCar})}
                        className="text-cyan-400 cursor-pointer"
                      >
                        {newEmployee.usesCompanyCar ? <ToggleRight className="w-6 h-6 text-amber-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                      </button>
                    </div>
                    {newEmployee.usesCompanyCar && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400">Monthly Cost (৳)</label>
                        <input
                          type="number"
                          placeholder="e.g., 25000"
                          value={newEmployee.carOverheadCost}
                          onChange={(e) => setNewEmployee({...newEmployee, carOverheadCost: e.target.value})}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 4: COMPENSATION & BANK DISBURSEMENT */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> 4. Compensation & Financial Routing
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400">Payroll Type</label>
                    <select
                      value={newEmployee.payrollType}
                      onChange={(e) => setNewEmployee({...newEmployee, payrollType: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Hourly Wage">Hourly Wage</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Monthly Compensation / Base Wage (৳) *</label>
                    <input
                      type="number"
                      placeholder="e.g., 75000"
                      value={newEmployee.baseSalary}
                      onChange={(e) => setNewEmployee({...newEmployee, baseSalary: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400">NBR TDS Tax (৳)</label>
                    <input
                      type="number"
                      placeholder="e.g., 3500"
                      value={newEmployee.taxDeductionTds}
                      onChange={(e) => setNewEmployee({...newEmployee, taxDeductionTds: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Bank Name</label>
                    <input
                      type="text"
                      value={newEmployee.bankName}
                      onChange={(e) => setNewEmployee({...newEmployee, bankName: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Bank Account No.</label>
                    <input
                      type="text"
                      placeholder="e.g., 150120..."
                      value={newEmployee.bankAccountNumber}
                      onChange={(e) => setNewEmployee({...newEmployee, bankAccountNumber: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Save to DB
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}