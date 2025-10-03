'use client';

import { Badge } from '@/components/ui/badge';

interface DataPreviewProps {
    data: any[];
    loading?: boolean;
}

export function DataPreview({ data, loading }: DataPreviewProps) {
    if (loading) {
        return (
            <div className="border rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="border rounded-lg p-6 text-center text-gray-500">
                No data to preview
            </div>
        );
    }

    // Get all unique keys from the first few rows
    const allKeys = new Set<string>();
    data.slice(0, 5).forEach(row => {
        if (typeof row === 'object' && row !== null) {
            Object.keys(row).forEach(key => {
                if (key !== 'lines') { // Handle lines separately
                    allKeys.add(key);
                }
            });

            // Add line item keys
            if (Array.isArray(row.lines) && row.lines.length > 0) {
                Object.keys(row.lines[0]).forEach(key => {
                    allKeys.add(`lines[].${key}`);
                });
            }
        }
    });

    const columns = Array.from(allKeys).slice(0, 8); // Limit columns for display

    const inferType = (value: any): string => {
        if (value === null || value === undefined || value === '') return 'empty';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
            if (!isNaN(Number(value)) && isFinite(Number(value))) return 'number';
            return 'text';
        }
        return 'text';
    };

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'number': return 'bg-blue-100 text-blue-800';
            case 'date': return 'bg-green-100 text-green-800';
            case 'text': return 'bg-gray-100 text-gray-800';
            case 'empty': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getValue = (row: any, column: string): any => {
        if (column.startsWith('lines[].')) {
            const lineField = column.replace('lines[].', '');
            return row.lines?.[0]?.[lineField] || '';
        }
        return row[column] || '';
    };

    const displayRows = data.slice(0, 20);

    return (
        <div className="border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg bg-white">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                            Data Preview
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Showing first <span className="font-semibold text-blue-600">{displayRows.length}</span> rows of <span className="font-semibold text-blue-600">{data.length}</span> total rows
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600 font-medium">Live Preview</span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column}
                                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider"
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {displayRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-blue-50/30 transition-colors duration-150">
                                {columns.map((column) => {
                                    const value = getValue(row, column);
                                    const type = inferType(value);

                                    return (
                                        <td key={column} className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-3">
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs font-semibold px-2 py-1 rounded-full ${getTypeColor(type)}`}
                                                >
                                                    {type}
                                                </Badge>
                                                <span className="text-sm text-gray-900 font-medium truncate max-w-32">
                                                    {String(value)}
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
