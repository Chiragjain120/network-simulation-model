import React, { useState } from 'react';
import { MSTResult, Edge, Node, AlgorithmType } from '../types';
import Button from './Button'; // Import the Button component

interface ResultsDisplayProps {
  result: MSTResult | null;
  nodes: Node[];
  algorithmName: AlgorithmType; // Use AlgorithmType for consistency
  isLoading: boolean;
  highlight?: boolean;
  clickedNode?: Node | null;
  clickedEdge?: Edge | null;
  onSwitchAlgorithmClick?: (algorithm: AlgorithmType) => void; // NEW PROP
  // onDeleteEdgeClick?: (edgeId: string) => void; // REMOVED: Button moved to GraphVisualization
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, nodes, algorithmName, isLoading, highlight, clickedNode, clickedEdge, onSwitchAlgorithmClick /*, onDeleteEdgeClick */ }) => { // Removed prop
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const getEdgeDisplayName = (edge: Edge) => {
    const sourceName = nodes.find(n => n.id === edge.source)?.name || edge.source;
    const targetName = nodes.find(n => n.id === edge.target)?.name || edge.target;
    return `${sourceName} - ${targetName} (Cost: ${edge.weight})`;
  };

  const handleCopyEdges = async () => {
    if (!result || result.edges.length === 0) {
      return;
    }
    const edgeListText = result.edges.map(getEdgeDisplayName).join('\n');
    try {
      await navigator.clipboard.writeText(edgeListText);
      setCopyFeedback('Copied!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyFeedback('Failed to copy');
    } finally {
      setTimeout(() => setCopyFeedback(null), 2000); // Clear feedback after 2 seconds
    }
  };

  const highlightClass = highlight ? 'border-indigo-500 border-2 transition-all duration-300 ease-in-out shadow-lg' : '';

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 animate-pulse">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Results & Info Panel</h3>
        <p className="text-gray-600">Calculating MST using {algorithmName}...</p>
      </div>
    );
  }

  return (
    <div id="results-display" className={`bg-white p-6 rounded-lg shadow-md mb-6 ${highlightClass}`}>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Results & Info Panel</h3>

      {/* Display Clicked Node Information */}
      {clickedNode && (
        <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
          <h4 className="font-semibold text-yellow-800 text-lg mb-2">Selected Node: {clickedNode.name}</h4>
          <p className="text-gray-700">
            Coordinates: (X: {clickedNode.x.toFixed(2)}, Y: {clickedNode.y.toFixed(2)})
          </p>
          {/* Add more node-specific info if needed */}
        </div>
      )}

      {/* Display Clicked Edge Information */}
      {clickedEdge && (
        <div className="mb-6 p-4 border border-blue-300 bg-blue-50 rounded-md">
          <h4 className="font-semibold text-blue-800 text-lg mb-2">Selected Connection:</h4>
          <p className="text-gray-700 mb-3">
            {getEdgeDisplayName(clickedEdge)}
          </p>
          {/* REMOVED DELETE BUTTON - now in GraphVisualization */}
        </div>
      )}

      {/* Show initial messages if no calculation or clicked node/edge */}
      {!result && !clickedNode && !clickedEdge && nodes.length === 0 && (
        <p className="text-gray-600">Add locations and connections, then click 'Calculate Minimal Cost'.</p>
      )}
      {!result && !clickedNode && !clickedEdge && nodes.length > 0 && nodes.length < 2 && (
        <p className="text-gray-600">Add at least two locations to calculate the MST.</p>
      )}
      
      {result && (
        <>
          <p className="text-gray-700 text-lg mb-4">
            <span className="font-bold">
              {algorithmName}
              {onSwitchAlgorithmClick && ( // Only show button if prop is provided
                <Button
                  onClick={() => onSwitchAlgorithmClick(algorithmName)}
                  variant="secondary"
                  size="sm"
                  className="ml-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 focus:ring-indigo-500 focus:ring-offset-0"
                  title={`Switch to ${algorithmName} settings`}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.562.404 1.341.602 2.132.545z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Settings
                </Button>
              )}
            </span> found the minimal cable cost to be:
            <span className="text-indigo-600 font-extrabold text-2xl ml-2">${result.cost.toFixed(2)}</span>
          </p>

          {result.edges.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-medium text-gray-700">Optimal Connections:</h4>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopyEdges}
                    variant="secondary"
                    size="sm"
                    className="whitespace-nowrap"
                    title="Copy optimal connections to clipboard"
                  >
                    Copy Edges
                  </Button>
                  {copyFeedback && <span className="text-sm text-green-600">{copyFeedback}</span>}
                </div>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {result.edges.map((edge) => (
                  <li key={edge.id} className="bg-indigo-50 p-3 rounded-md border border-indigo-200">
                    <span className="font-medium text-indigo-800">{getEdgeDisplayName(edge)}</span>
                  </li>
                ))}
              </ul>
              {result.edges.length < nodes.length - 1 && (
                <p className="text-yellow-700 mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  Warning: The graph might be disconnected. The MST was calculated for the largest connected component.
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-600">
              No connections were found or the graph is disconnected. Please ensure you have added sufficient connections.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsDisplay;