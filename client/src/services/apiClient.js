import axios from 'axios';
import { supabase } from '../lib/supabase';

<<<<<<< HEAD
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

const apiClient = axios.create({
  baseURL: API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`,
=======
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api',
>>>>>>> 11356bc61b67774ed4c47097bbbbc1ae30e89a64
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // Increased for AI processing retries
});

// Automatically attach Supabase session token to every request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
