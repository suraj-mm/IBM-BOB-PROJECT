/**
 * Core type definitions for the Backend Intelligence Engine
 */

// ============================================
// AST & Code Structure Types
// ============================================

export interface ParsedFile {
  filePath: string;
  functions: FunctionDefinition[];
  classes: ClassDefinition[];
  interfaces: InterfaceDefinition[];
  imports: ImportStatement[];
  exports: ExportStatement[];
  apiRoutes: ApiRoute[];
}

export interface FunctionDefinition {
  name: string;
  parameters: Parameter[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  lineNumber: number;
}

export interface ClassDefinition {
  name: string;
  methods: MethodDefinition[];
  properties: PropertyDefinition[];
  isExported: boolean;
  lineNumber: number;
}

export interface MethodDefinition {
  name: string;
  parameters: Parameter[];
  returnType: string;
  isAsync: boolean;
  isPublic: boolean;
  lineNumber: number;
}

export interface PropertyDefinition {
  name: string;
  type: string;
  isPublic: boolean;
  lineNumber: number;
}

export interface InterfaceDefinition {
  name: string;
  properties: InterfaceProperty[];
  isExported: boolean;
  lineNumber: number;
}

export interface InterfaceProperty {
  name: string;
  type: string;
  isOptional: boolean;
}

export interface Parameter {
  name: string;
  type: string;
  isOptional: boolean;
}

export interface ImportStatement {
  modulePath: string;
  importedNames: string[];
  isDefault: boolean;
  lineNumber: number;
}

export interface ExportStatement {
  exportedName: string;
  isDefault: boolean;
  lineNumber: number;
}

// ============================================
// API Contract Types
// ============================================

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  requestSchema?: TypeSchema;
  responseSchema?: TypeSchema;
  lineNumber: number;
}

export interface TypeSchema {
  name: string;
  properties: SchemaProperty[];
}

export interface SchemaProperty {
  name: string;
  type: string;
  required: boolean;
}

// ============================================
// Dependency & Graph Types
// ============================================

export interface Dependency {
  sourceFile: string;
  targetFile: string;
  importedSymbols: string[];
  dependencyType: 'import' | 'api-call' | 'type-reference';
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  filePath: string;
  nodeType: 'file' | 'function' | 'class' | 'api' | 'interface';
  metadata: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  edgeType: 'imports' | 'calls' | 'implements' | 'extends';
  metadata: Record<string, any>;
}

// ============================================
// Change Detection Types
// ============================================

export interface CodeChange {
  filePath: string;
  changeType: ChangeType;
  oldValue?: any;
  newValue?: any;
  affectedSymbol: string;
  lineNumber: number;
}

export type ChangeType =
  | 'function-added'
  | 'function-removed'
  | 'function-modified'
  | 'parameter-added'
  | 'parameter-removed'
  | 'parameter-type-changed'
  | 'return-type-changed'
  | 'interface-property-added'
  | 'interface-property-removed'
  | 'interface-property-type-changed'
  | 'api-route-added'
  | 'api-route-removed'
  | 'api-route-modified'
  | 'class-added'
  | 'class-removed'
  | 'class-modified';

export interface BreakingChange extends CodeChange {
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

// ============================================
// Impact Analysis Types
// ============================================

export interface ImpactAnalysis {
  changedFile: string;
  changes: CodeChange[];
  affectedFiles: AffectedFile[];
  breakingChanges: BreakingChange[];
  impactScore: number;
}

export interface AffectedFile {
  filePath: string;
  reason: string;
  impactType: 'direct' | 'indirect';
  affectedSymbols: string[];
}

// ============================================
// Event Types
// ============================================

export interface IntelligenceEvent {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: EventSource;
  payload: EventPayload;
}

export type EventType =
  | 'breaking-api-change'
  | 'dependency-risk'
  | 'affected-modules'
  | 'contract-violation'
  | 'import-cycle-detected'
  | 'unused-export-detected';

export interface EventSource {
  repo: string;
  branch?: string;
  commit?: string;
  changedFiles: string[];
}

export interface EventPayload {
  changes: CodeChange[];
  affectedFiles: string[];
  breakingChanges?: BreakingChange[];
  recommendations?: string[];
  metadata?: Record<string, any>;
}

// ============================================
// Request/Response Types
// ============================================

export interface AnalyzeRequest {
  repo: string;
  branch?: string;
  changedFiles: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  analysisId: string;
  events: IntelligenceEvent[];
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  totalChanges: number;
  breakingChanges: number;
  affectedFiles: number;
  highSeverityIssues: number;
}

// ============================================
// Configuration Types
// ============================================

export interface EngineConfig {
  repoPath: string;
  neo4jUri: string;
  neo4jUser: string;
  neo4jPassword: string;
  postgresConfig: PostgresConfig;
}

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Made with Bob
