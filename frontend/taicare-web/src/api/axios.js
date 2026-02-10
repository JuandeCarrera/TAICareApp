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
        // Aquí podríamos manejar errores globales, como redirección al login en 401
        // si no estamos ya en login/registro.
        if (error.response?.status === 401) {
            // Opcional: Notificar o redirigir
            console.warn('No autorizado / Sesión expirada');
        }
        return Promise.reject(error);
    }
);

export default api;
