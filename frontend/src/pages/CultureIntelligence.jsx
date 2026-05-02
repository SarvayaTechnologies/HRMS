import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Activity, Shield, Zap, 
  TrendingUp, TrendingDown, Users, Flame, Sparkles, 
  ChevronRight, Calendar, Download, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function CultureIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workshopLoading, setWorkshopLoading] = useState(null);
  const [activeWorkshop, setActiveWorkshop] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:8001/culture/org-intelligence", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        setError("Failed to fetch intelligence data");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const generateWorkshop = async (teamName) => {
    setWorkshopLoading(teamName);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8001/culture/intervention-template/${teamName}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setActiveWorkshop({ team: teamName, agenda: result });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWorkshopLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[600px] bg-slate-50">
        <RefreshCw className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium italic">Gemini is synthesizing the Culture Map...</p>
      </div>
    );
  }

  if (!data || !data.heatmap) {
    return (
      <div className="p-10 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-white border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="text-slate-300" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">No Culture Data Yet</h1>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Employee pulse data is required to generate the Culture Intelligence Map. 
            Encourage your teams to complete their "Expressive Pulse" this week.
          </p>
          <button 
            onClick={fetchData}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 bg-slate-50 min-h-screen text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2">
              <Shield size={14} /> Organization Health
            </div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              Culture Intelligence Dashboard
              <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">Beta</span>
            </h1>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Download size={18} /> Export PDF Report
          </button>
        </header>

        {/* Top Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Heart size={24} />
              </div>
              <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                <TrendingUp size={14} /> +4%
              </span>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Global Sentiment</h3>
            <p className="text-3xl font-black text-slate-900">{(data.roi_metrics.culture_to_performance_index * 100).toFixed(1)}%</p>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <Flame size={24} />
              </div>
              <span className="flex items-center gap-1 text-rose-600 font-bold text-xs">
                <TrendingUp size={14} /> +12%
              </span>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Burnout Potential</h3>
            <p className="text-3xl font-black text-slate-900">{(data.roi_metrics.burnout_impact_score * 10).toFixed(1)}/10</p>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Shield size={24} />
              </div>
              <span className="flex items-center gap-1 text-indigo-600 font-bold text-xs">
                Stable
              </span>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Psych Safety Avg</h3>
            <p className="text-3xl font-black text-slate-900">4.2/5</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Heatmap Section */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <Activity className="text-indigo-600" />
              Department Sentiment Heatmap
            </h2>
            <div className="space-y-6">
              {data.heatmap.map((dept, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-sm font-black text-slate-900">{dept.department}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase ml-3">{dept.sample_size} Samples</span>
                    </div>
                    <span className={`text-sm font-black ${dept.sentiment_score > 0.7 ? 'text-emerald-600' : dept.sentiment_score > 0.4 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {(dept.sentiment_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${dept.sentiment_score > 0.7 ? 'bg-emerald-500' : dept.sentiment_score > 0.4 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${dept.sentiment_score * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                    {dept.top_drivers.map((tag, i) => (
                      <span key={i} className="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights & ROI */}
          <div className="bg-[#0f172a] p-10 rounded-[40px] text-white shadow-2xl shadow-indigo-900/20 flex flex-col">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
              <Sparkles className="text-indigo-400" />
              Silent Majority Insights
            </h2>
            <div className="space-y-8 flex-1">
              {data.silent_majority_insights.map((insight, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-indigo-500/30">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 bg-indigo-500 rounded-full" />
                  <h4 className="text-sm font-black mb-2 text-indigo-300 uppercase tracking-wider">{insight.topic}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{insight.observation}"</p>
                  <div className="mt-3 bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">RECOMMENDED ACTION:</span>
                    <p className="text-[11px] text-emerald-400 font-bold uppercase">{insight.action_item}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-5 bg-indigo-600 rounded-3xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Culture-to-ROI Index</span>
                <span className="text-lg font-black">{(data.roi_metrics.culture_to_performance_index * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-indigo-200 italic opacity-80 leading-relaxed">
                Positive culture correlation with milestone delivery velocity.
              </p>
            </div>
          </div>
        </div>

        {/* Autonomous Intervention Section */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm mb-20">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Zap className="text-indigo-600" />
                Autonomous Culture Interventions
              </h2>
              <p className="text-slate-500 mt-1">AI-generated team workshops based on recent friction patterns.</p>
            </div>
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest">
              <AlertTriangle size={14} /> {data.heatmap.filter(d => d.sentiment_score < 0.5).length} Friction Hotspots Detected
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.heatmap.map((dept, idx) => (
              <div key={idx} className={`p-8 rounded-3xl border-2 transition-all ${dept.sentiment_score < 0.6 ? 'border-amber-100 bg-amber-50/30' : 'border-slate-50 hover:border-indigo-100'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{dept.department}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Sentiment: {(dept.sentiment_score * 100).toFixed(0)}%</p>
                  </div>
                  {dept.sentiment_score < 0.6 && <div className="p-2 bg-amber-500 text-white rounded-lg animate-pulse"><Flame size={16} /></div>}
                </div>
                
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Recent pulses show friction around: <span className="font-bold">{dept.top_drivers.slice(0,2).join(', ')}</span>. 
                  Proactive workshop recommended.
                </p>

                <button 
                  onClick={() => generateWorkshop(dept.department)}
                  disabled={workshopLoading === dept.department}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    dept.sentiment_score < 0.6 
                    ? 'bg-amber-600 text-white hover:bg-amber-700' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {workshopLoading === dept.department ? <RefreshCw className="animate-spin" size={18} /> : (
                    <>
                      <Sparkles size={18} />
                      Generate Workshop Agenda
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workshop Modal */}
      {activeWorkshop && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[48px] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
            <div className="p-10 bg-indigo-600 text-white">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black mb-2">{activeWorkshop.agenda.title}</h2>
                  <p className="text-indigo-100 font-medium">Custom Intervention Workshop for Team: {activeWorkshop.team}</p>
                </div>
                <button onClick={() => setActiveWorkshop(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                  <Activity size={24} />
                </button>
              </div>
              <div className="flex gap-4">
                <div className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/20">
                  Duration: {activeWorkshop.agenda.duration}
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/20">
                  Focus: {activeWorkshop.agenda.focus_area}
                </div>
              </div>
            </div>
            
            <div className="p-10 overflow-y-auto flex-1 bg-slate-50 custom-scrollbar">
              <div className="space-y-8">
                {activeWorkshop.agenda.agenda_steps.map((step, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <div className="w-1 flex-1 bg-indigo-100 my-2" />
                    </div>
                    <div className="flex-1 pb-8">
                      <h4 className="text-lg font-black text-slate-900 mb-2">{step.activity}</h4>
                      <div className="flex gap-4 mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                          {step.timing}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100 shadow-sm italic">
                        "{step.facilitator_note}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
              <button className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100">
                <Calendar size={20} />
                Schedule Workshop with Manager
              </button>
              <button onClick={() => setActiveWorkshop(null)} className="px-10 py-5 bg-slate-100 text-slate-600 rounded-3xl font-bold hover:bg-slate-200 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}