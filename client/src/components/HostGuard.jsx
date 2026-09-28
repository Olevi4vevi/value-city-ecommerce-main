import { Navigate, useLocation } from 'react-router-dom';

export default function HostGuard({ children }) {
  const { pathname } = useLocation();
  const isAdminHost = window.location.hostname.startsWith('admin.');
  const isAdminPath = pathname.startsWith('/admin');

  if (isAdminHost && !isAdminPath) return <Navigate to="/admin" replace />;
  if (!isAdminHost && isAdminPath) return <Navigate to="/" replace />;

  return children;
}