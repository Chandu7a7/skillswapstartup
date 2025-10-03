// client/src/components/AdminRoute.jsx
import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is logged in AND their role is 'admin', show the content.
  if (user && user.role === 'admin') {
    return <Outlet />;
  }

  // Otherwise, redirect them to their normal dashboard.
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;