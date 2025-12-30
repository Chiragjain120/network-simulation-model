import React, { useState } from 'react';
import Button from './Button';
import { Node, NodeId } from '../types';

interface NodeInputProps {
  nodes: Node[];
  onAddNode: (node: Node) => void;
  onRemoveNode: (nodeId: NodeId) => void;
  vizWidth: number; // NEW PROP
  vizHeight: number; // NEW PROP
}

const NodeInput: React.FC<NodeInputProps> = ({ nodes, onAddNode, onRemoveNode, vizWidth, vizHeight }) => {
  const [nodeName, setNodeName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAddNode = () => {
    if (!nodeName.trim()) {
      setError('Node name cannot be empty.');
      return;
    }
    if (nodes.some(node => node.name.toLowerCase() === nodeName.trim().toLowerCase())) {
      setError('Node with this name already exists.');
      return;
    }

    setError('');
    
    // Always generate random coordinates for nodes within visualization bounds
    const finalX = Math.random() * (vizWidth - 40) + 20; // Add padding so nodes aren't at edge
    const finalY = Math.random() * (vizHeight - 40) + 20; // Add padding so nodes aren't at edge

    const newNode: Node = {
      id: `node-${Date.now()}`,
      name: nodeName.trim(),
      x: finalX,
      y: finalY,
    };
    onAddNode(newNode);
    setNodeName('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Manage Locations (Nodes)</h3>
      <div className="grid grid-cols-1 gap-4 mb-4"> {/* Adjusted layout to single column */}
        <input
          type="text"
          placeholder="Enter location name (e.g., Office A)"
          value={nodeName}
          onChange={(e) => {
            setNodeName(e.target.value);
            setError(''); // Clear error on input change
          }}
          className="col-span-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <Button onClick={handleAddNode} variant="primary" className="w-full sm:w-auto">
          Add Location
        </Button>
      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      {nodes.length > 0 && (
        <div className="mt-6"> {/* Added margin top for spacing */}
          <h4 className="text-lg font-medium text-gray-700 mb-2">Current Locations:</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nodes.map((node) => (
              <li
                key={node.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200"
              >
                <span className="text-gray-700">{node.name}</span> {/* Removed coordinate display */}
                <Button
                  onClick={() => onRemoveNode(node.id)}
                  variant="danger"
                  size="sm"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NodeInput;