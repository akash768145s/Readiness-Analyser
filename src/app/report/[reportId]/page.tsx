'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, XCircle } from 'lucide-react';
import type { Scores } from '@/lib/scoring';
import type { CoverageResult, FieldMapping } from '@/lib/field-mapper';
import type { RuleFinding } from '@/lib/rule-validator';

interface ReportMeta {
    rowsParsed: number;
    linesTotal: number;
    country: string;
    erp: string;
}

interface Report {
    reportId: string;
    scores: Scores;
    coverage: CoverageResult;
    ruleFindings: RuleFinding[];
    gaps?: string[];
    meta: ReportMeta;
}

export default function ReportPage() {
    const params = useParams();
    const reportId = params.reportId as string;
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!reportId) return;
        const run = async () => {
            try {
                const response = await fetch(`/api/report/${reportId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch report');
                }
                const data = await response.json() as Report;
                setReport(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load report');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [reportId]);

    const handleDownload = () => {
        if (!report) return;

        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `readiness-report-${report.reportId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getReadinessLabel = (score: number) => {
        if (score >= 80) return { label: 'High', color: 'bg-green-100 text-green-800' };
        if (score >= 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Low', color: 'bg-red-100 text-red-800' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button onClick={() => window.location.href = '/'}>
                        Go Home
                    </Button>
                </div>
            </div>
        );
    }

    if (!report) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        E-Invoicing Readiness Report
                    </h1>
                    <p className="text-gray-600">
                        Report ID: {report.reportId} • Generated: {new Date().toLocaleDateString()}
                    </p>
                </div>

                {/* Overall Score */}
                <div className="bg-white border rounded-lg p-6 mb-8">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900 mb-4">
                            {report.scores.overall}%
                        </div>
                        <Badge className={`text-lg px-4 py-2 ${getReadinessLabel(report.scores.overall).color}`}>
                            {getReadinessLabel(report.scores.overall).label} Readiness
                        </Badge>
                        <div className="mt-4">
                            <Button onClick={handleDownload} className="flex items-center mx-auto">
                                <Download className="h-4 w-4 mr-2" />
                                Download Full Report
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { name: 'Data Quality', score: report.scores.data, weight: '25%' },
                        { name: 'Field Coverage', score: report.scores.coverage, weight: '35%' },
                        { name: 'Rule Compliance', score: report.scores.rules, weight: '30%' },
                        { name: 'Technical Posture', score: report.scores.posture, weight: '10%' }
                    ].map((item) => (
                        <div key={item.name} className="bg-white border rounded-lg p-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-gray-900 mb-2">{item.score}%</div>
                                <div className="text-sm font-medium text-gray-700 mb-1">{item.name}</div>
                                <div className="text-xs text-gray-500 mb-3">Weight: {item.weight}</div>
                                <div className="bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${item.score}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Coverage Panel */}
                <div className="bg-white border rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Field Coverage Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-green-700 mb-4">
                                ✅ Matched Fields ({report.coverage.matched.length})
                            </h3>
                            <div className="space-y-2">
                                {report.coverage.matched.map((field: string) => (
                                    <Badge key={field} className="bg-green-100 text-green-800 block text-center">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-yellow-700 mb-4">
                                ⚠️ Close Matches ({report.coverage.close.length})
                            </h3>
                            <div className="space-y-2">
                                {report.coverage.close.map((item: FieldMapping) => (
                                    <div key={item.target} className="text-sm">
                                        <Badge className="bg-yellow-100 text-yellow-800 block text-center mb-1">
                                            {item.target}
                                        </Badge>
                                        <p className="text-gray-600 text-xs text-center">
                                            Candidate: {item.candidate} ({Math.round(item.confidence * 100)}% match)
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-red-700 mb-4">
                                ❌ Missing Fields ({report.coverage.missing.length})
                            </h3>
                            <div className="space-y-2">
                                {report.coverage.missing.map((field: string) => (
                                    <Badge key={field} className="bg-red-100 text-red-800 block text-center">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rule Findings */}
                <div className="bg-white border rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Rule Validation Results</h2>
                    <div className="space-y-4">
                        {report.ruleFindings.map((finding: RuleFinding) => (
                            <div key={finding.rule} className="flex items-start justify-between p-4 border rounded-lg">
                                <div className="flex items-start">
                                    {finding.ok ? (
                                        <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-0.5" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-500 mr-4 mt-0.5" />
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-900 text-lg">{finding.rule}</div>
                                        {!finding.ok && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                {finding.exampleLine && (
                                                    <div>❌ Error on line {finding.exampleLine}</div>
                                                )}
                                                {finding.value && (
                                                    <div>❌ Invalid value: <code className="bg-gray-100 px-1 rounded">{finding.value}</code></div>
                                                )}
                                                {finding.expected && finding.got && (
                                                    <div>❌ Expected: <code className="bg-gray-100 px-1 rounded">{finding.expected}</code>, Got: <code className="bg-gray-100 px-1 rounded">{finding.got}</code></div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Badge className={`text-lg px-3 py-1 ${finding.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {finding.ok ? 'PASS' : 'FAIL'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gaps Summary */}
                {report.gaps && report.gaps.length > 0 && (
                    <div className="bg-white border rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Key Issues to Address</h2>
                        <div className="space-y-3">
                            {report.gaps.map((gap: string, index: number) => (
                                <div key={index} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-500 mr-3" />
                                    <span className="text-red-800">{gap}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Metadata */}
                <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Analysis Metadata</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="font-medium text-gray-700">Rows Analyzed</div>
                            <div className="text-gray-900">{report.meta.rowsParsed}</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-700">Total Line Items</div>
                            <div className="text-gray-900">{report.meta.linesTotal}</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-700">Country</div>
                            <div className="text-gray-900">{report.meta.country}</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-700">ERP System</div>
                            <div className="text-gray-900">{report.meta.erp}</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <Button onClick={() => window.location.href = '/'} variant="outline">
                        Analyze Another Dataset
                    </Button>
                </div>
            </div>
        </div>
    );
}
