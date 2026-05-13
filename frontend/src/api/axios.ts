import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async error => {
    if (!error.response) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'network' } }));
    } else if (error.response.status === 401) {
      await auth.signOut().catch(() => {});
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    } else if (error.response.status >= 500) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'server' } }));
    }
    return Promise.reject(error);
  }
);

export default api;
