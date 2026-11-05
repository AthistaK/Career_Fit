import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTour } from '../context/TourContext';
import { authService } from '../services/authService';
import { Settings, User, GraduationCap, Building, Calendar, Check, AlertCircle, Compass } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { startTour } = useTour();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [college, setCollege] = useState(user?.college || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [gradYear, setGradYear] = useState(user?.graduation_year || 2027);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSavedSuccess(false);

    try {
      await authService.updateProfile({
        full_name: fullName,
        college,
        branch,
        graduation_year: Number(gradYear),
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <Badge variant="slate" icon={<Settings className="w-3.5 h-3.5" />}>
          Profile Configuration
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight mt-1">
          Account & Student Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#A5A1BA]">
          Manage your college degree details, academic year, and personal preferences.
        </p>
      </div>

      {/* Guided Tour Configuration Card */}
      <Card className="p-6 bg-[#19162C] border border-[#2A2548] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">Guided Website Tour</h3>
            <span className="text-[10px] font-bold text-[#A78BFA] bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 px-2 py-0.5 rounded-full">
              Interactive
            </span>
          </div>
          <p className="text-xs text-[#A5A1BA]">
            Need a refresher on CareerFit features? Re-launch the 10-step interactive walkthrough anytime.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => startTour(0)}
          leftIcon={<Compass className="w-4 h-4 text-[#8B5CF6]" />}
          className="w-full sm:w-auto text-xs whitespace-nowrap"
        >
          Take a Tour Again
        </Button>
      </Card>

      <Card id="tour-settings" className="p-8 space-y-6 bg-[#19162C] border border-[#2A2548]">
        {savedSuccess && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profile settings saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">Email (Read Only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 text-xs font-medium bg-[#211D38]/50 border border-[#2A2548] rounded-xl text-[#A5A1BA] cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">College / University</label>
              <div className="relative">
                <Building className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">Branch / Degree</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">Expected Graduation Year</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3.5" />
              <input
                type="number"
                value={gradYear}
                onChange={(e) => setGradYear(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={loading}>
            Save Settings
          </Button>
        </form>
      </Card>
    </div>
  );
};
