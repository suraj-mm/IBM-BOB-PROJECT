/**
 * Event Router
 * 
 * Routes events to appropriate subsystems based on event type and content
 */

import { IntelligenceEvent, EventType } from '../shared/types';

export class EventRouter {
  private routingRules: Map<EventType, string[]>;

  constructor() {
    this.routingRules = new Map();
    this.setupDefaultRoutes();
  }

  /**
   * Setup default routing rules
   */
  private setupDefaultRoutes(): void {
    // VS Code Extension events -> Backend Engine + AI Engine
    this.routingRules.set('file_changed', ['backend-engine', 'ai-engine']);
    this.routingRules.set('file_saved', ['backend-engine']);
    this.routingRules.set('branch_changed', ['backend-engine', 'ai-engine']);
    this.routingRules.set('editor_context', ['backend-engine', 'ai-engine']);
    
    // Backend Engine events -> AI Engine + Overlay UI
    this.routingRules.set('breaking-api-change', ['ai-engine', 'overlay-ui']);
    this.routingRules.set('dependency-risk', ['ai-engine', 'overlay-ui']);
    this.routingRules.set('affected-modules', ['ai-engine', 'overlay-ui']);
    this.routingRules.set('contract-violation', ['ai-engine', 'overlay-ui']);
    this.routingRules.set('api_contract_changed', ['ai-engine', 'overlay-ui']);
    this.routingRules.set('dependency_detected', ['ai-engine', 'overlay-ui']);
    
    // AI Engine events -> Overlay UI
    this.routingRules.set('merge_risk_detected', ['overlay-ui']);
    this.routingRules.set('ai_suggestion_generated', ['overlay-ui']);
    this.routingRules.set('parallel_implementation_detected', ['overlay-ui']);
    this.routingRules.set('integration_warning', ['overlay-ui']);
    this.routingRules.set('risk_score_updated', ['overlay-ui']);
    
    // System events -> All
    this.routingRules.set('system_ready', ['vscode-extension', 'backend-engine', 'ai-engine', 'overlay-ui']);
    this.routingRules.set('connection_established', ['vscode-extension', 'backend-engine', 'ai-engine', 'overlay-ui']);
    this.routingRules.set('connection_lost', ['vscode-extension', 'backend-engine', 'ai-engine', 'overlay-ui']);
  }

  /**
   * Route an event to target subsystems
   */
  route(event: IntelligenceEvent): string[] {
    const targets = this.routingRules.get(event.eventType);
    
    if (!targets) {
      // If no specific route, broadcast to all except source
      return this.getAllSubsystemsExcept(event.source.subsystem);
    }
    
    // Filter out the source subsystem to avoid echo
    return targets.filter(target => target !== event.source.subsystem);
  }

  /**
   * Add custom routing rule
   */
  addRoute(eventType: EventType, targets: string[]): void {
    this.routingRules.set(eventType, targets);
  }

  /**
   * Remove routing rule
   */
  removeRoute(eventType: EventType): void {
    this.routingRules.delete(eventType);
  }

  /**
   * Get all subsystems except the specified one
   */
  private getAllSubsystemsExcept(subsystem: string): string[] {
    const allSubsystems = ['vscode-extension', 'backend-engine', 'ai-engine', 'overlay-ui'];
    return allSubsystems.filter(s => s !== subsystem);
  }

  /**
   * Get routing rules
   */
  getRoutes(): Map<EventType, string[]> {
    return new Map(this.routingRules);
  }
}

// Made with Bob