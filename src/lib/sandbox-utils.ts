// Token cache
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

const API_KEY = process.env.SANDBOX_API_KEY;
const API_SECRET = process.env.SANDBOX_API_SECRET;
const API_BASE = process.env.SANDBOX_API_BASE || 'https://api.sandbox.co.in';

export async function getAccessToken(): Promise<string> {
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
        return accessToken;
    }

    console.log('[Sandbox] Fetching new access token...');
    
    if (!API_KEY || !API_SECRET) {
        throw new Error('SANDBOX_API_KEY and SANDBOX_API_SECRET must be set');
    }

    const response = await fetch(`${API_BASE}/authenticate`, {
        method: 'POST',
        headers: {
            'x-api-key': API_KEY,
            'x-api-secret': API_SECRET,
            'x-api-version': '1.0'
        }
    });

    const data = await response.json();
    
    if (data.code === 200 && data.data?.access_token) {
        accessToken = data.data.access_token;
        tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
        console.log('[Sandbox] Access token obtained successfully');
        if (!accessToken) throw new Error('Access token is null');
        return accessToken;
    } else {
        console.error('[Sandbox] Auth failed:', JSON.stringify(data, null, 2));
        const errorMsg = data.message || 'Unknown error';
        throw new Error(`Failed to authenticate with Sandbox API: ${errorMsg}`);
    }
}
