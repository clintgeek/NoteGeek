import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
    Box,
    IconButton,
    Stack,
    Tooltip,
    useTheme,
    useMediaQuery,
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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const sigCanvas = useRef(null);
    const containerRef = useRef(null);
    const [color, setColor] = useState('#000000');
    const [penSize, setPenSize] = useState(2);
    const [touchCount, setTouchCount] = useState(0);
    const canvasHeight = isMobile ? window.innerHeight - 200 : 2000; // Adjust height for mobile

    useEffect(() => {
        if (content && sigCanvas.current && !readOnly) {
            try {
                sigCanvas.current.fromDataURL(content);
            } catch (error) {
                console.error('HandwrittenEditor - Error loading content:', error);
            }
        }
    }, [content, readOnly]);

    useEffect(() => {
        const handleTouchStart = (e) => {
            setTouchCount(e.touches.length);
            if (e.touches.length === 2) {
                e.preventDefault();
                if (sigCanvas.current) {
                    sigCanvas.current.off();
                }
            }
        };

        const handleTouchEnd = (e) => {
            setTouchCount(e.touches.length);
            if (e.touches.length < 2 && !readOnly) {
                if (sigCanvas.current) {
                    sigCanvas.current.on();
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('touchstart', handleTouchStart, { passive: false });
            container.addEventListener('touchend', handleTouchEnd);
            container.addEventListener('touchcancel', handleTouchEnd);
        }

        return () => {
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchend', handleTouchEnd);
                container.removeEventListener('touchcancel', handleTouchEnd);
            }
        };
    }, [readOnly]);

    useEffect(() => {
        // Handle window resize for mobile
        const handleResize = () => {
            if (isMobile && sigCanvas.current) {
                const canvas = sigCanvas.current.getCanvas();
                const container = containerRef.current;
                if (canvas && container) {
                    canvas.width = container.clientWidth;
                    canvas.style.width = '100%';
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial resize

        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

    const handleClear = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setContent('');
        }
    };

    const handleSave = () => {
        if (sigCanvas.current) {
            const dataUrl = sigCanvas.current.toDataURL();
            setContent(dataUrl);
        }
    };

    const handleUndo = () => {
        if (sigCanvas.current) {
            const data = sigCanvas.current.toData();
            if (data && data.length > 0) {
                data.pop();
                sigCanvas.current.fromData(data);
                handleSave();
            }
        }
    };

    // If in read-only mode, just display the content as an image
    if (readOnly) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    overflow: 'auto',
                    bgcolor: '#fff'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        minHeight: '100%',
                        position: 'relative'
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
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                maxWidth: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: touchCount === 2 ? 'auto' : 'hidden',
                bgcolor: '#fff',
                touchAction: touchCount === 2 ? 'pan-y' : 'none'
            }}
        >
            {/* Toolbar */}
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    p: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    width: '100%',
                    maxWidth: '100%',
                    flexShrink: 0
                }}
            >
                {/* Color Picker */}
                <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                        setColor(e.target.value);
                        if (sigCanvas.current) {
                            sigCanvas.current.penColor = e.target.value;
                        }
                    }}
                    style={{ width: 40, height: 40, padding: 0, border: 'none' }}
                />

                {/* Pen Size Buttons */}
                <Stack direction="row" spacing={0.5}>
                    {[1, 2, 3, 4].map((size) => (
                        <Tooltip key={size} title={`Size: ${size}`}>
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setPenSize(size);
                                    if (sigCanvas.current) {
                                        sigCanvas.current.penSize = size;
                                    }
                                }}
                                sx={{
                                    bgcolor: penSize === size ? 'action.selected' : 'transparent',
                                    '&:hover': { bgcolor: 'action.hover' },
                                    padding: isMobile ? '4px' : '8px'
                                }}
                            >
                                <BrushIcon sx={{ fontSize: 12 + size * 2 }} />
                            </IconButton>
                        </Tooltip>
                    ))}
                </Stack>

                {/* Action Buttons */}
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Undo">
                        <IconButton onClick={handleUndo} size="small">
                            <UndoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear">
                        <IconButton onClick={handleClear} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Save">
                        <IconButton onClick={handleSave} size="small" color="primary">
                            <SaveIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Canvas Container */}
            <Box
                sx={{
                    position: 'relative',
                    flexGrow: 1,
                    width: '100%',
                    maxWidth: '100%',
                    height: isMobile ? `${canvasHeight}px` : '100%',
                    overflow: touchCount === 2 ? 'auto' : 'hidden'
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
                            maxWidth: '100%',
                            height: canvasHeight,
                            touchAction: touchCount === 2 ? 'pan-y' : 'none'
                        }
                    }}
                    backgroundColor="rgba(0,0,0,0)"
                    penColor={color}
                    minWidth={0.5}
                    maxWidth={4}
                    throttle={16}
                    onEnd={handleSave}
                />
            </Box>
        </Box>
    );
};

export default HandwrittenEditor;