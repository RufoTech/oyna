import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    // If not logged in, redirect to appropriate login page
    const loginPath = location.pathname.startsWith('/superadmin') 
      ? '/superadmin/login' 
      : '/login';
    
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in but doesn't have required role
    // Redirect Super Admins to their panel if they try to access Admin routes, and vice-versa
    const redirectPath = user.role === 'SUPER_ADMIN' ? '/superadmin' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
