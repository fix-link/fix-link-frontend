import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/home/Home";
import EmailSignup from "./pages/signup/EmailSignup";
import VerifyOTP from "./pages/signup/VerifyOTP";
import ChooseRole from "./pages/auth/ChooseRole";
import CustomerRegister from "./pages/auth/customer/CustomerRegister";
import ProfessionalRegister from "./pages/auth/professional/ProfessionalRegister";
import CustomerHome from "./pages/auth/customer/CustomerHome";
import SearchResults from "./pages/auth/customer/SearchResults";
import ProfessionalHome from "./pages/auth/professional/ProfessionalHome"
import LoginPage from "./pages/auth/login";
import ForgotPassword from "./pages/auth/login/ForgotPassword";
import ResetPassword from "./pages/auth/login/ResetPassword";
import PendingApproval from "./pages/signup/PendingApproval";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
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
        <Route path="/reset-password" element={<ResetPassword />} />

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
        <Route
          path="/professional/home"
          element={
            <ProtectedRoute role="professional">
              <ProfessionalHome />
            </ProtectedRoute>
          }
        />

        <Route path="/signup/pending-approval" element={<PendingApproval />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
