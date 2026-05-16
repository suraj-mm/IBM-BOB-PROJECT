/**
 * Analysis Routes
 * 
 * HTTP endpoints for the Intelligence Engine
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IntelligenceEngine } from '../engine/intelligence-engine';
import { AnalyzeRequest } from '../types';
import { logger } from '../utils/logger';

export async function registerAnalysisRoutes(
  fastify: FastifyInstance,
  engine: IntelligenceEngine
): Promise<void> {
  /**
   * POST /api/analyze
   * Analyze code changes and get impact report
   */
  fastify.post<{ Body: AnalyzeRequest }>(
    '/api/analyze',
    {
      schema: {
        body: {
          type: 'object',
          required: ['repo', 'changedFiles'],
          properties: {
            repo: { type: 'string' },
            branch: { type: 'string' },
            changedFiles: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: AnalyzeRequest }>, reply: FastifyReply) => {
      try {
        logger.info('Received analysis request', request.body);

        const result = await engine.analyze(request.body);

        return reply.code(200).send(result);
      } catch (error) {
        logger.error('Error processing analysis request', error);
        return reply.code(500).send({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/stats
   * Get dependency graph statistics
   */
  fastify.get('/api/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await engine.getStats();
      return reply.code(200).send({
        success: true,
        stats,
      });
    } catch (error) {
      logger.error('Error getting stats', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/circular-dependencies
   * Find circular dependencies in the codebase
   */
  fastify.get('/api/circular-dependencies', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const cycles = await engine.findCircularDependencies();
      return reply.code(200).send({
        success: true,
        cycles,
        count: cycles.length,
      });
    } catch (error) {
      logger.error('Error finding circular dependencies', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * POST /api/rebuild-graph
   * Rebuild the entire dependency graph
   */
  fastify.post('/api/rebuild-graph', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Rebuilding dependency graph...');
      await engine.rebuildGraph();
      return reply.code(200).send({
        success: true,
        message: 'Dependency graph rebuilt successfully',
      });
    } catch (error) {
      logger.error('Error rebuilding graph', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  /**
   * GET /api/health
   * Health check endpoint
   */
  fastify.get('/api/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'backend-intelligence-engine',
    });
  });
}

// Made with Bob
