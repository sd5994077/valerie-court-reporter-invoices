import React, { useState, useEffect } from 'react';
import { MobileNavigation } from '../src/components/MobileNavigation';

interface DatabaseStatus {
  success: boolean;
  environment: string;
  database: string;
  connection: {
    status: string;
    serverTime?: string;
    error?: string;
  };
  tables: {
    count: number;
    list: string[];
    expectedTables: string[];
  };
}

export default function DatabaseAdmin() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState('');

  const checkStatus = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/db/status');
      const data = await res.json();
      setStatus(data);
      if (!data.success) {
        setMessage(`Error: ${data.error || 'Failed to connect to database'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeTables = async () => {
    if (!confirm('This will create all database tables. Continue?')) return;
    
    setInitializing(true);
    setMessage('');
    try {
      const res = await fetch('/api/db/init', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        setMessage('✅ Tables created successfully!');
        checkStatus(); // Refresh status
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const missingTables = status?.tables.expectedTables.filter(
    table => !status.tables.list.includes(table)
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation currentPage="dashboard" />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Database Administration</h1>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {status && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Connection Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Status:</span>
                    <p className={`font-semibold ${
                      status.connection.status === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {status.connection.status === 'connected' ? '✅ Connected' : '❌ Disconnected'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Environment:</span>
                    <p className="font-semibold">{status.environment}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Database:</span>
                    <p className="font-semibold capitalize">{status.database}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Server Time:</span>
                    <p className="font-semibold text-sm">{status.connection.serverTime || 'N/A'}</p>
                  </div>
                </div>
                {status.connection.error && (
                  <div className="mt-3 p-3 bg-red-50 rounded text-red-800 text-sm">
                    {status.connection.error}
                  </div>
                )}
              </div>

              {/* Tables Status */}
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Database Tables</h2>
                <div className="mb-4">
                  <span className="text-sm text-gray-600">Tables Found:</span>
                  <p className="font-semibold text-lg">
                    {status.tables.count} / {status.tables.expectedTables.length}
                  </p>
                </div>

                {missingTables.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded">
                    <p className="text-yellow-800 font-medium mb-2">Missing Tables:</p>
                    <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                      {missingTables.map(table => (
                        <li key={table}>{table}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {status.tables.list.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Existing Tables:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {status.tables.list.map(table => (
                        <div
                          key={table}
                          className="px-3 py-2 bg-green-50 text-green-800 rounded text-sm font-medium"
                        >
                          ✓ {table}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {status.tables.count === 0 && (
                  <div className="p-4 bg-gray-50 rounded text-center">
                    <p className="text-gray-600">No tables found in database</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Actions</h2>
                <div className="space-y-3">
                  {missingTables.length > 0 && (
                    <button
                      onClick={initializeTables}
                      disabled={initializing}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                      {initializing ? 'Creating Tables...' : 'Create Missing Tables'}
                    </button>
                  )}
                  
                  {status.tables.count === status.tables.expectedTables.length && (
                    <div className="p-4 bg-green-50 rounded text-center">
                      <p className="text-green-800 font-medium">✅ All tables are set up correctly!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-blue-900 mb-2">Expected Tables:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>users</strong> - User accounts and business information</li>
                  <li>• <strong>invoices</strong> - Invoice records</li>
                  <li>• <strong>line_items</strong> - Invoice line items</li>
                  <li>• <strong>invoice_sequences</strong> - Auto-numbering per user/year</li>
                  <li>• <strong>appeals</strong> - Appeal cases and deadlines</li>
                  <li>• <strong>appeal_extensions</strong> - Appeal extension requests</li>
                </ul>
              </div>
            </div>
          )}

          {!status && loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking database status...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
