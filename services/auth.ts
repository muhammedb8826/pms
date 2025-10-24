import { AuthResponse, SignupRequest, SigninRequest } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
        errorMessage = error.message || error.error || errorMessage;
      } catch {}
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


