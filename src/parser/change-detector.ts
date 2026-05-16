/**
 * Change Detector Module
 * 
 * Compares old vs new code to detect changes.
 * Uses git diff and AST comparison to identify:
 * - Function changes
 * - Interface changes
 * - API route changes
 * - Breaking changes
 */

import simpleGit, { SimpleGit, DiffResult } from 'simple-git';
import {
  CodeChange,
  BreakingChange,
  ParsedFile,
  FunctionDefinition,
  InterfaceDefinition,
  ApiRoute,
  ChangeType,
} from '../types';
import { logger } from '../utils/logger';

export class ChangeDetector {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  /**
   * Get changed files between two commits
   */
  async getChangedFiles(fromCommit: string, toCommit: string = 'HEAD'): Promise<string[]> {
    try {
      const diff: DiffResult = await this.git.diff([
        '--name-only',
        `${fromCommit}..${toCommit}`,
      ]);

      const files = diff.files.map((file) => file.file);
      logger.info(`Found ${files.length} changed files between ${fromCommit} and ${toCommit}`);
      return files;
    } catch (error) {
      logger.error('Error getting changed files from git', error);
      return [];
    }
  }

  /**
   * Get file content at a specific commit
   */
  async getFileAtCommit(filePath: string, commit: string): Promise<string | null> {
    try {
      const content = await this.git.show([`${commit}:${filePath}`]);
      return content;
    } catch (error) {
      logger.error(`Error getting file ${filePath} at commit ${commit}`, error);
      return null;
    }
  }

  /**
   * Compare two parsed files to detect changes
   */
  compareFiles(oldFile: ParsedFile, newFile: ParsedFile): CodeChange[] {
    const changes: CodeChange[] = [];

    // Compare functions
    changes.push(...this.compareFunctions(oldFile, newFile));

    // Compare interfaces
    changes.push(...this.compareInterfaces(oldFile, newFile));

    // Compare API routes
    changes.push(...this.compareApiRoutes(oldFile, newFile));

    // Compare classes
    changes.push(...this.compareClasses(oldFile, newFile));

    logger.debug(`Detected ${changes.length} changes in ${newFile.filePath}`);
    return changes;
  }

