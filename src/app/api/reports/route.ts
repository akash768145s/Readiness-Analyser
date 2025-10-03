import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get recent reports
        const reports = await prisma.report.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            select: {
                id: true,
                createdAt: true,
                scoresOverall: true,
                upload: {
                    select: {
                        country: true,
                        erp: true
                    }
                }
            }
        });

        const reportsData = reports.map(report => ({
            id: report.id,
            date: report.createdAt.toISOString(),
            overallScore: report.scoresOverall,
            country: report.upload.country || 'Unknown',
            erp: report.upload.erp || 'Unknown'
        }));

        return NextResponse.json(reportsData);

    } catch (error) {
        console.error('Reports list error:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve reports' },
            { status: 500 }
        );
    }
}
