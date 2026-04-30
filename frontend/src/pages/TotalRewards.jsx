import React from 'react';
import { DollarSign, Target, Inbox } from 'lucide-react';

export default function TotalRewards() {
  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8">Total Rewards & Equity</h1>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <Inbox className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-800 text-xl mb-2">No Compensation Data Available</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Salary structures, equity allocations, and benefits data will appear here once payroll configurations are set up for your organization.
          </p>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto">
            <Target size={18} /> Configure Payroll First
          </button>
        </div>
      </div>
    </div>
  );
}