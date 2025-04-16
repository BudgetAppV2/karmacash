// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logger from '../services/logger';

/**
 * ProtectedRoute component that redirects to login if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @param {boolean} [props.requireVerification=false] - Whether email verification is required
 * @returns {React.ReactNode} - The protected component or a redirect
 */
const ProtectedRoute = ({ children, requireVerification = false }) => {
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    logger.debug('ProtectedRoute', 'routeGuard', 'Unauthenticated user, redirecting to login', {
      path: location.pathname
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If verification is required and email is not verified, redirect to verification page
  if (requireVerification && !isEmailVerified) {
    logger.debug('ProtectedRoute', 'routeGuard', 'Unverified user, redirecting to verification', {
      userId: user.uid,
      path: location.pathname
    });
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // User is authenticated and verified (if required), render the protected component
  logger.debug('ProtectedRoute', 'routeGuard', 'Access granted to protected route', {
    userId: user.uid,
    path: location.pathname
  });
  return children;
};

export default ProtectedRoute;