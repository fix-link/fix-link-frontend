import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/home/Home";
import EmailSignup from "./pages/signup/EmailSignup";
import VerifyOTP from "./pages/signup/VerifyOTP";
import ChooseRole from "./pages/auth/ChooseRole";
import CustomerRegister from "./pages/auth/customer/CustomerRegister";
import Onboarding from "./pages/auth/Onboarding";
import ProfessionalRegister from "./pages/auth/professional/ProfessionalRegister";
import LoginPage from "./pages/auth/login";
import ForgotPassword from "./pages/auth/login/ForgotPassword";
import PendingApproval from "./pages/signup/PendingApproval";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import PageLoader from "./components/PageLoader";
import { useTheme } from "./context/ThemeContext";

const CustomerHome = lazy(() => import("./pages/auth/customer/CustomerHome"));
const SearchResults = lazy(() => import("./pages/auth/customer/SearchResults"));
const ProfessionalProfile = lazy(() => import("./pages/auth/customer/ProfessionalProfile"));
const CustomerMessages = lazy(() => import("./pages/auth/customer/CustomerMessages"));
const CustomerPostJob = lazy(() => import("./pages/auth/customer/CustomerPostJob"));
const CustomerJobs = lazy(() => import("./pages/auth/customer/CustomerJobs"));
const Bookings = lazy(() => import("./pages/auth/customer/Bookings"));
const PaymentCheckout = lazy(() => import("./pages/auth/customer/PaymentCheckout"));
const PaymentSuccess = lazy(() => import("./pages/auth/customer/PaymentSuccess"));
const AccountSettings = lazy(() => import("./pages/auth/customer/AccountSettings"));

const ProfessionalHome = lazy(() => import("./pages/auth/professional/ProfessionalHome"));
const ProfessionalMessages = lazy(() => import("./pages/auth/professional/ProfessionalMessages"));
const ProfessionalJobBoard = lazy(() => import("./pages/auth/professional/ProfessionalJobBoard"));
const ProfessionalJobs = lazy(() => import("./pages/auth/professional/ProfessionalJobs"));
const ProfessionalEarnings = lazy(() => import("./pages/auth/professional/ProfessionalEarnings"));
const ProfessionalReviews = lazy(() => import("./pages/auth/professional/ProfessionalReviews"));
const ProfessionalNotifications = lazy(() => import("./pages/auth/professional/ProfessionalNotifications"));

const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const ThemeManager = () => {
  const { theme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const isDashboard =
      location.pathname.startsWith("/customer") ||
      location.pathname.startsWith("/professional") ||
      location.pathname.startsWith("/account-settings");

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
        <Route path="/" element={<Home />} />
        <Route path="/signup/email" element={<EmailSignup />} />
        <Route path="/signup/verify" element={<VerifyOTP />} />
        <Route path="/signup/role" element={<ChooseRole />} />
        <Route
          path="/signup/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route path="/signup/customer" element={<CustomerRegister />} />
        <Route path="/signup/professional" element={<ProfessionalRegister />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/customer/home"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <CustomerHome />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/search"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <SearchResults />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/profile/:id"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <ProfessionalProfile />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/messages/:id"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <CustomerMessages />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/messages"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <CustomerMessages />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/checkout/:jobId"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <PaymentCheckout />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/payment-success/:jobId"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <PaymentSuccess />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/bookings"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <Bookings />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/post-job"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <CustomerPostJob />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/jobs"
          element={
            <ProtectedRoute role="customer">
              <LazyPage>
                <CustomerJobs />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route
          path="/professional/home"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalHome />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/messages"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalMessages />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/jobs"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalJobs />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/job-board"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalJobBoard />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/earnings"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalEarnings />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/reviews"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalReviews />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/notifications"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalNotifications />
              </LazyPage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/professional/profile"
          element={
            <ProtectedRoute role="professional">
              <LazyPage>
                <ProfessionalProfile />
              </LazyPage>
            </ProtectedRoute>
          }
        />

        <Route path="/signup/pending-approval" element={<PendingApproval />} />
        <Route
          path="/account-settings"
          element={
            <ProtectedRoute>
              <LazyPage>
                <AccountSettings />
              </LazyPage>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
