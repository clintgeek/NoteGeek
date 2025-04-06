import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    loginApi as login,
    registerApi as register,
    setToken,
    removeToken,
    getToken
} from '../services/api';

// Helper to decode JWT (basic, doesn't verify signature)
// A more robust solution might involve a library like jwt-decode
const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error('Failed to decode token:', e);
        return null;
    }
};


const useAuthStore = create(
    // Use persist middleware to save auth state to localStorage
    persist(
        (set, get) => ({
            token: getToken() || null,       // Initialize token from localStorage
            user: null,        // User info (decoded from token or fetched)
            isAuthenticated: false,
            isLoading: false,
            error: null,

            // Login action
            login: async (username, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await login({ username, password });
                    const { token } = response.data;
                    setToken(token);

                    // Decode user data from token
                    const decoded = decodeToken(token);
                    if (!decoded) {
                        throw new Error('Invalid token received');
                    }

                    set({
                        token,
                        user: {
                            id: decoded.id,
                            username: decoded.username
                        },
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return true;
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Login failed';
                    set({ error: errorMessage, isLoading: false, isAuthenticated: false });
                    console.error('Login error:', errorMessage);
                    removeToken();
                    return false;
                }
            },

            // Register action
            register: async (username, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await register({ username, password });
                    const { token } = response.data;
                    setToken(token);

                    // Decode user data from token
                    const decoded = decodeToken(token);
                    if (!decoded) {
                        throw new Error('Invalid token received');
                    }

                    set({
                        token,
                        user: {
                            id: decoded.id,
                            username: decoded.username
                        },
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return true;
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Registration failed';
                    set({ error: errorMessage, isLoading: false, isAuthenticated: false });
                    console.error('Registration error:', errorMessage);
                    removeToken();
                    return false;
                }
            },

            // Logout action
            logout: () => {
                removeToken();
                set({ token: null, user: null, isAuthenticated: false, error: null });
            },

            // Hydrate user from token
            hydrateUser: () => {
                const token = getToken();
                if (token) {
                    const decoded = decodeToken(token);
                    if (decoded && decoded.id) {
                        set({
                            token,
                            user: {
                                id: decoded.id,
                                username: decoded.username
                            },
                            isAuthenticated: true
                        });
                    } else {
                        // Invalid token
                        removeToken();
                        set({ token: null, user: null, isAuthenticated: false });
                    }
                }
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
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