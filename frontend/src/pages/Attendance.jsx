import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Loader2, Inbox, ListChecks, Smile, Briefcase, Home, WifiOff, Target, Smartphone } from 'lucide-react';
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
  const [workMode, setWorkMode] = useState("Office");
  const [mood, setMood] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const token = localStorage.getItem("token");

  useEffect(() => { 
    fetchRecords(); 
    let did = localStorage.getItem("device_id");
    if(!did) {
        did = "DEV-" + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem("device_id", did);
    }
    setDeviceId(did);

    const handleOnline = () => {
      setIsOffline(false);
      syncOfflinePunches();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflinePunches = async () => {
    const offlinePunches = JSON.parse(localStorage.getItem('offline_punches') || '[]');
    if (offlinePunches.length === 0) return;
    
    let remainingQueue = [];
    let syncedAny = false;
    
    for (const punch of offlinePunches) {
      try {
        const res = await fetch("http://localhost:8001/attendance/punch", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({...punch, is_offline_sync: true}),
        });
        if (!res.ok) {
           remainingQueue.push(punch);
        } else {
           syncedAny = true;
        }
      } catch (err) {
        console.error("Failed to sync offline punch", err);
        remainingQueue.push(punch);
      }
    }
    
    if (remainingQueue.length > 0) {
       localStorage.setItem('offline_punches', JSON.stringify(remainingQueue));
    } else {
       localStorage.removeItem('offline_punches');
    }
    
    if (syncedAny) fetchRecords();
  };

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
    if (status === "Not Checked In" && (!mood || !dailyGoal)) {
      alert("Please check your mood and enter your daily goal before punching in.");
      return;
    }

    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    const processPunch = async (latitude, longitude) => {
      const payload = {
        lat: latitude, 
        lon: longitude,
        work_mode: workMode,
        device_id: deviceId,
        mood: mood,
        daily_goal: dailyGoal,
        is_offline_sync: isOffline
      };

      if (isOffline) {
        const offlineQueue = JSON.parse(localStorage.getItem('offline_punches') || '[]');
        offlineQueue.push({...payload, timestamp: new Date().toISOString()});
        localStorage.setItem('offline_punches', JSON.stringify(offlineQueue));
        setStatus("Checked In (Offline)");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:8001/attendance/punch", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (res.ok) { 
          setStatus(result.status); 
          fetchRecords(); 
        } else {
          alert(result.detail);
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => processPunch(position.coords.latitude, position.coords.longitude),
      (error) => {
        console.warn("Geolocation failed, using fallback coordinates", error);
        processPunch(0, 0); // Fallback for testing or if user denies
      }
    );
  };

  const statusBadge = (s) => (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
      ${s === 'approved' ? 'bg-emerald-100 text-emerald-700' :
        s === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
      {s}
    </span>
  );

  const formatDate = (date, checkIn) => {
    if (date) return date;
    if (!checkIn) return '-';
    try {
      const d = new Date(checkIn + (checkIn.endsWith('Z') ? '' : 'Z'));
      return d.toLocaleDateString();
    } catch (e) {
      return checkIn.split('T')[0] || '-';
    }
  };

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mx-auto">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-emerald-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Smart Presence</h2>
          <p className="text-slate-500 font-medium mt-1">{status}</p>
        </div>

        {status === "Not Checked In" && (
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {['Office', 'Remote', 'Client Site'].map(mode => (
                  <button key={mode} onClick={() => setWorkMode(mode)} className={`py-2 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all ${workMode === mode ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                    {mode === 'Office' ? <Briefcase size={16} /> : mode === 'Remote' ? <Home size={16} /> : <MapPin size={16} />}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Health & Mood Check</label>
              <div className="flex justify-between gap-2">
                {['🚀 Productive', '🙂 Good', ' خ\u200d Tired', '🔥 Burnt Out'].map(m => (
                  <button key={m} onClick={() => setMood(m)} className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${mood === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Goal Snippet</label>
              <input type="text" value={dailyGoal} onChange={e => setDailyGoal(e.target.value)} placeholder="What is your main focus today? (Max 100 chars)" maxLength={100} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium" />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Smartphone className="text-slate-400" size={16} />
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">Device ID Binding Active:</span> {deviceId}
              </div>
            </div>
            
            {isOffline && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 text-xs font-bold">
                <WifiOff size={16} /> You are offline. Punches will be synced later.
              </div>
            )}
          </div>
        )}

        <button
          onClick={handlePunch}
          disabled={loading || status === "Checked Out" || status === "Checked In"}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <MapPin size={20} />}
          {loading ? "Recording..." : status === "Checked In" ? "Punch Out" : "Punch In Now"}
        </button>
        <p className="mt-4 text-xs text-slate-400 italic text-center">* Geolocation and Device Identity verified at punch.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">My Attendance History</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Details</th>
              <th className="p-4">Punch In</th>
              <th className="p-4">Punch Out</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(r => (
              <tr key={r.id}>
                <td className="p-4 font-medium text-slate-700">{formatDate(r.date, r.check_in)}</td>
                <td className="p-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                       {r.work_mode === 'Remote' ? <Home size={12}/> : r.work_mode === 'Client Site' ? <MapPin size={12}/> : <Briefcase size={12}/>} {r.work_mode}
                    </span>
                    <span className="text-xs text-slate-500">{r.mood}</span>
                    {r.anomaly_flag && <span className="text-[10px] text-rose-500 font-bold">{r.anomaly_flag}</span>}
                  </div>
                </td>
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

  const formatDate = (date, checkIn) => {
    if (date) return date;
    if (!checkIn) return '-';
    try {
      const d = new Date(checkIn + (checkIn.endsWith('Z') ? '' : 'Z'));
      return d.toLocaleDateString();
    } catch (e) {
      return checkIn.split('T')[0] || '-';
    }
  };

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
                <th className="p-6">Work Mode & Details</th>
                <th className="p-6">Punch In</th>
                <th className="p-6">Punch Out</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
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
                    <td className="p-6 font-medium text-slate-700">{formatDate(r.date, r.check_in)}</td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          {r.work_mode === 'Remote' ? <Home size={12}/> : r.work_mode === 'Client Site' ? <MapPin size={12}/> : <Briefcase size={12}/>} {r.work_mode}
                        </span>
                        <span className="text-xs text-slate-500">{r.mood}</span>
                        {r.anomaly_flag && <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-full inline-block mt-1">{r.anomaly_flag}</span>}
                        {r.overtime_flag && <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1">Overtime</span>}
                        {r.daily_goal && <p className="text-xs text-slate-400 truncate max-w-xs mt-1" title={r.daily_goal}>"{r.daily_goal}"</p>}
                      </div>
                    </td>
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