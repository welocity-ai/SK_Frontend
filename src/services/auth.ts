/**
 * Authentication service for Didit integration
 */

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1`;

export interface SessionData {
  authenticated: boolean;
  user?: {
    didit_session_id: string;
    verification_status: string;
    verified_at: string;
  };
  verification_status?: string;
  expires_at?: string;
}

/**
 * Start Didit authentication flow
 * Redirects user to Didit verification page
 */
export async function startDidit(): Promise<void> {
  try {
    // Direct redirect to Didit verification page
    const diditUrl = 'https://verify.didit.me/verify/cUUfbikLuVDviVn4HQzR_Q';
    window.location.href = diditUrl;
  } catch (error) {
    console.error('Error starting Didit authentication:', error);
    throw error;
  }
}

/**
 * Handle Didit callback
 * Sends verification result to backend
 */
export async function handleCallback(
  verificationSessionId: string,
  status: string
): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({
        verificationSessionId,
        status,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error handling callback:', error);
    throw error;
  }
}

/**
 * Get current session
 * Returns user data if authenticated
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      method: 'GET',
      credentials: 'include', // Important: include cookies
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Logout user
 * Clears session and cookie
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Important: include cookies
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
