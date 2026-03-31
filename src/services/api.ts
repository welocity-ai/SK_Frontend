/**
 * API Service for SkillKendra Frontend
 * Centralized methods for interacting with the integrated Next.js backend.
 */

export const verificationService = {
  // --- Verification ---
  async verifyCertificate(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/verify', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // Manual verification bridge
  async manualVerify(data: { certificate_id: string; issuer_url: string }) {
    const response = await fetch('/api/verify/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Alias for backward compatibility if needed
  async uploadCertificate(file: File) {
    return this.verifyCertificate(file);
  },

  // --- History ---
  async getRecentActivity(limit = 10, offset = 0) {
    const response = await fetch(`/api/history?limit=${limit}&offset=${offset}`);
    return response.json();
  },

  async getStats() {
    const response = await fetch('/api/history/stats');
    return response.json();
  },

  async searchHistory(query: string, limit = 20) {
    const response = await fetch(`/api/history/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.json();
  },

  // --- Candidates ---
  async createCandidate(data: { candidate_name: string; email?: string; phone_number?: string }) {
    const response = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getCandidate(id: string | number) {
    const response = await fetch(`/api/candidates/${id}`);
    return response.json();
  },

  async getCandidateCertificates(id: string | number, limit = 10) {
    const response = await fetch(`/api/candidates/${id}/certificates?limit=${limit}`);
    return response.json();
  },

  async getCandidateStats(id: string | number) {
    const response = await fetch(`/api/candidates/${id}/stats`);
    return response.json();
  },

  // --- KYC ---
  async getKYCSession(sessionId: string) {
    const response = await fetch(`/api/kyc?session_id=${sessionId}`);
    return response.json();
  },

  async createKYCSession(data: any) {
    const response = await fetch('/api/kyc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // --- Auth ---
  async getSession() {
    const response = await fetch('/api/auth/session');
    return response.json();
  },

  async logout() {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    return response.json();
  }
};

/**
 * History Service for SkillKendra Frontend
 * Backward compatibility for components using historyService
 */
export const historyService = {
  getRecentActivity: (limit?: number, offset?: number) => verificationService.getRecentActivity(limit, offset),
  getVerificationStats: () => verificationService.getStats(),
  searchHistory: (query: string, limit?: number) => verificationService.searchHistory(query, limit)
};

/**
 * KYC Service for SkillKendra Frontend
 * Specific methods for KYC identity verification
 */
export const kycService = {
  /**
   * Initialize a DigiLocker session
   */
  async initDigilocker(data: { 
    doc_types: string[]; 
    redirect_url: string; 
    encrypted_id: string; 
    candidateName: string;
    candidateEmail?: string;
    candidatePhone?: string;
  }) {
    const response = await fetch('/api/kyc/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_id: data.encrypted_id,
        doc_types: data.doc_types,
        redirect_url: data.redirect_url,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
        candidatePhone: data.candidatePhone
      }),
    });
    return response.json();
  },

  /**
   * Get candidate data from a KYC session status
   */
  async getKYCCandidate(sessionId: string) {
    const response = await fetch(`/api/kyc/status/${sessionId}`);
    return response.json();
  },

  /**
   * Fetch session details directly (for legacy or internal checks)
   */
  async getSession(sessionId: string) {
    const response = await fetch(`/api/kyc?session_id=${sessionId}`);
    return response.json();
  },

  /**
   * Generate Aadhaar OTP
   */
  async generateAadhaarOtp(data: { aadhaar_number: string; session_id: string }) {
    const response = await fetch('/api/aadhaar/generate-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Verify Aadhaar OTP
   */
  async verifyAadhaarOtp(data: { reference_id: string; otp: string; session_id: string }) {
    const response = await fetch('/api/aadhaar/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
};

// Also export as default for flexibility
export default verificationService;
