import React, { useState } from 'react';
import { Zap, Flame, AlertCircle, TrendingUp } from 'lucide-react';

export default function HotspotRadar() {
  const [hotspots] = useState([
    { dept: "Engineering", score: 88, trend: "up", reason: "High overtime + Low sentiment" },
    { dept: "Customer Success", score: 42, trend: "down", reason: "Stable metrics" },
    { dept: "Marketing", score: 65, trend: "stable", reason: "Moderate workload" }
  ]);

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Flame className="text-orange-500 animate-pulse" size={32} />
          <h1 className="text-3xl font-black">AI Attrition & Burnout Radar</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {hotspots.map((h) => (
            <div key={h.dept} className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
              
              <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[80px] rounded-full ${h.score > 80 ? 'bg-red-500/30' : 'bg-emerald-500/20'}`}></div>
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold">{h.dept}</h3>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${h.score > 80 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                   {h.score > 80 ? 'High Risk' : 'Healthy'}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Burnout Score</p>
                <div className="flex items-end gap-3">
                    <span className="text-5xl font-black tracking-tighter">{h.score}</span>
                    <TrendingUp className={h.trend === 'up' ? 'text-red-500 mb-2' : 'text-emerald-500 mb-2'} size={20} />
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4">
                <span className="text-white font-bold">Root Cause:</span> {h.reason}
              </p>
            </div>
          ))}
        </div>

        
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 p-8 rounded-3xl flex items-center gap-6">
            <div className="p-4 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/40">
                <Zap size={32} className="text-white" />
            </div>
            <div>
                <h4 className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-1">Critical Intervention Needed</h4>
                <p className="text-slate-200">
                    The <span className="text-white font-bold">Engineering</span> team has reached a burnout threshold. 
                    AI recommends a <span className="italic text-orange-200">mandatory no-meeting Friday</span> and immediate resource reallocation to prevent talent flight.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}