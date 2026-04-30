import React from 'react';
import { Target, Inbox, ChevronRight } from 'lucide-react';

export default function SkillGap() {
  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Skill Gap Analysis</h1>
        <p className="text-slate-500 mb-10 font-medium">Identify and close skill gaps across your organization</p>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <Inbox className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-800 text-xl mb-2">No Skills Assessment Data</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Skill gaps will be analyzed once employees complete their skill assessments and target roles are configured for your organization.
          </p>
        </div>
      </div>
    </div>
  );
}