import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ClientsPage } from './pages/ClientsPage';
import { VendorsPage } from './pages/VendorsPage';
import { QAPage } from './pages/QAPage';
import { AdjudicationPage } from './pages/AdjudicationPage';
import { ReportsPage } from './pages/ReportsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
<Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/clients/*" element={<ClientsPage />} />
        <Route path="/vendors/*" element={<VendorsPage />} />
        <Route path="/qa/*" element={<QAPage />} />
        <Route path="/adjudication/*" element={<AdjudicationPage />} />
        <Route path="/reports/*" element={<ReportsPage />} />
        <Route path="/team/*" element={<TeamPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export default App;