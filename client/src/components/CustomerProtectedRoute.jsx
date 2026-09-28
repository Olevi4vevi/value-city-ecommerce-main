import React from 'react';
import { Navigate } from 'react-router-dom';

export default function CustomerProtectedRoute({ children }) {
  const token = localStorage.getItem('customerToken');
  return token ? children : <Navigate to="/login" replace />;
}
