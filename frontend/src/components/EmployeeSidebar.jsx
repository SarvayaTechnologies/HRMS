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

  const menuGroups = [
    {
      title: "My Workspace",
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/employee' },
        { name: 'Smart Attendance', icon: <Clock size={20}/>, path: '/employee/attendance' },
        { name: 'Leave Management', icon: <Leaf size={20}/>, path: '/employee/leave' },
      ]
    },
    {
      title: "Career Acceleration",
      items: [
        { name: 'Internal Marketplace', icon: <Briefcase size={20}/>, path: '/employee/careers' },
        { name: 'AI Interview Center', icon: <Mic size={20}/>, path: '/employee/interview' },
        { name: 'Learning & Development', icon: <BookCheck size={20}/>, path: '/employee/learning' },
        { name: 'Performance Tracking', icon: <Target size={20}/>, path: '/employee/performance' },
        { name: 'Succession Planning', icon: <Award size={20}/>, path: '/employee/succession' },
      ]
    },
    {
      title: "Well-being & Feedback",
      items: [
        { name: 'Wellness Navigator', icon: <Shield size={20}/>, path: '/employee/wellness' },
        { name: 'Culture Pulse', icon: <HeartPulse size={20}/>, path: '/employee/pulse' },
        { name: 'Anonymous Reporting', icon: <ShieldAlert size={20}/>, path: '/employee/report' },
      ]
    },
    {
      title: "Security & Privacy",
      items: [
        { name: 'Security Log', icon: <ShieldCheck size={20}/>, path: '/employee/security-log' },
        { name: 'Settings', icon: <Settings size={20}/>, path: '/employee/settings' },
      ]
    }
  ];

  return (
    <div className={`relative flex flex-col h-screen bg-sidebar border-r border-white/5 transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* Toggle Button Moved Outside */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="absolute -right-4 top-8 bg-slate-900 border border-white/10 text-slate-400 hover:text-accent p-1.5 rounded-full shadow-md transition-colors z-50 flex items-center justify-center"
      >
        {isOpen ? <X size={14}/> : <Menu size={14}/>}
      </button>

      <div className={`h-20 flex items-center relative ${isOpen ? 'px-6 justify-between' : 'px-0 justify-center'}`}>
        {isOpen && <img src="/logo.png" alt="HRValy" className="h-8 object-contain w-auto" />}
        <div className={`flex gap-2 ${isOpen ? '' : 'mx-auto'}`}>
          <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-slate-400 hover:bg-white/5 rounded-lg transition-colors">
            <Bell size={18}/>
            {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
          </button>

          {showDropdown && (
            <div className={`absolute top-16 ${isOpen ? 'right-6 left-auto' : 'left-16'} bg-slate-900 border border-white/10 shadow-xl rounded-xl w-64 max-h-80 overflow-y-auto z-50 p-2`}>
               <div className="flex justify-between items-center p-2 border-b border-white/10 mb-2">
                 <h4 className="text-xs font-bold uppercase text-slate-400">Notifications</h4>
                 <button onClick={() => setShowDropdown(false)} className="text-slate-500 hover:text-slate-300"><X size={14}/></button>
               </div>
               {notifications.length === 0 ? (
                 <p className="text-xs text-slate-500 p-2">No new notifications</p>
               ) : notifications.map(n => (
                 <div key={n.id} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer mb-1 border border-white/5">
                    <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
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
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Employee</span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-6 overflow-y-auto custom-scrollbar pb-10">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {isOpen && (
              <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center ${isOpen ? 'justify-start gap-3 px-3' : 'justify-center'} py-2.5 rounded-lg transition-all group ${
                    location.pathname === item.path 
                    ? 'bg-accent/10 text-accent border border-accent/20 shadow-md shadow-accent/5' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-accent'
                  }`}
                >
                  <div className={location.pathname === item.path ? 'text-accent' : 'text-slate-500 group-hover:text-accent'}>
                    {React.cloneElement(item.icon, { size: 18 })}
                  </div>
                  {isOpen && <span className="text-[13px] font-medium">{item.name}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button 
          onClick={logout}
          className={`flex items-center ${isOpen ? 'justify-start gap-3 px-3' : 'justify-center'} py-2.5 rounded-lg text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all w-full group`}
        >
          <LogOut size={18} className="group-hover:scale-110 transition-transform"/>
          {isOpen && <span className="text-[13px] font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
