import React, { useState, useEffect } from 'react';
import { Target, BrainCircuit, TrendingUp, Award, Zap, Smile, BookOpen, Compass, ChevronRight } from 'lucide-react';

export default function EmployeePerformance() {
  const [growth, setGrowth] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      const [gRes, sRes] = await Promise.all([
        fetch("http://localhost:8001/performance/employee-growth", { headers }),
        fetch("http://localhost:8001/performance/career-simulation", { headers })
      ]);

      setGrowth(await gRes.json());
      setSimulation(await sRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center text-slate-400">
          <BrainCircuit size={48} className="animate-pulse mb-4 text-indigo-500" />
          <p className="font-medium">Generating 360° Growth Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 min-h-screen text-slate-200">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Target className="text-indigo-500" size={32} /> 360° Self-Growth
          </h1>
          <p className="text-slate-400 mt-2">AI-powered insights into your performance, alignment, and future trajectory.</p>
        </div>
      </div>

      {/* 360 Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp size={80} /></div>
          <p className="text-sm text-slate-400 mb-2">KPI Alignment</p>
          <p className="text-4xl font-black text-white">{growth?.kpi_alignment_score || 0}<span className="text-xl text-slate-500">/100</span></p>
          <p className="text-xs text-indigo-400 mt-2 font-medium">{growth?.kpi_alignment_detail}</p>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><BookOpen size={80} /></div>
          <p className="text-sm text-slate-400 mb-2">Skill Growth (Month)</p>
          <p className="text-4xl font-black text-emerald-400">+{growth?.skill_growth?.growth_pct || 0}%</p>
          <p className="text-xs text-emerald-500/70 mt-2 font-medium">Across active learning paths</p>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Award size={80} /></div>
          <p className="text-sm text-slate-400 mb-2">Peer Collaboration</p>
          <p className="text-4xl font-black text-white">{growth?.peer_collaboration_score || 0}<span className="text-xl text-slate-500">/100</span></p>
          <p className="text-xs text-blue-400 mt-2 font-medium">{growth?.peer_collaboration_detail}</p>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Smile size={80} /></div>
          <p className="text-sm text-slate-400 mb-2">Mood-Productivity</p>
          <p className="text-2xl font-black text-white mt-1">{growth?.mood_productivity_correlation?.correlation}</p>
          <p className="text-xs text-orange-400 mt-3 font-medium">{growth?.mood_productivity_correlation?.detail}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Career Simulation */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-gradient-to-br from-indigo-900/40 to-[#111] p-10 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10"><Compass size={200} /></div>
            
            <div className="relative z-10">
              <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/30">
                Gemini AI Career Simulation
              </span>
              
              <h2 className="text-3xl font-black text-white mt-6 mb-2">
                Projected: {simulation?.predicted_role || "Leadership Role"}
              </h2>
              <p className="text-indigo-200/70 text-lg mb-8 leading-relaxed">
                {simulation?.executive_summary}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Timeline to Readiness</p>
                  <p className="text-2xl font-bold text-white">{simulation?.timeline_months || 24} Months</p>
                </div>
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Current Readiness</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-2xl font-bold text-white">{simulation?.current_readiness_pct || 0}%</p>
                    <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${simulation?.current_readiness_pct || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Recommended Training Investment (Est. ${simulation?.training_investment?.total_cost_usd || 0})</h3>
              <div className="space-y-3">
                {simulation?.training_investment?.courses?.map((course, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/10 transition cursor-default">
                    <div>
                      <p className="font-bold text-white text-sm">{course.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{course.provider} • {course.duration}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">{course.impact} Impact</span>
                      <p className="text-sm font-bold text-slate-300 mt-2">${course.cost_usd}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gamified Milestones */}
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Award className="text-yellow-500" size={20} /> Milestone Achievements
            </h3>
            <div className="flex flex-wrap gap-3">
              {growth?.milestone_badges?.length > 0 ? (
                growth.milestone_badges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <Zap size={16} /> {badge}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Complete learning paths and interviews to earn badges.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Plan & Voice Analytics */}
        <div className="space-y-8">
          
          <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Voice-Session Sentiment</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Communication Clarity</span>
                  <span className="text-white font-bold">{growth?.voice_session_summary?.clarity_avg || 0}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${growth?.voice_session_summary?.clarity_avg || 0}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Confidence Score</span>
                  <span className="text-white font-bold">{growth?.voice_session_summary?.confidence_avg || 0}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${growth?.voice_session_summary?.confidence_avg || 0}%` }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-slate-500 text-center">Based on {growth?.voice_session_summary?.sessions_completed || 0} AI Interview sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold text-white mb-6">Simulation Milestones</h3>
            <div className="space-y-0 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-white/10 before:to-transparent">
              {simulation?.milestones?.map((m, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#050505] bg-indigo-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white/5 p-3 rounded-xl border border-white/5 shadow">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white text-sm">Month {m.month}</h4>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{m.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
