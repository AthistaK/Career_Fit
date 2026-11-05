export interface TourStep {
  id: string;
  route: string;
  targetSelector: string;
  category: string;
  title: string;
  description: string;
  showSpotlight: boolean;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TourContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  startTour: (stepIndex?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
  showWelcomeModal: boolean;
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
}
