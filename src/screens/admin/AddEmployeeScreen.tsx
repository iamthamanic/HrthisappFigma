import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/HRTHIS_adminStore';
import { ArrowLeft, UserPlus } from '../../components/icons/HRTHISIcons';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuthStore } from '../../stores/HRTHIS_authStore';
import AddEmployeeLoginSection from '../../components/admin/HRTHIS_AddEmployeeLoginSection';
import AddEmployeePersonalSection from '../../components/admin/HRTHIS_AddEmployeePersonalSection';
import AddEmployeeRoleSection from '../../components/admin/HRTHIS_AddEmployeeRoleSection';
import sanitize from '../../utils/security/HRTHIS_sanitization';
import DebugVersionChecker from '../../components/DebugVersionChecker';

export default function AddEmployeeScreen() {
  const navigate = useNavigate();
  const { createUser, locations, loadLocations, departments, loadDepartments } = useAdminStore();
  const { profile } = useAuthStore();

  // Load locations and departments on mount
  useEffect(() => {
    loadLocations().catch(err => console.warn('Failed to load locations:', err));
    loadDepartments().catch(err => console.warn('Failed to load departments:', err));
  }, [loadLocations, loadDepartments]);

  // ✅ DEDUPLICATE departments and locations to prevent React key warnings
  // Filter out any duplicates based on ID
  const uniqueDepartments = departments.filter((dept, index, self) =>
    index === self.findIndex((d) => d.id === dept.id)
  );
  
  const uniqueLocations = locations.filter((loc, index, self) =>
    index === self.findIndex((l) => l.id === loc.id)
  );

  // 🔍 DEBUG: Log if duplicates were found
  useEffect(() => {
    if (departments.length !== uniqueDepartments.length) {
      console.warn('⚠️ DUPLICATE DEPARTMENTS FOUND:', {
        original: departments.length,
        unique: uniqueDepartments.length,
        duplicates: departments.filter((dept, index, self) =>
          index !== self.findIndex((d) => d.id === dept.id)
        )
      });
    }
    if (locations.length !== uniqueLocations.length) {
      console.warn('⚠️ DUPLICATE LOCATIONS FOUND:', {
        original: locations.length,
        unique: uniqueLocations.length,
        duplicates: locations.filter((loc, index, self) =>
          index !== self.findIndex((l) => l.id === loc.id)
        )
      });
    }
  }, [departments, locations, uniqueDepartments.length, uniqueLocations.length]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    position: '',
    department: '',
    employment_type: 'Vollzeit',
    weekly_hours: '40',
    vacation_days: '30',
    salary: '0',
    start_date: new Date().toISOString().split('T')[0],
    location_id: null as string | null,
    role: 'USER' as 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN' | 'EXTERN',
    // v4.6.0: Extended User Fields
    birth_date: '',
    gender: '',
    country: '',
    state: '',
    contract_status: null as string | null,
    contract_end_date: null as string | null,
    re_entry_dates: [] as string[],
  });

  // ✅ NEUE BERECHTIGUNGSLOGIK (2025-01-14 - v4.0.6)
  // SUPERADMIN: kann alle Rollen erstellen (USER, ADMIN, HR, SUPERADMIN, EXTERN)
  // HR: kann USER + ADMIN + EXTERN erstellen (nicht HR/SUPERADMIN)
  // ADMIN: kann nur USER + EXTERN erstellen
  const allowedRoles = profile?.role === 'SUPERADMIN' 
    ? ['USER', 'ADMIN', 'HR', 'SUPERADMIN', 'EXTERN'] as const
    : profile?.role === 'HR'
    ? ['USER', 'ADMIN', 'EXTERN'] as const
    : ['USER', 'EXTERN'] as const; // ADMIN kann USER + EXTERN erstellen

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // ✅ SANITIZE ALL TEXT INPUTS
      const sanitizedEmail = sanitize.email(formData.email);
      const sanitizedFirstName = sanitize.text(formData.first_name);
      const sanitizedLastName = sanitize.text(formData.last_name);
      const sanitizedPosition = sanitize.text(formData.position);
      const sanitizedDepartment = sanitize.text(formData.department);
      const sanitizedStartDate = sanitize.date(formData.start_date);

      // ✅ VALIDATE REQUIRED FIELDS
      if (!sanitizedEmail) {
        setError('Ungültige E-Mail-Adresse');
        setLoading(false);
        return;
      }

      if (!sanitizedFirstName || !sanitizedLastName) {
        setError('Vor- und Nachname sind erforderlich');
        setLoading(false);
        return;
      }

      if (!sanitizedStartDate) {
        setError('Ungültiges Startdatum');
        setLoading(false);
        return;
      }

      await createUser({
        email: sanitizedEmail,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        position: sanitizedPosition || null,
        department: sanitizedDepartment || null,
        employment_type: formData.employment_type || null,
        weekly_hours: parseInt(formData.weekly_hours),
        vacation_days: parseInt(formData.vacation_days),
        salary: parseFloat(formData.salary) || null,
        start_date: sanitizedStartDate,
        location_id: formData.location_id || null,
        role: formData.role,
        // v4.6.0: Extended User Fields
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        country: formData.country || null,
        state: formData.state || null,
        contract_status: formData.contract_status || null,
        contract_end_date: formData.contract_end_date || null,
        re_entry_dates: formData.re_entry_dates.length > 0 ? formData.re_entry_dates : null,
      }, formData.password);

      setSuccess('Mitarbeiter erfolgreich erstellt! ✅');
      
      setTimeout(() => {
        navigate('/admin/team-und-mitarbeiterverwaltung');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Mitarbeiters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* DEBUG: Version Checker */}
      <DebugVersionChecker />
      
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/team-und-mitarbeiterverwaltung')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Neuer Mitarbeiter</h1>
            <p className="text-sm text-gray-500 mt-1">
              Erstelle einen neuen Mitarbeiter-Account
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Mitarbeiter-Informationen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Login Data */}
            <AddEmployeeLoginSection
              email={formData.email}
              password={formData.password}
              onEmailChange={(value) => setFormData({ ...formData, email: value })}
              onPasswordChange={(value) => setFormData({ ...formData, password: value })}
            />

            {/* Personal Data */}
            <AddEmployeePersonalSection
              firstName={formData.first_name}
              lastName={formData.last_name}
              onFirstNameChange={(value) => setFormData({ ...formData, first_name: value })}
              onLastNameChange={(value) => setFormData({ ...formData, last_name: value })}
            />

            {/* Role & Permissions */}
            <AddEmployeeRoleSection
              role={formData.role}
              allowedRoles={allowedRoles}
              currentUserRole={profile?.role}
              onRoleChange={(value) => setFormData({ ...formData, role: value })}
            />

            {/* Employment Data */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Beschäftigungsdaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="z.B. Senior Entwickler"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Abteilung</Label>
                  <Select
                    value={formData.department || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, department: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Abteilung wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="dept-select-none" value="none">Keine Abteilung</SelectItem>
                      {uniqueDepartments.map((dept, index) => (
                        <SelectItem key={`dept-select-${dept.id}-${index}`} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employment_type">Beschäftigungsart</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="emp-type-vollzeit" value="Vollzeit">Vollzeit</SelectItem>
                      <SelectItem key="emp-type-teilzeit" value="Teilzeit">Teilzeit</SelectItem>
                      <SelectItem key="emp-type-werkstudent" value="Werkstudent">Werkstudent</SelectItem>
                      <SelectItem key="emp-type-praktikant" value="Praktikant">Praktikant</SelectItem>
                      <SelectItem key="emp-type-minijob" value="Minijob">Minijob</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vacation_days">Urlaubstage / Jahr *</Label>
                  <Input
                    id="vacation_days"
                    type="number"
                    min="20"
                    max="50"
                    value={formData.vacation_days}
                    onChange={(e) => setFormData({ ...formData, vacation_days: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Gehalt (Monat, Brutto)</Label>
                  <Input
                    id="salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="3500.00"
                  />
                  <p className="text-xs text-gray-500">
                    Jahr: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((parseFloat(formData.salary) || 0) * 12)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="location_id">Standort</Label>
                  <Select
                    value={formData.location_id || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, location_id: value === 'none' ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standort wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="loc-select-none" value="none">Kein Standort</SelectItem>
                      {uniqueLocations.map((location, index) => (
                        <SelectItem key={`loc-select-${location.id}-${index}`} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_date">Eintrittsdatum *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weekly_hours">Wochenstunden *</Label>
                  <Input
                    id="weekly_hours"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.weekly_hours}
                    onChange={(e) => setFormData({ ...formData, weekly_hours: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit - Responsive */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/team-und-mitarbeiterverwaltung')}
                className="w-full sm:w-auto"
              >
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Erstelle...' : 'Mitarbeiter erstellen'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
