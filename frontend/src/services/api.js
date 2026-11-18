import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — improved error logging
// Do NOT clear token or redirect here; auth state is managed by AuthContext.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error details for debugging
    if (error.response) {
      console.error(`API Error [${error.response.status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response.data?.message || error.response.statusText);
    } else if (error.request) {
      console.error(`API Network Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} — Is the backend server running on ${API_URL}?`);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getDashboardStats: () => api.get('/tasks/dashboard/stats'),
};

// Health check — returns { status, tables } from backend
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
