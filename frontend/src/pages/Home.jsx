import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <div className="bg-[#050505] min-h-screen text-white overflow-hidden">
      <Navbar />
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>

      <section className="relative pt-40 pb-20 px-6 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 border border-slate-800 rounded-full bg-slate-900/50 text-xs font-semibold text-indigo-400">
           ✦ One platform · Every workforce type
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8">
          AI-Driven <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-emerald-400 to-indigo-400">
            Workforce Intelligence
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-lg mb-10 leading-relaxed">
          HRVALY handles <span className="text-white font-medium">white-collar</span> and 
          <span className="text-white font-medium"> blue-collar</span> workforces in one unified platform. 
          Smart payroll, shift scheduling, and AI-driven hiring.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all">
            Get Started Free →
          </Link>
          <button className="bg-slate-900/50 border border-slate-800 hover:bg-slate-800 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all">
            Watch 3-min Demo
          </button>
        </div>
      </section>
    </div>
  );
}