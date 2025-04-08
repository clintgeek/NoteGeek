import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import {
    Description as MarkdownIcon,
    TextFields as TextIcon,
    Code as CodeIcon,
    AccountTree as MindMapIcon,
} from '@mui/icons-material';
import { NOTE_TYPES } from './NoteEditor';

function NoteTypeSelector({ value, onChange }) {
    const handleChange = (event, newValue) => {
        if (newValue) {
            onChange(newValue);
        }
    };

    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            onChange={handleChange}
            size="small"
            aria-label="note type"
        >
            <Tooltip title="Text">
                <ToggleButton value={NOTE_TYPES.TEXT} aria-label="text">
                    <TextIcon />
                </ToggleButton>
            </Tooltip>

            <Tooltip title="Markdown">
                <ToggleButton value={NOTE_TYPES.MARKDOWN} aria-label="markdown">
                    <MarkdownIcon />
                </ToggleButton>
            </Tooltip>

            <Tooltip title="Code">
                <ToggleButton value={NOTE_TYPES.CODE} aria-label="code">
                    <CodeIcon />
                </ToggleButton>
            </Tooltip>

            <Tooltip title="Mind Map">
                <ToggleButton value={NOTE_TYPES.MINDMAP} aria-label="mindmap">
                    <MindMapIcon />
                </ToggleButton>
            </Tooltip>
        </ToggleButtonGroup>
    );
}

export default NoteTypeSelector;