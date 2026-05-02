import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated && !searchParams.get("token")) {
      // Route based on role
      if (user?.role === "employee") {
        navigate("/employee", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, loading, navigate, searchParams, user]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      login(token);
      setTimeout(() => navigate("/dashboard", { replace: true }), 100);
    }
  }, [searchParams, login, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8001/login/google";
  };

  const handleManualAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    
    try {
      const res = await fetch(`http://localhost:8001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert(data.detail || "Authentication failed");
        return;
      }

      login(data.access_token);
      navigate('/dashboard');
    } catch (err) {
      console.error("Auth error:", err);
      alert("Could not connect to the authentication server");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="HRValy" className="h-12 object-contain mb-4" />
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Organization Portal</span>
          </div>
          <h2 className="text-white text-xl font-semibold">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            {isLogin ? "Enter your details to access your workspace" : "Join the future of workforce intelligence"}
          </p>
        </div>

        <form onSubmit={handleManualAuth} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition" 
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-bold uppercase mb-2 ml-1">Password</label>
            <input 
              type="password" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            {isLogin ? "Sign In" : "Get Started"}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <hr className="border-white/10" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#121212] px-4 text-slate-500 text-xs uppercase font-bold">
            Or continue with
          </span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-xl transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
          Continue with Google
        </button>

        <p className="text-center text-slate-400 text-sm mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 font-bold hover:underline"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>

        <div className="relative my-4 text-center">
          <hr className="border-white/10" />
        </div>

        <p className="text-center text-slate-400 text-sm">
          Are you an employee?{" "}
          <Link to="/employee-login" className="text-emerald-400 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}