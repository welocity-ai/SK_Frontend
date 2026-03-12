'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleCallback } from '@/services/auth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing verification...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL
        const verificationSessionId = searchParams.get('verificationSessionId');
        const verificationStatus = searchParams.get('status');

        if (!verificationSessionId || !verificationStatus) {
          setStatus('error');
          setMessage('Missing verification parameters');
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        // Send to backend
        const result = await handleCallback(verificationSessionId, verificationStatus);

        if (result.success) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => router.push('/'), 2000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Verification failed');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An error occurred during authentication');
        setTimeout(() => router.push('/'), 3000);
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {status === 'loading' && (
              <div className="w-16 h-16 mx-auto border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'success' && (
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {status === 'loading' && 'Processing...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Error'}
          </h2>
          <p className="text-slate-600">{message}</p>

          {/* Loading dots */}
          {status === 'loading' && (
            <div className="flex justify-center gap-2 mt-6">
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-orange-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
