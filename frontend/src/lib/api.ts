import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Injeta o token JWT em todas as requisições
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('bb_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Redireciona para /login se receber 401
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('bb_token');
            localStorage.removeItem('bb_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
