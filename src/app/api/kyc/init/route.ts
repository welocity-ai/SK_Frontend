import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/sandbox-utils';
import { createSession, logAudit } from '../../../../lib/postgres';

const API_KEY = process.env.SANDBOX_API_KEY;
const API_BASE = process.env.SANDBOX_API_BASE || 'https://api.sandbox.co.in';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { candidate_id, doc_types, redirect_url, candidateName, candidateEmail, candidatePhone } = body;

        if (!candidate_id) {
            return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
        }

        const accessToken = await getAccessToken();
        
        // Map doc types
        const docTypeMap: Record<string, string> = {
            'aadhaar': 'aadhaar',
            'pan': 'pan',
            'dl': 'driving_license',
            'driving_license': 'driving_license'
        };
        const mappedDocs = (doc_types || ['aadhaar']).map((d: string) => docTypeMap[d.toLowerCase()] || d.toLowerCase());
        
        const digilockerPayload = {
            "@entity": "in.co.sandbox.kyc.digilocker.session.request",
            "flow": "signin",
            "doc_types": mappedDocs,
            "redirect_url": redirect_url
        };
        
        console.log('[KYC Init] Sending to Sandbox:', JSON.stringify(digilockerPayload, null, 2));
        
        const response = await fetch(`${API_BASE}/kyc/digilocker/sessions/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken,
                'x-api-key': API_KEY || '',
                'x-api-version': '1.0'
            },
            body: JSON.stringify(digilockerPayload)
        });
        
        const data = await response.json();
        
        if (data.code === 200 && data.data?.session_id) {
            // Save to database (SkillKendra schema handled in postgres.ts)
            await createSession({
                id: data.data.session_id,
                candidateId: candidate_id,
                name: candidateName,
                email: candidateEmail,
                phone: candidatePhone,
                status: 'pending',
                requestedDocs: mappedDocs
            });
            
            await logAudit({
                candidate_id: parseInt(String(candidate_id), 10),
                session_id: data.data.session_id,
                event: 'SESSION_INITIATED',
                details: { requested_docs: mappedDocs },
                ip_address: req.headers.get('x-forwarded-for') || 'unknown',
                user_agent: req.headers.get('user-agent') || 'unknown'
            });

            // Compatibility: Ensure authorization_url is present
            if (!data.data.authorization_url && data.data.redirect_url) {
                data.data.authorization_url = data.data.redirect_url;
            }
        }
        
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[KYC Init] Error:', error);
        return NextResponse.json({ error: 'Failed to initiate KYC session', details: error.message }, { status: 500 });
    }
}
