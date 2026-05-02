import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Clock, Leaf, BookCheck, Briefcase, 
  ShieldAlert, Settings, Menu, X, LogOut, Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EmployeeSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/employee' },
    { name: 'Attendance', icon: <Clock size={20}/>, path: '/employee/attendance' },
    { name: 'Leave Management', icon: <Leaf size={20}/>, path: '/employee/leave' },
    { name: 'Learning Path', icon: <BookCheck size={20}/>, path: '/employee/learning' },
    { name: 'Internal Careers', icon: <Briefcase size={20}/>, path: '/employee/careers' },
    { name: 'AI Interview', icon: <Mic size={20}/>, path: '/employee/interview' },
    { name: 'Anonymous Portal', icon: <ShieldAlert size={20}/>, path: '/employee/report' },
    { name: 'Settings', icon: <Settings size={20}/>, path: '/employee/settings' },
  ];

  return (
    <div className={`flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-6 flex items-center justify-between">
        {isOpen && <img src="/logo.png" alt="HRValy" className="h-20 object-contain w-auto" />}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          {isOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
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
