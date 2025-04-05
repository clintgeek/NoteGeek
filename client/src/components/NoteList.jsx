import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { List, ThemeIcon, Loader, Text, Alert, Anchor } from '@mantine/core';
// import { IconCircleDashed } from '@tabler/icons-react'; // Example icon
import useNoteStore from '../store/noteStore';

// Accept folderId and tag props for filtering
function NoteList({ folderId, tag }) {
    const notes = useNoteStore((state) => state.notes);
    const isLoadingList = useNoteStore((state) => state.isLoadingList);
    const listError = useNoteStore((state) => state.listError);
    const fetchNotes = useNoteStore((state) => state.fetchNotes);

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

    if (notes.length === 0) {
        return <Text>No notes found. Create one!</Text>;
    }

    return (
        <List
            spacing="xs"
            size="sm"
            center
            // icon={
            //     <ThemeIcon color="teal" size={24} radius="xl">
            //         <IconCircleDashed size="1rem" />
            //     </ThemeIcon>
            // }
        >
            {notes.map((note) => (
                <List.Item key={note._id}>
                    <Anchor component={Link} to={`/notes/${note._id}`}>
                         {note.title || 'Untitled Note'}
                    </Anchor>
                     {note.isLocked && ' (Locked)'} {/* Indicate locked status */}
                </List.Item>
            ))}
        </List>
    );
}

export default NoteList;