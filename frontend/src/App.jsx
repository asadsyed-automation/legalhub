import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import MarketplaceBrowse from './pages/MarketplaceBrowse';
import MarketplaceProfile from './pages/MarketplaceProfile';
import AdminPanel from './pages/AdminPanel';
import FirmManagement from './pages/FirmManagement';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — all nested under DashboardLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="messages" element={<Messages />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="marketplace" element={<MarketplaceBrowse />} />
            <Route path="marketplace/profile" element={<MarketplaceProfile />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="firm" element={<FirmManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;