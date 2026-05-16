/**
 * Dependency Analyzer Module
 * 
 * Analyzes import relationships between files to build dependency graph.
 * Detects:
 * - File A imports File B
 * - Circular dependencies
 * - Unused imports
 */

import { ParsedFile, Dependency, ImportStatement } from '../types';
import { logger } from '../utils/logger';
import { resolveImportPath, normalizePath } from '../utils/file-utils';

export class DependencyAnalyzer {
  private baseDir: string;
  private parsedFiles: Map<string, ParsedFile>;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
    this.parsedFiles = new Map();
  }

  /**
   * Add parsed files to the analyzer
   */
  addParsedFiles(files: ParsedFile[]): void {
    files.forEach((file) => {
      this.parsedFiles.set(normalizePath(file.filePath), file);
    });
  }

  /**
   * Analyze dependencies for all files
   */
  analyzeDependencies(): Dependency[] {
    const dependencies: Dependency[] = [];

    for (const [filePath, parsedFile] of this.parsedFiles) {
      const fileDeps = this.analyzeFileDependencies(parsedFile);
      dependencies.push(...fileDeps);
    }

    logger.info(`Analyzed ${dependencies.length} dependencies across ${this.parsedFiles.size} files`);
    return dependencies;
  }

  /**
   * Analyze dependencies for a single file
   */
  private analyzeFileDependencies(parsedFile: ParsedFile): Dependency[] {
    const dependencies: Dependency[] = [];

    for (const importStmt of parsedFile.imports) {
      const dependency = this.createDependency(parsedFile.filePath, importStmt);
      if (dependency) {
        dependencies.push(dependency);
      }
    }

    return dependencies;
  }

  /**
   * Create a dependency object from an import statement
   */
  private createDependency(
    sourceFile: string,
    importStmt: ImportStatement
  ): Dependency | null {
    // Skip external dependencies (node_modules)
    if (this.isExternalDependency(importStmt.modulePath)) {
      return null;
    }

    const targetFile = resolveImportPath(
      sourceFile,
      importStmt.modulePath,
      this.baseDir
    );

    if (!targetFile) {
      logger.warn(`Could not resolve import: ${importStmt.modulePath} in ${sourceFile}`);
      return null;
    }

    return {
      sourceFile: normalizePath(sourceFile),
      targetFile: normalizePath(targetFile),
      importedSymbols: importStmt.importedNames,
      dependencyType: 'import',
    };
  }

  /**
   * Check if import is an external dependency
   */
  private isExternalDependency(modulePath: string): boolean {
    // External dependencies don't start with . or /
    return !modulePath.startsWith('.') && !modulePath.startsWith('/');
  }

  /**
   * Find all files that depend on a given file
   */
  findDependents(targetFile: string): string[] {
    const normalizedTarget = normalizePath(targetFile);
    const dependents: string[] = [];

    for (const [filePath, parsedFile] of this.parsedFiles) {
      for (const importStmt of parsedFile.imports) {
        const resolvedPath = resolveImportPath(
          filePath,
          importStmt.modulePath,
          this.baseDir
        );

        if (resolvedPath && normalizePath(resolvedPath) === normalizedTarget) {
          dependents.push(filePath);
          break;
        }
      }
    }

    return dependents;
  }

  /**
   * Find all files that a given file depends on
   */
  findDependencies(sourceFile: string): string[] {
    const normalizedSource = normalizePath(sourceFile);
    const parsedFile = this.parsedFiles.get(normalizedSource);

    if (!parsedFile) {
      return [];
    }

    const dependencies: string[] = [];

    for (const importStmt of parsedFile.imports) {
      if (this.isExternalDependency(importStmt.modulePath)) {
        continue;
      }

      const targetFile = resolveImportPath(
        sourceFile,
        importStmt.modulePath,
        this.baseDir
      );

      if (targetFile) {
        dependencies.push(normalizePath(targetFile));
      }
    }

    return dependencies;
  }

  /**
   * Detect circular dependencies
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (file: string, path: string[]): void => {
      visited.add(file);
      recursionStack.add(file);
      path.push(file);

      const dependencies = this.findDependencies(file);

      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          dfs(dep, [...path]);
        } else if (recursionStack.has(dep)) {
          // Found a cycle
          const cycleStart = path.indexOf(dep);
          const cycle = path.slice(cycleStart);
          cycle.push(dep);
          cycles.push(cycle);
        }
      }

      recursionStack.delete(file);
    };

    for (const file of this.parsedFiles.keys()) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    if (cycles.length > 0) {
      logger.warn(`Detected ${cycles.length} circular dependencies`);
    }

    return cycles;
  }

  /**
   * Get dependency tree for a file (recursive)
   */
  getDependencyTree(file: string, maxDepth: number = 5): DependencyTree {
    const normalizedFile = normalizePath(file);
    const visited = new Set<string>();

    const buildTree = (currentFile: string, depth: number): DependencyTree => {
      if (depth >= maxDepth || visited.has(currentFile)) {
        return {
          file: currentFile,
          dependencies: [],
        };
      }

      visited.add(currentFile);
      const dependencies = this.findDependencies(currentFile);

      return {
        file: currentFile,
        dependencies: dependencies.map((dep) => buildTree(dep, depth + 1)),
      };
    };

    return buildTree(normalizedFile, 0);
  }

  /**
   * Find unused exports in a file
   */
  findUnusedExports(file: string): string[] {
    const normalizedFile = normalizePath(file);
    const parsedFile = this.parsedFiles.get(normalizedFile);

    if (!parsedFile) {
      return [];
    }

    const exportedNames = parsedFile.exports.map((exp) => exp.exportedName);
    const usedExports = new Set<string>();

    // Check all files that import from this file
    const dependents = this.findDependents(file);

    for (const dependent of dependents) {
      const depParsedFile = this.parsedFiles.get(dependent);
      if (!depParsedFile) continue;

      for (const importStmt of depParsedFile.imports) {
        const resolvedPath = resolveImportPath(
          dependent,
          importStmt.modulePath,
          this.baseDir
        );

        if (resolvedPath && normalizePath(resolvedPath) === normalizedFile) {
          importStmt.importedNames.forEach((name) => usedExports.add(name));
        }
      }
    }

    return exportedNames.filter((name) => !usedExports.has(name));
  }

  /**
   * Clear cached data
   */
  clear(): void {
    this.parsedFiles.clear();
  }
}

/**
 * Dependency tree structure
 */
export interface DependencyTree {
  file: string;
  dependencies: DependencyTree[];
}

// Made with Bob
