import axios from 'axios';
import { local, session, cookies } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

//  Try all three storages for token
const getToken = (): string | null => {
  return (
    local.get<string>('token') ||
    session.get<string>('token') ||
    cookies.get('token')
  );
};

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      local.remove('token');
      local.remove('user');
      session.remove('token');
      session.remove('user');
      cookies.remove('token');
      cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;