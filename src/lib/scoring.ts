import { CoverageResult } from './field-mapper';
import { RuleFinding } from './rule-validator';
import { GETS_SCHEMA } from './gets-schema';

export interface Scores {
    data: number;
    coverage: number;
    rules: number;
    posture: number;
    overall: number;
}

export interface Questionnaire {
    webhooks: boolean;
    sandbox_env: boolean;
    retries: boolean;
}

export function calculateScores(
    data: any[],
    coverage: CoverageResult,
    ruleFindings: RuleFinding[],
    questionnaire: Questionnaire
): Scores {
    // Data Score (25%) - share of rows parsed and basic type inference success
    const dataScore = calculateDataScore(data);

    // Coverage Score (35%) - matched required fields vs GETS
    const coverageScore = calculateCoverageScore(coverage);

    // Rules Score (30%) - equality-weighted across the 5 checks
    const rulesScore = calculateRulesScore(ruleFindings);

    // Posture Score (10%) - from questionnaire scaled to 0-100
    const postureScore = calculatePostureScore(questionnaire);

    // Overall Score - weighted sum
    const overall = Math.round(
        dataScore * 0.25 +
        coverageScore * 0.35 +
        rulesScore * 0.30 +
        postureScore * 0.10
    );

    return {
        data: dataScore,
        coverage: coverageScore,
        rules: rulesScore,
        posture: postureScore,
        overall
    };
}

function calculateDataScore(data: any[]): number {
    if (!data || data.length === 0) return 0;

    let totalFields = 0;
    let successfulFields = 0;

    for (const row of data.slice(0, 200)) { // Limit to first 200 rows
        if (typeof row === 'object' && row !== null) {
            const fields = Object.keys(row);
            totalFields += fields.length;

            // Count fields that have valid, non-empty values
            for (const field of fields) {
                const value = row[field];
                if (value !== null && value !== undefined && value !== '') {
                    // Additional type validation
                    if (field.includes('date') || field.includes('Date')) {
                        // Check if date-like fields are properly formatted
                        if (typeof value === 'string' && (
                            /^\d{4}-\d{2}-\d{2}/.test(value) ||
                            /^\d{4}\/\d{2}\/\d{2}/.test(value)
                        )) {
                            successfulFields++;
                        }
                    } else if (field.includes('total') || field.includes('amount') || field.includes('price') || field.includes('qty')) {
                        // Check if numeric fields are actually numbers
                        if (!isNaN(Number(value)) && isFinite(Number(value))) {
                            successfulFields++;
                        }
                    } else {
                        // For other fields, just check they're not empty
                        successfulFields++;
                    }
                }
            }

            // Handle nested lines array
            if (Array.isArray(row.lines)) {
                for (const line of row.lines) {
                    if (typeof line === 'object' && line !== null) {
                        const lineFields = Object.keys(line);
                        totalFields += lineFields.length;

                        for (const field of lineFields) {
                            const value = line[field];
                            if (value !== null && value !== undefined && value !== '') {
                                successfulFields++;
                            }
                        }
                    }
                }
            }
        }
    }

    return totalFields > 0 ? Math.round((successfulFields / totalFields) * 100) : 0;
}

function calculateCoverageScore(coverage: CoverageResult): number {
    const requiredFields = GETS_SCHEMA.filter(field => field.required);
    const totalRequired = requiredFields.length;

    if (totalRequired === 0) return 100;

    // Weight different field categories
    const weights = {
        'invoice.': 1.2,  // Header fields slightly higher weight
        'seller.': 1.1,   // Seller fields slightly higher weight  
        'buyer.': 1.1,    // Buyer fields slightly higher weight
        'lines[].': 1.0   // Line fields normal weight
    };

    let totalWeight = 0;
    let matchedWeight = 0;
    let closeWeight = 0;

    for (const field of requiredFields) {
        let weight = 1.0;
        for (const [prefix, w] of Object.entries(weights)) {
            if (field.path.startsWith(prefix)) {
                weight = w;
                break;
            }
        }

        totalWeight += weight;

        if (coverage.matched.includes(field.path)) {
            matchedWeight += weight;
        } else if (coverage.close.some(c => c.target === field.path)) {
            // Close matches get partial credit based on confidence
            const closeMatch = coverage.close.find(c => c.target === field.path);
            if (closeMatch) {
                closeWeight += weight * closeMatch.confidence;
            }
        }
    }

    const score = totalWeight > 0 ? ((matchedWeight + closeWeight) / totalWeight) * 100 : 0;
    return Math.round(score);
}

function calculateRulesScore(ruleFindings: RuleFinding[]): number {
    if (ruleFindings.length === 0) return 0;

    const passedRules = ruleFindings.filter(finding => finding.ok).length;
    return Math.round((passedRules / ruleFindings.length) * 100);
}

function calculatePostureScore(questionnaire: Questionnaire): number {
    const answers = [questionnaire.webhooks, questionnaire.sandbox_env, questionnaire.retries];
    const positiveAnswers = answers.filter(answer => answer).length;

    return Math.round((positiveAnswers / answers.length) * 100);
}

export function getReadinessLabel(overallScore: number): string {
    if (overallScore >= 80) return 'High';
    if (overallScore >= 60) return 'Medium';
    return 'Low';
}
