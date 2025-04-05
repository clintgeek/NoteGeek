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
            set({ tags: response.data, isLoading: false }); // API returns sorted array of strings
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch tags';
            set({ error: errorMessage, isLoading: false });
            console.error('Fetch tags error:', errorMessage);
        }
    },

}));

export default useTagStore;