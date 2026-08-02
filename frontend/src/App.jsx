import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

// Public & Utility Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import PricingPage from './pages/PricingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SearchResults from './pages/SearchResults';
import Maintenance from './pages/Maintenance';
import NotFound from './pages/NotFound';
import LawyerPublicProfile from './pages/LawyerPublicProfile';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OtpVerification from './pages/OtpVerification';

// Dashboard & App Pages
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import MarketplaceBrowse from './pages/MarketplaceBrowse';
import MarketplaceProfile from './pages/MarketplaceProfile';
import CitizenProfilePage from './pages/CitizenProfilePage';
import AdminPanel from './pages/AdminPanel';
import FirmManagement from './pages/FirmManagement';
import Settings from './pages/Settings';

import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Marketing routes */}
          <Route path="/"            element={<Home />} />
          <Route path="/home"        element={<Home />} />
          <Route path="/about"       element={<About />} />
          <Route path="/contact"     element={<Contact />} />
          <Route path="/pricing"     element={<PricingPage />} />
          <Route path="/privacy"     element={<PrivacyPolicy />} />
          <Route path="/terms"       element={<TermsOfService />} />
          <Route path="/search"      element={<SearchResults />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/marketplace"             element={<MarketplaceBrowse />} />
          <Route path="/marketplace/:profileId"  element={<LawyerPublicProfile />} />

          {/* Auth routes */}
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/verify-otp"      element={<OtpVerification />} />

          {/* Protected app routes — all wrapped under ProtectedRoute + DashboardLayout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"           element={<Dashboard />} />
            <Route path="/cases"               element={<Cases />} />
            <Route path="/cases/:id"           element={<CaseDetail />} />
            <Route path="/messages"            element={<Messages />} />
            <Route path="/notifications"       element={<Notifications />} />
            <Route path="/marketplace/profile" element={<MarketplaceProfile />} />
            <Route path="/citizen/profile"     element={<CitizenProfilePage />} />
            <Route path="/admin"               element={<AdminPanel />} />
            <Route path="/firm"                element={<FirmManagement />} />
            <Route path="/settings"            element={<Settings />} />
          </Route>

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;