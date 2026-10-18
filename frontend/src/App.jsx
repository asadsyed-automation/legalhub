import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import LawyersList from './pages/LawyersList';
import LawyerProfile from './pages/LawyerProfile';
import LawyerApplication from './pages/LawyerApplication';
import AdminQueue from './pages/AdminQueue';
import { ROLES } from './constants';

function App() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lawyers" element={<LawyersList />} />
          <Route path="/lawyers/:id" element={<LawyerProfile />} />

          {/* Authenticated Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Lawyer-Only Role-Guarded Route */}
          <Route
            path="/lawyer/application"
            element={
              <ProtectedRoute allowedRoles={[ROLES.LAWYER]}>
                <LawyerApplication />
              </ProtectedRoute>
            }
          />

          {/* Admin-Only Role-Guarded Route */}
          <Route
            path="/admin/queue"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminQueue />
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--spacing-6) var(--spacing-4)',
          textAlign: 'center',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-subtle)',
          marginTop: 'auto',
        }}
      >
        <p>
          © 2026 LegalHub Pakistan — Empowering transparent, verified legal access across all Provincial Bar Councils.
        </p>
      </footer>
    </>
  );
}

export default App;
