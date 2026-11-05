import apiClient from './apiClient';
import { ResumeAnalysis, ResumeImprovementSuggestion } from '../types';

export const resumeService = {
  async uploadResume(file: File): Promise<ResumeAnalysis> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ResumeAnalysis>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getResumes(): Promise<ResumeAnalysis[]> {
    const res = await apiClient.get<ResumeAnalysis[]>('/resumes/');
    return res.data;
  },

  async getLatestResume(): Promise<ResumeAnalysis> {
    const res = await apiClient.get<ResumeAnalysis>('/resumes/latest');
    return res.data;
  },

  async getResumeById(id: number): Promise<ResumeAnalysis> {
    const res = await apiClient.get<ResumeAnalysis>(`/resumes/${id}`);
    return res.data;
  },

  async deleteResume(id: number): Promise<{ message: string; id: number }> {
    const res = await apiClient.delete<{ message: string; id: number }>(`/resumes/${id}`);
    return res.data;
  },

  async setDefaultResume(id: number): Promise<ResumeAnalysis> {
    const res = await apiClient.patch<ResumeAnalysis>(`/resumes/${id}/set-default`);
    return res.data;
  },

  async downloadResume(id: number, filename: string): Promise<void> {
    const res = await apiClient.get(`/resumes/${id}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getImprovements(id: number): Promise<ResumeImprovementSuggestion[]> {
    const res = await apiClient.get<ResumeImprovementSuggestion[]>(`/resumes/${id}/improvements`);
    return res.data;
  },
};
