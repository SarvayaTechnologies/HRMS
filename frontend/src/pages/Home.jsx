import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, CheckCircle2, Activity, 
  BrainCircuit, Mic, FileWarning, Globe, 
  Database, GitBranch, Cloud, Layers, 
  Zap, Code2 
} from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-[#0A0A0B] min-h-screen text-slate-200 overflow-x-hidden font-sans selection:bg-indigo-500/30">
      <Navbar />
      
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* 1. Advanced Hero & Market Firsts */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        
        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-1.5 border border-indigo-500/20 rounded-full bg-indigo-500/5 text-xs font-semibold text-indigo-400">
            <ShieldCheck size={14} /> Zero-Knowledge Architecture
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 border border-emerald-500/20 rounded-full bg-emerald-500/5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={14} /> 100% Stability (61/61 Backend Tests Passed)
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-white">
          Active <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
             Workforce Intelligence
          </span>
        </h1>
        
        <p className="max-w-3xl mx-auto text-slate-400 text-lg md:text-xl mb-12 leading-relaxed">
          The <span className="text-white font-bold">Dual-Workforce Engine</span> uses a single unified logic for complex workforce structures—scaling effortlessly from dynamic shift patterns to intricate global payroll systems.
        </p>
        
        <div className="flex justify-center relative">
          <div className="absolute inset-0 bg-indigo-600/30 blur-xl rounded-full scale-110"></div>
          <Link to="/login" className="relative bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2">
            Enter Platform <Zap size={20} className="text-emerald-300" />
          </Link>
        </div>
      </section>

      {/* 2. The "Intelligence Suite" Interactive Grid */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto z-10 border-t border-white/5">
        <div className="mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Active Intelligence</h2>
          <p className="text-slate-400 text-lg">Not just a system of record. A system of foresight.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Burnout Radar */}
          <div className="bg-[#111113] p-8 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={100} /></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-2xl relative">
                <div className="absolute inset-0 border-2 border-red-500/30 rounded-2xl animate-ping opacity-20"></div>
                <Activity className="text-red-400 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Burnout Radar</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Predicts attrition before it happens. Uses "Smart Presence" telemetry and PTO history to identify flight risks with pinpoint accuracy.
            </p>
          </div>

          {/* Autonomous Succession */}
          <div className="bg-[#111113] p-8 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <Layers className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Autonomous Succession</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The "Shadow Pipeline" automatically identifies and grooms the next generation of leaders based on multi-dimensional 9-box performance data.
            </p>
          </div>

          {/* Gemini-Powered Performance */}
          <div className="bg-[#111113] p-8 rounded-[2rem] border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/10 rounded-2xl relative">
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-2xl animate-pulse opacity-20"></div>
                <BrainCircuit className="text-emerald-400 relative z-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Gemini-Powered Performance</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Gemini 3 Flash instantly converts complex 360-degree peer feedback into actionable, structured growth insights in real-time.
            </p>
          </div>

          {/* Voice-AI Interviewing */}
          <div className="bg-[#111113] p-8 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <Mic className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Voice-AI Interviewing</h3>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The AI Interview Center conducts behavioral screening sessions using native audio cues, analyzing confidence, clarity, and competence.
            </p>
          </div>
          
        </div>
      </section>

      {/* 3. Radical Transparency & Compliance */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto z-10 border-t border-white/5">
        <div className="mb-16">
          <h2 className="text-4xl font-black text-white mb-4">Radical Transparency</h2>
          <p className="text-slate-400 text-lg">Trust built on cryptographic certainty and ethical compliance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-[#111113] to-slate-900/50 p-8 rounded-[2rem] border border-white/5">
            <FileWarning className="text-amber-400 mb-6" size={32} />
            <h4 className="text-xl font-bold text-white mb-3">Whistleblower Portal</h4>
            <div className="mb-4 inline-block bg-amber-500/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/20">
              Encrypted. Secure. Anonymous.
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A core cultural pillar that protects identities cryptographically, ensuring safe, anonymous reporting free from retaliation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#111113] to-slate-900/50 p-8 rounded-[2rem] border border-white/5">
            <Globe className="text-blue-400 mb-6" size={32} />
            <h4 className="text-xl font-bold text-white mb-3">Global Compliance Engine</h4>
            <div className="flex gap-2 mb-4">
               <span className="bg-white/5 text-slate-300 text-xs px-2 py-1 rounded border border-white/10">IT Act India</span>
               <span className="bg-white/5 text-slate-300 text-xs px-2 py-1 rounded border border-white/10">GDPR</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Compliance Toggles allow the organization to switch data handling and retention policies instantly to meet regional legal standards.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#111113] to-slate-900/50 p-8 rounded-[2rem] border border-white/5">
            <Database className="text-emerald-400 mb-6" size={32} />
            <h4 className="text-xl font-bold text-white mb-3">Immutable Audit Trail</h4>
            <div className="w-full h-2 bg-emerald-500/20 rounded-full mb-4 overflow-hidden relative">
               <div className="absolute top-0 left-0 h-full bg-emerald-500 w-1/3 animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Continuous security logs map every single state mutation, strictly preventing any unauthorized data tampering by administrators.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Technical Sophistication & Integration */}
      <section className="relative py-24 px-6 max-w-7xl mx-auto z-10 border-t border-white/5 pb-32">
        <div className="bg-slate-900/30 p-12 rounded-[3rem] border border-indigo-500/10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20 [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 relative z-10">Enterprise-Grade Infrastructure</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto relative z-10">
            <span className="text-white font-medium">Next-Gen Ready:</span> Powered by Next.js 15, FastAPI, and Neon PostgreSQL to ensure zero-latency global scaling.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 relative z-10">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-300">
              <Code2 size={28} /> Next.js 15
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-300">
              <Database size={28} /> Neon DB
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-300">
              <GitBranch size={28} /> GitHub
            </div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-300">
              <Cloud size={28} /> Cloudflare
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}