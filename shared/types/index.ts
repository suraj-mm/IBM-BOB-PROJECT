/**
 * Shared Types Index
 * 
 * Central export point for all shared types across subsystems
 */

export * from './events';

// Re-export commonly used types for convenience
export type {
  IntelligenceEvent,
  EventType,
  EventSeverity,
  EventSource,
  EventPayload,
  FileChangedPayload,
  EditorContextPayload,
  BreakingApiChangePayload,
  DependencyRiskPayload,
  AffectedModulesPayload,
  MergeRiskPayload,
  AiSuggestionPayload,
  ParallelImplementationPayload,
  CodeChange,
  ChangeType,
  BreakingChange,
} from './events';

// Made with Bob