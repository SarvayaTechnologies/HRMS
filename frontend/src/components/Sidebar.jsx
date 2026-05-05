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

  const menuGroups = [
    {
      title: "Core Operations",
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20}/>, path: '/dashboard', roles: ['employee', 'manager', 'admin'] },
        { name: 'Workforce Directory', icon: <UserCheck size={20}/>, path: '/dashboard/directory', roles: ['employee', 'manager', 'admin'] },
        { name: 'Attendance', icon: <Clock size={20}/>, path: '/dashboard/attendance', roles: ['employee', 'manager', 'admin'] },
        { name: 'Leave Management', icon: <Leaf size={20}/>, path: '/dashboard/LeaveManagement', roles: ['employee', 'manager', 'admin'] },
        { name: 'Payroll Engine', icon: <Wallet size={20}/>, path: '/dashboard/payroll', roles: ['admin', 'manager'] },
      ]
    },
    {
      title: "Strategy & Growth",
      items: [
        { name: 'Performance Intelligence', icon: <MoveUpRight size={20}/>, path: '/dashboard/performance', roles: ['manager', 'admin'] },
        { name: 'Succession Planning', icon: <Award size={20}/>, path: '/dashboard/succession', roles: ['admin'] },
        { name: 'Internal Careers', icon: <Briefcase size={20}/>, path: '/dashboard/mobility', roles: ['employee', 'manager', 'admin'] },
        { name: 'Course Management', icon: <BookOpen size={20}/>, path: '/dashboard/course-management', roles: ['org', 'admin', 'manager'] },
      ]
    },
    {
      title: "Health & Safety",
      items: [
        { name: 'Culture Pulse', icon: <Activity size={20}/>, path: '/dashboard/culture', roles: ['admin', 'manager'] },
        { name: 'Burnout Radar', icon: <Flame size={20}/>, path: '/dashboard/radar', roles: ['admin'] },
        { name: 'Anonymous Portal', icon: <ShieldAlert size={20}/>, path: '/dashboard/report-issue', roles: ['employee', 'manager', 'admin'] },
      ]
    },
    {
      title: "Governance",
      items: [
        { name: 'Security Audit', icon: <ShieldCheck size={20}/>, path: '/dashboard/audit', roles: ['admin']},
        { name: 'Settings', icon: <Settings size={20}/>, path: '/dashboard/settings', roles: ['employee', 'manager', 'admin'] },
      ]
    }
  ];

  return (
    <div className={`relative flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300 z-50 ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* Toggle Button Moved Outside */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="absolute -right-4 top-8 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 p-1.5 rounded-full shadow-md transition-colors z-50 flex items-center justify-center"
      >
        {isOpen ? <X size={14}/> : <Menu size={14}/>}
      </button>

      <div className={`h-20 flex items-center ${isOpen ? 'px-6 justify-start' : 'px-0 justify-center'}`}>
        {isOpen && <img src="/logo.png" alt="HRValy" className="h-8 object-contain w-auto" />}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar pb-10">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {isOpen && (
              <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <RoleGate key={item.name} allowedRoles={item.roles}>
                  <Link
                    to={item.path}
                    className={`flex items-center ${isOpen ? 'justify-start gap-3 px-3' : 'justify-center'} py-2.5 rounded-xl transition-all group ${
                      location.pathname === item.path 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200/50' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                    }`}
                  >
                    <div className={location.pathname === item.path ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}>
                      {React.cloneElement(item.icon, { size: 18 })}
                    </div>
                    {isOpen && <span className="text-[13px] font-medium">{item.name}</span>}
                  </Link>
                </RoleGate>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}