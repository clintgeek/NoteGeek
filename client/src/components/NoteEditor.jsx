import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    TextField,
    Box,
    Typography,
    Autocomplete,
    Alert,
    CircularProgress,
    Paper,
    IconButton,
    Tooltip,
    useTheme,
    useMediaQuery,
    Divider,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PreviewIcon from '@mui/icons-material/Preview';
import ReactMarkdown from 'react-markdown';
import useNoteStore from '../store/noteStore';
import useTagStore from '../store/tagStore';

function NoteEditor() {
    const { id: noteId } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
    const isEditing = Boolean(noteId);

    // Note store selectors
    const selectedNote = useNoteStore((state) => state.selectedNote);
    const isLoadingSelected = useNoteStore((state) => state.isLoadingSelected);
    const selectedError = useNoteStore((state) => state.selectedError);
    const createNote = useNoteStore((state) => state.createNote);
    const updateNote = useNoteStore((state) => state.updateNote);
    const clearSelectedNote = useNoteStore((state) => state.clearSelectedNote);
    const deleteNote = useNoteStore((state) => state.deleteNote);

    // Tag store selectors
    const { tags, fetchTags } = useTagStore();

    // Local state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [formError, setFormError] = useState(null);
    const [viewMode, setViewMode] = useState('edit');

    // Reset form function
    const resetForm = React.useCallback(() => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setFormError(null);
    }, []);

    // Fetch tags on mount
    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    // Handle form reset for new notes
    useEffect(() => {
        if (!isEditing) {
            clearSelectedNote();
            resetForm();
        }
        return () => clearSelectedNote();
    }, [isEditing, clearSelectedNote, resetForm]);

    // Update form when note data changes
    useEffect(() => {
        if (selectedNote && isEditing) {
            setTitle(selectedNote.title || '');
            setContent(selectedNote.content || '');
            setSelectedTags(selectedNote.tags || []);
        }
    }, [selectedNote, isEditing]);

    // Format tag by replacing spaces with underscores and removing invalid characters
    const formatTag = (tag) => {
        return tag
            .trim()
            .replace(/\s+/g, '_')  // Replace one or more spaces with single underscore
            .replace(/[^a-zA-Z0-9_\-/]/g, ''); // Remove any remaining invalid characters
    };

    // Clean and validate tags before setting
    const handleTagsChange = (event, newValue) => {
        // Format each tag and remove duplicates
        const cleanedTags = [...new Set(
            newValue
                .map(tag => formatTag(tag))
                .filter(tag => tag) // Remove empty tags
        )];

        setSelectedTags(cleanedTags);
    };

    const handleSubmit = async (event) => {
        if (event) event.preventDefault();

        // Don't submit if already loading
        if (isLoadingSelected) return;

        // Validate content
        if (!content.trim()) {
            setFormError('Note content is required');
            return;
        }

        try {
            // Clean tags one final time before submission
            const cleanedTags = [...new Set(
                selectedTags
                    .map(tag => formatTag(tag))
                    .filter(tag => tag)
            )];

            const noteData = {
                title: title.trim(),
                content: content.trim(),
                tags: cleanedTags,
            };

            // Set loading state
            useNoteStore.setState({ isLoadingSelected: true });

            const savedNote = isEditing
                ? await updateNote(noteId, noteData)
                : await createNote(noteData);

            // Only navigate if we got back a valid note object
            if (savedNote && savedNote._id) {
                // Clear any existing errors
                setFormError(null);
                useNoteStore.setState({ selectedError: null });
                // Navigate only after successful save
                navigate('/');
            } else {
                throw new Error('Failed to save note. Please try again.');
            }
        } catch (error) {
            console.error('Save error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to save note. Please try again.';
            setFormError(errorMessage);
            // Don't navigate on error
            return false;
        } finally {
            useNoteStore.setState({ isLoadingSelected: false });
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const success = await deleteNote(noteId);
            if (success) {
                navigate('/');
            }
        }
    };

    const handleViewModeChange = (event, newMode) => {
        if (newMode !== null) {
            setViewMode(newMode);
        }
    };

    const renderEditor = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
        }}>
            <TextField
                placeholder="Start writing..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                multiline
                fullWidth
                variant="standard"
                disabled={isLoadingSelected}
                InputProps={{
                    disableUnderline: true,
                }}
                sx={{
                    flex: '1 0 auto',
                    '& .MuiInputBase-root': {
                        padding: { xs: '8px 0', sm: 2 },
                    },
                    '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        resize: 'none',
                        '&::placeholder': {
                            color: 'text.secondary',
                            opacity: 0.7,
                        },
                    },
                }}
            />
            <Box sx={{
                mt: 2,
                borderTop: 1,
                borderColor: 'divider',
                pt: 2,
                position: 'sticky',
                bottom: 0,
                bgcolor: 'background.default',
                zIndex: 1
            }}>
                <Autocomplete
                    multiple
                    freeSolo
                    options={tags}
                    value={selectedTags}
                    onChange={handleTagsChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            placeholder="Add tags... (letters, numbers, _, -, / only)"
                            error={formError?.includes('tags')}
                            helperText={formError?.includes('tags') ? formError : ''}
                            sx={{
                                '& .MuiInputBase-input': {
                                    '&::placeholder': {
                                        color: 'text.secondary',
                                        opacity: 0.7,
                                    },
                                },
                            }}
                        />
                    )}
                    disabled={isLoadingSelected}
                />
            </Box>
        </Box>
    );

    const renderPreview = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto'
        }}>
            <Box sx={{
                flex: 1,
                overflow: 'auto',
                p: { xs: 0, sm: 2 },
                width: '100%',
                '& img': {
                    maxWidth: '100%',
                    height: 'auto'
                },
                '::selection': {
                    backgroundColor: 'rgba(96, 152, 204, 0.2)',
                    color: 'inherit'
                },
                '::-moz-selection': {
                    backgroundColor: 'rgba(96, 152, 204, 0.2)',
                    color: 'inherit'
                }
            }}>
                <ReactMarkdown>{content || ''}</ReactMarkdown>
            </Box>
            <Autocomplete
                multiple
                freeSolo
                options={tags}
                value={selectedTags}
                onChange={handleTagsChange}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="standard"
                        placeholder="Add tags... (letters, numbers, _, -, / only)"
                        error={formError?.includes('tags')}
                        helperText={formError?.includes('tags') ? formError : ''}
                        sx={{
                            mt: 2,
                            '& .MuiInputBase-input': {
                                '&::placeholder': {
                                    color: 'text.secondary',
                                    opacity: 0.7,
                                },
                            },
                        }}
                    />
                )}
                disabled={isLoadingSelected}
            />
        </Box>
    );

    return (
        <Box
            sx={{
                height: '100%',
                minHeight: {
                    xs: 'calc(100vh - 64px)',
                    sm: 'calc(100vh - 128px)'
                },
                width: '100%',
                maxWidth: {
                    xs: '100%',
                    // When preview is visible, use up to 95vw with a higher cap
                    sm: isDesktop && viewMode === 'preview' ? 'min(95vw, 2000px)' : '800px'
                },
                mx: 'auto',
                position: 'relative',
                bgcolor: { xs: 'transparent', sm: 'background.paper' },
                display: 'flex',
                flexDirection: 'column',
                ...(isDesktop && {
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                })
            }}
        >
            {isLoadingSelected && (
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.7)',
                    zIndex: 1000,
                }}>
                    <CircularProgress />
                </Box>
            )}

            {(formError || selectedError) && (
                <Alert
                    severity="error"
                    onClose={() => {
                        setFormError(null);
                        useNoteStore.setState({ selectedError: null });
                    }}
                    sx={{ mb: 2, mx: { xs: 0, sm: 0 } }}
                >
                    {formError || selectedError}
                </Alert>
            )}

            <form style={{ height: '100%', display: 'flex', flexDirection: 'column' }} onSubmit={handleSubmit}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 2,
                    px: { xs: 0, sm: 0 }
                }}>
                    <TextField
                        placeholder="Title (optional)"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        fullWidth
                        variant="standard"
                        disabled={isLoadingSelected}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: '1.25rem',
                                '&::placeholder': {
                                    color: 'text.secondary',
                                    opacity: 0.7,
                                },
                            },
                        }}
                    />
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={handleViewModeChange}
                        size="small"
                    >
                        <ToggleButton value="edit">
                            <Tooltip title="Edit">
                                <EditNoteIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                        <ToggleButton value="preview">
                            <Tooltip title="Preview">
                                <PreviewIcon fontSize="small" />
                            </Tooltip>
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                        <IconButton
                            onClick={handleSubmit}
                            size="small"
                            disabled={isLoadingSelected}
                            sx={{
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'rgba(96, 152, 204, 0.04)'
                                }
                            }}
                        >
                            <SaveIcon />
                        </IconButton>
                        {isEditing && (
                            <IconButton
                                size="small"
                                onClick={handleDelete}
                                sx={{
                                    color: '#d32f2f',
                                    '&:hover': {
                                        bgcolor: 'rgba(211, 47, 47, 0.04)'
                                    }
                                }}
                            >
                                <DeleteOutlineIcon />
                            </IconButton>
                        )}
                    </Box>
                </Box>

                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    flex: 1,
                    minHeight: 0,
                    height: {
                        xs: 'calc(100vh - 64px - 56px)',
                        sm: 'calc(100vh - 230px)'
                    },
                    overflow: 'hidden'
                }}>
                    {isDesktop ? (
                        <>
                            <Box sx={{
                                flex: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {renderEditor()}
                            </Box>
                            {viewMode === 'preview' && (
                                <>
                                    <Divider orientation="vertical" flexItem />
                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        {renderPreview()}
                                    </Box>
                                </>
                            )}
                        </>
                    ) : (
                        <Box sx={{
                            flex: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            height: '100%'
                        }}>
                            {viewMode === 'edit' ? renderEditor() : renderPreview()}
                        </Box>
                    )}
                </Box>
            </form>
        </Box>
    );
}

export default NoteEditor;