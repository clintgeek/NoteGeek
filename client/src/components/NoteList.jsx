import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, ThemeIcon, Loader, Text, Alert, Anchor, Title } from '@mantine/core';
// import { IconCircleDashed } from '@tabler/icons-react'; // Example icon
import useNoteStore from '../store/noteStore';
import useFolderStore from '../store/folderStore';

// Accept folderId and tag props for filtering
function NoteList({ folderId, tag }) {
    const notes = useNoteStore((state) => state.notes);
    const isLoadingList = useNoteStore((state) => state.isLoadingList);
    const listError = useNoteStore((state) => state.listError);
    const fetchNotes = useNoteStore((state) => state.fetchNotes);

    // Get folders to look up the name
    const folders = useFolderStore((state) => state.folders);

    useEffect(() => {
        const filters = {};
        if (folderId) filters.folderId = folderId;
        if (tag) filters.tag = tag;

        fetchNotes(filters); // Fetch notes with filters when component mounts or filters change
    }, [fetchNotes, folderId, tag]); // Add folderId and tag to dependency array

    if (isLoadingList) {
        return <Loader />; // Display loader while fetching
    }

    if (listError) {
        return (
            <Alert color="red" title="Error loading notes">
                {listError}
            </Alert>
        );
    }

    // Get folder name if we're viewing a folder
    const currentFolder = folderId ? folders.find(f => f._id === folderId) : null;

    return (
        <>
            {!currentFolder && !tag && notes.length === 0 && (
                <Text>No notes found. Create one!</Text>
            )}
            {notes.length > 0 && (
                <List
                    spacing="xs"
                    size="sm"
                    center
                >
                    {notes.map((note) => (
                        <List.Item key={note._id}>
                            <Anchor component={Link} to={`/notes/${note._id}`}>
                                {note.title || 'Untitled Note'}
                            </Anchor>
                            {note.isLocked && ' (Locked)'}
                        </List.Item>
                    ))}
                </List>
            )}
        </>
    );
}

export default NoteList;