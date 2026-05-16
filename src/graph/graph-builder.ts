/**
 * Graph Builder Module
 * 
 * Builds and manages the dependency graph in Neo4j.
 * Creates nodes for files, functions, classes, interfaces, and APIs.
 * Creates relationships for imports, calls, and dependencies.
 */

import { Neo4jClient } from './neo4j-client';
import { ParsedFile, Dependency, GraphNode, GraphEdge } from '../types';
import { logger } from '../utils/logger';
import { normalizePath } from '../utils/file-utils';

export class GraphBuilder {
  private neo4jClient: Neo4jClient;

  constructor(neo4jClient: Neo4jClient) {
    this.neo4jClient = neo4jClient;
  }

  /**
   * Build the complete dependency graph from parsed files
   */
  async buildGraph(parsedFiles: ParsedFile[], dependencies: Dependency[]): Promise<void> {
    try {
      logger.info('Building dependency graph...');

      // Create file nodes
      await this.createFileNodes(parsedFiles);

      // Create function, class, and interface nodes
      await this.createCodeElementNodes(parsedFiles);

      // Create dependency relationships
      await this.createDependencyRelationships(dependencies);

      logger.info('Dependency graph built successfully');
    } catch (error) {
      logger.error('Error building dependency graph', error);
      throw error;
    }
  }

  /**
   * Create file nodes in the graph
   */
  private async createFileNodes(parsedFiles: ParsedFile[]): Promise<void> {
    for (const file of parsedFiles) {
      const query = `
        MERGE (f:File {path: $path})
        SET f.functionCount = $functionCount,
            f.classCount = $classCount,
            f.interfaceCount = $interfaceCount,
            f.apiRouteCount = $apiRouteCount,
            f.updatedAt = datetime()
      `;

      await this.neo4jClient.executeQuery(query, {
        path: normalizePath(file.filePath),
        functionCount: file.functions.length,
        classCount: file.classes.length,
        interfaceCount: file.interfaces.length,
        apiRouteCount: file.apiRoutes.length,
      });
    }

    logger.debug(`Created ${parsedFiles.length} file nodes`);
  }

  /**
   * Create nodes for functions, classes, and interfaces
   */
  private async createCodeElementNodes(parsedFiles: ParsedFile[]): Promise<void> {
    for (const file of parsedFiles) {
      const filePath = normalizePath(file.filePath);

      // Create function nodes
      for (const func of file.functions) {
        await this.createFunctionNode(filePath, func);
      }

      // Create class nodes
      for (const cls of file.classes) {
        await this.createClassNode(filePath, cls);
      }

      // Create interface nodes
      for (const iface of file.interfaces) {
        await this.createInterfaceNode(filePath, iface);
      }

      // Create API route nodes
      for (const route of file.apiRoutes) {
        await this.createApiRouteNode(filePath, route);
      }
    }

    logger.debug('Created code element nodes');
  }

  /**
   * Create a function node
   */
  private async createFunctionNode(filePath: string, func: any): Promise<void> {
    const query = `
      MATCH (f:File {path: $filePath})
      MERGE (fn:Function {name: $name, filePath: $filePath})
      SET fn.returnType = $returnType,
          fn.isAsync = $isAsync,
          fn.isExported = $isExported,
          fn.lineNumber = $lineNumber,
          fn.parameterCount = $parameterCount
      MERGE (f)-[:CONTAINS]->(fn)
    `;

    await this.neo4jClient.executeQuery(query, {
      filePath,
      name: func.name,
      returnType: func.returnType,
      isAsync: func.isAsync,
      isExported: func.isExported,
      lineNumber: func.lineNumber,
      parameterCount: func.parameters.length,
    });
  }

  /**
   * Create a class node
   */
  private async createClassNode(filePath: string, cls: any): Promise<void> {
    const query = `
      MATCH (f:File {path: $filePath})
      MERGE (c:Class {name: $name, filePath: $filePath})
      SET c.isExported = $isExported,
          c.lineNumber = $lineNumber,
          c.methodCount = $methodCount,
          c.propertyCount = $propertyCount
      MERGE (f)-[:CONTAINS]->(c)
    `;

    await this.neo4jClient.executeQuery(query, {
      filePath,
      name: cls.name,
      isExported: cls.isExported,
      lineNumber: cls.lineNumber,
      methodCount: cls.methods.length,
      propertyCount: cls.properties.length,
    });
  }

  /**
   * Create an interface node
   */
  private async createInterfaceNode(filePath: string, iface: any): Promise<void> {
    const query = `
      MATCH (f:File {path: $filePath})
      MERGE (i:Interface {name: $name, filePath: $filePath})
      SET i.isExported = $isExported,
          i.lineNumber = $lineNumber,
          i.propertyCount = $propertyCount
      MERGE (f)-[:CONTAINS]->(i)
    `;

    await this.neo4jClient.executeQuery(query, {
      filePath,
      name: iface.name,
      isExported: iface.isExported,
      lineNumber: iface.lineNumber,
      propertyCount: iface.properties.length,
    });
  }

