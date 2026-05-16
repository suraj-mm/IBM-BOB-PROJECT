/**
 * Intelligence Engine - Main Orchestrator
 * 
 * Coordinates all modules to provide the complete intelligence flow:
 * 1. Parse code changes
 * 2. Detect changes
 * 3. Build dependency graph
 * 4. Analyze impact
 * 5. Emit events
 */

import { ASTParser } from '../parser/ast-parser';
import { DependencyAnalyzer } from '../parser/dependency-analyzer';
import { ApiExtractor } from '../contracts/api-extractor';
import { ChangeDetector } from '../parser/change-detector';
import { Neo4jClient } from '../graph/neo4j-client';
import { GraphBuilder } from '../graph/graph-builder';
import { ImpactAnalyzer } from '../impact/impact-analyzer';
import { EventEmitter } from '../events/event-emitter';
import {
  AnalyzeRequest,
  AnalyzeResponse,
  AnalysisSummary,
  ParsedFile,
  IntelligenceEvent,
  EngineConfig,
} from '../types';
import { logger } from '../utils/logger';
import { getTypeScriptFiles, normalizePath } from '../utils/file-utils';

export class IntelligenceEngine {
  private astParser: ASTParser;
  private dependencyAnalyzer: DependencyAnalyzer;
  private apiExtractor: ApiExtractor;
  private changeDetector: ChangeDetector;
  private neo4jClient: Neo4jClient;
  private graphBuilder: GraphBuilder;
  private impactAnalyzer: ImpactAnalyzer;
  private eventEmitter: EventEmitter;
  private config: EngineConfig;
  private isInitialized: boolean = false;

  constructor(config: EngineConfig) {
    this.config = config;

    // Initialize all modules
    this.astParser = new ASTParser();
    this.dependencyAnalyzer = new DependencyAnalyzer(config.repoPath);
    this.apiExtractor = new ApiExtractor();
    this.changeDetector = new ChangeDetector(config.repoPath);
    this.neo4jClient = new Neo4jClient(
      config.neo4jUri,
      config.neo4jUser,
      config.neo4jPassword
    );
    this.graphBuilder = new GraphBuilder(this.neo4jClient);
    this.impactAnalyzer = new ImpactAnalyzer(this.graphBuilder, this.dependencyAnalyzer);
    this.eventEmitter = new EventEmitter();

    logger.info('Intelligence Engine initialized');
  }

  /**
   * Initialize the engine (connect to databases, build initial graph)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Engine already initialized');
      return;
    }

    try {
      logger.info('Initializing Intelligence Engine...');

      // Connect to Neo4j
      await this.neo4jClient.connect();
      await this.neo4jClient.createIndexes();

      // Build initial dependency graph
      await this.buildInitialGraph();

      this.isInitialized = true;
      logger.info('Intelligence Engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Intelligence Engine', error);
      throw error;
    }
  }

  /**
   * Build the initial dependency graph from the entire codebase
   */
  private async buildInitialGraph(): Promise<void> {
    logger.info('Building initial dependency graph...');

    // Get all TypeScript files in the repo
    const files = getTypeScriptFiles(this.config.repoPath);
    logger.info(`Found ${files.length} TypeScript files`);

    // Parse all files
    const parsedFiles = this.astParser.parseFiles(files);
    logger.info(`Parsed ${parsedFiles.length} files`);

    // Extract API routes
    for (const parsedFile of parsedFiles) {
      const sourceFile = this.astParser['project'].getSourceFile(parsedFile.filePath);
      if (sourceFile) {
        parsedFile.apiRoutes = this.apiExtractor.extractApiRoutes(sourceFile);
      }
    }

    // Analyze dependencies
    this.dependencyAnalyzer.addParsedFiles(parsedFiles);
    const dependencies = this.dependencyAnalyzer.analyzeDependencies();

    // Build graph in Neo4j
    await this.graphBuilder.buildGraph(parsedFiles, dependencies);

    logger.info('Initial dependency graph built successfully');
  }

