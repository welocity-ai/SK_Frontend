import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../lib/postgres';

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { candidate_name, email, phone_number } = await req.json();

    if (!candidate_name) {
      return NextResponse.json({ success: false, error: 'Candidate name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO skillkendra.candidates (candidate_name, email, phone_number) VALUES ($1, $2, $3) RETURNING candidate_id',
      [candidate_name, email, phone_number]
    );
    
    return NextResponse.json({
      success: true,
      candidate_id: result.rows[0].candidate_id
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const result = await pool.query('SELECT * FROM skillkendra.candidates ORDER BY created_at DESC LIMIT 100');
    return NextResponse.json({ success: true, candidates: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
