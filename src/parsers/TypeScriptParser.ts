import { Project, SourceFile, Node, SyntaxKind } from 'ts-morph';
import {
  ParseResult,
  CodeSymbol,
  Dependency,
  ImportStatement,
  ExportStatement,
  ParseError,
  CodeLocation,
  SymbolKind,
  DependencyType
} from '../types';

/**
 * TypeScript/JavaScript AST Parser using ts-morph
 */
export class TypeScriptParser {
  private project: Project;

  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false,
      skipFileDependencyResolution: false
    });
  }

  /**
   * Parse a single file and extract all code intelligence data
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    
    const symbols = this.extractSymbols(sourceFile);
    const dependencies = this.extractDependencies(sourceFile);
    const imports = this.extractImports(sourceFile);
    const exports = this.extractExports(sourceFile);
    const errors = this.extractErrors(sourceFile);

    return {
      filePath,
      symbols,
      dependencies,
      imports,
      exports,
      errors
    };
  }

  /**
   * Parse multiple files
   */
  async parseFiles(filePaths: string[]): Promise<ParseResult[]> {
    const results: ParseResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.parseFile(filePath);
        results.push(result);
      } catch (error) {
        console.error(`Error parsing ${filePath}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Extract all symbols (functions, classes, variables, etc.)
   */
  private extractSymbols(sourceFile: SourceFile): CodeSymbol[] {
    const symbols: CodeSymbol[] = [];

    // Extract functions
    sourceFile.getFunctions().forEach(func => {
      symbols.push({
        name: func.getName() || '<anonymous>',
        kind: SymbolKind.Function,
        location: this.getLocation(func),
        scope: this.getScope(func),
        modifiers: func.getModifiers().map(m => m.getText()),
        signature: func.getSignature().getDeclaration().getText(),
        documentation: func.getJsDocs().map(doc => doc.getDescription()).join('\n')
      });
    });

    // Extract classes
    sourceFile.getClasses().forEach(cls => {
      symbols.push({
        name: cls.getName() || '<anonymous>',
        kind: SymbolKind.Class,
        location: this.getLocation(cls),
        scope: this.getScope(cls),
        modifiers: cls.getModifiers().map(m => m.getText()),
        documentation: cls.getJsDocs().map(doc => doc.getDescription()).join('\n')
      });

      // Extract methods
      cls.getMethods().forEach(method => {
        symbols.push({
          name: `${cls.getName()}.${method.getName()}`,
          kind: SymbolKind.Method,
          location: this.getLocation(method),
          scope: cls.getName() || '<anonymous>',
          modifiers: method.getModifiers().map(m => m.getText()),
          signature: method.getSignature().getDeclaration().getText(),
          documentation: method.getJsDocs().map(doc => doc.getDescription()).join('\n')
        });
      });

      // Extract properties
      cls.getProperties().forEach(prop => {
        symbols.push({
          name: `${cls.getName()}.${prop.getName()}`,
          kind: SymbolKind.Property,
          location: this.getLocation(prop),
          scope: cls.getName() || '<anonymous>',
          modifiers: prop.getModifiers().map(m => m.getText())
        });
      });
    });

    // Extract interfaces
    sourceFile.getInterfaces().forEach(iface => {
      symbols.push({
        name: iface.getName(),
        kind: SymbolKind.Interface,
        location: this.getLocation(iface),
        scope: this.getScope(iface),
        modifiers: iface.getModifiers().map(m => m.getText()),
        documentation: iface.getJsDocs().map(doc => doc.getDescription()).join('\n')
      });
    });

    // Extract type aliases
    sourceFile.getTypeAliases().forEach(type => {
      symbols.push({
        name: type.getName(),
        kind: SymbolKind.Type,
        location: this.getLocation(type),
        scope: this.getScope(type),
        modifiers: type.getModifiers().map(m => m.getText())
      });
    });

    // Extract variables
    sourceFile.getVariableDeclarations().forEach(variable => {
      const isConst = variable.getVariableStatement()?.getDeclarationKind() === 'const';
      symbols.push({
        name: variable.getName(),
        kind: isConst ? SymbolKind.Constant : SymbolKind.Variable,
        location: this.getLocation(variable),
        scope: this.getScope(variable),
        modifiers: []
      });
    });

    // Extract enums
    sourceFile.getEnums().forEach(enumDecl => {
      symbols.push({
        name: enumDecl.getName(),
        kind: SymbolKind.Enum,
        location: this.getLocation(enumDecl),
        scope: this.getScope(enumDecl),
        modifiers: enumDecl.getModifiers().map(m => m.getText())
      });
    });

    return symbols;
  }

  /**
   * Extract dependencies (imports, function calls, etc.)
   */
  private extractDependencies(sourceFile: SourceFile): Dependency[] {
    const dependencies: Dependency[] = [];
    const filePath = sourceFile.getFilePath();

    // Extract import dependencies
    sourceFile.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      dependencies.push({
        source: filePath,
        target: moduleSpecifier,
        type: DependencyType.Import,
        location: this.getLocation(importDecl),
        isExternal: this.isExternalModule(moduleSpecifier)
      });
    });

    // Extract function call dependencies
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
      const expression = call.getExpression();
      const name = expression.getText();
      
      dependencies.push({
        source: filePath,
        target: name,
        type: DependencyType.Call,
        location: this.getLocation(call),
        isExternal: false
      });
    });

    // Extract inheritance dependencies
    sourceFile.getClasses().forEach(cls => {
      const heritage = cls.getExtends();
      if (heritage) {
        dependencies.push({
          source: filePath,
          target: heritage.getText(),
          type: DependencyType.Inheritance,
          location: this.getLocation(heritage),
          isExternal: false
        });
      }

      cls.getImplements().forEach(impl => {
        dependencies.push({
          source: filePath,
          target: impl.getText(),
          type: DependencyType.Implementation,
          location: this.getLocation(impl),
          isExternal: false
        });
      });
    });

    return dependencies;
  }

  /**
   * Extract import statements
   */
  private extractImports(sourceFile: SourceFile): ImportStatement[] {
    return sourceFile.getImportDeclarations().map(importDecl => ({
      source: importDecl.getModuleSpecifierValue(),
      specifiers: importDecl.getNamedImports().map(named => named.getName()),
      isDefault: importDecl.getDefaultImport() !== undefined,
      location: this.getLocation(importDecl)
    }));
  }

  /**
   * Extract export statements
   */
  private extractExports(sourceFile: SourceFile): ExportStatement[] {
    const exports: ExportStatement[] = [];

    sourceFile.getExportDeclarations().forEach(exportDecl => {
      exportDecl.getNamedExports().forEach(named => {
        exports.push({
          name: named.getName(),
          isDefault: false,
          location: this.getLocation(exportDecl)
        });
      });
    });

    sourceFile.getExportAssignments().forEach(exportAssign => {
      exports.push({
        name: exportAssign.getExpression().getText(),
        isDefault: exportAssign.isExportEquals(),
        location: this.getLocation(exportAssign)
      });
    });

    return exports;
  }

  /**
   * Extract parsing errors
   */
  private extractErrors(sourceFile: SourceFile): ParseError[] {
    const diagnostics = sourceFile.getPreEmitDiagnostics();
    
    return diagnostics.map(diagnostic => ({
      message: diagnostic.getMessageText().toString(),
      location: this.getLocationFromDiagnostic(diagnostic),
      severity: diagnostic.getCategory() === 1 ? 'error' : 'warning'
    }));
  }

  /**
   * Get code location from a node
   */
  private getLocation(node: Node): CodeLocation {
    const sourceFile = node.getSourceFile();
    const start = node.getStartLineNumber();
    const end = node.getEndLineNumber();
    
    return {
      filePath: sourceFile.getFilePath(),
      line: start,
      column: node.getStartLinePos(),
      endLine: end,
      endColumn: node.getEndLinePos()
    };
  }

  /**
   * Get location from diagnostic
   */
  private getLocationFromDiagnostic(diagnostic: any): CodeLocation {
    const sourceFile = diagnostic.getSourceFile();
    const start = diagnostic.getStart();
    
    if (!sourceFile || start === undefined) {
      return {
        filePath: 'unknown',
        line: 0,
        column: 0
      };
    }

    const { line, column } = sourceFile.getLineAndColumnAtPos(start);
    
    return {
      filePath: sourceFile.getFilePath(),
      line,
      column
    };
  }

  /**
   * Get scope of a node
   */
  private getScope(node: Node): string {
    const parent = node.getParent();
    
    if (!parent) {
      return 'global';
    }

    if (Node.isClassDeclaration(parent)) {
      return parent.getName() || '<anonymous>';
    }

    if (Node.isFunctionDeclaration(parent)) {
      return parent.getName() || '<anonymous>';
    }

    return 'global';
  }

  /**
   * Check if module is external (node_modules)
   */
  private isExternalModule(modulePath: string): boolean {
    return !modulePath.startsWith('.') && !modulePath.startsWith('/');
  }

  /**
   * Get the ts-morph project instance
   */
  getProject(): Project {
    return this.project;
  }
}

// Made with Bob
