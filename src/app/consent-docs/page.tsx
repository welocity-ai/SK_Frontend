'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Cloud, CreditCard, ArrowRight, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/shared/ui/Navbar';

function ConsentDocsContent() {
  const [selected, setSelected] = useState<'digilocker' | 'aadhaar' | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleContinue = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (selected === 'digilocker') {
      router.push(`/select-docs?${params.toString()}`);
    } else if (selected === 'aadhaar') {
      router.push(`/aadhaar-kyc?${params.toString()}`);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 pt-32 pb-12">
        <div className="w-full max-w-xl">

          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 space-y-8 border border-slate-100">

            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                How would you like to complete KYC?
              </h1>
              <p className="text-slate-500 text-base">
                Choose a verification method to proceed.
              </p>
            </div>

            {/* Options */}
            <div className="space-y-4">

              {/* DigiLocker Option */}
              <div
                onClick={() => setSelected('digilocker')}
                className={`group relative border-2 rounded-2xl p-5 transition-all cursor-pointer ${
                  selected === 'digilocker' 
                    ? 'border-orange-600 bg-orange-50 shadow-md shadow-orange-100' 
                    : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected === 'digilocker' ? 'bg-orange-600' : 'bg-orange-50'
                  }`}>
                    <Cloud className={`w-6 h-6 ${selected === 'digilocker' ? 'text-white' : 'text-orange-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-900 text-lg">KYC through DigiLocker</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Instantly verify using your official government DigiLocker account.
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    selected === 'digilocker' ? 'bg-orange-600 border-orange-600' : 'border-slate-200'
                  }`}>
                    {selected === 'digilocker' && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>

              {/* Aadhaar Number Option */}
              <div
                onClick={() => setSelected('aadhaar')}
                className={`group relative border-2 rounded-2xl p-5 transition-all cursor-pointer ${
                  selected === 'aadhaar' 
                    ? 'border-orange-600 bg-orange-50 shadow-md shadow-orange-100' 
                    : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    selected === 'aadhaar' ? 'bg-orange-600' : 'bg-orange-50'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${selected === 'aadhaar' ? 'text-white' : 'text-orange-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-900 text-lg">KYC through Aadhaar Number</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Enter your Aadhaar number and verify via official OTP.
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    selected === 'aadhaar' ? 'bg-orange-600 border-orange-600' : 'border-slate-200'
                  }`}>
                    {selected === 'aadhaar' && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div>
              <button
                onClick={handleContinue}
                disabled={!selected}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg ${
                  !selected
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-orange-600 hover:bg-orange-700 text-white hover:-translate-y-0.5'
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-slate-600">100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-slate-600">Govt. Verified</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">Instant Processing</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsentDocsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <ConsentDocsContent />
    </Suspense>
  );
}