  /**
   * Analyze code changes and emit intelligence events
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResponse> {
    if (!this.isInitialized) {
      throw new Error('Engine not initialized. Call initialize() first.');
    }

    logger.info('Starting analysis', { repo: request.repo, files: request.changedFiles.length });

    try {
      const allEvents: IntelligenceEvent[] = [];
      const changedFilesData = new Map();

      // Process each changed file
      for (const changedFile of request.changedFiles) {
        const filePath = normalizePath(`${this.config.repoPath}/${changedFile}`);

        // Parse the new version of the file
        const newParsedFile = this.astParser.parseFile(filePath);
        if (!newParsedFile) {
          logger.warn(`Could not parse file: ${filePath}`);
          continue;
        }

        // Extract API routes
        const sourceFile = this.astParser['project'].getSourceFile(filePath);
        if (sourceFile) {
          newParsedFile.apiRoutes = this.apiExtractor.extractApiRoutes(sourceFile);
        }

        // Get the old version from git (if available)
        let oldParsedFile: ParsedFile | null = null;
        if (request.branch) {
          const oldContent = await this.changeDetector.getFileAtCommit(
            changedFile,
            request.branch
          );
          if (oldContent) {
            // Parse old content (simplified - in production, you'd write to temp file)
            // For now, we'll detect changes by comparing with current state
          }
        }

        // Detect changes
        const changes = oldParsedFile
          ? this.changeDetector.compareFiles(oldParsedFile, newParsedFile)
          : [];

        // Identify breaking changes
        const breakingChanges = this.changeDetector.identifyBreakingChanges(changes);

        // Store for impact analysis
        changedFilesData.set(filePath, { changes, breakingChanges });
      }

      // Analyze impact for all changed files
      const impactAnalyses = await this.impactAnalyzer.analyzeMultipleFiles(changedFilesData);

      // Emit events for each analysis
      for (const analysis of impactAnalyses) {
        const events = await this.eventEmitter.emitFromImpactAnalysis(analysis, {
          repo: request.repo,
          branch: request.branch,
          changedFiles: request.changedFiles,
        });
        allEvents.push(...events);
      }

      // Generate summary
      const summary = this.generateSummary(impactAnalyses);

      const response: AnalyzeResponse = {
        success: true,
        analysisId: this.generateAnalysisId(),
        events: allEvents,
        summary,
      };

      logger.info('Analysis complete', {
        analysisId: response.analysisId,
        eventsEmitted: allEvents.length,
      });

      return response;
    } catch (error) {
      logger.error('Error during analysis', error);
      throw error;
    }
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(analyses: any[]): AnalysisSummary {
    const impactSummary = this.impactAnalyzer.getImpactSummary(analyses);

    return {
      totalChanges: impactSummary.totalChanges,
      breakingChanges: impactSummary.totalBreakingChanges,
      affectedFiles: impactSummary.totalAffectedFiles,
      highSeverityIssues: impactSummary.criticalIssues,
    };
  }

  /**
   * Generate a unique analysis ID
   */
  private generateAnalysisId(): string {
    return `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Rebuild the dependency graph (useful after major changes)
   */
  async rebuildGraph(): Promise<void> {
    logger.info('Rebuilding dependency graph...');

    // Clear existing graph
    await this.neo4jClient.clearDatabase();

    // Clear parser cache
    this.astParser.clearCache();
    this.dependencyAnalyzer.clear();

    // Rebuild
    await this.buildInitialGraph();

    logger.info('Dependency graph rebuilt successfully');
  }

  /**
   * Get dependency statistics
   */
  async getStats(): Promise<any> {
    return await this.graphBuilder.getDependencyStats();
  }

  /**
   * Find circular dependencies
   */
  async findCircularDependencies(): Promise<string[][]> {
    return await this.graphBuilder.findCircularDependencies();
  }

  /**
   * Register an event listener
   */
  onEvent(eventType: any, listener: any): void {
    this.eventEmitter.on(eventType, listener);
  }

  /**
   * Shutdown the engine
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Intelligence Engine...');

    await this.neo4jClient.close();
    this.eventEmitter.clearAllListeners();

    this.isInitialized = false;
    logger.info('Intelligence Engine shut down');
  }
}

// Made with Bob
