import React, { useCallback, useRef, useEffect } from 'react';
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
import { Box } from '@mui/material';
import MindMapNode from '../MindMapNode';

const nodeTypes = {
    mindmap: MindMapNode,
};

const defaultViewport = { x: 0, y: 0, zoom: 1 };

const initialNode = {
    id: '0',
    type: 'mindmap',
    data: {
        label: 'Main Idea',
        isRoot: true
    },
    position: { x: 350, y: 250 },
    dragHandle: '.drag-handle'
};

function MindMapEditorInner({ content, setContent, readOnly }) {
    const containerRef = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([initialNode]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const nextIdRef = useRef(1);
    const initialized = useRef(false);
    const lastContentRef = useRef(content);

    // Initialize or update from content
    useEffect(() => {
        console.log("MindMapEditor - Initialize/update effect triggered");
        console.log("MindMapEditor - Content received:", typeof content, content ? content.substring(0, 50) + "..." : 'empty');
        console.log("MindMapEditor - readOnly:", readOnly);
        console.log("MindMapEditor - initialized:", initialized.current);

        // Skip if content is the same as before
        if (content === lastContentRef.current && initialized.current) {
            console.log("MindMapEditor - Content unchanged, skipping update");
            return;
        }

        lastContentRef.current = content;

        if (!initialized.current || content) {
            try {
                if (content) {
                    console.log("MindMapEditor - Parsing content");
                    const data = JSON.parse(content);
                    console.log("MindMapEditor - Parsed data nodes:", data?.nodes?.length || 0);
                    console.log("MindMapEditor - Parsed data edges:", data?.edges?.length || 0);

                    if (data.nodes?.length > 0) {
                        console.log("MindMapEditor - Found nodes:", data.nodes.length);
                        // Update node callbacks only if not in readOnly mode
                        const nodesWithCallbacks = data.nodes.map(node => ({
                            ...node,
                            data: {
                                ...node.data,
                                ...(readOnly ? {} : {
                                    onDelete: () => handleNodeDelete(node.id),
                                    onEdit: () => handleEditNode(node.id, node.data.label),
                                    onAdd: () => handleAddChild(node.id)
                                })
                            }
                        }));
                        setNodes(nodesWithCallbacks);
                        setEdges(data.edges || []);

                        // Update the next ID based on the highest ID in the nodes
                        const maxId = Math.max(...data.nodes.map(n => {
                            const id = parseInt(n.id);
                            return isNaN(id) ? 0 : id;
                        }));
                        nextIdRef.current = maxId + 1;
                        console.log("MindMapEditor - Set nextId to:", nextIdRef.current);
                    } else {
                        console.log("MindMapEditor - No nodes found, initializing empty map");
                        initializeEmptyMap();
                    }
                } else {
                    console.log("MindMapEditor - No content, initializing empty map");
                    initializeEmptyMap();
                }
                initialized.current = true;
            } catch (e) {
                console.error('MindMapEditor - Failed to parse mind map data:', e);
                console.error('MindMapEditor - Content that failed to parse:', content);
                initializeEmptyMap();
            }
        }
    }, [content, readOnly, setNodes, setEdges]);

    // Update content when nodes/edges change
    useEffect(() => {
        if (!initialized.current) return;

        const timer = setTimeout(() => {
            try {
                const newContent = JSON.stringify({
                    nodes: nodes.map(({ data, ...rest }) => ({
                        ...rest,
                        data: {
                            label: data.label,
                            isRoot: data.isRoot
                        }
                    })),
                    edges
                });

                // Only update if content has actually changed
                if (newContent !== lastContentRef.current) {
                    console.log("MindMapEditor - Updating content, nodes:", nodes.length, "edges:", edges.length);
                    setContent(newContent);
                    lastContentRef.current = newContent;
                }
            } catch (err) {
                console.error("MindMapEditor - Error serializing mindmap:", err);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [nodes, edges, setContent]);

    const initializeEmptyMap = () => {
        console.log("MindMapEditor - Initializing empty map");
        const rootNode = {
            ...initialNode,
            data: {
                ...initialNode.data,
                onEdit: readOnly ? undefined : () => handleEditNode('0', 'Main Idea'),
                onAdd: readOnly ? undefined : () => handleAddChild('0')
            }
        };
        setNodes([rootNode]);
        setEdges([]);
        nextIdRef.current = 1;
    };

    const handleEditNode = (id, currentLabel) => {
        if (readOnly) return;

        const newLabel = window.prompt('Enter new label:', currentLabel);
        if (newLabel !== null && newLabel.trim() !== '') {
            console.log("MindMapEditor - Editing node:", id, "new label:", newLabel.trim());
            setNodes(nds => nds.map(node => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            label: newLabel.trim()
                        }
                    };
                }
                return node;
            }));
        }
    };

    const handleAddChild = (parentId) => {
        if (readOnly) return;

        const parentNode = nodes.find(n => n.id === parentId);
        if (!parentNode) {
            console.warn("MindMapEditor - Parent node not found:", parentId);
            return;
        }

        const newNodeId = nextIdRef.current.toString();
        nextIdRef.current += 1;

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
            dragHandle: '.drag-handle'
        };

        const newEdge = {
            id: `e${parentId}-${newNodeId}`,
            source: parentId,
            target: newNodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#2196f3' }
        };

        console.log("MindMapEditor - Adding new node:", newNodeId, "as child of", parentId);
        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [...eds, newEdge]);
    };

    const handleNodeDelete = useCallback((nodeId) => {
        if (readOnly) return;

        console.log("MindMapEditor - Deleting node:", nodeId);
        setNodes(nds => nds.filter(node => node.id !== nodeId));
        setEdges(eds => eds.filter(edge =>
            edge.source !== nodeId && edge.target !== nodeId
        ));
    }, [setNodes, setEdges, readOnly]);

    const onConnect = useCallback((params) => {
        if (readOnly) return;

        console.log("MindMapEditor - Connecting nodes:", params.source, "->", params.target);
        setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: false }, eds));
    }, [setEdges, readOnly]);

    const handleNodesChange = useCallback((changes) => {
        console.log('MindMapEditor - Node changes:', changes.length);
        onNodesChange(changes);
    }, [onNodesChange]);

    // Force update nodes when readOnly changes to update action buttons
    useEffect(() => {
        if (initialized.current) {
            console.log("MindMapEditor - readOnly changed to:", readOnly);
            setNodes(nodes => nodes.map(node => {
                // Important - capture the current node ID in the closure
                const nodeId = node.id;
                return {
                    ...node,
                    data: {
                        ...node.data,
                        ...(readOnly ? {
                            // Remove all callbacks in readOnly mode
                            onDelete: undefined,
                            onEdit: undefined,
                            onAdd: undefined
                        } : {
                            // Add callbacks in edit mode, using captured nodeId
                            onDelete: node.data.isRoot ? undefined : () => handleNodeDelete(nodeId),
                            onEdit: () => handleEditNode(nodeId, node.data.label),
                            onAdd: () => handleAddChild(nodeId)
                        })
                    }
                };
            }));
        }
    }, [readOnly, setNodes]);

    return (
        <Box
            ref={containerRef}
            sx={{
                width: '100%',
                height: '100%',
                minHeight: '500px',
                bgcolor: '#f8f9fa',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
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
                proOptions={{ hideAttribution: true }}
                deleteKeyCode="Delete"
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Control"
                zoomActivationKeyCode="Control"
                nodesDraggable={!readOnly}
                nodesConnectable={!readOnly}
                edgesUpdatable={!readOnly}
                elementsSelectable={true}
                snapToGrid={true}
                snapGrid={[15, 15]}
                style={{ width: '100%', height: '100%' }}
            >
                <Background variant="dots" gap={12} size={1} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </Box>
    );
}

function MindMapEditor(props) {
    console.log("MindMapEditor - Component mounted/updated with props:", {
        hasContent: !!props.content,
        contentLength: props.content?.length || 0,
        readOnly: props.readOnly
    });

    return (
        <ReactFlowProvider>
            <Box sx={{
                width: '100%',
                height: '100%',
                flex: 1,
                display: 'flex',
                position: 'relative',
                minHeight: 'calc(100vh - 180px)',
                maxHeight: '100%'
            }}>
                <MindMapEditorInner {...props} />
            </Box>
        </ReactFlowProvider>
    );
}

export default MindMapEditor;