import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';

import Home from './pages/Home';
import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import RoleGate from './components/RoleGate';


import EmployeeDirectory from './pages/EmployeeDirectory';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Performance from './pages/Performance'; 
import OrgSignup from './pages/OrgSignup';

const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const ResumeUpload = lazy(() => import('./pages/ResumeUpload'));
const InterviewSession = lazy(() => import('./pages/InterviewSession'));
const Payroll = lazy(() => import('./pages/Payroll'));
const TotalRewards = lazy(() => import('./pages/TotalRewards'));
const Succession = lazy(() => import('./pages/Succession'));
const SkillGap = lazy(() => import('./pages/SkillGap'));
const LearningPath = lazy(() => import('./pages/LearingPath'));
const InternalMobility = lazy(() => import('./pages/InternalMobility'));
const CultureIntelligence = lazy(() => import('./pages/CultureIntelligence'));
const GrievancePortal = lazy(() => import('./pages/GrievanceProtal'));
const HotspotRadar = lazy(() => import('./pages/HotspotRader'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));

function DashboardLayout({ children }) {
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register-org" element={<OrgSignup/>} />

          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
            
                  <Route index element={<ExecutiveDashboard />} />
                  

                  <Route path="upload" element={<ResumeUpload />} />
                  <Route path="interview" element={<InterviewSession />} />
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

                  <Route path="culture" element={<CultureIntelligence />} />
                  <Route path="report-issue" element={<GrievancePortal />} />
                  <Route path="radar" element={<HotspotRadar />} />

     
                  <Route path="audit" element={
                    <RoleGate allowedRoles={['admin']}>
                      <AuditLogs />
                    </RoleGate>
                  } />
                  
                 
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;