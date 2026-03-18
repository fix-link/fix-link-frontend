import { type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

interface Props {
  children: JSX.Element;
  role?: "customer" | "professional";
}

const ProtectedRoute = ({ children, role }: Props) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  // Bypass verification check for testing as requested by user
  /*
  if (role === "professional" && user?.is_verified_professional === false) {
    return <Navigate to="/signup/pending-approval" replace />;
  }
  */

  return children;
};

export default ProtectedRoute;
