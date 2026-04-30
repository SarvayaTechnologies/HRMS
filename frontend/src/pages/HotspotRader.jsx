import React from 'react';
import { Flame, Inbox } from 'lucide-react';

export default function HotspotRadar() {
  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Flame className="text-orange-500" size={32} />
          <h1 className="text-3xl font-black">AI Attrition & Burnout Radar</h1>
        </div>

        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center">
          <Inbox className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="font-bold text-white text-xl mb-2">No Burnout Data Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Burnout and attrition risk scores will appear here once employee attendance, sentiment surveys, and workload data have been collected over time.
          </p>
        </div>
      </div>
    </div>
  );
}