import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — clear auth + redirect to the correct login page
// Uses persisted slug so lab staff land back on their lab login, not patient login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { slug } = useAuthStore.getState();
      const loginPath = slug ? `/lab/${slug}/login` : '/login';
      const isLoginPage = window.location.pathname === loginPath;
      if (!isLoginPage) {
        useAuthStore.getState().clearAuth();
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
