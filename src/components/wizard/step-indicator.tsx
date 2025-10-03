'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
    currentStep: number;
    steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center">
                    <div className="flex items-center">
                        <div className="relative">
                            <div
                                className={cn(
                                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 shadow-lg",
                                    index < currentStep
                                        ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white shadow-green-200"
                                        : index === currentStep
                                            ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white shadow-blue-200 scale-110"
                                            : "bg-white border-gray-300 text-gray-500 shadow-gray-100"
                                )}
                            >
                                {index < currentStep ? (
                                    <Check className="w-6 h-6" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>
                            {index === currentStep && (
                                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20"></div>
                            )}
                        </div>
                        <div className="ml-4">
                            <p
                                className={cn(
                                    "text-sm font-semibold transition-colors",
                                    index < currentStep
                                        ? "text-green-700"
                                        : index === currentStep
                                            ? "text-blue-700"
                                            : "text-gray-500"
                                )}
                            >
                                {step}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {index < currentStep ? "Completed" : index === currentStep ? "In Progress" : "Pending"}
                            </p>
                        </div>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="relative mx-6">
                            <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-500 ease-out rounded-full",
                                        index < currentStep
                                            ? "w-full bg-gradient-to-r from-green-500 to-emerald-500"
                                            : "w-0 bg-gradient-to-r from-blue-500 to-indigo-500"
                                    )}
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
