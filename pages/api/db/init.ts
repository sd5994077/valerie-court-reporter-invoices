import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeTables, checkTables, testConnection } from '../../../src/lib/db';

/**
 * API endpoint to initialize database tables
 * GET: Check existing tables and connection
 * POST: Create all tables
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Check connection and existing tables
      const connectionTest = await testConnection();
      const tablesCheck = await checkTables();

      return res.status(200).json({
        connection: connectionTest,
        tables: tablesCheck,
        message: connectionTest.success
          ? 'Database connection successful'
          : 'Database connection failed'
      });
    }

    if (req.method === 'POST') {
      // Initialize all tables
      const result = await initializeTables();

      if (result.success) {
        const tablesCheck = await checkTables();
        return res.status(200).json({
          success: true,
          message: result.message,
          tables: tablesCheck.tables
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
