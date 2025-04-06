import React from 'react';
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
    const selectedNote = useNoteStore((state) => state.selectedNote);
    const isLoadingSelected = useNoteStore((state) => state.isLoadingSelected);
    const selectedError = useNoteStore((state) => state.selectedError);
    const deleteNote = useNoteStore((state) => state.deleteNote);

    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/notes/${selectedNote._id}/edit`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const success = await deleteNote(selectedNote._id);
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

    if (selectedError && !selectedNote?.content) {
        return (
            <Alert
                severity="warning"
                action={selectedNote?.isLocked && (
                    <Button size="small" onClick={handleUnlock}>
                        Unlock
                    </Button>
                )}
            >
                {selectedError}
            </Alert>
        );
    }

    if (!selectedNote) {
        return <Typography>Note not found or not selected.</Typography>;
    }

    return (
        <Paper elevation={1} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" component="h2">
                    {selectedNote.title || 'Untitled Note'}
                </Typography>
                <Box>
                    {selectedNote.isLocked && (
                        <Tooltip title="Unlock Note">
                            <IconButton onClick={handleUnlock} size="small">
                                <LockIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {!selectedNote.isLocked && !selectedNote.isEncrypted && (
                        <Tooltip title="Edit Note">
                            <IconButton onClick={handleEdit} size="small">
                                <EditIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    {!selectedNote.isLocked && !selectedNote.isEncrypted && (
                        <Tooltip title="Delete Note">
                            <IconButton
                                onClick={handleDelete}
                                size="small"
                                color="error"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>
            <Box sx={{
                '::selection': {
                    backgroundColor: 'rgba(96, 152, 204, 0.2)',
                    color: 'inherit'
                },
                '::-moz-selection': {
                    backgroundColor: 'rgba(96, 152, 204, 0.2)',
                    color: 'inherit'
                }
            }}>
                <ReactMarkdown>{selectedNote.content || ''}</ReactMarkdown>
            </Box>
            {selectedNote.tags && selectedNote.tags.length > 0 && (
                <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                        mt: 2,
                        mb: 1,
                        flexWrap: 'wrap',
                        gap: 1
                    }}
                >
                    {selectedNote.tags.map((tag, index) => (
                        <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(96, 152, 204, 0.1)',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'rgba(96, 152, 204, 0.2)',
                                },
                            }}
                        />
                    ))}
                </Stack>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Created: {new Date(selectedNote.createdAt).toLocaleString()} |
                Updated: {new Date(selectedNote.updatedAt).toLocaleString()}
            </Typography>
        </Paper>
    );
}

export default NoteViewer;