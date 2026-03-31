// Backend Schema Types - Matching app/schemas.py

export interface ForensicsResult {
    manipulation_score: number;
    is_high_risk: boolean;
    status: string;
    details?: string[] | null;
    llm_analysis?: string | null;
    llm_risk_score?: number | null;
    llm_confidence?: number | null;
    llm_reasoning?: string | null;
}

export interface ExtractionResult {
    candidate_name?: string | null;
    certificate_id?: string | null;
    issuer_url?: string | null;
    issuer_name?: string | null;
    issuer_org?: string | null;
    raw_text_snippet?: string | null;
    certificate_date?: string | null;
    course_name?: string | null;
    completion_date?: string | null;
}

export interface VerificationResult {
    is_verified: boolean;
    message: string;
    trusted_domain: boolean;
}

export interface CertificateAnalysisResponse {
    success?: boolean;
    filename: string;
    // New backend shape: all results nested under `data`
    data?: {
        verification?: VerificationResult & { confidence_score?: number; verification_url?: string; method?: string; message?: string };
        extracted_data?: ExtractionResult;
        forensics?: ForensicsResult;
        summary?: { final_message?: string; verified_count?: number; [key: string]: any };
        [key: string]: any;
    };
    // Legacy / flat shape (kept for compatibility)
    final_verdict?: string;
    forensics?: ForensicsResult;
    extraction?: ExtractionResult;
    verification?: VerificationResult;
}

// Manual Verification Types
export interface ManualVerificationRequest {
    certificate_id: string;
    issuer_url: string;
}

export interface ApiError {
    detail: string;
}
