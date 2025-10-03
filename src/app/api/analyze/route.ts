import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapFields } from '@/lib/field-mapper';
import { validateRules } from '@/lib/rule-validator';
import { calculateScores, Questionnaire } from '@/lib/scoring';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { uploadId, questionnaire } = body;

        if (!uploadId) {
            return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 });
        }

        if (!questionnaire) {
            return NextResponse.json({ error: 'Questionnaire is required' }, { status: 400 });
        }

        // Get upload data
        const upload = await prisma.upload.findUnique({
            where: { id: uploadId }
        });

        if (!upload) {
            return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
        }

        // Parse the stored data
        const data = JSON.parse(upload.rawRef || '[]');

        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: 'No data to analyze' }, { status: 400 });
        }

        // Perform analysis
        const startTime = Date.now();

        // 1. Field mapping and coverage analysis
        const coverage = mapFields(data);

        // 2. Rule validation
        const ruleFindings = validateRules(data);

        // 3. Calculate scores
        const scores = calculateScores(data, coverage, ruleFindings, questionnaire as Questionnaire);

        // 4. Generate gaps summary
        const gaps: string[] = [];

        // Add missing fields to gaps
        coverage.missing.forEach(field => {
            gaps.push(`Missing ${field}`);
        });

        // Add rule failures to gaps
        ruleFindings.forEach(finding => {
            if (!finding.ok) {
                switch (finding.rule) {
                    case 'CURRENCY_ALLOWED':
                        gaps.push(`Invalid currency ${finding.value}`);
                        break;
                    case 'DATE_ISO':
                        gaps.push(`Invalid date format: ${finding.value}`);
                        break;
                    case 'LINE_MATH':
                        gaps.push(`Line math error on row ${finding.exampleLine}`);
                        break;
                    case 'TOTALS_BALANCE':
                        gaps.push('Total balance calculation error');
                        break;
                    case 'TRN_PRESENT':
                        gaps.push('Missing TRN information');
                        break;
                }
            }
        });

        // Count total lines (including nested line items)
        let linesTotal = 0;
        data.forEach(row => {
            if (Array.isArray(row.lines)) {
                linesTotal += row.lines.length;
            } else {
                linesTotal += 1; // Flat structure counts as 1 line
            }
        });

        const analysisTime = Date.now() - startTime;
        console.log(`Analysis completed in ${analysisTime}ms`);

        // Create report
        const reportData = {
            reportId: '', // Will be set after creation
            scores,
            coverage,
            ruleFindings,
            gaps,
            meta: {
                rowsParsed: data.length,
                linesTotal,
                country: upload.country || 'Unknown',
                erp: upload.erp || 'Unknown',
                db: 'sqlite'
            }
        };

        // Save report to database
        const report = await prisma.report.create({
            data: {
                uploadId: upload.id,
                scoresOverall: scores.overall,
                reportJson: JSON.stringify(reportData),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
        });

        // Update report with its ID
        reportData.reportId = report.id;
        await prisma.report.update({
            where: { id: report.id },
            data: { reportJson: JSON.stringify(reportData) }
        });

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze data' },
            { status: 500 }
        );
    }
}
