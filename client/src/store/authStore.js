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
                    const response = await axios.post('http://localhost:5001/api/auth/login', {
                        email,
                        password,
                    });

                    const { token } = response.data;

                    // Dynamic import with proper await
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);

                    const newState = {
                        token,
                        user: {
                            id: decoded.id,
                            email: decoded.email
                        },
                        isAuthenticated: true,
                    };
                    set(newState);

                    // Fetch notes after successful login
                    const noteStore = useNoteStore.getState();
                    await noteStore.fetchNotes();

                    return { success: true };
                } catch (error) {
                    console.error('Authentication failed:', error.response?.data?.message || error.message);
                    return {
                        success: false,
                        error: error.response?.data?.message || 'Login failed',
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
                set({
                    token: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            hydrateUser: async () => {
                const { token } = get();
                if (token) {
                    try {
                        const jwtDecode = (await import('jwt-decode')).jwtDecode;
                        const decoded = jwtDecode(token);
                        const currentTime = Date.now() / 1000;

                        if (decoded.exp < currentTime) {
                            console.log('Session expired - logging out');
                            set({
                                token: null,
                                user: null,
                                isAuthenticated: false,
                            });
                            return false;
                        }

                        set({
                            user: {
                                id: decoded.id,
                                email: decoded.email
                            },
                            isAuthenticated: true,
                        });
                        return true;
                    } catch (error) {
                        console.error('Session validation failed:', error.message);
                        set({
                            token: null,
                            user: null,
                            isAuthenticated: false,
                        });
                        return false;
                    }
                }
                return false;
            }
        }),
        {
            name: 'auth-storage',
        }
    )
);

// Call hydrateUser on initial load if needed
// This should run once when the app loads
// useAuthStore.getState().hydrateUser();
// ^ Doing this here might be too early depending on load order.
// Better to call it from App.jsx or similar top-level component.

export default useAuthStore;