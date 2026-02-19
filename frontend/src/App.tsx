import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import SettingsLayout from './pages/settings/SettingsLayout';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import NewOrderPage from './pages/orders/NewOrderPage';
import OrderDetailPage from './pages/orders/OrderDetailPage';
import ApplicantsPage from './pages/ApplicantsPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import SettingsUsersPage from './pages/settings/UsersPage';
import AdverseActionsPage from './pages/AdverseActionsPage';
import AdjudicationPage from './pages/AdjudicationPage';
import MonitoringPage from './pages/MonitoringPage';
import DisputesPage from './pages/DisputesPage';
import ReportsPage from './pages/reports/ReportsPage';
import ProfilePage from './pages/settings/ProfilePage';
import BrandingPage from './pages/settings/BrandingPage';
import ApiKeysPage from './pages/settings/ApiKeysPage';
import BillingPage from './pages/settings/BillingPage';
import ApplicantPortalPage from './pages/applicant-portal/ApplicantPortalPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      
      {/* Applicant Portal (public) */}
      <Route path="/applicant-portal/:token" element={<ApplicantPortalPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/new" element={<NewOrderPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="applicants" element={<ApplicantsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        
        {/* Settings (with nested routes) */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="settings/users" element={<SettingsUsersPage />} />
        <Route path="settings/branding" element={<BrandingPage />} />
        <Route path="settings/api-keys" element={<ApiKeysPage />} />
        <Route path="settings/billing" element={<BillingPage />} />
        
        {/* New routes */}
        <Route path="adverse-actions" element={<AdverseActionsPage />} />
        <Route path="adverse-actions/:id" element={<AdverseActionsPage />} />
        <Route path="adjudication" element={<AdjudicationPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="disputes" element={<DisputesPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
