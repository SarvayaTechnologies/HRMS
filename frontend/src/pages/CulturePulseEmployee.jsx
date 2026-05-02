import React, { useState } from 'react';
import { 
  HeartPulse, Send, ShieldCheck, Zap, Smile, 
  MessageSquare, Sparkles, Target, AlertCircle
} from 'lucide-react';

export default function CulturePulseEmployee() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    micro_feedback: '',
    psychological_safety: 3,
    engagement_drivers: [],
    mood_tags: [],
    cultural_alignment: 3,
    anonymous_feedback: ''
  });

  const drivers = [
    "New Skill Learned", "Team Collaboration", "Clear Recognition", 
    "Goal Clarity", "Autonomy", "Meaningful Impact"
  ];

  const moods = [
    "Inspired", "Overwhelmed", "Focused", "Indifferent", 
    "Anxious", "Valued", "Disconnected"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:8001/culture/submit-pulse", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleList = (list, item) => {
    if (formData[list].includes(item)) {
      setFormData({ ...formData, [list]: formData[list].filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [list]: [...formData[list], item] });
    }
  };

  if (submitted) {
    return (
      <div className="p-8 h-full flex items-center justify-center bg-[#050505]">
        <div className="max-w-md w-full bg-[#0a0a0a] border border-emerald-500/20 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Pulse Recorded!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your feedback has been anonymized and added to the organization's culture map. 
            Thank you for helping us build a better workplace.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all"
          >
            Submit Another?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-[#050505] text-slate-300 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <HeartPulse className="text-rose-500" size={32} />
              The Expressive Pulse
            </h1>
            <p className="text-slate-500 mt-2">Share your vibe. Help us improve. Completely Anonymous.</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-full flex items-center gap-2">
            <ShieldCheck className="text-rose-500" size={16} />
            <span className="text-rose-500 text-xs font-bold uppercase tracking-widest">End-to-End Anonymous</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
          {/* Section 1: Mini-Moment */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="text-indigo-400" size={20} />
              1. Mini-Moment Feedback
            </h2>
            <div className="relative">
              <textarea 
                maxLength={140}
                required
                placeholder="Highlight a specific small win or friction point from your week... (max 140 chars)"
                className="w-full bg-[#050505] border border-slate-800 rounded-2xl p-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-all resize-none min-h-[100px]"
                onChange={(e) => setFormData({...formData, micro_feedback: e.target.value})}
              />
              <span className="absolute bottom-4 right-4 text-xs font-mono text-slate-600">
                {formData.micro_feedback.length}/140
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 2: Psych Safety */}
            <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                2. Psychological Safety
              </h2>
              <p className="text-sm text-slate-500 mb-6 italic">"How safe did you feel to disagree in meetings this week?"</p>
              <input 
                type="range" min="1" max="5" 
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                value={formData.psychological_safety}
                onChange={(e) => setFormData({...formData, psychological_safety: parseInt(e.target.value)})}
              />
              <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                <span>Not Safe</span>
                <span>Fully Empowered</span>
              </div>
            </div>

            {/* Section 3: Cultural Alignment */}
            <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Target className="text-amber-400" size={20} />
                3. Cultural Alignment
              </h2>
              <p className="text-sm text-slate-500 mb-6 italic">"Did your work this week contribute to the organization's mission?"</p>
              <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num} type="button"
                    onClick={() => setFormData({...formData, cultural_alignment: num})}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all font-bold ${
                      formData.cultural_alignment === num 
                      ? 'bg-amber-500 border-amber-500 text-black scale-110' 
                      : 'border-slate-800 text-slate-500 hover:border-amber-500/50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Engagement Drivers */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="text-cyan-400" size={20} />
              4. Engagement Drivers
            </h2>
            <p className="text-sm text-slate-500 mb-6 italic">"What motivated you most this week?"</p>
            <div className="flex flex-wrap gap-3">
              {drivers.map(d => (
                <button
                  key={d} type="button"
                  onClick={() => toggleList('engagement_drivers', d)}
                  className={`px-5 py-3 rounded-full border text-sm font-medium transition-all ${
                    formData.engagement_drivers.includes(d)
                    ? 'bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                    : 'border-slate-800 text-slate-500 hover:border-cyan-500/50'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: AI Mood Tags */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="text-fuchsia-400" size={20} />
              5. AI-Enhanced Mood Tags
            </h2>
            <p className="text-sm text-slate-500 mb-6 italic">"Tag your week with specific sentiments for deeper analysis."</p>
            <div className="flex flex-wrap gap-3">
              {moods.map(m => (
                <button
                  key={m} type="button"
                  onClick={() => toggleList('mood_tags', m)}
                  className={`px-5 py-3 rounded-full border text-sm font-medium transition-all ${
                    formData.mood_tags.includes(m)
                    ? 'bg-fuchsia-500 border-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/20'
                    : 'border-slate-800 text-slate-500 hover:border-fuchsia-500/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional: Longer feedback */}
          <div className="bg-[#0a0a0a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Smile className="text-slate-400" size={20} />
              Anything else on your mind? (Optional)
            </h2>
            <textarea 
              placeholder="Your deeper thoughts..."
              className="w-full bg-[#050505] border border-slate-800 rounded-2xl p-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-600 transition-all resize-none min-h-[120px]"
              onChange={(e) => setFormData({...formData, anonymous_feedback: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black py-5 rounded-3xl transition-all transform hover:scale-[1.01] active:scale-95 shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? "Recording Vibe..." : (
              <>
                <Send size={20} />
                TRANSMIT WEEKLY PULSE
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
