import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, User, Star, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function InterviewResults() {
  const { token } = useAuth();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);

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
        // Try to get job title from first result or fetch separately
        if (data.length > 0) {
          setJobTitle(data[0].job_title || "");
        }
      }
    } catch (e) {
      console.error("Failed to fetch interview results", e);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (result) => {
    if (!result) return { bg: "bg-slate-100", text: "text-slate-600", label: "Pending" };
    if (result === "Recommended") return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Recommended" };
    return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Not Recommended" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard/mobility')}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Internal Jobs
          </button>
          <h1 className="text-3xl font-black text-slate-900">AI Interview Results</h1>
          <p className="text-slate-500 mt-1">Candidates who completed AI interviews for this position</p>
        </div>

        {results.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-16 text-center">
            <Clock className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-slate-700 font-bold text-xl mb-2">No Interview Results Yet</h3>
            <p className="text-slate-400 text-sm">Candidates who complete their AI interviews will appear here with detailed evaluations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => {
              const badge = getResultBadge(r.interview_result);
              const isExpanded = expandedCard === r.id;
              const eval_ = r.evaluation;
              
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div 
                    className="p-6 flex items-center cursor-pointer"
                    onClick={() => setExpandedCard(isExpanded ? null : r.id)}
                  >
                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl mr-5">
                      <User size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg">{r.employee_name}</h3>
                      <p className="text-slate-500 text-sm">{r.employee_email}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Match Score */}
                      {r.match_score !== null && (
                        <div className="text-center mr-4 hidden md:block">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Resume Match</p>
                          <p className={`text-lg font-black ${r.match_score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {r.match_score}%
                          </p>
                        </div>
                      )}

                      {/* AI Score */}
                      {eval_?.overall_score !== undefined && (
                        <div className="text-center mr-4 hidden md:block">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interview Score</p>
                          <p className={`text-lg font-black ${eval_.overall_score >= 70 ? 'text-emerald-600' : eval_.overall_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {eval_.overall_score}/100
                          </p>
                        </div>
                      )}

                      {/* Result Badge */}
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border ${badge.bg} ${badge.text} ${badge.border || ''}`}>
                        {r.interview_result === "Recommended" && <CheckCircle2 size={14} className="inline mr-1 -mt-0.5" />}
                        {r.interview_result === "Not Recommended" && <XCircle size={14} className="inline mr-1 -mt-0.5" />}
                        {badge.label}
                      </span>

                      <button className="text-slate-400 ml-2">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && eval_ && (
                    <div className="border-t border-slate-100 p-6 bg-slate-50/50">
                      {/* Summary */}
                      <div className="mb-6">
                        <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-2">AI Assessment</h4>
                        <p className="text-slate-600 leading-relaxed">{eval_.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Strengths */}
                        <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                          <h4 className="font-bold text-emerald-700 text-sm flex items-center gap-2 mb-3">
                            <TrendingUp size={16} /> Key Strengths
                          </h4>
                          <ul className="space-y-2">
                            {(eval_.strengths || []).map((s, i) => (
                              <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100">
                          <h4 className="font-bold text-amber-700 text-sm flex items-center gap-2 mb-3">
                            <TrendingDown size={16} /> Areas for Improvement
                          </h4>
                          <ul className="space-y-2">
                            {(eval_.weaknesses || []).map((w, i) => (
                              <li key={i} className="text-slate-700 text-sm flex items-start gap-2">
                                <XCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Per-question Scores */}
                      {eval_.question_scores && eval_.question_scores.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Question-by-Question Breakdown</h4>
                          <div className="space-y-2">
                            {eval_.question_scores.map((qs, i) => (
                              <div key={i} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-100">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                  <span className="text-indigo-600 font-black text-sm">Q{qs.question_number || i + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-slate-600 text-sm truncate">{qs.feedback}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star size={14} className={qs.score >= 7 ? "text-emerald-500" : qs.score >= 5 ? "text-amber-500" : "text-red-400"} />
                                  <span className={`font-bold text-sm ${qs.score >= 7 ? "text-emerald-600" : qs.score >= 5 ? "text-amber-600" : "text-red-600"}`}>
                                    {qs.score}/10
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* If no evaluation yet */}
                  {isExpanded && !eval_ && (
                    <div className="border-t border-slate-100 p-6 bg-slate-50/50 text-center">
                      <Clock className="mx-auto text-slate-300 mb-2" size={32} />
                      <p className="text-slate-500 text-sm">AI evaluation is still processing. Check back shortly.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
