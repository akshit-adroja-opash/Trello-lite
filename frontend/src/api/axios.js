import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

if (!import.meta.env.VITE_API_URL && !import.meta.env.DEV) {
    console.warn('WARNING: VITE_API_URL is undefined in non-development environment. API calls may fall back to localhost and fail.');
}

export const SERVER_URL = apiUrl.replace('/api/v1', '');

const API = axios.create({
    baseURL: apiUrl,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/refresh-token')) {
            originalRequest._retry = true;
            try {
                const res = await axios.post(`${API.defaults.baseURL}/auth/refresh-token`, {}, { withCredentials: true });
                const newToken = res.data?.data?.accessToken || res.data?.accessToken;
                if (newToken) {
                    localStorage.setItem('token', newToken);
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return API(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('token');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default API;
