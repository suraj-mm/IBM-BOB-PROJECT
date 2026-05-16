/**
 * Neo4j Client Module
 * 
 * Manages connection to Neo4j database for dependency graph storage.
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { logger } from '../utils/logger';

export class Neo4jClient {
  private driver: Driver | null = null;
  private uri: string;
  private user: string;
  private password: string;

  constructor(uri: string, user: string, password: string) {
    this.uri = uri;
    this.user = user;
    this.password = password;
  }

  /**
   * Connect to Neo4j database
   */
  async connect(): Promise<void> {
    try {
      this.driver = neo4j.driver(this.uri, neo4j.auth.basic(this.user, this.password));

      // Verify connectivity
      await this.driver.verifyConnectivity();
      logger.info('Successfully connected to Neo4j');
    } catch (error) {
      logger.error('Failed to connect to Neo4j', error);
      throw error;
    }
  }

  /**
   * Get a new session
   */
  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.');
    }
    return this.driver.session();
  }

  /**
   * Execute a Cypher query
   */
  async executeQuery(query: string, parameters: Record<string, any> = {}): Promise<any[]> {
    const session = this.getSession();

    try {
      const result = await session.run(query, parameters);
      return result.records.map((record) => record.toObject());
    } catch (error) {
      logger.error('Error executing Neo4j query', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      logger.info('Neo4j connection closed');
    }
  }

  /**
   * Clear all data from the database (use with caution!)
   */
  async clearDatabase(): Promise<void> {
    const session = this.getSession();

    try {
      await session.run('MATCH (n) DETACH DELETE n');
      logger.info('Neo4j database cleared');
    } catch (error) {
      logger.error('Error clearing Neo4j database', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create indexes for better performance
   */
  async createIndexes(): Promise<void> {
    const session = this.getSession();

    try {
      // Create index on file path
      await session.run('CREATE INDEX file_path_index IF NOT EXISTS FOR (f:File) ON (f.path)');

      // Create index on function name
      await session.run('CREATE INDEX function_name_index IF NOT EXISTS FOR (fn:Function) ON (fn.name)');

      // Create index on class name
      await session.run('CREATE INDEX class_name_index IF NOT EXISTS FOR (c:Class) ON (c.name)');

      // Create index on interface name
      await session.run('CREATE INDEX interface_name_index IF NOT EXISTS FOR (i:Interface) ON (i.name)');

      logger.info('Neo4j indexes created successfully');
    } catch (error) {
      logger.error('Error creating Neo4j indexes', error);
      throw error;
    } finally {
      await session.close();
    }
  }
}

// Made with Bob
