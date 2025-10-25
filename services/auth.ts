import { AuthResponse, SignupRequest, SigninRequest } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pms-api.daminaa.org/api/v1';

class AuthService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
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
          errorMessage = JSON.stringify(error);
        }
      } catch {
        errorMessage = `${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signin(data: SigninRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    await this.request('/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async refreshTokens(): Promise<AuthResponse> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    return this.request<AuthResponse>('/refresh', {
      method: 'POST',
      headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : undefined,
    });
  }
}

export const authService = new AuthService();


