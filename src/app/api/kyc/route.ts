import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../lib/postgres';

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { session_id, candidate_id, name, email, phone, requested_docs } = await req.json();

    if (!session_id || !candidate_id) {
      return NextResponse.json({ success: false, error: 'Missing session_id or candidate_id' }, { status: 400 });
    }

    const existing = await pool.query('SELECT * FROM skillkendra.kyc_documents WHERE session_id = $1', [session_id]);
    
    if (existing.rows.length > 0) {
      await pool.query(`
        UPDATE skillkendra.kyc_documents SET
          candidate_name = $1,
          candidate_email = $2,
          candidate_phone = $3,
          requested_docs = $4,
          updated_at = NOW()
        WHERE session_id = $5;
      `, [name, email, phone, JSON.stringify(requested_docs || []), session_id]);
    } else {
      await pool.query(`
        INSERT INTO skillkendra.kyc_documents (
          session_id, candidate_id, candidate_name, candidate_email, 
          candidate_phone, requested_docs
        ) VALUES ($1, $2, $3, $4, $5, $6);
      `, [session_id, candidate_id, name, email, phone, JSON.stringify(requested_docs || [])]);
    }
    
    return NextResponse.json({ success: true, message: 'KYC session created/updated' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get('session_id');
  
  if (!session_id) {
    return NextResponse.json({ success: false, error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const result = await pool.query('SELECT * FROM skillkendra.kyc_documents WHERE session_id = $1', [session_id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'KYC session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, session: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
