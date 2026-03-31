import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'skillkendra_session';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });

  response.cookies.set(COOKIE_NAME, '', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
    sameSite: 'lax'
  });
  
  return response;
}
