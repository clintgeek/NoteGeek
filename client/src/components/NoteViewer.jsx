import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Paper, Title, Text, Alert, Group, ActionIcon, Tooltip } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import useNoteStore from '../store/noteStore';
// import { IconPencil, IconTrash, IconLock, IconLockOpen } from '@tabler/icons-react';

function NoteViewer() {
    // Select state primitives individually
    const selectedNote = useNoteStore((state) => state.selectedNote);
    const isLoadingSelected = useNoteStore((state) => state.isLoadingSelected);
    const selectedError = useNoteStore((state) => state.selectedError);
    const deleteNote = useNoteStore((state) => state.deleteNote);

    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/notes/${selectedNote._id}/edit`); // Navigate to edit route
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const success = await deleteNote(selectedNote._id);
            if (success) {
                navigate('/'); // Go back to list view on success
            }
        }
    };

    // TODO: Implement unlock functionality
    const handleUnlock = () => {
        alert('Unlock functionality not implemented yet.');
    }

    if (isLoadingSelected) {
        return <Text>Loading note...</Text>;
    }

    // If there's an error (like note is locked)
    if (selectedError && !selectedNote?.content) { // Check if content is missing due to lock/error
         return (
            <Alert color="orange" title="Note Unavailable">
                {selectedError}
                {selectedNote?.isLocked && (
                   <Button ml="md" size="xs" onClick={handleUnlock}>Unlock</Button>
                )}
            </Alert>
        );
    }

    if (!selectedNote) {
        return <Text>Note not found or not selected.</Text>; // Should ideally not happen if routed correctly
    }

    // Note content exists (not locked or successfully fetched)
    return (
        <Paper shadow="xs" p="md" withBorder>
            <Group justify="space-between" mb="md">
                <Title order={2}>{selectedNote.title || 'Untitled Note'}</Title>
                <Group>
                    {selectedNote.isLocked && (
                         <Tooltip label="Unlock Note">
                             <ActionIcon variant="default" onClick={handleUnlock} aria-label="Unlock">
                                {/* <IconLock size={16} /> */} L
                             </ActionIcon>
                         </Tooltip>
                    )}
                    {!selectedNote.isLocked && !selectedNote.isEncrypted && (
                         <Tooltip label="Edit Note">
                            <ActionIcon variant="default" onClick={handleEdit} aria-label="Edit">
                                {/* <IconPencil size={16} /> */} E
                            </ActionIcon>
                        </Tooltip>
                    )}
                    {!selectedNote.isLocked && !selectedNote.isEncrypted && (
                        <Tooltip label="Delete Note">
                            <ActionIcon variant="filled" color="red" onClick={handleDelete} aria-label="Delete">
                                {/* <IconTrash size={16} /> */} D
                            </ActionIcon>
                         </Tooltip>
                    )}
                </Group>
            </Group>
            <ReactMarkdown>{selectedNote.content || ''}</ReactMarkdown>
            {/* Display tags, dates etc. if needed */}
             <Text size="xs" c="dimmed" mt="lg">
                 Created: {new Date(selectedNote.createdAt).toLocaleString()} |
                 Updated: {new Date(selectedNote.updatedAt).toLocaleString()}
             </Text>
        </Paper>
    );
}

export default NoteViewer;