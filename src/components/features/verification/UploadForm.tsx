'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, File as FileIcon, Loader2, XCircle, X, Lock, ArrowRight } from 'lucide-react';
import Lottie from 'lottie-react';
import { useUser, SignInButton } from "@clerk/nextjs";
import { verificationService } from '@/services/api';
import catPlayingAnimation from '@/../public/animations/cat-playing.json';

export default function UploadForm() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!isSignedIn) {
      setShowLoginModal(true);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSignedIn) {
      e.target.value = ''; // Reset input
      setShowLoginModal(true);
      return;
    }
    
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF or Image.');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      setError('File size exceeds 5MB. Please upload a smaller file.');
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
  };

  // Handle Submission
  const handleVerification = async () => {
    if (!isSignedIn) {
      setShowLoginModal(true);
      return;
    }
    
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const data = await verificationService.uploadCertificate(file);
      sessionStorage.setItem('verificationResult', JSON.stringify(data));
      router.push('/verify-result');
    } catch (err: any) {
      setError(err.message || 'Something went wrong connecting to the server.');
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6">

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isSignedIn && setShowLoginModal(true)}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-orange-300 hover:border-orange-400 hover:bg-orange-50/40'}
            ${!isSignedIn ? 'opacity-75' : ''}
          `}
        >
          <input
            type="file"
            id="certificate-upload"
            className={`absolute inset-0 w-full h-full opacity-0 ${isSignedIn ? 'cursor-pointer' : 'cursor-default'}`}
            onChange={handleFileChange}
            onClick={(e) => !isSignedIn && e.preventDefault()}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={isUploading}
          />
          <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
            {isSignedIn ? (
              <UploadCloud className="w-10 h-10 text-orange-500" />
            ) : (
              <Lock className="w-10 h-10 text-slate-400" />
            )}
            <div className="text-slate-600">
              <span className="font-semibold text-orange-600">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-slate-500">PDF, PNG, JPG (Max 5MB)</p>
          </div>
        </div>

        {/* File bar */}
        {file && (
          <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex-shrink-0 w-9 h-9 bg-orange-100 rounded-md flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={removeFile}
              disabled={isUploading}
              className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 hover:bg-orange-100 rounded-full transition-colors"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2 border border-red-200">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleVerification}
          disabled={(!file && isSignedIn) || isUploading}
          className={`
            w-full mt-5 flex items-center justify-center py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${(!file && isSignedIn) || isUploading
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95'
            }
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : !isSignedIn ? (
            'Login to Verify'
          ) : (
            'Verify Certificate'
          )}
        </button>
      </div>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Authentication Required</h3>
              <p className="text-slate-600">
                Please login to your SkillKendra account to verify certificates and access forensic reports.
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <SignInButton mode="modal">
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
                  >
                    Login Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 rounded-xl transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-72 h-72">
            <Lottie 
              animationData={catPlayingAnimation} 
              loop={true} 
            />
          </div>
          <h3 className="mt-4 text-2xl font-bold text-slate-800">Verifying Certificate...</h3>
          <p className="mt-2 text-slate-500">Please wait while we process your document.</p>
        </div>
      )}
    </>
  );
}