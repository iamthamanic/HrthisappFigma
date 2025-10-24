import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import Logo from './Logo';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ConnectionError from './ConnectionError';
import { UserPlus } from './icons/HRTHISIcons';
import sanitize from '../utils/security/HRTHIS_sanitization';

// 🎨 Rotating taglines every 5 seconds
const TAGLINES = [
  'Wegen Prozesse undso',
  'Kollegen dies das',
  'HR diese halt',
  'auf chillig yaaa !',
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const { user, login, loading, initialized, connectionError } = useAuthStore();

  // Rotate tagline every 1.8 seconds with smooth fade
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
        setIsFading(false);
      }, 300); // Half of transition duration
    }, 1800);

    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" showText={false} />
          </div>

          <p 
            className={`text-blue-100 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
          >
            {TAGLINES[currentTaglineIndex]}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Anmelden</h2>

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
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="max.mustermann@hrthis.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Passwort</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Passwort vergessen?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600 mb-3">
              Noch kein Account?
            </p>
            <Button
              type="button"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setShowRegister(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Jetzt registrieren
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Kostenlos in 30 Sekunden erstellt!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-blue-100 text-sm mt-6">
          © 2025 HRthis - Alle Rechte vorbehalten
        </p>
      </div>
    </div>
  );
}
