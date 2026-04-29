import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, Users } from 'lucide-react';

export default function Succession() {
  const [employees] = useState([
    { name: "Jaswanth", perf: 3, pot: 3, risk: false }, // Star
    { name: "Sarah", perf: 2, pot: 3, risk: true },    // Future Star (Risk!)
    { name: "John", perf: 1, pot: 1, risk: false },    // Talent Risk
  ]);

  const GridBox = ({ title, perf, pot, color }) => {
    const empsInBox = employees.filter(e => e.perf === perf && e.pot === pot);
    return (
      <div className={`p-4 border border-slate-200 min-h-[120px] rounded-xl ${color} flex flex-col gap-2 shadow-inner`}>
        <span className="text-[10px] font-black uppercase text-slate-400">{title}</span>
        <div className="flex flex-wrap gap-2">
          {empsInBox.map(e => (
            <div key={e.name} className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 border border-slate-100">
              {e.name} {e.risk && <ShieldAlert size={12} className="text-red-500" />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Succession Planning</h1>
            <p className="text-slate-500">Mapping the future leadership pipeline</p>
          </div>
          <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-xl flex items-center gap-2 text-red-700 text-sm font-bold">
            <ShieldAlert size={18} /> 2 Critical Flight Risks Detected
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100">
          
          <GridBox title="High Pro" perf={1} pot={3} color="bg-indigo-50/30" />
          <GridBox title="Future Star" perf={2} pot={3} color="bg-indigo-50/50" />
          <GridBox title="The STAR" perf={3} pot={3} color="bg-indigo-100" />

          
          <GridBox title="Dilemma" perf={1} pot={2} color="bg-slate-50" />
          <GridBox title="Core Employee" perf={2} pot={2} color="bg-slate-50" />
          <GridBox title="High Performer" perf={3} pot={2} color="bg-indigo-50/30" />

        
          <GridBox title="Talent Risk" perf={1} pot={1} color="bg-red-50/20" />
          <GridBox title="Inconsistent" perf={2} pot={1} color="bg-slate-50" />
          <GridBox title="Work Horse" perf={3} pot={1} color="bg-slate-50" />
        </div>

        <div className="mt-8 flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span className="flex items-center gap-2">← Performance →</span>
            <span className="[writing-mode:vertical-lr] absolute -left-4 top-1/2 -translate-y-1/2">← Potential →</span>
        </div>
      </div>
    </div>
  );
}