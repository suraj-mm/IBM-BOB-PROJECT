/**
 * Impact Analyzer Module
 * 
 * Main responsibility: Determine affected files/modules/developers when code changes.
 * 
 * This is the core intelligence engine that:
 * - Takes code changes as input
 * - Uses dependency graph to find affected files
 * - Evaluates impact severity
 * - Identifies breaking changes
 * - Generates impact reports
 */

import { GraphBuilder } from '../graph/graph-builder';
import { DependencyAnalyzer } from '../parser/dependency-analyzer';
import {
  CodeChange,
  BreakingChange,
  ImpactAnalysis,
  AffectedFile,
  ParsedFile,
} from '../types';
import { logger } from '../utils/logger';
import { normalizePath } from '../utils/file-utils';

export class ImpactAnalyzer {
  private graphBuilder: GraphBuilder;
  private dependencyAnalyzer: DependencyAnalyzer;

  constructor(graphBuilder: GraphBuilder, dependencyAnalyzer: DependencyAnalyzer) {
    this.graphBuilder = graphBuilder;
    this.dependencyAnalyzer = dependencyAnalyzer;
  }

  /**
   * Analyze the impact of changes to a file
   */
  async analyzeImpact(
    changedFile: string,
    changes: CodeChange[],
    breakingChanges: BreakingChange[]
  ): Promise<ImpactAnalysis> {
    logger.info(`Analyzing impact for file: ${changedFile}`);

    const normalizedPath = normalizePath(changedFile);

    // Find all affected files using the dependency graph
    const affectedFiles = await this.findAffectedFiles(normalizedPath, changes);

    // Calculate impact score
    const impactScore = this.calculateImpactScore(changes, breakingChanges, affectedFiles);

    const analysis: ImpactAnalysis = {
      changedFile: normalizedPath,
      changes,
      affectedFiles,
      breakingChanges,
      impactScore,
    };

    logger.info(`Impact analysis complete for ${changedFile}`, {
      affectedFilesCount: affectedFiles.length,
      breakingChangesCount: breakingChanges.length,
      impactScore,
    });

    return analysis;
  }

  /**
   * Find all files affected by changes
   */
  private async findAffectedFiles(
    changedFile: string,
    changes: CodeChange[]
  ): Promise<AffectedFile[]> {
    const affectedFiles: AffectedFile[] = [];
    const processedFiles = new Set<string>();

    // Find direct dependents from the graph
    const directDependents = await this.graphBuilder.findDirectDependents(changedFile);

    for (const dependent of directDependents) {
      if (processedFiles.has(dependent)) continue;
      processedFiles.add(dependent);

      const affectedSymbols = this.findAffectedSymbolsInFile(dependent, changes);

      affectedFiles.push({
        filePath: dependent,
        reason: 'Direct import dependency',
        impactType: 'direct',
        affectedSymbols,
      });
    }

    // Find transitive dependents (files that depend on direct dependents)
    const transitiveDependents = await this.graphBuilder.findAllAffectedFiles(changedFile, 3);

    for (const dependent of transitiveDependents) {
      if (processedFiles.has(dependent)) continue;
      processedFiles.add(dependent);

      affectedFiles.push({
        filePath: dependent,
        reason: 'Transitive dependency',
        impactType: 'indirect',
        affectedSymbols: [],
      });
    }

    // Check for API consumers if the file contains API routes
    const apiRoutes = await this.graphBuilder.findApiRoutesInFile(changedFile);
    if (apiRoutes.length > 0) {
      for (const route of apiRoutes) {
        const consumers = await this.graphBuilder.findApiConsumers(route.method, route.path);
        for (const consumer of consumers) {
          if (processedFiles.has(consumer)) continue;
          processedFiles.add(consumer);

          affectedFiles.push({
            filePath: consumer,
            reason: `Consumes API: ${route.method} ${route.path}`,
            impactType: 'direct',
            affectedSymbols: [`${route.method} ${route.path}`],
          });
        }
      }
    }

    return affectedFiles;
  }

  /**
   * Find which symbols in a dependent file are affected by changes
   */
  private findAffectedSymbolsInFile(
    dependentFile: string,
    changes: CodeChange[]
  ): string[] {
    const affectedSymbols: string[] = [];

    // Get the imports from the dependent file
    const dependencies = this.dependencyAnalyzer.findDependencies(dependentFile);

    for (const change of changes) {
      // Check if the change affects an exported symbol
      if (this.isExportedSymbol(change)) {
        affectedSymbols.push(change.affectedSymbol);
      }
    }

    return affectedSymbols;
  }

  /**
   * Check if a change affects an exported symbol
   */
  private isExportedSymbol(change: CodeChange): boolean {
    // Function, class, interface removals/modifications are typically exported
    const exportedChangeTypes = [
      'function-removed',
      'function-modified',
      'class-removed',
      'class-modified',
      'interface-property-removed',
      'interface-property-type-changed',
      'api-route-removed',
      'api-route-modified',
    ];

    return exportedChangeTypes.includes(change.changeType);
  }

