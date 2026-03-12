'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, File as FileIcon, Loader2, XCircle, X } from 'lucide-react';
import { verificationService } from '@/services/api';

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6">

      {/* Drop Zone — always shows drag & drop prompt */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
          ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-orange-300 hover:border-orange-400 hover:bg-orange-50/40'}
        `}
      >
        <input
          type="file"
          id="certificate-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <UploadCloud className="w-10 h-10 text-orange-500" />
          <div className="text-slate-600">
            <span className="font-semibold text-orange-600">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-slate-500">PDF, PNG, JPG (Max 5MB)</p>
        </div>
      </div>

      {/* File bar — appears below zone once a file is selected */}
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
        disabled={!file || isUploading}
        className={`
          w-full mt-5 flex items-center justify-center py-3 px-4 rounded-lg font-semibold text-white transition-all
          ${!file || isUploading
            ? 'bg-slate-300 cursor-not-allowed'
            : 'bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg active:scale-95'
          }
        `}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Verify Certificate'
        )}
      </button>
    </div>
  );
}