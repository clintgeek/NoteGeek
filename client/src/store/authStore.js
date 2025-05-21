import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import useNoteStore from './noteStore';

// Define the GeekBase SSO URL
const BASE_GEEK_URL = import.meta.env.VITE_BASE_GEEK_URL || 'http://localhost:3000';

const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            useSSO: true, // Default to using SSO

            // Function to initiate SSO login
            initiateSSO: () => {
                try {
                    // Generate a random state for CSRF protection
                    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    console.log('Initiating SSO with state:', state);

                    // Store state in sessionStorage for validation
                    sessionStorage.setItem('sso_state', state);

                    // Store current path for redirect after login
                    const currentPath = window.location.pathname;
                    if (currentPath !== '/login' && currentPath !== '/register') {
                        sessionStorage.setItem('sso_redirect', currentPath);
                    }

                    // Build the redirect URL
                    const callbackUrl = window.location.origin + '/auth/callback';
                    const ssoUrl = new URL('/login', BASE_GEEK_URL);

                    // Add parameters for the SSO
                    ssoUrl.searchParams.set('app', 'notegeek');
                    ssoUrl.searchParams.set('callback', encodeURIComponent(callbackUrl));
                    ssoUrl.searchParams.set('state', state);

                    console.log('Redirecting to GeekBase SSO:', ssoUrl.toString());

                    // Redirect to GeekBase login
                    window.location.href = ssoUrl.toString();
                } catch (error) {
                    console.error('Failed to initiate SSO:', error);
                    set({ error: 'Failed to initiate SSO. Please try again.' });
                    return { success: false, error: 'Failed to initiate SSO' };
                }
            },

            // Handle JWT from SSO callback
            setSSO: async (token, refreshToken) => {
                try {
                    console.log('Setting SSO tokens');

                    if (!token) {
                        throw new Error('Missing token');
                    }

                    // Dynamic import
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;

                    try {
                        const decoded = jwtDecode(token);
                        console.log('Token decoded successfully');

                        if (!decoded || !decoded.id) {
                            throw new Error('Invalid token structure');
                        }

                        // Set auth state
                        set({
                            token,
                            refreshToken,
                            user: {
                                id: decoded.id,
                                email: decoded.email,
                                username: decoded.username
                            },
                            isAuthenticated: true,
                            error: null,
                            isLoading: false
                        });

                        // Store token in localStorage as backup
                        try {
                            localStorage.setItem('auth_token', token);
                            if (refreshToken) {
                                localStorage.setItem('refresh_token', refreshToken);
                            }
                        } catch (e) {
                            console.warn('Failed to store tokens in localStorage:', e);
                        }

                        // Try to fetch notes after successful login
                        try {
                            const noteStore = useNoteStore.getState();
                            await noteStore.fetchNotes();
                        } catch (noteError) {
                            console.error('Failed to fetch notes after SSO login:', noteError);
                        }

                        return { success: true };
                    } catch (decodeError) {
                        console.error('Failed to decode token:', decodeError);
                        throw new Error('Invalid token format: ' + decodeError.message);
                    }
                } catch (error) {
                    console.error('SSO authentication failed:', error);
                    set({
                        error: error.message || 'SSO login failed',
                        isLoading: false,
                        isAuthenticated: false,
                        token: null,
                        refreshToken: null,
                        user: null
                    });
                    return { success: false, error: error.message };
                }
            },

            // Legacy direct login (fallback)
            login: async (email, password) => {
                // If SSO is enabled, redirect to SSO flow
                if (get().useSSO) {
                    get().initiateSSO();
                    return { redirected: true };
                }

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
                        refreshToken: null,
                        user: null
                    });
                    return {
                        success: false,
                        error: errorMessage
                    };
                }
            },

            // Legacy direct register (fallback)
            register: async (email, password) => {
                // If SSO is enabled, redirect to SSO registration
                if (get().useSSO) {
                    // Store a flag to indicate registration intent
                    sessionStorage.setItem('sso_intent', 'register');
                    get().initiateSSO();
                    return { redirected: true };
                }

                try {
                    const response = await axios.post(import.meta.env.VITE_API_URL + '/auth/register', {
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
                localStorage.removeItem('refresh_token');
                set({
                    token: null,
                    refreshToken: null,
                    user: null,
                    isAuthenticated: false,
                });
            },

            refreshSSO: async () => {
                const state = get();
                if (!state.refreshToken) return false;

                try {
                    const response = await axios.post(`${BASE_GEEK_URL}/api/auth/refresh`, {
                        refreshToken: state.refreshToken,
                        app: 'notegeek'
                    }, {
                        withCredentials: true
                    });

                    const { token, refreshToken } = response.data;

                    // Dynamic import
                    const jwtDecode = (await import('jwt-decode')).jwtDecode;
                    const decoded = jwtDecode(token);

                    set({
                        token,
                        refreshToken,
                        user: {
                            id: decoded.id,
                            email: decoded.email,
                            username: decoded.username
                        },
                        isAuthenticated: true,
                        error: null
                    });

                    // Update localStorage backup
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('refresh_token', refreshToken);

                    return true;
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    set({
                        token: null,
                        refreshToken: null,
                        user: null,
                        isAuthenticated: false,
                        error: 'Session expired'
                    });
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    return false;
                }
            },

            hydrateUser: async () => {
                const state = get();
                console.log('Hydrating user. Current state:', {
                    hasToken: !!state.token,
                    hasRefreshToken: !!state.refreshToken,
                    isAuthenticated: state.isAuthenticated
                });

                // Try to get tokens from multiple sources
                let token = state.token;
                let refreshToken = state.refreshToken;

                if (!token) {
                    try {
                        token = localStorage.getItem('auth_token');
                        refreshToken = localStorage.getItem('refresh_token');
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
                        console.log('Token expired - attempting refresh');

                        // Try to refresh the token with SSO if we have a refresh token
                        if (refreshToken && get().useSSO) {
                            const refreshed = await get().refreshSSO();
                            if (refreshed) return true;
                        }

                        console.log('Token refresh failed or not available - logging out');
                        set({
                            token: null,
                            refreshToken: null,
                            user: null,
                            isAuthenticated: false,
                            error: 'Session expired'
                        });
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('refresh_token');
                        return false;
                    }

                    // Verify token structure
                    if (!decoded.id) {
                        throw new Error('Invalid token structure');
                    }

                    set({
                        token,
                        refreshToken,
                        user: {
                            id: decoded.id,
                            email: decoded.email,
                            username: decoded.username
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
                        refreshToken: null,
                        user: null,
                        isAuthenticated: false,
                        error: `Session validation failed: ${error.message}`
                    });
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    return false;
                }
            },

            // Toggle SSO usage
            toggleSSO: (value) => {
                set({ useSSO: value !== undefined ? value : !get().useSSO });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                refreshToken: state.refreshToken,
                useSSO: state.useSSO,
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