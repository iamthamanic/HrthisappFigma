import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { Alert, AlertDescription } from './ui/alert';
import Logo from './Logo';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ConnectionError from './ConnectionError';
import sanitize from '../utils/security/BrowoKo_sanitization';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, login, loading, initialized, connectionError } = useAuthStore();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (initialized && user) {
      console.log('✅ User already logged in, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [initialized, user, navigate]);

  // Show register form
  if (showRegister) {
    return <Register onBackToLogin={() => setShowRegister(false)} />;
  }

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
        setError('E-Mail oder Passwort falsch. Noch kein Account? Klicke auf "Jetzt registrieren"!');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('⚠️ Email-Bestätigung erforderlich! Bitte führe die Migration 004_disable_email_confirmation.sql aus oder deaktiviere Email-Bestätigung in Supabase Dashboard → Authentication → Settings.');
      } else {
        setError(err.message || 'Login fehlgeschlagen');
      }
    }
  };



  return (
    <div className="min-h-screen bg-white flex items-start justify-center p-4 pt-20">
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
            <div className="mb-4 space-y-3">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              {error.includes('E-Mail oder Passwort falsch') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900 font-semibold mb-1">
                    💡 Noch kein Account?
                  </p>
                  <p className="text-xs text-blue-800">
                    Klicke unten auf den grünen Button "Jetzt registrieren" um einen kostenlosen Account zu erstellen!
                  </p>
                </div>
              )}
            </div>
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

          {/* Register Section */}
          <div className="mt-6 pt-6 border-t border-[rgba(0,0,0,0.1)]">
            <p className="text-center text-[14px] text-[#4a5565] leading-[20px] tracking-[-0.1504px] mb-3">
              Noch kein Account?
            </p>
            
            {/* Register Button */}
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="w-full h-[36px] bg-[#00a63e] hover:bg-[#008a34] text-white rounded-[8px] text-[14px] font-medium tracking-[-0.1504px] transition-colors flex items-center justify-center gap-1.5"
            >
              {/* Icon */}
              <svg className="w-[16px] h-[16px] shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M10.6667 14V12.6667C10.6667 11.9594 10.3857 11.2811 9.88562 10.781C9.38552 10.281 8.70724 10 8 10H4C3.29276 10 2.61448 10.281 2.11438 10.781C1.61428 11.2811 1.33333 11.9594 1.33333 12.6667V14" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 7.33333C7.47276 7.33333 8.66667 6.13943 8.66667 4.66667C8.66667 3.19391 7.47276 2 6 2C4.52724 2 3.33333 3.19391 3.33333 4.66667C3.33333 6.13943 4.52724 7.33333 6 7.33333Z" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12.6667 5.33333V9.33333" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.6667 7.33333H10.6667" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Jetzt registrieren</span>
            </button>
            
            <p className="text-center text-[12px] text-[#6a7282] leading-[16px] mt-3">
              Kostenlos in 30 Sekunden erstellt!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[14px] text-[#4a5565] leading-[20px] tracking-[-0.1504px] mt-5">
          © 2025 Browo Koordinator - Alle Rechte vorbehalten
        </p>
      </div>
    </div>
  );
}
