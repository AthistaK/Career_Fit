import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { TourStep, TourContextType } from '../types/tour';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    route: '/dashboard',
    targetSelector: '#tour-dashboard-hero',
    category: 'Dashboard Overview',
    title: 'Welcome to Your Career Command Center',
    description:
      'Get an instant overview of your CareerFit score, matched jobs, active roadmap milestones, and quick access to all intelligence tools.',
    showSpotlight: true,
    preferredPosition: 'bottom',
  },
  {
    id: 'analyzer-upload',
    route: '/analyzer',
    targetSelector: '#tour-analyzer-upload',
    category: 'Resume Analyzer',
    title: 'Upload & Parse Your Resume',
    description:
      'Upload your PDF or DOCX resume to extract verified skills, calculate your explainable CareerFit Score, and analyze strengths.',
    showSpotlight: true,
    preferredPosition: 'bottom',
  },
  {
    id: 'resume-library',
    route: '/analyzer?tab=library',
    targetSelector: '#tour-resume-library',
    category: 'Resume Library',
    title: 'Manage Multiple Resumes',
    description:
      'Organize tailored resumes for different roles. Preview raw text, download original files, set your default resume, or delete old versions.',
    showSpotlight: true,
    preferredPosition: 'bottom',
  },
  {
    id: 'job-matcher',
    route: '/matcher',
    targetSelector: '#tour-matcher-form',
    category: 'Job Matcher',
    title: 'Match Against Job Descriptions',
    description:
      'Paste any job opening description to measure your compatibility, uncover exact matched skills, and see missing skill gaps.',
    showSpotlight: true,
    preferredPosition: 'bottom',
  },
  {
    id: 'interview-prep',
    route: '/interview-prep',
    targetSelector: '#tour-interview-prep',
    category: 'Interview Preparation',
    title: 'Targeted Interview Coaching',
    description:
      'Generate personalized interview questions with STAR answers grounded strictly in your real projects and the job description.',
    showSpotlight: true,
    preferredPosition: 'bottom',
  },
  {
    id: 'live-interview',
    route: '/live-interview',
    targetSelector: '#tour-live-interview-entry',
    category: 'AI Live Interview',
    title: 'AI Live Interview',
    description:
      'Practice a real interview with your AI interviewer. Answer questions using your voice and get personalized feedback based on your resume and job role.',
    showSpotlight: true,
    preferredPosition: 'bottom',
  },
  {
    id: 'recommendations',
    route: '/recommendations',
    targetSelector: '#tour-nav-recommendations',
    category: 'Career Recommendations',
    title: 'Discover AI Role Recommendations',
    description:
      'Explore high-demand career tracks matched to your skillset, review starting salary benchmarks, and target key skill gaps. Accessible anytime from Recommendations in your sidebar.',
    showSpotlight: true,
    preferredPosition: 'right',
  },
  {
    id: 'roadmap',
    route: '/roadmap',
    targetSelector: '#tour-nav-roadmap',
    category: 'Career Roadmap',
    title: 'Follow Your Milestone Learning Path',
    description:
      'Step-by-step milestone progression tailored to your target placement role with core competencies and actionable student deliverables.',
    showSpotlight: true,
    preferredPosition: 'right',
  },
  {
    id: 'improvements',
    route: '/improvements',
    targetSelector: '#tour-nav-improvements',
    category: 'Resume Optimizer',
    title: 'Action-Verb Bullet Improvements',
    description:
      'Upgrade weak bullet points into high-impact statements using active engineering verbs and quantified metrics.',
    showSpotlight: true,
    preferredPosition: 'right',
  },
  {
    id: 'history',
    route: '/history',
    targetSelector: '#tour-nav-history',
    category: 'Analysis History',
    title: 'Track Your Readiness Growth',
    description:
      'Review your longitudinal score progression over time as you acquire new skills, complete projects, and improve your resume.',
    showSpotlight: true,
    preferredPosition: 'right',
  },
  {
    id: 'settings',
    route: '/settings',
    targetSelector: '#tour-nav-settings',
    category: 'Student Settings',
    title: 'Manage Your Account & Revisit Tour',
    description:
      'Update your college, branch, and expected graduation year. You can also re-launch this interactive tour anytime from here or the dashboard.',
    showSpotlight: true,
    preferredPosition: 'right',
  },
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);

  // Check if first-time user on dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      const tourStatus = localStorage.getItem('careerfit_tour_status');
      if (!tourStatus && !isTourActive) {
        setShowWelcomeModal(true);
      }
    }
  }, [location.pathname, isTourActive]);

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];

  const navigateToStepRoute = (step: TourStep) => {
    // If route has query params like /analyzer?tab=library, split and navigate
    navigate(step.route);
  };

  const startTour = (stepIndex = 0) => {
    setShowWelcomeModal(false);
    const validIndex = Math.max(0, Math.min(TOUR_STEPS.length - 1, stepIndex));
    setCurrentStepIndex(validIndex);
    setIsTourActive(true);
    navigateToStepRoute(TOUR_STEPS[validIndex]);
  };

  const nextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      navigateToStepRoute(TOUR_STEPS[nextIndex]);
    } else {
      finishTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      navigateToStepRoute(TOUR_STEPS[prevIndex]);
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
    setShowWelcomeModal(false);
    localStorage.setItem('careerfit_tour_status', 'skipped');
  };

  const finishTour = () => {
    setIsTourActive(false);
    setShowWelcomeModal(false);
    localStorage.setItem('careerfit_tour_status', 'completed');

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }

    navigate('/dashboard');
  };

  const openWelcomeModal = () => {
    setShowWelcomeModal(true);
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('careerfit_tour_status', 'skipped');
  };

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        finishTour,
        showWelcomeModal,
        openWelcomeModal,
        closeWelcomeModal,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
