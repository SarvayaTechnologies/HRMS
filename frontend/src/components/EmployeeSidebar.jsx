import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Clock, Leaf, BookCheck, Briefcase, 
  ShieldAlert, Settings, Menu, X, LogOut, Mic, Bell, Target, Award, HeartPulse, Shield, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmployeeSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  React.useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch("http://localhost:8001/employee/notifications", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setNotifications(await res.json());
      } catch (err) {}
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 15000); // polling every 15s
    return () => clearInterval(iv);
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/employee' },
    { name: 'Attendance', icon: <Clock size={20}/>, path: '/employee/attendance' },
    { name: 'Leave Management', icon: <Leaf size={20}/>, path: '/employee/leave' },
    { name: 'Internal Careers', icon: <Briefcase size={20}/>, path: '/employee/careers' },
    { name: 'Performance Intelligence', icon: <Target size={20}/>, path: '/employee/performance' },
    { name: 'Succession Planning', icon: <Award size={20}/>, path: '/employee/succession' },
    { name: 'Culture Pulse', icon: <HeartPulse size={20}/>, path: '/employee/pulse' },
    { name: 'Wellness Navigator', icon: <Shield size={20}/>, path: '/employee/wellness' },
    { name: 'Learning & Development', icon: <BookCheck size={20}/>, path: '/employee/learning' },
    { name: 'AI Interview', icon: <Mic size={20}/>, path: '/employee/interview' },
    { name: 'Anonymous Portal', icon: <ShieldAlert size={20}/>, path: '/employee/report' },
    { name: 'Security Log', icon: <ShieldCheck size={20}/>, path: '/employee/security-log' },
    { name: 'Settings', icon: <Settings size={20}/>, path: '/employee/settings' },
  ];

  return (
    <div className={`flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-6 flex items-center justify-between relative">
        {isOpen && <img src="/logo.png" alt="HRValy" className="h-10 object-contain w-auto" />}
        <div className="flex gap-2">
          <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={20}/>
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            {isOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>

          {showDropdown && (
            <div className="absolute top-16 left-6 bg-white border border-slate-200 shadow-xl rounded-xl w-64 max-h-80 overflow-y-auto z-50 p-2">
               <div className="flex justify-between items-center p-2 border-b border-slate-100 mb-2">
                 <h4 className="text-xs font-bold uppercase text-slate-500">Notifications</h4>
                 <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-700"><X size={14}/></button>
               </div>
               {notifications.length === 0 ? (
                 <p className="text-xs text-slate-400 p-2">No new notifications</p>
               ) : notifications.map(n => (
                 <div key={n.id} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer mb-1 border border-slate-100">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      {n.type === 'success' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>}
                      {n.type === 'info' && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block"></span>}
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{n.message}</p>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="px-4 mb-4">
          <div className="bg-emerald-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Employee</span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${
              location.pathname === item.path 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'
            }`}
          >
            <div className={location.pathname === item.path ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'}>
              {item.icon}
            </div>
            {isOpen && <span className="text-sm font-semibold">{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-200">
        <button 
          onClick={logout}
          className="flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut size={20}/>
          {isOpen && <span className="text-sm font-semibold">Logout</span>}
        </button>
      </div>
    </div>
  );
}
