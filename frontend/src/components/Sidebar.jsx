import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserCheck, Mic, Wallet, Settings, 
  Menu, X, Clock, Leaf, Award, MoveUpRight, BookOpen, 
  BookCheck, Briefcase, Activity, ShieldAlert, Flame, ShieldCheck
} from 'lucide-react';
import RoleGate from './RoleGate'; // Import the guard we created

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    
    { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/dashboard', roles: ['employee', 'manager', 'admin'] },
    { name: 'Employee Directory', icon: <UserCheck size={20}/>, path: '/dashboard/directory', roles: ['employee', 'manager', 'admin'] },
    { name: 'Attendance', icon: <Clock size={20}/>, path: '/dashboard/attendance', roles: ['employee', 'manager', 'admin'] },
    { name: 'Leave Management', icon: <Leaf size={20}/>, path: '/dashboard/LeaveManagement', roles: ['employee', 'manager', 'admin'] },
    
    
    
    { name: 'Internal Careers', icon: <Briefcase size={20}/>, path: '/dashboard/mobility', roles: ['employee', 'manager', 'admin'] },

    
    { name: 'Payroll Engine', icon: <Wallet size={20}/>, path: '/dashboard/payroll', roles: ['admin', 'manager'] },
    { name: 'Performance Intelligence', icon: <MoveUpRight size={20}/>, path: '/dashboard/performance', roles: ['manager', 'admin'] },
    { name: 'Succession Planning', icon: <Award size={20}/>, path: '/dashboard/succession', roles: ['admin'] },
    { name: 'Culture Pulse', icon: <Activity size={20}/>, path: '/dashboard/culture', roles: ['admin', 'manager'] },
    { name: 'Anonymous Portal', icon: <ShieldAlert size={20}/>, path: '/dashboard/report-issue', roles: ['employee', 'manager', 'admin'] },
    { name: 'Burnout Radar', icon: <Flame size={20}/>, path: '/dashboard/radar', roles: ['admin'] },
    { name: 'Security Audit', icon: <ShieldCheck size={20}/>, path: '/dashboard/audit', roles: ['admin']},
    { name: 'Settings', icon: <Settings size={20}/>, path: '/dashboard/settings', roles: ['employee', 'manager', 'admin'] },
  ];

  return (
    <div className={`flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-6 flex items-center justify-between">
        {isOpen && <img src="/logo.png" alt="HRValy" className="h-20 object-contain w-auto" />}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          {isOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <RoleGate key={item.name} allowedRoles={item.roles}>
            <Link
              to={item.path}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all group ${
                location.pathname === item.path 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <div className={location.pathname === item.path ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}>
                {item.icon}
              </div>
              {isOpen && <span className="text-sm font-semibold">{item.name}</span>}
            </Link>
          </RoleGate>
        ))}
      </nav>
    </div>
  );
}