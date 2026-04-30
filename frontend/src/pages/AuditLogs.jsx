import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Loader2, Inbox } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:8001/audit/logs", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [token]);

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <ShieldCheck className="text-indigo-600" /> Security Audit Trail
        </h1>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="p-6">Administrator</th>
                <th className="p-6">Action</th>
                <th className="p-6">Target Resource</th>
                <th className="p-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-500">No audit logs recorded yet</p>
                    <p className="text-sm">Actions will appear here as users interact with the platform.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6 flex items-center gap-3">
                      <User size={16} className="text-slate-400" />
                      <span className="font-bold text-slate-700">{log.user}</span>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-6 text-slate-500 font-medium">{log.target}</td>
                    <td className="p-6 text-right text-slate-400 font-mono text-xs">{log.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}