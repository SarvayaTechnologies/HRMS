import React from 'react';
import { BookOpen, Sparkles, Inbox } from 'lucide-react';

export default function LearningPath() {
  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <Sparkles size={18} />
              <span className="text-xs uppercase tracking-widest">AI-Generated Roadmap</span>
            </div>
            <h1 className="text-4xl font-black">Learning Path</h1>
          </div>
        </div>

        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center">
          <Inbox className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="font-bold text-white text-xl mb-2">No Learning Path Generated</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            AI-generated learning roadmaps will appear here once skill gap assessments are completed. Each path is personalized based on your role and target skills.
          </p>
        </div>
      </div>
    </div>
  );
}