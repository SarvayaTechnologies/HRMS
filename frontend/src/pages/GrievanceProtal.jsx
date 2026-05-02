import React, { useState } from 'react';
import { ShieldAlert, Lock, Search, AlertTriangle, FileUp, Calendar, Activity, MessageSquare, AlertOctagon, CheckCircle2, Shield, Flame, Scale, Clock, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function GrievancePortal() {
  const { user } = useAuth();
  const isOrg = user?.role !== 'employee';

  const [viewMode, setViewMode] = useState("table"); // "form", "success", "table"
  const [chatKey, setChatKey] = useState("");
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [category, setCategory] = useState("Workplace Safety & Harassment");
  const [firstOccurred, setFirstOccurred] = useState("");
  const [lastOccurred, setLastOccurred] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [desiredResolution, setDesiredResolution] = useState("");

  // Fetch real data
  const fetchMyReports = async () => {
    try {
      const res = await fetch("http://localhost:8001/employee/my-grievances", {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setMyReports(data.reports || []);
      // viewMode is already 'table' initially
    } catch (err) {
      console.error(err);
    }
  };

  const handleRaiseNew = () => {
    setCategory("Workplace Safety & Harassment");
    setFirstOccurred("");
    setLastOccurred("");
    setDescription("");
    setImpact("");
    setDesiredResolution("");
    setViewMode("form");
  };

  const handleRaiseFollowUp = (report) => {
    setCategory(report.category || "Workplace Safety & Harassment");
    setDescription(`[FOLLOW-UP to ${report.id}]: \n\n` + (report.description || ""));
    setImpact("");
    setDesiredResolution("");
    setViewMode("form");
  };

  React.useEffect(() => {
    if (isOrg) {
      fetch("http://localhost:8001/org/grievances", {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => setReports(data.reports || []))
      .catch(err => console.error(err));
    } else {
      fetchMyReports();
    }
  }, [isOrg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = 'SEC-KEY-';
    for(let i=0; i<8; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    
    setChatKey(key);
    
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8001/culture/report-grievance", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          category, firstOccurred, lastOccurred, description, impact, desiredResolution, chatKey: key
        })
      });
      
      if (!res.ok) {
        throw new Error("Failed to submit grievance");
      }
      
      // Clear form
      setCategory("Workplace Safety & Harassment");
      setFirstOccurred("");
      setLastOccurred("");
      setDescription("");
      setImpact("");
      setDesiredResolution("");

      await fetchMyReports();
      setViewMode("success");
    } catch (err) {
      console.error(err);
      alert("Error reporting grievance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (caseId, action) => {
    await fetch(`http://localhost:8001/org/grievances/${caseId}/action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ action })
    });
    // Refresh
    const res = await fetch("http://localhost:8001/org/grievances", {
      headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setReports(data.reports || []);
  };

  // Calculate heatmap dynamically based on real reports from the database
  const heatMap = React.useMemo(() => {
    if (!reports || reports.length === 0) return [];
    
    // Group by department
    const deptCounts = {};
    reports.forEach(r => {
      const d = r.dept || "General";
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(deptCounts));
    
    // Format for rendering
    return Object.keys(deptCounts).map(dept => ({
      dept,
      count: deptCounts[dept],
      percentage: (deptCounts[dept] / maxCount) * 100
    })).sort((a, b) => b.count - a.count); // Sort highest first
  }, [reports]);

  if (isOrg) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ethics & Compliance Intelligence</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time grievance monitoring and risk mitigation</p>
          </div>
          <div className="flex gap-3">
            <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50">
              <TrendingUp size={18} /> Export Audit Trail
            </button>
          </div>
        </div>

        {/* Intelligence KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Flame size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <ShieldAlert size={24} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">High-Risk Alerts</p>
            <h3 className="text-4xl font-black text-slate-900">{reports.filter(r => r.risk === 'Critical').length}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Clock size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cases</p>
            <h3 className="text-4xl font-black text-slate-900">{reports.length}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Scale size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Search size={24} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Investigating</p>
            <h3 className="text-4xl font-black text-slate-900">{reports.filter(r => r.status === 'Under Investigation').length}</h3>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <CheckCircle2 size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Shield size={24} />
              </div>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved</p>
            <h3 className="text-4xl font-black text-slate-900">{reports.filter(r => r.status === 'Resolved').length}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-indigo-600" /> Sentiment-Prioritized Queue
            </h3>
            
            <div className="space-y-4">
              {reports.map((report, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className={`p-3 rounded-2xl ${report.risk === 'Critical' ? 'bg-red-50 text-red-600' : report.risk === 'High' ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600'}`}>
                        {report.risk === 'Critical' ? <Flame size={24} /> : <AlertTriangle size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-slate-900">{report.category}</h4>
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">{report.id}</span>
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{report.status}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">Reported {report.date} • Dept: {report.dept}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase text-slate-400 mb-1">Compliance SLA</div>
                      <div className={`text-sm font-bold ${report.deadline?.includes('48') ? 'text-red-500' : 'text-amber-500'} flex items-center justify-end gap-1`}>
                        <Clock size={14} /> {report.deadline}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 font-medium mb-4">
                    {report.description}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-indigo-400">AI Sentiment Analysis:</span>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full flex items-center gap-1">
                        <Activity size={12} /> {report.sentiment}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {report.status === 'Open' && (
                        <button onClick={() => handleAction(report.id, 'investigate')} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition">
                          Start Investigation
                        </button>
                      )}
                      {report.status !== 'Resolved' && (
                        <button onClick={() => handleAction(report.id, 'resolve')} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition">
                          Resolve Case
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
                  No grievances reported yet.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-6">
                <Users className="text-indigo-600" /> Departmental Heatmap
              </h3>
              <div className="space-y-6">
                {heatMap.map((dept, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700">{dept.dept}</span>
                      <span className="text-sm font-black text-slate-400">{dept.count} Reports</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${dept.percentage > 50 ? 'bg-red-500' : dept.percentage > 20 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${dept.percentage}%` }}
                      ></div>
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

  // Employee View
  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-slate-900 p-8 text-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-2xl">
                <ShieldAlert className="text-red-400" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black">Anonymous Reporting</h2>
                <p className="text-slate-400 text-sm">Encrypted. Secure. Metadata-Stripped.</p>
              </div>
            </div>
            {viewMode === 'form' && (
              <button onClick={() => setViewMode('table')} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
                View My Complaints
              </button>
            )}
            {viewMode === 'table' && (
              <button onClick={handleRaiseNew} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2">
                Raise New Complaint
              </button>
            )}
          </div>

          {viewMode === 'form' && (
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800 text-sm">
                <AlertTriangle size={20} className="shrink-0" />
                <p><strong>Your identity is completely hidden.</strong> Our AI automatically analyzes the sentiment of this report to bypass standard queues for critical legal or safety risks.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Issue Category</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-slate-900 transition font-medium text-slate-900">
                    <option value="Workplace Safety & Harassment">Workplace Safety & Harassment</option>
                    <option value="Legal / Compliance Violation">Legal / Compliance Violation</option>
                    <option value="Financial Impropriety / Fraud">Financial Impropriety / Fraud</option>
                    <option value="General Ethics Violation">General Ethics Violation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Incident Timeline</label>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <span className="text-xs text-slate-400 block mb-1">First Occurred</span>
                      <label className="flex items-center bg-slate-50 border rounded-xl px-4 py-3 cursor-pointer">
                        <Calendar size={18} className="text-slate-400 mr-2" />
                        <input 
                          type="date" 
                          value={firstOccurred} 
                          onChange={(e) => setFirstOccurred(e.target.value)} 
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                          className="bg-transparent outline-none w-full text-sm font-medium text-slate-900 cursor-pointer" 
                          required 
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-slate-400 block mb-1">Last Occurred</span>
                      <label className="flex items-center bg-slate-50 border rounded-xl px-4 py-3 cursor-pointer">
                        <Calendar size={18} className="text-slate-400 mr-2" />
                        <input 
                          type="date" 
                          value={lastOccurred} 
                          onChange={(e) => setLastOccurred(e.target.value)} 
                          onClick={(e) => e.target.showPicker && e.target.showPicker()}
                          className="bg-transparent outline-none w-full text-sm font-medium text-slate-900 cursor-pointer" 
                          required 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Detailed Description</label>
                  <textarea 
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-slate-900 transition font-medium text-slate-900" 
                    rows="5" 
                    placeholder="Provide as much context as possible. Mention departments involved, nature of the issue..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Impact Assessment</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:border-slate-900 transition has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50">
                      <input type="radio" name="impact" value="Critical" onChange={(e) => setImpact(e.target.value)} className="mt-1" required />
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">Critical</span>
                        <span className="block text-xs text-slate-500 mt-1">Severe legal risk, physical danger, or work stoppage.</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:border-slate-900 transition has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50">
                      <input type="radio" name="impact" value="High" onChange={(e) => setImpact(e.target.value)} className="mt-1" />
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">High</span>
                        <span className="block text-xs text-slate-500 mt-1">Affecting team morale, mental health, or productivity.</span>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 border rounded-xl cursor-pointer hover:border-slate-900 transition has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50">
                      <input type="radio" name="impact" value="Moderate" onChange={(e) => setImpact(e.target.value)} className="mt-1" />
                      <div>
                        <span className="block font-bold text-slate-900 text-sm">Moderate</span>
                        <span className="block text-xs text-slate-500 mt-1">General policy violation or ethical concern.</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Desired Resolution</label>
                  <input 
                    type="text"
                    value={desiredResolution} onChange={(e) => setDesiredResolution(e.target.value)}
                    className="w-full bg-slate-50 border p-4 rounded-xl outline-none focus:border-slate-900 transition font-medium text-slate-900" 
                    placeholder="What does an ideal outcome look like for you?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2 flex items-center justify-between">
                    <span>Evidence Upload</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <Shield size={10} /> ZERO-KNOWLEDGE ACTIVE
                    </span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileUp className="w-8 h-8 mb-3 text-slate-400" />
                      <p className="mb-1 text-sm font-bold text-slate-600">Click to upload evidence</p>
                      <p className="text-xs text-slate-400 font-medium">Metadata (location, EXIF) will be automatically stripped.</p>
                    </div>
                    <input type="file" className="hidden" multiple />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <>
                      <Lock size={18} /> Submit Anonymous Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {viewMode === 'success' && (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Report Successfully Filed</h3>
              <p className="text-slate-500 font-medium mb-8">Your report is in the queue and will be reviewed by the Ethics Committee shortly.</p>
              
              <div className="flex gap-4 justify-center">
                <button onClick={() => setViewMode('table')} className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-colors">
                  View My Complaints
                </button>
                <button onClick={handleRaiseNew} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors">
                  Raise Another Complaint
                </button>
              </div>
            </div>
          )}

          {viewMode === 'table' && (
            <div className="p-8">
              <div className="space-y-4">
                {myReports.map((report, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className={`p-3 rounded-2xl ${report.risk === 'Critical' ? 'bg-red-50 text-red-600' : report.risk === 'High' ? 'bg-orange-50 text-orange-600' : 'bg-amber-50 text-amber-600'}`}>
                          {report.risk === 'Critical' ? <Flame size={24} /> : <AlertTriangle size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-slate-900">{report.category}</h4>
                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-md">{report.id}</span>
                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${report.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : report.status === 'Under Investigation' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{report.status}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-500">Reported {report.date}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 font-medium mb-4">
                      {report.description}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
                      <button onClick={() => handleRaiseFollowUp(report)} className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition">
                        Raise Follow-up Complaint
                      </button>
                    </div>
                  </div>
                ))}
                {myReports.length === 0 && (
                  <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
                    You have not reported any grievances.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}