
export type NodeId = string;

export interface Node {
  id: NodeId;
  name: string;
  x: number; // For visualization
  y: number; // For visualization
}

export interface Edge {
  id: string; // Unique ID for the edge
  source: NodeId;
  target: NodeId;
  weight: number;
}

export enum AlgorithmType {
  KRUSKAL = 'Kruskal\'s Algorithm',
  PRIM = 'Prim\'s Algorithm',
}

export interface MSTResult {
  cost: number;
  edges: Edge[];
}

export interface AdjacencyList {
  [nodeId: string]: { target: NodeId; weight: number }[];
}

export interface DSUItem {
  parent: NodeId;
  rank: number;
}

export interface DSU {
  [nodeId: string]: DSUItem;
}
    