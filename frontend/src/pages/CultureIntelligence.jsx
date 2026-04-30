import React from 'react';
import { Heart, MessageSquare, Activity, Inbox } from 'lucide-react';

export default function CultureIntelligence() {
  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Activity className="text-rose-500" /> Culture Pulse
        </h1>

        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center mb-8">
          <Inbox className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="font-bold text-slate-800 text-xl mb-2">No Culture Data Collected Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Culture scores and AI insights will appear here once employees start submitting pulse surveys. Mood, sentiment, and friction points will be analyzed automatically.
          </p>
        </div>

        {/* Anonymous Weekly Pulse — this is a form, not data, so it stays */}
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
          <MessageSquare className="mx-auto text-slate-300 mb-4" size={40} />
          <h3 className="font-bold text-slate-800 mb-2">Anonymous Weekly Pulse</h3>
          <p className="text-slate-500 text-sm mb-6">"How would you rate the clarity of your goals this week?"</p>
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className="w-12 h-12 rounded-full border border-slate-200 hover:bg-indigo-600 hover:text-white transition-all font-bold text-slate-400">
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}