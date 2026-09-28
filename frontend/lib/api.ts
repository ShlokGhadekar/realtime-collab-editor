import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE,
});

// attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined' && token.length > 10) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }
    return config;
});

// handle auth errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    signup: (data: { username: string; email: string; password: string }) =>
        api.post('/auth/signup', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
};

export const roomApi = {
    create: (data: { name: string; language: string }) =>
        api.post('/rooms/create', data),
    join: (code: string) =>
        api.post(`/rooms/join/${code}`),
    myRooms: () =>
        api.get('/rooms/my-rooms'),
};

// must match CodeExecutionService.LANGUAGE_MAP on the backend
export const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];

export const executeCode = async (code: string, language: string): Promise<string> => {
    const res = await api.post('/execute', { code, language });
    return res.data;
};

export default api;