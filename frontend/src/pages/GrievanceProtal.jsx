import React, { useState } from 'react';
import { ShieldAlert, Lock, Search, AlertTriangle } from 'lucide-react';

export default function GrievancePortal() {
  const [submitted, setSubmitted] = useState(false);
  const [caseNo, setCaseNo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
   
    setCaseNo("CASE-88219");
    setSubmitted(true);
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-8 text-white flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-2xl">
              <ShieldAlert className="text-red-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Anonymous Reporting</h2>
              <p className="text-slate-400 text-sm">Encrypted. Secure. Anonymous.</p>
            </div>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800 text-sm">
                <AlertTriangle size={20} className="shrink-0" />
                <p>Your identity is hidden. This report goes directly to the Ethics Committee for investigation.</p>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Issue Category</label>
                <select className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-slate-900 transition">
                  <option>Workplace Safety</option>
                  <option>Harassment or Discrimination</option>
                  <option>Financial Impropriety</option>
                  <option>General Ethics Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-400 mb-2">Detailed Description</label>
                <textarea 
                  className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-slate-900 transition" 
                  rows="6" 
                  placeholder="Provide as much detail as possible. Date, time, location, and nature of the issue..."
                  required
                />
              </div>

              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
                <Lock size={18} /> Submit Anonymous Report
              </button>
            </form>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Report Successfully Filed</h3>
              <p className="text-slate-500 mb-8">Save your case number to check for updates anonymously.</p>
              <div className="bg-slate-100 p-6 rounded-2xl inline-block border-2 border-dashed border-slate-300">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Your Case Number</p>
                <p className="text-3xl font-black text-slate-900 tracking-widest">{caseNo}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}