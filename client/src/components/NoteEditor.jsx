import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Paper, IconButton, Stack } from '@mui/material';
import MarkdownEditor from './editors/MarkdownEditor';
import CodeEditor from './editors/CodeEditor';
import MindMapEditor from './editors/MindMapEditor';
import RichTextEditor from './editors/RichTextEditor';
import HandwrittenEditor from './editors/HandwrittenEditor';
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
    MINDMAP: 'mindmap',
    HANDWRITTEN: 'handwritten'
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
    const initialLoadDone = useRef(false);

    // Track if we've already saved this as a new note
    const [savedNoteId, setSavedNoteId] = useState(id !== 'new' ? id : null);

    // Select appropriate note data to use - prefer selectedNote but fall back to pendingNote
    const noteToEdit = selectedNote || pendingNote;

    // Determine if this is a mind map type note
    const isMindMap = noteType === NOTE_TYPES.MINDMAP;

    // Initialize edit mode state after noteToEdit is defined
    const [isEditMode, setIsEditMode] = useState(() => {
        // Always start in edit mode for new notes
        if (id === 'new') return true;
        // For existing notes, only start in view mode if it's a mind map
        if (noteToEdit?.type === NOTE_TYPES.MINDMAP) return false;
        // Default to edit mode
        return true;
    });

    // Handle content changes
    const handleContentChange = (newContent) => {
        console.log('NoteEditor - Content changed, type:', noteType);
        console.log('NoteEditor - New content length:', newContent?.length || 0);
        if (noteType === NOTE_TYPES.HANDWRITTEN) {
            console.log('NoteEditor - Handwritten content first 100 chars:', newContent?.substring(0, 100));
        }
        setContent(newContent);
    };

    // Handle title changes
    const handleTitleChange = (e) => {
        setTitle(e.target.value);
    };

    // Handle tag changes
    const handleTagsChange = (newTags) => {
        setSelectedTags(newTags);
    };

    // Reset form function
    const resetForm = useCallback(() => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setNoteType(NOTE_TYPES.TEXT);
        // Always start in edit mode for new notes
        setIsEditMode(true);
    }, []);

    // Load note data or reset form when component mounts or id changes
    useEffect(() => {
        // Reset initialLoadDone when component mounts
        initialLoadDone.current = false;

        // Always reset form for new notes
        if (id === 'new') {
            resetForm();
            setIsEditMode(true);
            setSavedNoteId(null); // Ensure we clear any previous saved note ID
            initialLoadDone.current = true;
            return;
        }

        // Existing notes should load from store
        if (noteToEdit) {
            setTitle(noteToEdit.title || '');
            setContent(noteToEdit.content || '');
            setSelectedTags(noteToEdit.tags || []);

            // Set the correct note type from the stored note
            if (noteToEdit.type && Object.values(NOTE_TYPES).includes(noteToEdit.type)) {
                setNoteType(noteToEdit.type);

                // Only set view mode for existing mind maps
                if (noteToEdit.type === NOTE_TYPES.MINDMAP && id !== 'new') {
                    setIsEditMode(false);
                }
            } else {
                setNoteType(NOTE_TYPES.TEXT); // Default to text if no valid type
            }

            initialLoadDone.current = true;
        }

        // Cleanup on unmount
        return () => {
            initialLoadDone.current = false;
            if (id === 'new') {
                resetForm();
                setSavedNoteId(null);
            }
        };
    }, [id, noteToEdit, resetForm]); // Remove savedNoteId from dependencies

    // Manual save function - call directly when save button is clicked
    const handleManualSave = async () => {
        try {
            // Always require content
            if (!content.trim()) {
                setSaveStatus('Error: Note content cannot be empty');
                setTimeout(() => setSaveStatus(''), 2000);
                return null;
            }

            setSaveStatus('Saving...');

            const noteData = {
                title: title.trim() || 'Untitled Note',
                content,
                tags: selectedTags,
                type: noteType
            };

            let savedNote;

            // If we already have a saved ID, update that note
            if (savedNoteId) {
                savedNote = await updateNote(savedNoteId, noteData);
            }
            // Otherwise create a new note
            else {
                savedNote = await createNote(noteData);
                if (savedNote && savedNote._id) {
                    // Remember this ID for future saves
                    setSavedNoteId(savedNote._id);
                    // Navigate to the new note's URL
                    navigate(`/notes/${savedNote._id}`);
                }
            }

            if (savedNote) {
                // Update title to match what the server returned
                if (savedNote.title && savedNote.title !== title) {
                    setTitle(savedNote.title);
                }

                setSaveStatus('Saved');
                setTimeout(() => setSaveStatus(''), 2000);

                // Only switch to view mode for mind maps if it's not a new note
                if (isMindMap && id !== 'new') {
                    setIsEditMode(false);
                }

                // If we're on the new note page and just saved, navigate to new note
                // Let the NewNoteWrapper handle the state reset
                if (id === 'new') {
                    navigate('/notes/new');
                }
            } else {
                setSaveStatus('Failed to save');
            }

            return savedNote;
        } catch (error) {
            setSaveStatus('Error: ' + (error.message || 'Failed to save'));
            return null;
        }
    };

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
                return <MarkdownEditor content={content} setContent={handleContentChange} />;
            case NOTE_TYPES.CODE:
                console.log("Rendering Code editor");
                return <CodeEditor content={content} setContent={handleContentChange} />;
            case NOTE_TYPES.MINDMAP:
                console.log("Rendering MindMap editor");
                return <MindMapEditor
                    content={content}
                    setContent={handleContentChange}
                    readOnly={!isEditMode}
                />;
            case NOTE_TYPES.HANDWRITTEN:
                console.log("Rendering Handwritten editor");
                return <HandwrittenEditor
                    content={content}
                    setContent={handleContentChange}
                    readOnly={!isEditMode}
                />;
            case NOTE_TYPES.TEXT:
            default:
                console.log("Rendering Rich Text editor");
                return <RichTextEditor
                    content={content}
                    setContent={handleContentChange}
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
                    spacing={1}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{ width: '100%' }}
                >
                    <TextField
                        placeholder="Title"
                        variant="outlined"
                        value={title}
                        onChange={handleTitleChange}
                        size="small"
                        sx={{ flexGrow: 1 }}
                        disabled={!isEditMode && isMindMap}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ width: { xs: '100%', sm: 'auto' } }}
                    >
                        {/* Show type selector only for brand new notes that haven't been saved yet */}
                        {(!savedNoteId || id === 'new') && (
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <Typography variant="body2" sx={{ mr: 1, display: { xs: 'none', sm: 'block' }, fontWeight: 'bold' }}>
                                    Type:
                                </Typography>
                                <NoteTypeSelector
                                    value={noteType}
                                    onChange={(newType) => {
                                        setNoteType(newType);
                                        if (newType === NOTE_TYPES.MINDMAP && (id === 'new' || !savedNoteId)) {
                                            setIsEditMode(true);
                                        }
                                    }}
                                />
                            </Box>
                        )}

                        <TagSelector
                            selectedTags={selectedTags}
                            onChange={handleTagsChange}
                            disabled={!isEditMode && isMindMap}
                            sx={{
                                minWidth: { xs: '100%', sm: '200px' },
                                flexGrow: { xs: 1, sm: 0 }
                            }}
                        />
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            justifyContent: 'flex-end',
                            alignItems: 'center'
                        }}
                    >
                        {/* Save button - only show in edit mode for mind maps */}
                        {(isEditMode || !isMindMap) && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Save />}
                                onClick={handleManualSave}
                                size="small"
                                sx={{
                                    minWidth: '80px',
                                    flex: { xs: 1, sm: 'none' }
                                }}
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
                </Stack>
            </Box>

            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.default',
                    height: isMindMap ? 'calc(100vh - 160px)' : 'calc(100vh - 140px)',
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