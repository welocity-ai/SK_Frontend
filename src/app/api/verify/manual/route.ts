import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../../lib/postgres';

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const body = await req.json();
    const { certificate_id, issuer_url } = body;

    if (!certificate_id || !issuer_url) {
      return NextResponse.json({ success: false, error: 'Certificate ID and Issuer URL are required' }, { status: 400 });
    }

    // 1. Call Python OCR Pipeline manual verification endpoint
    const ocrUrl = process.env.OCR_PIPELINE_URL || 'http://localhost:8000';
    
    const ocrResponse = await fetch(`${ocrUrl}/api/verify/manual`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        certificate_id,
        issuer_url
      }),
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      throw new Error(`OCR Pipeline manual verification error: ${errorText}`);
    }

    const verificationResult: any = await ocrResponse.json();

    // 2. Save to Postgres History (if needed/possible without a file)
    // For manual verification, we might not have a file, but we can still log it.
    try {
        const student_name = verificationResult.extracted_data?.student_name || "Unknown Candidate";
        
        // Create candidate
        const candResult = await pool.query(
          'INSERT INTO skillkendra.candidates (candidate_name) VALUES ($1) RETURNING candidate_id',
          [student_name]
        );
        const candidateId = candResult.rows[0].candidate_id;

        // Add manual verification record
        await pool.query(
          `INSERT INTO skillkendra.uploaded_certificates (
            candidate_id, file_url, file_name, storage_provider
          ) VALUES ($1, $2, $3, $4) RETURNING uploaded_certificate_id`,
          [candidateId, 'manual_verification', 'Manual Entry', 'none']
        );
        
        console.log(`[FRONTEND-API] Manual verification saved to DB for candidate ${candidateId}`);
    } catch (dbError) {
        console.error('[FRONTEND-API] DB Error saving manual verification:', dbError);
    }

    return NextResponse.json(verificationResult);

  } catch (error: any) {
    console.error('[FRONTEND-API] Error in manual verify:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
