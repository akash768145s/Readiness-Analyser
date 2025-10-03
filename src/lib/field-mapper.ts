import { GETS_SCHEMA, GETSField } from './gets-schema';

export interface FieldMapping {
    target: string;
    candidate: string;
    confidence: number;
}

export interface CoverageResult {
    matched: string[];
    close: FieldMapping[];
    missing: string[];
}

// Normalize field names for comparison
function normalizeFieldName(name: string): string {
    return name.toLowerCase()
        .replace(/[_\s-]/g, '')
        .replace(/\[.*?\]/g, ''); // Remove array notation
}

// Calculate string similarity using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    const maxLen = Math.max(str1.length, str2.length);
    return maxLen === 0 ? 1 : (maxLen - matrix[str2.length][str1.length]) / maxLen;
}

// Check if field types are compatible
function areTypesCompatible(getsType: string, inferredType: string): boolean {
    const typeMap: Record<string, string[]> = {
        'string': ['string', 'text'],
        'number': ['number', 'integer', 'float', 'decimal'],
        'date': ['date', 'datetime', 'string'], // dates might be strings
        'enum': ['string', 'text']
    };

    return typeMap[getsType]?.includes(inferredType) || false;
}

// Infer type from sample values
function inferFieldType(values: any[]): string {
    const nonNullValues = values.filter(v => v != null && v !== '');
    if (nonNullValues.length === 0) return 'string';

    const sample = nonNullValues.slice(0, 10); // Check first 10 non-null values

    // Check if all are numbers
    if (sample.every(v => !isNaN(Number(v)) && isFinite(Number(v)))) {
        return 'number';
    }

    // Check if looks like dates
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (sample.some(v => typeof v === 'string' && datePattern.test(v))) {
        return 'date';
    }

    return 'string';
}

export function mapFields(data: any[]): CoverageResult {
    if (!data || data.length === 0) {
        return {
            matched: [],
            close: [],
            missing: GETS_SCHEMA.map(field => field.path)
        };
    }

    // Get all possible field names from the data
    const dataFields = new Set<string>();
    data.forEach(row => {
        if (typeof row === 'object' && row !== null) {
            // Handle flat structure
            Object.keys(row).forEach(key => dataFields.add(key));

            // Handle nested lines array
            if (Array.isArray(row.lines)) {
                row.lines.forEach((line: any) => {
                    if (typeof line === 'object' && line !== null) {
                        Object.keys(line).forEach(key => dataFields.add(`lines[].${key}`));
                    }
                });
            }
        }
    });

    const matched: string[] = [];
    const close: FieldMapping[] = [];
    const missing: string[] = [];

    // For each GETS field, try to find a match
    for (const getsField of GETS_SCHEMA) {
        let bestMatch: FieldMapping | null = null;
        let exactMatch = false;

        for (const dataField of dataFields) {
            const normalizedGets = normalizeFieldName(getsField.path);
            const normalizedData = normalizeFieldName(dataField);

            // Check for exact match after normalization
            if (normalizedGets === normalizedData) {
                matched.push(getsField.path);
                exactMatch = true;
                break;
            }

            // Check for partial matches
            const similarity = calculateSimilarity(normalizedGets, normalizedData);
            const containsMatch = normalizedGets.includes(normalizedData) || normalizedData.includes(normalizedGets);

            if (similarity > 0.6 || containsMatch) {
                // Get sample values to check type compatibility
                const sampleValues = data.slice(0, 10).map(row => {
                    if (dataField.startsWith('lines[].')) {
                        const lineField = dataField.replace('lines[].', '');
                        return row.lines?.[0]?.[lineField];
                    }
                    return row[dataField];
                });

                const inferredType = inferFieldType(sampleValues);
                if (areTypesCompatible(getsField.type, inferredType)) {
                    const confidence = containsMatch ? Math.max(similarity, 0.8) : similarity;

                    if (!bestMatch || confidence > bestMatch.confidence) {
                        bestMatch = {
                            target: getsField.path,
                            candidate: dataField,
                            confidence: Math.round(confidence * 100) / 100
                        };
                    }
                }
            }
        }

        if (!exactMatch) {
            if (bestMatch && bestMatch.confidence > 0.6) {
                close.push(bestMatch);
            } else {
                missing.push(getsField.path);
            }
        }
    }

    return { matched, close, missing };
}
