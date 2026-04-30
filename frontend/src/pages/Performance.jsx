import React, { useState } from 'react';
import { TrendingUp, Award, AlertCircle, BrainCircuit } from 'lucide-react';

export default function Performance() {
  const [feedback, setFeedback] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAIAnalysis = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8001/performance/analyze", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ employee_id: 1, feedback: feedback }),
    });
    const result = await res.json();
    setAnalysis(result.analysis);
    setLoading(false);
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
        <Award className="text-indigo-600" /> Performance Intelligence
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">Submit Peer Feedback</h3>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 focus:border-indigo-500 outline-none transition"
            rows="6"
            placeholder="Describe the employee's performance this month..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button 
            onClick={runAIAnalysis}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <BrainCircuit size={20} />
            {loading ? "AI is analyzing tone..." : "Analyze with Gemini"}
          </button>
        </div>

      
        {analysis ? (
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit size={120} /></div>
             <h3 className="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-6">AI Performance Insight</h3>
             <div className="mb-8">
                <p className="text-slate-400 text-sm mb-1">Overall Sentiment</p>
                <div className="flex items-center gap-4">
                    <span className="text-4xl font-black">{(analysis.sentiment * 100).toFixed(0)}%</span>
                    <div className="flex-1 bg-white/10 h-2 rounded-full">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{width: `${analysis.sentiment * 100}%`}}></div>
                    </div>
                </div>
             </div>
             <div>
                <p className="text-slate-400 text-sm mb-4">Summary Analysis</p>
                <p className="text-slate-200 leading-relaxed italic">"{analysis.summary}"</p>
             </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-10">
            <TrendingUp size={48} className="mb-4 opacity-20" />
            <p>Enter feedback to generate AI insights</p>
          </div>
        )}
      </div>
    </div>
  );
}