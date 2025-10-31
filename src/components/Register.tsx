import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, CheckCircle } from './icons/BrowoKoIcons';
import sanitize from '../utils/security/BrowoKo_sanitization';

interface RegisterProps {
  onBackToLogin: () => void;
}

export default function Register({ onBackToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    position: '',
    department: '',
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // ✅ SANITIZE INPUTS (Phase 4 - Priority 2)
    const sanitizedEmail = sanitize.email(formData.email);
    const sanitizedFirstName = sanitize.text(formData.firstName);
    const sanitizedLastName = sanitize.text(formData.lastName);
    const sanitizedPosition = sanitize.text(formData.position);
    const sanitizedDepartment = sanitize.text(formData.department);

    // Validation
    if (!sanitizedEmail) {
      setError('Ungültige E-Mail-Adresse');
      return;
    }

    if (!sanitizedFirstName || !sanitizedLastName) {
      setError('Vor- und Nachname sind Pflichtfelder');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      // Sign up via Supabase Auth with sanitized data
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: formData.password,
        options: {
          data: {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            position: sanitizedPosition || null,
            department: sanitizedDepartment || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setSuccess(true);
        
        // Auto-login after successful registration
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
        setError('Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.');
      } else if (err.message?.includes('invalid email')) {
        setError('Ungültige E-Mail-Adresse');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Passwort muss mindestens 6 Zeichen lang sein');
      } else if (err.message?.includes('Unable to validate email')) {
        setError('E-Mail konnte nicht validiert werden. Bitte versuche es erneut.');
      } else if (err.message?.includes('Database error')) {
        setError('Database-Fehler: Bitte stelle sicher, dass die Migration 003_auto_user_profile_v2.sql ausgeführt wurde.');
      } else {
        setError(`Registrierung fehlgeschlagen: ${err.message}`);
      }
    } finally {
      setLoading(false);
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
              Erfolgreich registriert! 🎉
            </h2>
            <p className="text-gray-600 mb-4">
              Dein Account wurde erstellt und du wirst automatisch angemeldet...
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
        {/* Back Button */}
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-white hover:text-blue-100 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Zurück zum Login</span>
        </button>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-3">
              <span className="text-2xl font-bold text-white">HR</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Konto erstellen</h1>
            <p className="text-sm text-gray-600">Registriere dich für HRthis</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Max"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Mustermann"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="max.mustermann@firma.de"
                required
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password">Passwort *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Bestätigen *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div>
              <Label htmlFor="position">Position (optional)</Label>
              <Input
                id="position"
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="z.B. Software Engineer"
              />
            </div>

            <div>
              <Label htmlFor="department">Abteilung (optional)</Label>
              <Input
                id="department"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="z.B. IT"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Wird erstellt...
                </span>
              ) : (
                'Konto erstellen'
              )}
            </Button>
          </form>

          {/* Already have account */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-600 mb-2">
              Bereits registriert?
            </p>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Zum Login →
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Mit der Registrierung akzeptierst du unsere Nutzungsbedingungen
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Was dich erwartet:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-green-500">✓</span>
                <span>Urlaubsverwaltung</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-green-500">✓</span>
                <span>Lernzentrum</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="text-green-500">✓</span>
                <span>50 Welcome Coins</span>
              </div>
            </div>
          </div>

          {/* Setup Reminder */}
          {error && error.includes('Registrierung fehlgeschlagen') && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-900 mb-2">
                💡 Tipp: Migrations ausgeführt?
              </p>
              <p className="text-xs text-amber-800 mb-2">
                Falls die Registrierung nicht funktioniert, stelle sicher dass du die 3 SQL-Migrationen in Supabase ausgeführt hast:
              </p>
              <ol className="text-xs text-amber-800 space-y-1 pl-4 list-decimal">
                <li>001_initial_schema.sql</li>
                <li>002_storage_setup.sql</li>
                <li>003_auto_user_profile.sql</li>
              </ol>
              <p className="text-xs text-amber-700 mt-2">
                📖 Siehe <span className="font-mono font-semibold">QUICKSTART.md</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}