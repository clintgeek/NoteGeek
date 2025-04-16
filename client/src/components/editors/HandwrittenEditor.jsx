import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, IconButton } from '@mui/material';
import { UndoRounded, DeleteOutline } from '@mui/icons-material';

const CANVAS_HEIGHT = 10000; // Very large height for "infinite" scrolling

const HandwrittenEditor = ({ content, setContent, readOnly = false }) => {
    const containerRef = useRef(null);
    const sigCanvas = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: CANVAS_HEIGHT });
    const [isRestoring, setIsRestoring] = useState(false);
    const [isTwoFinger, setIsTwoFinger] = useState(false);
    const lastTouchY = useRef(0);

    const setupCanvas = () => {
        if (!sigCanvas.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = sigCanvas.current.getCanvas();
        const newWidth = container.clientWidth;

        if (newWidth === 0) return;
        if (newWidth === canvas.width && canvas.height === CANVAS_HEIGHT) return;

        canvas.width = newWidth;
        canvas.height = CANVAS_HEIGHT;

        // Override the signature pad's internal point calculation
        const signaturePad = sigCanvas.current;
        const originalPointToCanvas = signaturePad._createPoint;
        signaturePad._createPoint = function(event) {
            const canvasRect = canvas.getBoundingClientRect();
            const point = originalPointToCanvas.call(this, event);
            const touch = event.touches ? event.touches[0] : event;
            const scrollTop = container.scrollTop;

            point.x = touch.clientX - canvasRect.left;
            point.y = touch.clientY - canvasRect.top + scrollTop;

            return point;
        };

        return { width: newWidth, height: CANVAS_HEIGHT };
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

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            setIsTwoFinger(true);
            // Disable the canvas completely during two-finger scrolling
            if (sigCanvas.current) {
                sigCanvas.current.off();
            }
            lastTouchY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        } else if (e.touches.length === 1 && !isTwoFinger) {
            // Re-enable the canvas for drawing
            if (sigCanvas.current) {
                sigCanvas.current.on();
            }
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const container = containerRef.current;
            const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const deltaY = currentY - lastTouchY.current;
            container.scrollTop -= deltaY;
            lastTouchY.current = currentY;
        }
    };

    const handleTouchEnd = (e) => {
        if (e.touches.length === 0) {
            setIsTwoFinger(false);
            // Re-enable the canvas when all fingers are lifted
            if (sigCanvas.current) {
                sigCanvas.current.on();
            }
        } else if (e.touches.length === 1) {
            setIsTwoFinger(false);
            // Re-enable the canvas when transitioning to one finger
            if (sigCanvas.current) {
                sigCanvas.current.on();
            }
        }
    };

    return (
        <Box
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                bgcolor: '#fff',
                touchAction: isTwoFinger ? 'none' : 'pan-y',
                overflowY: 'auto',
                overflowX: 'hidden',
                '& canvas': {
                    width: '100% !important',
                    height: `${CANVAS_HEIGHT}px !important`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: 'none !important',
                    touchAction: 'none',
                    pointerEvents: isTwoFinger ? 'none' : 'auto'
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