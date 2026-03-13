'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CertificateAnalysisResponse } from '@/types';

function CertificateContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');
  
  let data: CertificateAnalysisResponse | null = null;
  
  if (dataParam) {
    try {
      // Correct decoding for Unicode characters encoded with encodeURIComponent/unescape
      const decodedString = decodeURIComponent(escape(atob(dataParam)));
      data = JSON.parse(decodedString);
    } catch (error) {
      console.error('Error decoding certificate data:', error);
      // Fallback: try basic decode
      try {
        const basicDecodedString = atob(dataParam);
        data = JSON.parse(basicDecodedString);
      } catch (fallbackError) {
        console.error('Basic decoding also failed:', fallbackError);
      }
    }
  }

  // Alternative: Try to get from sessionStorage if not in URL
  if (!data) {
    try {
      if (typeof window !== 'undefined') {
        const storedResult = sessionStorage.getItem('verificationResult');
        if (storedResult) {
          data = JSON.parse(storedResult);
        }
      }
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No certificate data available</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go back to upload
          </a>
        </div>
      </div>
    );
  }

  const verificationDate = new Date().toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  const expiryDate = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  const safeString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'object') return Object.values(val).filter(Boolean).join(' • ');
    return String(val);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(safeString(data.extraction?.issuer_url) || 'https://skillkendra.org')}`;

  // Determine status color
  const getStatusColor = () => {
    if (data?.final_verdict === 'VERIFIED') return 'text-emerald-600 bg-emerald-100';
    if (data?.final_verdict === 'UNVERIFIED') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4 font-inter">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        .bg-pattern {
          background-color: #f8fafc;
          background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        @page { size: landscape; margin: 0.5cm; }
        @media print {
          body { 
            background: #f3f4f6 !important; 
            margin: 0 !important;
            padding: 0 !important;
            min-height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .no-print { display: none !important; }
          .print-certificate-container {
            width: 100% !important;
            max-width: 1024px !important;
            height: auto !important;
            margin: auto !important;
            border-radius: 1rem !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
            flex-direction: row !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            transform: scale(0.95);
            transform-origin: center center;
          }
          .print-sidebar {
            width: 33.333333% !important;
            flex: none !important;
          }
          .print-content {
            width: 66.666667% !important;
            flex: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
      
      <div className="bg-white w-full max-w-5xl shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row print-certificate-container">
        
        {/* LEFT SIDE: Verification Sidebar */}
        <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 flex flex-col items-center text-center relative overflow-hidden print-sidebar">
          
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center w-full h-full">
            
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl shadow-lg mb-6 transform hover:scale-105 transition-transform duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrCodeUrl}
                alt="Verification QR Code" 
                className="w-40 h-40 object-contain"
              />
            </div>

            {/* Tagline */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-2 text-emerald-400 mb-2">
                <i className="fas fa-check-circle text-xl"></i>
                <span className="font-bold tracking-wide uppercase text-sm">Official Document</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-100 leading-tight">
                Verified and Authenticated by <span className="text-orange-400">SkillKendra</span>
              </h2>
            </div>

            <div className="w-full border-t border-slate-700 mb-8"></div>

            {/* Verification Details */}
            <div className="w-full space-y-5 text-left text-sm">
              
              <div className="group">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Date of Verification</p>
                <p className="font-medium text-slate-100 flex items-center">
                  <i className="far fa-calendar-check mr-2 text-orange-400"></i> {verificationDate}
                </p>
              </div>

              <div className="group">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Expiry Date</p>
                <p className="font-medium text-slate-100 flex items-center">
                  <i className="far fa-clock mr-2 text-amber-400"></i> {expiryDate}
                </p>
              </div>

              {data.extraction?.certificate_id && (
                <div className="group">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Certificate ID</p>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700">
                    <p className="font-mono text-xs text-yellow-400 break-all select-all">
                      {safeString(data.extraction.certificate_id)}
                    </p>
                  </div>
                </div>
              )}

              {data.extraction?.issuer_url && (
                <div className="group flex flex-col items-start w-full">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Verification URL</p>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700 w-full overflow-hidden">
                    <a 
                      href={safeString(data.extraction.issuer_url)} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:text-orange-300 transition-colors flex items-center text-xs break-all"
                    >
                      <span className="break-all truncate w-full">{safeString(data.extraction.issuer_url)}</span>
                    </a>
                  </div>
                </div>
              )}

              {(data.extraction?.issuer_name || data.extraction?.issuer_org) && (
                <div className="group flex flex-col items-start w-full">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Issuing Organization</p>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700 w-full overflow-hidden">
                    <p className="font-mono text-xs text-orange-400 flex flex-col gap-1 break-words">
                      {data.extraction.issuer_name && (
                        <span>
                          {safeString(data.extraction.issuer_name)}
                        </span>
                      )}
                      {data.extraction.issuer_org && (
                        <span>
                          {safeString(data.extraction.issuer_org)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Certificate Context */}
        <div className="w-full md:w-2/3 bg-pattern p-8 md:p-12 flex flex-col print-content">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex-1">
              <h1 className="text-2xl md:text-2xl lg:text-[2.125rem] whitespace-nowrap font-extrabold text-slate-800 mb-2 uppercase tracking-tight">
                CERTIFICATE OF VERIFICATION
              </h1>
              <p className="text-slate-500">
                This document certifies that the credential has been {data.final_verdict?.toLowerCase() || 'processed'}.
              </p>
            </div>
            <div className="hidden sm:flex ml-4 flex-shrink-0 items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-lg shadow-md font-bold text-2xl">
              SK
            </div>
          </div>

          {/* Certificate Details */}
          <div className="space-y-6 mb-12">
            {data.extraction?.candidate_name && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Issued To</label>
                <p className="text-2xl font-serif text-slate-900">{safeString(data.extraction.candidate_name?.toUpperCase())}</p>
              </div>
            )}
            
            {(data.extraction?.issuer_name || data.extraction?.issuer_org) && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Issuing Organization</label>
                <div className="text-xl text-slate-700">
                  {data.extraction.issuer_name && <p>{safeString(data.extraction.issuer_name)}</p>}
                  {data.extraction.issuer_org && (
                    <p className="text-lg text-slate-500 mt-1">
                      {safeString(data.extraction.issuer_org)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 gap-4">
            <p>
              Status: <span className={`font-bold px-2 py-0.5 rounded ${getStatusColor()}`}>
                {data.final_verdict}
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 no-print">
            <button 
              onClick={() => typeof window !== 'undefined' && window.print()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              <i className="fas fa-print mr-2"></i>
              Print Certificate
            </button>
            <a 
              href="/"
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg transition-colors text-sm font-medium text-center"
            >
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ValidationCertificatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <CertificateContent />
    </Suspense>
  );
}
