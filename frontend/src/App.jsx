import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import LawyersList from './pages/LawyersList';
import LawyerProfile from './pages/LawyerProfile';
import LawyerApplication from './pages/LawyerApplication';
import LawyerProfileEditor from './pages/LawyerProfileEditor';
import AdminQueue from './pages/AdminQueue';
import AdminUsers from './pages/AdminUsers';
import BookConsultation from './pages/BookConsultation';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import CasesList from './pages/CasesList';
import NewCase from './pages/NewCase';
import CaseDetail from './pages/CaseDetail';
import HearingsCalendar from './pages/HearingsCalendar';
import Notifications from './pages/Notifications';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Feed from './pages/Feed';
import FeedDetail from './pages/FeedDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Disclaimer from './pages/Disclaimer';
import RefundPolicy from './pages/RefundPolicy';
import Contact from './pages/Contact';
import Footer from './components/Footer';
import { ROLES } from './constants';

function App() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/lawyer/') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/bookings') ||
    location.pathname.startsWith('/cases') ||
    location.pathname.startsWith('/calendar') ||
    location.pathname.startsWith('/notifications');

  return (
    <>
      {!isDashboardRoute && <Navbar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public Directory & Info Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/lawyers" element={<LawyersList />} />
          <Route path="/lawyers/:id" element={<LawyerProfile />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/feed/:id" element={<FeedDetail />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/contact" element={<Contact />} />

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
                <DashboardLayout>
                  <LawyerApplication />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin-Only Role-Guarded Route */}
          <Route
            path="/admin/queue"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout>
                  <AdminQueue />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <DashboardLayout>
                  <AdminUsers />
                </DashboardLayout>
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

          {/* Cases & Digital Chamber Matter Management */}
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CasesList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/new"
            element={
              <ProtectedRoute allowedRoles={[ROLES.LAWYER]}>
                <DashboardLayout>
                  <NewCase />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CaseDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HearingsCalendar />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Notifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isDashboardRoute && <Footer />}
    </>
  );
}

export default App;
