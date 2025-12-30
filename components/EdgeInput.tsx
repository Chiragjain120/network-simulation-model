
import React, { useState, useEffect } from 'react'; // Import useEffect
import Button from './Button';
import Select from './Select';
import { Node, Edge, NodeId } from '../types';

interface EdgeInputProps {
  id?: string; // Add id prop for scrolling
  nodes: Node[];
  edges: Edge[];
  onAddEdge: (edge: Edge) => void;
  prefillSourceId: NodeId | null; // NEW PROP
  prefillTargetId: NodeId | null; // NEW PROP
  onEdgeAddedFromSelection: () => void; // NEW PROP
  edgeCreationError: string | null; // NEW PROP
}

const EdgeInput: React.FC<EdgeInputProps> = ({
  id,
  nodes,
  edges,
  onAddEdge,
  prefillSourceId, // Destructure new prop
  prefillTargetId, // Destructure new prop
  onEdgeAddedFromSelection, // Destructure new prop
  edgeCreationError, // Destructure new prop
}) => {
  const [sourceNodeId, setSourceNodeId] = useState<NodeId>('');
  const [targetNodeId, setTargetNodeId] = useState<NodeId>('');
  const [weight, setWeight] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Effect to handle pre-filling from props when nodes are selected in visualization
  useEffect(() => {
    if (prefillSourceId && prefillTargetId) {
      setSourceNodeId(prefillSourceId);
      setTargetNodeId(prefillTargetId);
      setWeight(''); // Clear weight to prompt user for input
      setError(''); // Clear any previous errors
    } else if (prefillSourceId) {
      // If only source is prefilled (pending selection)
      setSourceNodeId(prefillSourceId);
      setTargetNodeId(''); // Clear target if not prefilled
      setWeight('');
      setError('');
    } else {
      // Clear selections if prefill props are null (e.g., edge added or deselected)
      setSourceNodeId('');
      setTargetNodeId('');
      setWeight('');
      setError('');
    }
  }, [prefillSourceId, prefillTargetId]);


  const nodeOptions = nodes.map((node) => ({ value: node.id, label: node.name }));

  const handleAddEdge = () => {
    // Clear any external edge creation error when user attempts to add
    // The App component should already be clearing this, but as a fallback.
    // If edgeCreationError is coming from App, we should not proceed with internal adding.
    if (edgeCreationError) {
      setError(edgeCreationError); // Display the external error here too
      return;
    }

    if (!sourceNodeId) {
      setError('Please select a source location.');
      return;
    }
    if (!targetNodeId) {
      setError('Please select a target location.');
      return;
    }
    if (!weight) {
      setError('Please enter a cable cost.');
      return;
    }
    if (sourceNodeId === targetNodeId) {
      setError('Source and target nodes cannot be the same.');
      return;
    }
    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Cable cost must be a positive number.');
      return;
    }

    // Check for duplicate or inverse duplicate edges (redundant with App.tsx pre-validation but good fallback)
    const exists = edges.some(
      (e) =>
        (e.source === sourceNodeId && e.target === targetNodeId) ||
        (e.source === targetNodeId && e.target === sourceNodeId)
    );
    if (exists) {
      setError('An edge between these two nodes already exists. Please remove it first to update.');
      return;
    }

    setError('');
    const newEdge: Edge = {
      id: `edge-${sourceNodeId}-${targetNodeId}-${Date.now()}`,
      source: sourceNodeId,
      target: targetNodeId,
      weight: parsedWeight,
    };
    onAddEdge(newEdge);
    
    // Clear internal state after adding edge
    setSourceNodeId('');
    setTargetNodeId('');
    setWeight('');

    // Inform parent that edge was added (to clear pre-fill props)
    onEdgeAddedFromSelection();
  };

  // Determine if dropdowns should be disabled (when pre-filled)
  const isSourceDisabled = !!prefillSourceId;
  const isTargetDisabled = !!prefillTargetId;


  return (
    <div id={id} className="bg-white p-6 rounded-lg shadow-md mb-6"> {/* Added id */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Manage Connections</h3> {/* Changed title for simplicity */}
      {nodes.length < 2 ? (
        <p className="text-gray-600 mb-4">Add at least two locations to create connections.</p>
      ) : (
        <>
          {edgeCreationError && <p className="text-red-600 text-sm mb-4">{edgeCreationError}</p>} {/* NEW: Display external error */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select
              id="sourceNode"
              label="Source Location"
              options={nodeOptions}
              value={sourceNodeId}
              onChange={(e) => {
                setSourceNodeId(e.target.value);
                setError('');
              }}
              disabled={isSourceDisabled || nodes.length < 2} // Disable if pre-filled or not enough nodes
            />
            <Select
              id="targetNode"
              label="Target Location"
              options={nodeOptions}
              value={targetNodeId}
              onChange={(e) => {
                setTargetNodeId(e.target.value);
                setError('');
              }}
              disabled={isTargetDisabled || nodes.length < 2} // Disable if pre-filled or not enough nodes
            />
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Cable Cost (Distance)
              </label>
              <input
                type="number"
                id="weight"
                placeholder="e.g., 100"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setError('');
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                min="0.1"
                step="0.1"
                disabled={nodes.length < 2}
              />
            </div>
          </div>
          <Button onClick={handleAddEdge} variant="primary" fullWidth className="mb-2" disabled={nodes.length < 2}> {/* Adjusted mb for spacing */}
            Add Connection
          </Button>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        </>
      )}

      {/* Removed the 'Current Connections' list from here */}
    </div>
  );
};

export default EdgeInput;
