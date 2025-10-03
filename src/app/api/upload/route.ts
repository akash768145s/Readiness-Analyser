import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type');

        let data: any[] = [];
        let country = '';
        let erp = '';

        if (contentType?.includes('multipart/form-data')) {
            // Handle file upload
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
            }

            const text = await file.text();
            data = await parseFileContent(text, file.name);

        } else if (contentType?.includes('application/json')) {
            // Handle JSON body
            const body = await request.json();

            if (!body.text) {
                return NextResponse.json({ error: 'No text content provided' }, { status: 400 });
            }

            data = await parseFileContent(body.text);
            country = body.country || '';
            erp = body.erp || '';

        } else {
            return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
        }

        // Limit to first 200 rows
        const limitedData = data.slice(0, 200);

        // Create upload record
        const upload = await prisma.upload.create({
            data: {
                country,
                erp,
                rowsParsed: limitedData.length,
                piiMasked: false,
                rawRef: JSON.stringify(limitedData) // Store the parsed data
            }
        });

        return NextResponse.json({ uploadId: upload.id });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process upload' },
            { status: 500 }
        );
    }
}

async function parseFileContent(content: string, filename?: string): Promise<any[]> {
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
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            // If JSON parsing fails and we have a CSV-like structure, try CSV
            if (trimmedContent.includes(',') && trimmedContent.includes('\n')) {
                console.log('JSON parsing failed, trying CSV...');
                return parseAsCSV(content);
            }
            throw new Error('Invalid JSON format');
        }
    } else {
        // Parse as CSV
        return parseAsCSV(content);
    }
}

function parseAsCSV(content: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            delimiter: ',',
            transform: (value: string) => {
                // Try to convert numeric strings to numbers
                if (value && !isNaN(Number(value)) && isFinite(Number(value))) {
                    return Number(value);
                }
                return value;
            },
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parse warnings:', results.errors);
                }
                resolve(results.data as any[]);
            },
            error: (error) => {
                reject(new Error(`CSV parsing failed: ${error.message}`));
            }
        });
    });
}
