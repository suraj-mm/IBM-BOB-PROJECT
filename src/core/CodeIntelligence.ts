import * as path from 'path';
import * as fg from 'fast-glob';
import { TypeScriptParser } from '../parsers/TypeScriptParser';
import { DependencyGraphBuilder } from './DependencyGraph';
import { ImpactAnalyzer } from '../analyzers/ImpactAnalyzer';
import {
  CodeIntelligenceConfig,
  ParseResult,
  DependencyGraph,
  ImpactAnalysis,
  QueryResult,
  CodeSymbol,
  SymbolKind,
  AnalysisOptions
} from '../types';

/**
 * Main Code Intelligence Engine API
 * Provides high-level interface for code analysis
 */
export class CodeIntelligence {
  private config: CodeIntelligenceConfig;
  private parser: TypeScriptParser;
  private graphBuilder: DependencyGraphBuilder;
  private impactAnalyzer: ImpactAnalyzer;
  private parseResults: Map<string, ParseResult>;
  private dependencyGraph?: DependencyGraph;

  constructor(config: CodeIntelligenceConfig) {
    this.config = config;
    this.parser = new TypeScriptParser(
      path.join(config.rootDir, 'tsconfig.json')
    );
    this.graphBuilder = new DependencyGraphBuilder();
    this.impactAnalyzer = new ImpactAnalyzer(this.graphBuilder);
    this.parseResults = new Map();
  }

  /**
   * Initialize and analyze the entire codebase
   */
  async initialize(): Promise<void> {
    console.log('🔍 Scanning codebase...');
    const files = await this.discoverFiles();
    console.log(`📁 Found ${files.length} files`);

    console.log('🔬 Parsing files...');
    const results = await this.parser.parseFiles(files);
    
    // Store parse results
    for (const result of results) {
      this.parseResults.set(result.filePath, result);
    }

    console.log('🕸️  Building dependency graph...');
    this.dependencyGraph = this.graphBuilder.buildGraph(results);

    console.log('✅ Code intelligence initialized');
    console.log(`   - Files analyzed: ${files.length}`);
    console.log(`   - Symbols found: ${this.getTotalSymbolCount()}`);
    console.log(`   - Dependencies: ${this.getTotalDependencyCount()}`);
  }

  /**
   * Discover all relevant files in the project
   */
  private async discoverFiles(): Promise<string[]> {
    const options = this.config.options;
    const patterns: string[] = options.filePatterns || [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx'
    ];

    const excludePatterns: string[] = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.d.ts',
      ...(options.excludePatterns || [])
    ];

    if (!options.includeTests) {
      excludePatterns.push('**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx');
    }

    const files = await fg(patterns, {
      cwd: this.config.rootDir,
      absolute: true,
      ignore: excludePatterns
    });

