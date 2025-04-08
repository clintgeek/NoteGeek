import { create } from 'zustand';
// Import all needed API functions
import {
    getNotesApi,
    getNoteByIdApi,
    createNoteApi,
    updateNoteApi,
    deleteNoteApi,
    searchNotesApi
} from '../services/api';

const useNoteStore = create((set, get) => {
    // Track debounce timer for selectedNote updates
    let selectedNoteTimer = null;

    return {
        notes: [],         // List of notes (metadata mainly)
        selectedNote: null, // Full data of the currently viewed/edited note
        isLoadingList: false,
        isLoadingSelected: false,
        error: null,
        listError: null,     // Differentiate list errors from selected note errors
        selectedError: null,
        searchResults: [],
        isSearching: false,
        searchError: null,
        lastFetchedNoteId: null, // Track the last successfully fetched note ID
        pendingNote: null,   // Store a pending note during transitions

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

            // Store the current note ID if needed for revalidation
            set({ isLoadingSelected: true, selectedError: null, lastFetchedNoteId: noteId });

            try {
                console.log("Store - Fetching note with ID:", noteId);
                const response = await getNoteByIdApi(noteId);
                console.log("Store - API response status:", response.status);
                console.log("Store - API response data:", JSON.stringify(response.data));

                // Check if we received valid note data
                if (!response.data || !response.data._id) {
                    console.error("Store - Invalid note data received:", response.data);
                    throw new Error("Invalid note data received from server");
                }

                // Clear any previous debounce timer
                if (selectedNoteTimer) {
                    clearTimeout(selectedNoteTimer);
                    selectedNoteTimer = null;
                }

                // Update loading state immediately but keep the old note for now
                set({ isLoadingSelected: false, pendingNote: response.data });

                // Update the note in the store, but wait a moment to ensure React has time to process
                selectedNoteTimer = setTimeout(() => {
                    console.log("Store - Setting selectedNote:", response.data._id);
                    set({ selectedNote: response.data, pendingNote: null });
                    console.log("Store - Updated selectedNote in state:", response.data._id);
                }, 20);

                // Handle locked notes message from API if needed
                if (response.data.message && response.data.isLocked) {
                    set({ selectedError: response.data.message }); // Display lock message as error/info
                }

                return response.data; // Return fetched note
            } catch (error) {
                console.error('Store - Fetch note by ID error details:', error);
                const errorMessage = error.response?.data?.message || 'Failed to fetch note';
                const statusCode = error.response?.status;

                // Now it's safe to clear the selectedNote since we have a confirmed error
                // Handle specific error cases
                if (statusCode === 401) {
                    set({ selectedError: 'Authentication error: Please log in again', isLoadingSelected: false, selectedNote: null });
                } else if (statusCode === 404) {
                    set({ selectedError: 'Note not found', isLoadingSelected: false, selectedNote: null });
                } else {
                    set({ selectedError: errorMessage, isLoadingSelected: false, selectedNote: null });
                }

                console.error(`Store - Fetch note by ID error (${statusCode}):`, errorMessage);
                return null; // Return null on error
            }
        },

        // Select Note (clears selection)
        clearSelectedNote: () => {
            // Only clear if not in the middle of loading
            if (!get().isLoadingSelected) {
                // Clear any pending timer
                if (selectedNoteTimer) {
                    clearTimeout(selectedNoteTimer);
                    selectedNoteTimer = null;
                }
                set({ selectedNote: null, selectedError: null, lastFetchedNoteId: null, pendingNote: null });
            }
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

        searchNotes: async (query) => {
            set({ isSearching: true, searchError: null });
            try {
                const response = await searchNotesApi(query);
                set({ searchResults: response.data, isSearching: false });
            } catch (error) {
                console.error('Search notes error:', error);
                set({
                    searchError: error.message || 'Failed to search notes',
                    isSearching: false
                });
            }
        },

        clearSearchResults: () => {
            set({ searchResults: [], searchError: null });
        }
    };
});

export default useNoteStore;