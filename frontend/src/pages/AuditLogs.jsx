import React, { useState } from 'react';
import { ShieldCheck, History, User } from 'lucide-react';

export default function AuditLogs() {
  const [logs] = useState([
    { id: 1, user: "admin@hrvaly.com", action: "VIEW_RADAR", target: "Engineering", time: "2026-04-24 14:05" },
    { id: 2, user: "manager@hrvaly.com", action: "APPROVE_LEAVE", target: "EMP-102", time: "2026-04-24 13:40" },
    { id: 3, user: "admin@hrvaly.com", action: "GENERATE_PAYROLL", target: "EMP-001", time: "2026-04-24 12:15" },
  ]);

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
              {logs.map((log) => (
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
                  <td className="p-6 text-right text-slate-400 font-mono text-xs">
                    {log.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}