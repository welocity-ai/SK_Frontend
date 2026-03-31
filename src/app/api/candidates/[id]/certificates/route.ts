import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../../../lib/postgres';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    await ensureSchema();
    const candidateResult = await pool.query('SELECT candidate_name FROM skillkendra.candidates WHERE candidate_id = $1', [id]);
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    const sql = `
      SELECT
        uc.*,
        e.certificate_id, e.verification_link, e.issuer_org_name, e.confidence_score, e.course_name, e.issue_date,
        v.validation_certificate_link, v.verification_status
      FROM skillkendra.uploaded_certificates uc
      LEFT JOIN skillkendra.extractions e ON uc.uploaded_certificate_id = e.uploaded_certificate_id
      LEFT JOIN skillkendra.validations v ON uc.uploaded_certificate_id = v.uploaded_certificate_id
      WHERE uc.candidate_id = $1
      ORDER BY uc.uploaded_at DESC
      LIMIT $2;
    `;
    
    const result = await pool.query(sql, [id, limit]);

    return NextResponse.json({
      success: true,
      candidate_id: id,
      candidate_name: candidateResult.rows[0].candidate_name,
      count: result.rows.length,
      certificates: result.rows
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
