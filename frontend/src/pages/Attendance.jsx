import React, { useState } from 'react';
import { MapPin, Clock } from 'lucide-react';

export default function Attendance() {
  const [status, setStatus] = useState("Not Checked In");
  const [loading, setLoading] = useState(false);

  const handlePunch = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      const res = await fetch("http://localhost:8001/attendance/punch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: 1, // Dynamically get from AuthContext later
          lat: latitude,
          lon: longitude
        }),
      });
      
      const result = await res.json();
      setStatus(`Status: ${result.status} (${result.location_verified ? 'Office' : 'Remote'})`);
      setLoading(false);
    });
  };

  return (
    <div className="p-10 flex justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-indigo-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Daily Attendance</h2>
        <p className="text-slate-500 mb-8 font-medium">{status}</p>

        <button 
          onClick={handlePunch}
          disabled={loading}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all disabled:bg-slate-400"
        >
          <MapPin size={20} />
          {loading ? "Verifying Location..." : "Punch In Now"}
        </button>

        <p className="mt-6 text-xs text-slate-400 italic">
          * Your location is recorded only at the moment of punch-in.
        </p>
      </div>
    </div>
  );
}