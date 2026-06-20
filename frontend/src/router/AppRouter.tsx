import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// Import Pages
import LoginPage from '../pages/LoginPage';
import MemberDashboard from '../pages/MemberDashboard';
import TaskHistory from '../pages/TaskHistory';
import ProjectProgressCenter from '../pages/ProjectProgressCenter';
import AdminDashboard from '../pages/AdminDashboard';
import EfficiencyRanking from '../pages/EfficiencyRanking';
import AnalyticsOverview from '../pages/AnalyticsOverview';
import AccessDenied from '../pages/AccessDenied';
import AssignTask from '../pages/AssignTask';

// Sleek premium light loading screen
const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 text-slate-800 font-sans">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mb-4" />
      <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase font-sans select-none animate-pulse">
        Loading session...
      </h3>
    </div>
  );
};

// Protected Route for Team Members
const MemberRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

// Protected Route for Administrators
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/access-denied" replace />;

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Root Path Redirect */}
      <Route path="/" element={
        user ? (
          user.isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/member" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Public Landing */}
      <Route path="/login" element={
        user ? (
          user.isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/member" replace />
        ) : (
          <LoginPage />
        )
      } />
      
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Member Tasks */}
      <Route path="/member" element={
        <MemberRoute>
          <MemberDashboard />
        </MemberRoute>
      } />
      
      <Route path="/member/history" element={
        <MemberRoute>
          <TaskHistory />
        </MemberRoute>
      } />

      {/* Admin Dashboards */}
      <Route path="/projects" element={
        <AdminRoute>
          <ProjectProgressCenter />
        </AdminRoute>
      } />
      
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />

      <Route path="/assign-task" element={
        <AdminRoute>
          <AssignTask />
        </AdminRoute>
      } />

      <Route path="/ranking" element={
        <AdminRoute>
          <EfficiencyRanking />
        </AdminRoute>
      } />

      <Route path="/analytics" element={
        <AdminRoute>
          <AnalyticsOverview />
        </AdminRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
