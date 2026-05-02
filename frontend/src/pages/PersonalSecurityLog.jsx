import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, User, Laptop, History, LogOut, CheckCircle2, Clock, AlertTriangle, FileKey } from 'lucide-react';

export default function PersonalSecurityLog() {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSecurityLog();
  }, [token]);

  const fetchSecurityLog = async () => {
    try {
      const res = await fetch("http://localhost:8001/employee/security-log", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityData(data);
      } else {
        setError("Failed to load security log.");
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const killSession = async (sessionToken) => {
    try {
      const res = await fetch("http://localhost:8001/employee/kill-session", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ session_token: sessionToken })
      });
      if (res.ok) {
        fetchSecurityLog();
      }
    } catch (err) {
      console.error("Error killing session", err);
    }
  };

  if (loading) return (
    <div className="p-10 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center text-red-500 font-bold">{error}</div>
  );

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Health Score */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600" /> Personal Security Log
            </h1>
            <p className="text-slate-500 mt-2">Zero-trust transparency for your data privacy.</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${securityData.security_health_score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {securityData.security_health_score}
                </span>
                <span className="text-slate-400 font-medium">/100</span>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-100"></div>
            <div>
              {securityData.security_health_score === 100 ? (
                <div className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 px-4 py-2 rounded-xl">
                  <CheckCircle2 size={18} /> Excellent Security Posture
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-xl">
                  <AlertTriangle size={18} /> Action Recommended
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Active Sessions */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-900 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Laptop size={20} className="text-indigo-400" /> Active Session Control
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {securityData.active_sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No active sessions found.</div>
              ) : (
                securityData.active_sessions.map((session, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-bold text-slate-800">{session.device}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User size={12}/> {session.ip}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">{session.location}</span>
                        <span>•</span>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px]">{session.token_prefix}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => killSession(session.token_prefix)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors tooltip" title="Kill Session"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Access Notifications */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-900 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileKey size={20} className="text-emerald-400" /> Data Access Notifications
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {securityData.data_access_notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No sensitive data accessed recently.</div>
              ) : (
                securityData.data_access_notifications.map((access, idx) => (
                  <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">
                          {access.viewer_name} <span className="text-slate-400 font-normal text-sm">({access.viewer_role})</span>
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          Accessed your <span className="font-bold text-indigo-600">{access.data_field}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-2 bg-slate-100 inline-block px-2 py-1 rounded">
                          Reason: {access.reason || "Standard operational review"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400">{new Date(access.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Privacy & Consent Status */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <History size={24} className="text-blue-500" /> Privacy Requests & Consent Log
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Privacy Requests */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">GDPR / IT Act Requests</h3>
                {securityData.privacy_requests.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No active privacy requests.</p>
                ) : (
                  <div className="space-y-4">
                    {securityData.privacy_requests.map((req, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-800 capitalize">{req.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button className="mt-4 text-sm font-bold text-indigo-600 hover:text-indigo-800">
                  + File New Privacy Request
                </button>
              </div>

              {/* Consent History */}
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Consent History</h3>
                {securityData.consent_history.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No consent records found.</p>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {securityData.consent_history.map((consent, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        {consent.action === 'granted' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={16} />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <LogOut size={16} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-800 capitalize">{consent.type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-500">
                            {consent.action.toUpperCase()} on {new Date(consent.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
