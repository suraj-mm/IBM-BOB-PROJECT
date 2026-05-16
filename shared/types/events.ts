/**
 * Shared Event Contracts
 * 
 * Unified event types used across all subsystems:
 * - VS Code Extension
 * - Backend Intelligence Engine
 * - AI Risk Engine
 * - Floating Overlay UI
 */

// ============================================
// Core Event Structure
// ============================================

export interface BaseEvent {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  source: EventSource;
}

export interface IntelligenceEvent extends BaseEvent {
  severity: EventSeverity;
  payload: EventPayload;
}

// ============================================
// Event Types
// ============================================

export type EventType =
  // VS Code Extension Events
  | 'file_changed'
  | 'file_saved'
  | 'branch_changed'
  | 'repo_changed'
  | 'editor_context'
  
  // Backend Intelligence Events
  | 'breaking-api-change'
  | 'dependency-risk'
  | 'affected-modules'
  | 'contract-violation'
  | 'import-cycle-detected'
  | 'unused-export-detected'
  | 'api_contract_changed'
  | 'dependency_detected'
  
  // AI Risk Engine Events
  | 'merge_risk_detected'
  | 'ai_suggestion_generated'
  | 'parallel_implementation_detected'
  | 'integration_warning'
  | 'risk_score_updated'
  
  // System Events
  | 'system_ready'
  | 'connection_established'
  | 'connection_lost'
  | 'heartbeat';

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// Event Sources
// ============================================

export interface EventSource {
  subsystem: SubsystemType;
  repo?: string;
  branch?: string;
  commit?: string;
  changedFiles?: string[];
  metadata?: Record<string, any>;
}

export type SubsystemType = 
  | 'vscode-extension'
  | 'backend-engine'
  | 'ai-engine'
  | 'overlay-ui'
  | 'system';

// ============================================
// Event Payloads
// ============================================

export interface EventPayload {
  [key: string]: any;
}

// VS Code Extension Payloads
export interface FileChangedPayload extends EventPayload {
  filePath: string;
  repo: string;
  branch: string;
  changeType: 'modified' | 'created' | 'deleted';
  language?: string;
}

export interface EditorContextPayload extends EventPayload {
  activeFile: string;
  openFiles: string[];
  repo: string;
  branch: string;
  gitStatus?: {
    ahead: number;
    behind: number;
    modified: string[];
    staged: string[];
  };
}

// Backend Intelligence Payloads
export interface BreakingApiChangePayload extends EventPayload {
  changes: CodeChange[];
  affectedFiles: string[];
  breakingChanges: BreakingChange[];
  recommendations: string[];
  metadata: {
    impactScore: number;
    apiChangesCount: number;
  };
}

export interface DependencyRiskPayload extends EventPayload {
  changes: CodeChange[];
  affectedFiles: string[];
  recommendations: string[];
  metadata: {
    impactScore: number;
    affectedFilesCount: number;
    directImpacts: number;
  };
}

export interface AffectedModulesPayload extends EventPayload {
  changes: CodeChange[];
  affectedFiles: string[];
  recommendations: string[];
  metadata: {
    impactScore: number;
    changedFile: string;
    affectedFilesCount: number;
  };
}

// AI Risk Engine Payloads
export interface MergeRiskPayload extends EventPayload {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  conflictingFiles: string[];
  affectedDevelopers: string[];
  suggestions: string[];
  reasoning: string;
}

export interface AiSuggestionPayload extends EventPayload {
  suggestionType: 'refactor' | 'fix' | 'optimize' | 'warning';
  message: string;
  targetFile?: string;
  codeSnippet?: string;
  confidence: number;
}

export interface ParallelImplementationPayload extends EventPayload {
  developers: string[];
  overlappingFiles: string[];
  conflictProbability: number;
  recommendation: string;
}

// ============================================
// Supporting Types
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
  severity: EventSeverity;
  reason: string;
}

// ============================================
// Event Factory Functions
// ============================================

export function createEvent<T extends EventPayload>(
  eventType: EventType,
  source: EventSource,
  payload: T,
  severity?: EventSeverity
): IntelligenceEvent {
  return {
    eventId: generateEventId(),
    eventType,
    timestamp: new Date().toISOString(),
    source,
    severity: severity || 'low',
    payload,
  };
}

export function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Event Validation
// ============================================

export function isValidEvent(event: any): event is IntelligenceEvent {
  return (
    event &&
    typeof event === 'object' &&
    typeof event.eventId === 'string' &&
    typeof event.eventType === 'string' &&
    typeof event.timestamp === 'string' &&
    typeof event.source === 'object' &&
    typeof event.payload === 'object'
  );
}

// Made with Bob