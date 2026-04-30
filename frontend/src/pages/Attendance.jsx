import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Loader2, Inbox, ListChecks } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Attendance() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role !== 'employee' ? <OrgAttendance /> : <EmployeeAttendance />;
}

function EmployeeAttendance() {
  const [status, setStatus] = useState("Not Checked In");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("http://localhost:8001/attendance/my-records", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = data.find(r => r.date === today);
        if (todayRecord) {
          setStatus(todayRecord.check_out ? "Checked Out" : "Checked In");
        }
      }
    } catch (err) { console.error(err); }
  };

  const handlePunch = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch("http://localhost:8001/attendance/punch", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ lat: latitude, lon: longitude }),
        });
        const result = await res.json();
        if (res.ok) { setStatus(result.status); fetchRecords(); }
        else alert(result.detail);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
  };

  const statusBadge = (s) => (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
      ${s === 'approved' ? 'bg-emerald-100 text-emerald-700' :
        s === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
      {s}
    </span>
  );

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center mx-auto">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-emerald-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Daily Attendance</h2>
        <p className="text-slate-500 mb-8 font-medium">{status}</p>
        <button
          onClick={handlePunch}
          disabled={loading || status === "Checked Out"}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:bg-slate-400"
        >
          <MapPin size={20} />
          {loading ? "Recording..." : status === "Checked In" ? "Punch Out" : "Punch In Now"}
        </button>
        <p className="mt-6 text-xs text-slate-400 italic">* Your location is recorded only at the moment of punch.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">My Attendance History</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Punch In</th>
              <th className="p-4">Punch Out</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(r => (
              <tr key={r.id}>
                <td className="p-4 font-medium">{r.date || (r.check_in ? new Date(r.check_in + 'Z').toLocaleDateString() : '-')}</td>
                <td className="p-4 text-slate-500">{r.check_in ? new Date(r.check_in + 'Z').toLocaleTimeString() : '-'}</td>
                <td className="p-4 text-slate-500">{r.check_out ? new Date(r.check_out + 'Z').toLocaleTimeString() : '-'}</td>
                <td className="p-4">{statusBadge(r.status)}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan="4" className="p-8 text-center text-slate-400">No attendance records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrgAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("http://localhost:8001/org/attendance/all", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setRecords(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statusBadge = (s) => (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
      ${s === 'approved' ? 'bg-emerald-100 text-emerald-700' :
        s === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
      {s}
    </span>
  );

  return (
    <div className="p-10 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <ListChecks className="text-indigo-600" /> Attendance Records
        </h1>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="p-6">Employee</th>
                <th className="p-6">Date</th>
                <th className="p-6">Punch In</th>
                <th className="p-6">Punch Out</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-500">No records yet</p>
                    <p className="text-sm">Attendance records will appear here once employees punch in.</p>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-700">{r.employee_name}</p>
                      <p className="text-xs text-slate-400">{r.employee_email}</p>
                    </td>
                    <td className="p-6 font-medium">{r.date || (r.check_in ? new Date(r.check_in + 'Z').toLocaleDateString() : '-')}</td>
                    <td className="p-6 text-slate-500">{r.check_in ? new Date(r.check_in + 'Z').toLocaleTimeString() : '-'}</td>
                    <td className="p-6 text-slate-500">{r.check_out ? new Date(r.check_out + 'Z').toLocaleTimeString() : '-'}</td>
                    <td className="p-6">{statusBadge(r.status)}</td>
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