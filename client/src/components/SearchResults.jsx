import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Box,
    TextField,
    List,
    ListItem,
    ListItemText,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    InputAdornment,
    IconButton,
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import useNoteStore from '../store/noteStore';

function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(query);
    const { searchNotes, searchResults, isSearching, searchError } = useNoteStore();

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm) {
                setSearchParams({ q: searchTerm });
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, setSearchParams]);

    useEffect(() => {
        if (query) {
            searchNotes(query);
        }
    }, [query, searchNotes]);

    const handleClear = () => {
        setSearchTerm('');
        setSearchParams({ q: '' });
    };

    return (
        <Box sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
            <Paper sx={{ p: 2, mb: 3 }}>
                <TextField
                    fullWidth
                    label="Search Notes"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    variant="outlined"
                    placeholder="Enter keywords to search..."
                    autoFocus
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton onClick={handleClear} edge="end" size="small">
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            {isSearching ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : searchError ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {searchError}
                </Alert>
            ) : searchResults.length > 0 ? (
                <List>
                    {searchResults.map((note) => (
                        <Paper key={note._id} sx={{ mb: 2 }}>
                            <ListItem
                                component={Link}
                                to={`/notes/${note._id}`}
                                sx={{
                                    display: 'block',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={note.title}
                                    secondary={
                                        <>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    mb: 1
                                                }}
                                            >
                                                {note.content}
                                            </Typography>
                                            {note.tags.length > 0 && (
                                                <Box>
                                                    {note.tags.map((tag) => (
                                                        <Typography
                                                            key={tag}
                                                            component="span"
                                                            variant="caption"
                                                            sx={{
                                                                mr: 1,
                                                                color: 'primary.main',
                                                                bgcolor: 'primary.50',
                                                                px: 1,
                                                                py: 0.5,
                                                                borderRadius: 1
                                                            }}
                                                        >
                                                            {tag}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        </Paper>
                    ))}
                </List>
            ) : searchTerm ? (
                <Typography variant="body1" color="text.secondary" align="center">
                    No results found for "{searchTerm}"
                </Typography>
            ) : (
                <Typography variant="body1" color="text.secondary" align="center">
                    Start typing to search your notes
                </Typography>
            )}
        </Box>
    );
}

export default SearchResults;