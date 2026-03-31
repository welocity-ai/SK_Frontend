import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../lib/postgres';

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Call Python OCR Pipeline
    const ocrUrl = process.env.OCR_PIPELINE_URL || 'http://localhost:8000';
    
    // We need to re-package the file for the Python API
    const pythonFormData = new FormData();
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    pythonFormData.append('file', blob, file.name);

    const ocrResponse = await fetch(`${ocrUrl}/api/verify`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      throw new Error(`OCR Pipeline error: ${errorText}`);
    }

    const ocrResult: any = await ocrResponse.json();
    const data = ocrResult.data;

    // 2. Save to Postgres History
    try {
      const extractedData = data.extracted_data || {};
      const verification = data.verification || {};
      
      const student_name = extractedData.student_name || "Unknown Candidate";
      
      // Create candidate
      const candResult = await pool.query(
        'INSERT INTO skillkendra.candidates (candidate_name) VALUES ($1) RETURNING candidate_id',
        [student_name]
      );
      const candidateId = candResult.rows[0].candidate_id;

      // Add uploaded certificate
      const certResult = await pool.query(
        `INSERT INTO skillkendra.uploaded_certificates (
          candidate_id, file_url, file_name, file_size, file_type, storage_provider
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING uploaded_certificate_id`,
        [candidateId, 'uploaded_from_api', file.name, file.size, file.type, 'local']
      );
      const uploadedCertId = certResult.rows[0].uploaded_certificate_id;

      // Add extraction
      const certIds = extractedData.certificate_ids;
      const certIdVal = Array.isArray(certIds) ? certIds[0] : null;

      await pool.query(
        `INSERT INTO skillkendra.extractions (
          uploaded_certificate_id, certificate_id, verification_link, 
          issuer_org_name, issuer_org_domain, confidence_score, course_name, issue_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          uploadedCertId, 
          certIdVal, 
          verification.verification_url, 
          extractedData.issuer, 
          typeof verification.trusted_domain === 'string' ? verification.trusted_domain : null,
          verification.confidence_score || 0.0,
          extractedData.course_name,
          extractedData.completion_date
        ]
      );

      // Add validation
      const status = verification.is_verified ? 'Verified' : 'Unverified';
      await pool.query(
        `INSERT INTO skillkendra.validations (
          uploaded_certificate_id, verification_status
        ) VALUES ($1, $2)`,
        [uploadedCertId, status]
      );

      console.log(`[FRONTEND-API] Verification saved to DB for candidate ${candidateId}`);
    } catch (dbError) {
      console.error('[FRONTEND-API] DB Error saving verification:', dbError);
    }

    return NextResponse.json(ocrResult);

  } catch (error: any) {
    console.error('[FRONTEND-API] Error in verify:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
