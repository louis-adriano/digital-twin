'use client';

import { useState, useEffect } from 'react';

interface Table {
  schema: string;
  name: string;
  rowCount: number;
}

interface TableData {
  table: string;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string;
  }>;
  rows: Record<string, unknown>[];
  totalShown: number;
  limit: number;
}

interface ValidationResult {
  check: string;
  status: 'PASS' | 'FAIL';
  count: string;
}

export default function DatabasePage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [validation, setValidation] = useState<ValidationResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/database?action=tables');
      if (!response.ok) throw new Error('Failed to load tables');
      
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string, limit: number = 50) => {
    try {
      setDataLoading(true);
      setSelectedTable(tableName);
      
      const response = await fetch(`/api/admin/database?action=data&table=${tableName}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to load table data');
      
      const data = await response.json();
      setTableData(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load table data');
    } finally {
      setDataLoading(false);
    }
  };

  const validateDatabase = async () => {
    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' }),
      });

      if (!response.ok) throw new Error('Validation failed');
      
      const result = await response.json();
      setValidation(result.validation || []);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Validation failed');
    }
  };

  const backupDatabase = async () => {
    try {
      if (!confirm('Start database backup? This may take a while.')) return;

      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'backup' }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Backup failed');
      }

      alert(result.message || 'Backup completed successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Backup failed');
    }
  };

  const formatValue = (value: unknown) => {
    if (value === null) return 'NULL';
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-8"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground mb-3">Database Inspector</h1>
        <p className="text-muted-foreground font-sans mb-6">View and validate your PostgreSQL database tables. Click any table to see its data.</p>
        
        <div className="flex gap-3">
          <button
            onClick={validateDatabase}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-sans font-medium transition-colors"
          >
            Validate Data
          </button>
          <button
            onClick={loadTables}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-sans font-medium transition-colors"
          >
            Refresh Tables
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-6">
          <h3 className="font-sans font-semibold text-red-800 mb-1">Error Loading Database</h3>
          <p className="text-red-700 font-sans text-sm mb-3">{error}</p>
          <button
            onClick={loadTables}
            className="px-4 py-2 bg-red-600 text-white rounded font-sans text-sm hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Validation Results */}
      {validation && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-2">Validation Results</h2>
          <p className="text-sm text-muted-foreground font-sans mb-4">Checks for data integrity issues (orphaned records, broken relationships)</p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validation.map((result, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.check}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        result.status === 'PASS' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tables List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-2">Tables</h2>
          <p className="text-xs text-muted-foreground font-sans mb-4">Click to view contents</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => loadTableData(table.name)}
                className={`w-full text-left p-3 rounded-md border transition-colors ${
                  selectedTable === table.name
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{table.name}</span>
                  <span className="text-sm text-gray-500">{table.rowCount} rows</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Table Data */}
        <div className="lg:col-span-2">
          {selectedTable && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-serif font-semibold text-foreground">
                    {selectedTable}
                  </h2>
                  <p className="text-xs text-muted-foreground font-sans mt-1">Table contents (read-only view)</p>
                </div>
                {tableData && (
                  <span className="text-sm text-gray-500">
                    Showing {tableData.totalShown} of {tableData.limit} max rows
                  </span>
                )}
              </div>

              {dataLoading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-32 bg-gray-300 rounded"></div>
                </div>
              ) : tableData ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableData.columns.map((column) => (
                          <th
                            key={column.column_name}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {column.column_name}
                            <br />
                            <span className="text-xs text-gray-400">
                              {column.data_type}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableData.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {tableData.columns.map((column) => (
                            <td
                              key={column.column_name}
                              className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                            >
                              {formatValue(row[column.column_name])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a table to view its data</p>
                </div>
              )}
            </div>
          )}

          {!selectedTable && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <p className="text-muted-foreground font-sans">Select a table to view its data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}