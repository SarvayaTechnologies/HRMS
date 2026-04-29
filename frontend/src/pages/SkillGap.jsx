import React, { useState, useEffect } from 'react';
import { Target, BookOpen, ChevronRight } from 'lucide-react';

export default function SkillGap() {
  const [gaps, setGaps] = useState([
    { skill: "System Design", current: 4, target: 8, importance: "Critical" },
    { skill: "FastAPI", current: 6, target: 9, importance: "High" },
    { skill: "Docker", current: 2, target: 7, importance: "Medium" }
  ]);

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Skill Gap Analysis</h1>
        <p className="text-slate-500 mb-10 font-medium">Path to Promotion: <span className="text-indigo-600">Senior AI Engineer</span></p>

        <div className="space-y-8">
          {gaps.map((gap) => (
            <div key={gap.skill} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 text-lg">{gap.skill}</h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    gap.importance === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {gap.importance} Priority
                </span>
              </div>

              <div className="relative pt-2">
                
                <div className="absolute top-[-10px] text-[10px] font-bold text-indigo-500" style={{ left: `${gap.target * 10}%` }}>
                    TARGET (Level {gap.target})
                </div>
                
                
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden relative">
                 
                  <div className="bg-indigo-600 h-4 rounded-full transition-all duration-1000" style={{ width: `${gap.current * 10}%` }}></div>
                 
                  <div className="absolute top-0 h-4 border-r-2 border-indigo-400 border-dashed" style={{ left: `${gap.target * 10}%` }}></div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-sm">
                <p className="text-slate-500">Gap: <span className="font-bold text-slate-800">-{gap.target - gap.current} points</span></p>
                <button className="text-indigo-600 font-bold flex items-center gap-1 hover:underline">
                    View Learning Path <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}