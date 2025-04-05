import axios from 'axios';

// Define the base URL for the API. Adjust if your backend runs on a different port locally.
// Use VITE_API_URL environment variable if available, otherwise default.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies/credentials with requests
});

// --- JWT Token Handling ---

// Function to get the token from localStorage
const getToken = () => {
  return localStorage.getItem('notegeek-token');
};

// Function to set the token in localStorage
const setToken = (token) => {
  if (token) {
    localStorage.setItem('notegeek-token', token);
  } else {
    localStorage.removeItem('notegeek-token');
  }
};

// Function to remove the token from localStorage
const removeToken = () => {
  localStorage.removeItem('notegeek-token');
};

// --- Axios Request Interceptor ---
// Add the JWT token to the Authorization header for all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor ---
// Handle 401 Unauthorized errors (e.g., token expired)
// TODO: Enhance this later to potentially use refresh tokens or redirect intelligently
apiClient.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized request - 401', error.response);
      // Remove the invalid/expired token
      removeToken();
      // Redirect to login page
      // Use window.location for simplicity here, or integrate with react-router history
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
      // Optionally: Could dispatch a logout action if using global state
    }
    // Return the error to be handled by the calling code
    return Promise.reject(error);
  }
);


// --- API Service Functions ---

// Auth
export const register = (userData) => apiClient.post('/auth/register', userData);
export const login = (userData) => apiClient.post('/auth/login', userData);

// Notes
export const createNoteApi = (noteData) => apiClient.post('/notes', noteData);
export const getNotesApi = (filters = {}) => {
    // Build query string from filters object
    const params = new URLSearchParams();
    if (filters.folderId) {
        params.append('folderId', filters.folderId);
    }
    if (filters.tag) {
        params.append('tag', filters.tag);
    }
    const queryString = params.toString();
    return apiClient.get(`/notes${queryString ? '?' + queryString : ''}`);
};
export const getNoteByIdApi = (noteId) => apiClient.get(`/notes/${noteId}`);
export const updateNoteApi = (noteId, noteData) => apiClient.put(`/notes/${noteId}`, noteData);
export const deleteNoteApi = (noteId) => apiClient.delete(`/notes/${noteId}`);
// TODO: Add unlockNoteApi endpoint call later

// Folders
export const createFolderApi = (folderData) => apiClient.post('/folders', folderData);
export const getFoldersApi = () => apiClient.get('/folders');
export const updateFolderApi = (folderId, folderData) => apiClient.put(`/folders/${folderId}`, folderData);
export const deleteFolderApi = (folderId, cascade = false) => apiClient.delete(`/folders/${folderId}?deleteNotes=${cascade}`);

// Tags
export const getTagsApi = () => apiClient.get('/tags');

// Search
export const searchNotesApi = (query) => apiClient.get(`/search?q=${encodeURIComponent(query)}`);


// Export the utility functions and the configured axios instance
export {
    getToken,
    setToken,
    removeToken,
};

export default apiClient; // Export the configured instance for direct use if needed