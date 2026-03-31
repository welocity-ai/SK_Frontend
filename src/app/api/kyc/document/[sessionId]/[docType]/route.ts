import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/sandbox-utils';
import { saveDocument } from '../../../../../../lib/postgres';

const API_KEY = process.env.SANDBOX_API_KEY;
const API_BASE = process.env.SANDBOX_API_BASE || 'https://api.sandbox.co.in';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string; docType: string }> }
) {
    try {
        const { sessionId, docType } = await params;
        const accessToken = await getAccessToken();
        
        // Map doc type for Sandbox API
        let apiDocType = docType;
        if (docType === 'aadhaar') apiDocType = 'AADHAAR';
        else if (docType === 'pan') apiDocType = 'PAN';
        
        console.log(`[KYC Document] Fetching ${docType} for session: ${sessionId}`);
        
        const response = await fetch(`${API_BASE}/kyc/digilocker/sessions/${sessionId}/documents/${apiDocType}`, {
            method: 'GET',
            headers: {
                'Authorization': accessToken,
                'x-api-key': API_KEY || '',
                'x-api-version': '1.0'
            }
        });
        
        const data = await response.json();
        
        if (data.code === 200) {
            await saveDocument(sessionId, docType, data.data);
        }
        
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[KYC Document] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch KYC document', details: error.message }, { status: 500 });
    }
}
