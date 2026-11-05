import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { GoogleCallbackPage } from './pages/GoogleCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { JobMatcherPage } from './pages/JobMatcherPage';
import { InterviewPrepPage } from './pages/InterviewPrepPage';
import { LiveInterviewEntryPage } from './pages/LiveInterviewEntryPage';
import { LiveInterviewRoomPage } from './pages/LiveInterviewRoomPage';
import { LiveInterviewReviewPage } from './pages/LiveInterviewReviewPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { CareerRoadmapPage } from './pages/CareerRoadmapPage';
import { ResumeImprovementPage } from './pages/ResumeImprovementPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppLayout } from './components/layout/AppLayout';
import { CustomCursor } from './components/common/CustomCursor';
import { TourProvider } from './context/TourContext';

export const App: React.FC = () => {
  return (
    <TourProvider>
      <CustomCursor />
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        {/* Protected Student Portal Routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analyzer" element={<ResumeAnalyzerPage />} />
          <Route path="/matcher" element={<JobMatcherPage />} />
          <Route path="/interview-prep" element={<InterviewPrepPage />} />
          <Route path="/live-interview" element={<LiveInterviewEntryPage />} />
          <Route path="/live-interview/review/:sessionId" element={<LiveInterviewReviewPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/roadmap" element={<CareerRoadmapPage />} />
          <Route path="/improvements" element={<ResumeImprovementPage />} />
          <Route path="/history" element={<HistoryPage />} />
          {/* Achievements removed from visible UI - redirect to dashboard */}
          <Route path="/achievements" element={<Navigate to="/dashboard" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Full-Screen Immersive AI Live Interview Room (Google Meet Style) */}
        <Route path="/live-interview/room/:sessionId" element={<LiveInterviewRoomPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TourProvider>
  );
};

export default App;
