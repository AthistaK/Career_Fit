import apiClient from './apiClient';
import {
  InterviewPrepSession,
  InterviewPrepCreateRequest,
} from '../types';

export const interviewService = {
  async generatePrep(data: InterviewPrepCreateRequest): Promise<InterviewPrepSession> {
    const res = await apiClient.post<InterviewPrepSession>('/interview-prep/generate', data);
    return res.data;
  },

  async getSessions(): Promise<InterviewPrepSession[]> {
    const res = await apiClient.get<InterviewPrepSession[]>('/interview-prep/');
    return res.data;
  },

  async getSession(id: number): Promise<InterviewPrepSession> {
    const res = await apiClient.get<InterviewPrepSession>(`/interview-prep/${id}`);
    return res.data;
  },

  async togglePrepared(
    sessionId: number,
    questionId: string,
    isPrepared: boolean
  ): Promise<InterviewPrepSession> {
    const res = await apiClient.patch<InterviewPrepSession>(
      `/interview-prep/${sessionId}/questions/${questionId}/toggle-prepared`,
      { is_prepared: isPrepared }
    );
    return res.data;
  },

  async deleteSession(sessionId: number): Promise<{ message: string; id: number }> {
    const res = await apiClient.delete<{ message: string; id: number }>(`/interview-prep/${sessionId}`);
    return res.data;
  },
};
