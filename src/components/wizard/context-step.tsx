'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ContextStepProps {
    onNext: (data: { country: string; erp: string }) => void;
}

export function ContextStep({ onNext }: ContextStepProps) {
    const [country, setCountry] = useState('');
    const [erp, setErp] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({ country, erp });
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Tell us about your context
                </h2>
                <p className="text-gray-600 text-lg">
                    This helps us provide more accurate analysis and recommendations tailored to your region and system.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-3">
                        🌍 Country/Region
                    </label>
                    <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                    >
                        <option value="">Select your country</option>
                        <option value="AE">🇦🇪 United Arab Emirates</option>
                        <option value="SA">🇸🇦 Saudi Arabia</option>
                        <option value="MY">🇲🇾 Malaysia</option>
                        <option value="US">🇺🇸 United States</option>
                        <option value="OTHER">🌐 Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="erp" className="block text-sm font-semibold text-gray-700 mb-3">
                        💼 ERP System
                    </label>
                    <select
                        id="erp"
                        value={erp}
                        onChange={(e) => setErp(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300"
                    >
                        <option value="">Select your ERP system</option>
                        <option value="SAP">SAP</option>
                        <option value="Oracle">Oracle</option>
                        <option value="NetSuite">NetSuite</option>
                        <option value="QuickBooks">QuickBooks</option>
                        <option value="Xero">Xero</option>
                        <option value="Custom">Custom System</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="pt-6">
                    <Button type="submit" size="lg" className="w-full group">
                        Continue to Upload
                        <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Button>
                </div>
            </form>
        </div>
    );
}
