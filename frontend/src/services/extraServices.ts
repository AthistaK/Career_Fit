import apiClient from './apiClient';
import {
  CareerRoleRecommendation,
  CareerRoadmap,
  AnalysisHistoryItem,
  ScoreProgressionPoint,
  GamificationProfile,
} from '../types';

export const recommendationService = {
  async getRecommendations(): Promise<CareerRoleRecommendation[]> {
    const res = await apiClient.get<CareerRoleRecommendation[]>('/recommendations/');
    return res.data;
  },
};

export const roadmapService = {
  async getRoadmap(roleTitle?: string): Promise<CareerRoadmap> {
    const res = await apiClient.get<CareerRoadmap>('/roadmap/', {
      params: roleTitle ? { role_title: roleTitle } : undefined,
    });
    return res.data;
  },

  async generateRoadmap(targetRoleTitle: string): Promise<CareerRoadmap> {
    const res = await apiClient.post<CareerRoadmap>('/roadmap/generate', {
      target_role_title: targetRoleTitle,
    });
    return res.data;
  },
};

export const historyService = {
  async getHistory(): Promise<AnalysisHistoryItem[]> {
    const res = await apiClient.get<AnalysisHistoryItem[]>('/history/');
    return res.data;
  },

  async getScoreProgression(): Promise<ScoreProgressionPoint[]> {
    const res = await apiClient.get<ScoreProgressionPoint[]>('/history/progression');
    return res.data;
  },
};

export const achievementService = {
  async getGamificationProfile(): Promise<GamificationProfile> {
    const res = await apiClient.get<GamificationProfile>('/achievements/');
    return res.data;
  },
};
