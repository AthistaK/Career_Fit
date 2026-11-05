import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  collapsed: boolean;
  onToggleMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header
      className={`h-16 bg-[#100E21]/80 backdrop-blur-md border-b border-[#2A2548] fixed top-0 right-0 z-20 flex items-center justify-between px-3.5 sm:px-6 transition-all duration-300 left-0 ${
        collapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      {/* Mobile Hamburger & Student Context */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 -ml-1 rounded-xl text-[#A5A1BA] hover:text-[#F8FAFC] hover:bg-[#211D38] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-[#F8FAFC] flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="truncate">{user?.full_name || 'Student Portal'}</span>
            <span className="hidden sm:inline text-xs font-medium text-[#A5A1BA]">•</span>
            <span className="hidden md:inline text-xs font-semibold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2.5 py-0.5 rounded-full truncate">
              {user?.branch || 'Computer Science'} • {user?.graduation_year || 2027}
            </span>
          </h2>
        </div>
      </div>

      {/* Right Controls (Logout button, XP pill removed) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-1.5 sm:p-2 rounded-xl text-[#A5A1BA] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
