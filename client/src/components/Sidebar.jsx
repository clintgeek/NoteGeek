import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Box,
    Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import useTagStore from '../store/tagStore';
import useAuthStore from '../store/authStore';
import useNoteStore from '../store/noteStore';

function Sidebar({ closeNavbar }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { tags, fetchTags, isLoading: tagsLoading, error: tagsError } = useTagStore();
    const { logoutUser, user } = useAuthStore();
    const { clearNotes } = useNoteStore();
    const [tagsOpen, setTagsOpen] = useState(true);

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
        logoutUser();
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
        return Object.entries(hierarchy).map(([tag, data]) => (
            <div key={data.path}>
                <ListItemButton
                    component={Link}
                    to={`/tags/${encodeURIComponent(data.path)}`}
                    selected={location.pathname === `/tags/${encodeURIComponent(data.path)}`}
                    onClick={handleLinkClick}
                    sx={{ pl: level * 3 + 2 }}
                >
                    <ListItemText primary={tag} />
                </ListItemButton>
                {Object.keys(data.children).length > 0 && (
                    <RenderTagHierarchy hierarchy={data.children} level={level + 1} />
                )}
            </div>
        ));
    };

    const tagHierarchy = buildTagHierarchy(tags);

    return (
        <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            {/* Main Navigation */}
            <List>
                <ListItemButton
                    component={Link}
                    to="/notes/new"
                    onClick={handleLinkClick}
                    sx={{
                        color: 'primary.main',
                        '&:hover': {
                            bgcolor: 'rgba(96, 152, 204, 0.08)',
                        },
                    }}
                >
                    <ListItemIcon>
                        <AddIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="New Note"
                        primaryTypographyProps={{
                            color: 'primary',
                            fontWeight: 500
                        }}
                    />
                </ListItemButton>

                <ListItemButton
                    component={Link}
                    to="/search"
                    selected={location.pathname === '/search'}
                    onClick={handleLinkClick}
                >
                    <ListItemIcon>
                        <SearchIcon />
                    </ListItemIcon>
                    <ListItemText primary="Search" />
                </ListItemButton>

                {/* Tags Section */}
                <ListItemButton onClick={() => setTagsOpen(!tagsOpen)}>
                    <ListItemIcon>
                        <LocalOfferIcon />
                    </ListItemIcon>
                    <ListItemText primary="Tags" />
                    {tagsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={tagsOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
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
                        {!tagsLoading && !tagsError && <RenderTagHierarchy hierarchy={tagHierarchy} />}
                    </List>
                </Collapse>
            </List>

            {/* Logout Button */}
            <Box sx={{ mt: 'auto', borderTop: 1, borderColor: 'divider' }}>
                <ListItemButton onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                        primary={`Logout (${user?.username || 'User'})`}
                        primaryTypographyProps={{ color: 'error' }}
                    />
                </ListItemButton>
            </Box>
        </Box>
    );
}

export default Sidebar;