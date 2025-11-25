import { AuthResponse, SignupRequest, SigninRequest, AuthTokens, User } from '@/types/auth';
import { API_BASE_URL } from '@/lib/config/api';

class AuthService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${normalizedEndpoint}`;
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[AuthService] Request:', { method: options.method || 'GET', url, endpoint: normalizedEndpoint });
    }
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      try {
        const error = await response.json();
        const candidates: unknown[] = [
          error?.message,
          error?.error,
          error?.message?.message,
          error?.message?.error,
          Array.isArray(error?.message) ? error.message[0] : undefined,
          error?.data?.message,
          error?.detail,
        ];
        const firstString = candidates.find((c) => typeof c === 'string') as string | undefined;
        if (firstString) {
          errorMessage = firstString;
        } else {
          errorMessage = JSON.stringify(error) || 'An error occurred';
        }
      } catch {
        const status = response.status ?? 'Unknown';
        const statusText = response.statusText ?? 'Error';
        errorMessage = `${status} ${statusText} - ${url}`;
      }
      throw new Error(errorMessage || 'An error occurred');
    }

    return response.json();
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.request<{ success?: boolean; data?: AuthResponse; tokens?: AuthTokens; user?: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Handle wrapped response format: { success: true, data: { tokens, user } }
    // Or direct format: { tokens, user }
    if (response.data) {
      return response.data as AuthResponse;
    }
    // Fallback to direct format
    return response as AuthResponse;
  }

  async signin(data: SigninRequest): Promise<AuthResponse> {
    const response = await this.request<{ success?: boolean; data?: AuthResponse; tokens?: AuthTokens; user?: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Handle wrapped response format: { success: true, data: { tokens, user } }
    // Or direct format: { tokens, user }
    if (response.data) {
      return response.data as AuthResponse;
    }
    // Fallback to direct format
    return response as AuthResponse;
  }

  async logout(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    await this.request('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async refreshTokens(): Promise<AuthResponse> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    // Backend expects refreshToken in request body, not headers
    const response = await this.request<{ success?: boolean; data?: AuthResponse; tokens?: AuthTokens; user?: User }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    // Handle wrapped response format: { success: true, data: { tokens, user } }
    // Or direct format: { tokens, user }
    if (response.data) {
      return response.data as AuthResponse;
    }
    // Fallback to direct format
    return response as AuthResponse;
  }
}

export const authService = new AuthService();


