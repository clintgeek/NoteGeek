import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { login as loginApi, register as registerApi, setToken, removeToken, getToken } from '../services/api';

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
            isAuthenticated: !!getToken(), // Initial auth state based on token presence
            isLoading: false,
            error: null,

            // Login action
            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await loginApi({ email, password });
                    const { token, ...userData } = response.data; // Separate token from user data
                    setToken(token); // Store token in localStorage via api service function
                    set({
                        token: token,
                        user: userData,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return true; // Indicate success
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Login failed';
                    set({ error: errorMessage, isLoading: false, isAuthenticated: false });
                    console.error('Login error:', errorMessage);
                    removeToken(); // Ensure token is removed on login failure
                    return false; // Indicate failure
                }
            },

            // Register action (similar to login)
            register: async (email, password) => {
                set({ isLoading: true, error: null });
                 try {
                    const response = await registerApi({ email, password });
                    const { token, ...userData } = response.data;
                    setToken(token);
                    set({
                        token: token,
                        user: userData,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return true; // Indicate success
                } catch (error) {
                    const errorMessage = error.response?.data?.message || 'Registration failed';
                    set({ error: errorMessage, isLoading: false, isAuthenticated: false });
                    console.error('Registration error:', errorMessage);
                    removeToken();
                    return false; // Indicate failure
                }
            },

            // Logout action
            logout: () => {
                removeToken(); // Remove token from localStorage
                set({ token: null, user: null, isAuthenticated: false, error: null });
                // No need to redirect here, component using the hook can handle it
            },

            // Action to potentially rehydrate user info if token exists but user state is lost (e.g. refresh)
            // This is basic - might need more robust check/API call later
            hydrateUser: () => {
                const token = get().token;
                if (token && !get().user) {
                    const decoded = decodeToken(token);
                    if (decoded && decoded.id) { // Check if token has user ID
                       // In a real app, you might want to fetch full user details here using decoded.id
                       // For now, just setting basic info might suffice if token payload is enough
                       // Or we can just rely on the initial token check
                       console.log('Attempting basic user hydration from token');
                       // set({ user: { _id: decoded.id /*, ... maybe email? */ } });
                       // For now, maybe just ensure isAuthenticated is true if token is valid
                       set({ isAuthenticated: true });
                    } else {
                         // Invalid token found during hydration check
                         get().logout();
                    }
                }
            }
        }),
        {
            name: 'auth-storage', // unique name for localStorage key
            storage: createJSONStorage(() => localStorage), // use localStorage
            partialize: (state) => ({ token: state.token }), // Only persist the token itself
             // onRehydrateStorage: () => (state) => state.hydrateUser(), // Run hydration check after loading token
             // onRehydrateStorage seems tricky, manual call might be better
        }
    )
);

// Call hydrateUser on initial load if needed
// This should run once when the app loads
// useAuthStore.getState().hydrateUser();
// ^ Doing this here might be too early depending on load order.
// Better to call it from App.jsx or similar top-level component.

export default useAuthStore;