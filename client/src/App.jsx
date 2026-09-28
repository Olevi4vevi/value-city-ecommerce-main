import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Admin pages and layouts
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import Categories from './pages/Categories';
import Stock from './pages/Stock';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminLayout from './layouts/AdminLayout';
import HostGuard from './components/HostGuard';

// Customer pages and layouts
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CustomerDashboard from './pages/CustomerDashboard';
import CustomerOrderHistory from './pages/CustomerOrderHistory';
import CustomerReports from './pages/CustomerReports';
import CustomerLayout from './layouts/CustomerLayout';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import Cart from './pages/Cart';

function App() {
  // 'checking' -> verifying an existing admin session, 'in' -> admin logged in, 'out' -> not logged in
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) return setStatus('out');

    axios.get('http://localhost:5000/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => setStatus('in'))
      .catch(() => {
        sessionStorage.clear();
        setStatus('out');
      });
  }, []);

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          sessionStorage.clear();
          setStatus('out');
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setStatus('out');
  };

  return (
    <BrowserRouter>
      {/* HostGuard: admin.value.localhost -> admin routes only, value.localhost -> storefront only */}
      <HostGuard>
        <Routes>
          {/* Admin routes */}
          {status === 'checking' ? (
            <Route path="/admin/*" element={<div className="app-boot">Checking your session…</div>} />
          ) : status !== 'in' ? (
            <Route path="/admin/*" element={<Login onLoginSuccess={() => setStatus('in')} />} />
          ) : (
            <Route path="/admin" element={<AdminLayout onLogout={handleLogout} />}>
              {/* NOTE: relative paths (no leading "/") -- required for these to
                  nest correctly under the parent's "/admin" path. Leading
                  slashes here would make React Router treat them as absolute,
                  breaking the /admin prefix entirely. */}
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="categories" element={<Categories />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="products/edit/:id" element={<EditProduct />} />
              <Route path="stock" element={<Stock />} />
              <Route path="users" element={<Users />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          )}

          {/* Public storefront + customer auth routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/cart" element={<Cart />} />

          {/* Logged-in customer routes -- wrapped in CustomerLayout for the sidebar */}
          <Route
            element={
              <CustomerProtectedRoute>
                <CustomerLayout />
              </CustomerProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<CustomerDashboard />} />
            <Route path="/orders" element={<CustomerOrderHistory />} />
            <Route path="/reports" element={<CustomerReports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HostGuard>
    </BrowserRouter>
  );
}

export default App;