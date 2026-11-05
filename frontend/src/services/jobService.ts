import apiClient from './apiClient';
import { JobMatchResult } from '../types';

export const jobService = {
  async instantMatch(data: {
    title: string;
    company?: string;
    description: string;
    resume_id?: number;
  }): Promise<JobMatchResult> {
    const res = await apiClient.post<JobMatchResult>('/matches/instant-match', {
      title: data.title,
      company: data.company || 'Target Company',
      description: data.description,
    }, {
      params: data.resume_id ? { resume_id: data.resume_id } : undefined,
    });
    return res.data;
  },

  async getMatches(): Promise<JobMatchResult[]> {
    const res = await apiClient.get<JobMatchResult[]>('/matches/');
    return res.data;
  },

  async getMatchById(id: number): Promise<JobMatchResult> {
    const res = await apiClient.get<JobMatchResult>(`/matches/${id}`);
    return res.data;
  },
};
