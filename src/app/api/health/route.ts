import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`;

        // Get some basic stats
        const uploadCount = await prisma.upload.count();
        const reportCount = await prisma.report.count();
        const activeReports = await prisma.report.count({
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                type: 'sqlite',
                status: 'connected',
                stats: {
                    totalUploads: uploadCount,
                    totalReports: reportCount,
                    activeReports: activeReports
                }
            },
            version: '1.0.0'
        });

    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: {
                    type: 'sqlite',
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                version: '1.0.0'
            },
            { status: 503 }
        );
    }
}
