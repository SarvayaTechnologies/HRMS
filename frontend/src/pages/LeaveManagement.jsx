import React, { useState } from 'react';
import { Calendar, CheckCircle, XCircle, Inbox } from 'lucide-react';

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
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <Inbox className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="font-bold text-slate-800 text-xl mb-2">No Pending Leave Requests</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              Leave requests submitted by employees will appear here for approval. No requests have been submitted yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}