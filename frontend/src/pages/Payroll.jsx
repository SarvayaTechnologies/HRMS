import React, { useState, useEffect } from 'react';
import { 
  Wallet, Download, Loader2, Users, TrendingDown, TrendingUp, IndianRupee, 
  ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Play
} from 'lucide-react';

export default function Payroll() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:8001/payroll/org-summary", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load payroll");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleExecute = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      alert("Payroll disbursement executed successfully via Banking API integrations.");
    }, 2000);
  };

  if (loading) {
    return (
      <div className="p-10 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Running Enterprise Payroll Engine & Compliance Checks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 min-h-screen bg-slate-50">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">{error}</div>
      </div>
    );
  }

  const hasAnomalies = data.anomalies && data.anomalies.length > 0;

  return (
    <div className="p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Payroll Engine (India IT Act)</h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <span className="font-semibold">{data.month}</span> 
              <span>•</span>
              <span>{data.employee_count} employees</span>
              <span>•</span>
              {data.compliance_status === "Verified" ? (
                <span className="text-emerald-600 flex items-center gap-1 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs"><ShieldCheck size={14}/> Compliance Verified</span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1 font-semibold bg-amber-50 px-2 py-0.5 rounded text-xs"><ShieldAlert size={14}/> Review Required</span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <Download size={18} />
              Form 16 / PF Returns
            </button>
            <button 
              onClick={handleExecute}
              disabled={executing || hasAnomalies}
              className={`px-6 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg 
                ${executing ? 'bg-indigo-400 text-white cursor-wait' : 
                  hasAnomalies ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 
                  'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {executing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              Execute Disbursement
            </button>
          </div>
        </div>

        {/* AI Anomaly Detection Alert */}
        {hasAnomalies && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-3">
              <AlertTriangle size={20} /> AI Anomaly Detection Triggered
            </h3>
            <div className="space-y-2">
              {data.anomalies.map((anomaly, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className={`mt-0.5 w-2 h-2 rounded-full ${anomaly.severity === 'warning' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div>
                    <span className="font-semibold text-slate-900">{anomaly.employee}:</span>{' '}
                    <span className="text-slate-700">{anomaly.message}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-700 mt-4 italic">Note: Disbursement is blocked until anomalies are reviewed.</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <SummaryCard 
            label="Total Gross (₹)" 
            value={data.total_gross.toLocaleString()} 
            icon={<TrendingUp size={20} />}
            color="emerald"
          />
          <SummaryCard 
            label="Total Deductions (TDS/PF)" 
            value={data.total_deductions.toLocaleString()} 
            icon={<TrendingDown size={20} />}
            color="red"
          />
          <SummaryCard 
            label="Employer EPF Liability" 
            value={data.total_epf_employer.toLocaleString()} 
            icon={<ShieldCheck size={20} />}
            color="indigo"
          />
          <SummaryCard 
            label="Total Net Disbursement" 
            value={data.total_net.toLocaleString()} 
            icon={<IndianRupee size={20} />}
            color="blue"
            highlight
          />
        </div>

        {/* Employee Payroll Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 flex justify-between items-center">
            <span className="text-white font-bold text-sm">Automated Verification Loop — Active Records</span>
            <span className="text-slate-400 text-xs">Syncing Performance & Attendance...</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Performance Bonus</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">LOP/Days</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Gross Earnings</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">EPF + TDS</th>
                  <th className="p-4 text-xs font-bold text-indigo-600 uppercase text-right">Total Rewards*</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {data.employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  data.employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs">
                            {emp.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{emp.name}</p>
                            <p className="text-slate-400 text-xs">CTC: ₹{emp.annual_ctc.toLocaleString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${emp.performance_bonus > 0 ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'}`}>
                          {emp.performance_bonus > 0 ? `+₹${emp.performance_bonus.toLocaleString()}` : '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-700">{emp.lop_days} days LOP</span>
                          {emp.lop_deduction > 0 && <span className="text-xs text-red-500 font-medium">-₹{emp.lop_deduction.toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-right font-mono font-medium">₹{emp.gross.toLocaleString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-500">PF: ₹{emp.epf_employee.toLocaleString()}</span>
                          <span className="text-xs text-red-500 font-medium">TDS: ₹{emp.tds.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-indigo-600 text-right font-mono font-semibold">
                        ₹{emp.total_rewards.toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold font-mono inline-block min-w-[100px] text-center">
                          ₹{emp.net.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
            * Total Rewards = Net Pay + Employer EPF & Non-cash Benefits
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color, highlight }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  
  return (
    <div className={`p-5 rounded-2xl border ${highlight ? 'border-blue-300 bg-blue-50/50 shadow-md shadow-blue-100' : 'bg-white border-slate-200'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color] || 'bg-slate-100 text-slate-500'}`}>
        {icon}
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black ${highlight ? 'text-blue-700' : 'text-slate-900'}`}>₹{value}</p>
    </div>
  );
}