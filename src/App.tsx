import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/home/Home";
import EmailSignup from "./pages/signup/EmailSignup";
import VerifyOTP from "./pages/signup/VerifyOTP";
import ChooseRole from "./pages/auth/ChooseRole";
import CustomerRegister from "./pages/auth/customer/CustomerRegister";
import Onboarding from "./pages/auth/Onboarding";
import ProfessionalRegister from "./pages/auth/professional/ProfessionalRegister";
import CustomerHome from "./pages/auth/customer/CustomerHome";
import SearchResults from "./pages/auth/customer/SearchResults";
import ProfessionalProfile from "./pages/auth/customer/ProfessionalProfile";
import CustomerMessages from "./pages/auth/customer/CustomerMessages";
import ProfessionalHome from "./pages/auth/professional/ProfessionalHome";
import ProfessionalMessages from "./pages/auth/professional/ProfessionalMessages";
import ProfessionalJobs from "./pages/auth/professional/ProfessionalJobs";
import ProfessionalEarnings from "./pages/auth/professional/ProfessionalEarnings";
import ProfessionalReviews from "./pages/auth/professional/ProfessionalReviews";
import ProfessionalNotifications from "./pages/auth/professional/ProfessionalNotifications";
import LoginPage from "./pages/auth/login";
import ForgotPassword from "./pages/auth/login/ForgotPassword";
import PendingApproval from "./pages/signup/PendingApproval";
import AccountSettings from "./pages/auth/customer/AccountSettings";
import Bookings from "./pages/auth/customer/Bookings";
import PaymentCheckout from "./pages/auth/customer/PaymentCheckout";
import PaymentSuccess from "./pages/auth/customer/PaymentSuccess";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { useEffect } from "react";
import { useTheme } from "./context/ThemeContext";

const ThemeManager = () => {
  const { theme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    // Standard approach: Home page and Auth flow are theme-neutral (usually light or brand-fixed)
    // Only apply dashboard dark mode if we're in the dashboard areas
    const isDashboard = location.pathname.startsWith('/customer') || location.pathname.startsWith('/professional') || location.pathname.startsWith('/account-settings');
    
    if (isDashboard && theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, location.pathname]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ThemeManager />
      <ScrollToTop />
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />
        {/* Signup flow */}
        <Route path="/signup/email" element={<EmailSignup />} />
        <Route path="/signup/verify" element={<VerifyOTP />} />
        <Route path="/signup/role" element={<ChooseRole />} />
        <Route path="/signup/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* Registration */}
        <Route path="/signup/customer" element={<CustomerRegister />} />
        <Route path="/signup/professional" element={<ProfessionalRegister />} />
        {/* Login & Recovery */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboards */}
        <Route
          path="/customer/home"
          element={
            <ProtectedRoute role="customer">
              <CustomerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/search"
          element={
            <ProtectedRoute role="customer">
              <SearchResults />
            </ProtectedRoute>
          }
        />
        <Route path="/customer/profile/:id" element={
          <ProtectedRoute role="customer">
            <ProfessionalProfile />
          </ProtectedRoute>
        } />

        <Route path="/customer/messages/:id" element={
          <ProtectedRoute role="customer">
            <CustomerMessages />
          </ProtectedRoute>
        } />
        <Route path="/customer/messages" element={
          <ProtectedRoute role="customer">
            <CustomerMessages />
          </ProtectedRoute>
        } />
        <Route path="/customer/checkout/:jobId" element={
          <ProtectedRoute role="customer">
            <PaymentCheckout />
          </ProtectedRoute>
        } />
        <Route path="/customer/payment-success/:jobId" element={
          <ProtectedRoute role="customer">
            <PaymentSuccess />
          </ProtectedRoute>
        } />
        <Route path="/customer/bookings" element={
          <ProtectedRoute role="customer">
            <Bookings />
          </ProtectedRoute>
        } />

        <Route
          path="/professional/home"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/messages"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/jobs"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/earnings"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalEarnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/reviews"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalReviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/notifications"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalNotifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/profile"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/signup/pending-approval" element={<PendingApproval />} />
        <Route path="/account-settings" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
