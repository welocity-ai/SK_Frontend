'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from '@/services/auth';
import { kycService } from '@/services/api';
import { CheckCircle, ShieldCheck, CreditCard, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// --- Components for different KYC states ---

const KYCVerified = () => (
  <div className="flex min-h-[70vh] items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg w-full text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900">KYC Verified</h1>
      <p className="text-slate-600 text-lg">
        Your identity has been successfully verified. You have full access to all SkillKendra features.
      </p>
      <Link 
        href="/"
        className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg"
      >
        Back to Dashboard
      </Link>
    </div>
  </div>
);

function KYCContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<'welcome' | 'select' | 'processing' | 'thankyou'>('welcome');
  const [loading, setLoading] = useState(true);
  const [isKycVerified, setIsKycVerified] = useState(false);
  const [userName, setUserName] = useState('Roopiee');
  const [candidateId, setCandidateId] = useState<number>(123); // Mock for frontend-only demo
  const [selectedDocs, setSelectedDocs] = useState<string[]>(['aadhaar', 'pan']);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<any>(null);

  // Check initial state
  useEffect(() => {
    const init = async () => {
      try {
        const session = await getSession();
        // Even if not logged in, we let the demo run with mock data
        if (session?.authenticated) {
            setIsKycVerified(!!session.user?.kyc);
            setUserName(session.user?.candidate_name || 'Roopiee');
            setCandidateId(session.user?.candidate_id || 123);
        }

        // Check if we're coming back from DigiLocker (simulated via redirect back to /kyc)
        const sid = searchParams.get('session_id') || localStorage.getItem('kyc_session_id');
        const code = searchParams.get('code');
        
        if (sid && code) {
          setSessionId(sid);
          handleVerificationSuccess(sid);
        }
      } catch (error) {
        console.error('KYC Init error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [searchParams, router]);

  const handleVerificationSuccess = async (sid: string) => {
    setStep('processing');
    try {
      // Mocked delay for processing - calling our LOCAL frontend API
      setTimeout(async () => {
          const candidateData = await kycService.getKYCCandidate(sid);
          setCandidate(candidateData);
          setStep('thankyou');
          localStorage.removeItem('kyc_session_id');
      }, 2000);
    } catch (error) {
      console.error('Verification success handler error:', error);
      setStep('welcome');
    }
  };

  const startKYC = () => {
    const params = new URLSearchParams();
    params.append('candidate_name', userName);
    params.append('candidate_id', String(candidateId));
    router.push(`/consent-docs?${params.toString()}`);
  };

  const toggleDoc = (doc: string) => {
    setSelectedDocs(prev => 
      prev.includes(doc) ? prev.filter(d => d !== doc) : [...prev, doc]
    );
  };

  const handleDigiLocker = async () => {
    setLoading(true);
    try {
      const response = await kycService.initDigilocker({
        doc_types: selectedDocs,
        redirect_url: window.location.origin + '/kycdone',
        encrypted_id: String(candidateId), // Send raw ID, backend will handle it
        candidateName: userName
      });

      if (response.data?.authorization_url) {
        localStorage.setItem('kyc_session_id', response.data.session_id);
        window.location.href = response.data.authorization_url;
      }
    } catch (error) {
      console.error('DigiLocker init error:', error);
      alert('Failed to connect to KYC Service');
    } finally {
      setLoading(false);
    }
  };

  if (loading && step !== 'processing') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (isKycVerified) {
    return <KYCVerified />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {step === 'welcome' && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-slate-900 p-8 md:p-12 text-white flex flex-col justify-center">
              <ShieldCheck className="w-16 h-16 text-orange-500 mb-6" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Identity Verification</h1>
              <p className="text-slate-400 text-lg mb-8">
                Securely verify your identity using DigiLocker. This helps us ensure the integrity of certificates and user profiles.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-600/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  </div>
                  <span className="text-slate-300">Official Government Verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-600/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  </div>
                  <span className="text-slate-300">100% Encrypted & Secure</span>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Hello, {userName}</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Just one quick step, we need to verify your identity through DigiLocker. It's fast, safe, and completely official.
              </p>
              
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 mb-8">
                <h3 className="text-sm font-bold text-orange-900 uppercase tracking-wide mb-2">Consent for Verification</h3>
                <p className="text-sm text-slate-700">
                  By clicking "Start KYC", you provide consent for SkillKendra to securely fetch your Aadhaar and PAN details via DigiLocker.
                </p>
              </div>

              <button 
                onClick={startKYC}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-orange-200 flex items-center justify-center gap-2 group"
              >
                Start KYC
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {step === 'select' && (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Verify Your Documents</h1>
              <p className="text-slate-600 mt-2">Select the documents you wish to verify via DigiLocker</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div 
                onClick={() => toggleDoc('aadhaar')}
                className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${
                  selectedDocs.includes('aadhaar') ? 'border-orange-600 bg-orange-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">Aadhaar Card</h3>
                  <p className="text-sm text-slate-500">Official Identity Proof</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDocs.includes('aadhaar') ? 'bg-orange-600 border-orange-600' : 'border-slate-200'
                }`}>
                  {selectedDocs.includes('aadhaar') && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>

              <div 
                onClick={() => toggleDoc('pan')}
                className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${
                  selectedDocs.includes('pan') ? 'border-orange-600 bg-orange-50' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">PAN Card</h3>
                  <p className="text-sm text-slate-500">Tax Identity Proof</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDocs.includes('pan') ? 'bg-orange-600 border-orange-600' : 'border-slate-200'
                }`}>
                  {selectedDocs.includes('pan') && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>

            <button 
              onClick={handleDigiLocker}
              disabled={selectedDocs.length === 0}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                selectedDocs.length > 0 ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Verify with DigiLocker
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="bg-white rounded-3xl shadow-xl p-12 max-w-lg mx-auto text-center space-y-6">
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-slate-900">Processing Verification</h2>
            <p className="text-slate-600">Please wait while we securely fetch your documents from DigiLocker...</p>
          </div>
        )}

        {step === 'thankyou' && candidate && (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-2xl mx-auto text-center space-y-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-4xl font-extrabold text-slate-900">Verification Successful!</h1>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-orange-600">{candidate.name || userName}</h2>
              <p className="text-slate-600">Your documents have been verified and linked to your SkillKendra profile.</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Verified Documents</h3>
              <div className="space-y-3">
                {Object.keys(candidate.documents || {}).map(doc => (
                  <div key={doc} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-slate-700 capitalize">{doc} Card</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">OFFICIAL</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-slate-500 text-sm">
              You can now securely close this window or return to your dashboard.
            </p>

            <Link 
              href="/"
              className="inline-block w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
            >
              Continue to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function KYCPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    }>
      <KYCContent />
    </Suspense>
  );
}
