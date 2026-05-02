import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OrgSignup() {
  const [orgName, setOrgName] = useState('');
  const navigate = useNavigate();
  const { user, login, loading } = useAuth();

  // If AuthContext is still loading from local storage, render a spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If the user isn't logged in, they shouldn't be on this page at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If they already have an org, send them to dashboard
  if (user.org_id) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignup = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    
    const res = await fetch("http://localhost:8001/auth/setup-org", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ org_name: orgName }),
    });
    
    if (res.ok) {
      const data = await res.json();
      // The backend issues a NEW token with the updated org_id
      login(data.access_token);
      
      // Delay slightly to let the AuthContext catch up and decode the new org_id
      setTimeout(() => navigate("/dashboard", { replace: true }), 100);
    } else {
      const errData = await res.json();
      alert(`Registration failed: ${errData.detail || 'Organization name might exist.'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="HRValy" className="h-10 object-contain" />
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 text-center">Setup Workspace</h2>
        <p className="text-slate-400 mb-8 text-center text-sm font-medium">Hello {user.email}, what is the name of your organization?</p>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase mb-2 ml-1">Organization Name</label>
            <input 
              type="text" 
              placeholder="e.g. Acme Corp" 
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 mt-4 rounded-xl shadow-lg shadow-indigo-600/20 font-bold transition-all">
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}