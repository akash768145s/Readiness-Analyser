'use client';

import { useState } from 'react';
import { StepIndicator } from '@/components/wizard/step-indicator';
import { ContextStep } from '@/components/wizard/context-step';
import { UploadStep } from '@/components/wizard/upload-step';
import { ResultsStep } from '@/components/wizard/results-step';
import { GenericRow } from '@/lib/rule-validator';
import { Questionnaire } from '@/lib/scoring';

const STEPS = ['Context', 'Upload', 'Results'];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [contextData, setContextData] = useState({ country: '', erp: '' });
  const [uploadId, setUploadId] = useState('');
  const [previewData, setPreviewData] = useState<GenericRow[]>([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleContextNext = (data: { country: string; erp: string }) => {
    setContextData(data);
    setCurrentStep(1);
  };

  const handleUploadNext = (uploadId: string, preview: GenericRow[]) => {
    setUploadId(uploadId);
    setPreviewData(preview);
    setCurrentStep(2);
  };

  const handleAnalyze = async (questionnaire: Questionnaire) => {
    setAnalyzing(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId,
          questionnaire,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
            E-Invoicing Readiness Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Analyze your invoice data against the <span className="font-semibold text-blue-600">GETS v0.1 standard</span> and get actionable insights
            to improve your e-invoicing readiness.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm bg-white/80">
          <div className="transition-all duration-500 ease-in-out">
            {currentStep === 0 && (
              <ContextStep onNext={handleContextNext} />
            )}

            {currentStep === 1 && (
              <UploadStep
                onNext={handleUploadNext}
                onBack={handleBack}
                contextData={contextData}
              />
            )}

            {currentStep === 2 && (
              <ResultsStep
                onBack={handleBack}
                onAnalyze={handleAnalyze}
                previewData={previewData}
                analysisResult={analysisResult}
                analyzing={analyzing}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Built for GETS v0.1 compliance
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Reports stored for 7 days
            </span>
            <a href="/api/reports" className="text-blue-600 hover:text-blue-500 font-medium transition-colors">
              View recent reports →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}