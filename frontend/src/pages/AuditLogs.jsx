import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Loader2, Inbox, AlertTriangle, Fingerprint, MapPin, Database, ServerCrash, CheckCircle2, FileJson } from 'lucide-react';

export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [integrityData, setIntegrityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchIntelligence();
  }, [token]);

  const fetchIntelligence = async () => {
    try {
      const res = await fetch("http://localhost:8001/organization/threat-intelligence", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch threat intelligence:", err);
    }
    setLoading(false);
  };

  const runIntegrityCheck = async () => {
    setCheckingIntegrity(true);
    try {
      const res = await fetch("http://localhost:8001/audit/integrity-check", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setIntegrityData(json);
      }
    } catch (err) {
      console.error("Integrity check failed:", err);
    }
    setCheckingIntegrity(false);
  };

  if (loading || !data) return (
    <div className="p-10 flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Running AI Threat Analysis...</p>
      </div>
    </div>
  );

  const intel = data.intelligence || {};
  const logs = data.granular_logs || [];

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Threat Score */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600" /> Enterprise Threat Intelligence
            </h1>
            <p className="text-slate-500 mt-2">Zero-trust security telemetry & immutable audit validation.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Threat Score</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${
                    intel.threat_score > 70 ? 'text-red-500' :
                    intel.threat_score > 30 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {intel.threat_score}
                  </span>
                  <span className="text-slate-400 font-medium">/100</span>
                </div>
              </div>
              <div className="h-12 w-px bg-slate-100"></div>
              <div>
                <div className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl ${
                  intel.threat_score > 70 ? 'bg-red-50 text-red-600' :
                  intel.threat_score > 30 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <AlertTriangle size={18} /> {intel.threat_level || 'Low'} Risk
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-indigo-900 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
          <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">AI Security Brief</h2>
          <p className="text-2xl font-medium leading-relaxed max-w-4xl">
            "{intel.summary}"
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Integrity Check */}
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-2">
                <Fingerprint className="text-blue-500" /> Immutable Integrity
              </h2>
              <p className="text-sm text-slate-500 mb-6">Verify cryptographic hash chains for all audit logs to detect tampering.</p>
              
              {integrityData ? (
                <div className={`p-6 rounded-2xl border ${
                  integrityData.integrity_status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {integrityData.integrity_status === 'VERIFIED' ? (
                      <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                    ) : (
                      <ServerCrash className="text-red-600 w-8 h-8" />
                    )}
                    <div>
                      <h3 className={`font-black ${integrityData.integrity_status === 'VERIFIED' ? 'text-emerald-900' : 'text-red-900'}`}>
                        {integrityData.integrity_status}
                      </h3>
                      <p className={`text-xs font-medium ${integrityData.integrity_status === 'VERIFIED' ? 'text-emerald-600' : 'text-red-600'}`}>
                        Confidence: {integrityData.confidence}%
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{integrityData.verdict}</p>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                  <Fingerprint className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium mb-4">Ledger unchecked in this session.</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={runIntegrityCheck}
              disabled={checkingIntegrity}
              className="mt-6 w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checkingIntegrity ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              Run Blockchain Verification
            </button>
          </div>

          {/* AI Threat Detections */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Geo Anomalies */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-amber-50">
                <h3 className="font-bold text-amber-900 flex items-center gap-2">
                  <MapPin size={18} className="text-amber-600" /> IP/Geo Anomalies
                </h3>
              </div>
              <div className="p-5 space-y-4 max-h-64 overflow-y-auto">
                {(!intel.geo_anomalies || intel.geo_anomalies.length === 0) ? (
                  <p className="text-sm text-slate-400 text-center py-4">No unusual locations detected.</p>
                ) : (
                  intel.geo_anomalies.map((anom, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="font-bold text-slate-800 text-sm truncate">{anom.admin}</p>
                      <p className="text-xs text-slate-500 mt-1">IP: {anom.ip} ({anom.location})</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded">Risk: {anom.risk}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin Overlap */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-indigo-50">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                  <Database size={18} className="text-indigo-600" /> Admin Overlap Risk
                </h3>
              </div>
              <div className="p-5 space-y-4 max-h-64 overflow-y-auto">
                {(!intel.admin_overlap || intel.admin_overlap.length === 0) ? (
                  <p className="text-sm text-slate-400 text-center py-4">No coordinated access detected.</p>
                ) : (
                  intel.admin_overlap.map((overlap, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="font-bold text-slate-800 text-sm">Target: {overlap.resource}</p>
                      <p className="text-xs text-slate-500 mt-1">Admins: {overlap.admins?.join(', ')}</p>
                      <p className="text-xs text-slate-500">Window: {overlap.window_minutes} mins</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase rounded">Risk: {overlap.risk}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Granular Audit Logs Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-100 bg-slate-900 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileJson size={20} className="text-slate-400" /> Granular Action Tracking
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <tr>
                  <th className="p-6">Administrator</th>
                  <th className="p-6">Action & Resource</th>
                  <th className="p-6">Delta (Prev &rarr; New)</th>
                  <th className="p-6">Integrity Hash</th>
                  <th className="p-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-slate-400">
                      <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                      <p className="font-bold">No granular logs found</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 flex items-center gap-3">
                        <User size={16} className="text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-700">{log.admin}</p>
                          <p className="text-xs text-slate-400">{log.ip} {log.location ? `(${log.location})` : ''}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">
                          {log.action}
                        </span>
                        <p className="text-xs text-slate-500 mt-2 font-medium">[{log.target_resource}]</p>
                      </td>
                      <td className="p-6">
                        {log.previous_value || log.new_value ? (
                          <div className="flex flex-col gap-1 max-w-xs overflow-hidden">
                            {log.previous_value && <span className="text-xs text-red-500 line-through truncate">{log.previous_value}</span>}
                            {log.new_value && <span className="text-xs text-emerald-600 truncate font-mono bg-emerald-50 px-2 py-0.5 rounded">{log.new_value}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">No delta payload</span>
                        )}
                      </td>
                      <td className="p-6">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded truncate max-w-[100px] block" title={log.hash}>
                          {log.hash ? log.hash.substring(0, 16) + '...' : 'UNHASHED'}
                        </span>
                      </td>
                      <td className="p-6 text-right text-slate-400 font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}