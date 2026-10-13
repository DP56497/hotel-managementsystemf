import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest;

api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status !== 401 || originalRequest?._retry || originalRequest?.url?.includes('/auth/refresh')) throw error;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw error;
  originalRequest._retry = true;
  refreshRequest ||= api.post('/auth/refresh', { refreshToken }, { _retry: true });
  try {
    const response = await refreshRequest;
    const nextAccessToken = response.data.accessToken || response.data.token;
    localStorage.setItem('token', nextAccessToken);
    if (response.data.refreshToken) localStorage.setItem('refreshToken', response.data.refreshToken);
    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return api(originalRequest);
  } catch (refreshError) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw refreshError;
  } finally {
    refreshRequest = undefined;
  }
});

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const getCurrentUser = () => api.get('/auth/me');
export const logoutUser = (refreshToken) => api.post('/auth/logout', { refreshToken });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const verifyResetToken = (token) => api.get(`/auth/verify-reset-token/${encodeURIComponent(token)}`);
export const getAnalytics = () => api.get('/analytics');
export const seedAnalytics = () => api.post('/analytics/seed');
export const getInventory = () => api.get('/inventory');
export const seedInventory = () => api.post('/inventory/seed');
export const getExpenses = () => api.get('/expenses');
export const createExpense = (payload) => api.post('/expenses', payload);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const seedExpenses = () => api.post('/expenses/seed');
export const getMenuItems = () => api.get('/menu');
export const createMenuItem = (payload) => api.post('/menu', payload);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);
export const seedMenuItems = () => api.post('/menu/seed');
export const getOrders = () => api.get('/orders');
export const createOrder = (payload) => api.post('/orders', payload);
export const updateOrder = (id, payload) => api.put(`/orders/${id}`, payload);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const createPaymentOrder = (id, paymentMethod) => api.post(`/orders/${id}/payment/order`, { paymentMethod });
export const verifyPayment = (id, payload) => api.post(`/orders/${id}/payment/verify`, payload);
export const confirmUpiTestPayment = (id) => api.post(`/orders/${id}/payment/upi-confirm`);
export const getMessages = () => api.get('/messages');
export const createMessage = (payload) => api.post('/messages', payload);
export const markMessagesRead = () => api.patch('/messages/read');
export const getUsers = () => api.get('/users');
export const createUser = (payload) => api.post('/users', payload);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getAiReports = () => api.get('/ai/reports');
export const markAiReportsRead = () => api.patch('/ai/reports/read');
export const askCopilot = (payload) => api.post('/ai/copilot', payload);
export const getCopilotHistory = () => api.get('/ai/copilot/history');
export const clearCopilotHistory = () => api.delete('/ai/copilot/history');
export const getTables = () => api.get('/tables');
export const updateTableStatus = (number, status) => api.put(`/tables/${number}/status`, { status });
export const markTableClean = (number) => api.put(`/tables/${number}/clean`);
export const markTableUnclean = (number) => api.put(`/tables/${number}/unclean`);
export const resetAllTablesClean = () => api.post('/tables/reset-all-clean');
