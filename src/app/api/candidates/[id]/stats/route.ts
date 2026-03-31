import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../../../lib/postgres';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    await ensureSchema();
    const candidateResult = await pool.query('SELECT candidate_name FROM skillkendra.candidates WHERE candidate_id = $1', [id]);
    if (candidateResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM skillkendra.uploaded_certificates WHERE candidate_id = $1', [id]);
    const total = parseInt(totalResult.rows[0].count);

    const verifiedResult = await pool.query(`
      SELECT COUNT(*) FROM skillkendra.uploaded_certificates uc
      JOIN skillkendra.validations v ON uc.uploaded_certificate_id = v.uploaded_certificate_id
      WHERE uc.candidate_id = $1 AND v.verification_status = 'Verified'
    `, [id]);
    const verified = parseInt(verifiedResult.rows[0].count);

    const avgConfidenceResult = await pool.query(`
      SELECT AVG(e.confidence_score)
      FROM skillkendra.uploaded_certificates uc
      JOIN skillkendra.extractions e ON uc.uploaded_certificate_id = e.uploaded_certificate_id
      WHERE uc.candidate_id = $1
    `, [id]);
    const avg_confidence = parseFloat(avgConfidenceResult.rows[0].avg) || 0;

    return NextResponse.json({
      success: true,
      candidate_id: id,
      candidate_name: candidateResult.rows[0].candidate_name,
      stats: {
        total_uploads: total,
        verified_count: verified,
        unverified_count: total - verified,
        success_rate: total > 0 ? (verified / total * 100) : 0,
        average_confidence: Math.round(avg_confidence * 100) / 100,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
