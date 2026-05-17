import axios from 'axios';

const API_BASE = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE,
});

// automatically attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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
};

export default api;