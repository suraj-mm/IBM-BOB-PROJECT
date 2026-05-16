#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import * as path from 'path';
import * as fs from 'fs';
import { CodeIntelligence } from './core/CodeIntelligence';
import { CodeIntelligenceConfig, SymbolKind } from './types';

const program = new Command();

program
  .name('code-intel')
  .description('Production-grade Code Intelligence Platform for AI-powered autonomous development')
  .version('1.0.0');

/**
 * Initialize command
 */
program
  .command('init')
  .description('Initialize code intelligence for the current project')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .option('--no-tests', 'Exclude test files from analysis')
  .action(async (options) => {
    const spinner = ora('Initializing code intelligence...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {
          includeTests: options.tests,
          includeNodeModules: false
        }
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      spinner.succeed('Code intelligence initialized successfully!');

      // Show statistics
      const stats = intelligence.getStatistics();
      console.log('\n' + chalk.bold('📊 Codebase Statistics:'));
      console.log(chalk.cyan(`  Files: ${stats.files.total}`));
      console.log(chalk.cyan(`  Symbols: ${stats.symbols.total}`));
      console.log(chalk.cyan(`  Dependencies: ${stats.dependencies.total}`));
      
      if (stats.dependencies.circular > 0) {
        console.log(chalk.yellow(`  ⚠️  Circular dependencies: ${stats.dependencies.circular}`));
      }

      console.log(chalk.cyan(`  Average complexity: ${stats.quality.averageComplexity.toFixed(2)}`));
    } catch (error) {
      spinner.fail('Failed to initialize code intelligence');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Analyze command
 */
program
  .command('analyze <files...>')
  .description('Analyze impact of changes to specific files')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .action(async (files, options) => {
    const spinner = ora('Analyzing impact...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const absoluteFiles = files.map((f: string) => path.resolve(f));
      const impact = intelligence.analyzeImpact(absoluteFiles);

      spinner.succeed('Impact analysis complete!');

      console.log('\n' + chalk.bold('🎯 Impact Analysis:'));
      console.log(chalk.cyan(`  Changed files: ${impact.changedFiles.length}`));
      console.log(chalk.cyan(`  Affected files: ${impact.affectedFiles.length}`));
      console.log(chalk.cyan(`  Impact score: ${impact.impactScore.toFixed(2)}`));

      if (impact.criticalPaths.length > 0) {
        console.log('\n' + chalk.bold('🔥 Critical Paths:'));
        impact.criticalPaths.forEach((path, i) => {
          console.log(chalk.yellow(`  ${i + 1}. ${path.join(' → ')}`));
        });
      }

      if (impact.recommendations.length > 0) {
        console.log('\n' + chalk.bold('💡 Recommendations:'));
        impact.recommendations.forEach(rec => {
          console.log(`  ${rec}`);
        });
      }
    } catch (error) {
      spinner.fail('Failed to analyze impact');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Query command
 */
program
  .command('query <pattern>')
  .description('Query symbols by name pattern')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .option('-k, --kind <kind>', 'Filter by symbol kind (function, class, interface, etc.)')
  .action(async (pattern, options) => {
    const spinner = ora('Searching symbols...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const kind = options.kind as SymbolKind | undefined;
      const result = intelligence.querySymbols(pattern, kind);

      spinner.succeed(`Found ${result.symbols.length} symbols`);

      if (result.symbols.length > 0) {
        const data = [
          ['Name', 'Kind', 'File', 'Line']
        ];

        result.symbols.slice(0, 50).forEach(symbol => {
          data.push([
            chalk.cyan(symbol.name),
            chalk.yellow(symbol.kind),
            path.relative(process.cwd(), symbol.location.filePath),
            symbol.location.line.toString()
          ]);
        });

        console.log('\n' + table(data));

        if (result.symbols.length > 50) {
          console.log(chalk.gray(`... and ${result.symbols.length - 50} more results`));
        }
      }
    } catch (error) {
      spinner.fail('Failed to query symbols');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Dependencies command
 */
program
  .command('deps <file>')
  .description('Show dependencies of a file')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .option('-t, --transitive', 'Show transitive dependencies')
  .action(async (file, options) => {
    const spinner = ora('Analyzing dependencies...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const absoluteFile = path.resolve(file);
      const deps = intelligence.getFileDependencies(absoluteFile);

      spinner.succeed(`Found ${deps.length} dependencies`);

      if (deps.length > 0) {
        console.log('\n' + chalk.bold('📦 Dependencies:'));
        deps.forEach(dep => {
          console.log(chalk.cyan(`  → ${dep}`));
        });
      } else {
        console.log(chalk.gray('  No dependencies found'));
      }
    } catch (error) {
      spinner.fail('Failed to analyze dependencies');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Circular dependencies command
 */
program
  .command('circular')
  .description('Find circular dependencies')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .action(async (options) => {
    const spinner = ora('Searching for circular dependencies...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const cycles = intelligence.findCircularDependencies();

      if (cycles.length > 0) {
        spinner.warn(`Found ${cycles.length} circular dependencies!`);

        console.log('\n' + chalk.bold.red('⚠️  Circular Dependencies:'));
        cycles.forEach((cycle, i) => {
          console.log(chalk.yellow(`\n  ${i + 1}. ${cycle.join(' → ')}`));
        });
      } else {
        spinner.succeed('No circular dependencies found!');
      }
    } catch (error) {
      spinner.fail('Failed to find circular dependencies');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Risk analysis command
 */
program
  .command('risk')
  .description('Find high-risk files')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .action(async (options) => {
    const spinner = ora('Analyzing risk...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const highRisk = intelligence.findHighRiskFiles(10);
      const limit = parseInt(options.limit);

      spinner.succeed(`Found ${highRisk.length} high-risk files`);

      if (highRisk.length > 0) {
        const data = [
          ['File', 'Risk Score', 'Reason']
        ];

        highRisk.slice(0, limit).forEach(item => {
          data.push([
            chalk.cyan(path.relative(process.cwd(), item.file)),
            chalk.red(item.risk.toFixed(1)),
            chalk.yellow(item.reason)
          ]);
        });

        console.log('\n' + table(data));
      }
    } catch (error) {
      spinner.fail('Failed to analyze risk');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Refactor suggestions command
 */
program
  .command('refactor')
  .description('Get refactoring suggestions')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .action(async (options) => {
    const spinner = ora('Analyzing codebase...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const suggestions = intelligence.getRefactoringSuggestions();

      spinner.succeed(`Found ${suggestions.length} refactoring opportunities`);

      if (suggestions.length > 0) {
        console.log('\n' + chalk.bold('🔧 Refactoring Suggestions:'));
        
        suggestions.forEach((suggestion, i) => {
          const priorityColor = 
            suggestion.priority === 'high' ? chalk.red :
            suggestion.priority === 'medium' ? chalk.yellow :
            chalk.gray;

          console.log(`\n  ${i + 1}. ${chalk.bold(suggestion.type)} ${priorityColor(`[${suggestion.priority}]`)}`);
          console.log(`     ${chalk.gray(suggestion.reason)}`);
          console.log(`     Files: ${chalk.cyan(suggestion.files.join(', '))}`);
        });
      }
    } catch (error) {
      spinner.fail('Failed to generate refactoring suggestions');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

/**
 * Stats command
 */
program
  .command('stats')
  .description('Show codebase statistics')
  .option('-r, --root <path>', 'Root directory of the project', process.cwd())
  .action(async (options) => {
    const spinner = ora('Gathering statistics...').start();

    try {
      const config: CodeIntelligenceConfig = {
        rootDir: path.resolve(options.root),
        language: 'typescript',
        options: {}
      };

      const intelligence = new CodeIntelligence(config);
      await intelligence.initialize();

      const stats = intelligence.getStatistics();

      spinner.succeed('Statistics gathered');

      console.log('\n' + chalk.bold('📊 Codebase Statistics:'));
      console.log(chalk.cyan(`\n  Files:`));
      console.log(`    Total: ${stats.files.total}`);
      console.log(`    With errors: ${stats.files.withErrors}`);

      console.log(chalk.cyan(`\n  Symbols:`));
      console.log(`    Total: ${stats.symbols.total}`);
      console.log(`    By kind:`);
      Object.entries(stats.symbols.byKind).forEach(([kind, count]) => {
        console.log(`      ${kind}: ${count}`);
      });

      console.log(chalk.cyan(`\n  Dependencies:`));
      console.log(`    Total: ${stats.dependencies.total}`);
      console.log(`    Circular: ${stats.dependencies.circular}`);

      console.log(chalk.cyan(`\n  Quality Metrics:`));
      console.log(`    Hub files: ${stats.quality.hubs}`);
      console.log(`    High-risk files: ${stats.quality.highRiskFiles}`);
      console.log(`    Average complexity: ${stats.quality.averageComplexity.toFixed(2)}`);
    } catch (error) {
      spinner.fail('Failed to gather statistics');
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });

program.parse();

// Made with Bob
