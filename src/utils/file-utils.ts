/**
 * File system utility functions
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    logger.error(`Error checking file existence: ${filePath}`, error);
    return false;
  }
}

/**
 * Read file content
 */
export function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    logger.error(`Error reading file: ${filePath}`, error);
    return null;
  }
}

/**
 * Get all TypeScript files in a directory recursively
 */
export function getTypeScriptFiles(dirPath: string): string[] {
  const files: string[] = [];

  function traverse(currentPath: string): void {
    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        // Skip node_modules and hidden directories
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          // Include .ts and .tsx files
          if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.error(`Error traversing directory: ${currentPath}`, error);
    }
  }

  traverse(dirPath);
  return files;
}

/**
 * Normalize file path to use forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Get relative path from base directory
 */
export function getRelativePath(from: string, to: string): string {
  return normalizePath(path.relative(from, to));
}

/**
 * Resolve import path to absolute file path
 */
export function resolveImportPath(
  currentFilePath: string,
  importPath: string,
  baseDir: string
): string | null {
  try {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const currentDir = path.dirname(currentFilePath);
      let resolvedPath = path.resolve(currentDir, importPath);

      // Try with different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
      for (const ext of extensions) {
        const testPath = resolvedPath + ext;
        if (fileExists(testPath)) {
          return normalizePath(testPath);
        }
      }

      // Check if it's already a complete path
      if (fileExists(resolvedPath)) {
        return normalizePath(resolvedPath);
      }
    }

    // Handle absolute imports from base directory
    const absolutePath = path.resolve(baseDir, importPath);
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
    for (const ext of extensions) {
      const testPath = absolutePath + ext;
      if (fileExists(testPath)) {
        return normalizePath(testPath);
      }
    }

    return null;
  } catch (error) {
    logger.error(`Error resolving import path: ${importPath}`, error);
    return null;
  }
}

/**
 * Check if file is a TypeScript file
 */
export function isTypeScriptFile(filePath: string): boolean {
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

// Made with Bob