  /**
   * Create an API route node
   */
  private async createApiRouteNode(filePath: string, route: any): Promise<void> {
    const query = `
      MATCH (f:File {path: $filePath})
      MERGE (a:ApiRoute {method: $method, path: $path, filePath: $filePath})
      SET a.handler = $handler,
          a.lineNumber = $lineNumber,
          a.hasRequestSchema = $hasRequestSchema,
          a.hasResponseSchema = $hasResponseSchema
      MERGE (f)-[:CONTAINS]->(a)
    `;

    await this.neo4jClient.executeQuery(query, {
      filePath,
      method: route.method,
      path: route.path,
      handler: route.handler,
      lineNumber: route.lineNumber,
      hasRequestSchema: !!route.requestSchema,
      hasResponseSchema: !!route.responseSchema,
    });
  }

  /**
   * Create dependency relationships
   */
  private async createDependencyRelationships(dependencies: Dependency[]): Promise<void> {
    for (const dep of dependencies) {
      const query = `
        MATCH (source:File {path: $sourceFile})
        MATCH (target:File {path: $targetFile})
        MERGE (source)-[r:IMPORTS]->(target)
        SET r.symbols = $symbols,
            r.type = $type
      `;

      await this.neo4jClient.executeQuery(query, {
        sourceFile: dep.sourceFile,
        targetFile: dep.targetFile,
        symbols: dep.importedSymbols,
        type: dep.dependencyType,
      });
    }

    logger.debug(`Created ${dependencies.length} dependency relationships`);
  }

  /**
   * Find all files that depend on a given file (direct dependents)
   */
  async findDirectDependents(filePath: string): Promise<string[]> {
    const query = `
      MATCH (source:File)-[:IMPORTS]->(target:File {path: $filePath})
      RETURN source.path as path
    `;

    const results = await this.neo4jClient.executeQuery(query, {
      filePath: normalizePath(filePath),
    });

    return results.map((r) => r.path);
  }

  /**
   * Find all files that a given file depends on (direct dependencies)
   */
  async findDirectDependencies(filePath: string): Promise<string[]> {
    const query = `
      MATCH (source:File {path: $filePath})-[:IMPORTS]->(target:File)
      RETURN target.path as path
    `;

    const results = await this.neo4jClient.executeQuery(query, {
      filePath: normalizePath(filePath),
    });

    return results.map((r) => r.path);
  }

  /**
   * Find all files affected by changes (transitive dependents)
   */
  async findAllAffectedFiles(filePath: string, maxDepth: number = 5): Promise<string[]> {
    const query = `
      MATCH path = (source:File)-[:IMPORTS*1..${maxDepth}]->(target:File {path: $filePath})
      RETURN DISTINCT source.path as path
    `;

    const results = await this.neo4jClient.executeQuery(query, {
      filePath: normalizePath(filePath),
    });

    return results.map((r) => r.path);
  }

  /**
   * Find circular dependencies
   */
  async findCircularDependencies(): Promise<string[][]> {
    const query = `
      MATCH path = (f:File)-[:IMPORTS*2..]->(f)
      RETURN [node in nodes(path) | node.path] as cycle
      LIMIT 100
    `;

    const results = await this.neo4jClient.executeQuery(query);
    return results.map((r) => r.cycle);
  }

  /**
   * Get dependency statistics
   */
  async getDependencyStats(): Promise<DependencyStats> {
    const fileCountQuery = 'MATCH (f:File) RETURN count(f) as count';
    const depCountQuery = 'MATCH ()-[r:IMPORTS]->() RETURN count(r) as count';
    const functionCountQuery = 'MATCH (fn:Function) RETURN count(fn) as count';
    const apiCountQuery = 'MATCH (a:ApiRoute) RETURN count(a) as count';

    const [fileCount, depCount, functionCount, apiCount] = await Promise.all([
      this.neo4jClient.executeQuery(fileCountQuery),
      this.neo4jClient.executeQuery(depCountQuery),
      this.neo4jClient.executeQuery(functionCountQuery),
      this.neo4jClient.executeQuery(apiCountQuery),
    ]);

    return {
      totalFiles: fileCount[0]?.count || 0,
      totalDependencies: depCount[0]?.count || 0,
      totalFunctions: functionCount[0]?.count || 0,
      totalApiRoutes: apiCount[0]?.count || 0,
    };
  }

  /**
   * Find API routes in a file
   */
  async findApiRoutesInFile(filePath: string): Promise<any[]> {
    const query = `
      MATCH (f:File {path: $filePath})-[:CONTAINS]->(a:ApiRoute)
      RETURN a.method as method, a.path as path, a.lineNumber as lineNumber
    `;

    return await this.neo4jClient.executeQuery(query, {
      filePath: normalizePath(filePath),
    });
  }

  /**
   * Find files that consume an API route
   */
  async findApiConsumers(method: string, path: string): Promise<string[]> {
    // This is a simplified version - in reality, you'd need to analyze
    // HTTP client calls in the code
    const query = `
      MATCH (api:ApiRoute {method: $method, path: $path})
      MATCH (api)<-[:CONTAINS]-(apiFile:File)
      MATCH (consumer:File)-[:IMPORTS]->(apiFile)
      RETURN DISTINCT consumer.path as path
    `;

    const results = await this.neo4jClient.executeQuery(query, { method, path });
    return results.map((r) => r.path);
  }
}

/**
 * Dependency statistics
 */
export interface DependencyStats {
  totalFiles: number;
  totalDependencies: number;
  totalFunctions: number;
  totalApiRoutes: number;
}

// Made with Bob
