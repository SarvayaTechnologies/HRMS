import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function EmployeeAuth() {
  const [isSetup, setIsSetup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Invalid credentials");
        setLoading(false);
        return;
      }

      // Verify this is an employee account
      login(data.access_token);
      navigate('/employee', { replace: true });
    } catch (err) {
      setError("Could not connect to the server");
    }
    setLoading(false);
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/auth/employee-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Setup failed");
        setLoading(false);
        return;
      }

      login(data.access_token);
      navigate('/employee/onboarding', { replace: true });
    } catch (err) {
      setError("Could not connect to the server");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="HRValy" className="h-12 object-contain mb-4" />
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Employee Portal</span>
          </div>
          <h2 className="text-white text-xl font-semibold">
            {isSetup ? "Set Up Your Account" : "Employee Login"}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isSetup 
              ? "Create a password for your pre-registered account" 
              : "Sign in with the email registered by your organization"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={isSetup ? handleSetup : handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase mb-2 ml-1">Work Email</label>
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition" 
              placeholder="yourname@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase mb-2 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSetup && (
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase mb-2 ml-1">Confirm Password</label>
              <input 
                type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isSetup ? "Setting up..." : "Signing in..."}
              </>
            ) : (
              isSetup ? "Create Account" : "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            onClick={() => { setIsSetup(!isSetup); setError(""); }}
            className="text-emerald-400 text-sm font-bold hover:underline"
          >
            {isSetup ? "← Back to login" : "First time? Set up your password →"}
          </button>
        </div>

        <div className="relative my-6 text-center">
          <hr className="border-white/10" />
        </div>

        <p className="text-center text-slate-400 text-sm">
          Are you an organization?{" "}
          <Link to="/login" className="text-indigo-400 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
