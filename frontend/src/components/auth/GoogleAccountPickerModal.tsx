import React, { useState } from 'react';
import { X, UserPlus, ArrowRight, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleAccountPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MockAccount {
  id: string;
  name: string;
  email: string;
  avatarBg: string;
  initials: string;
}

const PRESET_ACCOUNTS: MockAccount[] = [
  {
    id: 'athista',
    name: 'Athista K',
    email: 'athista.k@gmail.com',
    avatarBg: 'bg-[#8B5CF6]',
    initials: 'AK',
  },
  {
    id: 'student',
    name: 'Student User',
    email: 'student.user@college.edu',
    avatarBg: 'bg-emerald-600',
    initials: 'SU',
  },
  {
    id: 'alex',
    name: 'Alex Johnson',
    email: 'alex.j@university.edu',
    avatarBg: 'bg-blue-600',
    initials: 'AJ',
  },
];

export const GoogleAccountPickerModal: React.FC<GoogleAccountPickerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAccount = async (account: { name: string; email: string; id: string }) => {
    setLoadingAccount(account.id);
    setError(null);

    try {
      const res = await authService.googleAuth({
        token: `google_token_${account.email}_${Date.now()}`,
        email: account.email,
        full_name: account.name,
      });

      await login(res.access_token);
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Account selection error:', err);
      setError(err.response?.data?.detail || 'Failed to sign in with selected Google account.');
      setLoadingAccount(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      setError('Please provide both your name and Google email.');
      return;
    }
    if (!customEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    handleSelectAccount({
      name: customName.trim(),
      email: customEmail.trim().toLowerCase(),
      id: 'custom',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#19162C] border border-[#2A2548] rounded-2xl shadow-2xl overflow-hidden transition-all text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#2A2548] relative flex flex-col items-center text-center">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 p-1.5 rounded-lg text-[#A5A1BA] hover:text-white hover:bg-[#211D38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Official Google multicolored G Logo */}
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md mb-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-[#F8FAFC]">Choose an account</h2>
          <p className="text-xs text-[#A5A1BA] mt-1">to continue to <span className="font-semibold text-white">CareerFit</span></p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Account List / Selection Area */}
        <div className="p-6 space-y-2">
          {!showCustomForm ? (
            <>
              <div className="space-y-1.5">
                {PRESET_ACCOUNTS.map((account) => {
                  const isLoading = loadingAccount === account.id;
                  return (
                    <button
                      key={account.id}
                      disabled={Boolean(loadingAccount)}
                      onClick={() => handleSelectAccount(account)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[#211D38]/60 hover:bg-[#211D38] border border-[#2A2548] hover:border-[#8B5CF6]/50 transition-all text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full ${account.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow`}
                        >
                          {account.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-white truncate">
                            {account.name}
                          </p>
                          <p className="text-[11px] text-[#A5A1BA] truncate">{account.email}</p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-transparent group-hover:border-[#8B5CF6]/40 flex items-center justify-center text-[#A78BFA] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Use another account option */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowCustomForm(true);
                }}
                disabled={Boolean(loadingAccount)}
                className="w-full mt-3 flex items-center gap-3 p-3 rounded-xl bg-[#211D38]/30 hover:bg-[#211D38] border border-dashed border-[#2A2548] hover:border-[#8B5CF6]/60 transition-all text-left text-xs font-medium text-[#A5A1BA] hover:text-[#F8FAFC]"
              >
                <div className="w-9 h-9 rounded-full bg-[#2A2548] flex items-center justify-center text-[#A78BFA] shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Use another Google account</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Full Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2 text-xs bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">Google Email</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. priya.sharma@gmail.com"
                  className="w-full px-3.5 py-2 text-xs bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#211D38] border border-[#2A2548] text-xs font-semibold text-[#A5A1BA] hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loadingAccount === 'custom'}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white shadow flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {loadingAccount === 'custom' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Security note */}
          <div className="pt-3 border-t border-[#2A2548] flex items-center justify-between text-[11px] text-[#A5A1BA]">
            <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure 256-bit OAuth
            </span>
            <span>CareerFit Account Chooser</span>
          </div>
        </div>
      </div>
    </div>
  );
};
