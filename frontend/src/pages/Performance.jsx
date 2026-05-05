import React, { useState, useEffect } from 'react';
import { Award, BrainCircuit, TrendingUp, AlertTriangle, UserCheck, Activity, Users, ChevronRight, BarChart3, Target } from 'lucide-react';

export default function Performance() {
  const [nineBox, setNineBox] = useState(null);
  const [sentimentTrend, setSentimentTrend] = useState(null);
  const [promotions, setPromotions] = useState(null);
  const [risks, setRisks] = useState(null);
  const [learningAnalytics, setLearningAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      const [nbRes, stRes, prRes, rRes, laRes] = await Promise.all([
        fetch("http://localhost:8001/performance/nine-box", { headers }),
        fetch("http://localhost:8001/performance/sentiment-trend", { headers }),
        fetch("http://localhost:8001/performance/promotion-readiness", { headers }),
        fetch("http://localhost:8001/performance/disengagement-risk", { headers }),
        fetch("http://localhost:8001/org/courses/analytics", { headers })
      ]);

      setNineBox(await nbRes.json());
      setSentimentTrend(await stRes.json());
      setPromotions(await prRes.json());
      setRisks(await rRes.json());
      if (laRes.ok) setLearningAnalytics(await laRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center text-slate-400">
          <BrainCircuit size={48} className="animate-pulse mb-4 text-indigo-500" />
          <p className="font-medium">Synthesizing Strategic Talent Intelligence...</p>
        </div>
      </div>
    );
  }

  // 9-Box Grid Mapping (3x3)
  // X: Performance (Low=1, Med=2, High=3)
  // Y: Potential (Low=1, Med=2, High=3)
  const gridCells = [
    { x: 1, y: 3, label: 'Rough Diamond', bg: 'bg-yellow-50', text: 'text-yellow-700' },
    { x: 2, y: 3, label: 'Rising Star', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { x: 3, y: 3, label: 'Star', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    { x: 1, y: 2, label: 'Inconsistent Player', bg: 'bg-orange-50', text: 'text-orange-700' },
    { x: 2, y: 2, label: 'Core Player', bg: 'bg-blue-50', text: 'text-blue-700' },
    { x: 3, y: 2, label: 'High Performer', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { x: 1, y: 1, label: 'Underperformer', bg: 'bg-red-50', text: 'text-red-700' },
    { x: 2, y: 1, label: 'Effective', bg: 'bg-slate-100', text: 'text-slate-700' },
    { x: 3, y: 1, label: 'Trusted Professional', bg: 'bg-blue-50', text: 'text-blue-700' },
  ];

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Award className="text-indigo-600" size={32} /> Strategic Talent Intelligence
          </h1>
          <p className="text-slate-500 mt-2">AI-driven actionable insights across the organization.</p>
        </div>
      </div>

      {/* KPI & Metric Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><UserCheck size={24} /></div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">PROMOTIONS</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{promotions?.total || 0}</p>
          <p className="text-sm text-slate-500 font-medium">Ready for next role</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-100 text-red-600 p-3 rounded-xl"><AlertTriangle size={24} /></div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">FLIGHT RISK</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{risks?.total_at_risk || 0}</p>
          <p className="text-sm text-slate-500 font-medium">Critical intervention needed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl"><TrendingUp size={24} /></div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">ORG SENTIMENT</span>
          </div>
          <p className="text-3xl font-black text-slate-800">{sentimentTrend?.overall_trend || "Stable"}</p>
          <p className="text-sm text-slate-500 font-medium">Peer feedback direction</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-100 text-amber-600 p-3 rounded-xl"><BookOpen size={24} /></div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">UPSKILLING</span>
          </div>
          <p className="text-3xl font-black text-slate-800">
            {learningAnalytics.filter(a => a.status === 'completed').length}
          </p>
          <p className="text-sm text-slate-500 font-medium">Courses completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 9-Box Grid Column */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-indigo-500" /> Executive 9-Box Matrix
              </h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">AI Automated</span>
            </div>
            
            <p className="text-slate-600 mb-8 leading-relaxed">
              {nineBox?.summary || "Matrix automatically generated based on historical performance data and AI sentiment analysis of peer feedback."}
            </p>

            {/* 3x3 Grid Layout */}
            <div className="relative border-l-2 border-b-2 border-slate-300 pb-2 pl-2">
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold text-slate-500 tracking-widest">POTENTIAL</div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500 tracking-widest">PERFORMANCE</div>

              <div className="grid grid-cols-3 gap-2 h-[400px]">
                {gridCells.map((cell, idx) => {
                  // Find employees mapped to this cell
                  const cellEmployees = nineBox?.placements?.filter(p => p.grid_position?.[0] === cell.x && p.grid_position?.[1] === cell.y) || [];
                  
                  return (
                    <div key={idx} className={`${cell.bg} rounded-xl p-3 flex flex-col border border-black/5 transition-transform hover:scale-[1.02]`}>
                      <div className={`text-xs font-bold uppercase mb-2 ${cell.text}`}>{cell.label}</div>
                      <div className="flex-1 flex flex-wrap content-start gap-1 overflow-y-auto custom-scrollbar">
                        {cellEmployees.map(emp => (
                          <div key={emp.employee_id} className="bg-white text-[10px] font-bold text-slate-700 px-2 py-1 rounded shadow-sm border border-slate-200 cursor-pointer hover:border-indigo-400">
                            {emp.employee_name.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-500" /> Recent Upskilling Progress
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningAnalytics.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className={`p-2 rounded-xl ${entry.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Award size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{entry.employee_name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{entry.course_title}</p>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                    entry.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  }`}>
                    {entry.status}
                  </span>
                </div>
              ))}
              {learningAnalytics.length === 0 && (
                <p className="col-span-2 text-center text-slate-400 py-4 italic">No learning data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Action Alerts Column */}
        <div className="space-y-8">
          
          {/* Promotion Readiness */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-xl text-white">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Target size={20} /> Promotion Readiness
            </h3>
            <p className="text-emerald-50 text-sm mb-6">Employees meeting 90%+ of requirements for open Internal Roles.</p>
            
            <div className="space-y-3">
              {promotions?.alerts?.length > 0 ? (
                promotions.alerts.map((alert, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold">{alert.employee_name}</p>
                      <span className="text-xs font-black bg-white text-emerald-600 px-2 py-1 rounded-md">{alert.match_pct}% Match</span>
                    </div>
                    <p className="text-xs text-emerald-100">Current: {alert.role}</p>
                    <p className="text-xs font-medium mt-1">Target: {alert.target_job}</p>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 bg-white/10 rounded-xl border border-white/20">
                  <p className="text-sm font-medium">No immediate promotion alerts.</p>
                </div>
              )}
            </div>
          </div>

          {/* Disengagement Risk */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Activity className="text-red-500" size={20} /> Disengagement Risk
            </h3>
            <p className="text-slate-500 text-sm mb-6">AI detection of burnout, negative sentiment, and overtime patterns.</p>
            
            <div className="space-y-4">
              {risks?.risks?.length > 0 ? (
                risks.risks.map((risk, idx) => (
                  <div key={idx} className="bg-red-50 rounded-xl p-4 border border-red-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-50"><AlertTriangle className="text-red-300" size={40} /></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-slate-800">{risk.employee_name}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${risk.risk_level === 'Critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                          {risk.risk_level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">{risk.role} • {risk.department}</p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {risk.factors.map((f, i) => <li key={i} className="flex items-center gap-1">• {f}</li>)}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm text-slate-400 font-medium">Org health is optimal. No critical risks detected.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}