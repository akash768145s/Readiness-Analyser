'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface UploadStepProps {
    onNext: (uploadId: string, previewData: any[]) => void;
    onBack: () => void;
    contextData: { country: string; erp: string };
}

export function UploadStep({ onNext, onBack, contextData }: UploadStepProps) {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
    const [pasteText, setPasteText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file: File) => {
        setUploading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const { uploadId } = await response.json();

            // Read file content for preview
            const text = await file.text();
            const preview = await parsePreviewData(text, file.name);
            setPreviewData(preview);

            onNext(uploadId, preview);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handlePasteUpload = async () => {
        if (!pasteText.trim()) {
            setError('Please paste some data');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: pasteText,
                    country: contextData.country,
                    erp: contextData.erp,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const { uploadId } = await response.json();

            // Parse preview data
            const preview = await parsePreviewData(pasteText);
            setPreviewData(preview);

            onNext(uploadId, preview);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const parsePreviewData = async (content: string, filename?: string): Promise<any[]> => {
        const trimmedContent = content.trim();

        // First try to detect JSON by structure
        const isJSON = trimmedContent.startsWith('[') || trimmedContent.startsWith('{');

        // CSV detection - only if it's NOT JSON and has CSV characteristics
        const isCSV = !isJSON && (
            filename?.endsWith('.csv') ||
            trimmedContent.startsWith('inv_no,') ||
            (trimmedContent.includes(',') && trimmedContent.includes('\n') && trimmedContent.split('\n')[0].includes(','))
        );

        if (isJSON || (!isCSV && !filename?.endsWith('.csv'))) {
            // Parse as JSON first
            try {
                const parsed = JSON.parse(content);
                const data = Array.isArray(parsed) ? parsed : [parsed];
                return data.slice(0, 20);
            } catch {
                // If JSON parsing fails and we have CSV-like structure, try CSV
                if (trimmedContent.includes(',') && trimmedContent.includes('\n')) {
                    return parseAsCSVPreview(content);
                }
                return [];
            }
        } else {
            // Parse as CSV
            return parseAsCSVPreview(content);
        }
    };

    const parseAsCSVPreview = (content: string): any[] => {
        const lines = content.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1, 21).map(line => {
            const values = line.split(',');
            const row: any = {};
            headers.forEach((header, index) => {
                const value = values[index]?.trim() || '';
                // Try to convert numbers
                if (value && !isNaN(Number(value)) && isFinite(Number(value))) {
                    row[header] = Number(value);
                } else {
                    row[header] = value;
                }
            });
            return row;
        });
        return data;
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Upload your invoice data
                </h2>
                <p className="text-gray-600">
                    Upload a CSV or JSON file with your invoice data (max 5MB, first 200 rows will be analyzed)
                </p>
            </div>

            {/* Upload Method Toggle */}
            <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setUploadMethod('file')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${uploadMethod === 'file'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Upload File
                    </button>
                    <button
                        onClick={() => setUploadMethod('paste')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${uploadMethod === 'paste'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        Paste Data
                    </button>
                </div>
            </div>

            {uploadMethod === 'file' ? (
                <div
                    className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragActive
                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 scale-105 shadow-lg'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/30'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={handleFileInput}
                        className="hidden"
                    />

                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-all duration-300 ${dragActive
                        ? 'bg-blue-500 text-white scale-110'
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600'
                        }`}>
                        <Upload className="w-8 h-8" />
                    </div>

                    <p className="text-xl font-bold text-gray-900 mb-3">
                        Drop your file here, or{' '}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-2 transition-colors"
                        >
                            browse
                        </button>
                    </p>
                    <p className="text-gray-500 mb-4">
                        Supports CSV and JSON files up to 5MB
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                        <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            .csv
                        </span>
                        <span className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            .json
                        </span>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paste your CSV or JSON data
                        </label>
                        <textarea
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            placeholder="Paste your invoice data here..."
                            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <Button
                        onClick={handlePasteUpload}
                        disabled={uploading || !pasteText.trim()}
                        className="w-full"
                    >
                        {uploading ? 'Processing...' : 'Upload Data'}
                    </Button>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="mt-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-sm text-blue-800">Processing your data...</span>
                    </div>
                </div>
            )}

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
            </div>
        </div>
    );
}
