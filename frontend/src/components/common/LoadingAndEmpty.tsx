import React, { ReactNode } from 'react';
import { Button } from './Button';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Processing Career Data...',
  subMessage = 'Analyzing skills and computing explainable metrics',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-[#211D38] border-t-[#8B5CF6] rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-[#8B5CF6] rounded-full animate-pulse shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
        </div>
      </div>
      <div>
        <h4 className="text-base font-bold text-[#F8FAFC]">{message}</h4>
        <p className="text-xs text-[#A5A1BA] mt-1 max-w-sm">{subMessage}</p>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-[#19162C] border border-dashed border-[#2A2548]">
      <div className="p-4 bg-[#211D38] text-[#A78BFA] rounded-2xl mb-4 border border-[#2A2548]">
        {icon}
      </div>
      <h4 className="text-base font-bold text-[#F8FAFC] mb-1">{title}</h4>
      <p className="text-xs text-[#A5A1BA] max-w-md mb-5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
