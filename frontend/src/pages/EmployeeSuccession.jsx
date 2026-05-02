import React, { useState, useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  Award, 
  MapPin, 
  Users, 
  ChevronRight, 
  Loader, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Briefcase
} from 'lucide-react';

export default function EmployeeSuccession() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [openForMentorship, setOpenForMentorship] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState("Director of Engineering");

  useEffect(() => {
    fetchProfile();
  }, [selectedGoal]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8001/succession/employee-profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching succession profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  const badges = profile?.leadership_badges || [];
  const skillGaps = profile?.skill_gaps || [];

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">The Future Leader Profile</h1>
            <p className="text-slate-500 mt-2">Map your trajectory, signal readiness, and close the gap to leadership.</p>
          </div>
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer">
            <Award size={20} />
            <span className="font-bold">Claim Leadership Badge</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Aspirational Readiness */}
          <div className="lg:col-span-2 space-y-8">
            {/* Goal Role Selector */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Target size={120} />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Target className="text-indigo-600" size={20} />
                  Aspirational Readiness
                </h3>
                
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Goal Role</label>
                  <div className="flex gap-4">
                    <select 
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    >
                      <option>Director of Engineering</option>
                      <option>VP of Product</option>
                      <option>Chief Technology Officer</option>
                      <option>Head of Data Science</option>
                    </select>
                    <button className="bg-indigo-50 text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-100 transition-colors">
                      Update Goal
                    </button>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-6">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black text-emerald-600 uppercase">Readiness Score</p>
                      <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-4xl font-black text-emerald-700">{profile?.pre_onboarding_readiness_pct}%</p>
                    <p className="text-xs text-emerald-600/80 mt-2">You are currently "Ready in 1 Year"</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                    <p className="text-xs font-black text-indigo-600 uppercase mb-2">Mentor Match</p>
                    <p className="text-sm font-bold text-indigo-900 mb-1">{profile?.mentor_match_recommendation}</p>
                    <p className="text-xs text-indigo-600/80">Automated match based on role trajectory</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill-Gap Visualization */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={20} />
                Skill-Gap Visualization
              </h3>
              
              <div className="space-y-6">
                {skillGaps.map((gap, idx) => (
                  <div key={idx} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{gap.skill}</p>
                        <p className="text-xs text-slate-500">Gap: {gap.required - gap.current} points</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        Level {gap.current} / {gap.required}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${(gap.current / gap.required) * 100}%` }}
                      ></div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-500" />
                        <span className="text-xs font-medium text-slate-600">Recommended: {gap.recommended_path}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Status & Milestones */}
          <div className="space-y-8">
            {/* Leadership Badges */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <Award className="text-indigo-600" size={20} />
                Leadership Badges
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      badge.earned 
                        ? 'bg-amber-50 border-amber-200 shadow-sm' 
                        : 'bg-slate-50 border-slate-100 opacity-60 grayscale'
                    }`}
                  >
                    <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      badge.earned ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Award size={20} />
                    </div>
                    <p className={`text-xs font-black uppercase ${
                      badge.earned ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      {badge.badge}
                    </p>
                    {badge.earned && (
                      <CheckCircle2 size={12} className="text-amber-500 mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-6 text-center tracking-widest">
                Earned via Peer Intelligence
              </p>
            </div>

            {/* Critical Toggles */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Global Mobility</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Willing to Relocate</p>
                  </div>
                </div>
                <button 
                  onClick={() => setWillingToRelocate(!willingToRelocate)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${willingToRelocate ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${willingToRelocate ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Mentorship</p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">Open for Mentorship</p>
                  </div>
                </div>
                <button 
                  onClick={() => setOpenForMentorship(!openForMentorship)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${openForMentorship ? 'bg-emerald-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${openForMentorship ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>

            {/* Simulation Trigger */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Activity size={80} />
              </div>
              <h3 className="text-lg font-black mb-2 relative z-10 flex items-center gap-2">
                <PlayCircle className="text-indigo-400" size={20} />
                Shadow Simulation
              </h3>
              <p className="text-xs text-slate-400 mb-6 relative z-10">
                The Shadow Pipeline is active. Complete micro-tasks to prove leadership readiness.
              </p>
              <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 relative z-10">
                Start Next Simulation
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal icons used but defined for completeness if needed elsewhere
const Activity = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);

const PlayCircle = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="10 8 16 12 10 16 10 8"></polygon>
  </svg>
);
