import { useState } from 'react';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import Logo from './Logo';
import { ArrowLeft, Mail, CheckCircle } from './icons/BrowoKoIcons';
import sanitize from '../utils/security/BrowoKo_sanitization';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // ✅ SANITIZE EMAIL
    const sanitizedEmail = sanitize.email(email);

    if (!sanitizedEmail) {
      setError('Ungültige E-Mail-Adresse');
      return;
    }

    try {
      await resetPassword(sanitizedEmail);
      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError('Fehler beim Versenden der E-Mail. Bitte versuche es erneut.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              E-Mail versendet! ✉️
            </h2>
            <p className="text-gray-600 mb-6">
              Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts an <strong>{email}</strong> gesendet.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 mb-2">
                <strong>Nächste Schritte:</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-1 text-left pl-4 list-decimal">
                <li>Öffne dein E-Mail-Postfach</li>
                <li>Klicke auf den Link in der E-Mail</li>
                <li>Gib ein neues Passwort ein</li>
                <li>Melde dich mit dem neuen Passwort an</li>
              </ol>
            </div>
            <Button
              onClick={onBackToLogin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Zurück zum Login
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Keine E-Mail erhalten? Prüfe deinen Spam-Ordner oder versuche es erneut.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zum Login</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <Logo size="md" showText={false} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Passwort vergessen?
            </h2>
            <p className="text-sm text-gray-600">
              Kein Problem! Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="max@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Wird gesendet...
                </span>
              ) : (
                'Passwort zurücksetzen'
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-gray-500">
              Du erhältst eine E-Mail mit einem Link zum Zurücksetzen deines Passworts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
