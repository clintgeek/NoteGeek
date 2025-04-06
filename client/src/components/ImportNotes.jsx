import React, { useState } from 'react';
import {
    Box,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import { UploadFile, CheckCircle, Error } from '@mui/icons-material';
import useNoteStore from '../store/noteStore';

function ImportNotes() {
    const [files, setFiles] = useState([]);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState([]);
    const [error, setError] = useState(null);
    const { createNote } = useNoteStore();

    const handleFileSelect = (event) => {
        const selectedFiles = Array.from(event.target.files).filter(file =>
            file.name.endsWith('.md') || file.name.endsWith('.markdown')
        );
        setFiles(selectedFiles);
        setResults([]);
        setError(null);
    };

    const processMarkdownFile = async (file) => {
        try {
            const content = await file.text();

            // Extract title from filename or first line
            let title = file.name.replace(/\.md$|\.markdown$/i, '');
            const firstLine = content.split('\n')[0];
            if (firstLine.startsWith('# ')) {
                title = firstLine.substring(2).trim();
            }

            // Extract tags from frontmatter if present
            let tags = [];
            const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (frontMatterMatch) {
                const frontMatter = frontMatterMatch[1];
                const tagsMatch = frontMatter.match(/tags:\s*\[(.*?)\]|\ntags:\s*(.*)/);
                if (tagsMatch) {
                    const tagString = tagsMatch[1] || tagsMatch[2];
                    tags = tagString.split(',').map(tag => tag.trim().replace(/['"]/g, ''));
                }
            }

            // Create the note
            const noteData = {
                title,
                content: content,
                tags
            };

            const response = await createNote(noteData);
            return {
                filename: file.name,
                success: true,
                noteId: response._id
            };
        } catch (error) {
            console.error('Error importing note:', file.name, error);
            return {
                filename: file.name,
                success: false,
                error: error.message
            };
        }
    };

    const handleImport = async () => {
        setImporting(true);
        setError(null);
        setResults([]);

        try {
            const importResults = await Promise.all(
                files.map(file => processMarkdownFile(file))
            );
            setResults(importResults);
        } catch (err) {
            setError(err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 3 }}>
            <Typography variant="h6" gutterBottom>
                Import Markdown Notes
            </Typography>

            <Box sx={{ mb: 3 }}>
                <input
                    accept=".md,.markdown"
                    style={{ display: 'none' }}
                    id="import-files"
                    multiple
                    type="file"
                    onChange={handleFileSelect}
                />
                <label htmlFor="import-files">
                    <Button
                        variant="contained"
                        component="span"
                        startIcon={<UploadFile />}
                        disabled={importing}
                    >
                        Select Markdown Files
                    </Button>
                </label>
            </Box>

            {files.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Selected Files ({files.length}):
                    </Typography>
                    <List dense>
                        {files.map((file, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={file.name} />
                            </ListItem>
                        ))}
                    </List>
                    <Button
                        variant="contained"
                        onClick={handleImport}
                        disabled={importing}
                        sx={{ mt: 2 }}
                    >
                        {importing ? (
                            <>
                                <CircularProgress size={24} sx={{ mr: 1 }} />
                                Importing...
                            </>
                        ) : (
                            'Import Notes'
                        )}
                    </Button>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {results.length > 0 && (
                <Box>
                    <Typography variant="subtitle1" gutterBottom>
                        Import Results:
                    </Typography>
                    <List dense>
                        {results.map((result, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    {result.success ? (
                                        <CheckCircle color="success" />
                                    ) : (
                                        <Error color="error" />
                                    )}
                                </ListItemIcon>
                                <ListItemText
                                    primary={result.filename}
                                    secondary={result.success ? 'Imported successfully' : result.error}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}
        </Paper>
    );
}

export default ImportNotes;