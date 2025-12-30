import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { Node, Edge, NodeId, AlgorithmType, MSTResult } from '../types';

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  mstEdges: Edge[];
  width: number;
  height: number;
  selectedAlgorithm: AlgorithmType;
  mstResult: MSTResult | null;
  onMstEdgeClick?: (edge: Edge) => void;
  onNodeClick?: (node: Node) => void;
  selectedNodeId?: NodeId | null;
  pendingSourceNodeId?: NodeId | null;
  onNodePositionChange?: (nodeId: NodeId, newX: number, newY: number) => void;
  onEdgeClick?: (edge: Edge) => void;
  selectedEdgeId?: string | null;
  onDeleteEdgeClick?: (edgeId: string) => void; // Added for delete button
}

// Constants for edge styling
const DEFAULT_EDGE_WIDTH = 1;
const MST_EDGE_WIDTH = 3; // "bolded"
const SELECTED_EDGE_WIDTH_OVERRIDE = 4; // Even bolder for clicked edge
const HOVER_WIDTH_INCREASE = 0.5;

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  mstEdges,
  width,
  height,
  selectedAlgorithm,
  mstResult,
  onMstEdgeClick,
  onNodeClick,
  selectedNodeId,
  pendingSourceNodeId,
  onNodePositionChange,
  onEdgeClick,
  selectedEdgeId,
  onDeleteEdgeClick, // Destructure new prop
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement | null>(null); // Ref for the delete button

  // Helper to get edge style based on its state
  const getEdgeDisplayStyles = useCallback((
    edge: Edge,
    isHovered: boolean = false,
    mstEdgeIdsForStyling: Set<string>, // Passed from the effect that computes it
    currentSelectedEdgeId: string | null | undefined // Passed from state
  ) => {
    const sortedNodes = [edge.source, edge.target].sort();
    const isMst = mstEdgeIdsForStyling.has(`${sortedNodes[0]}-${sortedNodes[1]}-${edge.weight}`);
    const isSelected = edge.id === currentSelectedEdgeId;

    let stroke = '#999'; // Default grey
    let strokeWidth = DEFAULT_EDGE_WIDTH;

    if (isMst) {
        stroke = 'rgb(220, 38, 38)'; // Red for MST
        strokeWidth = MST_EDGE_WIDTH;
    }

    if (isSelected) {
        stroke = 'rgb(59, 130, 246)'; // Blue for clicked
        strokeWidth = SELECTED_EDGE_WIDTH_OVERRIDE;
    }

    if (isHovered && !isSelected) { // Apply hover only if not already selected
        if (isMst) {
            stroke = 'rgb(190, 20, 20)'; // Darker red for hovered MST
            strokeWidth += HOVER_WIDTH_INCREASE;
        } else {
            stroke = '#777'; // Darker grey for hovered default
            strokeWidth += HOVER_WIDTH_INCREASE;
        }
    }
    return { stroke, strokeWidth };
  }, [selectedEdgeId]); // Only selectedEdgeId needs to be in its deps, mstEdgeIdsForStyling is passed directly from its source.


  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear SVG contents

    if (nodes.length === 0) return;

    // Add SVG filter for drop shadow
    const defs = svg.append('defs');
    defs.append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
      .append('feDropShadow')
        .attr('dx', '1')
        .attr('dy', '1')
        .attr('stdDeviation', '2')
        .attr('flood-color', '#000000')
        .attr('flood-opacity', '0.3');

    // Create tooltip element (outside SVG)
    const tooltip = d3.select('body').append('div')
      .attr('class', 'graph-tooltip')
      .style('position', 'absolute')
      .style('background', '#333')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none') // Important: don't block mouse events
      .style('opacity', 0) // Start hidden
      .style('z-index', 1000); // Ensure it's on top

    // Calculate mstEdgeIds for use within this effect's scope
    const mstEdgeIdsForCurrentEffect = new Set(mstEdges.map(edge => {
        const sortedNodes = [edge.source, edge.target].sort();
        return `${sortedNodes[0]}-${sortedNodes[1]}-${edge.weight}`;
    }));

    // Render elements
    const linkGroup = svg.append('g').attr('stroke-opacity', 0.6);
    const nodeGroup = svg.append('g').attr('stroke', '#fff').attr('stroke-width', 1.5);
    const textGroup = svg.append('g').attr('pointer-events', 'none').attr('font-size', 10).attr('font-family', 'sans-serif');

    const link = linkGroup
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('x1', (d) => (nodes.find(n => n.id === (d.source as NodeId)) || d.source as Node).x!)
      .attr('y1', (d) => (nodes.find(n => n.id === (d.source as NodeId)) || d.source as Node).y!)
      .attr('x2', (d) => (nodes.find(n => n.id === (d.target as NodeId)) || d.target as Node).x!)
      .attr('y2', (d) => (nodes.find(n => n.id === (d.target as NodeId)) || d.target as Node).y!)
      .attr('stroke', (d) => getEdgeDisplayStyles(d, false, mstEdgeIdsForCurrentEffect, selectedEdgeId).stroke) // Initial state
      .attr('stroke-width', (d) => getEdgeDisplayStyles(d, false, mstEdgeIdsForCurrentEffect, selectedEdgeId).strokeWidth) // Initial state
      .on('mouseover', function(event, d) {
        const sourceNode = nodes.find(n => n.id === (d.source as Node).id);
        const targetNode = nodes.find(n => n.id === (d.target as Node).id);
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        let tooltipContent = `Source: ${sourceNode?.name}<br/>Target: ${targetNode?.name}<br/>Cost: $${d.weight}`;

        const isMstEdge = mstEdgeIdsForCurrentEffect.has([...[(d.source as Node).id, (d.target as Node).id]].sort().join('-') + `-${d.weight}`);

        if (mstResult && isMstEdge) { // Check if mstResult exists AND it's an MST edge
            tooltipContent += `<br/><br/><strong>MST Info:</strong>`;
            tooltipContent += `<br/>Algorithm: ${selectedAlgorithm}`;
            tooltipContent += `<br/>Total MST Cost: $${mstResult.cost.toFixed(2)}`;
        }

        tooltip.html(tooltipContent)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');

        // Apply hover style only if not the selected edge
        const isCurrentlySelected = d.id === selectedEdgeId;
        if (!isCurrentlySelected) {
          const styles = getEdgeDisplayStyles(d, true, mstEdgeIdsForCurrentEffect, selectedEdgeId);
          d3.select(this)
              .transition()
              .duration(100)
              .attr('stroke', styles.stroke)
              .attr('stroke-width', styles.strokeWidth);
        }
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function(event, d) {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);

        // Revert to base style only if not the selected edge
        const isCurrentlySelected = d.id === selectedEdgeId;
        if (!isCurrentlySelected) {
          const styles = getEdgeDisplayStyles(d, false, mstEdgeIdsForCurrentEffect, selectedEdgeId); // Not hovered
          d3.select(this)
              .transition()
              .duration(200)
              .attr('stroke', styles.stroke)
              .attr('stroke-width', styles.strokeWidth);
        }
      })
      .on('click', (event, d) => { // ADDED CLICK EVENT for ALL edges
        if (onEdgeClick) {
          onEdgeClick(d);
        }
      });

    const linkWeightText = textGroup
      .selectAll('.link-weight')
      .data(edges)
      .join('text')
      .attr('class', 'link-weight')
      .text((d) => d.weight)
      .attr('fill', (d) => { // Use specific fill colors based on state
        const sortedNodes = [(d.source as Node).id, (d.target as Node).id].sort();
        const isMstEdge = mstEdgeIdsForCurrentEffect.has(`${sortedNodes[0]}-${sortedNodes[1]}-${d.weight}`);
        const isSelectedEdge = d.id === selectedEdgeId;

        if (isSelectedEdge) return 'rgb(37, 99, 235)'; // Darker blue for clicked edge text
        if (isMstEdge) return 'rgb(185, 28, 28)'; // Red for MST edge text
        return '#555'; // Default
      })
      .attr('text-anchor', 'middle')
      .attr('x', (d) => {
        const sourceNode = nodes.find(n => n.id === (d.source as NodeId));
        const targetNode = nodes.find(n => n.id === (d.target as NodeId));
        return ((sourceNode?.x || 0) + (targetNode?.x || 0)) / 2;
      })
      .attr('y', (d) => {
        const sourceNode = nodes.find(n => n.id === (d.source as NodeId));
        const targetNode = nodes.find(n => n.id === (d.target as NodeId));
        return ((sourceNode?.y || 0) + (targetNode?.y || 0)) / 2 - 5;
      });

    const node = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 10)
      .attr('fill', 'rgb(79, 70, 229)') // indigo-600
      .attr('stroke', (d) => { // Node stroke priority: pendingSource > selectedNode > default
        if (d.id === pendingSourceNodeId) return 'rgb(34, 197, 94)'; // Green for pending source (emerald-500)
        if (d.id === selectedNodeId) return 'rgb(251, 191, 36)'; // Yellow for selected node (yellow-400)
        return '#fff'; // Default
      })
      .attr('stroke-width', (d) => { // Node stroke width priority: pendingSource > selectedNode > default
        if (d.id === pendingSourceNodeId) return 3;
        if (d.id === selectedNodeId) return 3;
        return 1.5;
      })
      .attr('cx', (d) => d.x!)
      .attr('cy', (d) => d.y!)
      .on('click', (event, d) => { // ADDED NODE CLICK EVENT
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .on('mouseover', function(event, d) { // ADDED NODE HOVER EFFECT
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 12) // Slightly increase radius
          .attr('filter', 'url(#node-shadow)') // Add shadow
          .attr('fill', d.id === selectedNodeId || d.id === pendingSourceNodeId ? 'rgb(79, 70, 229)' : 'rgb(67, 56, 202)'); // Darken if not selected/pending, otherwise keep original selected/pending fill.
      })
      .on('mouseout', function(event, d) { // REMOVED NODE HOVER EFFECT
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 10) // Restore radius
          .attr('filter', null) // Remove shadow
          .attr('fill', d.id === selectedNodeId || d.id === pendingSourceNodeId ? 'rgb(79, 70, 229)' : 'rgb(79, 70, 229)'); // Restore original fill (indigo-600)
      })
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    const nodeText = textGroup
      .selectAll('.node-label')
      .data(nodes)
      .join('text')
      .attr('class', 'node-label')
      .text((d) => d.name)
      .attr('fill', '#333')
      .attr('dx', 12)
      .attr('dy', '0.31em')
      .attr('x', (d) => d.x!)
      .attr('y', (d) => d.y!);

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      // Set the subject's x and y to the current event coordinates
      event.subject.x = event.x;
      event.subject.y = event.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      // Update subject's internal position
      event.subject.x = event.x;
      event.subject.y = event.y;

      // Update the dragged node's visual position
      d3.select(this)
          .attr('cx', event.subject.x)
          .attr('cy', event.subject.y);

      // Update the corresponding text label
      nodeText.filter(d => d.id === event.subject.id)
          .attr('x', event.subject.x)
          .attr('y', event.subject.y);

      // Update all connected links and their labels
      link.filter(l => (l.source as Node).id === event.subject.id || (l.target as Node).id === event.subject.id)
          .attr('x1', (d) => (d.source as Node).id === event.subject.id ? event.subject.x : (nodes.find(n => n.id === (d.source as NodeId)) || d.source as Node).x!)
          .attr('y1', (d) => (d.source as Node).id === event.subject.id ? event.subject.y : (nodes.find(n => n.id === (d.source as NodeId)) || d.source as Node).y!)
          .attr('x2', (d) => (d.target as Node).id === event.subject.id ? event.subject.x : (nodes.find(n => n.id === (d.target as NodeId)) || d.target as Node).x!)
          .attr('y2', (d) => (d.target as Node).id === event.subject.id ? event.subject.y : (nodes.find(n => n.id === (d.target as NodeId)) || d.target as Node).y!);

      linkWeightText.filter(l => (l.source as Node).id === event.subject.id || (l.target as Node).id === event.subject.id)
          .attr('x', (d) => {
              const sx = (d.source as Node).id === event.subject.id ? event.subject.x : (nodes.find(n => n.id === (d.source as NodeId)) || d.source as Node).x!;
              const tx = (d.target as Node).id === event.subject.id ? event.subject.x : (nodes.find(n => n.id === (d.target as NodeId)) || d.target as Node).x!;
              return (sx + tx) / 2;
          })
          .attr('y', (d) => {
              const sy = (d.source as Node).id === event.subject.id ? event.subject.y : (nodes.find(n => n.id === (d.source as NodeId)) || d.source as Node).y!;
              const ty = (d.target as Node).id === event.subject.id ? event.subject.y : (nodes.find(n => n.id === (d.target as NodeId)) || d.target as Node).y!;
              return (sy + ty) / 2 - 5;
          });
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>) {
      // Commit the final position to the parent component
      if (onNodePositionChange) {
        onNodePositionChange(event.subject.id, event.x, event.y);
      }
    }

    return () => {
      tooltip.remove(); // Remove tooltip on cleanup
    };
  }, [nodes, edges, width, height, selectedAlgorithm, mstResult, mstEdges, onMstEdgeClick, onNodeClick, selectedNodeId, pendingSourceNodeId, onNodePositionChange, onEdgeClick, selectedEdgeId, getEdgeDisplayStyles]);


  // Update MST highlights and general selection highlights when props change
  useLayoutEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const mstEdgeIdsForStyling = new Set(mstEdges.map(edge => { // Recompute for useLayoutEffect scope
        const sortedNodes = [edge.source, edge.target].sort();
        return `${sortedNodes[0]}-${sortedNodes[1]}-${edge.weight}`;
    }));

    svg.selectAll('line')
      .attr('stroke', (d: any) => getEdgeDisplayStyles(d, false, mstEdgeIdsForStyling, selectedEdgeId).stroke)
      .attr('stroke-width', (d: any) => getEdgeDisplayStyles(d, false, mstEdgeIdsForStyling, selectedEdgeId).strokeWidth);

    svg.selectAll('.link-weight')
      .attr('fill', (d: any) => { // Recompute text fill based on state
        const sortedNodes = [(d.source as Node).id, (d.target as Node).id].sort();
        const isMstEdge = mstEdgeIdsForStyling.has(`${sortedNodes[0]}-${sortedNodes[1]}-${d.weight}`);
        const isSelectedEdge = d.id === selectedEdgeId;

        if (isSelectedEdge) return 'rgb(37, 99, 235)'; // Darker blue for clicked edge text
        if (isMstEdge) return 'rgb(185, 28, 28)'; // Red for MST edge text
        return '#555'; // Default
      });

    // Update node highlights in useLayoutEffect too for immediate visual feedback on node click
    svg.selectAll('circle')
      .attr('stroke', (d: any) => { // Node stroke priority: pendingSource > selectedNode > default
        if (d.id === pendingSourceNodeId) return 'rgb(34, 197, 94)'; // Green for pending source (emerald-500)
        if (d.id === selectedNodeId) return 'rgb(251, 191, 36)'; // Yellow for selected node (yellow-400)
        return '#fff'; // Default
      })
      .attr('stroke-width', (d: any) => { // Node stroke width priority: pendingSource > selectedNode > default
        if (d.id === pendingSourceNodeId) return 3;
        if (d.id === selectedNodeId) return 3;
        return 1.5;
      })
      .attr('fill', (d: any) => d.id === selectedNodeId || d.id === pendingSourceNodeId ? 'rgb(79, 70, 229)' : 'rgb(79, 70, 229)'); // Ensure fill is also reset to default indigo-600, not affected by hover
      
    // Handle delete button visibility and position
    const deleteButtonElement = deleteButtonRef.current;
    if (deleteButtonElement && selectedEdgeId) {
        const selectedEdge = edges.find(e => e.id === selectedEdgeId);
        if (selectedEdge) {
            const sourceNode = nodes.find(n => n.id === selectedEdge.source);
            const targetNode = nodes.find(n => n.id === selectedEdge.target);

            if (sourceNode && targetNode && svgRef.current) {
                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;

                const svgRect = svgRef.current.getBoundingClientRect();
                const parentRect = svgRef.current.parentElement?.getBoundingClientRect();

                if (parentRect) {
                  const scaleX = svgRect.width / width; // Assuming SVG scales to its container width
                  const scaleY = svgRect.height / height; // Assuming SVG scales to its container height

                  // Calculate screen coordinates relative to the SVG's parent container
                  const screenX = (svgRect.left - parentRect.left) + (midX * scaleX);
                  const screenY = (svgRect.top - parentRect.top) + (midY * scaleY);

                  deleteButtonElement.style.left = `${screenX - (deleteButtonElement.offsetWidth / 2)}px`;
                  deleteButtonElement.style.top = `${screenY - (deleteButtonElement.offsetHeight / 2) - 15}px`; // Offset above edge
                  deleteButtonElement.style.opacity = '1';
                  deleteButtonElement.style.pointerEvents = 'auto';
                  deleteButtonElement.onclick = () => {
                    if (onDeleteEdgeClick) {
                      onDeleteEdgeClick(selectedEdge.id);
                    }
                  };
                }
            }
        }
    } else if (deleteButtonElement) {
        deleteButtonElement.style.opacity = '0';
        deleteButtonElement.style.pointerEvents = 'none';
    }

  }, [mstEdges, selectedNodeId, pendingSourceNodeId, selectedEdgeId, nodes, edges, getEdgeDisplayStyles, width, height, onDeleteEdgeClick]);


  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6 relative overflow-hidden"> {/* Added relative and overflow-hidden */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Network Visualization</h3>
      {nodes.length === 0 && (
        <p className="text-gray-600 text-center">Add locations to visualize your network.</p>
      )}
      {nodes.length > 0 && edges.length === 0 && (
        <p className="text-gray-600 text-center">Add connections between locations to see the graph.</p>
      )}
      <div className="flex justify-center items-center">
        <svg ref={svgRef} width={width} height={height} className="border border-gray-300 rounded-md bg-gray-50"></svg>
      </div>

      {/* Delete Edge Button */}
      <button
        ref={deleteButtonRef}
        className="absolute bg-red-600 hover:bg-red-700 text-white p-1 rounded-full text-xs font-bold transition-opacity duration-300 shadow-md"
        style={{ opacity: 0, pointerEvents: 'none', transform: 'translate(-50%, -50%)' }} // Initial hidden state
        title="Delete selected connection"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  );
};

export default GraphVisualization;