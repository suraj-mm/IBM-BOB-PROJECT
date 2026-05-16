/**
 * Event Queue
 * 
 * Manages event queuing for offline clients and retry logic
 */

import { IntelligenceEvent } from '../shared/types';

export interface EventQueueConfig {
  maxSize: number;
  retryAttempts: number;
}

interface QueuedEvent {
  event: IntelligenceEvent;
  targetSubsystem: string;
  attempts: number;
  queuedAt: Date;
}

export class EventQueue {
  private queue: Map<string, QueuedEvent[]>;
  private config: EventQueueConfig;

  constructor(config: EventQueueConfig) {
    this.config = config;
    this.queue = new Map();
  }

  /**
   * Enqueue an event for a subsystem
   */
  enqueue(event: IntelligenceEvent, targetSubsystem: string): void {
    if (!this.queue.has(targetSubsystem)) {
      this.queue.set(targetSubsystem, []);
    }

    const subsystemQueue = this.queue.get(targetSubsystem)!;

    // Check queue size limit
    if (subsystemQueue.length >= this.config.maxSize) {
      // Remove oldest event
      subsystemQueue.shift();
    }

    // Add new event
    subsystemQueue.push({
      event,
      targetSubsystem,
      attempts: 0,
      queuedAt: new Date(),
    });
  }

  /**
   * Get all queued events for a subsystem
   */
  getEventsForSubsystem(subsystem: string): IntelligenceEvent[] {
    const subsystemQueue = this.queue.get(subsystem);
    if (!subsystemQueue) {
      return [];
    }

    return subsystemQueue.map(qe => qe.event);
  }

  /**
   * Clear events for a subsystem
   */
  clearEventsForSubsystem(subsystem: string): void {
    this.queue.delete(subsystem);
  }

  /**
   * Increment retry attempt for an event
   */
  incrementAttempt(event: IntelligenceEvent, subsystem: string): boolean {
    const subsystemQueue = this.queue.get(subsystem);
    if (!subsystemQueue) {
      return false;
    }

    const queuedEvent = subsystemQueue.find(qe => qe.event.eventId === event.eventId);
    if (!queuedEvent) {
      return false;
    }

    queuedEvent.attempts++;

    // Remove if max attempts reached
    if (queuedEvent.attempts >= this.config.retryAttempts) {
      const index = subsystemQueue.indexOf(queuedEvent);
      subsystemQueue.splice(index, 1);
      return false;
    }

    return true;
  }

  /**
   * Get queue size for a subsystem
   */
  getQueueSize(subsystem: string): number {
    return this.queue.get(subsystem)?.length || 0;
  }

  /**
   * Get total queue size
   */
  getTotalQueueSize(): number {
    let total = 0;
    this.queue.forEach(queue => {
      total += queue.length;
    });
    return total;
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    this.queue.clear();
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const stats: QueueStats = {
      totalEvents: this.getTotalQueueSize(),
      subsystems: {},
    };

    this.queue.forEach((queue, subsystem) => {
      stats.subsystems[subsystem] = {
        queueSize: queue.length,
        oldestEvent: queue.length > 0 ? queue[0].queuedAt : null,
        newestEvent: queue.length > 0 ? queue[queue.length - 1].queuedAt : null,
      };
    });

    return stats;
  }
}

interface QueueStats {
  totalEvents: number;
  subsystems: {
    [subsystem: string]: {
      queueSize: number;
      oldestEvent: Date | null;
      newestEvent: Date | null;
    };
  };
}

// Made with Bob