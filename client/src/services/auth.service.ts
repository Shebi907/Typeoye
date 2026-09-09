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
  async register(username: string, email: string, password: string, securityQuestion: string, securityAnswer: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', { username, email, password, securityQuestion, securityAnswer });
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

  async forgotPassword(identifier: string): Promise<{ message: string; securityQuestion?: string }> {
    const { data } = await api.post('/auth/forgot-password', { identifier });
    return data.data as { message: string; securityQuestion?: string };
  },

  async verifySecurityAnswer(identifier: string, answer: string): Promise<{ resetToken: string }> {
    const { data } = await api.post('/auth/verify-security-answer', { identifier, answer });
    return data.data as { resetToken: string };
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.post('/auth/reset-password', { resetToken, newPassword });
    return data.data as { message: string };
  },

  async setSecurityQuestion(question: string, answer: string): Promise<{ message: string }> {
    const { data } = await api.post('/users/me/security-question', { question, answer });
    return data.data as { message: string };
  },

  async getSecurityQuestionStatus(): Promise<{ configured: boolean }> {
    const { data } = await api.get('/users/me/security-question-status');
    return data.data as { configured: boolean };
  },
};
