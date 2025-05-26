import React, { useEffect, useState, useRef } from 'react';
import { useParams, useMatch, useNavigate } from 'react-router-dom';
import { CircularProgress, Alert, Box, Button } from '@mui/material';
import useNoteStore from '../store/noteStore';
import useAuthStore from '../store/authStore';
import NoteViewer from '../components/NoteViewer';
import NoteEditor from '../components/NoteEditor';
import Sidebar from '../components/Sidebar';
import { NOTE_TYPES } from '../components/NoteEditor';

function NotePage() {
    const { id } = useParams();
    const isEditRoute = useMatch('/notes/:id/edit');
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const {
        fetchNoteById,
        isLoadingSelected,
        selectedError,
        selectedNote,
        pendingNote,
        clearSelectedNote
    } = useNoteStore();
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const lastFetchedId = useRef(null);
    const noteWasLoaded = useRef(false);

    useEffect(() => {
        // Only fetch if we have an ID and it's not 'new' and user is authenticated
        if (id && id !== 'new' && isAuthenticated) {
            lastFetchedId.current = id;
            fetchNoteById(id)
                .then(data => {
                    if (data && data._id) {
                        noteWasLoaded.current = true;
                    }
                    setFetchAttempted(true);
                })
                .catch(err => {
                    console.error("Error fetching note:", err);
                    setFetchAttempted(true);
                });
        }
        return () => clearSelectedNote();
    }, [id, fetchNoteById, clearSelectedNote, isAuthenticated]);

    // Log whenever selectedNote changes
    useEffect(() => {
        // If we have a valid selectedNote, mark it as successfully loaded
        if (selectedNote && selectedNote._id === lastFetchedId.current) {
            noteWasLoaded.current = true;
        }
    }, [selectedNote]);

    // Use pendingNote as a fallback when selectedNote is not available
    const noteToDisplay = selectedNote || pendingNote;

    // Add or remove 'mindmap-view' class from body when viewing mind maps
    useEffect(() => {
        const isMindMap = noteToDisplay?.type === 'mindmap';

        if (isMindMap) {
            document.body.classList.add('mindmap-view');
        } else {
            document.body.classList.remove('mindmap-view');
        }

        return () => {
            document.body.classList.remove('mindmap-view');
        };
    }, [noteToDisplay?.type]);

    // Helper to render the note editor with full height layout for mind maps
    const renderEditor = () => {
        // For mind maps, use a special full-height layout
        if (noteToDisplay && noteToDisplay.type === 'mindmap') {
            return (
                <Box sx={{
                    display: 'flex',
                    flexGrow: 1,
                    height: 'calc(100vh - 100px)',
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <Box component="main" sx={{
                        flexGrow: 1,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        <NoteEditor />
                    </Box>
                </Box>
            );
        }

        // Standard editor for other types
        return <NoteEditor />;
    };

    // For new notes, show the editor
    if (id === 'new') {
        return renderEditor();
    }

    // Check for authentication first
    if (!isAuthenticated) {
        return (
            <Alert severity="error" action={
                <Button color="inherit" size="small" onClick={() => navigate('/login')}>
                    Login
                </Button>
            }>
                You need to be logged in to view this note.
            </Alert>
        );
    }

    // Show loading indicator while fetching
    if (isLoadingSelected) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    // If we have a pending note but no selectedNote yet, show loading state
    if (pendingNote && !selectedNote) {
        console.log("Using pendingNote while waiting for selectedNote to be set:", pendingNote._id);
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    // Show error if note couldn't be loaded
    if (fetchAttempted && selectedError) {
        return (
            <Alert
                severity="error"
                action={
                    <Button color="inherit" size="small" onClick={() => navigate('/')}>
                        Back to Notes
                    </Button>
                }
            >
                {selectedError || 'Could not load note.'}
            </Alert>
        );
    }

    // Show warning if note not found
    // Only show this if we haven't successfully loaded the note before and there's no pending note
    if (fetchAttempted && !selectedNote && !pendingNote && !noteWasLoaded.current) {
        console.error("Note not found after fetch attempt. ID:", id);
        return (
            <Alert
                severity="warning"
                action={
                    <Button color="inherit" size="small" onClick={() => navigate('/')}>
                        Back to Notes
                    </Button>
                }
            >
                Note not found or may have been deleted.
            </Alert>
        );
    }

    // If we've successfully loaded the note before but it's temporarily null,
    // show a loading state instead of "not found"
    if (fetchAttempted && !selectedNote && (noteWasLoaded.current || pendingNote)) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    // For mind maps, always show the editor (even in view mode)
    // This is because mind maps are inherently interactive
    if (noteToDisplay && (noteToDisplay.type === 'mindmap' || noteToDisplay.type === 'handwritten')) {
        return renderEditor();
    }

    // For other note types, use the regular viewer/editor pattern
    return isEditRoute ? <NoteEditor /> : <NoteViewer />;
}

export default NotePage;