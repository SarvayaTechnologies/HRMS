import React, { useState, useEffect } from 'react';
import {
  Flame, Shield, TrendingUp, TrendingDown, Users, AlertTriangle, Activity,
  Loader2, Sparkles, Brain, Scale, FileWarning, Zap, RefreshCw, X, ChevronRight
} from 'lucide-react';

export default function HotspotRadar() {
  const [alerts, setAlerts] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [activeTab, setActiveTab] = useState('heatmap');
  const token = localStorage.getItem("token");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [radarRes, intelRes] = await Promise.all([
        fetch("http://localhost:8001/culture/burnout-radar", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:8001/attrition/intelligence", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (radarRes.ok) setAlerts((await radarRes.json()).burnout_alerts || []);
      if (intelRes.ok) setIntelligence(await intelRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const runLivePrediction = async () => {
    setPredictionLoading(true);
    try {
      const res = await fetch("http://localhost:8001/attrition/live-prediction", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) { setPrediction(await res.json()); setShowPrediction(true); }
    } catch (err) { console.error(err); }
    finally { setPredictionLoading(false); }
  };

  const tabs = [
    { id: 'heatmap', label: 'Burnout Heatmap', icon: <Flame size={16} /> },
    { id: 'resignation', label: 'Resignation Risk', icon: <TrendingDown size={16} /> },
    { id: 'knowledge', label: 'Knowledge Loss', icon: <Brain size={16} /> },
    { id: 'ratio', label: 'Engagement Ratio', icon: <Scale size={16} /> },
    { id: 'compliance', label: 'Compliance', icon: <FileWarning size={16} /> },
  ];

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[600px] bg-slate-50">
        <Loader2 className="animate-spin text-rose-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium italic">Synthesizing Attrition Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="p-10 bg-slate-50 min-h-screen text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-widest mb-2">
              <Shield size={14} /> Organization Health Command Center
            </div>
            <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
              Burnout & Attrition Radar
            </h1>
          </div>
          <button
            onClick={runLivePrediction}
            disabled={predictionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-xl transition-all disabled:opacity-50"
          >
            {predictionLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Live Prediction
          </button>
        </div>

        {/* Executive Summary */}
        {intelligence?.executive_summary && (
          <div className="bg-slate-900 rounded-[32px] p-8 mb-8 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/20 rounded-2xl"><AlertTriangle className="text-rose-400" size={24} /></div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2">AI Executive Summary</h3>
                <p className="text-white leading-relaxed">{intelligence.executive_summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Flame size={20} /></div>
              <span className="text-rose-600 font-bold text-xs">{alerts.length} flagged</span>
            </div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Burnout Alerts</h3>
            <p className="text-3xl font-black text-slate-900">{alerts.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-3"><TrendingDown size={20} /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Highest Resign Risk</h3>
            <p className="text-3xl font-black text-slate-900">
              {intelligence?.resignation_probability?.[0]?.probability_pct || 0}%
            </p>
          </div>
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-3"><Brain size={20} /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Knowledge at Risk</h3>
            <p className="text-3xl font-black text-slate-900">
              {intelligence?.knowledge_loss_index?.[0]?.critical_milestones_at_risk || 0} <span className="text-sm text-slate-400">milestones</span>
            </p>
          </div>
          <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-3"><FileWarning size={20} /></div>
            <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">Compliance Flags</h3>
            <p className="text-3xl font-black text-slate-900">{intelligence?.compliance_flags?.length || 0}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 mb-20">
          {/* Burnout Heatmap */}
          {activeTab === 'heatmap' && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3"><Flame className="text-rose-500" /> Burnout Heatmap by Project</h2>
              {intelligence?.burnout_heatmap?.length > 0 ? (
                <div className="space-y-6">
                  {intelligence.burnout_heatmap.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6 p-6 rounded-2xl border border-slate-100 hover:border-rose-100 transition-all">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl ${
                        item.risk_level === 'Critical' ? 'bg-rose-100 text-rose-600' : item.risk_level === 'Warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>{item.exhaustion_index}%</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{item.project}</h4>
                        <p className="text-xs text-slate-500">{item.manager} · {item.avg_overtime_hrs}h avg overtime</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                        item.risk_level === 'Critical' ? 'bg-rose-100 text-rose-700' : item.risk_level === 'Warning' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>{item.risk_level}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-center py-12">No burnout patterns detected. Workforce healthy.</p>}
            </div>
          )}

          {/* Resignation Probability */}
          {activeTab === 'resignation' && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3"><TrendingDown className="text-amber-500" /> Predictive Resignation Probability (90 Days)</h2>
              {intelligence?.resignation_probability?.length > 0 ? (
                <div className="space-y-6">
                  {intelligence.resignation_probability.map((item, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-end mb-3">
                        <h4 className="font-black text-slate-900 text-lg">{item.team}</h4>
                        <span className={`text-2xl font-black ${item.probability_pct > 25 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.probability_pct}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden mb-3">
                        <div className={`h-full transition-all ${item.probability_pct > 25 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${item.probability_pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-500"><span className="font-bold">Key Driver:</span> {item.key_driver}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-center py-12">Insufficient data for resignation prediction.</p>}
            </div>
          )}

          {/* Knowledge Loss Index */}
          {activeTab === 'knowledge' && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3"><Brain className="text-indigo-500" /> Knowledge Loss Index</h2>
              {intelligence?.knowledge_loss_index?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {intelligence.knowledge_loss_index.map((item, idx) => (
                    <div key={idx} className="p-8 rounded-3xl border-2 border-slate-100">
                      <h4 className="font-black text-slate-900 text-lg mb-4">{item.team}</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Memory Risk</span><span className={`text-sm font-bold ${item.institutional_memory_risk === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>{item.institutional_memory_risk}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Milestones at Risk</span><span className="text-sm font-bold text-slate-900">{item.critical_milestones_at_risk}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Replacement Cost</span><span className="text-sm font-bold text-rose-600">${(item.estimated_replacement_cost_usd || 0).toLocaleString()}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-center py-12">No knowledge loss risks detected.</p>}
            </div>
          )}

          {/* Engagement-to-Burnout Ratio */}
          {activeTab === 'ratio' && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3"><Scale className="text-cyan-500" /> Engagement-to-Burnout Ratio</h2>
              {intelligence?.engagement_burnout_ratio?.length > 0 ? (
                <div className="space-y-6">
                  {intelligence.engagement_burnout_ratio.map((item, idx) => (
                    <div key={idx} className="p-6 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-black text-slate-900 text-lg">{item.team}</h4>
                        <span className={`text-2xl font-black ${item.ratio < 1.5 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.ratio}x</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Engagement</p>
                          <p className="text-2xl font-black text-emerald-700">{item.engagement_score}%</p>
                        </div>
                        <div className="bg-rose-50 rounded-xl p-4 text-center">
                          <p className="text-xs text-rose-600 font-bold uppercase mb-1">Burnout</p>
                          <p className="text-2xl font-black text-rose-700">{item.burnout_score}%</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold px-4 py-2 rounded-xl ${item.ratio < 1.5 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{item.verdict}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-center py-12">No engagement data available.</p>}
            </div>
          )}

          {/* Compliance */}
          {activeTab === 'compliance' && (
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3"><FileWarning className="text-amber-500" /> Regulatory Compliance Flags</h2>
              {intelligence?.compliance_flags?.length > 0 ? (
                <div className="space-y-4">
                  {intelligence.compliance_flags.map((item, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border-2 flex items-start gap-4 ${
                      item.severity === 'Critical' ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/50'
                    }`}>
                      <AlertTriangle className={item.severity === 'Critical' ? 'text-rose-600' : 'text-amber-600'} size={20} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-slate-900">{item.team}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                            item.severity === 'Critical' ? 'bg-rose-200 text-rose-700' : 'bg-amber-200 text-amber-700'
                          }`}>{item.severity}</span>
                        </div>
                        <p className="text-sm text-slate-600">{item.flag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="text-emerald-400 mx-auto mb-4" size={48} />
                  <p className="text-emerald-600 font-bold">All departments compliant</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Prediction Modal */}
      {showPrediction && prediction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[48px] overflow-hidden shadow-2xl flex flex-col">
            <div className={`p-10 text-white ${prediction.alert_level === 'Critical' ? 'bg-gradient-to-r from-rose-600 to-red-700' : 'bg-gradient-to-r from-indigo-600 to-indigo-700'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">HRVALY Live Prediction Engine</span>
                  </div>
                  <h2 className="text-2xl font-black">{prediction.primary_warning}</h2>
                </div>
                <button onClick={() => setShowPrediction(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full"><X size={20} /></button>
              </div>
              <div className="flex gap-4">
                <span className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase border border-white/20">Alert: {prediction.alert_level}</span>
                <span className="px-4 py-2 bg-white/10 rounded-xl text-xs font-bold uppercase border border-white/20">Confidence: {prediction.confidence_score}%</span>
              </div>
            </div>

            <div className="p-10 overflow-y-auto flex-1 bg-slate-50">
              {prediction.intervention?.recommended_moves && (
                <div className="mb-8">
                  <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2"><Users size={20} className="text-indigo-600" /> Recommended Resource Moves</h3>
                  {prediction.intervention.recommended_moves.map((move, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 mb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-sm font-bold text-slate-700">{move.from_team}</span>
                        <ChevronRight className="text-indigo-500" size={16} />
                        <span className="bg-indigo-100 px-3 py-1 rounded-lg text-sm font-bold text-indigo-700">{move.to_team}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center"><p className="text-xs text-slate-500 font-bold uppercase">Headcount</p><p className="text-xl font-black text-slate-900">{move.headcount}</p></div>
                        <div className="text-center"><p className="text-xs text-slate-500 font-bold uppercase">Duration</p><p className="text-xl font-black text-slate-900">{move.duration_days}d</p></div>
                        <div className="text-center"><p className="text-xs text-slate-500 font-bold uppercase">Skill Match</p><p className="text-xl font-black text-emerald-600">{move.skill_match_pct}%</p></div>
                      </div>
                      <p className="text-sm text-slate-600 italic">"{move.rationale}"</p>
                    </div>
                  ))}
                </div>
              )}

              {prediction.intervention?.estimated_impact && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
                  <h4 className="font-bold text-emerald-800 text-sm mb-2">Estimated Impact</h4>
                  <p className="text-emerald-700 text-sm">{prediction.intervention.estimated_impact}</p>
                </div>
              )}
              {prediction.intervention?.cost_of_inaction && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-6">
                  <h4 className="font-bold text-rose-800 text-sm mb-2">Cost of Inaction</h4>
                  <p className="text-rose-700 text-sm">{prediction.intervention.cost_of_inaction}</p>
                </div>
              )}

              {prediction.secondary_recommendations?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Secondary Recommendations</h4>
                  <ul className="space-y-2">
                    {prediction.secondary_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                        <Sparkles className="text-indigo-500 flex-shrink-0 mt-0.5" size={14} /> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
              <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">Execute Intervention Plan</button>
              <button onClick={() => setShowPrediction(false)} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}