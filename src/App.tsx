import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import EmailSignup from "./pages/signup/EmailSignup";
import VerifyOTP from "./pages/signup/VerifyOTP";
import ChooseRole from "./pages/auth/ChooseRole";
import CustomerRegister from "./pages/auth/customer/CustomerRegister";
import ProfessionalRegister from "./pages/auth/professional/ProfessionalRegister";
import CustomerHome from "./pages/auth/customer/CustomerHome";
import SearchResults from "./pages/auth/customer/SearchResults";
import ProfessionalProfile from "./pages/auth/customer/ProfessionalProfile";
import CustomerMessages from "./pages/auth/customer/CustomerMessages";
import ProfessionalHome from "./pages/auth/professional/ProfessionalHome";
import ProfessionalMessages from "./pages/auth/professional/ProfessionalMessages";
import LoginPage from "./pages/auth/login";
import ForgotPassword from "./pages/auth/login/ForgotPassword";
import PendingApproval from "./pages/signup/PendingApproval";
import AccountSettings from "./pages/auth/customer/AccountSettings";
import Bookings from "./pages/auth/customer/Bookings";
import PaymentCheckout from "./pages/auth/customer/PaymentCheckout";
import PaymentSuccess from "./pages/auth/customer/PaymentSuccess";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />
        {/* Signup flow */}
        <Route path="/signup/email" element={<EmailSignup />} />
        <Route path="/signup/verify" element={<VerifyOTP />} />
        <Route path="/signup/role" element={<ChooseRole />} />

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
            // <ProtectedRoute role="customer">
              <CustomerHome />
            // {/* </ProtectedRoute> */}
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
            // <ProtectedRoute role="professional">
              <ProfessionalHome />
            // </ProtectedRoute>
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
          path="/professional/notifications"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalMessages />
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
