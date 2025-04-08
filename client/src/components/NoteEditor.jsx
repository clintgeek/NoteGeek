import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Paper, IconButton, Stack } from '@mui/material';
import MarkdownEditor from './editors/MarkdownEditor';
import CodeEditor from './editors/CodeEditor';
import MindMapEditor from './editors/MindMapEditor';
import RichTextEditor from './editors/RichTextEditor';
import { DeleteOutline, Save, Edit, Cancel } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useNoteStore from '../store/noteStore';
import TagSelector from './TagSelector';
import NoteTypeSelector from './NoteTypeSelector';
import DeleteNoteDialog from './DeleteNoteDialog';

// Note types
export const NOTE_TYPES = {
    TEXT: 'text',
    MARKDOWN: 'markdown',
    CODE: 'code',
    MINDMAP: 'mindmap'
};

function NoteEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        selectedNote,
        pendingNote,
        createNote,
        updateNote,
        isLoadingSelected,
        selectedError
    } = useNoteStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [noteType, setNoteType] = useState(NOTE_TYPES.TEXT);
    const [saveStatus, setSaveStatus] = useState('');
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(id === 'new'); // Edit mode by default for new notes
    const saveTimeoutRef = useRef(null);
    const initialLoadDone = useRef(false);

    // Track if we've already saved this as a new note
    const [savedNoteId, setSavedNoteId] = useState(id !== 'new' ? id : null);

    // Select appropriate note data to use - prefer selectedNote but fall back to pendingNote
    const noteToEdit = selectedNote || pendingNote;

    // Determine if this is a mind map type note
    const isMindMap = noteType === NOTE_TYPES.MINDMAP;

    // Reset form function
    const resetForm = useCallback(() => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setNoteType(NOTE_TYPES.TEXT);
    }, []);

    // Load note data or reset form when component mounts or id changes
    useEffect(() => {
        // Reset initialLoadDone when component mounts
        initialLoadDone.current = false;

        // New notes need a reset
        if (id === 'new' && !savedNoteId) {
            console.log("NoteEditor - New note, resetting form");
            resetForm();
            setIsEditMode(true);
            initialLoadDone.current = true;
        }
        // Existing notes should load from store
        else if (noteToEdit) {
            console.log("NoteEditor - Loading from store:", noteToEdit._id);
            console.log("NoteEditor - Note type from store:", noteToEdit.type);
            console.log("NoteEditor - Note content:", noteToEdit.content);

            setTitle(noteToEdit.title || '');
            setContent(noteToEdit.content || '');
            setSelectedTags(noteToEdit.tags || []);

            // Set the correct note type from the stored note
            if (noteToEdit.type && Object.values(NOTE_TYPES).includes(noteToEdit.type)) {
                console.log("NoteEditor - Setting type to:", noteToEdit.type);
                setNoteType(noteToEdit.type);

                // Mind maps start in view mode
                if (noteToEdit.type === NOTE_TYPES.MINDMAP && id !== 'new') {
                    setIsEditMode(false);
                }
            } else {
                console.log("NoteEditor - Invalid or missing type, defaulting to:", NOTE_TYPES.TEXT);
                setNoteType(NOTE_TYPES.TEXT); // Default to text if no valid type
            }

            initialLoadDone.current = true;
        }

        // Cleanup on unmount
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            initialLoadDone.current = false;
        };
    }, [id, noteToEdit, resetForm, savedNoteId]);

    // Toggle edit mode
    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    // Manual save function - call directly when save button is clicked
    const handleManualSave = async () => {
        const result = await handleSave(false);
        // Manual save should navigate
        if (result && id === 'new') {
            navigate(`/notes/${result._id}`);
        }
        return result;
    };

    // Auto-save function - debounced when content changes
    const handleAutoSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Don't auto-save unless we have content
        if (!content.trim()) {
            return;
        }

        saveTimeoutRef.current = setTimeout(() => {
            handleSave(true);
        }, 2000);
    }, [content]);

    // The core save function used by both manual and auto-save
    const handleSave = async (isAutoSave = false) => {
        try {
            // Always require content
            if (!content.trim()) {
                console.log("Not saving note without content");
                setSaveStatus('Error: Note content cannot be empty');
                setTimeout(() => setSaveStatus(''), 2000);
                return null;
            }

            setSaveStatus('Saving...');

            // Ensure type is explicitly set
            console.log("Saving note with type:", noteType);

            const noteData = {
                title: title.trim() || 'Untitled Note',
                content,
                tags: selectedTags,
                type: noteType // Make sure type is included
            };

            console.log("Full note data being saved:", JSON.stringify({
                ...noteData,
                content: noteData.content.length > 50 ? noteData.content.substring(0, 50) + '...' : noteData.content
            }));

            let savedNote;

            // If we already have a saved ID, update that note
            if (savedNoteId) {
                console.log(`Updating existing note: ${savedNoteId}`);
                savedNote = await updateNote(savedNoteId, noteData);
            }
            // Otherwise create a new note
            else {
                console.log("Creating new note");
                savedNote = await createNote(noteData);
                if (savedNote && savedNote._id) {
                    console.log(`Note created with ID: ${savedNote._id}`);
                    console.log("Saved note type:", savedNote.type);
                    // Remember this ID for future saves
                    setSavedNoteId(savedNote._id);

                    // Update URL without navigation for auto-saves
                    if (isAutoSave) {
                        window.history.replaceState(null, '', `/notes/${savedNote._id}`);
                    }
                }
            }

            if (savedNote) {
                // Update title to match what the server returned
                if (savedNote.title && savedNote.title !== title) {
                    setTitle(savedNote.title);
                }

                setSaveStatus('Saved');
                setTimeout(() => setSaveStatus(''), 2000);

                // If we just saved a mind map, switch to view mode
                if (isMindMap) {
                    setIsEditMode(false);
                }
            } else {
                setSaveStatus('Failed to save');
            }

            return savedNote;
        } catch (error) {
            console.error('Error saving note:', error);
            setSaveStatus('Error: ' + (error.message || 'Failed to save'));
            return null;
        }
    };

    // Auto-save when content changes
    useEffect(() => {
        if (initialLoadDone.current && isEditMode && content.trim()) {
            handleAutoSave();
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [content, isEditMode, handleAutoSave]);

    // Show spinner while loading
    if (isLoadingSelected) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    // Show error if any
    if (selectedError && id !== 'new') {
        return (
            <Box p={3}>
                <Typography color="error">{selectedError}</Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/')}
                    sx={{ mt: 2 }}
                >
                    Back to Notes
                </Button>
            </Box>
        );
    }

    // Render editor based on note type
    const renderEditor = () => {
        console.log("Rendering editor for note type:", noteType);

        switch (noteType) {
            case NOTE_TYPES.MARKDOWN:
                console.log("Rendering Markdown editor");
                return <MarkdownEditor content={content} setContent={setContent} />;
            case NOTE_TYPES.CODE:
                console.log("Rendering Code editor");
                return <CodeEditor content={content} setContent={setContent} />;
            case NOTE_TYPES.MINDMAP:
                console.log("Rendering MindMap editor");
                return <MindMapEditor
                    content={content}
                    setContent={setContent}
                    readOnly={!isEditMode}
                />;
            case NOTE_TYPES.TEXT:
                console.log("Rendering Rich Text editor");
                return <RichTextEditor
                    content={content}
                    setContent={setContent}
                    isLoading={isLoadingSelected}
                />;
            default:
                console.log("Defaulting to Rich Text editor");
                return <RichTextEditor
                    content={content}
                    setContent={setContent}
                    isLoading={isLoadingSelected}
                />;
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                overflow: 'hidden',
                ...(isMindMap && {
                    position: 'relative',
                    flexGrow: 1,
                    overflow: 'hidden',
                    maxHeight: noteToEdit?.type === 'mindmap' ? 'calc(100vh - 100px)' : 'auto'
                })
            }}
        >
            <Box p={2} bgcolor="background.paper" borderBottom={1} borderColor="divider">
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                    <TextField
                        placeholder="Title"
                        variant="outlined"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        size="small"
                        sx={{ flexGrow: 1 }}
                        disabled={!isEditMode && isMindMap}
                    />

                    {/* Show type selector only for brand new notes that haven't been saved yet */}
                    {(!savedNoteId || id === 'new') && (
                        <>
                            <Box sx={{ ml: 1, mr: 1, display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ mr: 1, fontWeight: 'bold' }}>
                                    Note Type:
                                </Typography>
                                <NoteTypeSelector
                                    value={noteType}
                                    onChange={setNoteType}
                                />
                            </Box>
                        </>
                    )}

                    <TagSelector
                        selectedTags={selectedTags}
                        onChange={setSelectedTags}
                        disabled={!isEditMode && isMindMap}
                    />

                    {/* Toggle edit mode button for mind maps */}
                    {isMindMap && (id !== 'new' || savedNoteId) && (
                        <Button
                            variant="outlined"
                            color={isEditMode ? "secondary" : "primary"}
                            startIcon={isEditMode ? <Cancel /> : <Edit />}
                            onClick={toggleEditMode}
                            size="small"
                        >
                            {isEditMode ? "Cancel" : "Edit"}
                        </Button>
                    )}

                    {/* Save button - only show in edit mode for mind maps */}
                    {(isEditMode || !isMindMap) && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            onClick={handleManualSave}
                            size="small"
                            sx={{ minWidth: '85px' }}
                        >
                            {saveStatus === 'Saving...' ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                saveStatus === 'Saved' ? 'Saved' : 'Save'
                            )}
                        </Button>
                    )}

                    {/* Delete button - always show for saved notes */}
                    {(id !== 'new' || savedNoteId) && (
                        <IconButton
                            color="error"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            size="small"
                        >
                            <DeleteOutline />
                        </IconButton>
                    )}
                </Stack>
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.default',
                    height: isMindMap ? 'calc(100vh - 180px)' : 'calc(100vh - 160px)',
                    overflow: 'hidden'
                }}
            >
                {renderEditor()}
            </Box>

            <DeleteNoteDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                noteId={savedNoteId || id}
                noteTitle={title}
            />
        </Paper>
    );
}

export default NoteEditor;