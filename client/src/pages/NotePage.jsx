import React, { useEffect } from 'react';
import { useParams, useMatch } from 'react-router-dom';
import useNoteStore from '../store/noteStore';
import NoteViewer from '../components/NoteViewer';
import NoteEditor from '../components/NoteEditor';
import { Loader, Alert, Center } from '@mantine/core';

function NotePage() {
    const { id } = useParams();
    const isEditRoute = useMatch('/notes/:id/edit'); // Check if the current route matches the edit pattern
    const { fetchNoteById, isLoadingSelected, selectedError, selectedNote, clearSelectedNote } = useNoteStore();

    useEffect(() => {
        if (id) {
            fetchNoteById(id);
        }
        // Cleanup function to clear selected note when navigating away
        return () => clearSelectedNote();
    }, [id, fetchNoteById, clearSelectedNote]);

    // Handle loading state specifically for fetching the note itself
    // NoteEditor has its own internal loading overlay for save/load within edit mode
    if (isLoadingSelected && !selectedNote) {
        return <Center><Loader /></Center>;
    }

    // Handle error state IF we are trying to VIEW and the note wasn't loaded (e.g., 404)
    // Error during edit is handled within NoteEditor
    // Error due to lock is handled within NoteViewer
    if (!isEditRoute && selectedError && !selectedNote?.content) {
         return (
             <Alert color="red" title="Error">
                 {selectedError || 'Could not load note.'}
             </Alert>
         );
    }

    // If no ID, or note not found (and not loading/error state handled above)
    if (!id || (!isLoadingSelected && !selectedNote && !isEditRoute)) {
         return <Alert color="orange">Note not found.</Alert>;
    }

    // Render Editor or Viewer based on route
    return isEditRoute ? <NoteEditor /> : <NoteViewer />;
}

export default NotePage;