import { Edge, NodeId, MSTResult, DSU, AdjacencyList } from '../types';

// Helper for Disjoint Set Union (DSU)
class DisjointSet {
  private parent: Map<NodeId, NodeId>;
  private rank: Map<NodeId, number>;

  constructor(nodes: NodeId[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const node of nodes) {
      this.parent.set(node, node);
      this.rank.set(node, 0);
    }
  }

  find(i: NodeId): NodeId {
    if (this.parent.get(i) === i) {
      return i;
    }
    const root = this.find(this.parent.get(i)!);
    this.parent.set(i, root);
    return root;
  }

  union(i: NodeId, j: NodeId): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);

    if (rootI !== rootJ) {
      const rankI = this.rank.get(rootI)!;
      const rankJ = this.rank.get(rootJ)!;

      if (rankI < rankJ) {
        this.parent.set(rootI, rootJ);
      } else if (rankJ < rankI) {
        this.parent.set(rootJ, rootI);
      } else {
        this.parent.set(rootJ, rootI);
        this.rank.set(rootI, rankI + 1);
      }
      return true;
    }
    return false;
  }
}

export const kruskal = (nodes: NodeId[], edges: Edge[]): MSTResult => {
  if (nodes.length === 0) {
    return { cost: 0, edges: [] };
  }
  if (nodes.length === 1) {
    return { cost: 0, edges: [] };
  }

  // Fix: nodes is an array of NodeId (strings), so no need to access .id
  const existingNodeIds = new Set(nodes);
  const validEdges = edges.filter(edge => {
    if (!existingNodeIds.has(edge.source) || !existingNodeIds.has(edge.target)) {
      console.warn(`Edge ${edge.id} (from ${edge.source} to ${edge.target}) refers to a non-existent node and will be skipped by Kruskal's algorithm.`);
      return false;
    }
    return true;
  });

  const sortedEdges = [...validEdges].sort((a, b) => a.weight - b.weight);
  const mstEdges: Edge[] = [];
  let totalCost = 0;
  const dsu = new DisjointSet(nodes);

  for (const edge of sortedEdges) {
    if (dsu.union(edge.source, edge.target)) {
      mstEdges.push(edge);
      totalCost += edge.weight;
      if (mstEdges.length === nodes.length - 1) {
        break; // MST found
      }
    }
  }

  // Check if a spanning tree was actually formed (graph is connected)
  if (mstEdges.length !== nodes.length - 1 && nodes.length > 1) {
    // If not all nodes are connected, return a partial result or indicate failure
    // For this app, we assume the user will input a connected graph or handle disconnected components conceptually.
    // However, if mstEdges.length < nodes.length - 1, it means the graph is disconnected.
    console.warn("Graph is disconnected. MST only covers connected components.");
  }


  return { cost: totalCost, edges: mstEdges };
};

export const prim = (nodes: NodeId[], edges: Edge[]): MSTResult => {
  if (nodes.length === 0) {
    return { cost: 0, edges: [] };
  }
  if (nodes.length === 1) {
    return { cost: 0, edges: [] };
  }

  const adjacencyList: AdjacencyList = {};
  for (const node of nodes) {
    adjacencyList[node] = [];
  }

  // Fix: nodes is an array of NodeId (strings), so no need to access .id
  const existingNodeIds = new Set(nodes);
  const validEdges: Edge[] = [];

  for (const edge of edges) {
    if (existingNodeIds.has(edge.source) && existingNodeIds.has(edge.target)) {
      validEdges.push(edge);
    } else {
      console.warn(`Edge ${edge.id} (from ${edge.source} to ${edge.target}) refers to a non-existent node and will be skipped by Prim's algorithm.`);
    }
  }

  for (const edge of validEdges) { // Use validEdges here
    adjacencyList[edge.source].push({ target: edge.target, weight: edge.weight });
    adjacencyList[edge.target].push({ target: edge.source, weight: edge.weight });
  }

  const startNode = nodes[0]; // Prim's needs a starting node. Assume the graph is connected.
  const mstEdges: Edge[] = [];
  let totalCost = 0;
  const visited = new Set<NodeId>();
  // Priority queue stores { weight, source, target, edgeId }
  // Using an array and sorting for simplicity, in real-world a Min-Heap would be used.
  type PriorityQueueItem = { weight: number; source: NodeId; target: NodeId; edgeId: string };
  const priorityQueue: PriorityQueueItem[] = [];

  // Initialize with the first node's edges, if available
  if (adjacencyList[startNode]) { // Defensive check
    visited.add(startNode);
    for (const neighbor of adjacencyList[startNode]) {
      // Ensure the neighbor target is also a valid node
      if (existingNodeIds.has(neighbor.target)) {
        priorityQueue.push({
          weight: neighbor.weight,
          source: startNode,
          target: neighbor.target,
          edgeId: `prim-edge-${startNode}-${neighbor.target}-${neighbor.weight}` // Simple unique ID
        });
      }
    }
    priorityQueue.sort((a, b) => a.weight - b.weight);
  } else {
    // If the startNode somehow doesn't exist in adjacencyList (shouldn't happen if nodes array is non-empty)
    // or if the graph is completely empty of edges for the startNode, then no MST can be formed.
    console.warn("Prim's: Start node has no valid connections or is itself invalid.");
    return { cost: 0, edges: [] };
  }


  while (mstEdges.length < nodes.length - 1 && priorityQueue.length > 0) {
    const minEdge = priorityQueue.shift()!; // Get smallest weight edge
    const { weight, source, target, edgeId } = minEdge;

    let newNode: NodeId | null = null;
    if (visited.has(source) && !visited.has(target)) {
      newNode = target;
    } else if (visited.has(target) && !visited.has(source)) {
      newNode = source;
    }

    if (newNode !== null) {
      visited.add(newNode);
      mstEdges.push({ id: edgeId, source: source, target: target, weight: weight });
      totalCost += weight;

      // Add new edges from newNode to the priority queue
      if (adjacencyList[newNode]) { // Defensive check
        for (const neighbor of adjacencyList[newNode]) {
          if (!visited.has(neighbor.target) && existingNodeIds.has(neighbor.target)) { // Also check neighbor target validity
            priorityQueue.push({
              weight: neighbor.weight,
              source: newNode,
              target: neighbor.target,
              edgeId: `prim-edge-${newNode}-${neighbor.target}-${neighbor.weight}`
            });
          }
        }
        priorityQueue.sort((a, b) => a.weight - b.weight); // Re-sort after adding
      }
    }
  }

  // Check if a spanning tree was actually formed (graph is connected)
  if (visited.size < nodes.length && nodes.length > 1) {
      console.warn("Graph is disconnected. Prim's algorithm only covers the connected component of the starting node.");
  }

  return { cost: totalCost, edges: mstEdges };
};