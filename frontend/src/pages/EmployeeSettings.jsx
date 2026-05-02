import React, { useState } from 'react';
import { Settings2, ShieldCheck, Download, Fingerprint, Lock, Globe, Bell, HeartPulse, Palette, Key, Github, Eye } from 'lucide-react';

export default function EmployeeSettings() {
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [burnoutNudges, setBurnoutNudges] = useState(true);
  const [aiConsent, setAiConsent] = useState(true);
  const [theme, setTheme] = useState('dark');

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Settings2 className="text-emerald-500" /> Personal Command Center
            </h1>
            <p className="text-slate-400 mt-2">Manage your identity, privacy, and AI interactions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Account & Security */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-[#1a1a1a] p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <ShieldCheck className="text-indigo-400" /> Account & Security
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#222]">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Fingerprint size={16}/> Multi-Factor Authentication</p>
                <p className="text-xs text-slate-400 mt-1">Secure Payroll & Performance data.</p>
              </div>
              <button 
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${mfaEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${mfaEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#222]">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Lock size={16}/> Password Management</p>
                <p className="text-xs text-slate-400 mt-1">Last changed 45 days ago.</p>
              </div>
              <button className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors">
                Update
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#222]">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Github size={16}/> Connected Accounts</p>
                <p className="text-xs text-slate-400 mt-1">GitHub linked for AI code assessment.</p>
              </div>
              <button className="px-4 py-2 text-emerald-400 text-xs font-bold rounded-xl transition-colors">
                Manage
              </button>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-[#1a1a1a] p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Eye className="text-blue-400" /> Privacy & Data (GDPR)
            </h2>
            
            <div className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#222]">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Download size={16}/> Data Portability</p>
                <p className="text-xs text-slate-400 mt-1">Download your full platform profile.</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                Export Data
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#222]">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Settings2 size={16}/> AI Consent Manager</p>
                <p className="text-xs text-slate-400 mt-1">Allow Gemini to analyze sentiment.</p>
              </div>
              <button 
                onClick={() => setAiConsent(!aiConsent)}
                className={`w-12 h-6 rounded-full transition-colors relative ${aiConsent ? 'bg-blue-500' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${aiConsent ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#222]">
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Key size={16}/> Anonymous Portal Keys</p>
                <p className="text-xs text-slate-400 mt-1">Manage one-time encryption keys.</p>
              </div>
              <button className="px-4 py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors">
                View Keys
              </button>
            </div>
          </div>

          {/* Preferences & Wellness */}
          <div className="bg-[#0a0a0a] rounded-3xl border border-[#1a1a1a] p-8 space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <HeartPulse className="text-rose-400" /> Preferences & Wellness
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#111] rounded-2xl border border-[#222]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-2"><Bell size={16}/> Notification Matrix</p>
                </div>
                <p className="text-xs text-slate-400 mb-4">Granular controls for ping routing.</p>
                <button className="w-full py-2 bg-[#222] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition-colors">
                  Configure Routing
                </button>
              </div>

              <div className="p-4 bg-[#111] rounded-2xl border border-[#222]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-2"><HeartPulse size={16}/> Burnout Nudges</p>
                  <button 
                    onClick={() => setBurnoutNudges(!burnoutNudges)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${burnoutNudges ? 'bg-rose-500' : 'bg-slate-700'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${burnoutNudges ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
                <p className="text-xs text-slate-400">Allow calendar Recharge Block suggestions.</p>
              </div>

              <div className="p-4 bg-[#111] rounded-2xl border border-[#222]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-white flex items-center gap-2"><Globe size={16}/> Locale & Theme</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <select className="bg-[#222] border border-[#333] text-xs text-white rounded-lg px-2 py-1 w-full outline-none">
                    <option>English (US)</option>
                    <option>English (IN)</option>
                    <option>Hindi</option>
                  </select>
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-1.5 bg-[#222] rounded-lg text-slate-400 hover:text-white"
                  >
                    <Palette size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
