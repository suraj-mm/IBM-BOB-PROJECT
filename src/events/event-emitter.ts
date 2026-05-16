/**
 * Event Emitter Module
 * 
 * Emits structured intelligence events based on impact analysis.
 * Events are emitted via WebSocket and can be consumed by other systems.
 */

import {
  IntelligenceEvent,
  EventType,
  EventSource,
  EventPayload,
  ImpactAnalysis,
  BreakingChange,
} from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class EventEmitter {
  private listeners: Map<EventType, EventListener[]> = new Map();

  /**
   * Register an event listener
   */
  on(eventType: EventType, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  /**
   * Remove an event listener
   */
  off(eventType: EventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  private async emit(event: IntelligenceEvent): Promise<void> {
    const listeners = this.listeners.get(event.eventType);
    if (listeners) {
      for (const listener of listeners) {
        try {
          await listener(event);
        } catch (error) {
          logger.error(`Error in event listener for ${event.eventType}`, error);
        }
      }
    }

    // Always log the event
    logger.info(`Event emitted: ${event.eventType}`, {
      eventId: event.eventId,
      severity: event.severity,
    });
  }

  /**
   * Create and emit events from impact analysis
   */
  async emitFromImpactAnalysis(
    analysis: ImpactAnalysis,
    source: EventSource
  ): Promise<IntelligenceEvent[]> {
    const events: IntelligenceEvent[] = [];

    // Emit breaking API change events
    const apiBreakingChanges = analysis.breakingChanges.filter((bc) =>
      bc.changeType.includes('api-route')
    );

    if (apiBreakingChanges.length > 0) {
      const event = this.createBreakingApiChangeEvent(apiBreakingChanges, analysis, source);
      await this.emit(event);
      events.push(event);
    }

    // Emit dependency risk events
    if (analysis.affectedFiles.length > 5) {
      const event = this.createDependencyRiskEvent(analysis, source);
      await this.emit(event);
      events.push(event);
    }

    // Emit affected modules event
    if (analysis.affectedFiles.length > 0) {
      const event = this.createAffectedModulesEvent(analysis, source);
      await this.emit(event);
      events.push(event);
    }

    // Emit contract violation events
    const contractViolations = analysis.breakingChanges.filter(
      (bc) =>
        bc.changeType.includes('interface') ||
        bc.changeType.includes('parameter') ||
        bc.changeType.includes('return-type')
    );

    if (contractViolations.length > 0) {
      const event = this.createContractViolationEvent(contractViolations, analysis, source);
      await this.emit(event);
      events.push(event);
    }

    return events;
  }

  /**
   * Create a breaking API change event
   */
  private createBreakingApiChangeEvent(
    breakingChanges: BreakingChange[],
    analysis: ImpactAnalysis,
    source: EventSource
  ): IntelligenceEvent {
    const severity = this.determineSeverity(breakingChanges);

    return {
      eventId: uuidv4(),
      eventType: 'breaking-api-change',
      timestamp: new Date().toISOString(),
      severity,
      source,
      payload: {
        changes: breakingChanges,
        affectedFiles: analysis.affectedFiles.map((f) => f.filePath),
        breakingChanges,
        recommendations: [
          'Update API documentation',
          'Notify API consumers',
          'Consider versioning the API',
        ],
        metadata: {
          impactScore: analysis.impactScore,
          apiChangesCount: breakingChanges.length,
        },
      },
    };
  }

  /**
   * Create a dependency risk event
   */
  private createDependencyRiskEvent(
    analysis: ImpactAnalysis,
    source: EventSource
  ): IntelligenceEvent {
    const severity = analysis.affectedFiles.length > 20 ? 'high' : 'medium';

    return {
      eventId: uuidv4(),
      eventType: 'dependency-risk',
      timestamp: new Date().toISOString(),
      severity,
      source,
      payload: {
        changes: analysis.changes,
        affectedFiles: analysis.affectedFiles.map((f) => f.filePath),
        recommendations: [
          `${analysis.affectedFiles.length} files will be affected by this change`,
          'Consider breaking this into smaller changes',
          'Coordinate with affected teams',
        ],
        metadata: {
          impactScore: analysis.impactScore,
          affectedFilesCount: analysis.affectedFiles.length,
          directImpacts: analysis.affectedFiles.filter((f) => f.impactType === 'direct').length,
        },
      },
    };
  }

  /**
   * Create an affected modules event
   */
  private createAffectedModulesEvent(
    analysis: ImpactAnalysis,
    source: EventSource
  ): IntelligenceEvent {
    const severity = analysis.impactScore > 70 ? 'high' : analysis.impactScore > 40 ? 'medium' : 'low';

    return {
      eventId: uuidv4(),
      eventType: 'affected-modules',
      timestamp: new Date().toISOString(),
      severity,
      source,
      payload: {
        changes: analysis.changes,
        affectedFiles: analysis.affectedFiles.map((f) => f.filePath),
        recommendations: this.generateAffectedModulesRecommendations(analysis),
        metadata: {
          impactScore: analysis.impactScore,
          changedFile: analysis.changedFile,
          affectedFilesCount: analysis.affectedFiles.length,
        },
      },
    };
  }

  /**
   * Create a contract violation event
   */
  private createContractViolationEvent(
    violations: BreakingChange[],
    analysis: ImpactAnalysis,
    source: EventSource
  ): IntelligenceEvent {
    const severity = this.determineSeverity(violations);

    return {
      eventId: uuidv4(),
      eventType: 'contract-violation',
      timestamp: new Date().toISOString(),
      severity,
      source,
      payload: {
        changes: violations,
        affectedFiles: analysis.affectedFiles.map((f) => f.filePath),
        breakingChanges: violations,
        recommendations: [
          'Review type contracts carefully',
          'Update all implementations',
          'Run type checking across affected files',
        ],
        metadata: {
          impactScore: analysis.impactScore,
          violationsCount: violations.length,
        },
      },
    };
  }

  /**
   * Determine event severity from breaking changes
   */
  private determineSeverity(
    breakingChanges: BreakingChange[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const hasCritical = breakingChanges.some((bc) => bc.severity === 'critical');
    if (hasCritical) return 'critical';

    const hasHigh = breakingChanges.some((bc) => bc.severity === 'high');
    if (hasHigh) return 'high';

    const hasMedium = breakingChanges.some((bc) => bc.severity === 'medium');
    if (hasMedium) return 'medium';

    return 'low';
  }

  /**
   * Generate recommendations for affected modules
   */
  private generateAffectedModulesRecommendations(analysis: ImpactAnalysis): string[] {
    const recommendations: string[] = [];

    const directImpacts = analysis.affectedFiles.filter((f) => f.impactType === 'direct');
    if (directImpacts.length > 0) {
      recommendations.push(
        `${directImpacts.length} file(s) directly import from the changed file`
      );
    }

    const indirectImpacts = analysis.affectedFiles.filter((f) => f.impactType === 'indirect');
    if (indirectImpacts.length > 0) {
      recommendations.push(
        `${indirectImpacts.length} file(s) are indirectly affected through the dependency chain`
      );
    }

    if (analysis.impactScore > 70) {
      recommendations.push('High impact score - consider incremental rollout');
    }

    return recommendations;
  }

  /**
   * Create a custom event
   */
  async emitCustomEvent(
    eventType: EventType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    source: EventSource,
    payload: EventPayload
  ): Promise<IntelligenceEvent> {
    const event: IntelligenceEvent = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      severity,
      source,
      payload,
    };

    await this.emit(event);
    return event;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): EventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clear all listeners
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }
}

/**
 * Event listener function type
 */
export type EventListener = (event: IntelligenceEvent) => void | Promise<void>;

// Made with Bob
