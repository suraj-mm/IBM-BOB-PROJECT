/**
 * AST Parser Module
 * 
 * Parses TypeScript files using ts-morph to extract:
 * - Functions
 * - Classes
 * - Interfaces
 * - Imports
 * - Exports
 * - API routes
 */

import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import {
  ParsedFile,
  FunctionDefinition,
  ClassDefinition,
  InterfaceDefinition,
  ImportStatement,
  ExportStatement,
  Parameter,
  MethodDefinition,
  PropertyDefinition,
  InterfaceProperty,
} from '../types';
import { logger } from '../utils/logger';

export class ASTParser {
  private project: Project;

  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true,
    });
  }

  /**
   * Parse a single TypeScript file
   */
  parseFile(filePath: string): ParsedFile | null {
    try {
      logger.debug(`Parsing file: ${filePath}`);

      const sourceFile = this.project.addSourceFileAtPath(filePath);
      
      const parsed: ParsedFile = {
        filePath,
        functions: this.extractFunctions(sourceFile),
        classes: this.extractClasses(sourceFile),
        interfaces: this.extractInterfaces(sourceFile),
        imports: this.extractImports(sourceFile),
        exports: this.extractExports(sourceFile),
        apiRoutes: [], // Will be populated by API extractor
      };

      logger.debug(`Successfully parsed file: ${filePath}`, {
        functions: parsed.functions.length,
        classes: parsed.classes.length,
        interfaces: parsed.interfaces.length,
      });

      return parsed;
    } catch (error) {
      logger.error(`Error parsing file: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Parse multiple files
   */
  parseFiles(filePaths: string[]): ParsedFile[] {
    const results: ParsedFile[] = [];

    for (const filePath of filePaths) {
      const parsed = this.parseFile(filePath);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  /**
   * Extract function definitions from source file
   */
  private extractFunctions(sourceFile: SourceFile): FunctionDefinition[] {
    const functions: FunctionDefinition[] = [];

    sourceFile.getFunctions().forEach((func) => {
      const name = func.getName();
      if (!name) return;

      functions.push({
        name,
        parameters: this.extractParameters(func.getParameters()),
        returnType: func.getReturnType().getText(),
        isAsync: func.isAsync(),
        isExported: func.isExported(),
        lineNumber: func.getStartLineNumber(),
      });
    });

    return functions;
  }

  /**
   * Extract class definitions from source file
   */
  private extractClasses(sourceFile: SourceFile): ClassDefinition[] {
    const classes: ClassDefinition[] = [];

    sourceFile.getClasses().forEach((cls) => {
      const name = cls.getName();
      if (!name) return;

      classes.push({
        name,
        methods: this.extractMethods(cls),
        properties: this.extractProperties(cls),
        isExported: cls.isExported(),
        lineNumber: cls.getStartLineNumber(),
      });
    });

    return classes;
  }

  /**
   * Extract methods from a class
   */
  private extractMethods(cls: any): MethodDefinition[] {
    const methods: MethodDefinition[] = [];

    cls.getMethods().forEach((method: any) => {
      methods.push({
        name: method.getName(),
        parameters: this.extractParameters(method.getParameters()),
        returnType: method.getReturnType().getText(),
        isAsync: method.isAsync(),
        isPublic: !method.hasModifier(SyntaxKind.PrivateKeyword),
        lineNumber: method.getStartLineNumber(),
      });
    });

    return methods;
  }

  /**
   * Extract properties from a class
   */
  private extractProperties(cls: any): PropertyDefinition[] {
    const properties: PropertyDefinition[] = [];

    cls.getProperties().forEach((prop: any) => {
      properties.push({
        name: prop.getName(),
        type: prop.getType().getText(),
        isPublic: !prop.hasModifier(SyntaxKind.PrivateKeyword),
        lineNumber: prop.getStartLineNumber(),
      });
    });

    return properties;
  }

  /**
   * Extract interface definitions from source file
   */
  private extractInterfaces(sourceFile: SourceFile): InterfaceDefinition[] {
    const interfaces: InterfaceDefinition[] = [];

    sourceFile.getInterfaces().forEach((iface) => {
      interfaces.push({
        name: iface.getName(),
        properties: this.extractInterfaceProperties(iface),
        isExported: iface.isExported(),
        lineNumber: iface.getStartLineNumber(),
      });
    });

    return interfaces;
  }

  /**
   * Extract properties from an interface
   */
  private extractInterfaceProperties(iface: any): InterfaceProperty[] {
    const properties: InterfaceProperty[] = [];

    iface.getProperties().forEach((prop: any) => {
      properties.push({
        name: prop.getName(),
        type: prop.getType().getText(),
        isOptional: prop.hasQuestionToken(),
      });
    });

    return properties;
  }

  /**
   * Extract import statements from source file
   */
  private extractImports(sourceFile: SourceFile): ImportStatement[] {
    const imports: ImportStatement[] = [];

    sourceFile.getImportDeclarations().forEach((importDecl) => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      const importedNames: string[] = [];
      let isDefault = false;

      // Get default import
      const defaultImport = importDecl.getDefaultImport();
      if (defaultImport) {
        importedNames.push(defaultImport.getText());
        isDefault = true;
      }

      // Get named imports
      const namedImports = importDecl.getNamedImports();
      namedImports.forEach((namedImport) => {
        importedNames.push(namedImport.getName());
      });

      // Get namespace import
      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        importedNames.push(namespaceImport.getText());
      }

      imports.push({
        modulePath: moduleSpecifier,
        importedNames,
        isDefault,
        lineNumber: importDecl.getStartLineNumber(),
      });
    });

    return imports;
  }

  /**
   * Extract export statements from source file
   */
  private extractExports(sourceFile: SourceFile): ExportStatement[] {
    const exports: ExportStatement[] = [];

    // Get export declarations
    sourceFile.getExportDeclarations().forEach((exportDecl) => {
      const namedExports = exportDecl.getNamedExports();
      namedExports.forEach((namedExport) => {
        exports.push({
          exportedName: namedExport.getName(),
          isDefault: false,
          lineNumber: exportDecl.getStartLineNumber(),
        });
      });
    });

    // Get default exports
    const defaultExport = sourceFile.getDefaultExportSymbol();
    if (defaultExport) {
      exports.push({
        exportedName: defaultExport.getName(),
        isDefault: true,
        lineNumber: 1, // Default exports don't have a specific line
      });
    }

    return exports;
  }

  /**
   * Extract parameters from function/method
   */
  private extractParameters(params: any[]): Parameter[] {
    return params.map((param) => ({
      name: param.getName(),
      type: param.getType().getText(),
      isOptional: param.isOptional(),
    }));
  }

  /**
   * Clear the project cache
   */
  clearCache(): void {
    this.project.getSourceFiles().forEach((file) => {
      this.project.removeSourceFile(file);
    });
  }
}

// Made with Bob
