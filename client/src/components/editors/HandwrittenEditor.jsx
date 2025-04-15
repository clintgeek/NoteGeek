import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, IconButton } from '@mui/material';
import { UndoRounded, DeleteOutline } from '@mui/icons-material';

const HandwrittenEditor = ({ content, setContent, readOnly = false }) => {
    const [canvasWidth, setCanvasWidth] = useState(100);
    const containerRef = useRef(null);
    const sigCanvas = useRef(null);
    const resizeObserver = useRef(null);
    const canvasHeight = 2000;

    useEffect(() => {
        const updateCanvasWidth = () => {
            if (containerRef.current) {
                const newWidth = containerRef.current.offsetWidth;
                setCanvasWidth(newWidth);
            }
        };

        resizeObserver.current = new ResizeObserver(updateCanvasWidth);
        if (containerRef.current) {
            resizeObserver.current.observe(containerRef.current);
        }

        updateCanvasWidth();

        return () => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (content && sigCanvas.current) {
            sigCanvas.current.fromDataURL(content);
        }
    }, [content]);

    const handleClear = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setContent('');
        }
    };

    const handleUndo = () => {
        if (sigCanvas.current) {
            sigCanvas.current.undo();
            setContent(sigCanvas.current.toDataURL());
        }
    };

    const handleSave = () => {
        if (sigCanvas.current) {
            const dataUrl = sigCanvas.current.toDataURL();
            setContent(dataUrl);
        }
    };

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
        }
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                position: 'relative',
                bgcolor: '#fff',
                touchAction: 'none'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                    width: canvasWidth,
                    height: canvasHeight,
                    style: {
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        touchAction: 'none',
                        cursor: readOnly ? 'default' : 'crosshair',
                    }
                }}
                backgroundColor="rgb(255,255,255)"
                dotSize={1.5}
                minWidth={1.5}
                maxWidth={3}
                throttle={16}
                minDistance={1}
                onEnd={handleSave}
            />
            {!readOnly && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        borderRadius: 1,
                        p: 0.5
                    }}
                >
                    <IconButton onClick={handleUndo} size="small">
                        <UndoRounded />
                    </IconButton>
                    <IconButton onClick={handleClear} size="small">
                        <DeleteOutline />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
};

export default HandwrittenEditor;