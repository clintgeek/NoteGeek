import { create } from 'zustand';
// Import all needed API functions
import {
    getNotesApi,
    getNoteByIdApi,
    createNoteApi,
    updateNoteApi,
    deleteNoteApi
} from '../services/api';

const useNoteStore = create((set, get) => ({
    notes: [],         // List of notes (metadata mainly)
    selectedNote: null, // Full data of the currently viewed/edited note
    isLoadingList: false,
    isLoadingSelected: false,
    error: null,
    listError: null,     // Differentiate list errors from selected note errors
    selectedError: null,

    // Action to fetch notes list
    fetchNotes: async (filters = {}) => {
        if (get().isLoadingList) return;
        set({ isLoadingList: true, listError: null });
        try {
            const response = await getNotesApi(filters);
            set({ notes: response.data, isLoadingList: false });
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch notes';
            set({ listError: errorMessage, isLoadingList: false });
            console.error('Fetch notes error:', errorMessage);
        }
    },

    // Action to fetch a single note by ID
    fetchNoteById: async (noteId) => {
        if (get().isLoadingSelected) return;
        set({ isLoadingSelected: true, selectedError: null, selectedNote: null }); // Clear previous selection
        try {
            const response = await getNoteByIdApi(noteId);
            set({ selectedNote: response.data, isLoadingSelected: false });
             // Handle locked notes message from API if needed - already in response.data?
            if (response.data.message && response.data.isLocked) {
                 set({ selectedError: response.data.message }); // Display lock message as error/info
            }
            return response.data; // Return fetched note
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to fetch note';
            set({ selectedError: errorMessage, isLoadingSelected: false });
            console.error('Fetch note by ID error:', errorMessage);
            return null; // Return null on error
        }
    },

    // Select Note (clears selection)
    clearSelectedNote: () => {
         set({ selectedNote: null, selectedError: null });
    },

    // Action to create a note
    createNote: async (noteData) => {
        set({ isLoadingSelected: true, selectedError: null }); // Use selected loading/error state
        try {
            const response = await createNoteApi(noteData);
            set({ selectedNote: response.data, isLoadingSelected: false });
            // Optionally refetch the notes list or add locally?
            // get().fetchNotes(); // Could trigger list refresh
            // Or add to list state directly for faster UI update:
            // set((state) => ({ notes: [response.data, ...state.notes] }));
            return response.data; // Return created note
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create note';
            set({ selectedError: errorMessage, isLoadingSelected: false });
            console.error('Create note error:', errorMessage);
            return null;
        }
    },

    // Action to update a note
    updateNote: async (noteId, noteData) => {
        set({ isLoadingSelected: true, selectedError: null });
         try {
            const response = await updateNoteApi(noteId, noteData);
            set({ selectedNote: response.data, isLoadingSelected: false });
            // Optionally refetch the notes list or update locally
             // get().fetchNotes();
             // Or update in list state:
             // set((state) => ({
             //     notes: state.notes.map(n => n._id === noteId ? response.data : n)
             // }));
            return response.data; // Return updated note
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update note';
            set({ selectedError: errorMessage, isLoadingSelected: false });
            console.error('Update note error:', errorMessage);
            return null;
        }
    },

    // Action to delete a note
    deleteNote: async (noteId) => {
        set({ isLoadingSelected: true, selectedError: null }); // Can use selected or list loading state
        try {
            await deleteNoteApi(noteId);
            set({ selectedNote: null, isLoadingSelected: false }); // Clear selection on delete
            // Refetch or remove from list
             get().fetchNotes(); // Easiest way to refresh list
            // Or remove from list state:
            // set((state) => ({ notes: state.notes.filter(n => n._id !== noteId) }));
            return true; // Indicate success
        } catch (error) {
             const errorMessage = error.response?.data?.message || 'Failed to delete note';
            set({ selectedError: errorMessage, isLoadingSelected: false });
            console.error('Delete note error:', errorMessage);
            return false;
        }
    },

}));

export default useNoteStore;