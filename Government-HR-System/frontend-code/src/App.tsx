import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { switchLanguage } from './lib/i18n';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import LeaveRequestForm from './pages/LeaveRequestForm';
import { ManagerApprovalHub } from './pages/ManagerApprovalHub';
import PayrollProcessingHub from './pages/PayrollProcessingHub';
import OrgChart from './pages/OrgChart';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navigation from './components/Navigation';

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  useEffect(() => {
    switchLanguage('ar');
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<EmployeeDashboard />} />
        <Route path="/leave/request" element={
          <ProtectedRoute allowedRoles={['Employee']}>
            <LeaveRequestForm />
          </ProtectedRoute>
        } />
        {/* Alias for Navigation.tsx link /leave-request */}
        <Route path="/leave-request" element={<Navigate to="/leave/request" replace />} />
        <Route path="/manager/approvals" element={
          <ProtectedRoute allowedRoles={['Manager']}>
            <ManagerApprovalHub />
          </ProtectedRoute>
        } />
        {/* Alias for Navigation.tsx link /manager-approval */}
        <Route path="/manager-approval" element={<Navigate to="/manager/approvals" replace />} />
        <Route path="/payroll" element={
          <ProtectedRoute allowedRoles={['HR Staff']}>
            <PayrollProcessingHub />
          </ProtectedRoute>
        } />
        <Route path="/org-chart" element={<OrgChart />} />
      </Route>
    </Routes>
  );
}

export default App;