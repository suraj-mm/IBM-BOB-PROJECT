/**
 * API Contract Extractor Module
 * 
 * Extracts API route definitions from Fastify/Express code.
 * Tracks:
 * - HTTP methods and paths
 * - Request schemas
 * - Response schemas
 * - Route handlers
 */

import { SourceFile, SyntaxKind } from 'ts-morph';
import { ApiRoute, TypeSchema, SchemaProperty } from '../types';
import { logger } from '../utils/logger';

export class ApiExtractor {
  /**
   * Extract API routes from a source file
   */
  extractApiRoutes(sourceFile: SourceFile): ApiRoute[] {
    const routes: ApiRoute[] = [];

    try {
      // Extract Fastify routes
      routes.push(...this.extractFastifyRoutes(sourceFile));

      // Extract Express routes
      routes.push(...this.extractExpressRoutes(sourceFile));

      logger.debug(`Extracted ${routes.length} API routes from ${sourceFile.getFilePath()}`);
    } catch (error) {
      logger.error(`Error extracting API routes from ${sourceFile.getFilePath()}`, error);
    }

    return routes;
  }

  /**
   * Extract Fastify route definitions
   * Patterns: fastify.get(), fastify.post(), etc.
   */
  private extractFastifyRoutes(sourceFile: SourceFile): ApiRoute[] {
    const routes: ApiRoute[] = [];

    // Find all call expressions
    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
      const expression = callExpr.getExpression();
      const expressionText = expression.getText();

      // Check if it's a Fastify route method
      const fastifyMethods = ['get', 'post', 'put', 'delete', 'patch'];
      const methodMatch = fastifyMethods.find((method) =>
        expressionText.includes(`.${method}(`) || expressionText.endsWith(`.${method}`)
      );

      if (methodMatch) {
        const route = this.parseFastifyRoute(callExpr, methodMatch);
        if (route) {
          routes.push(route);
        }
      }
    });

    return routes;
  }

  /**
   * Parse a Fastify route call expression
   */
  private parseFastifyRoute(callExpr: any, method: string): ApiRoute | null {
    try {
      const args = callExpr.getArguments();
      if (args.length < 2) return null;

      // First argument is the path
      const pathArg = args[0];
      const path = this.extractStringValue(pathArg);
      if (!path) return null;

      // Second argument can be options or handler
      const secondArg = args[1];
      let requestSchema: TypeSchema | undefined;
      let responseSchema: TypeSchema | undefined;

      // Check if second argument is an options object
      if (secondArg.getKind() === SyntaxKind.ObjectLiteralExpression) {
        const schemas = this.extractFastifySchemas(secondArg);
        requestSchema = schemas.requestSchema;
        responseSchema = schemas.responseSchema;
      }

      return {
        method: method.toUpperCase() as any,
        path,
        handler: 'handler', // Simplified for now
        requestSchema,
        responseSchema,
        lineNumber: callExpr.getStartLineNumber(),
      };
    } catch (error) {
      logger.error('Error parsing Fastify route', error);
      return null;
    }
  }

  /**
   * Extract schemas from Fastify route options
   */
  private extractFastifySchemas(optionsObj: any): {
    requestSchema?: TypeSchema;
    responseSchema?: TypeSchema;
  } {
    const result: {
      requestSchema?: TypeSchema;
      responseSchema?: TypeSchema;
    } = {};

    try {
      const properties = optionsObj.getProperties();

      for (const prop of properties) {
        const propName = prop.getName();

        if (propName === 'schema') {
          const schemaObj = prop.getInitializer();
          if (schemaObj && schemaObj.getKind() === SyntaxKind.ObjectLiteralExpression) {
            const schemaProps = schemaObj.getProperties();

            for (const schemaProp of schemaProps) {
              const schemaName = schemaProp.getName();

              if (schemaName === 'body' || schemaName === 'querystring' || schemaName === 'params') {
                result.requestSchema = this.extractTypeSchema(schemaProp.getInitializer());
              } else if (schemaName === 'response') {
                result.responseSchema = this.extractTypeSchema(schemaProp.getInitializer());
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error extracting Fastify schemas', error);
    }

    return result;
  }

  /**
   * Extract Express route definitions
   * Patterns: app.get(), router.post(), etc.
   */
  private extractExpressRoutes(sourceFile: SourceFile): ApiRoute[] {
    const routes: ApiRoute[] = [];

    sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
      const expression = callExpr.getExpression();
      const expressionText = expression.getText();

      // Check if it's an Express route method
      const expressMethods = ['get', 'post', 'put', 'delete', 'patch'];
      const methodMatch = expressMethods.find((method) =>
        expressionText.includes(`.${method}(`) || expressionText.endsWith(`.${method}`)
      );

      if (methodMatch && (expressionText.includes('app.') || expressionText.includes('router.'))) {
        const route = this.parseExpressRoute(callExpr, methodMatch);
        if (route) {
          routes.push(route);
        }
      }
    });

    return routes;
  }

  /**
   * Parse an Express route call expression
   */
  private parseExpressRoute(callExpr: any, method: string): ApiRoute | null {
    try {
      const args = callExpr.getArguments();
      if (args.length < 2) return null;

      // First argument is the path
      const pathArg = args[0];
      const path = this.extractStringValue(pathArg);
      if (!path) return null;

      return {
        method: method.toUpperCase() as any,
        path,
        handler: 'handler', // Simplified for now
        lineNumber: callExpr.getStartLineNumber(),
      };
    } catch (error) {
      logger.error('Error parsing Express route', error);
      return null;
    }
  }

  /**
   * Extract string value from an expression
   */
  private extractStringValue(expr: any): string | null {
    try {
      if (expr.getKind() === SyntaxKind.StringLiteral) {
        return expr.getLiteralValue();
      }

      if (expr.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
        return expr.getLiteralValue();
      }

      // Try to get text and remove quotes
      const text = expr.getText();
      if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
        return text.slice(1, -1);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract type schema from an object literal or type reference
   */
  private extractTypeSchema(expr: any): TypeSchema | undefined {
    if (!expr) return undefined;

    try {
      const properties: SchemaProperty[] = [];

      if (expr.getKind() === SyntaxKind.ObjectLiteralExpression) {
        const props = expr.getProperties();

        for (const prop of props) {
          const name = prop.getName();
          const initializer = prop.getInitializer();

          if (initializer) {
            properties.push({
              name,
              type: this.inferTypeFromValue(initializer),
              required: true, // Default to required
            });
          }
        }
      }

      return properties.length > 0
        ? {
            name: 'Schema',
            properties,
          }
        : undefined;
    } catch (error) {
      logger.error('Error extracting type schema', error);
      return undefined;
    }
  }

  /**
   * Infer type from a value expression
   */
  private inferTypeFromValue(expr: any): string {
    try {
      const kind = expr.getKind();

      switch (kind) {
        case SyntaxKind.StringLiteral:
        case SyntaxKind.NoSubstitutionTemplateLiteral:
          return 'string';
        case SyntaxKind.NumericLiteral:
          return 'number';
        case SyntaxKind.TrueKeyword:
        case SyntaxKind.FalseKeyword:
          return 'boolean';
        case SyntaxKind.ArrayLiteralExpression:
          return 'array';
        case SyntaxKind.ObjectLiteralExpression:
          return 'object';
        default:
          return 'unknown';
      }
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Compare two API routes to detect changes
   */
  compareRoutes(oldRoute: ApiRoute, newRoute: ApiRoute): RouteChange[] {
    const changes: RouteChange[] = [];

    // Check if method changed
    if (oldRoute.method !== newRoute.method) {
      changes.push({
        type: 'method-changed',
        oldValue: oldRoute.method,
        newValue: newRoute.method,
      });
    }

    // Check if path changed
    if (oldRoute.path !== newRoute.path) {
      changes.push({
        type: 'path-changed',
        oldValue: oldRoute.path,
        newValue: newRoute.path,
      });
    }

    // Check request schema changes
    if (this.hasSchemaChanged(oldRoute.requestSchema, newRoute.requestSchema)) {
      changes.push({
        type: 'request-schema-changed',
        oldValue: oldRoute.requestSchema,
        newValue: newRoute.requestSchema,
      });
    }

    // Check response schema changes
    if (this.hasSchemaChanged(oldRoute.responseSchema, newRoute.responseSchema)) {
      changes.push({
        type: 'response-schema-changed',
        oldValue: oldRoute.responseSchema,
        newValue: newRoute.responseSchema,
      });
    }

    return changes;
  }

  /**
   * Check if a schema has changed
   */
  private hasSchemaChanged(oldSchema?: TypeSchema, newSchema?: TypeSchema): boolean {
    if (!oldSchema && !newSchema) return false;
    if (!oldSchema || !newSchema) return true;

    // Compare properties
    if (oldSchema.properties.length !== newSchema.properties.length) {
      return true;
    }

    for (const oldProp of oldSchema.properties) {
      const newProp = newSchema.properties.find((p) => p.name === oldProp.name);
      if (!newProp || oldProp.type !== newProp.type || oldProp.required !== newProp.required) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Route change type
 */
export interface RouteChange {
  type: 'method-changed' | 'path-changed' | 'request-schema-changed' | 'response-schema-changed';
  oldValue?: any;
  newValue?: any;
}

// Made with Bob
