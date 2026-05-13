export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const WS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws-native'
  : 'ws://localhost:8081/ws-native';
