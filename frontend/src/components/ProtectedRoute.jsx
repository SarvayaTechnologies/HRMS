import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login page
    if (requiredRole === "employee") {
      return <Navigate to="/employee-login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Role-based routing guard
  if (requiredRole === "org") {
    // Org routes: only admin/manager roles allowed
    if (user.role === "employee") {
      return <Navigate to="/employee" replace />;
    }
    // Org users must have an org_id
    if (!user.org_id) {
      return <Navigate to="/register-org" replace />;
    }
  }

  if (requiredRole === "employee") {
    // Employee routes: only employee role allowed
    if (user.role !== "employee") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}