import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../../lib/postgres';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!q || q.length < 2) {
    return NextResponse.json({ success: false, error: 'Query too short' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const searchPattern = `%${q}%`;
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
      WHERE c.candidate_name ILIKE $1 
         OR e.issuer_org_name ILIKE $1
         OR e.certificate_id ILIKE $1
      ORDER BY uc.uploaded_at DESC
      LIMIT $2;
    `;
    
    const result = await pool.query(sql, [searchPattern, limit]);
    
    return NextResponse.json({
      success: true,
      query: q,
      count: result.rows.length,
      results: result.rows
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      results: []
    }, { status: 500 });
  }
}
