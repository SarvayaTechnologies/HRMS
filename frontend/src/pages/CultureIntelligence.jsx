import React, { useState } from 'react';
import { Heart, MessageSquare, ShieldCheck, Activity } from 'lucide-react';

export default function CultureIntelligence() {
  const [vibe] = useState({
    mood: "Focused",
    score: 78,
    concern: "Tooling & Documentation",
    action: "Schedule a tech-stack review with the Engineering Leads."
  });

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Activity className="text-rose-500" /> Culture Pulse
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
         
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center justify-center text-center">
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Overall Mood</p>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full rotate-[-90deg]">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * vibe.score) / 100} className="text-rose-500 transition-all duration-1000" />
              </svg>
              <span className="absolute text-2xl font-black text-slate-800">{vibe.score}%</span>
            </div>
            <p className="mt-4 text-xl font-bold text-slate-700">{vibe.mood}</p>
          </div>

         
          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Heart size={80} /></div>
             <h4 className="text-rose-400 font-bold uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
               <ShieldCheck size={14} /> AI Cultural Insight
             </h4>
             <p className="text-sm text-slate-400 mb-2">Primary Friction Point:</p>
             <p className="text-lg font-bold mb-6">{vibe.concern}</p>
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-[10px] text-rose-300 font-black uppercase mb-1">Recommended Action</p>
                <p className="text-sm italic text-slate-200">"{vibe.action}"</p>
             </div>
          </div>
        </div>

        
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
          <MessageSquare className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="font-bold text-slate-800 mb-2">Anonymous Weekly Pulse</h3>
          <p className="text-slate-500 text-sm mb-6">"How would you rate the clarity of your goals this week?"</p>
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className="w-12 h-12 rounded-full border border-slate-200 hover:bg-indigo-600 hover:text-white transition-all font-bold text-slate-400">
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}