  /**
   * Compare functions between old and new files
   */
  private compareFunctions(oldFile: ParsedFile, newFile: ParsedFile): CodeChange[] {
    const changes: CodeChange[] = [];

    // Create maps for quick lookup
    const oldFunctions = new Map(oldFile.functions.map((f) => [f.name, f]));
    const newFunctions = new Map(newFile.functions.map((f) => [f.name, f]));

    // Check for removed functions
    for (const [name, oldFunc] of oldFunctions) {
      if (!newFunctions.has(name)) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'function-removed',
          oldValue: oldFunc,
          affectedSymbol: name,
          lineNumber: oldFunc.lineNumber,
        });
      }
    }

    // Check for added and modified functions
    for (const [name, newFunc] of newFunctions) {
      const oldFunc = oldFunctions.get(name);

      if (!oldFunc) {
        // Function added
        changes.push({
          filePath: newFile.filePath,
          changeType: 'function-added',
          newValue: newFunc,
          affectedSymbol: name,
          lineNumber: newFunc.lineNumber,
        });
      } else {
        // Check for modifications
        const funcChanges = this.compareFunctionSignatures(oldFunc, newFunc, newFile.filePath);
        changes.push(...funcChanges);
      }
    }

    return changes;
  }

  /**
   * Compare function signatures
   */
  private compareFunctionSignatures(
    oldFunc: FunctionDefinition,
    newFunc: FunctionDefinition,
    filePath: string
  ): CodeChange[] {
    const changes: CodeChange[] = [];

    // Check return type change
    if (oldFunc.returnType !== newFunc.returnType) {
      changes.push({
        filePath,
        changeType: 'return-type-changed',
        oldValue: oldFunc.returnType,
        newValue: newFunc.returnType,
        affectedSymbol: newFunc.name,
        lineNumber: newFunc.lineNumber,
      });
    }

    // Check parameter changes
    const paramChanges = this.compareParameters(
      oldFunc.parameters,
      newFunc.parameters,
      filePath,
      newFunc.name,
      newFunc.lineNumber
    );
    changes.push(...paramChanges);

    return changes;
  }

  /**
   * Compare parameters
   */
  private compareParameters(
    oldParams: any[],
    newParams: any[],
    filePath: string,
    symbolName: string,
    lineNumber: number
  ): CodeChange[] {
    const changes: CodeChange[] = [];

    // Check for removed parameters
    for (const oldParam of oldParams) {
      const newParam = newParams.find((p) => p.name === oldParam.name);
      if (!newParam) {
        changes.push({
          filePath,
          changeType: 'parameter-removed',
          oldValue: oldParam,
          affectedSymbol: symbolName,
          lineNumber,
        });
      } else if (oldParam.type !== newParam.type) {
        changes.push({
          filePath,
          changeType: 'parameter-type-changed',
          oldValue: oldParam,
          newValue: newParam,
          affectedSymbol: symbolName,
          lineNumber,
        });
      }
    }

    // Check for added parameters
    for (const newParam of newParams) {
      const oldParam = oldParams.find((p) => p.name === newParam.name);
      if (!oldParam) {
        changes.push({
          filePath,
          changeType: 'parameter-added',
          newValue: newParam,
          affectedSymbol: symbolName,
          lineNumber,
        });
      }
    }

    return changes;
  }

  /**
   * Compare interfaces between old and new files
   */
  private compareInterfaces(oldFile: ParsedFile, newFile: ParsedFile): CodeChange[] {
    const changes: CodeChange[] = [];

    const oldInterfaces = new Map(oldFile.interfaces.map((i) => [i.name, i]));
    const newInterfaces = new Map(newFile.interfaces.map((i) => [i.name, i]));

    // Check for removed interfaces
    for (const [name, oldInterface] of oldInterfaces) {
      if (!newInterfaces.has(name)) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'interface-property-removed',
          oldValue: oldInterface,
          affectedSymbol: name,
          lineNumber: oldInterface.lineNumber,
        });
      }
    }

    // Check for added and modified interfaces
    for (const [name, newInterface] of newInterfaces) {
      const oldInterface = oldInterfaces.get(name);

      if (!oldInterface) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'interface-property-added',
          newValue: newInterface,
          affectedSymbol: name,
          lineNumber: newInterface.lineNumber,
        });
      } else {
        // Compare properties
        const propChanges = this.compareInterfaceProperties(
          oldInterface,
          newInterface,
          newFile.filePath
        );
        changes.push(...propChanges);
      }
    }

    return changes;
  }

  /**
   * Compare interface properties
   */
  private compareInterfaceProperties(
    oldInterface: InterfaceDefinition,
    newInterface: InterfaceDefinition,
    filePath: string
  ): CodeChange[] {
    const changes: CodeChange[] = [];

    const oldProps = new Map(oldInterface.properties.map((p) => [p.name, p]));
    const newProps = new Map(newInterface.properties.map((p) => [p.name, p]));

    // Check for removed properties
    for (const [name, oldProp] of oldProps) {
      if (!newProps.has(name)) {
        changes.push({
          filePath,
          changeType: 'interface-property-removed',
          oldValue: oldProp,
          affectedSymbol: `${newInterface.name}.${name}`,
          lineNumber: newInterface.lineNumber,
        });
      }
    }

    // Check for added and modified properties
    for (const [name, newProp] of newProps) {
      const oldProp = oldProps.get(name);

      if (!oldProp) {
        changes.push({
          filePath,
          changeType: 'interface-property-added',
          newValue: newProp,
          affectedSymbol: `${newInterface.name}.${name}`,
          lineNumber: newInterface.lineNumber,
        });
      } else if (oldProp.type !== newProp.type) {
        changes.push({
          filePath,
          changeType: 'interface-property-type-changed',
          oldValue: oldProp,
          newValue: newProp,
          affectedSymbol: `${newInterface.name}.${name}`,
          lineNumber: newInterface.lineNumber,
        });
      }
    }

    return changes;
  }

  /**
   * Compare API routes
   */
  private compareApiRoutes(oldFile: ParsedFile, newFile: ParsedFile): CodeChange[] {
    const changes: CodeChange[] = [];

    const oldRoutes = new Map(
      oldFile.apiRoutes.map((r) => [`${r.method}:${r.path}`, r])
    );
    const newRoutes = new Map(
      newFile.apiRoutes.map((r) => [`${r.method}:${r.path}`, r])
    );

    // Check for removed routes
    for (const [key, oldRoute] of oldRoutes) {
      if (!newRoutes.has(key)) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'api-route-removed',
          oldValue: oldRoute,
          affectedSymbol: `${oldRoute.method} ${oldRoute.path}`,
          lineNumber: oldRoute.lineNumber,
        });
      }
    }

    // Check for added and modified routes
    for (const [key, newRoute] of newRoutes) {
      const oldRoute = oldRoutes.get(key);

      if (!oldRoute) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'api-route-added',
          newValue: newRoute,
          affectedSymbol: `${newRoute.method} ${newRoute.path}`,
          lineNumber: newRoute.lineNumber,
        });
      } else {
        // Check for schema changes
        if (JSON.stringify(oldRoute.requestSchema) !== JSON.stringify(newRoute.requestSchema)) {
          changes.push({
            filePath: newFile.filePath,
            changeType: 'api-route-modified',
            oldValue: oldRoute,
            newValue: newRoute,
            affectedSymbol: `${newRoute.method} ${newRoute.path}`,
            lineNumber: newRoute.lineNumber,
          });
        }
      }
    }

    return changes;
  }

  /**
   * Compare classes
   */
  private compareClasses(oldFile: ParsedFile, newFile: ParsedFile): CodeChange[] {
    const changes: CodeChange[] = [];

    const oldClasses = new Map(oldFile.classes.map((c) => [c.name, c]));
    const newClasses = new Map(newFile.classes.map((c) => [c.name, c]));

    // Check for removed classes
    for (const [name, oldClass] of oldClasses) {
      if (!newClasses.has(name)) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'class-removed',
          oldValue: oldClass,
          affectedSymbol: name,
          lineNumber: oldClass.lineNumber,
        });
      }
    }

    // Check for added classes
    for (const [name, newClass] of newClasses) {
      if (!oldClasses.has(name)) {
        changes.push({
          filePath: newFile.filePath,
          changeType: 'class-added',
          newValue: newClass,
          affectedSymbol: name,
          lineNumber: newClass.lineNumber,
        });
      }
    }

    return changes;
  }

  /**
   * Identify breaking changes from code changes
   */
  identifyBreakingChanges(changes: CodeChange[]): BreakingChange[] {
    const breakingChanges: BreakingChange[] = [];

    for (const change of changes) {
      const breakingChange = this.evaluateBreakingChange(change);
      if (breakingChange) {
        breakingChanges.push(breakingChange);
      }
    }

    logger.info(`Identified ${breakingChanges.length} breaking changes`);
    return breakingChanges;
  }

  /**
   * Evaluate if a change is breaking
   */
  private evaluateBreakingChange(change: CodeChange): BreakingChange | null {
    const breakingTypes: Map<ChangeType, { severity: 'low' | 'medium' | 'high' | 'critical'; reason: string }> = new Map([
      ['function-removed', { severity: 'critical', reason: 'Function removed - will break all callers' }],
      ['parameter-removed', { severity: 'high', reason: 'Parameter removed - will break function calls' }],
      ['parameter-type-changed', { severity: 'high', reason: 'Parameter type changed - may break type safety' }],
      ['return-type-changed', { severity: 'medium', reason: 'Return type changed - may break consumers' }],
      ['interface-property-removed', { severity: 'high', reason: 'Interface property removed - will break implementations' }],
      ['interface-property-type-changed', { severity: 'high', reason: 'Interface property type changed - will break type safety' }],
      ['api-route-removed', { severity: 'critical', reason: 'API route removed - will break API consumers' }],
      ['api-route-modified', { severity: 'high', reason: 'API route modified - may break API contract' }],
      ['class-removed', { severity: 'high', reason: 'Class removed - will break all usages' }],
    ]);

    const breakingInfo = breakingTypes.get(change.changeType);
    if (!breakingInfo) {
      return null;
    }

    return {
      ...change,
      severity: breakingInfo.severity,
      reason: breakingInfo.reason,
    };
  }
}

// Made with Bob
