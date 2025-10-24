import { useState } from 'react';
import { useAuthStore } from '../stores/HRTHIS_authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import Logo from './Logo';
import { Key, CheckCircle } from './icons/HRTHISIcons';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { updatePassword, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    try {
      await updatePassword(password);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('Update password error:', err);
      
      if (err.message?.includes('expired')) {
        setError('Der Link ist abgelaufen. Bitte fordere einen neuen Link an.');
      } else {
        setError('Fehler beim Aktualisieren des Passworts. Bitte versuche es erneut.');
      }
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
              Passwort erfolgreich geändert! 🎉
            </h2>
            <p className="text-gray-600 mb-4">
              Dein Passwort wurde aktualisiert. Du wirst automatisch zum Login weitergeleitet...
            </p>
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-4 flex justify-center">
              <Logo size="md" showText={false} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Neues Passwort setzen
            </h2>
            <p className="text-sm text-gray-600">
              Bitte gib dein neues Passwort ein.
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
              <Label htmlFor="password">Neues Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="text-xs">
                <p className="text-gray-600 mb-1">Passwortstärke:</p>
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded ${password.length >= 6 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                  <div className={`h-1 flex-1 rounded ${password.length >= 10 && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                </div>
                <p className="text-gray-500 mt-1">
                  {password.length < 6 && 'Zu kurz'}
                  {password.length >= 6 && password.length < 8 && 'Okay'}
                  {password.length >= 8 && password.length < 10 && 'Gut'}
                  {password.length >= 10 && !/[A-Z]/.test(password) && 'Gut'}
                  {password.length >= 10 && /[A-Z]/.test(password) && 'Sehr gut'}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Wird aktualisiert...
                </span>
              ) : (
                'Passwort aktualisieren'
              )}
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-gray-500">
              Nach der Aktualisierung wirst du automatisch zum Login weitergeleitet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
