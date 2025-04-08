import React, { memo, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Paper, Typography, IconButton, Box, Tooltip } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

function MindMapNode({ data, isConnectable, selected }) {
    useEffect(() => {
        console.log('MindMapNode rendered:', {
            id: data.id,
            label: data.label,
            hasEditCb: !!data.onEdit,
            hasAddCb: !!data.onAdd,
            hasDeleteCb: !!data.onDelete
        });
    }, [data]);

    // Determine if this node is in edit mode based on callback presence
    const isEditable = Boolean(data.onEdit || data.onAdd || data.onDelete);

    const handleClick = (e, callback) => {
        console.log('Click event:', {
            target: e.target,
            currentTarget: e.currentTarget,
            eventPhase: e.eventPhase
        });
        e.stopPropagation();
        if (callback) {
            console.log('Executing callback for node:', data.id);
            callback();
        }
    };

    return (
        <Paper
            onClick={(e) => {
                console.log('Paper clicked:', {
                    id: data.id,
                    target: e.target,
                    currentTarget: e.currentTarget
                });
            }}
            elevation={selected ? 8 : 1}
            sx={{
                minWidth: 150,
                maxWidth: 250,
                p: 1,
                border: selected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: data.isRoot ? '#e3f2fd' : '#fff',
                '&:hover': {
                    boxShadow: (theme) => theme.shadows[4]
                },
                userSelect: 'none',
                // Add a subtle edit mode indicator
                position: 'relative',
                '&::before': isEditable ? {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    backgroundColor: '#4caf50',
                    borderRadius: '50%'
                } : {}
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={isConnectable}
                style={{
                    background: '#90caf9',
                    width: 8,
                    height: 8,
                    border: '2px solid #1976d2'
                }}
            />

            <Box
                className="drag-handle"
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: isEditable ? 'move' : 'default'
                }}
            >
                <Typography
                    variant="body1"
                    sx={{
                        wordBreak: 'break-word',
                        flex: 1,
                        fontWeight: data.isRoot ? 500 : 400,
                        mr: 1
                    }}
                >
                    {data.label}
                </Typography>

                {/* Show edit buttons when edit callbacks are available */}
                <Box sx={{ display: 'flex', gap: 0.5, cursor: 'default' }}>
                    {data.onEdit && (
                        <Tooltip title="Edit node">
                            <IconButton
                                size="small"
                                onClick={(e) => handleClick(e, data.onEdit)}
                                sx={{
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {data.onAdd && (
                        <Tooltip title="Add child node">
                            <IconButton
                                size="small"
                                onClick={(e) => handleClick(e, data.onAdd)}
                                sx={{
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    {data.onDelete && !data.isRoot && (
                        <Tooltip title="Delete node">
                            <IconButton
                                size="small"
                                onClick={(e) => handleClick(e, data.onDelete)}
                                sx={{
                                    p: 0.5,
                                    '&:hover': {
                                        backgroundColor: 'error.light',
                                        color: 'error.contrastText'
                                    }
                                }}
                            >
                                <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            <Handle
                type="source"
                position={Position.Right}
                isConnectable={isConnectable}
                style={{
                    background: '#90caf9',
                    width: 8,
                    height: 8,
                    border: '2px solid #1976d2'
                }}
            />
        </Paper>
    );
}

export default memo(MindMapNode, (prev, next) => {
    const prevHasCallbacks = !!(prev.data.onEdit || prev.data.onAdd || prev.data.onDelete);
    const nextHasCallbacks = !!(next.data.onEdit || next.data.onAdd || next.data.onDelete);

    const areEqual = prev.data.label === next.data.label &&
                    prev.selected === next.selected &&
                    prevHasCallbacks === nextHasCallbacks;

    console.log('MindMapNode memo comparison:', {
        prevProps: {
            id: prev.data.id,
            label: prev.data.label,
            hasCallbacks: prevHasCallbacks
        },
        nextProps: {
            id: next.data.id,
            label: next.data.label,
            hasCallbacks: nextHasCallbacks
        },
        areEqual
    });

    return areEqual;
});