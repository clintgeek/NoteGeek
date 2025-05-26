import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ListItem,
    ListItemText,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Chip,
    Paper,
    Stack
} from '@mui/material';
import useNoteStore from '../store/noteStore';

// Helper to get note type (default to 'text')
function getNoteType(note) {
    return note.type || 'text';
}

// Helper to get first two lines of content, stripping HTML tags
function getPreview(content) {
    if (!content) return '';
    // Remove HTML tags if present
    const plain = content.replace(/<[^>]+>/g, '');
    const lines = plain.split(/\r?\n/).filter(Boolean);
    return lines.slice(0, 2).join(' ').slice(0, 160); // Limit preview length
}

function NoteList({ tag, prefix }) {
    const notes = useNoteStore((state) => state.notes);
    const isLoadingList = useNoteStore((state) => state.isLoadingList);
    const listError = useNoteStore((state) => state.listError);
    const fetchNotes = useNoteStore((state) => state.fetchNotes);

    useEffect(() => {
        const filters = {};
        if (tag) {
            filters.tag = tag;
        }
        if (prefix) {
            filters.prefix = prefix;
        }
        fetchNotes(filters);
    }, [fetchNotes, tag, prefix]);

    if (isLoadingList) {
        return (
            <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress />
            </Box>
        );
    }

    if (listError) {
        return (
            <Alert severity="error" sx={{ width: '100%' }}>
                {listError}
            </Alert>
        );
    }

    if (notes.length === 0) {
        return (
            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
                No notes found. Create one!
            </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: '1fr', // Single column for all breakpoints
                gap: 2,
                alignItems: 'stretch',
            }}
        >
            {notes.map(note => (
                <Paper
                    key={note._id}
                    elevation={2}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        height: '100%',
                        boxSizing: 'border-box',
                        transition: 'box-shadow 0.2s',
                    }}
                >
                    <ListItem
                        disableGutters
                        alignItems="flex-start"
                        component={Link}
                        to={`/notes/${note._id}`}
                        sx={{
                            '&:hover': { backgroundColor: 'action.hover' },
                            borderRadius: 2,
                            transition: 'background 0.2s',
                            p: 0,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                        }}
                    >
                        <ListItemText
                            primary={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="h6" color="primary.main" sx={{ flexGrow: 1 }}>
                                        {note.title || 'Untitled Note'}
                                    </Typography>
                                    <Chip
                                        label={getNoteType(note)}
                                        size="small"
                                        color="info"
                                        sx={{ textTransform: 'capitalize' }}
                                    />
                                </Stack>
                            }
                            secondary={
                                <>
                                    {note.tags.length > 0 && (
                                        <Box sx={{ mb: 0.5 }}>
                                            {note.tags.map((tag, index) => (
                                                <Chip
                                                    key={index}
                                                    label={tag}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mr: 0.5, mb: 0.5 }}
                                                    component="span"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </>
                            }
                        />
                    </ListItem>
                </Paper>
            ))}
        </Box>
    );
}

export default NoteList;