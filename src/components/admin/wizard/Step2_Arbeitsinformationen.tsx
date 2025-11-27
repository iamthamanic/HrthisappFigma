/**
 * Step 2: Arbeitsinformationen
 * Position, Vertrag, Arbeitszeit, Pausen, Gehalt, etc.
 */

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Briefcase, Clock, Calendar } from '../../icons/BrowoKoIcons';

interface Step2Props {
  formData: any;
  onUpdate: (updates: any) => void;
  departments: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
}

export default function Step2_Arbeitsinformationen({ formData, onUpdate, departments, locations }: Step2Props) {
  return (
    <div className="space-y-6">
      {/* Beschäftigungsdaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Beschäftigungsdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => onUpdate({ position: e.target.value })}
                placeholder="z.B. Senior Entwickler"
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Abteilung *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => onUpdate({ department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Abteilung wählen" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employment_type">Beschäftigungsart *</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => onUpdate({ employment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vollzeit">Vollzeit</SelectItem>
                  <SelectItem value="Teilzeit">Teilzeit</SelectItem>
                  <SelectItem value="Werkstudent">Werkstudent</SelectItem>
                  <SelectItem value="Praktikant">Praktikant</SelectItem>
                  <SelectItem value="Minijob">Minijob</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location_id">Standort *</Label>
              <Select
                value={formData.location_id || ''}
                onValueChange={(value) => onUpdate({ location_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Standort wählen" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Eintrittsdatum *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => onUpdate({ start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="work_phone">Arbeitstelefon *</Label>
              <Input
                id="work_phone"
                type="tel"
                value={formData.work_phone}
                onChange={(e) => onUpdate({ work_phone: e.target.value })}
                placeholder="+49 123 456789"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vertragsdaten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Vertragsdaten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract_status">Vertragsstatus *</Label>
              <Select
                value={formData.contract_status || ''}
                onValueChange={(value) => onUpdate({ contract_status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNBEFRISTET">Unbefristet</SelectItem>
                  <SelectItem value="BEFRISTET">Befristet</SelectItem>
                  <SelectItem value="PROBEZEIT">Probezeit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="probation_period_months">Probezeit (Monate) *</Label>
              <Input
                id="probation_period_months"
                type="number"
                min="0"
                max="24"
                value={formData.probation_period_months || ''}
                onChange={(e) => onUpdate({ probation_period_months: e.target.value })}
                placeholder="z.B. 6"
                required
              />
            </div>
          </div>

          {formData.contract_status === 'BEFRISTET' && (
            <div>
              <Label htmlFor="contract_end_date">Vertragsende *</Label>
              <Input
                id="contract_end_date"
                type="date"
                value={formData.contract_end_date || ''}
                onChange={(e) => onUpdate({ contract_end_date: e.target.value })}
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arbeitszeit & Gehalt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Arbeitszeit & Vergütung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weekly_hours">Wochenstunden *</Label>
              <Input
                id="weekly_hours"
                type="number"
                min="1"
                max="60"
                value={formData.weekly_hours}
                onChange={(e) => onUpdate({ weekly_hours: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="vacation_days">Urlaubstage / Jahr *</Label>
              <Input
                id="vacation_days"
                type="number"
                min="20"
                max="50"
                value={formData.vacation_days}
                onChange={(e) => onUpdate({ vacation_days: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="salary">Gehalt (Monat, Brutto) *</Label>
            <Input
              id="salary"
              type="number"
              min="0"
              step="0.01"
              value={formData.salary}
              onChange={(e) => onUpdate({ salary: e.target.value })}
              placeholder="3500.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Jahresgehalt: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((parseFloat(formData.salary) || 0) * 12)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Arbeitszeitmodell */}
      <Card>
        <CardHeader>
          <CardTitle>Arbeitszeitmodell</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="work_time_model">Modell *</Label>
            <Select
              value={formData.work_time_model || ''}
              onValueChange={(value) => onUpdate({ work_time_model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Modell wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Feste Arbeitszeit</SelectItem>
                <SelectItem value="FLEXTIME">Gleitzeit</SelectItem>
                <SelectItem value="SHIFT">Schichtarbeit</SelectItem>
                <SelectItem value="TRUST">Vertrauensarbeitszeit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schichtzeiten */}
          {formData.work_time_model === 'SHIFT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shift_start_time">Schicht Start *</Label>
                <Input
                  id="shift_start_time"
                  type="time"
                  value={formData.shift_start_time}
                  onChange={(e) => onUpdate({ shift_start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shift_end_time">Schicht Ende *</Label>
                <Input
                  id="shift_end_time"
                  type="time"
                  value={formData.shift_end_time}
                  onChange={(e) => onUpdate({ shift_end_time: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {/* Gleitzeit-Korridore */}
          {formData.work_time_model === 'FLEXTIME' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flextime_start_earliest">Frühester Start *</Label>
                  <Input
                    id="flextime_start_earliest"
                    type="time"
                    value={formData.flextime_start_earliest}
                    onChange={(e) => onUpdate({ flextime_start_earliest: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="flextime_start_latest">Spätester Start *</Label>
                  <Input
                    id="flextime_start_latest"
                    type="time"
                    value={formData.flextime_start_latest}
                    onChange={(e) => onUpdate({ flextime_start_latest: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="flextime_end_earliest">Frühestes Ende *</Label>
                  <Input
                    id="flextime_end_earliest"
                    type="time"
                    value={formData.flextime_end_earliest}
                    onChange={(e) => onUpdate({ flextime_end_earliest: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="flextime_end_latest">Spätestes Ende *</Label>
                  <Input
                    id="flextime_end_latest"
                    type="time"
                    value={formData.flextime_end_latest}
                    onChange={(e) => onUpdate({ flextime_end_latest: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pausenregelung */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Pausenregelung *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="break_auto"
                  checked={formData.break_auto}
                  onCheckedChange={(checked) => onUpdate({ break_auto: checked })}
                />
                <label htmlFor="break_auto" className="text-sm cursor-pointer">
                  Automatischer Pausenabzug
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="break_manual"
                  checked={formData.break_manual}
                  onCheckedChange={(checked) => onUpdate({ break_manual: checked })}
                />
                <label htmlFor="break_manual" className="text-sm cursor-pointer">
                  Manuelle Pausenerfassung
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="break_minutes">Pausendauer (Minuten) *</Label>
              <Input
                id="break_minutes"
                type="number"
                min="0"
                max="120"
                value={formData.break_minutes}
                onChange={(e) => onUpdate({ break_minutes: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Rufbereitschaft */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="on_call"
              checked={formData.on_call}
              onCheckedChange={(checked) => onUpdate({ on_call: checked })}
            />
            <label htmlFor="on_call" className="text-sm cursor-pointer">
              Rufbereitschaft aktiv
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