    return files;
  }

  /**
   * Query symbols by name or pattern
   */
  querySymbols(namePattern: string, kind?: SymbolKind): QueryResult {
    const symbols: CodeSymbol[] = [];
    const regex = new RegExp(namePattern, 'i');

    for (const result of this.parseResults.values()) {
      for (const symbol of result.symbols) {
        if (regex.test(symbol.name)) {
          if (!kind || symbol.kind === kind) {
            symbols.push(symbol);
          }
        }
      }
    }

    return {
      symbols,
      dependencies: [],
      metadata: {
        totalMatches: symbols.length,
        query: namePattern,
        kind: kind || 'all'
      }
    };
  }

  /**
   * Find all references to a symbol
   */
  findReferences(symbolName: string): CodeSymbol[] {
    const references: CodeSymbol[] = [];

    for (const result of this.parseResults.values()) {
      for (const symbol of result.symbols) {
        if (symbol.name === symbolName || symbol.name.includes(symbolName)) {
          references.push(symbol);
        }
      }
    }

    return references;
  }

  /**
   * Get all symbols in a file
   */
  getFileSymbols(filePath: string): CodeSymbol[] {
    const result = this.parseResults.get(filePath);
    return result ? result.symbols : [];
  }

  /**
   * Get dependencies of a file
   */
  getFileDependencies(filePath: string): string[] {
    return this.graphBuilder.getDependencies(filePath);
  }

  /**
   * Get dependents of a file (who depends on this file)
   */
  getFileDependents(filePath: string): string[] {
    return this.graphBuilder.getDependents(filePath);
  }

  /**
   * Analyze impact of changes
   */
  analyzeImpact(changedFiles: string[]): ImpactAnalysis {
    return this.impactAnalyzer.analyzeImpact(changedFiles);
  }

  /**
   * Analyze impact of adding a new dependency
   */
  analyzeNewDependency(sourceFile: string, targetFile: string): ImpactAnalysis {
    return this.impactAnalyzer.analyzeNewDependency(sourceFile, targetFile);
  }

  /**
   * Analyze impact of removing a file
   */
  analyzeFileRemoval(filePath: string): ImpactAnalysis {
    return this.impactAnalyzer.analyzeFileRemoval(filePath);
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(): string[][] {
    return this.graphBuilder.findCircularDependencies();
  }

  /**
   * Get file metrics
   */
  getFileMetrics(filePath: string) {
    return this.graphBuilder.getFileMetrics(filePath);
  }

  /**
   * Get most connected files (hubs)
   */
  getHubs(limit: number = 10) {
    return this.graphBuilder.getHubs(limit);
  }

  /**
   * Find high-risk files
   */
  findHighRiskFiles(threshold: number = 10) {
    return this.impactAnalyzer.findHighRiskFiles(threshold);
  }

  /**
   * Find files safe to modify
   */
  findSafeToModify(threshold: number = 5) {
    return this.impactAnalyzer.findSafeToModify(threshold);
  }

  /**
   * Get refactoring suggestions
   */
  getRefactoringSuggestions() {
    return this.impactAnalyzer.suggestRefactoring();
  }

  /**
   * Calculate blast radius for a file
   */
  calculateBlastRadius(filePath: string) {
    return this.impactAnalyzer.calculateBlastRadius(filePath);
  }

  /**
   * Export dependency graph to DOT format
   */
  exportGraphToDot(): string {
    return this.graphBuilder.toDot();
  }

  /**
   * Get statistics about the codebase
   */
  getStatistics() {
    const totalFiles = this.parseResults.size;
    const totalSymbols = this.getTotalSymbolCount();
    const totalDependencies = this.getTotalDependencyCount();
    const circularDeps = this.findCircularDependencies().length;
    const hubs = this.getHubs(5);
    const highRiskFiles = this.findHighRiskFiles(10);

    const symbolsByKind = new Map<SymbolKind, number>();
    for (const result of this.parseResults.values()) {
      for (const symbol of result.symbols) {
        symbolsByKind.set(
          symbol.kind,
          (symbolsByKind.get(symbol.kind) || 0) + 1
        );
      }
    }

    return {
      files: {
        total: totalFiles,
        withErrors: Array.from(this.parseResults.values()).filter(
          r => r.errors.length > 0
        ).length
      },
      symbols: {
        total: totalSymbols,
        byKind: Object.fromEntries(symbolsByKind)
      },
      dependencies: {
        total: totalDependencies,
        circular: circularDeps
      },
      quality: {
        hubs: hubs.length,
        highRiskFiles: highRiskFiles.length,
        averageComplexity: this.calculateAverageComplexity()
      }
    };
  }

  /**
   * Get total symbol count
   */
  private getTotalSymbolCount(): number {
    let count = 0;
    for (const result of this.parseResults.values()) {
      count += result.symbols.length;
    }
    return count;
  }

  /**
   * Get total dependency count
   */
  private getTotalDependencyCount(): number {
    let count = 0;
    for (const result of this.parseResults.values()) {
      count += result.dependencies.length;
    }
    return count;
  }

  /**
   * Calculate average complexity across all files
   */
  private calculateAverageComplexity(): number {
    let totalComplexity = 0;
    let fileCount = 0;

    for (const [filePath] of this.parseResults) {
      const metrics = this.graphBuilder.getFileMetrics(filePath);
      totalComplexity += metrics.complexity;
      fileCount++;
    }

    return fileCount > 0 ? totalComplexity / fileCount : 0;
  }

  /**
   * Get the dependency graph
   */
  getDependencyGraph(): DependencyGraph | undefined {
    return this.dependencyGraph;
  }

  /**
   * Get all parse results
   */
  getParseResults(): Map<string, ParseResult> {
    return this.parseResults;
  }

  /**
   * Refresh analysis for specific files
   */
  async refreshFiles(filePaths: string[]): Promise<void> {
    const results = await this.parser.parseFiles(filePaths);
    
    for (const result of results) {
      this.parseResults.set(result.filePath, result);
    }

    // Rebuild dependency graph
    this.dependencyGraph = this.graphBuilder.buildGraph(
      Array.from(this.parseResults.values())
    );
  }
}

// Made with Bob
