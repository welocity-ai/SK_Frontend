/**
 * Authentication service
 */

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || ''}/api`;

export interface SessionData {
  authenticated: boolean;
  user?: {
    verification_status: string;
    verified_at: string;
    kyc?: boolean;
    candidate_id?: number;
    candidate_name?: string;
  };
  verification_status?: string;
  expires_at?: string;
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
      return { authenticated: false };
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
