import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ token, role, requireRole, children }) {
  const location = useLocation();
  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  if (requireRole && role !== requireRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

