import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => api.post('/customer-auth/register', data);
export const loginUser = (data) => api.post('/customer-auth/login', data);
export const verifyEmail = (data) => api.post('/customer-auth/verify-email', data);
export const resendVerificationCode = (data) => api.post('/customer-auth/resend-verification', data);
export const confirmReactivation = (data) => api.post('/customer-auth/confirm-reactivation', data);
export const forgotPassword = (data) => api.post('/customer-auth/forgot-password', data);
export const resetPassword = (data) => api.post('/customer-auth/reset-password', data);

export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const changePassword = (data) => api.put('/profile/password', data);
export const deleteAccount = () => api.delete('/profile');
export const deactivateAccount = () => api.put('/profile/deactivate');

export const getOrders = () => api.get('/orders');
export const getOrderDetail = (orderId) => api.get(`/orders/${orderId}`);
export const cancelOrder = (orderId) => api.put(`/orders/${orderId}/cancel`);

export const getSpendingSummary = (range) => api.get('/customer-reports/spending-summary', { params: { range } });
export const getSpendingSummaryReport = (startDate, endDate) =>
  api.get('/customer-reports/spending-summary', { params: { startDate, endDate } });

export const getPublicProducts = () => api.get('/products');
export const getPublicProduct = (id) => api.get(`/products/${id}`);
export const getPublicCategories = () => api.get('/categories');

export const getCart = () => api.get('/cart');
export const addToCartApi = (product_id, quantity) => api.post('/cart', { product_id, quantity });
export const removeFromCartApi = (product_id) => api.delete(`/cart/${product_id}`);

export default api;