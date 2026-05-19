import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE,
});


// attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
    getById: (id: number) =>
        api.get(`/rooms/${id}`),
    getContent: (id: number) =>
        api.get(`/rooms/${id}/content`),
    saveContent: (id: number, content: string) =>
        api.put(`/rooms/${id}/save`, { content }),
};


// Piston API - free, no key needed


export const LANGUAGE_IDS: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    go: 'go',
    rust: 'rust',
};

export const executeCode = async (code: string, language: string): Promise<string> => {
    const res = await api.post('/execute', { code, language });
    return res.data;
};

export default api;