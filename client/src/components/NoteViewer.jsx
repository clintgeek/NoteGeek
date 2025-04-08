import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Paper,
    Typography,
    Alert,
    Box,
    IconButton,
    Tooltip,
    Button,
    Chip,
    Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useNoteStore from '../store/noteStore';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function NoteViewer() {
    const {
        selectedNote,
        pendingNote,
        isLoadingSelected,
        selectedError,
        deleteNote
    } = useNoteStore();

    // Use pendingNote as a fallback when selectedNote is not available
    const noteToView = selectedNote || pendingNote;

    // Add debugging for note view
    useEffect(() => {
        if (noteToView) {
            console.log('NoteViewer - Viewing note:', {
                id: noteToView._id,
                title: noteToView.title,
                type: noteToView.type,
                contentLength: noteToView.content ? noteToView.content.length : 0
            });

            if (noteToView.type === 'text') {
                console.log('NoteViewer - Rich text content:', noteToView.content);
            }
        }
    }, [noteToView]);

    const navigate = useNavigate();

    const handleEdit = () => {
        if (noteToView) {
            navigate(`/notes/${noteToView._id}/edit`);
        }
    };

    const handleDelete = async () => {
        if (!noteToView) return;

        if (window.confirm('Are you sure you want to delete this note?')) {
            const success = await deleteNote(noteToView._id);
            if (success) {
                navigate('/');
            }
        }
    };

    const handleUnlock = () => {
        alert('Unlock functionality not implemented yet.');
    };

    if (isLoadingSelected) {
        return <Typography>Loading note...</Typography>;
    }

    if (selectedError && !noteToView?.content) {
        return (
            <Alert
                severity="warning"
                action={noteToView?.isLocked && (
                    <Button size="small" onClick={handleUnlock}>
                        Unlock
                    </Button>
                )}
            >
                {selectedError}
            </Alert>
        );
    }

    if (!noteToView) {
        return <Typography>Note not found or not selected.</Typography>;
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                maxWidth: '100%',
                overflow: 'hidden',
                borderRadius: 0
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 1
                }}
            >
                <Typography variant="h4" component="h1">
                    {noteToView.title || 'Untitled Note'}
                    {noteToView.isLocked && (
                        <LockIcon color="warning" sx={{ ml: 1, verticalAlign: 'middle' }} />
                    )}
                </Typography>

                <Box>
                    <Tooltip title="Edit">
                        <IconButton onClick={handleEdit} color="primary">
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton onClick={handleDelete} color="error">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {noteToView.tags && noteToView.tags.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                    {noteToView.tags.map(tag => (
                        <Chip key={tag} label={tag} size="small" />
                    ))}
                </Stack>
            )}

            <Box
                sx={{
                    mt: 2,
                    overflow: 'auto',
                    maxHeight: 'calc(100vh - 250px)',
                    wordBreak: 'break-word'
                }}
            >
                {/* Explicit check for each note type */}
                {noteToView.type === 'markdown' ? (
                    <ReactMarkdown>{noteToView.content || ''}</ReactMarkdown>
                ) : noteToView.type === 'text' ? (
                    // Handle rich text content (which is now stored as HTML)
                    <div
                        className="rich-text-viewer"
                        dangerouslySetInnerHTML={{ __html: noteToView.content || '' }}
                    />
                ) : noteToView.type === 'code' ? (
                    // Dedicated code rendering with monospace font
                    <Typography
                        component="pre"
                        sx={{
                            fontFamily: '"Roboto Mono", monospace',
                            whiteSpace: 'pre-wrap',
                            margin: 0,
                            padding: 2,
                            backgroundColor: '#f5f5f5',
                            borderRadius: 1
                        }}
                    >
                        {noteToView.content || ''}
                    </Typography>
                ) : (
                    // Default fallback for any other type
                    <Typography
                        component="pre"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            margin: 0
                        }}
                    >
                        {noteToView.content || ''}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

export default NoteViewer;