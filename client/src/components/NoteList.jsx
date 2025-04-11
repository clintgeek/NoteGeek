import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    List,
    ListItem,
    ListItemText,
    Typography,
    Alert,
    CircularProgress,
    Link as MuiLink,
    Box,
    Chip,
} from '@mui/material';
import useNoteStore from '../store/noteStore';

// Accept tag and prefix props for filtering
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
        <List sx={{ width: '100%', maxWidth: '100%' }}>
            {notes.map((note) => (
                <ListItem
                    key={note._id}
                    disablePadding
                    sx={{
                        mb: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        pb: 1,
                        '&:last-child': {
                            borderBottom: 'none'
                        }
                    }}
                >
                    <ListItemText
                        primary={
                            <Box display="flex" alignItems="center" gap={1}>
                                <MuiLink
                                    component={Link}
                                    to={`/notes/${note._id}`}
                                    color="primary"
                                    underline="hover"
                                    sx={{ fontWeight: 500 }}
                                >
                                    {note.title || 'Untitled Note'}
                                </MuiLink>
                                {note.isLocked && (
                                    <Typography
                                        component="span"
                                        variant="caption"
                                        color="error"
                                        sx={{ ml: 1 }}
                                    >
                                        (Locked)
                                    </Typography>
                                )}
                            </Box>
                        }
                        secondary={
                            note.tags.length > 0 && (
                                <Typography
                                    component="div"
                                    variant="body2"
                                    sx={{ mt: 0.5 }}
                                >
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
                                </Typography>
                            )
                        }
                    />
                </ListItem>
            ))}
        </List>
    );
}

export default NoteList;