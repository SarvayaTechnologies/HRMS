import React from 'react';
import { ShieldAlert, Inbox } from 'lucide-react';

export default function Succession() {

  const GridBox = ({ title, color }) => (
    <div className={`p-4 border border-slate-200 min-h-[120px] rounded-xl ${color} flex flex-col gap-2 shadow-inner`}>
      <span className="text-[10px] font-black uppercase text-slate-400">{title}</span>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-slate-400 italic">No employees mapped</p>
      </div>
    </div>
  );

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Succession Planning</h1>
            <p className="text-slate-500">Mapping the future leadership pipeline</p>
          </div>
        </div>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center mb-8">
          <Inbox className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="font-bold text-slate-800 mb-2">No Succession Data Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Performance and potential assessments will appear here once employee evaluations are configured. 
            Use the 9-box grid below to map your talent pipeline.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100">
          <GridBox title="High Pro" color="bg-indigo-50/30" />
          <GridBox title="Future Star" color="bg-indigo-50/50" />
          <GridBox title="The STAR" color="bg-indigo-100" />
          <GridBox title="Dilemma" color="bg-slate-50" />
          <GridBox title="Core Employee" color="bg-slate-50" />
          <GridBox title="High Performer" color="bg-indigo-50/30" />
          <GridBox title="Talent Risk" color="bg-red-50/20" />
          <GridBox title="Inconsistent" color="bg-slate-50" />
          <GridBox title="Work Horse" color="bg-slate-50" />
        </div>

        <div className="mt-8 flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
          <span>← Performance →</span>
        </div>
      </div>
    </div>
  );
}