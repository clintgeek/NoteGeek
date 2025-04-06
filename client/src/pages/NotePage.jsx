import React, { useEffect } from 'react';
import { useParams, useMatch } from 'react-router-dom';
import { CircularProgress, Alert, Box } from '@mui/material';
import useNoteStore from '../store/noteStore';
import NoteViewer from '../components/NoteViewer';
import NoteEditor from '../components/NoteEditor';

function NotePage() {
    const { id } = useParams();
    const isEditRoute = useMatch('/notes/:id/edit');
    const { fetchNoteById, isLoadingSelected, selectedError, selectedNote, clearSelectedNote } = useNoteStore();

    useEffect(() => {
        if (id) {
            fetchNoteById(id);
        }
        return () => clearSelectedNote();
    }, [id, fetchNoteById, clearSelectedNote]);

    if (isLoadingSelected && !selectedNote) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (!isEditRoute && selectedError && !selectedNote?.content) {
        return (
            <Alert severity="error">
                {selectedError || 'Could not load note.'}
            </Alert>
        );
    }

    if (!id || (!isLoadingSelected && !selectedNote && !isEditRoute)) {
        return <Alert severity="warning">Note not found.</Alert>;
    }

    return isEditRoute ? <NoteEditor /> : <NoteViewer />;
}

export default NotePage;