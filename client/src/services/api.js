import axios from 'axios';
import { toast } from 'sonner';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Request failed';
    const url = err.config?.url || '';
    const silent401 = url.includes('/api/auth/me');
    const status = err.response?.status;
    if (status === 401 && !silent401) {
      toast.error('Session expired or unauthorized.');
    } else if (status && status !== 404 && status !== 401) {
      toast.error(msg);
    } else if (!err.response) {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

export const API_BASE = baseURL;
