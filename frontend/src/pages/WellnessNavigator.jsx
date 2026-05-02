import React, { useState, useEffect } from 'react';
import {
  Shield, Battery, BatteryWarning, Moon, Coffee, Brain,
  TrendingDown, TrendingUp, Clock, CalendarOff, Sparkles,
  AlertTriangle, BookOpen, Heart, Zap, ChevronRight,
  RefreshCw, Sun, Flame, Target
} from 'lucide-react';

export default function WellnessNavigator() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWellness(); }, []);

  const fetchWellness = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:8001/employee/wellness-navigator", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-emerald-500 mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-medium italic">Your Wellness Coach is analyzing your patterns...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="text-slate-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Wellness Data Unavailable</h2>
          <p className="text-slate-500 text-sm">Start checking in via Attendance to build your wellness profile.</p>
        </div>
      </div>
    );
  }

  const balanceColor = data.balance_score > 70 ? 'emerald' : data.balance_score > 40 ? 'amber' : 'rose';
  const balanceIcon = data.balance_score > 70 ? <Battery /> : data.balance_score > 40 ? <BatteryWarning /> : <Flame />;

  return (
    <div className="p-8 min-h-screen bg-[#050505] text-slate-300 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-widest mb-2">
                <Shield size={14} /> Private to You
              </div>
              <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                <Heart className="text-rose-500" size={32} />
                The Wellness Navigator
              </h1>
              <p className="text-slate-500 mt-1">Your personal performance coach. Only you can see this.</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full flex items-center gap-2">
              <Shield className="text-emerald-500" size={16} />
              <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">Private Dashboard</span>
            </div>
          </div>
        </header>

        {/* Work-Life Balance Hero */}
        <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-slate-800 rounded-[40px] p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full -mr-20 -mt-20" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <h2 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Work-Life Balance Score</h2>
              <div className="flex items-end gap-4 mb-6">
                <span className={`text-7xl font-black text-${balanceColor}-500`}>{data.balance_score}</span>
                <span className="text-slate-600 text-2xl font-bold mb-2">/100</span>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed italic">"{data.weekly_summary}"</p>
            </div>
            <div className={`p-6 bg-${balanceColor}-500/10 rounded-3xl text-${balanceColor}-500`}>
              {React.cloneElement(balanceIcon, { size: 48 })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-3">
                <Brain size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Deep Work</span>
              </div>
              <p className="text-2xl font-black text-white">{data.deep_work_hours_weekly || 0}<span className="text-sm text-slate-500 ml-1">hrs/wk</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <Coffee size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Meeting Load</span>
              </div>
              <p className="text-2xl font-black text-white">{data.meeting_hours_weekly || 0}<span className="text-sm text-slate-500 ml-1">hrs/wk</span></p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-rose-400 mb-3">
                <Flame size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Fatigue Level</span>
              </div>
              <p className="text-2xl font-black text-white">{data.meeting_fatigue_level || "Low"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Overtime Transparency */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="text-amber-400" size={20} />
              Overtime Transparency
            </h3>
            {data.overtime_streak ? (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl font-black text-amber-500">{data.overtime_streak.consecutive_late_days}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Consecutive Late Days</p>
                    <p className="text-xs text-slate-500 mt-1">Tracked from your attendance check-outs</p>
                  </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 text-amber-500 mb-2">
                    <CalendarOff size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Nudge</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{data.overtime_streak.recommendation}"</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No overtime patterns detected. Keep it up!</p>
            )}
          </div>

          {/* Quiet Mode Suggestion */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Moon className="text-indigo-400" size={20} />
              Automatic Quiet Mode
            </h3>
            {data.quiet_mode_suggestion?.triggered ? (
              <div>
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-2 text-indigo-400 mb-3">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Burnout Risk Detected</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">"{data.quiet_mode_suggestion.message}"</p>
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="text-indigo-400" size={16} />
                      <span className="text-sm font-bold text-indigo-300">{data.quiet_mode_suggestion.suggested_block}</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                  <Moon size={18} /> Activate Recharge Block
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Battery className="text-emerald-500" size={28} />
                </div>
                <p className="text-sm text-slate-400">Your energy levels look healthy. No recharge needed right now.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Skill-Drain Alert */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Target className="text-cyan-400" size={20} />
              Skill-Drain Alert
            </h3>
            {data.skill_drain_alert ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-slate-500">Task-to-Growth Alignment</span>
                  <span className={`text-2xl font-black ${data.skill_drain_alert.current_task_alignment_pct > 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {data.skill_drain_alert.current_task_alignment_pct}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full ${data.skill_drain_alert.current_task_alignment_pct > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${data.skill_drain_alert.current_task_alignment_pct}%` }}
                  />
                </div>
                {data.skill_drain_alert.triggered && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Alert Active</span>
                    </div>
                    <p className="text-sm text-slate-300 italic">"{data.skill_drain_alert.detail}"</p>
                  </div>
                )}
                {!data.skill_drain_alert.triggered && (
                  <p className="text-sm text-slate-500">Your work is well-aligned with your career aspirations.</p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Set your "Dream Roles" in Succession Planning to activate this.</p>
            )}
          </div>

          {/* Mood Trend */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="text-rose-400" size={20} />
              Mood Trend
            </h3>
            {data.mood_trend ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {data.mood_trend.direction === "declining" ? (
                      <TrendingDown className="text-rose-500" size={24} />
                    ) : data.mood_trend.direction === "improving" ? (
                      <TrendingUp className="text-emerald-500" size={24} />
                    ) : (
                      <TrendingUp className="text-slate-500" size={24} />
                    )}
                    <span className={`text-sm font-bold capitalize ${
                      data.mood_trend.direction === "declining" ? "text-rose-500" :
                      data.mood_trend.direction === "improving" ? "text-emerald-500" : "text-slate-400"
                    }`}>
                      {data.mood_trend.direction}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{data.mood_trend.avg_last_7_days}/5</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">7-Day Avg</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-sm text-slate-300 leading-relaxed italic">"{data.mood_trend.insight}"</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Submit mood check-ins via Attendance to see trends.</p>
            )}
          </div>
        </div>

        {/* Wellness Resources */}
        {data.wellness_resources && data.wellness_resources.length > 0 && (
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 mb-20">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-fuchsia-400" size={20} />
              Recommended Wellness Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.wellness_resources.map((res, idx) => (
                <div key={idx} className="bg-[#050505] border border-slate-800 rounded-2xl p-6 hover:border-fuchsia-500/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-2 mb-3">
                    {res.type === "Learning Path" ? (
                      <BookOpen className="text-fuchsia-400" size={18} />
                    ) : (
                      <Heart className="text-rose-400" size={18} />
                    )}
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{res.type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 group-hover:text-fuchsia-400 transition-colors">{res.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                      res.relevance === "High" ? "bg-rose-500/10 text-rose-500" : "bg-slate-800 text-slate-500"
                    }`}>
                      {res.relevance} Relevance
                    </span>
                    <ChevronRight className="text-slate-700 group-hover:text-fuchsia-400 transition-colors" size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
