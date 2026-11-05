import apiClient from './apiClient';
import { AuthResponse, User } from '../types';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    college?: string;
    branch?: string;
    graduation_year?: number;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    if (res.data.access_token) {
      localStorage.setItem('careerfit_token', res.data.access_token);
    }
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    if (res.data.access_token) {
      localStorage.setItem('careerfit_token', res.data.access_token);
    }
    return res.data;
  },

  async googleAuth(data: {
    token: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/google', data);
    if (res.data.access_token) {
      localStorage.setItem('careerfit_token', res.data.access_token);
    }
    return res.data;
  },

  async googleCallback(data: { code: string; redirect_uri: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/google/callback', data);
    if (res.data.access_token) {
      localStorage.setItem('careerfit_token', res.data.access_token);
    }
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await apiClient.put<User>('/users/me', data);
    return res.data;
  },

  logout(): void {
    localStorage.removeItem('careerfit_token');
    localStorage.removeItem('careerpath_token');
  },

  isAuthenticated(): boolean {
    return !!(localStorage.getItem('careerfit_token') || localStorage.getItem('careerpath_token'));
  },
};
