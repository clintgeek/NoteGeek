import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, IconButton } from '@mui/material';
import { UndoRounded, DeleteOutline } from '@mui/icons-material';

const HandwrittenEditor = ({ content, setContent, readOnly = false }) => {
    const containerRef = useRef(null);
    const sigCanvas = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [isRestoring, setIsRestoring] = useState(false);

    const setupCanvas = () => {
        if (!sigCanvas.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = sigCanvas.current.getCanvas();
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;

        if (newWidth === 0 || newHeight === 0) return;
        if (newWidth === canvas.width && newHeight === canvas.height) return;

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Override the signature pad's internal point calculation
        const signaturePad = sigCanvas.current;
        const originalPointToCanvas = signaturePad._createPoint;
        signaturePad._createPoint = function(event) {
            const canvasRect = canvas.getBoundingClientRect();
            const point = originalPointToCanvas.call(this, event);
            const touch = event.touches ? event.touches[0] : event;

            point.x = touch.clientX - canvasRect.left;
            point.y = touch.clientY - canvasRect.top;

            return point;
        };

        return { width: newWidth, height: newHeight };
    };

    // Handle initial setup and dimension changes
    useEffect(() => {
        const newDimensions = setupCanvas();
        if (newDimensions && (newDimensions.width !== dimensions.width || newDimensions.height !== dimensions.height)) {
            setDimensions(newDimensions);
        }
    }, []);

    // Handle content changes
    useEffect(() => {
        if (!sigCanvas.current || !content || isRestoring) return;

        setIsRestoring(true);
        const canvas = sigCanvas.current.getCanvas();

        const img = new Image();
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setIsRestoring(false);
        };
        img.src = content;
    }, [content]);

    // Add resize observer
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(() => {
            const newDimensions = setupCanvas();
            if (newDimensions) {
                setDimensions(newDimensions);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

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
            const canvas = sigCanvas.current.getCanvas();
            const dataUrl = canvas.toDataURL();
            setContent(dataUrl);
        }
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                bgcolor: '#fff',
                touchAction: 'none',
                '& canvas': {
                    width: '100% !important',
                    height: '100% !important',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'none !important'
                }
            }}
        >
            <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                    style: {
                        touchAction: 'none',
                        cursor: readOnly ? 'default' : 'crosshair'
                    }
                }}
                backgroundColor="rgb(255,255,255)"
                dotSize={1}
                minWidth={1}
                maxWidth={2}
                throttle={16}
                minDistance={1}
                onEnd={handleSave}
            />
            {!readOnly && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 150,
                        right: 8,
                        display: 'flex',
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        borderRadius: 1,
                        p: 0.5,
                        zIndex: 1
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