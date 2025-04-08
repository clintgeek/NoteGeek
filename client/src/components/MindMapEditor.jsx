import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import MindMapNode from './MindMapNode';

// Define node types outside component to prevent recreation
const nodeTypes = {
    mindmap: MindMapNode,
};

// Default viewport settings
const defaultViewport = { x: 0, y: 0, zoom: 1 };

function MindMapEditorInner({ initialData, onSave }) {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [editingNode, setEditingNode] = useState(null);
    const nextIdRef = useRef(1);
    const hasUserInteracted = useRef(false);

    // Add dimension logging
    useEffect(() => {
        if (containerRef.current) {
            const updateDimensions = () => {
                const rect = containerRef.current.getBoundingClientRect();
                console.log('MindMap Container Dimensions:', {
                    rect,
                    parentRect: containerRef.current.parentElement?.getBoundingClientRect(),
                    parentStyle: window.getComputedStyle(containerRef.current.parentElement)
                });
                setDimensions({ width: rect.width, height: rect.height });
            };

            // Initial update
            updateDimensions();

            // Update on resize
            const observer = new ResizeObserver(updateDimensions);
            observer.observe(containerRef.current);

            // Also observe parent for size changes
            if (containerRef.current.parentElement) {
                observer.observe(containerRef.current.parentElement);
            }

            return () => observer.disconnect();
        }
    }, []);

    // Add logging to initialization
    React.useEffect(() => {
        console.log('MindMap Initialization:', {
            hasInitialData: !!initialData,
            contentPresent: !!initialData?.content,
            dimensions,
            containerExists: !!containerRef.current
        });

        if (initialData?.content) {
            try {
                const data = JSON.parse(initialData.content);
                console.log('Parsed mind map data:', data);
                setNodes(data.nodes);
                setEdges(data.edges);
                nextIdRef.current = Math.max(...data.nodes.map(n => parseInt(n.id))) + 1;
            } catch (e) {
                console.error('Failed to parse mind map data:', e);
                initializeEmptyMap();
            }
        } else {
            initializeEmptyMap();
        }
    }, [initialData, dimensions]);

    const initializeEmptyMap = () => {
        console.log('Creating empty mind map with dimensions:', dimensions);
        const rootNode = {
            id: '0',
            type: 'mindmap',
            data: {
                label: 'Main Idea',
                isRoot: true,
                onEdit: () => handleEditNode('0', 'Main Idea'),
                onAdd: () => handleAddChild('0'),
            },
            position: { x: dimensions.width / 2 || 350, y: dimensions.height / 2 || 250 },
        };
        console.log('Creating root node:', rootNode);
        setNodes([rootNode]);
        setEdges([]);
    };

    const handleEditNode = (id, currentLabel) => {
        hasUserInteracted.current = true;
        setEditingNode({ id, label: currentLabel });
    };

    const handleAddChild = (parentId) => {
        hasUserInteracted.current = true;
        const parentNode = nodes.find(n => n.id === parentId);
        if (!parentNode) return;

        const newNodeId = nextIdRef.current.toString();
        nextIdRef.current += 1;

        // Calculate new node position relative to parent
        const parentOutgoers = nodes.filter(n =>
            edges.some(e => e.source === parentId && e.target === n.id)
        );
        const yOffset = parentOutgoers.length * 80;

        const newNode = {
            id: newNodeId,
            type: 'mindmap',
            data: {
                label: 'New Node',
                onDelete: () => handleNodeDelete(newNodeId),
                onEdit: () => handleEditNode(newNodeId, 'New Node'),
                onAdd: () => handleAddChild(newNodeId),
            },
            position: {
                x: parentNode.position.x + 200,
                y: parentNode.position.y + yOffset - 100,
            },
        };

        const newEdge = {
            id: `e${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#2196f3' }
        };

        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [...eds, newEdge]);
        handleEditNode(newNodeId, 'New Node');
    };

    const handleNodeDelete = useCallback((nodeId) => {
        hasUserInteracted.current = true;
        setNodes(nds => nds.filter(node => node.id !== nodeId));
        setEdges(eds => eds.filter(edge =>
            edge.source !== nodeId && edge.target !== nodeId
        ));
    }, [setNodes, setEdges]);

    const handleSaveNode = () => {
        if (!editingNode || !editingNode.label.trim()) {
            setEditingNode(null);
            return;
        }

        hasUserInteracted.current = true;
        setNodes(nds => nds.map(node => {
            if (node.id === editingNode.id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        label: editingNode.label,
                    }
                };
            }
            return node;
        }));
        setEditingNode(null);
    };

    // Handle edge connections
    const onConnect = useCallback((params) => {
        hasUserInteracted.current = true;
        setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: false }, eds));
    }, [setEdges]);

    // Handle node position changes
    const handleNodesChange = useCallback((changes) => {
        // Only mark as interacted if the change is a position change
        if (changes.some(change => change.type === 'position')) {
            hasUserInteracted.current = true;
        }
        onNodesChange(changes);
    }, [onNodesChange]);

    // Save mind map changes, but only after user interaction
    React.useEffect(() => {
        // Don't save if the user hasn't interacted yet
        if (!hasUserInteracted.current) return;

        // Don't save if we don't have any nodes
        if (nodes.length === 0) return;

        const timeoutId = setTimeout(() => {
            onSave({
                title: initialData?.title,
                content: JSON.stringify({ nodes, edges }),
                tags: initialData?.tags,
                type: 'mindmap'
            });
        }, 1000); // Debounce saves by 1 second

        return () => clearTimeout(timeoutId);
    }, [nodes, edges, initialData?.title, initialData?.tags, onSave]);

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                bgcolor: '#f8f9fa',
                overflow: 'hidden'
            }}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                defaultViewport={defaultViewport}
                style={{
                    width: '100%',
                    height: '100%',
                    background: '#f8f9fa'
                }}
                onInit={(instance) => {
                    const container = containerRef.current;
                    if (container) {
                        const rect = container.getBoundingClientRect();
                        const parentRect = container.parentElement?.getBoundingClientRect();
                        console.log('ReactFlow initialization dimensions:', {
                            containerRect: rect,
                            containerComputedHeight: window.getComputedStyle(container).height,
                            parentRect,
                            parentComputedHeight: container.parentElement ? window.getComputedStyle(container.parentElement).height : null,
                            viewport: instance.getViewport(),
                            nodes: nodes.length
                        });
                    }
                }}
            >
                <Background variant="dots" gap={12} size={1} />
                <Controls />
                <MiniMap />
            </ReactFlow>

            <Dialog open={!!editingNode} onClose={() => setEditingNode(null)}>
                <DialogTitle>Edit Node</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Node Text"
                        fullWidth
                        value={editingNode?.label || ''}
                        onChange={(e) => setEditingNode(prev => ({ ...prev, label: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingNode(null)}>Cancel</Button>
                    <Button onClick={handleSaveNode} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// Wrap the component with ReactFlowProvider
function MindMapEditor(props) {
    return (
        <ReactFlowProvider>
            <MindMapEditorInner {...props} />
        </ReactFlowProvider>
    );
}

export default MindMapEditor;