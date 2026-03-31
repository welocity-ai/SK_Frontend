import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/sandbox-utils';
import { getSession, saveDocument, updateSessionStatus, logAudit } from '@/lib/postgres';

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
        const { reference_id, otp, session_id } = body;

        if (!reference_id || !otp || !session_id) {
            return NextResponse.json({ error: 'reference_id, otp, and session_id are required.' }, { status: 400 });
        }

        if (!/^\d{6}$/.test(String(otp))) {
            return NextResponse.json({ error: 'OTP must be 6 digits.' }, { status: 400 });
        }

        const accessToken = await getAccessToken();

        const sandboxRes = await fetch(`${API_BASE}/kyc/aadhaar/okyc/otp/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken,
                'x-api-key': API_KEY || '',
                'x-api-version': '1.0',
            },
            body: JSON.stringify({
                '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
                reference_id: String(reference_id),
                otp: String(otp),
            }),
        });

        const data = await sandboxRes.json();
        console.log('[Aadhaar OTP] verify-otp response:', JSON.stringify(data).substring(0, 500));

        if (data.code !== 200 || !data.data) {
            const message = data.message || 'OTP verification failed.';
            const isExpired = message.toLowerCase().includes('expire') || message.toLowerCase().includes('invalid');

            await logAudit({
                session_id,
                event: 'AADHAAR_OTP_FAILED',
                details: { sandbox_code: data.code, message },
                ip_address: getClientIP(req),
                user_agent: req.headers.get('user-agent') || 'unknown',
            });

            return NextResponse.json({
                success: false,
                expired: isExpired,
                error: message,
            }, { status: 400 });
        }

        // ── Identity data from Sandbox ──────────────────────────────────────
        const aadhaarData = data.data;

        // Build a clean object to persist
        const processedData: Record<string, any> = {
            name: aadhaarData.name || aadhaarData.full_name || null,
            dob: aadhaarData.dob || aadhaarData.date_of_birth || null,
            gender: aadhaarData.gender || null,
            address: aadhaarData.address || aadhaarData.split_address || null,
            zip: aadhaarData.zip || aadhaarData.pincode || null,
            verification_method: 'aadhaar_otp',
            verified_at: new Date().toISOString(),
        };

        // ── Save to DB ──────────
        const session = await getSession(session_id);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
        }

        await saveDocument(session_id, 'aadhaar', processedData);

        // ── Mark session as verified ─────────────────────────────────────────
        await updateSessionStatus(session_id, 'verified');

        await logAudit({
            session_id,
            event: 'AADHAAR_OTP_VERIFIED',
            details: {
                name: processedData.name,
            },
            ip_address: getClientIP(req),
            user_agent: req.headers.get('user-agent') || 'unknown',
        });

        return NextResponse.json({
            success: true,
            message: 'Aadhaar verified successfully.',
            data: {
                name: processedData.name,
                dob: processedData.dob,
                gender: processedData.gender,
            },
        });
    } catch (error: any) {
        console.error('[Aadhaar OTP] verify-otp error:', error);
        return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
    }
}
