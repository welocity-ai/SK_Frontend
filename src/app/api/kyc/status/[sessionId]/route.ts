import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/sandbox-utils';
import { getSession, updateSessionStatus } from '../../../../../lib/postgres';

const API_KEY = process.env.SANDBOX_API_KEY;
const API_BASE = process.env.SANDBOX_API_BASE || 'https://api.sandbox.co.in';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        
        // 1. First, check our own DB
        const sessionData = await getSession(sessionId);
        
        // 2. If session is already verified in our DB, just return it
        if (sessionData && sessionData.status === 'verified') {
            const documents: Record<string, any> = {};
            if (sessionData.aadhaar_data) documents['aadhaar'] = sessionData.aadhaar_data;
            if (sessionData.pan_data) documents['pan'] = sessionData.pan_data;
            if (sessionData.dl_data) documents['driving_license'] = sessionData.dl_data;
            
            return NextResponse.json({
                success: true,
                status: 'verified',
                name: sessionData.candidate_name,
                documents: documents
            });
        }

        // 3. If not verified or missing, try to sync with Sandbox (mostly for DigiLocker flow)
        try {
            const accessToken = await getAccessToken();
            
            console.log(`[KYC Status] Syncing with Sandbox for session: ${sessionId}`);
            
            const response = await fetch(`${API_BASE}/kyc/digilocker/sessions/${sessionId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': accessToken,
                    'x-api-key': API_KEY || '',
                    'x-api-version': '1.0'
                }
            });
            
            const data = await response.json();
            
            if (data.code === 200) {
                const status = data.data?.status;
                if (status) {
                    await updateSessionStatus(sessionId, status);
                }
                
                // Re-fetch from DB after sync
                const updatedSession = await getSession(sessionId);
                if (updatedSession) {
                    const documents: Record<string, any> = {};
                    if (updatedSession.aadhaar_data) documents['aadhaar'] = updatedSession.aadhaar_data;
                    if (updatedSession.pan_data) documents['pan'] = updatedSession.pan_data;
                    
                    return NextResponse.json({
                        success: true,
                        status: updatedSession.status,
                        name: updatedSession.candidate_name,
                        documents: documents,
                        raw_sandbox: data
                    });
                }
            }
        } catch (sandboxError) {
            console.warn('[KYC Status] Sandbox sync failed, falling back to local data:', sandboxError);
        }
        
        // 4. Fallback to whatever we have in DB
        if (sessionData) {
            return NextResponse.json({
                success: true,
                status: sessionData.status,
                name: sessionData.candidate_name
            });
        }
        
        return NextResponse.json({ success: false, error: 'KYC session not found' }, { status: 404 });
    } catch (error: any) {
        console.error('[KYC Status] Critical Error:', error);
        return NextResponse.json({ error: 'Failed to fetch KYC status', details: error.message }, { status: 500 });
    }
}
