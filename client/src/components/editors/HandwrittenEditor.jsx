import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
    Box,
    IconButton,
    Stack,
    Tooltip,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Undo as UndoIcon,
    Save as SaveIcon,
    Brush as BrushIcon,
    FormatColorFill as ColorIcon,
    Edit as EditIcon
} from '@mui/icons-material';

const HandwrittenEditor = ({ content, setContent, readOnly }) => {
    const sigCanvas = useRef(null);
    const containerRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [penSize, setPenSize] = useState(2);
    const [canvasHeight, setCanvasHeight] = useState(2000); // Start with a tall canvas

    useEffect(() => {
        // Load saved content if it exists
        console.log('HandwrittenEditor - Loading content, exists:', !!content);
        if (content && sigCanvas.current && !readOnly) {
            try {
                console.log('HandwrittenEditor - Loading content into canvas');
                sigCanvas.current.fromDataURL(content);
                console.log('HandwrittenEditor - Content loaded successfully');
            } catch (error) {
                console.error('HandwrittenEditor - Error loading content:', error);
            }
        }
    }, [content, readOnly]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || readOnly) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;

            // If we're near the bottom, increase canvas height
            if (scrollHeight - (scrollTop + clientHeight) < 500) {
                setCanvasHeight(prev => prev + 1000);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [readOnly]);

    const handleSave = () => {
        console.log('HandwrittenEditor - Attempting to save...');
        if (sigCanvas.current) {
            try {
                console.log('HandwrittenEditor - Converting canvas to data URL...');
                const dataURL = sigCanvas.current.toDataURL('image/png');
                console.log('HandwrittenEditor - Data URL length:', dataURL.length);
                setContent(dataURL);
                console.log('HandwrittenEditor - Save completed');
            } catch (error) {
                console.error('HandwrittenEditor - Error saving content:', error);
            }
        } else {
            console.warn('HandwrittenEditor - No canvas reference available');
        }
    };

    const handleClear = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setContent('');
            // Reset canvas height to initial value
            setCanvasHeight(2000);
            // Scroll to top
            if (containerRef.current) {
                containerRef.current.scrollTop = 0;
            }
        }
    };

    const handleUndo = () => {
        if (sigCanvas.current) {
            const data = sigCanvas.current.toData();
            if (data && data.length > 0) {
                data.pop(); // remove the last stroke
                sigCanvas.current.fromData(data);
                // Also update the content after undo
                handleSave();
            }
        }
    };

    const colors = ['#000000', '#FF0000', '#0000FF', '#008000'];
    const sizes = [1, 2, 3, 5];

    if (readOnly) {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                overflow: 'hidden'
            }}>
                <Box
                    sx={{
                        flex: 1,
                        bgcolor: '#FFFFFF',
                        position: 'relative',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(0,0,0,0.1)',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                        }
                    }}
                >
                    {/* Paper Background */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            backgroundImage: 'linear-gradient(#e3e3e3 1px, transparent 1px)',
                            backgroundSize: '100% 20px',
                            opacity: 0.5,
                            pointerEvents: 'none'
                        }}
                    />
                    <Box
                        component="img"
                        src={content}
                        alt="Handwritten note"
                        sx={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                        }}
                    />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.paper',
            borderRadius: 1,
            overflow: 'hidden'
        }}>
            {/* Toolbar */}
            <Stack
                direction="row"
                spacing={1}
                sx={{
                    p: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1
                }}
            >
                <Tooltip title="Clear">
                    <IconButton onClick={handleClear} size="small">
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Undo">
                    <IconButton onClick={handleUndo} size="small">
                        <UndoIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Save">
                    <IconButton onClick={handleSave} size="small">
                        <SaveIcon />
                    </IconButton>
                </Tooltip>

                {/* Color selector */}
                <Stack direction="row" spacing={0.5}>
                    {colors.map((c) => (
                        <Tooltip key={c} title={`Color: ${c}`}>
                            <IconButton
                                size="small"
                                onClick={() => setColor(c)}
                                sx={{
                                    color: c,
                                    bgcolor: color === c ? 'action.selected' : 'transparent',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <ColorIcon />
                            </IconButton>
                        </Tooltip>
                    ))}
                </Stack>

                {/* Pen size selector */}
                <Stack direction="row" spacing={0.5}>
                    {sizes.map((size) => (
                        <Tooltip key={size} title={`Size: ${size}`}>
                            <IconButton
                                size="small"
                                onClick={() => setPenSize(size)}
                                sx={{
                                    bgcolor: penSize === size ? 'action.selected' : 'transparent',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <BrushIcon sx={{ fontSize: 14 + size * 2 }} />
                            </IconButton>
                        </Tooltip>
                    ))}
                </Stack>
            </Stack>

            {/* Canvas Container */}
            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    bgcolor: '#FFFFFF',
                    position: 'relative',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: '4px',
                    }
                }}
            >
                {/* Paper Background */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: canvasHeight,
                        backgroundImage: 'linear-gradient(#e3e3e3 1px, transparent 1px)',
                        backgroundSize: '100% 20px',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }}
                />

                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        className: 'signature-canvas',
                        style: {
                            width: '100%',
                            height: `${canvasHeight}px`,
                            cursor: 'crosshair'
                        }
                    }}
                    backgroundColor='rgb(255, 255, 255)'
                    penColor={color}
                    dotSize={penSize}
                    minWidth={penSize}
                    maxWidth={penSize * 2}
                    throttle={16}
                    onEnd={handleSave}
                />
            </Box>
        </Box>
    );
};

export default HandwrittenEditor;