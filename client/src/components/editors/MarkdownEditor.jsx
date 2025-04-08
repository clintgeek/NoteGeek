import React from 'react';
import { Box, TextField } from '@mui/material';

function MarkdownEditor({ content, setContent, isLoading }) {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
        }}>
            <TextField
                placeholder="Start writing..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                multiline
                fullWidth
                variant="standard"
                disabled={isLoading}
                InputProps={{
                    disableUnderline: true,
                }}
                sx={{
                    flex: '1 0 auto',
                    '& .MuiInputBase-root': {
                        padding: { xs: '8px 0', sm: 2 },
                    },
                    '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        resize: 'none',
                        '&::placeholder': {
                            color: 'text.secondary',
                            opacity: 0.7,
                        },
                    },
                }}
            />
        </Box>
    );
}

export default MarkdownEditor;