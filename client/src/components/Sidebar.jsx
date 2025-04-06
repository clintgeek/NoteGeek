import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Collapse,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Logout as LogoutIcon,
    Upload as UploadIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import useTagStore from '../store/tagStore';
import useAuthStore from '../store/authStore';
import useNoteStore from '../store/noteStore';
import TagContextMenu from './TagContextMenu';

function Sidebar({ closeNavbar }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { tags, fetchTags, isLoading: tagsLoading, error: tagsError } = useTagStore();
    const { logout, user } = useAuthStore();
    const { clearNotes } = useNoteStore();
    const [tagFilter, setTagFilter] = useState('');

    useEffect(() => {
        if (user) {
            console.log('Sidebar: Fetching tags for user:', user.username);
            fetchTags();
        } else {
            console.log('Sidebar: No user available for tag fetch');
        }
    }, [fetchTags, user]);

    const handleLinkClick = () => {
        closeNavbar?.();
    };

    const handleLogout = () => {
        handleLinkClick();
        logout();
        clearNotes();
        navigate('/login');
    };

    // Function to build hierarchical tag structure
    const buildTagHierarchy = (tags) => {
        const hierarchy = {};
        tags.forEach(tag => {
            const parts = tag.split('/');
            let current = hierarchy;
            let currentPath = '';
            parts.forEach(part => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!current[part]) {
                    current[part] = {
                        path: currentPath,
                        children: {}
                    };
                }
                current = current[part].children;
            });
        });
        return hierarchy;
    };

    // Recursive component to render tag hierarchy
    const RenderTagHierarchy = ({ hierarchy, level = 0 }) => {
        const [contextMenu, setContextMenu] = useState(null);
        const [selectedTag, setSelectedTag] = useState(null);

        const handleContextMenu = (event, tag) => {
            event.preventDefault();
            setContextMenu(event.currentTarget);
            setSelectedTag(tag);
        };

        const handleCloseContextMenu = () => {
            setContextMenu(null);
            setSelectedTag(null);
        };

        return (
            <>
                {Object.entries(hierarchy).map(([tag, data]) => (
                    <div key={data.path}>
                        <ListItemButton
                            component={Link}
                            to={`/tags/${encodeURIComponent(data.path)}`}
                            selected={location.pathname === `/tags/${encodeURIComponent(data.path)}`}
                            onClick={handleLinkClick}
                            onContextMenu={(e) => handleContextMenu(e, data.path)}
                            sx={{ pl: level * 2 + 2 }}
                        >
                            <ListItemText primary={tag} />
                        </ListItemButton>
                        {Object.keys(data.children).length > 0 && (
                            <RenderTagHierarchy hierarchy={data.children} level={level + 1} />
                        )}
                    </div>
                ))}
                <TagContextMenu
                    anchorEl={contextMenu}
                    open={Boolean(contextMenu)}
                    onClose={handleCloseContextMenu}
                    tag={selectedTag}
                />
            </>
        );
    };

    // Filter tags based on search input
    const filteredTags = tags.filter(tag =>
        tag.toLowerCase().includes(tagFilter.toLowerCase())
    );

    const tagHierarchy = buildTagHierarchy(tags);

    return (
        <Box sx={{
            height: '100vh',
            maxHeight: 'calc(100vh - 64px)', // Account for app bar height
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden' // Prevent scrolling of the entire sidebar
        }}>
            {/* Main Navigation */}
            <List>
                <ListItem disablePadding>
                    <ListItemButton onClick={() => {
                        handleLinkClick();
                        navigate('/notes/new');
                    }}>
                        <ListItemIcon>
                            <AddIcon />
                        </ListItemIcon>
                        <ListItemText primary="New Note" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        component={Link}
                        to="/search"
                        onClick={handleLinkClick}
                    >
                        <ListItemIcon>
                            <SearchIcon />
                        </ListItemIcon>
                        <ListItemText primary="Search Notes" />
                    </ListItemButton>
                </ListItem>
            </List>

            {/* Tags Section - Make it scroll but stop above bottom actions */}
            <List sx={{
                flex: 1,
                overflowY: 'auto',
                mb: '96px' // Use margin instead of padding to ensure proper spacing
            }}>
                {/* Tag Filter Input */}
                <ListItem sx={{ pb: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Filter tags..."
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: tagFilter && (
                                <InputAdornment position="end">
                                    <ClearIcon
                                        fontSize="small"
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => setTagFilter('')}
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />
                </ListItem>

                <ListItemButton
                    component={Link}
                    to="/"
                    selected={location.pathname === '/'}
                    onClick={handleLinkClick}
                    sx={{ pl: 2 }}
                >
                    <ListItemText primary="All Notes" />
                </ListItemButton>

                {tagsLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={20} />
                    </Box>
                )}
                {tagsError && (
                    <Alert severity="error" sx={{ mx: 2, my: 1 }}>
                        {tagsError}
                    </Alert>
                )}
                {!tagsLoading && !tagsError && Object.keys(tagHierarchy).length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                        No tags yet
                    </Typography>
                )}
                {!tagsLoading && !tagsError && (
                    <RenderTagHierarchy
                        hierarchy={buildTagHierarchy(filteredTags)}
                    />
                )}
            </List>

            {/* Bottom Actions - Fixed at bottom */}
            <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
                zIndex: 1 // Ensure it stays above scrolling content
            }}>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton component={Link} to="/import" onClick={handleLinkClick}>
                            <ListItemIcon>
                                <UploadIcon />
                            </ListItemIcon>
                            <ListItemText primary="Import Notes" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={handleLogout}>
                            <ListItemIcon>
                                <LogoutIcon />
                            </ListItemIcon>
                            <ListItemText primary="Logout" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );
}

export default Sidebar;