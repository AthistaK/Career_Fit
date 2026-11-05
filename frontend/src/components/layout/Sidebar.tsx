import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Target,
  BookOpen,
  Sparkles,
  Compass,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, tourId: 'tour-nav-dashboard' },
    { name: 'Resume Analyzer', path: '/analyzer', icon: <FileText className="w-5 h-5" />, tourId: 'tour-nav-analyzer' },
    { name: 'Job Matcher', path: '/matcher', icon: <Target className="w-5 h-5" />, tourId: 'tour-nav-matcher' },
    { name: 'Interview Preparation', path: '/interview-prep', icon: <BookOpen className="w-5 h-5" />, tourId: 'tour-nav-interview-prep' },
    { name: 'AI Interview', path: '/live-interview', icon: <Video className="w-5 h-5" />, tourId: 'tour-nav-live-interview' },
    { name: 'Recommendations', path: '/recommendations', icon: <TrendingUp className="w-5 h-5" />, tourId: 'tour-nav-recommendations' },
    { name: 'Career Roadmap', path: '/roadmap', icon: <Compass className="w-5 h-5" />, tourId: 'tour-nav-roadmap' },
    { name: 'Resume Optimizer', path: '/improvements', icon: <Sparkles className="w-5 h-5" />, tourId: 'tour-nav-improvements' },
    { name: 'Analysis History', path: '/history', icon: <History className="w-5 h-5" />, tourId: 'tour-nav-history' },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" />, tourId: 'tour-nav-settings' },
  ];

  const handleNavClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 bg-[#0B0A19]/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar / Mobile Drawer Container */}
      <aside
        className={`fixed top-0 left-0 z-50 lg:z-30 h-screen bg-[#100E21] border-r border-[#2A2548] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-72 lg:w-20' : 'w-72 lg:w-64'}`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#2A2548]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_16px_rgba(139,92,246,0.45)] flex-shrink-0">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className={`${collapsed ? 'block lg:hidden' : 'block'}`}>
                <span className="text-base font-extrabold text-[#F8FAFC] tracking-tight">CareerFit</span>
                <span className="block text-[10px] font-bold text-[#A78BFA] uppercase tracking-wider">Career Intelligence</span>
              </div>
            </div>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`hidden lg:block p-1.5 rounded-lg text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors ${
                collapsed ? 'hidden' : 'block'
              }`}
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                id={item.tourId}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all overflow-hidden ${
                    isActive
                      ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border-l-2 border-[#8B5CF6] font-bold shadow-soft-sm'
                      : 'text-[#A5A1BA] hover:bg-[#211D38]/70 hover:text-[#F8FAFC]'
                  } ${collapsed ? 'justify-start lg:justify-center px-3.5 lg:px-2' : ''}`
                }
                title={collapsed ? item.name : undefined}
              >
                <span className="text-inherit transition-transform duration-200 group-hover:scale-110 flex-shrink-0">
                  {item.icon}
                </span>
                <span
                  className={`transition-transform duration-200 group-hover:translate-x-0.5 truncate ${
                    collapsed ? 'block lg:hidden' : 'block'
                  }`}
                >
                  {item.name}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Student Mini Profile (Achievements / Level / XP removed) */}
        <div className="p-3 border-t border-[#2A2548]">
          {collapsed ? (
            <>
              {/* Desktop Collapsed View Expand Button */}
              <button
                onClick={() => setCollapsed(false)}
                className="hidden lg:flex w-full py-2 justify-center text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] rounded-xl"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Mobile Expanded View of Profile */}
              <div className="block lg:hidden p-3 rounded-2xl bg-[#19162C] border border-[#2A2548]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-soft">
                    {user?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#F8FAFC] truncate">{user?.full_name || 'Student'}</p>
                    <p className="text-[10px] font-semibold text-[#A5A1BA] truncate">
                      {user?.branch || 'Active Student'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-2xl bg-[#19162C] border border-[#2A2548]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-soft">
                  {user?.full_name?.charAt(0) || 'S'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#F8FAFC] truncate">{user?.full_name || 'Student'}</p>
                  <p className="text-[10px] font-semibold text-[#A5A1BA] truncate">
                    {user?.branch || 'Active Student'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
