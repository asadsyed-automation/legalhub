import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import LawyersList from './pages/LawyersList';
import LawyerProfile from './pages/LawyerProfile';
import LawyerApplication from './pages/LawyerApplication';
import LawyerProfileEditor from './pages/LawyerProfileEditor';
import AdminQueue from './pages/AdminQueue';
import BookConsultation from './pages/BookConsultation';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import { ROLES } from './constants';

function App() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/lawyer/profile') ||
    location.pathname.startsWith('/bookings');

  return (
    <>
      {!isDashboardRoute && <Navbar />}
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
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Lawyer-Only Role-Guarded Profile & Services */}
          <Route
            path="/lawyer/profile"
            element={
              <ProtectedRoute allowedRoles={[ROLES.LAWYER]}>
                <DashboardLayout>
                  <LawyerProfileEditor />
                </DashboardLayout>
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

          {/* Booking Scheduling Flow (Citizen / Auth Client) */}
          <Route
            path="/book/:lawyerId"
            element={
              <ProtectedRoute>
                <BookConsultation />
              </ProtectedRoute>
            }
          />

          {/* Consultation Appointments Management */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <MyBookings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BookingDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isDashboardRoute && (
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
            © 2026 LegalHub Pakistan — Empowering connected, transparent legal access across Pakistan.
          </p>
        </footer>
      )}
    </>
  );
}

export default App;
