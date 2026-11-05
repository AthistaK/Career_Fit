import apiClient from './apiClient';
import {
  LiveInterviewSession,
  LiveInterviewSessionCreateRequest,
  LiveInterviewStartResponse,
  LiveInterviewTurnSubmitRequest,
  LiveInterviewTurnNextResponse,
  LiveInterviewDashboardStats,
} from '../types/liveInterview';

export const liveInterviewService = {
  async createSession(data: LiveInterviewSessionCreateRequest): Promise<LiveInterviewSession> {
    const res = await apiClient.post<LiveInterviewSession>('/live-interview/sessions', data);
    return res.data;
  },

  async getSessions(): Promise<LiveInterviewSession[]> {
    const res = await apiClient.get<LiveInterviewSession[]>('/live-interview/sessions');
    return res.data;
  },

  async getSession(id: number): Promise<LiveInterviewSession> {
    const res = await apiClient.get<LiveInterviewSession>(`/live-interview/sessions/${id}`);
    return res.data;
  },

  async startSession(id: number): Promise<LiveInterviewStartResponse> {
    const res = await apiClient.post<LiveInterviewStartResponse>(`/live-interview/sessions/${id}/start`);
    return res.data;
  },

  async submitTurn(
    sessionId: number,
    data: LiveInterviewTurnSubmitRequest
  ): Promise<LiveInterviewTurnNextResponse> {
    const res = await apiClient.post<LiveInterviewTurnNextResponse>(
      `/live-interview/sessions/${sessionId}/turn`,
      data
    );
    return res.data;
  },

  async finishSession(id: number): Promise<LiveInterviewSession> {
    const res = await apiClient.post<LiveInterviewSession>(`/live-interview/sessions/${id}/finish`);
    return res.data;
  },

  async uploadRecording(
    sessionId: number,
    blob: Blob,
    durationSeconds: number,
    consentGiven: boolean = true
  ): Promise<{ message: string; recording_id: number }> {
    const formData = new FormData();
    formData.append('file', blob, `interview_${sessionId}.webm`);
    formData.append('duration_seconds', durationSeconds.toString());
    formData.append('consent_given', consentGiven ? 'true' : 'false');

    const res = await apiClient.post<{ message: string; recording_id: number }>(
      `/live-interview/sessions/${sessionId}/recording`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  getRecordingStreamUrl(sessionId: number): string {
    return `/api/v1/live-interview/sessions/${sessionId}/recording`;
  },

  async deleteRecording(sessionId: number): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(
      `/live-interview/sessions/${sessionId}/recording`
    );
    return res.data;
  },

  async getDashboardStats(): Promise<LiveInterviewDashboardStats> {
    const res = await apiClient.get<LiveInterviewDashboardStats>('/live-interview/dashboard/stats');
    return res.data;
  },
};
