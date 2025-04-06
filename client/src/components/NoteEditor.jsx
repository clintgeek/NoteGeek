import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    TextInput,
    Textarea,
    Button,
    Paper,
    Title,
    Select,
    MultiSelect,
    Group,
    Alert,
    LoadingOverlay,
    Modal,
    ActionIcon,
    Flex
} from '@mantine/core';
import useNoteStore from '../store/noteStore';
import useFolderStore from '../store/folderStore';
// import { IconDeviceFloppy } from '@tabler/icons-react';

function NoteEditor() {
    const { id: noteId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(noteId);

    // Note store selectors
    const selectedNote = useNoteStore((state) => state.selectedNote);
    const isLoadingSelected = useNoteStore((state) => state.isLoadingSelected);
    const selectedError = useNoteStore((state) => state.selectedError);
    const createNote = useNoteStore((state) => state.createNote);
    const updateNote = useNoteStore((state) => state.updateNote);
    const clearSelectedNote = useNoteStore((state) => state.clearSelectedNote);

    // Folder store selectors
    const folders = useFolderStore((state) => state.folders);
    const fetchFolders = useFolderStore((state) => state.fetchFolders);
    const createFolder = useFolderStore((state) => state.createFolder);
    const foldersLoading = useFolderStore((state) => state.isLoading);

    // Local state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [tags, setTags] = useState([]);
    const [formError, setFormError] = useState(null);
    const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderError, setFolderError] = useState(null);

    // Memoize folder options
    const folderOptions = React.useMemo(() =>
        folders.map(folder => ({ value: folder._id, label: folder.name })),
        [folders]
    );

    // Reset form function
    const resetForm = React.useCallback(() => {
        setTitle('');
        setContent('');
        setSelectedFolderId(null);
        setTags([]);
        setFormError(null);
    }, []);

    // Fetch folders only once on mount
    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    // Handle form reset for new notes
    useEffect(() => {
        if (!isEditing) {
            clearSelectedNote();
            resetForm();
        }
        return () => clearSelectedNote();
    }, [isEditing, clearSelectedNote, resetForm]);

    // Update form when note data changes
    useEffect(() => {
        if (selectedNote && selectedNote._id === noteId) {
            setTitle(selectedNote.title || '');
            setContent(selectedNote.content || '');
            setSelectedFolderId(selectedNote.folderId || null);
            setTags(selectedNote.tags || []);
        }
    }, [selectedNote, noteId]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            setFolderError('Folder name cannot be empty');
            return;
        }
        try {
            const newFolder = await createFolder({ name: newFolderName.trim() });
            if (newFolder?._id) {
                setSelectedFolderId(newFolder._id);
                setNewFolderModalOpen(false);
                setNewFolderName('');
                setFolderError(null);
            }
        } catch (error) {
            setFolderError(error.message || 'Failed to create folder');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError(null);
        useNoteStore.setState({ selectedError: null });

        if (!content.trim()) {
            setFormError('Note content cannot be empty.');
            return;
        }

        const noteData = {
            title: title.trim(),
            content: content.trim(),
            folderId: selectedFolderId || null,
            tags: tags,
        };

        try {
            const savedNote = isEditing
                ? await updateNote(noteId, noteData)
                : await createNote(noteData);

            if (savedNote?._id) {
                navigate(`/notes/${savedNote._id}`);
            }
        } catch (error) {
            console.error("Error during note save:", error);
        }
    };

    // Only show loading overlay during actual loading operations
    const showLoadingOverlay = isLoadingSelected || foldersLoading;

    return (
        <>
            <Modal
                opened={newFolderModalOpen}
                onClose={() => {
                    setNewFolderModalOpen(false);
                    setNewFolderName('');
                    setFolderError(null);
                }}
                title="Create New Folder"
            >
                {folderError && (
                    <Alert color="red" title="Error" mb="md">
                        {folderError}
                    </Alert>
                )}
                <TextInput
                    label="Folder Name"
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.currentTarget.value)}
                    mb="md"
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setNewFolderModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateFolder}>
                        Create Folder
                    </Button>
                </Group>
            </Modal>

            <Paper shadow="xs" p="md" withBorder pos="relative">
                <LoadingOverlay visible={showLoadingOverlay} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <Title order={2} mb="lg">{isEditing ? 'Edit Note' : 'Create New Note'}</Title>

                {(formError || selectedError) && (
                    <Alert
                        color="red"
                        title="Error"
                        withCloseButton
                        onClose={() => {
                            setFormError(null);
                            useNoteStore.setState({ selectedError: null });
                        }}
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
                        disabled={showLoadingOverlay}
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
                        disabled={showLoadingOverlay}
                    />
                    <Flex gap="sm" align="flex-end" mb="md">
                        <Select
                            style={{ flex: 1 }}
                            label="Folder"
                            placeholder="Assign to folder (optional)"
                            data={folderOptions}
                            value={selectedFolderId}
                            onChange={setSelectedFolderId}
                            disabled={foldersLoading || showLoadingOverlay}
                            clearable
                        />
                        <ActionIcon
                            variant="filled"
                            size="lg"
                            onClick={() => setNewFolderModalOpen(true)}
                            disabled={foldersLoading || showLoadingOverlay}
                        >
                            +
                        </ActionIcon>
                    </Flex>
                    <MultiSelect
                        label="Tags"
                        placeholder="Add tags (optional)"
                        data={tags}
                        value={tags}
                        onChange={setTags}
                        searchable
                        clearable
                        creatable
                        getCreateLabel={(query) => `+ Create "${query}"`}
                        mb="xl"
                        disabled={showLoadingOverlay}
                    />

                    <Group justify="flex-end">
                        <Button
                            variant="default"
                            onClick={() => navigate(isEditing && selectedNote ? `/notes/${selectedNote._id}` : '/')}
                            disabled={showLoadingOverlay}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isLoadingSelected}
                            disabled={showLoadingOverlay}
                        >
                            Save Note
                        </Button>
                    </Group>
                </form>
            </Paper>
        </>
    );
}

export default NoteEditor;