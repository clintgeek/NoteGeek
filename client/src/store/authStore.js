import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import useNoteStore from './noteStore';

const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                try {
                    set({ isLoading: true, error: null });
                    const response = await axios.post(import.meta.env.VITE_API_URL + '/auth/login', {
                        email,
                        password,
                    }, {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    const { token } = response.data;
                    if (!token) {
                        throw new Error('No token received from server');
                    }

                    // Dynamic import with proper await
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);

                    if (!decoded || !decoded.id || !decoded.email) {
                        throw new Error('Invalid token structure');
                    }

                    const newState = {
                        token,
                        user: {
                            id: decoded.id,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                        error: null,
                        isLoading: false
                    };
                    set(newState);

                    // Store token in localStorage as backup
                    try {
                        localStorage.setItem('auth_token', token);
                    } catch (e) {
                        console.warn('Failed to store token in localStorage:', e);
                    }

                    // Fetch notes after successful login
                    const noteStore = useNoteStore.getState();
                    await noteStore.fetchNotes();

                    return { success: true };
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
                    console.error('Authentication failed:', {
                        message: errorMessage,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                    set({
                        error: errorMessage,
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        user: null
                    });
                    return {
                        success: false,
                        error: errorMessage
                    };
                }
            },

            register: async (email, password) => {
                try {
                    const response = await axios.post('http://localhost:5001/api/auth/register', {
                        email,
                        password,
                    });

                    const { token } = response.data;

                    // Dynamic import
                    const { default: jwt_decode } = await import('jwt-decode');

                    const decoded = jwt_decode(token);

                    set({
                        token,
                        user: {
                            id: decoded.id,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                    });

                    return { success: true };
                } catch (error) {
                    console.error('Registration failed:', error.response?.data?.message || error.message);
                    return {
                        success: false,
                        error: error.response?.data?.message || 'Registration failed',
                    };
                }
            },

            logout: () => {
                localStorage.removeItem('auth_token');
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            hydrateUser: async () => {
                const state = get();
                console.log('Hydrating user. Current state:', {
                    hasToken: !!state.token,
                    isAuthenticated: state.isAuthenticated
                });

                // Try to get token from multiple sources
                let token = state.token;
                if (!token) {
                    try {
                        token = localStorage.getItem('auth_token');
                        if (token) {
                            console.log('Retrieved token from localStorage backup');
                        }
                    } catch (e) {
                        console.warn('Failed to read token from localStorage:', e);
                    }
                }

                if (!token) {
                    console.log('No token found during hydration');
                    set({
                        user: null,
                        isAuthenticated: false,
                        error: 'No authentication token found'
                    });
                    return false;
                }

                try {
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    console.log('Token validation:', {
                        expiresAt: new Date(decoded.exp * 1000).toISOString(),
                        currentTime: new Date(currentTime * 1000).toISOString(),
                        isExpired: decoded.exp < currentTime
                    });

                    if (decoded.exp < currentTime) {
                        console.log('Token expired - logging out');
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                            error: 'Session expired'
                        });
                        localStorage.removeItem('auth_token');
                        return false;
                    }

                    // Verify token structure
                    if (!decoded.id || !decoded.email) {
                        throw new Error('Invalid token structure');
                    }

                    set({
                        token,
                        user: {
                            id: decoded.id,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                        error: null
                    });
                    return true;
                } catch (error) {
                    console.error('Session validation failed:', {
                        error: error.message,
                        stack: error.stack
                    });
                    set({
                        token: null,
                        user: null,
                        isAuthenticated: false,
                        error: `Session validation failed: ${error.message}`
                    });
                    localStorage.removeItem('auth_token');
                    return false;
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                // Don't persist these states
                isAuthenticated: false,
                user: null,
                error: null,
                isLoading: false
            })
        }
    )
);

// Call hydrateUser on initial load if needed
// This should run once when the app loads
// useAuthStore.getState().hydrateUser();
// ^ Doing this here might be too early depending on load order.
// Better to call it from App.jsx or similar top-level component.

export default useAuthStore;