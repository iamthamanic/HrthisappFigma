/**
 * Step 1: Basis-Daten
 * Login, Name, Geburtsdatum, Geschlecht, Rolle
 */

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { User } from '../../icons/BrowoKoIcons';

interface Step1Props {
  formData: any;
  onUpdate: (updates: any) => void;
  allowedRoles: readonly string[];
  currentUserRole?: string;
}

export default function Step1_BaseDaten({ formData, onUpdate, allowedRoles, currentUserRole }: Step1Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Login-Daten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail-Adresse *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="max.mustermann@firma.de"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Initiales Passwort *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => onUpdate({ password: e.target.value })}
              placeholder="Mindestens 8 Zeichen"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mitarbeiter kann das Passwort nach dem ersten Login ändern
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Persönliche Basis-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Vorname *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => onUpdate({ first_name: e.target.value })}
                placeholder="Max"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Nachname *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => onUpdate({ last_name: e.target.value })}
                placeholder="Mustermann"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birth_date">Geburtsdatum *</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => onUpdate({ birth_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Geschlecht *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => onUpdate({ gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Männlich</SelectItem>
                  <SelectItem value="female">Weiblich</SelectItem>
                  <SelectItem value="diverse">Divers</SelectItem>
                  <SelectItem value="not_specified">Keine Angabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Telefonnummer (privat) *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="+49 123 456789"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rolle & Berechtigungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="role">Rolle *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => onUpdate({ role: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.includes('USER') && <SelectItem value="USER">Mitarbeiter</SelectItem>}
                {allowedRoles.includes('ADMIN') && <SelectItem value="ADMIN">Admin</SelectItem>}
                {allowedRoles.includes('HR') && <SelectItem value="HR">HR Manager</SelectItem>}
                {allowedRoles.includes('SUPERADMIN') && <SelectItem value="SUPERADMIN">Super Admin</SelectItem>}
                {allowedRoles.includes('EXTERN') && <SelectItem value="EXTERN">Extern</SelectItem>}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {currentUserRole === 'SUPERADMIN' && 'Du kannst alle Rollen erstellen'}
              {currentUserRole === 'HR' && 'Du kannst USER, ADMIN und EXTERN erstellen'}
              {currentUserRole === 'ADMIN' && 'Du kannst USER und EXTERN erstellen'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
