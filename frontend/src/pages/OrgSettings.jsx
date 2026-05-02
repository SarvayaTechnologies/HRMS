import React, { useState } from 'react';
import { 
  Building2, ShieldAlert, Cpu, Link, Search, Activity, 
  Palette, Globe, Wallet, BrainCircuit, Network, Github
} from 'lucide-react';

export default function OrgSettings() {
  const [gdprEnabled, setGdprEnabled] = useState(true);
  const [itActEnabled, setItActEnabled] = useState(true);
  const [geminiSensitivity, setGeminiSensitivity] = useState(75);

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <Building2 className="text-indigo-600" /> Enterprise Governance
            </h1>
            <p className="text-slate-500 mt-2">Organization control tower, compliance rules, and AI configurations.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Org Profile & Branding */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Palette className="text-purple-500" /> Profile & Branding
            </h2>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-800 text-sm mb-2">White-Labeling</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">LOGO</div>
                <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">Upload New Logo</button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-800 text-sm mb-2">Department Architecture</p>
              <p className="text-xs text-slate-500 mb-3">Define hierarchy for Workforce Directory & Succession.</p>
              <button className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors">
                Edit Organizational Chart
              </button>
            </div>
          </div>

          {/* Compliance & Global Policies */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Globe className="text-emerald-500" /> Compliance Policies
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-sm">GDPR Protocols</p>
                <p className="text-xs text-slate-500 mt-1">Right to be forgotten workflows.</p>
              </div>
              <button 
                onClick={() => setGdprEnabled(!gdprEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${gdprEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${gdprEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-sm">IT Act India (2000)</p>
                <p className="text-xs text-slate-500 mt-1">CERT-In incident reporting SLA rules.</p>
              </div>
              <button 
                onClick={() => setItActEnabled(!itActEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${itActEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${itActEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Wallet size={16}/> Payroll Engine Config</p>
                <p className="text-xs text-slate-500 mt-1">Tax slabs & PF contributions.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                Configure
              </button>
            </div>
          </div>

          {/* AI & Intelligence Tuning */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Cpu className="text-blue-500" /> AI & Intelligence Tuning
            </h2>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between mb-2">
                <p className="font-bold text-slate-800 text-sm">Gemini Logic Sensitivity</p>
                <span className="text-xs font-bold text-blue-600">{geminiSensitivity}%</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Adjust strictness of AI Interview & Sentiment thresholds.</p>
              <input 
                type="range" 
                min="0" max="100" 
                value={geminiSensitivity} 
                onChange={(e) => setGeminiSensitivity(e.target.value)}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-800 text-sm mb-2">Automated Audit Rules</p>
              <p className="text-xs text-slate-500 mb-3">Set triggers for the Security Audit Trail.</p>
              <button className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors">
                Manage Triggers
              </button>
            </div>
          </div>

          {/* Integrations & API */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Link className="text-orange-500" /> Integrations & API
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Network size={16}/> External Webhooks</p>
                <p className="text-xs text-slate-500 mt-1">Cloudflare, Render, Banking APIs.</p>
              </div>
              <button className="px-4 py-2 bg-orange-50 text-orange-700 text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors">
                Manage
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Github size={16}/> GitHub Organization Link</p>
                <p className="text-xs text-slate-500 mt-1">Allow import for tech assessments.</p>
              </div>
              <button className="px-4 py-2 bg-[#24292e] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors">
                Connect
              </button>
            </div>
          </div>

          {/* The Transparency Vault */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 space-y-6 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="text-emerald-400" /> The Transparency Vault
                </h2>
                <p className="text-slate-400 text-sm mt-1">Live audit trail of Gemini 3 Flash AI processing employee data.</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                System Encrypted
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BrainCircuit size={16} className="text-blue-400" />
                    <span className="text-sm font-bold text-white">Gemini Sentiment Processing</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Culture Pulse</span>
                  </div>
                  <p className="text-xs text-slate-400">Determining department morale trajectory for Engineering.</p>
                  <p className="text-[10px] text-emerald-500 mt-2 font-mono">Data anonymized before transmission. Zero PII shared.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Just now</p>
                  <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">View Log</button>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Search size={16} className="text-indigo-400" />
                    <span className="text-sm font-bold text-white">Gemini Readiness Engine</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Succession Planning</span>
                  </div>
                  <p className="text-xs text-slate-400">Evaluating internal candidate fit for VP of Sales role.</p>
                  <p className="text-[10px] text-emerald-500 mt-2 font-mono">Encrypted payload: [244 bytes]. Model weights frozen.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">12 mins ago</p>
                  <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">View Log</button>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-xl border border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={16} className="text-rose-400" />
                    <span className="text-sm font-bold text-white">Gemini Burnout Radar</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Wellness</span>
                  </div>
                  <p className="text-xs text-slate-400">Analyzing overtime patterns vs PTO history.</p>
                  <p className="text-[10px] text-emerald-500 mt-2 font-mono">Data anonymized before transmission. Zero PII shared.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">1 hr ago</p>
                  <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">View Log</button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
