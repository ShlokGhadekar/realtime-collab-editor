import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Room {
    id: number;
    name: string;
    code: string;
    language: string;
    content: string;
    ownerUsername: string;
    memberUsernames: string[];
    memberCount: number;
}

// ---- session (JWT in localStorage) ----

export interface Session {
    token: string;
    username: string;
}

const isExpired = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
};

export const getSession = (): Session | null => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username && !isExpired(token) ? { token, username } : null;
};

export const saveSession = ({ token, username }: Session) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
};

export const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
};

// ---- HTTP ----

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
    const session = getSession();
    if (session) config.headers.Authorization = `Bearer ${session.token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            clearSession();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// the backend returns { error: "..." } for handled failures
export const errorMessage = (err: unknown, fallback: string): string => {
    if (axios.isAxiosError(err) && !err.response) {
        return "Can't reach the server. It may be waking up, so try again in a few seconds.";
    }
    return (axios.isAxiosError(err) && err.response?.data?.error) || fallback;
};

export const authApi = {
    signup: (data: { username: string; email: string; password: string }) =>
        api.post<Session>('/auth/signup', data),
    login: (data: { email: string; password: string }) =>
        api.post<Session>('/auth/login', data),
};

export const roomApi = {
    create: (data: { name: string; language: string }) =>
        api.post<Room>('/rooms/create', data),
    join: (code: string) =>
        api.post<Room>(`/rooms/join/${code}`),
    myRooms: () =>
        api.get<Room[]>('/rooms/my-rooms'),
};

// keys must match CodeExecutionService.LANGUAGE_MAP on the backend
export const LANGUAGES: Record<string, { label: string; color: string; comment: string }> = {
    javascript: { label: 'JavaScript', color: '#f1e05a', comment: '//' },
    typescript: { label: 'TypeScript', color: '#3178c6', comment: '//' },
    python: { label: 'Python', color: '#3572a5', comment: '#' },
    java: { label: 'Java', color: '#b07219', comment: '//' },
    cpp: { label: 'C++', color: '#f34b7d', comment: '//' },
    go: { label: 'Go', color: '#00add8', comment: '//' },
    rust: { label: 'Rust', color: '#dea584', comment: '//' },
};

export const executeCode = async (code: string, language: string): Promise<string> => {
    const res = await api.post<string>('/execute', { code, language });
    return res.data;
};
