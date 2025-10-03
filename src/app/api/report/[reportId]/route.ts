import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const { reportId } = params;

        if (!reportId) {
            return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
        }

        // Get report from database
        const report = await prisma.report.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        // Check if report has expired
        if (report.expiresAt && report.expiresAt < new Date()) {
            return NextResponse.json({ error: 'Report has expired' }, { status: 410 });
        }

        // Parse and return the report JSON
        const reportData = JSON.parse(report.reportJson);

        return NextResponse.json(reportData);

    } catch (error) {
        console.error('Report retrieval error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve report' },
            { status: 500 }
        );
    }
}
