import React, { useState, useEffect } from 'react';
import { Flame, Inbox, AlertTriangle, Activity, Loader2 } from 'lucide-react';

export default function HotspotRadar() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRadar();
  }, []);

  const fetchRadar = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8001/culture/burnout-radar", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.burnout_alerts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Flame className="text-rose-500" size={32} />
            <h1 className="text-3xl font-black text-slate-900">Burnout & Attrition Radar</h1>
          </div>
          <span className="bg-rose-100 text-rose-700 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            <Activity size={16} /> Live Prediction
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          {loading ? (
            <div className="text-center p-12 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
              <p className="font-bold">Analyzing workforce telemetry...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center p-12">
              <Inbox className="mx-auto text-emerald-400 mb-4" size={48} />
              <h3 className="font-bold text-slate-700 text-xl mb-2">Workforce Healthy</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                No high burnout risks detected based on the last 14 days of Smart Presence telemetry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${alert.risk_score > 60 ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">{alert.employee_name}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{alert.department}</p>
                    </div>
                    <div className={`font-black text-2xl ${alert.risk_score > 60 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {alert.risk_score}%
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    {alert.indicators.burnt_out_days > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Reported Burnout</span>
                        <span className="font-bold text-slate-700">{alert.indicators.burnt_out_days} days</span>
                      </div>
                    )}
                    {alert.indicators.tired_days > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Reported Exhaustion</span>
                        <span className="font-bold text-slate-700">{alert.indicators.tired_days} days</span>
                      </div>
                    )}
                    {alert.indicators.overtime_days > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Excessive Overtime</span>
                        <span className="font-bold text-slate-700">{alert.indicators.overtime_days} days</span>
                      </div>
                    )}
                    {alert.indicators.anomalies > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Punches Flagged</span>
                        <span className="font-bold text-slate-700">{alert.indicators.anomalies} flags</span>
                      </div>
                    )}
                  </div>

                  <button className="mt-6 w-full py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                    <AlertTriangle size={16} className={alert.risk_score > 60 ? 'text-rose-500' : 'text-amber-500'} />
                    Schedule Check-in
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}