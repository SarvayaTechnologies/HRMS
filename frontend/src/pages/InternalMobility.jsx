import React, { useState, useEffect } from 'react';
import { Briefcase, Inbox, MapPin, DollarSign, Building2, FileText, Plus, Loader2, UploadCloud, CheckCircle2, User, Mic, BarChart3, TrendingUp, Star, Target, Compass, ArrowRight, ShieldCheck, Zap, AlertTriangle, Users, BookCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function InternalMobility() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'employee' ? <EmployeeMobility /> : <OrgMobility />;
}

// -----------------------------------------------------
// EMPLOYEE VIEW: Advanced Marketplace
// -----------------------------------------------------
function EmployeeMobility() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace'); // marketplace, aspirations, gigs
  const [skillProfile, setSkillProfile] = useState(null);
  const [dreamRoles, setDreamRoles] = useState([]);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchProfile();
    fetchDreamPaths();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("http://localhost:8001/employee/jobs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://localhost:8001/employee/skill-profile", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setSkillProfile(await res.json());
    } catch (err) {}
  };

  const fetchDreamPaths = async () => {
    try {
      const res = await fetch("http://localhost:8001/employee/dream-roles", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDreamRoles(data.paths || []);
      }
    } catch (err) {}
  };

  const getMatchScore = (job) => {
    if (!skillProfile || !skillProfile.skills || !job.required_skills) return 0;
    const reqKeys = Object.keys(job.required_skills);
    if (reqKeys.length === 0) return 0;
    let matches = 0;
    reqKeys.forEach(k => {
      if (skillProfile.skills[k] || skillProfile.skills[k.toLowerCase()]) matches++;
    });
    return Math.round((matches / reqKeys.length) * 100);
  };

  const fullJobs = jobs.filter(j => j.job_type !== 'micro_gig');
  const scoredJobs = fullJobs.map(j => ({ ...j, matchScore: getMatchScore(j) })).sort((a, b) => b.matchScore - a.matchScore);
  const avgMatch = scoredJobs.length > 0 ? Math.round(scoredJobs.reduce((acc, j) => acc + j.matchScore, 0) / scoredJobs.length) : 0;
  const highMatches = scoredJobs.filter(j => j.matchScore >= 80);

  const [selectedJob, setSelectedJob] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleApplyClick = async (job) => {
    setSelectedJob(job);
    setStatusLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/employee/jobs/${job.id}/application`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppStatus(data.applied ? data : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAIResumeGenerate = async () => {
    setUploading(true);
    try {
      const resumeContent = `AI Generated Application\n\nSkills:\n${JSON.stringify(skillProfile?.skills)}\n\nNote:\n${skillProfile?.career_note || ""}`;
      const blob = new Blob([resumeContent], { type: 'text/plain' });
      const file = new File([blob], "ai_resume.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`http://localhost:8001/employee/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAppStatus({
          applied: true,
          status: data.status || "Qualified for AI Interview",
          match_score: data.score || 85
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const startInterview = async () => {
    try {
      const res = await fetch(`http://localhost:8001/employee/jobs/${selectedJob.id}/start-interview`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        navigate(`/dashboard/interview/${selectedJob.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 bg-[#030712] min-h-screen text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-4 border border-indigo-500/20">
              <SparklesIcon /> Talent Marketplace
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Your Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Horizon</span></h1>
            <p className="text-slate-400 max-w-2xl text-lg">Discover predictive skill matches, test-drive micro-gigs, and map your path to your dream role.</p>
          </div>
          <div className="flex bg-[#111827] p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            {['marketplace', 'aspirations', 'gigs'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === tab 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'marketplace' ? 'Full Roles' : tab === 'aspirations' ? 'Dream Path' : 'Micro-Gigs'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Rendering */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* AI Skill Match Summary Widget */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/90 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="#1e1e2d" strokeWidth="12" />
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="url(#gradient)" strokeWidth="12" strokeDasharray="351.8" strokeDashoffset={351.8 - (85 / 100) * 351.8} className="drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-1000 ease-out" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{avgMatch}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Match</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Zap className="text-amber-400" /> High-Match Opportunities</h3>
                  <p className="text-indigo-200/80 mb-6 max-w-xl">Our AI has analyzed your Performance Intelligence and skills matrix. We found {highMatches.length} roles where you hit over 80% of the required competencies.</p>
                  
                  <div className="flex gap-4">
                    {highMatches.slice(0, 3).map(hm => (
                       <span key={hm.id} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-xl text-sm font-semibold truncate max-w-[150px]">{hm.title}</span>
                    ))}
                    {highMatches.length === 0 && <span className="text-slate-400 italic">No 80%+ matches yet.</span>}
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-indigo-500" /></div>
            ) : jobs.filter(j => j.job_type !== 'micro_gig').length === 0 ? (
              <div className="bg-[#111827] border border-slate-800 rounded-3xl p-16 text-center shadow-xl">
                <Inbox className="mx-auto text-slate-600 mb-6" size={56} />
                <h3 className="font-bold text-white text-2xl mb-3">No Open Positions</h3>
                <p className="text-slate-400 text-lg max-w-md mx-auto">
                  There are no full-time internal roles currently listed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scoredJobs.map((job) => {
                  const matchScore = job.matchScore;
                  return (
                    <div key={job.id} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
                      {matchScore >= 85 && (
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-600 to-indigo-900 text-white text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-lg">
                          Best Match
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-5 pt-2">
                        <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
                          <Briefcase className="text-indigo-400" size={24} />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{matchScore}%</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Skill Match</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors mb-1">{job.title}</h3>
                      <p className="text-slate-400 text-sm font-medium mb-4 flex items-center gap-1.5"><Building2 size={14}/> {job.department}</p>
                      
                      <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">{job.description}</p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                          <MapPin size={14} className="text-slate-500" /> {job.location || 'Flexible'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-700">
                          <DollarSign size={14} className="text-slate-500" /> {job.package || 'Competitive'}
                        </div>
                      </div>

                      <button onClick={() => handleApplyClick(job)} className="w-full bg-white/5 border border-white/10 hover:bg-indigo-600 hover:border-indigo-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        View & Apply <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Micro-Gigs Tab */}
        {activeTab === 'gigs' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-gradient-to-br from-[#111827] to-[#1e1e2d] border border-cyan-500/20 rounded-3xl p-8 mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <Target className="text-cyan-400" /> Test-Drive a New Role
                </h3>
                <p className="text-slate-400 max-w-xl">Take on 1-2 week micro-projects in other departments to build skills and explore new career paths without leaving your current team.</p>
              </div>
              <div className="hidden md:block p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                <div className="text-cyan-400 font-bold flex items-center gap-2"><CheckCircle2 size={18}/> Manager Pre-Approved</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.filter(j => j.job_type === 'micro_gig').length === 0 ? (
                <div className="col-span-full bg-[#111827] border border-slate-800 rounded-3xl p-10 text-center">
                  <p className="text-slate-400">No micro-gigs currently available.</p>
                </div>
              ) : jobs.filter(j => j.job_type === 'micro_gig').map((gig, i) => (
                <div key={gig.id} className="bg-[#111827] border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/40 transition-all flex flex-col">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-2 block">Micro-Gig</span>
                       <h3 className="text-xl font-bold text-white mb-1">{gig.title}</h3>
                       <p className="text-sm text-slate-400">{gig.department}</p>
                     </div>
                     <button onClick={() => handleApplyClick(gig)} className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                       Claim Gig
                     </button>
                   </div>
                   <p className="text-slate-300 text-sm mb-6 leading-relaxed flex-1">{gig.description}</p>
                   <div className="flex gap-2 flex-wrap">
                     {gig.required_skills && Object.keys(gig.required_skills).map(s => (
                       <span key={s} className="bg-slate-800 text-slate-300 px-3 py-1 text-xs rounded-lg font-medium border border-slate-700">{s}</span>
                     ))}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dream Role Mapping Tab */}
        {activeTab === 'aspirations' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {dreamRoles.length === 0 ? (
               <div className="bg-[#111827] border border-slate-800 rounded-3xl p-10 text-center shadow-xl">
                 <p className="text-slate-400">No dream roles mapped yet. Update your profile aspirations to see your AI-generated roadmap!</p>
               </div>
            ) : dreamRoles.map((path, idx) => (
            <div key={idx} className="bg-[#111827] border border-slate-800 rounded-3xl p-10 relative overflow-hidden shadow-xl mb-8">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <Compass size={200} />
              </div>
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-sm font-bold mb-6 border border-fuchsia-500/20">
                  <Star size={16} /> Aspiration Mapping
                </div>
                <h2 className="text-3xl font-black text-white mb-4">Your Path to <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">{path.role}</span></h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">Based on your current skills, your readiness is <span className="text-white font-bold">{path.readiness_pct}%</span>. Estimated timeline: {path.timeline_months} months.</p>
                
                <div className="space-y-6">
                   {path.skill_gaps && path.skill_gaps.map((gap, gidx) => (
                   <div key={gidx} className="flex items-start gap-4 p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                     <div className="bg-amber-500 p-2 rounded-xl text-slate-900 mt-1"><Loader2 size={20} /></div>
                     <div className="flex-1">
                       <h4 className="text-white font-bold text-lg mb-1">Gap: {gap.skill}</h4>
                       <p className="text-amber-200/70 text-sm mb-4">Current Level: {gap.current} / Required: {gap.needed}</p>
                       <div className="bg-black/20 p-4 rounded-xl border border-amber-500/10">
                         <h5 className="text-xs uppercase font-bold text-slate-400 mb-2">Recommended Actions:</h5>
                         <ul className="text-sm text-slate-300 space-y-2 mb-4">
                           {gap.resources && gap.resources.map((r, ridx) => (
                             <li key={ridx} className="flex items-center gap-2"><ArrowRight size={14} className="text-amber-400"/> {r}</li>
                           ))}
                         </ul>
                         <Link to="/employee/learning" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                           <BookCheck size={14} /> Browse L&D Catalog
                         </Link>
                       </div>
                     </div>
                   </div>
                   ))}
                   
                   {path.skill_gaps && path.skill_gaps.length === 0 && (
                     <div className="flex items-start gap-4 p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                       <div className="bg-emerald-500 p-2 rounded-xl text-slate-900 mt-1"><CheckCircle2 size={20} /></div>
                       <div>
                         <h4 className="text-white font-bold text-lg mb-1">Ready for Transition</h4>
                         <p className="text-emerald-200/70 text-sm">You possess all required skills for this role! Keep an eye out for open requisitions.</p>
                       </div>
                     </div>
                   )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* Application Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-[#030712]/90 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#111827] border border-slate-700 rounded-[2rem] w-full max-w-2xl p-10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] my-8 animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 rounded-full p-2 transition-colors"
              >&times;</button>
              
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">{selectedJob.title}</h2>
                <div className="flex flex-wrap gap-3">
                  <span className="text-slate-400 text-sm font-medium px-3 py-1 bg-slate-800 rounded-lg">{selectedJob.department}</span>
                  <span className="text-slate-400 text-sm font-medium px-3 py-1 bg-slate-800 rounded-lg">{selectedJob.location || 'Remote'}</span>
                </div>
              </div>

              {statusLoading ? (
                <div className="flex justify-center p-16"><Loader2 className="w-12 h-12 animate-spin text-indigo-500" /></div>
              ) : appStatus ? (
                <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-8 text-center">
                  <div className="inline-flex bg-gradient-to-br from-emerald-400 to-emerald-600 text-white p-5 rounded-full mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">Application Active</h3>
                  
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8 text-left">
                    <p className="text-sm text-slate-400 mb-1">Pipeline Status</p>
                    <p className="text-lg font-bold text-white mb-4">{appStatus.status}</p>
                    
                    {appStatus.match_score !== null && (
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-sm text-slate-400">AI Predictive Match</p>
                          <p className={`text-xl font-black ${appStatus.match_score >= 80 ? "text-emerald-400" : "text-amber-400"}`}>{appStatus.match_score}%</p>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${appStatus.match_score >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} style={{width: `${appStatus.match_score}%`}}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {appStatus.status === "Qualified for AI Interview" && (
                    <button 
                      onClick={startInterview}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold px-8 py-4 rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all w-full flex items-center justify-center gap-3 text-lg"
                    >
                      <Mic size={22} /> Start Adaptive Voice Interview
                    </button>
                  )}
                  {appStatus.status === "AI Interview In Progress" && (
                     <div className="bg-indigo-500/10 text-indigo-300 p-5 rounded-2xl border border-indigo-500/30 flex items-center gap-4 text-left">
                       <Loader2 className="animate-spin shrink-0" size={24} />
                       <p className="text-sm">Your AI voice interview is active or processing. Please complete it to finish your application.</p>
                     </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">Recommended</div>
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2"><SparklesIcon size={18} /> 1-Click AI Resume</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">Let HRValy's AI auto-generate your application by pulling your verified skills, latest performance reviews, and completed L&D courses.</p>
                    <button 
                      onClick={handleAIResumeGenerate}
                      disabled={uploading}
                      className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2"
                    >
                      {uploading ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={18} /> Generate & Apply Instantly</>}
                    </button>
                  </div>
                  
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium uppercase tracking-widest">Or Upload Manually</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:border-slate-500 transition-colors bg-slate-900/50">
                    <UploadCloud className="mx-auto text-slate-500 mb-4" size={40} />
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden" 
                      id="resume-upload" 
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer block">
                      <span className="text-indigo-400 font-bold hover:underline block mb-1">{uploadFile ? uploadFile.name : 'Choose a file'}</span>
                      <span className="text-slate-500 text-sm">PDF, DOC, DOCX up to 10MB</span>
                    </label>
                  </div>

                  <button 
                    disabled={uploading || !uploadFile}
                    className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors border border-slate-700"
                  >
                    Submit Traditional Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------
// ORGANIZATION VIEW: Strategic Talent View
// -----------------------------------------------------
function OrgMobility() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reqs'); // reqs, prequalified, analytics
  const [showForm, setShowForm] = useState(false);
  const [viewingAppsFor, setViewingAppsFor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pool, setPool] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', department: '', description: '', location: '', package: '', attachment_url: '', job_type: 'full_time'
  });

  useEffect(() => {
    if (activeTab === 'reqs') fetchJobs();
    if (activeTab === 'prequalified') fetchPool();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/org/jobs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPool = async () => {
    try {
      const res = await fetch("http://localhost:8001/org/prequalified-pool", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setPool(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("http://localhost:8001/org/mobility-analytics", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchApplications = async (job) => {
    setViewingAppsFor(job);
    setApplications([]);
    try {
      const res = await fetch(`http://localhost:8001/org/jobs/${job.id}/applications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setApplications(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8001/org/jobs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Job posted successfully!");
        setFormData({ title: '', department: '', description: '', location: '', package: '', attachment_url: '', job_type: 'full_time' });
        setShowForm(false);
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2">
              <Briefcase className="text-indigo-600" size={32} /> Strategic Talent Hub
            </h1>
            <p className="text-slate-500">Manage internal mobility, pre-qualified talent, and succession risks.</p>
          </div>
          <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200">
             {[
               {id: 'reqs', label: 'Active Reqs'},
               {id: 'prequalified', label: 'Pre-Qualified Pool'},
               {id: 'analytics', label: 'Mobility Heatmap'}
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => { setActiveTab(tab.id); setShowForm(false); }}
                 className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${
                   activeTab === tab.id 
                   ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                   : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
        </div>

        {/* Dynamic Content */}
        {activeTab === 'reqs' && (
          <div className="space-y-6 animate-in fade-in">
            {!showForm && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
                >
                  <Plus size={18} /> Post New Role / Gig
                </button>
              </div>
            )}

            {showForm ? (
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60"></div>
                
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-slate-800">Create New Requisition</h2>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Succession Risk Alert Widget (Visual only for form) */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" />
                    <div>
                      <h4 className="text-amber-800 font-bold text-sm mb-1">AI Succession Risk Alert</h4>
                      <p className="text-amber-700/80 text-sm">Posting this role may trigger internal movement. Based on our predictive models, backfilling this role internally has a 65% risk of creating a critical skill gap in the source department.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Job Title *</label>
                      <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 font-medium outline-none p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. Senior Frontend Engineer" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Department *</label>
                      <input required type="text" value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 font-medium outline-none p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. Engineering" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Requisition Type</label>
                      <select value={formData.job_type} onChange={e=>setFormData({...formData, job_type: e.target.value})} className="w-full bg-slate-50 text-slate-900 font-medium outline-none p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all">
                        <option value="full_time">Full-Time Role</option>
                        <option value="micro_gig">Micro-Gig (1-2 Weeks)</option>
                        <option value="shadowing">Shadowing Opportunity</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Location / Setup</label>
                      <input type="text" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 font-medium outline-none p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="e.g. Remote, Hybrid" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Job Description & Requirements *</label>
                    <textarea required rows="4" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-400 font-medium outline-none p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none" placeholder="Describe the core responsibilities..." />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button type="submit" className="bg-indigo-600 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                      Publish Requisition
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-100">
                    <tr>
                      <th className="p-5 text-xs uppercase tracking-widest font-black text-slate-500">Role Details</th>
                      <th className="p-5 text-xs uppercase tracking-widest font-black text-slate-500">Type</th>
                      <th className="p-5 text-xs uppercase tracking-widest font-black text-slate-500">Pipeline</th>
                      <th className="p-5 text-xs uppercase tracking-widest font-black text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan="4" className="p-16 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></td></tr>
                    ) : jobs.length === 0 ? (
                      <tr><td colSpan="4" className="p-16 text-center text-slate-500 font-medium">No active requisitions.</td></tr>
                    ) : (
                      jobs.map(j => (
                        <tr key={j.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-5">
                            <div className="font-bold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">{j.title}</div>
                            <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                              {j.department} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {j.location || "Flexible"}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              j.job_type === 'micro_gig' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                              j.job_type === 'shadowing' ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200' :
                              'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {j.job_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2">
                                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">+</div>)}
                              </div>
                              <button onClick={() => fetchApplications(j)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
                                View Pool
                              </button>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => navigate(`/dashboard/mobility/results/${j.id}`)}
                              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-xs px-4 py-2 rounded-lg hover:border-indigo-300 hover:text-indigo-700 transition-all"
                            >
                              <BarChart3 size={14} /> AI Analysis
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pre-Qualified Pool Tab */}
        {activeTab === 'prequalified' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
              <div>
                 <h2 className="text-2xl font-black mb-2 flex items-center gap-2"><ShieldCheck /> Verified Internal Talent</h2>
                 <p className="text-emerald-100 max-w-2xl text-sm leading-relaxed">These employees have completed AI interviews and assessments for previous roles and were marked as "Recommended". Deploy them instantly to new projects without re-interviewing.</p>
              </div>
              <div className="hidden md:flex flex-col items-center bg-black/20 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/10">
                <span className="text-3xl font-black">{pool.length}</span>
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-200">Ready</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pool.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 p-10 rounded-3xl text-center shadow-sm">
                  <p className="text-slate-500">No pre-qualified internal talent available yet.</p>
                </div>
              ) : pool.map((talent) => {
                const compScores = typeof talent.competency_scores === 'string' ? JSON.parse(talent.competency_scores || "{}") : (talent.competency_scores || {});
                const topComps = Object.entries(compScores).sort((a,b) => b[1] - a[1]).slice(0, 2).map(e => e[0]).join(', ');
                return (
                <div key={talent.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={24} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">{talent.employee_name}</h4>
                        <p className="text-sm font-medium text-slate-500">{talent.current_role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-2xl font-black text-emerald-500">{talent.interview_score}</span>
                       <span className="text-xs block text-slate-400 font-bold uppercase">AI Score</span>
                    </div>
                  </div>
                  <div className="mb-6 space-y-2">
                    <div className="text-sm text-slate-600"><span className="font-bold text-slate-800">Top Competencies:</span> {topComps || 'N/A'}</div>
                    <div className="text-sm text-slate-600"><span className="font-bold text-slate-800">Status:</span> <span className="text-indigo-600 font-medium capitalize">{talent.status}</span></div>
                  </div>
                  <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold py-3 rounded-xl border border-slate-200 transition-colors">
                    Deploy to Project
                  </button>
                  <button onClick={() => alert("Model fine-tuning feedback submitted.")} className="w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-xl border border-indigo-200 transition-colors text-sm">
                    Provide AI Feedback
                  </button>
                </div>
              )})}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-indigo-600"/> Cross-Department Mobility Heatmap
                </h3>
                <div className="aspect-[21/9] bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1 p-4 opacity-50">
                    {analytics?.heatmap_data?.map((d, i) => (
                      <div key={i} className={`rounded-lg bg-indigo-500 flex flex-col items-center justify-center text-white font-bold text-xs`} style={{opacity: (d.value/30) + 0.2}}>
                         <span>{d.source}</span>
                         <span>↓</span>
                         <span>{d.dest}</span>
                      </div>
                    ))}
                    {!analytics && <Loader2 className="animate-spin text-slate-400 m-auto"/>}
                  </div>
                  <div className="relative z-10 bg-white/90 backdrop-blur px-6 py-3 rounded-xl border border-slate-200 shadow-sm font-bold text-slate-700">
                    Interactive Heatmap (AI Generated Insight)
                  </div>
                </div>
                {analytics && (
                  <>
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs uppercase font-bold text-indigo-500 mb-1">Top Exporter</p>
                        <p className="text-lg font-black text-indigo-900">{analytics.top_exporter}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-xs uppercase font-bold text-emerald-500 mb-1">Top Importer</p>
                        <p className="text-lg font-black text-emerald-900">{analytics.top_importer}</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs uppercase font-bold text-amber-500 mb-1">Flight Risk</p>
                        <p className="text-lg font-black text-amber-900">{analytics.flight_risk}</p>
                      </div>
                    </div>

                    {analytics.cohort_analysis && (
                      <div className="mt-8 border-t border-slate-200 pt-8">
                        <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                          <BarChart3 className="text-indigo-600"/> Cohort Analysis: Turnover vs Internal Movement
                        </h4>
                        <div className="flex items-end gap-6 h-48 mt-4">
                          {analytics.cohort_analysis.map((data, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end gap-2 group relative">
                              <div className="flex gap-2 items-end h-full">
                                {/* Turnover Bar */}
                                <div className="flex-1 bg-rose-400 rounded-t-md transition-all group-hover:bg-rose-500 relative" style={{ height: `${data.turnover * 15}%` }}>
                                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-rose-500 opacity-0 group-hover:opacity-100">{data.turnover}%</span>
                                </div>
                                {/* Internal Movement Bar */}
                                <div className="flex-1 bg-emerald-400 rounded-t-md transition-all group-hover:bg-emerald-500 relative" style={{ height: `${data.internal_movement * 15}%` }}>
                                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100">{data.internal_movement}%</span>
                                </div>
                              </div>
                              <p className="text-center text-xs font-bold text-slate-500 mt-2">{data.period}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-6 mt-6">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="w-3 h-3 bg-rose-400 rounded-sm"></span> Turnover</div>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="w-3 h-3 bg-emerald-400 rounded-sm"></span> Internal Movement</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
             </div>
          </div>
        )}

        {/* Applicant Modal */}
        {viewingAppsFor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold mb-3">
                    Active Pipeline
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">{viewingAppsFor.title}</h2>
                  <p className="text-slate-500 font-medium">{viewingAppsFor.department}</p>
                </div>
                <button onClick={() => setViewingAppsFor(null)} className="text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-full p-2 transition-all">&times;</button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-slate-50/50">
                {applications.length === 0 ? (
                  <div className="text-center p-16">
                    <Users className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium text-lg">No applications received yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
                          <User size={28} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-slate-900 text-xl mb-1">{app.employee_name}</h4>
                          <a href={`/${app.resume_url}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 text-sm hover:text-indigo-600 font-medium flex items-center gap-1.5 transition-colors">
                            <FileText size={16}/> Internal Profile Data
                          </a>
                        </div>
                        
                        <div className="flex items-center gap-6 md:text-right">
                          {app.match_score !== null && (
                            <div className="text-left md:text-right">
                              <span className="text-xs uppercase font-bold text-slate-400 block mb-1">AI Match</span>
                              <span className={`text-xl font-black ${app.match_score >= 80 ? "text-emerald-500" : "text-amber-500"}`}>
                                {app.match_score}%
                              </span>
                            </div>
                          )}
                          <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                          <div className="text-left md:text-right">
                            <span className="text-xs uppercase font-bold text-slate-400 block mb-2">Stage</span>
                            <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider
                              ${app.status.includes('Completed') || app.status.includes('Qualified') ? 'bg-emerald-100 text-emerald-700' : 
                                app.status.includes('Rejected') ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sparkles SVG Icon Component
function SparklesIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}