'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { kycService } from '@/services/api';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/shared/ui/Navbar';

function KycDoneContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const sid = searchParams.get('session_id') || localStorage.getItem('kyc_session_id');
        const code = searchParams.get('code');
        
        if (sid && code) {
          // Verify with backend
          await kycService.getKYCCandidate(sid);
          localStorage.removeItem('kyc_session_id');
        } else if (sid && !code) {
           await kycService.getKYCCandidate(sid);
           localStorage.removeItem('kyc_session_id');
        }
      } catch (error) {
        console.error('Failed to handle KYC callback:', error);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen pt-24 items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-12 px-4 flex items-start justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-lg mx-auto text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900">Thank You!</h1>
        
        <p className="text-slate-600 text-lg">
          Now you may proceed with uploading certificate.
        </p>

        <div className="pt-6">
          <Link 
            href="/"
            className="inline-block w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-center"
          >
            Proceed to Upload
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function KycDonePage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="flex min-h-screen pt-24 items-center justify-center bg-slate-50">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        </div>
      }>
        <KycDoneContent />
      </Suspense>
    </>
  );
}
