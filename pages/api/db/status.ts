import type { NextApiRequest, NextApiResponse } from 'next';
import { testConnection, checkTables } from '../../../src/lib/db';

/**
 * API endpoint to check database status
 * Returns connection status and list of existing tables
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const connectionTest = await testConnection();
    const tablesCheck = await checkTables();
    
    const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
    const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    const isStaging = databaseUrl?.includes('restless-grass');
    const isProduction = databaseUrl?.includes('divine-scene');
    
    return res.status(200).json({
      success: connectionTest.success,
      environment,
      database: isStaging ? 'staging' : isProduction ? 'production' : 'unknown',
      connection: {
        status: connectionTest.success ? 'connected' : 'disconnected',
        serverTime: connectionTest.time,
        error: connectionTest.error
      },
      tables: {
        count: tablesCheck.tables?.length || 0,
        list: tablesCheck.tables || [],
        expectedTables: [
          'users',
          'invoices',
          'line_items',
          'invoice_sequences',
          'appeals',
          'appeal_extensions'
        ]
      }
    });
  } catch (error) {
    console.error('Database status check error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
