import { NextRequest, NextResponse } from 'next/server';
import { pool, ensureSchema } from '../../../../lib/postgres';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    await ensureSchema();
    const result = await pool.query('SELECT * FROM skillkendra.candidates WHERE candidate_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      candidate: result.rows[0]
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
