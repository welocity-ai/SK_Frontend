import { NextRequest, NextResponse } from 'next/server';
import * as jwt from "jsonwebtoken";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'MySuperSecretCode';
const COOKIE_NAME = 'skillkendra_session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }

  try {
    const payload: any = jwt.verify(token, JWT_SECRET_KEY);
    
    // Mock user data for demo
    const userData = {
      ...payload,
      kyc: false,
      candidate_id: 1,
      candidate_name: "Demo Candidate"
    };

    return NextResponse.json({
      authenticated: true,
      user: userData,
      verification_status: 'pending',
      expires_at: new Date(payload.exp * 1000).toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      user: null
    });
  }
}
