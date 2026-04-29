import React from 'react';
import { DollarSign, PieChart, TrendingDown, Target } from 'lucide-react';

export default function TotalRewards() {
  const ctcData = {
    base: 80000,
    bonus: 12000,
    stocks: 25000,
    total: 117000
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8">Total Rewards & Equity</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         
          <div className="lg:col-span-2 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
            <h3 className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-6">Annual Compensation Breakdown</h3>
            <div className="space-y-6">
              {[
                { label: "Base Salary", val: ctcData.base, color: "bg-indigo-500", pct: 68 },
                { label: "Annual Bonus", val: ctcData.bonus, color: "bg-emerald-500", pct: 10 },
                { label: "Equity (ESOPs)", val: ctcData.stocks, color: "bg-amber-500", pct: 22 }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-black">${item.val.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full">
                    <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-6 border-t flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-sm">Total CTC</p>
                <p className="text-4xl font-black text-slate-900">${ctcData.total.toLocaleString()}</p>
              </div>
              <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2">
                <Target size={18} /> View Benchmarks
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -bottom-10 -right-10 opacity-20"><PieChart size={200} /></div>
             <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingDown size={20}/> Pay Equity Alert</h3>
             <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                Our AI has detected a <span className="font-bold text-white">12% wage gap</span> for your profile compared to similar roles in the Engineering department.
             </p>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <p className="text-xs uppercase font-bold text-indigo-200 mb-1">Recommended Adjustment</p>
                <p className="text-2xl font-black">+$850 / mo</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}