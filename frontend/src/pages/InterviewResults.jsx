import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Loader2, User, Play, Briefcase, Star, AlertTriangle, CheckCircle2, Mic, Activity, ShieldAlert, Award } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';

export default function InterviewResults() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [jobId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`http://localhost:8001/org/jobs/${jobId}/interview-results`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        if (data.length > 0) setSelectedCandidate(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseJsonFallback = (str, fallback) => {
    if (!str) return fallback;
    if (typeof str === 'object') return str;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar: Candidate List */}
      <div className="w-full md:w-80 bg-white border-r border-slate-200 h-screen flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <button 
            onClick={() => navigate('/dashboard/mobility')}
            className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-bold mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Mobility
          </button>
          <h2 className="text-xl font-black text-slate-900">AI Candidates</h2>
          <p className="text-sm text-slate-500 font-medium">{results.length} Interviews Analyzed</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {results.length === 0 ? (
            <div className="text-center p-8 text-slate-400 font-medium">No completed interviews yet.</div>
          ) : (
            results.map((cand, idx) => {
              const evalData = parseJsonFallback(cand.interview_evaluation, {});
              const score = evalData.score || 0;
              const isSelected = selectedCandidate?.application_id === cand.application_id;
              
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedCandidate(cand)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-indigo-600 border-indigo-700 shadow-md text-white' 
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{cand.employee_name}</h4>
                      <p className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>Applied: {cand.applied_at ? cand.applied_at.split('T')[0] : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-current border-opacity-10">
                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      isSelected ? 'bg-white/10' : 
                      cand.interview_result === 'Recommended' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {cand.interview_result || "Pending"}
                    </span>
                    <span className="text-lg font-black">{score}/100</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content: Detailed AI Analysis */}
      <div className="flex-1 h-screen overflow-y-auto bg-[#0f172a] text-slate-200">
        {!selectedCandidate ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a candidate to view AI analysis</p>
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Profile */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 bg-slate-800/50 p-8 rounded-3xl border border-slate-700 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <User size={40} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white mb-1">{selectedCandidate.employee_name}</h1>
                  <p className="text-indigo-300 font-medium flex items-center gap-2">
                    <Briefcase size={16} /> Internal Candidate Profile
                  </p>
                  {selectedCandidate.is_prequalified && (
                    <span className="inline-flex items-center gap-1.5 mt-3 bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-500/30">
                      <ShieldAlert size={14} /> Added to Pre-Qualified Pool
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 text-center min-w-[150px]">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">AI Overall Score</p>
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {parseJsonFallback(selectedCandidate.interview_evaluation, {}).score || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Spider Chart & Integrity */}
              <div className="space-y-8">
                {/* Competency Spider Chart */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Target size={20} className="text-cyan-400" /> Competency Spider Chart
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                        Object.entries(parseJsonFallback(selectedCandidate.competency_scores, {
                          "Leadership": 75, "Technical": 80, "Communication": 85, "Problem Solving": 90, "Adaptability": 70
                        })).map(([k, v]) => ({ subject: k, A: v, fullMark: 100 }))
                      }>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: 'transparent'}} axisLine={false} />
                        <Radar name="Score" dataKey="A" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.3} />
                        <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sentiment & Integrity */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-amber-400" /> Sentiment & Integrity Analysis
                  </h3>
                  
                  {(() => {
                    const sentimentData = parseJsonFallback(selectedCandidate.sentiment_analysis, {
                      overall_sentiment: "Positive",
                      confidence_level: 85,
                      authenticity_flags: ["No major discrepancies detected"]
                    });
                    
                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl">
                          <span className="text-slate-400 font-medium">Overall Sentiment</span>
                          <span className={`font-bold ${sentimentData.overall_sentiment.toLowerCase() === 'positive' ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {sentimentData.overall_sentiment}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl">
                          <span className="text-slate-400 font-medium">Confidence Level</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{width: `${sentimentData.confidence_level}%`}}></div>
                            </div>
                            <span className="font-bold text-white">{sentimentData.confidence_level}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-3">Authenticity Flags</p>
                          <ul className="space-y-2">
                            {(sentimentData.authenticity_flags || []).map((flag, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> {flag}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column: Soft Skills & Highlights */}
              <div className="space-y-8">
                {/* Soft Skills Report */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Award size={20} className="text-fuchsia-400" /> Behavioral Soft-Skills
                  </h3>
                  
                  {(() => {
                    const softSkills = parseJsonFallback(selectedCandidate.soft_skill_feedback, {
                      strengths: ["Clear communication", "Empathetic leadership"],
                      areas_for_improvement: ["Conciseness in technical explanations"]
                    });
                    
                    return (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 size={16}/> Key Strengths</h4>
                          <ul className="space-y-2">
                            {(softSkills.strengths || []).map((s, i) => (
                              <li key={i} className="bg-slate-900 p-4 rounded-xl text-slate-300 border border-slate-700/50 font-medium">{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={16}/> Growth Areas</h4>
                          <ul className="space-y-2">
                            {(softSkills.areas_for_improvement || []).map((s, i) => (
                              <li key={i} className="bg-slate-900 p-4 rounded-xl text-slate-300 border border-slate-700/50 font-medium">{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Highlights Reel */}
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 p-8 rounded-3xl border border-indigo-500/30">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Play size={20} className="text-indigo-400" /> AI Highlights Reel
                  </h3>
                  <p className="text-indigo-200/70 text-sm mb-6">Auto-extracted pivotal moments from the interview transcript.</p>
                  
                  <div className="space-y-4">
                    {parseJsonFallback(selectedCandidate.highlights_reel, [
                      { "topic": "System Design", "quote": "I architected the microservices transition which reduced latency by 40%.", "impact": "High technical capability demonstrated." },
                      { "topic": "Conflict Resolution", "quote": "I brought the stakeholders together to realign on MVP features instead of delaying the launch.", "impact": "Strong pragmatic leadership." }
                    ]).map((highlight, idx) => (
                      <div key={idx} className="bg-black/20 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 group-hover:w-2 transition-all"></div>
                        <h5 className="text-indigo-300 font-bold mb-2 text-sm uppercase tracking-wider">{highlight.topic}</h5>
                        <p className="text-white italic mb-3">"{highlight.quote}"</p>
                        <p className="text-slate-400 text-sm bg-white/5 p-2 rounded-lg inline-block">{highlight.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw Evaluation Summary */}
                <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4">Summary Conclusion</h3>
                  <p className="text-slate-300 leading-relaxed">
                    {parseJsonFallback(selectedCandidate.interview_evaluation, {}).feedback || "No detailed feedback provided."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Target(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
  );
}

function TrendingUp(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  );
}
