import { Graph } from 'graphlib';
import {
  DependencyGraph,
  GraphNode,
  GraphEdge,
  Dependency,
  DependencyType,
  ParseResult
} from '../types';

/**
 * Dependency Graph Builder and Analyzer
 * Uses graphlib for efficient graph operations
 */
export class DependencyGraphBuilder {
  private graph: Graph;
  private nodes: Map<string, GraphNode>;
  private edges: Map<string, GraphEdge[]>;

  constructor() {
    this.graph = new Graph({ directed: true, multigraph: true });
    this.nodes = new Map();
    this.edges = new Map();
  }

  /**
   * Build dependency graph from parse results
   */
  buildGraph(parseResults: ParseResult[]): DependencyGraph {
    // Clear existing graph
    this.graph = new Graph({ directed: true, multigraph: true });
    this.nodes.clear();
    this.edges.clear();

    // Add nodes for each file
    for (const result of parseResults) {
      this.addNode(result);
    }

    // Add edges for dependencies
    for (const result of parseResults) {
      this.addEdges(result);
    }

    return {
      nodes: this.nodes,
      edges: this.edges
    };
  }

  /**
   * Add a node to the graph
   */
  private addNode(parseResult: ParseResult): void {
    const node: GraphNode = {
      id: parseResult.filePath,
      filePath: parseResult.filePath,
      symbols: parseResult.symbols,
      metadata: {
        importCount: parseResult.imports.length,
        exportCount: parseResult.exports.length,
        symbolCount: parseResult.symbols.length,
        errorCount: parseResult.errors.length
      }
    };

    this.nodes.set(node.id, node);
    this.graph.setNode(node.id, node);
  }

  /**
   * Add edges for dependencies
   */
  private addEdges(parseResult: ParseResult): void {
    const sourceId = parseResult.filePath;

    for (const dependency of parseResult.dependencies) {
      // Skip external dependencies for now
      if (dependency.isExternal) {
        continue;
      }

      const edge: GraphEdge = {
        from: sourceId,
        to: dependency.target,
        type: dependency.type,
        weight: this.calculateEdgeWeight(dependency.type)
      };

      // Add to edges map
      if (!this.edges.has(sourceId)) {
        this.edges.set(sourceId, []);
      }
      this.edges.get(sourceId)!.push(edge);

      // Add to graphlib graph
      this.graph.setEdge(sourceId, dependency.target, edge);
    }
  }

  /**
   * Calculate edge weight based on dependency type
   */
  private calculateEdgeWeight(type: DependencyType): number {
    const weights: Record<DependencyType, number> = {
      [DependencyType.Import]: 1,
      [DependencyType.Call]: 2,
      [DependencyType.Inheritance]: 3,
      [DependencyType.Implementation]: 3,
      [DependencyType.Reference]: 1,
      [DependencyType.Type]: 1
    };

    return weights[type] || 1;
  }

  /**
   * Get all dependencies of a file
   */
  getDependencies(filePath: string): string[] {
    return this.graph.successors(filePath) || [];
  }

  /**
   * Get all dependents (files that depend on this file)
   */
  getDependents(filePath: string): string[] {
    return this.graph.predecessors(filePath) || [];
  }

