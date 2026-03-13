'use client';

import React from 'react';
import { CheckCircle, Download, User, Hash, Building, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { CertificateAnalysisResponse } from '@/types';

interface VerifiedCertificateProps {
  data: CertificateAnalysisResponse;
}

export default function VerifiedCertificate({ data }: VerifiedCertificateProps) {
  
  const handleViewCertificate = () => {
    // Encode data as Base64 and open in new tab
    const jsonString = JSON.stringify(data);
    // Fix for Unicode characters (InvalidCharacterError)
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
    window.open(`/validation-certificate?data=${base64Data}`, '_blank');
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
    
    // Create an invisible iframe to print the exact certificate layout
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `/validation-certificate?data=${base64Data}`;
    document.body.appendChild(iframe);
    
    // Once iframe loads, execute the print dialogue on its content window
    iframe.onload = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.print();
        
        // Listen for user to close print dialogue, then clean up iframe
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-green-800 py-0.5">Certificate Verified!</h2>
        </div>
        {/* <p className="text-green-700">{data.verification.message}</p> */}
      </div>

      {/* Certificate Details */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 space-y-6">
        
        {/* Candidate Info */}
        {data.extraction.candidate_name && (
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Candidate Name</p>
              <p className="text-lg font-semibold text-gray-900">{data.extraction.candidate_name.toUpperCase()}</p>
            </div>
          </div>
        )}

        {/* Certificate ID */}
        {data.extraction.certificate_id && (
          <div className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Certificate ID</p>
              <p className="text-lg font-mono text-gray-900">{data.extraction.certificate_id}</p>
            </div>
          </div>
        )}

        {/* Issuer Organization */}
        {data.extraction.issuer_org && (
          <div className="flex items-start gap-3">
            <Building className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500 font-medium">Issuing Organization</p>
              <p className="text-lg font-semibold text-gray-900">{data.extraction.issuer_org}</p>
            </div>
          </div>
        )}

        {/* Verification URL */}
        {data.extraction.issuer_url && (
          <div className="flex items-start gap-3">
            <LinkIcon className="w-5 h-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 font-medium">Verification URL</p>
              <a 
                href={data.extraction.issuer_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline break-all"
              >
                {data.extraction.issuer_url}
              </a>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Forensics Info - Removed Manipulation Score */}
        {/* <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Security Analysis</p>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Risk Level: <span className={`font-semibold ${data.forensics.is_high_risk ? 'text-red-600' : 'text-green-600'}`}>
              {data.forensics.is_high_risk ? 'High Risk' : 'Low Risk'}
            </span></p>
            <p>• Status: <span className="font-semibold">{data.forensics.status}</span></p>
          </div>
        </div> */}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleViewCertificate}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <ExternalLink className="w-5 h-5" />
            View Validation Certificate
          </button>
          
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <Download className="w-5 h-5" />
            Download Validation Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
