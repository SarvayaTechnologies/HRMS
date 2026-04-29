import React, { useState } from 'react';
import { BookOpen, CheckCircle2, PlayCircle, Code2, Sparkles } from 'lucide-react';

export default function LearningPath() {
  const [roadmap, setRoadmap] = useState([
    { week: 1, topic: "Asynchronous Patterns & Concurrency", project: "Build a non-blocking scrapers", resource: "FastAPI 'await' documentation" },
    { week: 2, topic: "Custom Middleware & Security", project: "Implement OAuth2 Scopes", resource: "Python-Jose deep dive" },
    { week: 3, topic: "Database Optimization", project: "Async SQLAlchemy relationships", resource: "Neon DB connection pooling" },
    { week: 4, topic: "Deployment & Containerization", project: "Multi-stage Docker builds", resource: "Docker Best Practices Guide" }
  ]);

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <Sparkles size={18} />
              <span className="text-xs uppercase tracking-widest">AI-Generated Roadmap</span>
            </div>
            <h1 className="text-4xl font-black">FastAPI Mastery Path</h1>
          </div>
          <div className="text-right">
            <p className="text-slate-500 text-sm">Target Level</p>
            <p className="text-2xl font-bold text-emerald-400">Senior (9/10)</p>
          </div>
        </div>

        <div className="space-y-6 relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-800"></div>

          {roadmap.map((item, index) => (
            <div key={item.week} className="relative pl-20 group">
              {/* Timeline Dot */}
              <div className="absolute left-[26px] top-2 w-3 h-3 rounded-full bg-indigo-600 border-4 border-[#050505] z-10 group-hover:scale-125 transition-transform"></div>
              
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md transition-all hover:border-indigo-500/50 hover:bg-white/[0.07]">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-indigo-400 font-black text-sm uppercase">Week 0{item.week}</span>
                  <CheckCircle2 className="text-slate-700 hover:text-emerald-500 cursor-pointer transition-colors" />
                </div>
                
                <h3 className="text-xl font-bold mb-4">{item.topic}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Code2 className="text-indigo-400 mt-1" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Hands-on Project</p>
                      <p className="text-sm text-slate-200">{item.project}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <PlayCircle className="text-emerald-400 mt-1" size={18} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Primary Resource</p>
                      <p className="text-sm text-slate-200">{item.resource}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}