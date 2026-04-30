import React, { useState, useEffect } from 'react';
import { Users, BrainCircuit, Wallet, ShieldAlert, Zap, Loader2 } from 'lucide-react';

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:8001/org/employees", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const employees = await res.json();
          const active = employees.filter(e => e.has_password).length;
          const pending = employees.filter(e => !e.has_password).length;
          setStats({ total: employees.length, active, pending });
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
      setLoading(false);
    };
    fetchStats();
  }, [token]);

  const statCards = [
    { label: "Total Employees", value: stats?.total || 0, sub: "In your organization", icon: <Users className="text-blue-500" /> },
    { label: "Active Accounts", value: stats?.active || 0, sub: "Logged in at least once", icon: <BrainCircuit className="text-emerald-500" /> },
    { label: "Pending Setup", value: stats?.pending || 0, sub: "Awaiting first login", icon: <Wallet className="text-amber-500" /> },
    { label: "Modules Active", value: "12", sub: "AI-powered", icon: <ShieldAlert className="text-indigo-500" /> }
  ];

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Intelligence</h1>
          <p className="text-slate-500 font-medium">Real-time pulse of your organization</p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {statCards.map((s) => (
                <div key={s.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">{s.icon}</div>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
                  <p className="text-3xl font-black text-slate-900">{s.value}</p>
                  <p className="text-slate-400 text-xs mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Organization Overview</h3>
                <p className="text-slate-400 text-sm mb-6">Live data from your workforce</p>

                {stats?.total === 0 ? (
                  <div className="text-center py-12">
                    <Users className="mx-auto text-slate-600 mb-4" size={40} />
                    <p className="text-slate-400">No employees added yet.</p>
                    <p className="text-slate-500 text-sm">Go to Employee Directory to add your team.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <p className="text-slate-500 text-xs font-bold uppercase mb-2">Active</p>
                      <p className="text-4xl font-black text-emerald-400">{stats.active}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <p className="text-slate-500 text-xs font-bold uppercase mb-2">Pending</p>
                      <p className="text-4xl font-black text-amber-400">{stats.pending}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl">
                  <Zap className="mb-4 text-amber-300" fill="currentColor" />
                  <h4 className="font-bold text-lg mb-2">Getting Started</h4>
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    Add employees via the Employee Directory. They'll receive access to their own Employee Portal.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}