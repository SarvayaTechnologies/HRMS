import React, { useState } from 'react';
import { Briefcase, Zap, ArrowUpRight, Target } from 'lucide-react';

export default function InternalMobility() {
  const [jobs] = useState([
    { title: "Senior AI Architect", dept: "R&D", match: 92, salary: "$140k - $180k", tags: ["Generative AI", "Leadership"] },
    { title: "Lead Backend Developer", dept: "Product", match: 84, salary: "$120k - $150k", tags: ["FastAPI", "PostgreSQL"] },
    { title: "Engineering Manager", dept: "Operations", match: 65, salary: "$160k+", tags: ["Strategy", "Management"] }
  ]);

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">Internal Career Marketplace</h1>
          <p className="text-slate-500">Your next move is closer than you think.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.title} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col hover:border-indigo-500 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Briefcase size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black uppercase text-slate-400">Match Score</span>
                  <span className={`text-xl font-black ${job.match > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {job.match}%
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{job.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{job.dept} · {job.salary}</p>

              <div className="flex flex-wrap gap-2 mb-8">
                {job.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                    {tag}
                  </span>
                ))}
              </div>

              <button className="mt-auto w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                View Role Details <ArrowUpRight size={18} />
              </button>
            </div>
          ))}
        </div>

       
        <div className="mt-12 bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10"><Target size={120} /></div>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-amber-400 fill-amber-400" size={20} />
            <h4 className="font-bold uppercase text-xs tracking-widest">AI Mobility Insight</h4>
          </div>
          <p className="text-indigo-100 leading-relaxed max-w-2xl">
            Based on your recent <span className="text-white font-bold italic">FastAPI Mastery</span> learning progress, your match score for the 
            <span className="text-white font-bold uppercase mx-1">Lead Backend</span> role has increased by <span className="text-emerald-400 font-bold">14%</span> this week.
          </p>
        </div>
      </div>
    </div>
  );
}