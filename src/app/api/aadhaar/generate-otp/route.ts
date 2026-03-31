import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/sandbox-utils';
import { logAudit } from '@/lib/postgres';

const API_KEY = process.env.SANDBOX_API_KEY;
const API_BASE = process.env.SANDBOX_API_BASE || 'https://api.sandbox.co.in';

function getClientIP(req: NextRequest) {
    const xForwardedFor = req.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0];
    }
    return 'unknown';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { aadhaar_number, session_id } = body;

        // Validate inputs
        if (!aadhaar_number || !/^\d{12}$/.test(String(aadhaar_number))) {
            return NextResponse.json({ error: 'Invalid Aadhaar number. Must be exactly 12 digits.' }, { status: 400 });
        }

        const accessToken = await getAccessToken();

        const sandboxRes = await fetch(`${API_BASE}/kyc/aadhaar/okyc/otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken,
                'x-api-key': API_KEY || '',
                'x-api-version': '1.0',
            },
            body: JSON.stringify({
                '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
                aadhaar_number: String(aadhaar_number),
                consent: 'Y',
                reason: 'KYC verification',
            }),
        });

        const data = await sandboxRes.json();
        console.log('[Aadhaar OTP] generate-otp response:', JSON.stringify(data).substring(0, 300));

        await logAudit({
            session_id,
            event: 'AADHAAR_OTP_REQUESTED',
            details: { sandbox_code: data.code, message: data.message },
            ip_address: getClientIP(req),
            user_agent: req.headers.get('user-agent') || 'unknown',
        });

        if (data.code === 200 && data.data?.reference_id) {
            return NextResponse.json({
                success: true,
                reference_id: data.data.reference_id,
                message: 'OTP sent to your Aadhaar-linked mobile number.',
            });
        }

        return NextResponse.json({
            success: false,
            error: data.message || 'Failed to send OTP. Please check your Aadhaar number.',
        }, { status: 400 });
    } catch (error: any) {
        console.error('[Aadhaar OTP] generate-otp error:', error);
        return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
    }
}
