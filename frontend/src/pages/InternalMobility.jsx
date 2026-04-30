import React from 'react';
import { Briefcase, Inbox, Target } from 'lucide-react';

export default function InternalMobility() {
  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">Internal Career Marketplace</h1>
          <p className="text-slate-500">Your next move is closer than you think.</p>
        </div>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <Inbox className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-800 text-xl mb-2">No Open Positions</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Internal job openings will appear here once your organization posts roles for internal mobility. AI match scores will be calculated based on employee skill profiles.
          </p>
        </div>
      </div>
    </div>
  );
}