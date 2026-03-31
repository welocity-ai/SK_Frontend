import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../../lib/postgres';

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const totalResult = await pool.query("SELECT COUNT(*) FROM skillkendra.uploaded_certificates");
    const total = parseInt(totalResult.rows[0].count);

    const verifiedResult = await pool.query("SELECT COUNT(*) FROM skillkendra.validations WHERE verification_status = 'Verified'");
    const verified = parseInt(verifiedResult.rows[0].count);

    const avgConfidenceResult = await pool.query("SELECT AVG(confidence_score) FROM skillkendra.extractions");
    const avg_confidence = parseFloat(avgConfidenceResult.rows[0].avg) || 0;
    
    const last24hResult = await pool.query(`
      SELECT COUNT(*) FROM skillkendra.uploaded_certificates 
      WHERE uploaded_at > NOW() - INTERVAL '1 day'
    `);
    const last_24h = parseInt(last24hResult.rows[0].count);

    return NextResponse.json({
      success: true,
      stats: {
        total_verifications: total,
        verified_count: verified,
        unverified_count: total - verified,
        high_risk_count: 0,
        success_rate: total > 0 ? (verified / total * 100) : 0,
        average_confidence: Math.round(avg_confidence * 100) / 100,
        last_24h: last_24h
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stats: {
        total_verifications: 0,
        verified_count: 0,
        unverified_count: 0,
        high_risk_count: 0,
        success_rate: 0,
        average_confidence: 0,
        last_24h: 0
      }
    }, { status: 500 });
  }
}
