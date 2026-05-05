import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

import Home from './pages/Home';
import Sidebar from './components/Sidebar';
import EmployeeSidebar from './components/EmployeeSidebar';
import Auth from './pages/Auth';
import EmployeeAuth from './pages/EmployeeAuth';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import RoleGate from './components/RoleGate';

import EmployeeDirectory from './pages/EmployeeDirectory';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Performance from './pages/Performance'; 
import OrgSignup from './pages/OrgSignup';
import EmployeeDashboard from './pages/EmployeeDashboard';

const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));
const Payroll = lazy(() => import('./pages/Payroll'));
const TotalRewards = lazy(() => import('./pages/TotalRewards'));
const Succession = lazy(() => import('./pages/Succession'));
const SkillGap = lazy(() => import('./pages/SkillGap'));
const LearningPath = lazy(() => import('./pages/LearingPath'));
const InternalMobility = lazy(() => import('./pages/InternalMobility'));
const InterviewResults = lazy(() => import('./pages/InterviewResults'));
const CultureIntelligence = lazy(() => import('./pages/CultureIntelligence'));
const GrievancePortal = lazy(() => import('./pages/GrievanceProtal'));
const HotspotRadar = lazy(() => import('./pages/HotspotRader'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CourseCatalog = lazy(() => import('./pages/CourseCatalog'));
const EmployeePerformance = lazy(() => import('./pages/EmployeePerformance'));
const EmployeeSuccession = lazy(() => import('./pages/EmployeeSuccession'));
const CulturePulseEmployee = lazy(() => import('./pages/CulturePulseEmployee'));
const WellnessNavigator = lazy(() => import('./pages/WellnessNavigator'));
const PersonalSecurityLog = lazy(() => import('./pages/PersonalSecurityLog'));
const EmployeeSettings = lazy(() => import('./pages/EmployeeSettings'));
const OrgSettings = lazy(() => import('./pages/OrgSettings'));

function OrgDashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-10 text-slate-400 font-medium italic">Initializing AI Module...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function EmployeeDashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      <EmployeeSidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Suspense fallback={<div className="p-10 text-slate-400 font-medium italic">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/employee-login" element={<EmployeeAuth />} />
          <Route path="/register-org" element={<OrgSignup/>} />

          {/* Organization Dashboard Routes */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute requiredRole="org">
              <OrgDashboardLayout>
                <Routes>
                  <Route index element={<ExecutiveDashboard />} />
                  <Route path="directory" element={<EmployeeDirectory />} />
                  <Route path="attendance" element={<Attendance />}/>
                  <Route path="leavemanagement" element={<LeaveManagement />}/>
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="rewards" element={<TotalRewards />} />
                  <Route path="succession" element={<Succession />} />
                  <Route path="learning" element={<SkillGap />} />
                  <Route path="learning/path" element={<LearningPath />} />
                  <Route path="mobility" element={<InternalMobility />} />
                  <Route path="mobility/results/:jobId" element={<InterviewResults />} />
                  <Route path="culture" element={<CultureIntelligence />} />
                  <Route path="report-issue" element={<GrievancePortal />} />
                  <Route path="radar" element={<HotspotRadar />} />
                  <Route path="audit" element={
                    <RoleGate allowedRoles={['admin']}>
                      <AuditLogs />
                    </RoleGate>
                  } />
                  <Route path="settings" element={<OrgSettings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </OrgDashboardLayout>
            </ProtectedRoute>
          } />

          {/* Employee Dashboard Routes */}
          <Route path="/employee/*" element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboardLayout>
                <Routes>
                  <Route index element={<EmployeeDashboard />} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="leave" element={<LeaveManagement />} />
                  <Route path="careers" element={<InternalMobility />} />
                  <Route path="learning" element={<CourseCatalog />} />
                  <Route path="interview" element={<InterviewSession />} />
                  <Route path="report" element={<GrievancePortal />} />
                  <Route path="performance" element={<EmployeePerformance />} />
                  <Route path="succession" element={<EmployeeSuccession />} />
                  <Route path="pulse" element={<CulturePulseEmployee />} />
                  <Route path="wellness" element={<WellnessNavigator />} />
                  <Route path="security-log" element={<PersonalSecurityLog />} />
                  <Route path="settings" element={<EmployeeSettings />} />
                  <Route path="*" element={<Navigate to="/employee" replace />} />
                </Routes>
              </EmployeeDashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;