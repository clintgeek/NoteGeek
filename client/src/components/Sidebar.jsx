import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NavLink, ScrollArea, Loader, Text, Button, TextInput, Alert } from '@mantine/core';
import { IconFolderPlus, IconPlus, IconFolder, IconTrash, IconSettings, IconLogout } from '@tabler/icons-react';
import useFolderStore from '../store/folderStore';
import useTagStore from '../store/tagStore';
import useAuthStore from '../store/authStore';
import useNoteStore from '../store/noteStore';
// import { IconHome2, IconNotebook, IconTag, IconSearch, IconSettings, IconLogout } from '@tabler/icons-react'; // Example icons

function Sidebar({ closeNavbar }) {
    const location = useLocation(); // Get current path for active state
    const navigate = useNavigate();
    const { folders, fetchFolders, createFolder, clearFolders, isLoading: foldersLoading, error: foldersError } = useFolderStore();
    const { tags, fetchTags, isLoading: tagsLoading, error: tagsError } = useTagStore();
    const { logoutUser, user } = useAuthStore();
    const { clearNotes } = useNoteStore();

    // State for the new folder input
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [createError, setCreateError] = useState(null);

    useEffect(() => {
        if (user) {
            fetchFolders();
            // fetchTags(); // Uncomment if tags are still needed
        }
    }, [fetchFolders, fetchTags, user]);

    // Combined loading state for simplicity in UI
    const isLoading = foldersLoading || tagsLoading;

    const handleLinkClick = () => {
        // Close navbar on mobile after link click, if function provided
        closeNavbar?.();
    };

    const handleLogout = () => {
        handleLinkClick(); // Close navbar first
        logoutUser();
        clearFolders(); // Now defined
        clearNotes();
        // clearTags(); // Add if a clearTags function exists in tagStore
        navigate('/login');
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            setCreateError("Folder name cannot be empty.");
            return;
        }
        setCreateError(null);
        try {
            await createFolder({ name: newFolderName.trim() });
            setNewFolderName('');
            setShowNewFolderInput(false);
            // Optionally: Focus the new folder in the list or navigate?
        } catch (error) {
            console.error("Sidebar folder creation error:", error);
            setCreateError(error.message || "Failed to create folder. Please try again.");
        }
    };

    const handleNewFolderKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleCreateFolder();
        }
        if (event.key === 'Escape') {
            setShowNewFolderInput(false);
            setNewFolderName('');
            setCreateError(null);
        }
    };

    return (
        <ScrollArea h="calc(100vh - 60px)"> {/* Adjust height based on header */}
            {/* Add New Note Button at the top */}
            <Button
                component={Link}
                to="/notes/new"
                fullWidth
                mb="md"
                leftSection={<IconPlus size={16} />}
                onClick={handleLinkClick}
            >
                New Note
            </Button>

            <NavLink
                label="All Notes"
                component={Link}
                to="/"
                active={location.pathname === '/'} // Basic active check
                // leftSection={<IconNotebook size="1rem" stroke={1.5} />}
                onClick={handleLinkClick}
            />
            <NavLink
                label="Search"
                component={Link}
                to="/search" // Define this route later
                active={location.pathname === '/search'}
                // leftSection={<IconSearch size="1rem" stroke={1.5} />}
                onClick={handleLinkClick}
            />

            {/* Folders Section */}
            <div style={{ marginBottom: 'var(--mantine-spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--mantine-spacing-xs)', fontSize: 'var(--mantine-font-size-sm)', fontWeight: 500, color: 'var(--mantine-color-gray-7)' }}>Folders</h3>
                {foldersLoading && <Loader size="xs" ml="md"/>}
                {foldersError && <Alert color="red" title="Error" size="xs" ml="md">{foldersError}</Alert>}
                {!foldersLoading && !foldersError && folders.length === 0 && !showNewFolderInput && <Text c="dimmed" size="xs" ml="md">No folders</Text>}
                {!foldersLoading && !foldersError && folders.map((folder) => (
                    <NavLink
                        key={folder._id}
                        label={folder.name}
                        component={Link}
                        to={`/folders/${folder._id}`}
                        active={location.pathname === `/folders/${folder._id}`}
                        leftSection={<IconFolder size={16} />}
                        onClick={handleLinkClick}
                        // Basic styling for NavLink items
                        styles={{
                            root: {
                                paddingLeft: 'var(--mantine-spacing-sm)',
                                paddingRight: 'var(--mantine-spacing-sm)',
                                marginBottom: '2px',
                            }
                        }}
                    />
                ))}
                {!foldersLoading && !foldersError && folders.length === 0 && !showNewFolderInput && <Text c="dimmed" size="xs" ml="md">No folders yet.</Text>}

                {showNewFolderInput && (
                    <div style={{ paddingLeft: 'var(--mantine-spacing-sm)', paddingRight: 'var(--mantine-spacing-sm)', marginTop: 'var(--mantine-spacing-xs)' }}>
                        <TextInput
                            placeholder="New folder name..."
                            value={newFolderName}
                            onChange={(event) => setNewFolderName(event.currentTarget.value)}
                            onKeyDown={handleNewFolderKeyDown}
                            error={createError}
                            disabled={foldersLoading}
                            autoFocus
                            size="xs"
                            rightSection={
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    onClick={handleCreateFolder}
                                    loading={foldersLoading}
                                    disabled={!newFolderName.trim()}
                                    p={0}
                                    style={{ height: 'auto' }}
                                >
                                    Save
                                </Button>
                            }
                        />
                    </div>
                )}

                {!showNewFolderInput && (
                    <Button
                        variant="subtle"
                        color="gray"
                        leftSection={<IconFolderPlus size={16} />}
                        onClick={() => {
                            setShowNewFolderInput(true);
                            setCreateError(null);
                        }}
                        fullWidth
                        justify="left"
                        mt="xs"
                        styles={{ root: { paddingLeft: 'var(--mantine-spacing-sm)' }}}
                    >
                        New Folder
                    </Button>
                )}
            </div>

            {/* Tags Section */}
            <NavLink
                label="Tags"
                // leftSection={<IconTag size="1rem" stroke={1.5} />}
                childrenOffset={28}
                defaultOpened
            >
                {isLoading && <Loader size="xs" ml="md" />}
                {tagsError && <Text c="red" size="xs" ml="md">Error</Text>}
                {!isLoading && !tagsError && tags.length === 0 && <Text c="dimmed" size="xs" ml="md">No tags</Text>}
                {!isLoading && !tagsError && tags.map((tag) => (
                    <NavLink
                        key={tag} // Tags are just strings from distinct query
                        label={tag}
                        component={Link}
                        to={`/tags/${tag}`}
                        active={location.pathname === `/tags/${tag}`}
                        onClick={handleLinkClick}
                    />
                ))}
            </NavLink>

            {/* TODO: Add Settings Link */}

            {/* Logout Button */}
            <div style={{ marginTop: 'auto', paddingTop: 'var(--mantine-spacing-md)', borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                 <NavLink
                    label={`Logout (${user?.username || 'User'})`}
                    leftSection={<IconLogout size={16} />}
                    onClick={handleLogout}
                    color="red"
                    styles={{ root: { paddingLeft: 'var(--mantine-spacing-sm)' }}}
                />
            </div>
        </ScrollArea>
    );
}

export default Sidebar;