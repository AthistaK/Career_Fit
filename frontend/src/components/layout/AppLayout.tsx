import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { useTour } from '../../context/TourContext';
import { LoadingState } from '../common/LoadingAndEmpty';
import { TourOverlay } from '../tour/TourOverlay';
import { WelcomeTourModal } from '../tour/WelcomeTourModal';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isTourActive } = useTour();

  // Ensure sidebar is uncollapsed during the tour so navigation items have both icon and text fully visible
  useEffect(() => {
    if (isTourActive && collapsed) {
      setCollapsed(false);
    }
  }, [isTourActive, collapsed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0A19]">
        <LoadingState message="Loading Career Workspace..." subMessage="Authenticating student session" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B0A19] text-[#F8FAFC] flex overflow-x-hidden">
      {/* Interactive Guided Tour & Welcome Experience */}
      <TourOverlay />
      <WelcomeTourModal />

      {/* Sidebar & Mobile Navigation Drawer */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 min-w-0 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Header
          collapsed={collapsed}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
        />

        <main className="flex-1 mt-16 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
