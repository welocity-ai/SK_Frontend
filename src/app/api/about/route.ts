import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: "SkillKendra API",
    version: "2.0.0",
    description: "AI-powered Certificate Verification and KYC Platform",
    features: [
      "OCR Verification",
      "Forensic Analysis",
      "Manual Verification",
      "Candidate Management",
      "KYC Document Processing",
      "History & Analytics"
    ],
    developer: "SkillKendra Team"
  });
}
