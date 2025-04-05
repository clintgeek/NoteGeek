import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink, ScrollArea, Loader, Text, Button } from '@mantine/core';
import useFolderStore from '../store/folderStore';
import useTagStore from '../store/tagStore';
import useAuthStore from '../store/authStore';
// import { IconHome2, IconNotebook, IconTag, IconSearch, IconSettings, IconLogout } from '@tabler/icons-react'; // Example icons

function Sidebar({ closeNavbar }) {
    const location = useLocation(); // Get current path for active state
    const { folders, fetchFolders, isLoading: foldersLoading, error: foldersError } = useFolderStore();
    const { tags, fetchTags, isLoading: tagsLoading, error: tagsError } = useTagStore();
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        fetchFolders();
        fetchTags();
    }, [fetchFolders, fetchTags]);

    // Combined loading state for simplicity in UI
    const isLoading = foldersLoading || tagsLoading;

    const handleLinkClick = () => {
        // Close navbar on mobile after link click, if function provided
        closeNavbar?.();
    };

    const handleLogout = () => {
        handleLinkClick(); // Close navbar first
        logout();
        // Navigation to /login will happen automatically due to ProtectedRoute
    };

  return (
    <ScrollArea h="calc(100vh - 60px)"> {/* Adjust height based on header */}
       {/* Add New Note Button at the top */}
        <Button
            component={Link}
            to="/notes/new"
            fullWidth
            mb="md"
            // leftSection={<IconPlus size={14}/>}
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
      <NavLink
        label="Folders"
        // leftSection={<IconHome2 size="1rem" stroke={1.5} />}
        childrenOffset={28}
        defaultOpened // Keep open by default maybe?
      >
        {isLoading && <Loader size="xs" ml="md" />}
        {foldersError && <Text c="red" size="xs" ml="md">Error</Text>}
        {!isLoading && !foldersError && folders.length === 0 && <Text c="dimmed" size="xs" ml="md">No folders</Text>}
        {!isLoading && !foldersError && folders.map((folder) => (
             <NavLink
                key={folder._id}
                label={folder.name}
                component={Link}
                to={`/folders/${folder._id}`}
                active={location.pathname === `/folders/${folder._id}`}
                onClick={handleLinkClick}
             />
        ))}
        {/* TODO: Add "Create Folder" button/link here */}
      </NavLink>

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
       <NavLink
        label="Logout"
        // leftSection={<IconLogout size="1rem" stroke={1.5} />}
        onClick={handleLogout}
        mt="xl" // Push towards bottom
      />
    </ScrollArea>
  );
}

export default Sidebar;