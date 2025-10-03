'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataPreview } from '@/components/data-preview';
import { Download, Share2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ResultsStepProps {
    onBack: () => void;
    onAnalyze: (questionnaire: any) => void;
    previewData: any[];
    analysisResult?: any;
    analyzing: boolean;
}

export function ResultsStep({
    onBack,
    onAnalyze,
    previewData,
    analysisResult,
    analyzing
}: ResultsStepProps) {
    const [questionnaire, setQuestionnaire] = useState({
        webhooks: false,
        sandbox_env: false,
        retries: false
    });

    const handleAnalyze = () => {
        onAnalyze(questionnaire);
    };

    const handleDownload = () => {
        if (!analysisResult) return;

        const blob = new Blob([JSON.stringify(analysisResult, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `readiness-report-${analysisResult.reportId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShare = async () => {
        if (!analysisResult) return;

        const shareUrl = `${window.location.origin}/report/${analysisResult.reportId}`;

        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Share link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy link:', err);
            prompt('Copy this link:', shareUrl);
        }
    };

    const getReadinessLabel = (score: number) => {
        if (score >= 80) return { label: 'High', color: 'bg-green-100 text-green-800' };
        if (score >= 60) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { label: 'Low', color: 'bg-red-100 text-red-800' };
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Analysis Results
                </h2>
                <p className="text-gray-600">
                    Review your invoice data readiness and download the detailed report
                </p>
            </div>

            {/* Data Preview */}
            <div className="mb-8">
                <DataPreview data={previewData} />
            </div>

            {/* Questionnaire */}
            {!analysisResult && (
                <div className="bg-white border rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Technical Readiness Questions
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={questionnaire.webhooks}
                                onChange={(e) => setQuestionnaire(prev => ({ ...prev, webhooks: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Do you support webhook notifications?
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={questionnaire.sandbox_env}
                                onChange={(e) => setQuestionnaire(prev => ({ ...prev, sandbox_env: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Do you have a sandbox/testing environment?
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={questionnaire.retries}
                                onChange={(e) => setQuestionnaire(prev => ({ ...prev, retries: e.target.checked }))}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">
                                Do you implement retry logic for failed requests?
                            </span>
                        </label>
                    </div>
                    <div className="mt-6">
                        <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
                            {analyzing ? 'Analyzing...' : 'Analyze Data'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Analysis Results */}
            {analysisResult && (
                <div className="space-y-8">
                    {/* Overall Score */}
                    <div className="bg-white border rounded-lg p-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-gray-900 mb-2">
                                {analysisResult.scores.overall}%
                            </div>
                            <Badge className={getReadinessLabel(analysisResult.scores.overall).color}>
                                {getReadinessLabel(analysisResult.scores.overall).label} Readiness
                            </Badge>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Data Quality', score: analysisResult.scores.data, weight: '25%' },
                            { name: 'Field Coverage', score: analysisResult.scores.coverage, weight: '35%' },
                            { name: 'Rule Compliance', score: analysisResult.scores.rules, weight: '30%' },
                            { name: 'Technical Posture', score: analysisResult.scores.posture, weight: '10%' }
                        ].map((item) => (
                            <div key={item.name} className="bg-white border rounded-lg p-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900">{item.score}%</div>
                                    <div className="text-sm font-medium text-gray-700">{item.name}</div>
                                    <div className="text-xs text-gray-500">Weight: {item.weight}</div>
                                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Coverage Panel */}
                    <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Field Coverage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-green-700 mb-2">
                                    Matched ({analysisResult.coverage.matched.length})
                                </h4>
                                <div className="space-y-1">
                                    {analysisResult.coverage.matched.slice(0, 5).map((field: string) => (
                                        <Badge key={field} className="bg-green-100 text-green-800 text-xs">
                                            {field}
                                        </Badge>
                                    ))}
                                    {analysisResult.coverage.matched.length > 5 && (
                                        <div className="text-xs text-gray-500">
                                            +{analysisResult.coverage.matched.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-yellow-700 mb-2">
                                    Close Match ({analysisResult.coverage.close.length})
                                </h4>
                                <div className="space-y-1">
                                    {analysisResult.coverage.close.slice(0, 5).map((item: any) => (
                                        <Badge key={item.target} className="bg-yellow-100 text-yellow-800 text-xs">
                                            {item.target} ({Math.round(item.confidence * 100)}%)
                                        </Badge>
                                    ))}
                                    {analysisResult.coverage.close.length > 5 && (
                                        <div className="text-xs text-gray-500">
                                            +{analysisResult.coverage.close.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-red-700 mb-2">
                                    Missing ({analysisResult.coverage.missing.length})
                                </h4>
                                <div className="space-y-1">
                                    {analysisResult.coverage.missing.slice(0, 5).map((field: string) => (
                                        <Badge key={field} className="bg-red-100 text-red-800 text-xs">
                                            {field}
                                        </Badge>
                                    ))}
                                    {analysisResult.coverage.missing.length > 5 && (
                                        <div className="text-xs text-gray-500">
                                            +{analysisResult.coverage.missing.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rule Findings */}
                    <div className="bg-white border rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Rule Validation Results</h3>
                        <div className="space-y-3">
                            {analysisResult.ruleFindings.map((finding: any) => (
                                <div key={finding.rule} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center">
                                        {finding.ok ? (
                                            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500 mr-3" />
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-900">{finding.rule}</div>
                                            {!finding.ok && (
                                                <div className="text-sm text-gray-600">
                                                    {finding.exampleLine && `Line ${finding.exampleLine}: `}
                                                    {finding.value && `Invalid value: ${finding.value}`}
                                                    {finding.expected && finding.got &&
                                                        `Expected: ${finding.expected}, Got: ${finding.got}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Badge className={finding.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {finding.ok ? 'PASS' : 'FAIL'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-center space-x-4">
                        <Button onClick={handleDownload} className="flex items-center">
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                        </Button>
                        <Button onClick={handleShare} variant="outline" className="flex items-center">
                            <Share2 className="h-4 w-4 mr-2" />
                            Copy Share Link
                        </Button>
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
