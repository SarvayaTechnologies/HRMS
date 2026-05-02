import React, { useState, useEffect } from 'react';
import { Briefcase, Inbox, MapPin, DollarSign, Building2, FileText, Plus, Loader2, UploadCloud, CheckCircle2, User, Mic, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function InternalMobility() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'employee' ? <EmployeeMobility /> : <OrgMobility />;
}

// -----------------------------------------------------
// EMPLOYEE VIEW
// -----------------------------------------------------
function EmployeeMobility() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchJobs();
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

  const handleUploadSubmit = async () => {
    if (!uploadFile) return alert("Please select a file first.");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await fetch(`http://localhost:8001/employee/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setAppStatus({
          applied: true,
          status: data.status,
          match_score: data.score
        });

        if (data.score >= 70 || data.status.includes('qualified')) {
          alert("Success! Your profile matches our requirements. Please close this modal and click on 'AI Interview' in the sidebar to start your session.");
        }
      } else {
        alert(data.detail || "Failed to apply");
      }
    } catch (e) {
      alert("Error applying");
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
        const data = await res.json();
        setAppStatus({ ...appStatus, status: data.status });
        // NOTE: In a real app we'd redirect to an interview room here
        alert("Redirecting to AI Voice Interview... (Implementation placeholder)");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-10 bg-[#050505] min-h-screen text-white">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-2">Internal Career Marketplace</h1>
          <p className="text-slate-400">Discover your next opportunity within the organization.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
        ) : jobs.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-12 text-center shadow-xl">
            <Inbox className="mx-auto text-slate-600 mb-4" size={48} />
            <h3 className="font-bold text-white text-xl mb-2">No Open Positions</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your organization has not posted any internal roles yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map(job => (
              <div key={job.id} className="bg-[#111] border border-white/5 rounded-3xl p-6 hover:border-emerald-500/30 hover:-translate-y-1 transition-all shadow-xl group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-400 text-sm">
                      <Building2 size={16} /> {job.department}
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/50">OPEN</span>
                </div>
                
                <p className="text-slate-300 text-sm mb-6 line-clamp-3 leading-relaxed">{job.description}</p>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {job.location && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-white/5 px-3 py-1.5 rounded-lg text-slate-300 border border-white/10">
                      <MapPin size={14} /> {job.location}
                    </span>
                  )}
                  {job.package && (
                    <span className="flex items-center gap-1 text-xs font-medium bg-emerald-500/5 px-3 py-1.5 rounded-lg text-emerald-400 border border-emerald-500/20">
                      <DollarSign size={14} /> {job.package}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <div className="text-xs text-slate-500">Posted on: {job.posted_at ? job.posted_at.split('T')[0] : 'N/A'}</div>
                  <button onClick={() => handleApplyClick(job)} className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    Apply Now &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedJob && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-xl p-8 relative shadow-2xl">
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >&times; Close</button>
              
              <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
              <p className="text-slate-400 text-sm mb-8">{selectedJob.department} &bull; {selectedJob.location}</p>

              {statusLoading ? (
                <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
              ) : appStatus ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="inline-flex bg-emerald-500/20 text-emerald-400 p-4 rounded-full mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Application Submitted!</h3>
                  <div className="text-slate-400 text-sm mb-6 space-y-2">
                    <p>Current Status: <span className="text-white font-semibold">{appStatus.status}</span></p>
                    {appStatus.match_score !== null && (
                      <p>AI Parsing Match Score: <span className="text-emerald-400 font-bold">{appStatus.match_score}/100</span></p>
                    )}
                  </div>
                  
                  {appStatus.status === "Qualified for AI Interview" && (
                    <button 
                      onClick={startInterview}
                      className="bg-emerald-500 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-400 w-full flex items-center justify-center gap-2"
                    >
                      <Mic size={18} /> Start AI Voice Interview
                    </button>
                  )}
                  {appStatus.status === "AI Interview In Progress" && (
                     <div className="bg-indigo-500/20 text-indigo-300 p-4 rounded-xl border border-indigo-500/50 text-sm">
                       Your AI voice interview is active. Please complete it to finish your application.
                     </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-emerald-100/80 text-sm leading-relaxed">
                    <p className="mb-2"><strong className="text-emerald-400">Step 1:</strong> Upload your updated Resume (PDF/Word). Our AI Parser will immediately evaluate your profile against the job description.</p>
                    <p><strong className="text-emerald-400">Step 2:</strong> If qualified, you will be directed to an automated AI Voice Interview.</p>
                  </div>
                  
                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center hover:border-emerald-500/40 transition-colors">
                    <UploadCloud className="mx-auto text-emerald-500/60 mb-4" size={40} />
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden" 
                      id="resume-upload" 
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      <span className="text-emerald-400 font-bold hover:underline">{uploadFile ? uploadFile.name : 'Click to select a file'}</span>
                      {!uploadFile && <span className="text-slate-400 block mt-1 text-sm">or drag and drop here</span>}
                    </label>
                  </div>

                  <button 
                    onClick={handleUploadSubmit}
                    disabled={uploading || !uploadFile}
                    className="w-full bg-emerald-500 text-slate-900 font-bold py-4 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : "Submit Application & Run AI Parser"}
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
// ORGANIZATION VIEW
// -----------------------------------------------------
function OrgMobility() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingAppsFor, setViewingAppsFor] = useState(null);
  const [applications, setApplications] = useState([]);
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', department: '', description: '', location: '', package: '', attachment_url: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
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
        setFormData({ title: '', department: '', description: '', location: '', package: '', attachment_url: '' });
        setShowForm(false);
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Briefcase className="text-indigo-600" /> Internal Jobs Dashboard
            </h1>
            <p className="text-slate-500 mt-2">Manage open roles for your employees.</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            {showForm ? <Inbox size={18} /> : <Plus size={18} />}
            {showForm ? "View All Jobs" : "Post New Role"}
          </button>
        </div>

        {showForm ? (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Requisition</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Job Title *</label>
                  <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-500 outline-none p-4 rounded-xl border border-slate-200 focus:border-indigo-500" placeholder="e.g. Senior Frontend Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                  <input required type="text" value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-500 outline-none p-4 rounded-xl border border-slate-200 focus:border-indigo-500" placeholder="e.g. Engineering" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <input type="text" value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-500 outline-none p-4 rounded-xl border border-slate-200 focus:border-indigo-500" placeholder="e.g. Remote, NY Office" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Compensation Package</label>
                  <input type="text" value={formData.package} onChange={e=>setFormData({...formData, package: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-500 outline-none p-4 rounded-xl border border-slate-200 focus:border-indigo-500" placeholder="e.g. $120k - $150k + Equity" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Job Description *</label>
                <textarea required rows="5" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-500 outline-none p-4 rounded-xl border border-slate-200 focus:border-indigo-500 resize-none" placeholder="Describe the responsibilities, requirements, and benefits..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Attachment / Resource Link (Optional)</label>
                <div className="flex items-center relative">
                  <FileText className="absolute left-4 text-slate-400" size={18} />
                  <input type="text" value={formData.attachment_url} onChange={e=>setFormData({...formData, attachment_url: e.target.value})} className="w-full bg-slate-50 text-slate-900 placeholder:text-slate-500 outline-none p-4 pl-12 rounded-xl border border-slate-200 focus:border-indigo-500" placeholder="https://link-to-JD.pdf" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700">
                  Publish to Internal Marketplace
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-6">Role</th>
                  <th className="p-6">Location</th>
                  <th className="p-6">Package</th>
                  <th className="p-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></td></tr>
                ) : jobs.length === 0 ? (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-500">No active job postings.</td></tr>
                ) : (
                  jobs.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50 border-slate-100">
                      <td className="p-6">
                        <div className="font-bold text-slate-800">{j.title}</div>
                        <div className="text-xs font-semibold text-slate-500">{j.department}</div>
                      </td>
                      <td className="p-6 text-sm text-slate-600">{j.location || "N/A"}</td>
                      <td className="p-6 text-sm text-slate-600 font-medium">{j.package || "N/A"}</td>
                      <td className="p-6 text-right space-x-3">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-bold text-[10px] px-3 py-1 rounded-md">
                          {j.status}
                        </span>
                        <button 
                          onClick={() => fetchApplications(j)}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          View Applicants
                        </button>
                        <button 
                          onClick={() => navigate(`/dashboard/mobility/results/${j.id}`)}
                          className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <BarChart3 size={12} /> AI Results
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {viewingAppsFor && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Applicants: {viewingAppsFor.title}</h2>
                  <p className="text-sm text-slate-500">{viewingAppsFor.department}</p>
                </div>
                <button onClick={() => setViewingAppsFor(null)} className="text-slate-400 hover:text-slate-800 font-bold">&times; Close</button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {applications.length === 0 ? (
                  <div className="text-center p-10 text-slate-500">No applications received yet.</div>
                ) : (
                  <div className="space-y-4">
                    {applications.map(app => (
                      <div key={app.id} className="border border-slate-100 bg-white rounded-2xl p-5 flex items-center shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl mr-5">
                          <User size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 text-lg">{app.employee_name}</h4>
                          <a href={`/${app.resume_url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-500 text-sm hover:underline font-medium block mt-1 flex items-center gap-1">
                            <FileText size={14}/> View Resume ({app.resume_url})
                          </a>
                        </div>
                        
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase
                            ${app.status.includes('Completed') || app.status.includes('Qualified') ? 'bg-emerald-100 text-emerald-700' : 
                              app.status.includes('Rejected') ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {app.status}
                          </span>
                          {app.match_score !== null && (
                            <span className="text-slate-500 text-sm font-semibold">
                              AI Match: <span className={app.match_score >= 70 ? "text-emerald-600" : "text-amber-600"}>{app.match_score}%</span>
                            </span>
                          )}
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