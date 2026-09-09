import api from './api';
import type { AchievementView, Profile, ProfileProgress, Settings, User } from '../types';
export const userService = {
  async updateSettings(updates: Partial<Settings>): Promise<Settings> { const { data } = await api.patch('/users/settings', updates); return (data.data as { settings: Settings }).settings; },
  async getProfile(id: string): Promise<{ profile: Profile; progress: ProfileProgress }> { const { data } = await api.get(`/users/${id}/profile`); return data.data as { profile: Profile; progress: ProfileProgress }; },
  async getMyProfile(): Promise<{ profile: Profile; progress: ProfileProgress }> { const { data } = await api.get('/users/me/profile'); return data.data as { profile: Profile; progress: ProfileProgress }; },
  async getAchievements(): Promise<AchievementView[]> { const { data } = await api.get('/users/me/achievements'); return (data.data as { achievements: AchievementView[] }).achievements; },
  async updateAvatar(dataUrl: string): Promise<{ profile: Profile }> { const { data } = await api.post('/users/me/avatar', { dataUrl }); return data.data as { profile: Profile }; },
  async removeAvatar(): Promise<{ profile: Profile }> { const { data } = await api.delete('/users/me/avatar'); return data.data as { profile: Profile }; },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> { await api.post('/users/me/password', { currentPassword, newPassword }); },
  async setPassword(newPassword: string): Promise<{ user: User }> { const { data } = await api.post('/users/me/set-password', { newPassword }); return data.data as { user: User }; },
};