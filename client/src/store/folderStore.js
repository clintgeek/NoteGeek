import { create } from 'zustand';
import { getFoldersApi } from '../services/api';

const useFolderStore = create((set, get) => ({
    folders: [],
    isLoading: false,
    error: null,

    // Action to fetch folders
    fetchFolders: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
            const response = await getFoldersApi();
            set({ folders: response.data, isLoading: false });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch folders';
            set({ error: errorMessage, isLoading: false });
            console.error('Fetch folders error:', errorMessage);
        }
    },

    // TODO: Add create/update/delete folder actions

}));

export default useFolderStore;