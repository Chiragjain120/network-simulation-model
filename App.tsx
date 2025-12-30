import React, { useState, useCallback } from 'react';
import NodeInput from './components/NodeInput';
import EdgeInput from './components/EdgeInput';
import GraphVisualization from './components/GraphVisualization';
import ResultsDisplay from './components/ResultsDisplay';
import Button from './components/Button';
import Select from './components/Select';
import { Node, Edge, NodeId, AlgorithmType, MSTResult } from './types';
import { ALGORITHMS } from './constants';
import { kruskal, prim } from './services/mstService';

const App: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>(AlgorithmType.KRUSKAL);
  const [mstResult, setMstResult] = useState<MSTResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [highlightResultsSummary, setHighlightResultsSummary] = useState<boolean>(false);
  const [clickedNode, setClickedNode] = useState<Node | null>(null);
  const [clickedEdge, setClickedEdge] = useState<Edge | null>(null);
  const [pendingSourceNodeIdForEdge, setPendingSourceNodeIdForEdge] = useState<NodeId | null>(null); // NEW
  const [prefillEdgeSourceId, setPrefillEdgeSourceId] = useState<NodeId | null>(null); // NEW
  const [prefillEdgeTargetId, setPrefillEdgeTargetId] = useState<NodeId | null>(null); // NEW
  const [edgeCreationError, setEdgeCreationError] = useState<string | null>(null); // NEW
  const [isCreatingEdge, setIsCreatingEdge] = useState<boolean>(false); // NEW: to explicitly track edge creation mode


  const handleAddNode = useCallback((node: Node) => {
    setNodes((prevNodes) => [...prevNodes, node]);
    setMstResult(null); // Clear results on graph change
    setClickedNode(null); // Clear clicked node on graph change
    setClickedEdge(null); // Clear clicked edge on graph change
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  const handleRemoveNode = useCallback((nodeId: NodeId) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setMstResult(null); // Clear results on graph change
    setClickedNode(null); // Clear clicked node on graph change
    setClickedEdge(null); // Clear clicked edge on graph change
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  const handleAddEdge = useCallback((edge: Edge) => {
    setEdges((prevEdges) => [...prevEdges, edge]);
    setMstResult(null); // Clear results on graph change
    setClickedNode(null); // Clear clicked node on graph change
    setClickedEdge(null); // Clear clicked edge on graph change
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  const handleRemoveEdge = useCallback((edgeId: string) => {
    setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== edgeId));
    setMstResult(null); // Clear results on graph change
    setClickedNode(null); // Clear clicked node on graph change
    setClickedEdge(null); // Clear clicked edge on graph change
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  const handleDeleteSelectedEdge = useCallback((edgeId: string) => {
    // No need to check clickedEdge here, as GraphVisualization passes the ID directly
    handleRemoveEdge(edgeId); // Use existing remove logic
    setClickedEdge(null); // Clear clicked edge state after deletion
    setEdgeCreationError(null); // NEW
  }, [handleRemoveEdge]); // Only depends on handleRemoveEdge

  const handleCalculateMST = useCallback(() => {
    setIsLoading(true);
    setMstResult(null); // Clear previous results
    setHighlightResultsSummary(false); // Reset highlight
    setClickedNode(null); // Clear clicked node on new calculation
    setClickedEdge(null); // Clear clicked edge on new calculation
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
    // Simulate API call or heavy computation
    setTimeout(() => {
      let result: MSTResult;
      const nodeIds = nodes.map(n => n.id);

      if (selectedAlgorithm === AlgorithmType.KRUSKAL) {
        result = kruskal(nodeIds, edges);
      } else { // Prim's Algorithm
        result = prim(nodeIds, edges);
      }
      setMstResult(result);
      setIsLoading(false);
      // Automatically highlight results after calculation
      setHighlightResultsSummary(true);
      setTimeout(() => setHighlightResultsSummary(false), 1000); // Highlight for 1 second
    }, 500); // Simulate network delay
  }, [nodes, edges, selectedAlgorithm]);

  // Callback for when an MST edge is clicked in the visualization (for results summary highlight)
  const handleMstEdgeClick = useCallback((clickedEdge: Edge) => {
    if (mstResult) {
      setClickedNode(null); // Clear any previously clicked node
      setPendingSourceNodeIdForEdge(null); // Clear pending source for edge
      setPrefillEdgeSourceId(null); // Clear pre-fill for edge
      setPrefillEdgeTargetId(null); // Clear pre-fill for edge
      setEdgeCreationError(null); // NEW
      setIsCreatingEdge(false); // NEW
      setClickedEdge(prevEdge => prevEdge?.id === clickedEdge.id ? null : clickedEdge); // Toggle edge selection
      setHighlightResultsSummary(true); // Temporarily highlight the results display
      setTimeout(() => setHighlightResultsSummary(false), 1000); // Highlight for 1 second
      const resultsDisplayElement = document.getElementById('results-display');
      resultsDisplayElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [mstResult]);

  // NEW: Start New Connection mode
  const handleStartNewConnection = useCallback(() => {
    setIsCreatingEdge(true);
    setPendingSourceNodeIdForEdge(null); // Clear any old pending
    setClickedNode(null); // Clear other selections
    setClickedEdge(null);
    setPrefillEdgeSourceId(null);
    setPrefillEdgeTargetId(null);
    setEdgeCreationError(null);
    // Scroll to visualization to make it clear where to click
    document.getElementById('network-visualization-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // NEW: Cancel Connection mode
  const handleCancelEdgeCreation = useCallback(() => {
    setIsCreatingEdge(false);
    setPendingSourceNodeIdForEdge(null);
    setPrefillEdgeSourceId(null);
    setPrefillEdgeTargetId(null);
    setEdgeCreationError(null);
  }, []);

  // Callback for when a node is clicked in the visualization
  const handleNodeClick = useCallback((node: Node) => {
    setClickedEdge(null); // Clear any previously clicked edge
    setEdgeCreationError(null); // Clear any existing error

    if (isCreatingEdge) { // If in edge creation mode
      if (pendingSourceNodeIdForEdge === null) {
        // First click in edge creation mode - set as pending source
        setPendingSourceNodeIdForEdge(node.id);
        setClickedNode(null); // No yellow highlight for pending source
        setPrefillEdgeSourceId(null);
        setPrefillEdgeTargetId(null);
        // Scroll to edge input (to show prefill will happen there)
        const edgeInputSection = document.getElementById('edge-input-section');
        edgeInputSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (pendingSourceNodeIdForEdge === node.id) {
        // Clicking the same pending source node again - deselect it (cancel first part)
        setPendingSourceNodeIdForEdge(null);
        setPrefillEdgeSourceId(null);
        setPrefillEdgeTargetId(null);
        // No error needed here, user cancelled
      } else {
        // Second node clicked in edge creation mode - complete edge
        const sourceId = pendingSourceNodeIdForEdge;
        const targetId = node.id;

        if (sourceId === targetId) {
          setEdgeCreationError('Source and target nodes cannot be the same for an edge.');
          setPendingSourceNodeIdForEdge(null); // Clear pending
          setClickedNode(null); // Clear display node
          setPrefillEdgeSourceId(null); // Clear pre-fill
          setPrefillEdgeTargetId(null); // Clear pre-fill
          setIsCreatingEdge(false); // Exit edge creation mode
          // Scroll to edge input
          const edgeInputSection = document.getElementById('edge-input-section');
          edgeInputSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        const edgeExists = edges.some(
          (e) => (e.source === sourceId && e.target === targetId) || (e.source === targetId && e.target === sourceId)
        );
        if (edgeExists) {
          setEdgeCreationError('An edge between these two nodes already exists. Please delete it first to create a new one.');
          setPendingSourceNodeIdForEdge(null);
          setClickedNode(null);
          setPrefillEdgeSourceId(null);
          setPrefillEdgeTargetId(null);
          setIsCreatingEdge(false); // Exit edge creation mode
          // Scroll to edge input
          const edgeInputSection = document.getElementById('edge-input-section');
          edgeInputSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        // If validations pass
        setPrefillEdgeSourceId(sourceId);
        setPrefillEdgeTargetId(targetId);
        setPendingSourceNodeIdForEdge(null); // Clear pending source after selection
        setClickedNode(null); // Clear clicked node as we're now focusing on edge creation
        setIsCreatingEdge(false); // Exit edge creation mode
        setEdgeCreationError(null); // Clear any previous error

        // Scroll to edge input
        const edgeInputSection = document.getElementById('edge-input-section');
        edgeInputSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Not in edge creation mode - regular node click for display/selection
      setClickedNode(prevNode => prevNode?.id === node.id ? null : node); // Toggle node selection for display
      setPendingSourceNodeIdForEdge(null); // Ensure pending is off
      setPrefillEdgeSourceId(null);
      setPrefillEdgeTargetId(null);
      setIsCreatingEdge(false); // Ensure mode is off
    }
    setHighlightResultsSummary(false); // Clear MST highlight if clicking a node
    const resultsDisplayElement = document.getElementById('results-display');
    resultsDisplayElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isCreatingEdge, pendingSourceNodeIdForEdge, edges]);

  // NEW: Callback for when any edge is clicked in the visualization (for general edge info display)
  const handleEdgeClick = useCallback((edge: Edge) => {
    setClickedEdge(prevEdge => prevEdge?.id === edge.id ? null : edge); // Toggle selection
    setClickedNode(null); // Clear any previously clicked node
    setPendingSourceNodeIdForEdge(null); // Clear pending source for edge
    setPrefillEdgeSourceId(null); // Clear pre-fill for edge
    setPrefillEdgeTargetId(null); // Clear pre-fill for edge
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
    setHighlightResultsSummary(false); // Clear MST highlight if clicking an edge
    const resultsDisplayElement = document.getElementById('results-display');
    resultsDisplayElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);


  // NEW: Callback for when a node's position is changed via drag and drop
  const handleNodePositionChange = useCallback((nodeId: NodeId, newX: number, newY: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, x: newX, y: newY } : node
      )
    );
    setMstResult(null); // Clear MST results as positions changed
    setClickedNode(null); // Clear clicked node as layout changed
    setClickedEdge(null); // Clear clicked edge as layout changed
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  // NEW: Clear all nodes and edges
  const handleClearAllNodes = useCallback(() => {
    setNodes([]);
    setEdges([]); // Also clear edges as they depend on nodes
    setMstResult(null);
    setClickedNode(null);
    setClickedEdge(null);
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  // NEW: Clear all edges
  const handleClearAllEdges = useCallback(() => {
    setEdges([]);
    setMstResult(null);
    setClickedNode(null);
    setClickedEdge(null);
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  // NEW: Reset everything
  const handleResetAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setMstResult(null);
    setClickedNode(null);
    setClickedEdge(null);
    setSelectedAlgorithm(AlgorithmType.KRUSKAL); // Reset algorithm to default
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
  }, []);

  // NEW: Callback to switch algorithm from results display
  const handleSwitchAlgorithmClick = useCallback((algorithm: AlgorithmType) => {
    setSelectedAlgorithm(algorithm);
    setMstResult(null); // Clear previous results
    setClickedNode(null); // Clear any clicked node
    setClickedEdge(null); // Clear any clicked edge
    setPendingSourceNodeIdForEdge(null); // NEW
    setPrefillEdgeSourceId(null); // NEW
    setPrefillEdgeTargetId(null); // NEW
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // NEW
    // Scroll to the algorithm selection section
    document.getElementById('algorithm-select-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // NEW: Callback to clear prefilled edge selection after an edge is added
  const handleEdgeAddedFromSelection = useCallback(() => {
    setPrefillEdgeSourceId(null);
    setPrefillEdgeTargetId(null);
    setEdgeCreationError(null); // NEW
    setIsCreatingEdge(false); // Exit edge creation mode after successful add
  }, []);


  // Ensure visualization width/height are responsive
  const [vizWidth, setVizWidth] = useState(800);
  const [vizHeight, setVizHeight] = useState(500);

  React.useEffect(() => {
    const handleResize = () => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        const newWidth = Math.min(mainContent.offsetWidth * 0.95, 1000); // Max width 1000px, 95% of container
        setVizWidth(newWidth);
        setVizHeight(Math.max(newWidth * 0.6, 400)); // Maintain aspect ratio, min height 400
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 leading-tight">
          Internet Network Cost Optimizer
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 mt-2">
          Design your network with minimal cable cost using MST algorithms.
        </p>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto">
        <NodeInput 
          nodes={nodes} 
          onAddNode={handleAddNode} 
          onRemoveNode={handleRemoveNode} 
          vizWidth={vizWidth}
          vizHeight={vizHeight}
        />
        <EdgeInput
          id="edge-input-section"
          nodes={nodes}
          edges={edges}
          onAddEdge={handleAddEdge}
          prefillSourceId={prefillEdgeSourceId}
          prefillTargetId={prefillEdgeTargetId}
          onEdgeAddedFromSelection={handleEdgeAddedFromSelection}
          edgeCreationError={edgeCreationError}
        />
        
        <GraphVisualization
          nodes={nodes}
          edges={edges}
          mstEdges={mstResult?.edges || []}
          width={vizWidth}
          height={vizHeight}
          selectedAlgorithm={selectedAlgorithm}
          mstResult={mstResult}
          onMstEdgeClick={handleMstEdgeClick}
          onNodeClick={handleNodeClick}
          selectedNodeId={clickedNode?.id || null}
          pendingSourceNodeId={pendingSourceNodeIdForEdge}
          onNodePositionChange={handleNodePositionChange}
          onEdgeClick={handleEdgeClick}
          selectedEdgeId={clickedEdge?.id || null}
          onDeleteEdgeClick={handleDeleteSelectedEdge}
        />

        {/* NEW: Graph Actions Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Graph Actions</h3>
          <div className="flex flex-wrap gap-4 justify-center">
            {isCreatingEdge ? (
              <Button
                onClick={handleCancelEdgeCreation}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto"
              >
                Cancel Connection
              </Button>
            ) : (
              <Button
                onClick={handleStartNewConnection}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                disabled={nodes.length < 2}
              >
                Start New Connection (Click Nodes)
              </Button>
            )}
            <Button
              onClick={handleClearAllNodes}
              variant="danger"
              size="md"
              className="w-full sm:w-auto"
              disabled={nodes.length === 0}
            >
              Clear All Locations
            </Button>
            <Button
              onClick={handleClearAllEdges}
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              disabled={edges.length === 0}
            >
              Clear All Connections
            </Button>
            <Button
              onClick={handleResetAll}
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              disabled={nodes.length === 0 && edges.length === 0}
            >
              Reset All
            </Button>
          </div>
        </div>

        <div id="algorithm-select-section" className="bg-white p-6 rounded-lg shadow-md mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Select
            id="algorithmSelect"
            label="Select MST Algorithm"
            options={ALGORITHMS}
            value={selectedAlgorithm}
            onChange={(e) => {
              setSelectedAlgorithm(e.target.value as AlgorithmType);
              setMstResult(null); // Clear results if algorithm changes
              setClickedNode(null); // Clear clicked node on algorithm change
              setClickedEdge(null); // Clear clicked edge on algorithm change
              setPendingSourceNodeIdForEdge(null); // NEW
              setPrefillEdgeSourceId(null); // NEW
              setPrefillEdgeTargetId(null); // NEW
              setEdgeCreationError(null); // NEW
              setIsCreatingEdge(false); // NEW
            }}
            wrapperClassName="flex-grow w-full sm:w-auto"
            selectClassName="border-2 border-indigo-600"
          />
          <Button
            onClick={handleCalculateMST}
            variant="primary"
            size="lg"
            fullWidth={false}
            className="w-full sm:w-auto mt-4 sm:mt-0"
            disabled={nodes.length < 2 || edges.length === 0 || isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Minimal Cost'}
          </Button>
        </div>

        <ResultsDisplay
          result={mstResult}
          nodes={nodes}
          algorithmName={selectedAlgorithm}
          isLoading={isLoading}
          highlight={highlightResultsSummary}
          clickedNode={clickedNode}
          clickedEdge={clickedEdge}
          onSwitchAlgorithmClick={handleSwitchAlgorithmClick}
          // onDeleteEdgeClick={handleDeleteSelectedEdge} // REMOVED: Button moved to GraphVisualization
        />
      </main>

      <footer className="text-center text-gray-500 text-sm mt-10">
        &copy; {new Date().getFullYear()} Network Cost Optimizer. All rights reserved.
      </footer>
    </div>
  );
};

export default App;