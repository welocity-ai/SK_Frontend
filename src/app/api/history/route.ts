import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../lib/postgres';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    await ensureSchema();
    const sql = `
      SELECT 
        uc.uploaded_certificate_id as id,
        uc.uploaded_at as timestamp,
        uc.file_name as filename,
        c.candidate_name as student_name,
        e.issuer_org_name as issuer,
        e.certificate_id as certificate_id,
        (v.verification_status = 'Verified') as is_verified,
        e.confidence_score as confidence_score,
        e.verification_link as verification_url,
        e.course_name as course_name,
        e.issue_date as issue_date,
        v.validation_certificate_link as validation_certificate_link
      FROM skillkendra.uploaded_certificates uc
      LEFT JOIN skillkendra.candidates c ON uc.candidate_id = c.candidate_id
      LEFT JOIN skillkendra.extractions e ON uc.uploaded_certificate_id = e.uploaded_certificate_id
      LEFT JOIN skillkendra.validations v ON uc.uploaded_certificate_id = v.uploaded_certificate_id
      ORDER BY uc.uploaded_at DESC
      LIMIT $1 OFFSET $2;
    `;
    
    const result = await pool.query(sql, [limit, offset]);
    
    return NextResponse.json({
      success: true,
      count: result.rows.length,
      verifications: result.rows
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      verifications: []
    }, { status: 500 });
  }
}
