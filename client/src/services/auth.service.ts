import api from './api';
import type { User, Profile, Settings } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
  profile: Profile;
  settings: Settings;
}

export interface RegisterResponse {
  token: string;
  user: User;
  profile: Profile;
  settings: Settings;
}

export const authService = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', { username, email, password });
    return data.data as AuthResponse;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data as AuthResponse;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/verify-email', { token });
    return data.data as { message: string };
  },

  async resendVerification(email: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data.data as { message: string };
  },

  async me(): Promise<AuthResponse> {
    const { data } = await api.get('/auth/me');
    return data.data as AuthResponse;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
