import React, { useState } from 'react';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState('apply'); 
  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm w-fit">
          <button 
            onClick={() => setActiveTab('apply')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'apply' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            Apply for Leave
          </button>
          <button 
            onClick={() => setActiveTab('approve')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'approve' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
          >
            Approve Requests
          </button>
        </div>

        {activeTab === 'apply' ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold mb-6">New Leave Request</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <input type="date" className="bg-slate-50 border p-4 rounded-xl outline-none focus:border-indigo-500" />
              <input type="date" className="bg-slate-50 border p-4 rounded-xl outline-none focus:border-indigo-500" />
            </div>
            <select className="w-full bg-slate-50 border p-4 rounded-xl mb-6 outline-none">
              <option>Sick Leave</option>
              <option>Casual Leave</option>
              <option>Paid Leave</option>
            </select>
            <textarea className="w-full bg-slate-50 border p-4 rounded-xl mb-6" placeholder="Reason for leave..." rows="4" />
            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Submit Request</button>
          </div>
        ) : (
          <div className="space-y-4">
        
            <div className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center border border-slate-100">
              <div>
                <p className="font-bold text-slate-800">Sarah Smith</p>
                <p className="text-sm text-slate-500 italic">Sick Leave · 2 Days (April 25 - 26)</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><CheckCircle /></button>
                <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><XCircle /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}