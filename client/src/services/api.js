import axios from 'axios';

// Define the base URL for the API
const API_BASE_URL = import.meta.env.DEV
    ? 'http://localhost:5001/api'  // Development
    : '/api';                      // Production

// Create an axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required for cookies/session
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for auth errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('API Response Error:', error);
        return Promise.reject(error);
    }
);

// Auth
export const loginApi = (credentials) => apiClient.post('/auth/login', credentials);
export const registerApi = (userData) => apiClient.post('/auth/register', userData);
export const logoutApi = () => apiClient.post('/auth/logout');
export const getMeApi = () => apiClient.get('/auth/me');

// Notes
export const getNotesApi = (filters = {}) => apiClient.get('/notes', { params: filters });
export const getNoteByIdApi = (id) => apiClient.get(`/notes/${id}`);
export const createNoteApi = (noteData) => apiClient.post('/notes', noteData);
export const updateNoteApi = (id, noteData) => apiClient.put(`/notes/${id}`, noteData);
export const deleteNoteApi = (id) => apiClient.delete(`/notes/${id}`);

// Tags
export const getTagsApi = () => apiClient.get('/tags');

// Folders
export const createFolderApi = (folderData) => apiClient.post('/folders', folderData);
export const getFoldersApi = () => apiClient.get('/folders');
export const updateFolderApi = (folderId, folderData) => apiClient.put(`/folders/${folderId}`, folderData);
export const deleteFolderApi = (folderId, cascade = false) => apiClient.delete(`/folders/${folderId}?deleteNotes=${cascade}`);

// Search
export const searchNotesApi = (query) => apiClient.get(`/search?q=${encodeURIComponent(query)}`);

// Export the utility functions
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
};
export const removeToken = () => localStorage.removeItem('token');

export default apiClient; // Export the configured instance for direct use if needed