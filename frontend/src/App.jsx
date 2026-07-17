import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Targets from './pages/targets/Targets';
import TargetDetail from './pages/targets/TargetDetail';
import Engagements from './pages/engagements/Engagements';
import NewEngagement from './pages/engagements/NewEngagement';
import EngagementDetail from './pages/engagements/EngagementDetail';
import Vulnerabilities from './pages/vulnerabilities/Vulnerabilities';
import VulnDetail from './pages/vulnerabilities/VulnDetail';
import Reports from './pages/reports/Reports';
import Users from './pages/admin/Users';
import Profile from './pages/Profile';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="targets" element={<Targets />} />
        <Route path="targets/:id" element={<TargetDetail />} />
        <Route path="engagements" element={<Engagements />} />
        <Route path="engagements/new" element={<NewEngagement />} />
        <Route path="engagements/:id" element={<EngagementDetail />} />
        <Route path="vulnerabilities" element={<Vulnerabilities />} />
        <Route path="vulnerabilities/:id" element={<VulnDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
