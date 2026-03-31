'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, FileText, CreditCard, ArrowRight, Lock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '@/components/shared/ui/Navbar';
import { kycService } from '@/services/api';

function SelectDocsContent() {
  const [selectedDocs, setSelectedDocs] = useState<string[]>(['aadhaar', 'pan']);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleDoc = (doc: string) => {
    setSelectedDocs(prev => 
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const handleStartVerification = async () => {
    if (selectedDocs.length === 0) return;
    
    setLoading(true);
    try {
      const candidateName = searchParams.get('candidate_name') || 'User';
      const candidateId = searchParams.get('candidate_id') || '123';

      const response = await kycService.initDigilocker({
        doc_types: selectedDocs,
        redirect_url: window.location.origin + '/kycdone',
        encrypted_id: candidateId,
        candidateName: candidateName
      });

      if (response.data?.authorization_url) {
        localStorage.setItem('kyc_session_id', response.data.session_id);
        window.location.href = response.data.authorization_url;
      } else {
        alert('Failed to initiate DigiLocker session');
        setLoading(false);
      }
    } catch (error) {
      console.error('Verification init error:', error);
      alert('Couldn\'t connect to verification service');
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 pt-32 pb-12">
        <div className="w-full max-w-2xl">

          {/* Back button */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10 space-y-8 border border-slate-100 relative overflow-hidden">
            
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-center p-6">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Connecting to DigiLocker</h3>
                <p className="text-slate-500">Hang tight, this will only take a moment...</p>
              </div>
            )}

            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                Verify Your Documents
              </h1>
              <p className="text-slate-600 text-base">
                Quick and secure verification via DigiLocker - takes less than a minute!
              </p>
            </div>

            {/* Documents Section */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Select Documents to Verify
                </h2>
                
                {/* Document Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Aadhaar Card */}
                  <div 
                    onClick={() => toggleDoc('aadhaar')}
                    className={`group relative border-2 rounded-2xl p-6 transition-all cursor-pointer ${
                      selectedDocs.includes('aadhaar') 
                        ? 'border-orange-600 bg-orange-50 shadow-md shadow-orange-100' 
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedDocs.includes('aadhaar') ? 'bg-orange-600' : 'bg-orange-50'
                      }`}>
                        <FileText className={`w-6 h-6 ${selectedDocs.includes('aadhaar') ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg">Aadhaar Card</h3>
                        <p className="text-sm text-slate-500 mt-1">Government ID Proof</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selectedDocs.includes('aadhaar') ? 'bg-orange-600 border-orange-600' : 'border-slate-200'
                      }`}>
                        {selectedDocs.includes('aadhaar') && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>

                  {/* PAN Card */}
                  <div 
                    onClick={() => toggleDoc('pan')}
                    className={`group relative border-2 rounded-2xl p-6 transition-all cursor-pointer ${
                      selectedDocs.includes('pan') 
                        ? 'border-orange-600 bg-orange-50 shadow-md shadow-orange-100' 
                        : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedDocs.includes('pan') ? 'bg-orange-600' : 'bg-orange-50'
                      }`}>
                        <CreditCard className={`w-6 h-6 ${selectedDocs.includes('pan') ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg">PAN Card</h3>
                        <p className="text-sm text-slate-500 mt-1">Tax Identity Proof</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        selectedDocs.includes('pan') ? 'bg-orange-600 border-orange-600' : 'border-slate-200'
                      }`}>
                        {selectedDocs.includes('pan') && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={handleStartVerification}
                disabled={selectedDocs.length === 0 || loading}
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-lg ${
                  selectedDocs.length === 0 || loading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-orange-600 hover:bg-orange-700 text-white hover:-translate-y-0.5'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                Verify with DigiLocker
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
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold text-slate-600">Official Source</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectDocsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <SelectDocsContent />
    </Suspense>
  );
}
