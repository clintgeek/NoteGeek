import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextInput, Textarea, Button, Paper, Title, Select, MultiSelect, Group, Alert, LoadingOverlay } from '@mantine/core';
import useNoteStore from '../store/noteStore';
import useFolderStore from '../store/folderStore';
// import { IconDeviceFloppy } from '@tabler/icons-react';

function NoteEditor() {
    const { id: noteId } = useParams(); // Get note ID from URL for editing
    const navigate = useNavigate();
    const isEditing = Boolean(noteId);

    // Note state and actions
    const {
        selectedNote,
        isLoadingSelected,
        selectedError,
        fetchNoteById,
        createNote,
        updateNote,
        clearSelectedNote
    } = useNoteStore();

    // Folder state for dropdown
    const { folders, fetchFolders, isLoading: foldersLoading } = useFolderStore();

    // Local form state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [tags, setTags] = useState([]); // Tags are managed as an array of strings
    const [formError, setFormError] = useState(null); // Client-side form errors

    // Fetch folders for dropdown
    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    // Fetch note data if editing
    useEffect(() => {
        if (isEditing) {
            fetchNoteById(noteId);
        } else {
            clearSelectedNote(); // Clear any previous selection when creating new
            // Reset form for new note
            setTitle('');
            setContent('');
            setSelectedFolderId(null);
            setTags([]);
        }
        // Cleanup function to clear selected note when component unmounts or mode changes
        return () => clearSelectedNote();
    }, [noteId, isEditing, fetchNoteById, clearSelectedNote]);

    // Populate form when selectedNote data arrives (for editing)
    useEffect(() => {
        if (isEditing && selectedNote && selectedNote._id === noteId) {
            setTitle(selectedNote.title || '');
            setContent(selectedNote.content || '');
            setSelectedFolderId(selectedNote.folderId || null);
            setTags(selectedNote.tags || []);
        }
    }, [selectedNote, isEditing, noteId]);

    const folderOptions = folders.map(folder => ({ value: folder._id, label: folder.name }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError(null);
        useNoteStore.setState({ selectedError: null }); // Clear API error

        // Basic validation
        if (!content.trim()) {
            setFormError('Note content cannot be empty.');
            return;
        }

        const noteData = {
            title: title.trim(),
            content: content.trim(),
            folderId: selectedFolderId || null,
            tags: tags,
            // Note: Lock/Encryption status handled separately for now
        };

        let savedNote = null;
        if (isEditing) {
            savedNote = await updateNote(noteId, noteData);
        } else {
            savedNote = await createNote(noteData);
        }

        if (savedNote && savedNote._id) {
            // Optionally refresh list state here if needed
            // useNoteStore.getState().fetchNotes();
            navigate(`/notes/${savedNote._id}`); // Navigate to the view page after save
        }
        // Error handling is done via selectedError state from the store
    };

    // Show overlay while loading note data for editing, or during save
    const showLoadingOverlay = isLoadingSelected || (isEditing && !selectedNote && !selectedError);

    return (
        <Paper shadow="xs" p="md" withBorder pos="relative">
            <LoadingOverlay visible={showLoadingOverlay} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Title order={2} mb="lg">{isEditing ? 'Edit Note' : 'Create New Note'}</Title>

            {(formError || selectedError) && (
                 <Alert
                    color="red"
                    title="Error"
                    withCloseButton
                    onClose={() => { setFormError(null); useNoteStore.setState({ selectedError: null }); }}
                    mb="md"
                >
                     {formError || selectedError}
                 </Alert>
            )}

            <form onSubmit={handleSubmit}>
                <TextInput
                    label="Title"
                    placeholder="Note Title (optional)"
                    value={title}
                    onChange={(event) => setTitle(event.currentTarget.value)}
                    mb="md"
                />
                <Textarea
                    label="Content"
                    placeholder="Start writing your note... (Markdown supported)"
                    required
                    value={content}
                    onChange={(event) => setContent(event.currentTarget.value)}
                    minRows={10}
                    autosize
                    mb="md"
                />
                <Select
                    label="Folder"
                    placeholder="Assign to folder (optional)"
                    data={folderOptions}
                    value={selectedFolderId}
                    onChange={setSelectedFolderId} // Mantine Select passes value directly
                    disabled={foldersLoading}
                    clearable
                    mb="md"
                />
                <MultiSelect
                    label="Tags"
                    placeholder="Add tags (optional)"
                    data={tags} // Allow creating new tags
                    value={tags}
                    onChange={setTags}
                    searchable
                    creatable
                    clearable
                    mb="xl"
                    // TODO: Potentially fetch existing unique tags for suggestions later?
                />

                <Group justify="flex-end">
                    <Button variant="default" onClick={() => navigate(isEditing ? `/notes/${noteId}` : '/')}>Cancel</Button>
                    <Button type="submit" loading={isLoadingSelected}> {/* Reuse selected loading state */}
                        {/* leftIcon={<IconDeviceFloppy size={14} />} */}
                        Save Note
                    </Button>
                </Group>
            </form>
        </Paper>
    );
}

export default NoteEditor;