/**
 * API Service for certificate verification
 */

import { HistoryResponse, StatsResponse, SearchResponse } from '@/types/history';
import { CertificateAnalysisResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Upload and verify a certificate
 */
export async function uploadCertificate(file: File): Promise<CertificateAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/verify`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Verification failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Convert backend format to frontend format
  return convertToFrontendFormat(data);
}

/**
 * Convert backend response to frontend format
 */
function convertToFrontendFormat(backendData: any): CertificateAnalysisResponse {
  const extractedData = backendData.data?.extracted_data || {};
  const verification = backendData.data?.verification || {};
  const forensics = backendData.data?.forensics || {};

  return {
    filename: backendData.filename || 'unknown',
    final_verdict: backendData.data?.final_verdict || (verification.is_verified ? 'VERIFIED' : 'UNVERIFIED'),
    extraction: {
      candidate_name: extractedData.student_name || 'Unknown',
      issuer_name: extractedData.issuer || 'Unknown',
      course_name: extractedData.course_name,
      completion_date: extractedData.completion_date,
      certificate_id: extractedData.certificate_ids?.[0],
      issuer_url: verification.verification_url,
    },
    verification: {
      is_verified: verification.is_verified || false,
      message: verification.message || 'No details available',
      trusted_domain: verification.trusted_domain || false,
    },
    forensics: {
      is_high_risk: forensics.is_high_risk || false,
      manipulation_score: forensics.manipulation_score || 0,
      status: forensics.status || 'Success',
    },
  };
}

// ===== HISTORY SERVICE =====

/**
 * Get recent verification activity
 */
async function getRecentActivity(limit: number = 10): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent activity');
  }
  
  return response.json();
}

/**
 * Get verification statistics
 */
async function getVerificationStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/history/stats`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch verification stats');
  }
  
  return response.json();
}

/**
 * Search verification history
 */
async function searchHistory(query: string, limit: number = 20): Promise<SearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/history/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to search history');
  }
  
  return response.json();
}

export const historyService = {
  getRecentActivity,
  getVerificationStats,
  searchHistory,
};

/**
 * Manually verify a certificate using ID and URL
 */
export async function manualVerify(params: { certificate_id: string; issuer_url: string }): Promise<CertificateAnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/verify/manual`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Manual verification failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Wrap simple verification result into a full analysis response for the UI
  return {
    filename: 'Manual Entry',
    final_verdict: data.is_verified ? 'VERIFIED' : 'UNVERIFIED',
    extraction: {
      candidate_name: 'Manual Verification',
      issuer_name: 'User Input',
      certificate_id: params.certificate_id,
      issuer_url: params.issuer_url,
    },
    verification: {
      is_verified: data.is_verified,
      message: data.message,
      trusted_domain: data.trusted_domain,
    },
    forensics: {
      is_high_risk: false,
      manipulation_score: 0,
      status: 'Manual verification skip forensics',
    },
  };
}

export const verificationService = {
  uploadCertificate,
  manualVerify,
};