  /**
   * Calculate impact score (0-100)
   */
  private calculateImpactScore(
    changes: CodeChange[],
    breakingChanges: BreakingChange[],
    affectedFiles: AffectedFile[]
  ): number {
    let score = 0;

    // Base score from number of changes
    score += Math.min(changes.length * 5, 30);

    // Add score for breaking changes
    for (const breakingChange of breakingChanges) {
      switch (breakingChange.severity) {
        case 'critical':
          score += 20;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 10;
          break;
        case 'low':
          score += 5;
          break;
      }
    }

    // Add score based on number of affected files
    score += Math.min(affectedFiles.length * 3, 30);

    // Add extra score for direct impacts
    const directImpacts = affectedFiles.filter((f) => f.impactType === 'direct').length;
    score += Math.min(directImpacts * 2, 20);

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Analyze multiple files at once
   */
  async analyzeMultipleFiles(
    changedFiles: Map<string, { changes: CodeChange[]; breakingChanges: BreakingChange[] }>
  ): Promise<ImpactAnalysis[]> {
    const analyses: ImpactAnalysis[] = [];

    for (const [file, data] of changedFiles) {
      const analysis = await this.analyzeImpact(file, data.changes, data.breakingChanges);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Get impact summary across multiple analyses
   */
  getImpactSummary(analyses: ImpactAnalysis[]): ImpactSummary {
    const allAffectedFiles = new Set<string>();
    let totalBreakingChanges = 0;
    let totalChanges = 0;
    let highestImpactScore = 0;
    let criticalIssues = 0;

    for (const analysis of analyses) {
      // Collect unique affected files
      analysis.affectedFiles.forEach((f) => allAffectedFiles.add(f.filePath));

      // Count breaking changes
      totalBreakingChanges += analysis.breakingChanges.length;

      // Count total changes
      totalChanges += analysis.changes.length;

      // Track highest impact score
      highestImpactScore = Math.max(highestImpactScore, analysis.impactScore);

      // Count critical issues
      criticalIssues += analysis.breakingChanges.filter(
        (bc) => bc.severity === 'critical'
      ).length;
    }

    return {
      totalChangedFiles: analyses.length,
      totalAffectedFiles: allAffectedFiles.size,
      totalChanges,
      totalBreakingChanges,
      highestImpactScore,
      criticalIssues,
      averageImpactScore:
        analyses.length > 0
          ? analyses.reduce((sum, a) => sum + a.impactScore, 0) / analyses.length
          : 0,
    };
  }

  /**
   * Prioritize affected files by impact
   */
  prioritizeAffectedFiles(affectedFiles: AffectedFile[]): AffectedFile[] {
    return affectedFiles.sort((a, b) => {
      // Direct impacts first
      if (a.impactType === 'direct' && b.impactType !== 'direct') return -1;
      if (a.impactType !== 'direct' && b.impactType === 'direct') return 1;

      // More affected symbols = higher priority
      return b.affectedSymbols.length - a.affectedSymbols.length;
    });
  }

  /**
   * Generate recommendations based on impact analysis
   */
  generateRecommendations(analysis: ImpactAnalysis): string[] {
    const recommendations: string[] = [];

    // High impact score
    if (analysis.impactScore > 70) {
      recommendations.push(
        'High impact detected. Consider breaking this change into smaller increments.'
      );
    }

    // Many affected files
    if (analysis.affectedFiles.length > 10) {
      recommendations.push(
        `This change affects ${analysis.affectedFiles.length} files. Coordinate with affected teams.`
      );
    }

    // Critical breaking changes
    const criticalChanges = analysis.breakingChanges.filter((bc) => bc.severity === 'critical');
    if (criticalChanges.length > 0) {
      recommendations.push(
        `${criticalChanges.length} critical breaking change(s) detected. Review API contracts carefully.`
      );
    }

    // API changes
    const apiChanges = analysis.changes.filter((c) =>
      c.changeType.includes('api-route')
    );
    if (apiChanges.length > 0) {
      recommendations.push(
        'API changes detected. Update API documentation and notify consumers.'
      );
    }

    // Interface changes
    const interfaceChanges = analysis.changes.filter((c) =>
      c.changeType.includes('interface')
    );
    if (interfaceChanges.length > 0) {
      recommendations.push(
        'Interface changes detected. Ensure all implementations are updated.'
      );
    }

    return recommendations;
  }
}

/**
 * Impact summary across multiple analyses
 */
export interface ImpactSummary {
  totalChangedFiles: number;
  totalAffectedFiles: number;
  totalChanges: number;
  totalBreakingChanges: number;
  highestImpactScore: number;
  criticalIssues: number;
  averageImpactScore: number;
}

// Made with Bob
