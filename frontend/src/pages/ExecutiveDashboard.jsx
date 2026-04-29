import React from 'react';
import { Users, Zap, TrendingUp, ShieldAlert, BrainCircuit, Wallet } from 'lucide-react';

export default function ExecutiveDashboard() {
  const stats = [
    { label: "Total Workforce", value: "1,248", change: "+12%", icon: <Users className="text-blue-500" /> },
    { label: "AI Match Rate", value: "94%", change: "+5%", icon: <BrainCircuit className="text-indigo-500" /> },
    { label: "Monthly Payroll", value: "$4.2M", change: "Stable", icon: <Wallet className="text-emerald-500" /> },
    { label: "Flight Risk", value: "2 Critical", change: "Alert", icon: <ShieldAlert className="text-rose-500" /> }
  ];

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Intelligence</h1>
          <p className="text-slate-500 font-medium">Real-time pulse of your global workforce</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
                <span className={`text-xs font-bold ${s.change.includes('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {s.change}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
              <p className="text-3xl font-black text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area (Pillar 3 & 5) */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Growth & Sentiment Trend</h3>
                <p className="text-slate-400 text-sm mb-10">Aggregated data across all departments</p>
                
                {/* Mock Chart Visualization */}
                <div className="flex items-end gap-2 h-48">
                  {[40, 70, 45, 90, 65, 80, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-indigo-500/20 rounded-t-lg group relative hover:bg-indigo-500 transition-all" style={{ height: `${h}%` }}>
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}%
                       </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-500 uppercase">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                </div>
             </div>
          </div>

          {/* Quick AI Actions */}
          <div className="space-y-6">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl">
              <Zap className="mb-4 text-amber-300" fill="currentColor" />
              <h4 className="font-bold text-lg mb-2">AI Recommendation</h4>
              <p className="text-indigo-100 text-sm leading-relaxed">
                3 internal candidates are now 90%+ matches for the "Product Lead" role.
              </p>
              <button className="mt-6 w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm">Review Matches</button>
            </div>
            
            <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldAlert className="text-rose-500" size={18} /> Critical Alerts
              </h4>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5" />
                  <p className="text-xs text-slate-600">Pending Pay Equity adjustment for 4 employees in Engineering.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}