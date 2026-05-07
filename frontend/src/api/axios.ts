import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Restore token on page load
const stored = localStorage.getItem('vt_auth');
if (stored) {
  try {
    const { token } = JSON.parse(stored) as { token: string };
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch { /* ignore */ }
}

api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Network error or timeout
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'network' } }));
    } else if (error.response.status === 401) {
      // Session expired — clear storage and redirect
      localStorage.removeItem('vt_auth');
      delete api.defaults.headers.common['Authorization'];
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
