import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { Alert, AlertDescription } from './ui/alert';
import Logo from './Logo';
import ForgotPassword from './ForgotPassword';
import ConnectionError from './ConnectionError';
import TechCircuitBackground from './TechCircuitBackground';
import sanitize from '../utils/security/BrowoKo_sanitization';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, login, loading, initialized, connectionError } = useAuthStore();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (initialized && user) {
      console.log('✅ User already logged in, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, user, navigate]);

  // Show forgot password form
  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  // Show connection error if Supabase is not reachable
  if (connectionError) {
    return <ConnectionError onRetry={() => window.location.reload()} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // ✅ SANITIZE EMAIL (Phase 4 - Priority 2)
      const sanitizedEmail = sanitize.email(email);
      
      if (!sanitizedEmail) {
        setError('Ungültige E-Mail-Adresse');
        return;
      }

      await login(sanitizedEmail, password);
      // Login successful - navigate to dashboard
      console.log('✅ Login successful, navigating to dashboard...');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Better error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('E-Mail oder Passwort falsch.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('⚠️ Email-Bestätigung erforderlich! Bitte führe die Migration 004_disable_email_confirmation.sql aus oder deaktiviere Email-Bestätigung in Supabase Dashboard → Authentication → Settings.');
      } else {
        setError(err.message || 'Login fehlgeschlagen');
      }
    }
  };



  return (
    <>
      {/* Koordinator Background Animation */}
      <TechCircuitBackground />
      
      {/* Content Layer */}
      <div className="relative min-h-screen flex items-center justify-center p-4" style={{ zIndex: 1 }}>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center -mb-8">
            <div className="flex justify-center">
              <Logo size="lg" showText={true} />
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-[16px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] p-8 mt-0">
            <h2 className="text-[24px] font-semibold text-[#101828] leading-[32px] mb-6">Anmelden</h2>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-Mail Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-[14px] font-medium text-neutral-950 tracking-[-0.1504px]">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="max.mustermann@hrthis.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-[36px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-neutral-950 placeholder:text-[#717182] tracking-[-0.1504px] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[14px] font-medium text-neutral-950 tracking-[-0.1504px]">
                    Passwort
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[12px] font-medium text-[#155dfc] hover:text-[#0d4bc9] leading-[16px]"
                  >
                    Passwort vergessen?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-[36px] px-3 py-1 bg-[#f3f3f5] rounded-[8px] text-[14px] text-neutral-950 placeholder:text-[#717182] tracking-[-0.1504px] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#155dfc]/20"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[36px] bg-[#155dfc] hover:bg-[#0d4bc9] text-white rounded-[8px] text-[14px] font-medium tracking-[-0.1504px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center"
              >
                {loading ? 'Wird angemeldet...' : 'Anmelden'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-[14px] text-[#4a5565] leading-[20px] tracking-[-0.1504px] mt-5">
            © 2025 Browo Koordinator - Alle Rechte vorbehalten
          </p>
        </div>
      </div>
    </>
  );
}