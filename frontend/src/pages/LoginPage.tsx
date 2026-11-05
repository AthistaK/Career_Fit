import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { initiateGoogleAuth } from '../utils/googleAuth';
import { GoogleAccountPickerModal } from '../components/auth/GoogleAccountPickerModal';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login({ email, password });
      await login(res.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    initiateGoogleAuth(() => {
      // If VITE_GOOGLE_CLIENT_ID is not configured, open interactive account selector
      setShowGoogleModal(true);
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0A19] text-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">CareerFit</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-[#F8FAFC]">Welcome Back</h2>
        <p className="text-xs text-[#A5A1BA] mt-1">Sign in to discover your fit & resume career matches</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 space-y-6 bg-[#19162C] border border-[#2A2548]">
          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] placeholder-[#A5A1BA]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A5A1BA] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-[#211D38] border border-[#2A2548] text-[#F8FAFC] placeholder-[#A5A1BA]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to CareerFit
            </Button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#2A2548] w-full" />
            <span className="bg-[#19162C] px-3 text-[11px] font-semibold text-[#A5A1BA] uppercase tracking-wider">or</span>
            <div className="border-t border-[#2A2548] w-full" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleGoogleSignIn}
            isLoading={loading}
            className="w-full"
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            }
          >
            Continue with Google
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-[#A5A1BA]">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#A78BFA] hover:text-[#8B5CF6]">
                Create Free Account
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <GoogleAccountPickerModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </div>
  );
};
