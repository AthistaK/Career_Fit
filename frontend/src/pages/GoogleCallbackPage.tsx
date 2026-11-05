import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, RotateCcw, ArrowRight, Compass } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const oauthError = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const returnedState = searchParams.get('state');
    const savedState = sessionStorage.getItem('google_oauth_state');

    // Verify state if state was saved
    if (savedState && returnedState && savedState !== returnedState) {
      sessionStorage.removeItem('google_oauth_state');
      setLoading(false);
      setError('OAuth security state validation mismatch. Please initiate login again from CareerFit.');
      return;
    }
    sessionStorage.removeItem('google_oauth_state');

    if (oauthError) {
      setLoading(false);
      setError(
        errorDescription ||
          (oauthError === 'access_denied'
            ? 'Sign in was cancelled. You chose not to proceed with Google account selection.'
            : `Google authentication error: ${oauthError}`)
      );
      return;
    }

    if (!code) {
      setLoading(false);
      setError('No authorization code was returned from Google.');
      return;
    }

    const exchangeCode = async () => {
      try {
        setLoading(true);
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        const res = await authService.googleCallback({
          code,
          redirect_uri: redirectUri,
        });

        await login(res.access_token);
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Failed to exchange Google OAuth code:', err);
        setError(
          err.response?.data?.detail ||
            'Failed to authenticate with Google. Please check your credentials or try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    exchangeCode();
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0A19] text-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">CareerFit</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8 space-y-6 bg-[#19162C] border border-[#2A2548] text-center shadow-2xl">
          {loading && (
            <div className="space-y-4 py-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6] flex items-center justify-center mx-auto text-[#A78BFA] animate-spin">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Authenticating with Google...</h3>
                <p className="text-xs text-[#A5A1BA] mt-1">
                  Connecting to your Google account and creating your secure session...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Google Authentication Notice</h3>
                <p className="text-xs text-[#A5A1BA] mt-1 leading-relaxed">{error}</p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/login')}
                  className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Return to Sign In
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default GoogleCallbackPage;
