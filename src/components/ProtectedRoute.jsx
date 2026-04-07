// src/components/ProtectedRoute.jsx
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles ?? []);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const logout = useAuthStore((state) => state.logout);

  const isExpired = Boolean(expiresAt && new Date(expiresAt) < new Date());

  useEffect(() => {
    if (isExpired) {
      logout();
    }
  }, [isExpired, logout]);

  if (!token || isExpired) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length && !roles.some((role) => allowedRoles.includes(role))) {
    // Store attempted path for better UX
    sessionStorage.setItem('unauthorizedRedirect', location.pathname);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;