  /**
   * Get transitive dependencies (all files this file depends on, recursively)
   */
  getTransitiveDependencies(filePath: string, maxDepth: number = 10): string[] {
    const visited = new Set<string>();
    const queue: Array<{ file: string; depth: number }> = [{ file: filePath, depth: 0 }];
    const dependencies: string[] = [];

    while (queue.length > 0) {
      const { file, depth } = queue.shift()!;

      if (visited.has(file) || depth >= maxDepth) {
        continue;
      }

      visited.add(file);

      const deps = this.getDependencies(file);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dependencies.push(dep);
          queue.push({ file: dep, depth: depth + 1 });
        }
      }
    }

    return dependencies;
  }

  /**
   * Get transitive dependents (all files that depend on this file, recursively)
   */
  getTransitiveDependents(filePath: string, maxDepth: number = 10): string[] {
    const visited = new Set<string>();
    const queue: Array<{ file: string; depth: number }> = [{ file: filePath, depth: 0 }];
    const dependents: string[] = [];

    while (queue.length > 0) {
      const { file, depth } = queue.shift()!;

      if (visited.has(file) || depth >= maxDepth) {
        continue;
      }

      visited.add(file);

      const deps = this.getDependents(file);
      for (const dep of deps) {
        if (!visited.has(dep)) {
          dependents.push(dep);
          queue.push({ file: dep, depth: depth + 1 });
        }
      }
    }

    return dependents;
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = this.getDependencies(node);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push([...path.slice(cycleStart), neighbor]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  /**
   * Find critical paths (longest paths in the graph)
   */
  findCriticalPaths(limit: number = 10): string[][] {
    const paths: string[][] = [];

    const dfs = (node: string, path: string[], visited: Set<string>): void => {
      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      path.push(node);

      const neighbors = this.getDependencies(node);
      if (neighbors.length === 0) {
        // Leaf node - save the path
        paths.push([...path]);
      } else {
        for (const neighbor of neighbors) {
          dfs(neighbor, [...path], new Set(visited));
        }
      }
    };

    // Start DFS from all root nodes (nodes with no incoming edges)
    for (const node of this.nodes.keys()) {
      const predecessors = this.getDependents(node);
      if (predecessors.length === 0) {
        dfs(node, [], new Set());
      }
    }

    // Sort by path length and return top N
    return paths
      .sort((a, b) => b.length - a.length)
      .slice(0, limit);
  }

  /**
   * Calculate metrics for a file
   */
  getFileMetrics(filePath: string): {
    inDegree: number;
    outDegree: number;
    dependencyCount: number;
    dependentCount: number;
    complexity: number;
  } {
    const inDegree = this.getDependents(filePath).length;
    const outDegree = this.getDependencies(filePath).length;
    const dependencyCount = this.getTransitiveDependencies(filePath).length;
    const dependentCount = this.getTransitiveDependents(filePath).length;
    
    // Complexity score based on connections
    const complexity = inDegree * 2 + outDegree + dependencyCount * 0.5 + dependentCount * 0.5;

    return {
      inDegree,
      outDegree,
      dependencyCount,
      dependentCount,
      complexity
    };
  }

  /**
   * Get the most connected files (hubs)
   */
  getHubs(limit: number = 10): Array<{ file: string; connections: number }> {
    const hubs: Array<{ file: string; connections: number }> = [];

    for (const node of this.nodes.keys()) {
      const metrics = this.getFileMetrics(node);
      hubs.push({
        file: node,
        connections: metrics.inDegree + metrics.outDegree
      });
    }

    return hubs
      .sort((a, b) => b.connections - a.connections)
      .slice(0, limit);
  }

  /**
   * Export graph to DOT format for visualization
   */
  toDot(): string {
    let dot = 'digraph DependencyGraph {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    // Add nodes
    for (const [id, node] of this.nodes) {
      const label = node.filePath.split('/').pop() || id;
      dot += `  "${id}" [label="${label}"];\n`;
    }

    dot += '\n';

    // Add edges
    for (const [from, edges] of this.edges) {
      for (const edge of edges) {
        const color = this.getEdgeColor(edge.type);
        dot += `  "${from}" -> "${edge.to}" [label="${edge.type}", color="${color}"];\n`;
      }
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Get color for edge based on dependency type
   */
  private getEdgeColor(type: DependencyType): string {
    const colors: Record<DependencyType, string> = {
      [DependencyType.Import]: 'blue',
      [DependencyType.Call]: 'green',
      [DependencyType.Inheritance]: 'red',
      [DependencyType.Implementation]: 'orange',
      [DependencyType.Reference]: 'gray',
      [DependencyType.Type]: 'purple'
    };

    return colors[type] || 'black';
  }

  /**
   * Get the underlying graphlib instance
   */
  getGraph(): Graph {
    return this.graph;
  }
}

// Made with Bob
