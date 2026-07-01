import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname;
      const isPublic = path === '/' || path.startsWith('/login') || path.startsWith('/register');
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      // Solo redirigir si estamos en una ruta privada y no es la comprobación de sesión inicial
      if (!isPublic && !isAuthCheck) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
