import { create } from 'zustand';
import { getTagsApi } from '../services/api';

const useTagStore = create((set, get) => ({
    tags: [],
    isLoading: false,
    error: null,

    // Action to fetch unique tags
    fetchTags: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            const response = await getTagsApi();
            console.log('Tags response:', response); // Add logging
            if (response.data) {
                set({ tags: response.data, isLoading: false }); // API returns sorted array of strings
            } else {
                throw new Error('No tags data received');
            }
        } catch (error) {
            console.error('Fetch tags error:', error); // Enhanced error logging
            const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tags';
            set({ error: errorMessage, isLoading: false });
        }
    },

    // Action to add a new tag to the local state
    addTag: (newTag) => {
        set((state) => {
            // Only add if it's not already in the list
            if (!state.tags.includes(newTag)) {
                return { tags: [...state.tags, newTag].sort() };
            }
            return state;
        });
    },

    // Clear tags (useful for logout)
    clearTags: () => {
        set({ tags: [], error: null });
    },
}));

export default useTagStore;