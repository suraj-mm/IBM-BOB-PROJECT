/**
 * Basic Usage Example for Code Intelligence Engine
 */

import { CodeIntelligence, SymbolKind } from '../src';

async function main() {
  console.log('🚀 Code Intelligence Engine - Basic Usage Example\n');

  // 1. Initialize the engine
  console.log('1️⃣ Initializing Code Intelligence...');
  const intelligence = new CodeIntelligence({
    rootDir: process.cwd(),
    language: 'typescript',
    options: {
      includeTests: false,
      includeNodeModules: false,
      filePatterns: ['src/**/*.ts'],
      excludePatterns: ['**/*.test.ts', '**/*.spec.ts']
    }
  });

  await intelligence.initialize();
  console.log('✅ Initialized!\n');

  // 2. Get codebase statistics
  console.log('2️⃣ Codebase Statistics:');
  const stats = intelligence.getStatistics();
  console.log(`   📁 Files: ${stats.files.total}`);
  console.log(`   🔤 Symbols: ${stats.symbols.total}`);
  console.log(`   🔗 Dependencies: ${stats.dependencies.total}`);
  console.log(`   ⚠️  Circular Dependencies: ${stats.dependencies.circular}`);
  console.log(`   📊 Average Complexity: ${stats.quality.averageComplexity.toFixed(2)}\n`);

  // 3. Query symbols
  console.log('3️⃣ Querying Symbols:');
  const classSymbols = intelligence.querySymbols('.*', SymbolKind.Class);
  console.log(`   Found ${classSymbols.symbols.length} classes`);
  
  if (classSymbols.symbols.length > 0) {
    console.log(`   Example: ${classSymbols.symbols[0].name} at ${classSymbols.symbols[0].location.filePath}:${classSymbols.symbols[0].location.line}\n`);
  }

  // 4. Find circular dependencies
  console.log('4️⃣ Circular Dependencies:');
  const cycles = intelligence.findCircularDependencies();
  if (cycles.length > 0) {
    console.log(`   ⚠️  Found ${cycles.length} circular dependencies!`);
    cycles.slice(0, 3).forEach((cycle, i) => {
      console.log(`   ${i + 1}. ${cycle.join(' → ')}`);
    });
  } else {
    console.log('   ✅ No circular dependencies found!');
  }
  console.log();

  // 5. Analyze impact of changes
  console.log('5️⃣ Impact Analysis:');
  const files = Array.from(intelligence.getParseResults().keys());
  if (files.length > 0) {
    const impact = intelligence.analyzeImpact([files[0]]);
    console.log(`   Changed: ${impact.changedFiles.length} file(s)`);
    console.log(`   Affected: ${impact.affectedFiles.length} file(s)`);
    console.log(`   Impact Score: ${impact.impactScore.toFixed(2)}`);
    
    if (impact.recommendations.length > 0) {
      console.log(`   Recommendations:`);
      impact.recommendations.slice(0, 3).forEach(rec => {
        console.log(`     - ${rec}`);
      });
    }
  }
  console.log();

  // 6. Find high-risk files
  console.log('6️⃣ High-Risk Files:');
  const highRisk = intelligence.findHighRiskFiles(10);
  if (highRisk.length > 0) {
    console.log(`   Found ${highRisk.length} high-risk files:`);
    highRisk.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.file}`);
      console.log(`      Risk: ${item.risk.toFixed(1)} - ${item.reason}`);
    });
  } else {
    console.log('   ✅ No high-risk files found!');
  }
  console.log();

  // 7. Get refactoring suggestions
  console.log('7️⃣ Refactoring Suggestions:');
  const suggestions = intelligence.getRefactoringSuggestions();
  if (suggestions.length > 0) {
    console.log(`   Found ${suggestions.length} suggestions:`);
    suggestions.slice(0, 5).forEach((suggestion, i) => {
      console.log(`   ${i + 1}. [${suggestion.priority.toUpperCase()}] ${suggestion.type}`);
      console.log(`      ${suggestion.reason}`);
      console.log(`      Files: ${suggestion.files.join(', ')}`);
    });
  } else {
    console.log('   ✅ No refactoring suggestions - code looks good!');
  }
  console.log();

  // 8. Get hub files (most connected)
  console.log('8️⃣ Hub Files (Most Connected):');
  const hubs = intelligence.getHubs(5);
  if (hubs.length > 0) {
    hubs.forEach((hub, i) => {
      console.log(`   ${i + 1}. ${hub.file}`);
      console.log(`      Connections: ${hub.connections}`);
    });
  }
  console.log();

  // 9. Calculate blast radius
  console.log('9️⃣ Blast Radius Analysis:');
  if (files.length > 0) {
    const blastRadius = intelligence.calculateBlastRadius(files[0]);
    console.log(`   File: ${files[0]}`);
    console.log(`   Blast Radius: ${blastRadius.radius} levels`);
    console.log(`   Affected Layers:`);
    blastRadius.affectedLayers.forEach((layer, distance) => {
      console.log(`     Level ${distance}: ${layer.length} file(s)`);
    });
  }
  console.log();

  // 10. Export dependency graph
  console.log('🔟 Exporting Dependency Graph:');
  const dot = intelligence.exportGraphToDot();
  console.log(`   Graph exported (${dot.length} characters)`);
  console.log('   You can visualize this using Graphviz or online tools like https://dreampuf.github.io/GraphvizOnline/\n');

  console.log('✨ Example completed successfully!');
}

// Run the example
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

// Made with Bob
