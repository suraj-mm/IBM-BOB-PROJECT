import { DependencyGraphBuilder } from '../core/DependencyGraph';
import { ImpactAnalysis, ParseResult } from '../types';

/**
 * Impact Analysis Engine
 * Analyzes the impact of code changes across the codebase
 */
export class ImpactAnalyzer {
  private graphBuilder: DependencyGraphBuilder;

  constructor(graphBuilder: DependencyGraphBuilder) {
    this.graphBuilder = graphBuilder;
  }

  /**
   * Analyze the impact of changes to specific files
   */
  analyzeImpact(changedFiles: string[]): ImpactAnalysis {
    const affectedFiles = new Set<string>();
    const criticalPaths: string[][] = [];
    let totalImpactScore = 0;

    // For each changed file, find all affected files
    for (const file of changedFiles) {
      const dependents = this.graphBuilder.getTransitiveDependents(file);
      dependents.forEach(dep => affectedFiles.add(dep));

      // Calculate impact score for this file
      const metrics = this.graphBuilder.getFileMetrics(file);
      totalImpactScore += metrics.dependentCount * 10 + metrics.complexity;
    }

    // Find critical paths that include changed files
    const allCriticalPaths = this.graphBuilder.findCriticalPaths(20);
    for (const path of allCriticalPaths) {
      if (path.some(file => changedFiles.includes(file))) {
        criticalPaths.push(path);
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      changedFiles,
      Array.from(affectedFiles),
      totalImpactScore
    );

    return {
      changedFiles,
      affectedFiles: Array.from(affectedFiles),
      impactScore: totalImpactScore,
      criticalPaths: criticalPaths.slice(0, 5),
      recommendations
    };
  }

  /**
   * Analyze impact of adding a new dependency
   */
  analyzeNewDependency(sourceFile: string, targetFile: string): ImpactAnalysis {
    // Check if this would create a circular dependency
    const targetDeps = this.graphBuilder.getTransitiveDependencies(targetFile);
    const wouldCreateCycle = targetDeps.includes(sourceFile);

    const recommendations: string[] = [];

    if (wouldCreateCycle) {
      recommendations.push(
        `⚠️ WARNING: Adding dependency from ${sourceFile} to ${targetFile} would create a circular dependency!`
      );
      recommendations.push('Consider refactoring to break the cycle.');
    }

    // Check complexity impact
    const sourceMetrics = this.graphBuilder.getFileMetrics(sourceFile);
    if (sourceMetrics.outDegree > 10) {
      recommendations.push(
        `⚠️ ${sourceFile} already has ${sourceMetrics.outDegree} dependencies. Consider reducing coupling.`
      );
    }

    const targetMetrics = this.graphBuilder.getFileMetrics(targetFile);
    if (targetMetrics.inDegree > 10) {
      recommendations.push(
        `⚠️ ${targetFile} is already depended on by ${targetMetrics.inDegree} files. It may be a bottleneck.`
      );
    }

    return {
      changedFiles: [sourceFile],
      affectedFiles: [targetFile],
      impactScore: wouldCreateCycle ? 100 : targetMetrics.dependentCount,
      criticalPaths: [],
      recommendations
    };
  }

  /**
   * Analyze impact of removing a file
   */
  analyzeFileRemoval(filePath: string): ImpactAnalysis {
    const dependents = this.graphBuilder.getTransitiveDependents(filePath);
    const metrics = this.graphBuilder.getFileMetrics(filePath);

    const recommendations: string[] = [];

    if (dependents.length > 0) {
      recommendations.push(
        `⚠️ WARNING: ${dependents.length} files depend on ${filePath}!`
      );
      recommendations.push('The following files will be affected:');
      dependents.slice(0, 10).forEach(dep => {
        recommendations.push(`  - ${dep}`);
      });

      if (dependents.length > 10) {
        recommendations.push(`  ... and ${dependents.length - 10} more files`);
      }
    } else {
      recommendations.push(`✓ Safe to remove: No files depend on ${filePath}`);
    }

    return {
      changedFiles: [filePath],
      affectedFiles: dependents,
      impactScore: dependents.length * 10 + metrics.complexity,
      criticalPaths: [],
      recommendations
    };
  }

  /**
   * Find files that are safe to modify (low impact)
   */
  findSafeToModify(threshold: number = 5): string[] {
    const safeFiles: string[] = [];
    const graph = this.graphBuilder.getGraph();

    for (const node of graph.nodes()) {
      const metrics = this.graphBuilder.getFileMetrics(node);
      if (metrics.dependentCount <= threshold && metrics.complexity < 20) {
        safeFiles.push(node);
      }
    }

    return safeFiles;
  }

  /**
   * Find high-risk files (high impact if changed)
   */
  findHighRiskFiles(threshold: number = 10): Array<{
    file: string;
    risk: number;
    reason: string;
  }> {
    const highRiskFiles: Array<{ file: string; risk: number; reason: string }> = [];
    const graph = this.graphBuilder.getGraph();

    for (const node of graph.nodes()) {
      const metrics = this.graphBuilder.getFileMetrics(node);
      let risk = 0;
      const reasons: string[] = [];

      if (metrics.dependentCount > threshold) {
        risk += metrics.dependentCount * 2;
        reasons.push(`${metrics.dependentCount} dependents`);
      }

      if (metrics.complexity > 50) {
        risk += metrics.complexity;
        reasons.push(`high complexity (${metrics.complexity.toFixed(1)})`);
      }

      if (metrics.inDegree > 15) {
        risk += metrics.inDegree * 3;
        reasons.push(`${metrics.inDegree} incoming dependencies`);
      }

      if (risk > 0) {
        highRiskFiles.push({
          file: node,
          risk,
          reason: reasons.join(', ')
        });
      }
    }

    return highRiskFiles.sort((a, b) => b.risk - a.risk);
  }

  /**
   * Suggest refactoring opportunities
   */
  suggestRefactoring(): Array<{
    type: string;
    files: string[];
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      type: string;
      files: string[];
      reason: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // Find circular dependencies
    const cycles = this.graphBuilder.findCircularDependencies();
    if (cycles.length > 0) {
      suggestions.push({
        type: 'Break Circular Dependencies',
        files: cycles[0],
        reason: `Found ${cycles.length} circular dependency cycles`,
        priority: 'high'
      });
    }

    // Find files with too many dependencies
    const graph = this.graphBuilder.getGraph();
    for (const node of graph.nodes()) {
      const metrics = this.graphBuilder.getFileMetrics(node);
      
      if (metrics.outDegree > 15) {
        suggestions.push({
          type: 'Reduce Dependencies',
          files: [node],
          reason: `File has ${metrics.outDegree} dependencies (too many)`,
          priority: 'medium'
        });
      }

      if (metrics.inDegree > 20) {
        suggestions.push({
          type: 'Extract Common Code',
          files: [node],
          reason: `File is depended on by ${metrics.inDegree} files (potential bottleneck)`,
          priority: 'high'
        });
      }
    }

    // Find hub files that could be split
    const hubs = this.graphBuilder.getHubs(5);
    for (const hub of hubs) {
      if (hub.connections > 25) {
        suggestions.push({
          type: 'Split Large Module',
          files: [hub.file],
          reason: `File has ${hub.connections} total connections (consider splitting)`,
          priority: 'medium'
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Generate recommendations based on impact analysis
   */
  private generateRecommendations(
    changedFiles: string[],
    affectedFiles: string[],
    impactScore: number
  ): string[] {
    const recommendations: string[] = [];

    // Impact level assessment
    if (impactScore > 100) {
      recommendations.push('🔴 HIGH IMPACT: These changes affect critical parts of the codebase');
      recommendations.push('Recommended actions:');
      recommendations.push('  - Comprehensive testing required');
      recommendations.push('  - Consider breaking changes into smaller PRs');
      recommendations.push('  - Review with senior team members');
    } else if (impactScore > 50) {
      recommendations.push('🟡 MEDIUM IMPACT: These changes have moderate reach');
      recommendations.push('Recommended actions:');
      recommendations.push('  - Test affected modules thoroughly');
      recommendations.push('  - Update relevant documentation');
    } else {
      recommendations.push('🟢 LOW IMPACT: These changes are relatively isolated');
      recommendations.push('Recommended actions:');
      recommendations.push('  - Standard testing procedures apply');
    }

    // Affected files summary
    if (affectedFiles.length > 0) {
      recommendations.push('');
      recommendations.push(`Affected files: ${affectedFiles.length}`);
      if (affectedFiles.length <= 5) {
        affectedFiles.forEach(file => {
          recommendations.push(`  - ${file}`);
        });
      } else {
        affectedFiles.slice(0, 5).forEach(file => {
          recommendations.push(`  - ${file}`);
        });
        recommendations.push(`  ... and ${affectedFiles.length - 5} more files`);
      }
    }

    // Check for high-risk files in the change set
    const highRiskFiles = this.findHighRiskFiles(10);
    const changedHighRisk = highRiskFiles.filter(f => 
      changedFiles.includes(f.file)
    );

    if (changedHighRisk.length > 0) {
      recommendations.push('');
      recommendations.push('⚠️ High-risk files in this change:');
      changedHighRisk.forEach(f => {
        recommendations.push(`  - ${f.file}: ${f.reason}`);
      });
    }

    return recommendations;
  }

  /**
   * Calculate blast radius (maximum impact distance)
   */
  calculateBlastRadius(filePath: string): {
    radius: number;
    affectedLayers: Map<number, string[]>;
  } {
    const affectedLayers = new Map<number, string[]>();
    const visited = new Set<string>();
    const queue: Array<{ file: string; distance: number }> = [
      { file: filePath, distance: 0 }
    ];

    let maxRadius = 0;

    while (queue.length > 0) {
      const { file, distance } = queue.shift()!;

      if (visited.has(file)) {
        continue;
      }

      visited.add(file);
      maxRadius = Math.max(maxRadius, distance);

      if (!affectedLayers.has(distance)) {
        affectedLayers.set(distance, []);
      }
      affectedLayers.get(distance)!.push(file);

      const dependents = this.graphBuilder.getDependents(file);
      for (const dependent of dependents) {
        if (!visited.has(dependent)) {
          queue.push({ file: dependent, distance: distance + 1 });
        }
      }
    }

    return {
      radius: maxRadius,
      affectedLayers
    };
  }
}

// Made with Bob
