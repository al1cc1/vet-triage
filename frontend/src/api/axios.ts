import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Restore token on page load
const stored = localStorage.getItem('vt_auth');
if (stored) {
  try {
    const { token } = JSON.parse(stored) as { token: string };
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } catch { /* ignore */ }
}

export default api;
