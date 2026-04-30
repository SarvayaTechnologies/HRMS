import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Clock, BookOpen, ShieldAlert, Leaf } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const quickLinks = [
    { name: "Attendance", icon: <Clock size={24} />, desc: "Check in & out" },
    { name: "Leave Management", icon: <Leaf size={24} />, desc: "Apply for leave" },
    { name: "Learning Path", icon: <BookOpen size={24} />, desc: "Grow your skills" },
    { name: "Internal Careers", icon: <Briefcase size={24} />, desc: "Explore openings" },
    { name: "Anonymous Portal", icon: <ShieldAlert size={24} />, desc: "Report concerns" },
  ];

  return (
    <div className="p-8 md:p-12 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Employee Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Welcome back, {user?.email?.split('@')[0] || 'Employee'}
          </h1>
          <p className="text-gray-400">Your personal workspace is ready</p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {quickLinks.map((link) => (
            <div 
              key={link.name}
              className="glass-card p-6 rounded-2xl hover:border-emerald-500/30 border border-white/5 transition-all cursor-pointer group"
            >
              <div className="text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                {link.icon}
              </div>
              <h3 className="text-white font-semibold text-sm">{link.name}</h3>
              <p className="text-gray-500 text-xs mt-1">{link.desc}</p>
            </div>
          ))}
        </div>

        {/* Status Card */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-emerald-400" size={28} />
          </div>
          <h2 className="text-white font-bold text-lg mb-2">Your Dashboard is Being Set Up</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Your organization is configuring your personalized workspace. 
            Check back soon for attendance tracking, leave management, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
