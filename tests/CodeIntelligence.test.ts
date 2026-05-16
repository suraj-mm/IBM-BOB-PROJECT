import { describe, it, expect, beforeAll } from 'vitest';
import { CodeIntelligence } from '../src/core/CodeIntelligence';
import { CodeIntelligenceConfig, SymbolKind } from '../src/types';
import * as path from 'path';

describe('CodeIntelligence', () => {
  let intelligence: CodeIntelligence;
  const testProjectRoot = path.join(__dirname, 'fixtures');

  beforeAll(async () => {
    const config: CodeIntelligenceConfig = {
      rootDir: testProjectRoot,
      language: 'typescript',
      options: {
        includeTests: false,
        includeNodeModules: false
      }
    };

    intelligence = new CodeIntelligence(config);
    await intelligence.initialize();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(intelligence).toBeDefined();
    });

    it('should have parse results', () => {
      const results = intelligence.getParseResults();
      expect(results.size).toBeGreaterThan(0);
    });

    it('should have dependency graph', () => {
      const graph = intelligence.getDependencyGraph();
      expect(graph).toBeDefined();
      expect(graph?.nodes.size).toBeGreaterThan(0);
    });
  });

  describe('symbol queries', () => {
    it('should find symbols by name pattern', () => {
      const result = intelligence.querySymbols('test');
      expect(result.symbols).toBeDefined();
      expect(Array.isArray(result.symbols)).toBe(true);
    });

    it('should filter symbols by kind', () => {
      const result = intelligence.querySymbols('.*', SymbolKind.Function);
      expect(result.symbols.every(s => s.kind === SymbolKind.Function)).toBe(true);
    });

    it('should find references to a symbol', () => {
      const references = intelligence.findReferences('testFunction');
      expect(Array.isArray(references)).toBe(true);
    });
  });

  describe('dependency analysis', () => {
    it('should get file dependencies', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length > 0) {
        const deps = intelligence.getFileDependencies(files[0]);
        expect(Array.isArray(deps)).toBe(true);
      }
    });

    it('should get file dependents', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length > 0) {
        const dependents = intelligence.getFileDependents(files[0]);
        expect(Array.isArray(dependents)).toBe(true);
      }
    });

    it('should find circular dependencies', () => {
      const cycles = intelligence.findCircularDependencies();
      expect(Array.isArray(cycles)).toBe(true);
    });
  });

  describe('impact analysis', () => {
    it('should analyze impact of file changes', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length > 0) {
        const impact = intelligence.analyzeImpact([files[0]]);
        expect(impact).toBeDefined();
        expect(impact.changedFiles).toEqual([files[0]]);
        expect(Array.isArray(impact.affectedFiles)).toBe(true);
        expect(typeof impact.impactScore).toBe('number');
        expect(Array.isArray(impact.recommendations)).toBe(true);
      }
    });

    it('should analyze new dependency impact', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length >= 2) {
        const impact = intelligence.analyzeNewDependency(files[0], files[1]);
        expect(impact).toBeDefined();
        expect(Array.isArray(impact.recommendations)).toBe(true);
      }
    });

    it('should analyze file removal impact', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length > 0) {
        const impact = intelligence.analyzeFileRemoval(files[0]);
        expect(impact).toBeDefined();
        expect(impact.changedFiles).toEqual([files[0]]);
      }
    });
  });

  describe('metrics and statistics', () => {
    it('should get file metrics', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length > 0) {
        const metrics = intelligence.getFileMetrics(files[0]);
        expect(metrics).toBeDefined();
        expect(typeof metrics.inDegree).toBe('number');
        expect(typeof metrics.outDegree).toBe('number');
        expect(typeof metrics.complexity).toBe('number');
      }
    });

    it('should get hub files', () => {
      const hubs = intelligence.getHubs(5);
      expect(Array.isArray(hubs)).toBe(true);
      expect(hubs.length).toBeLessThanOrEqual(5);
    });

    it('should find high-risk files', () => {
      const highRisk = intelligence.findHighRiskFiles(10);
      expect(Array.isArray(highRisk)).toBe(true);
    });

    it('should find safe to modify files', () => {
      const safe = intelligence.findSafeToModify(5);
      expect(Array.isArray(safe)).toBe(true);
    });

    it('should get statistics', () => {
      const stats = intelligence.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.files).toBeDefined();
      expect(stats.symbols).toBeDefined();
      expect(stats.dependencies).toBeDefined();
      expect(stats.quality).toBeDefined();
    });
  });

  describe('refactoring suggestions', () => {
    it('should provide refactoring suggestions', () => {
      const suggestions = intelligence.getRefactoringSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion.type).toBeDefined();
        expect(suggestion.files).toBeDefined();
        expect(suggestion.reason).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(suggestion.priority);
      });
    });
  });

  describe('graph export', () => {
    it('should export graph to DOT format', () => {
      const dot = intelligence.exportGraphToDot();
      expect(typeof dot).toBe('string');
      expect(dot).toContain('digraph DependencyGraph');
    });
  });

  describe('blast radius', () => {
    it('should calculate blast radius', () => {
      const files = Array.from(intelligence.getParseResults().keys());
      if (files.length > 0) {
        const blastRadius = intelligence.calculateBlastRadius(files[0]);
        expect(blastRadius).toBeDefined();
        expect(typeof blastRadius.radius).toBe('number');
        expect(blastRadius.affectedLayers).toBeDefined();
      }
    });
  });
});

// Made with Bob
