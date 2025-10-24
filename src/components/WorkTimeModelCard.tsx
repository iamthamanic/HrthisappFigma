import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';

import { WorkTimeModel } from '../types/database';

interface WorkTimeModelCardProps {
  isEditing: boolean;
  formData: {
    work_time_model: WorkTimeModel | null;
    shift_start_time: string;
    shift_end_time: string;
    flextime_start_earliest: string;
    flextime_start_latest: string;
    flextime_end_earliest: string;
    flextime_end_latest: string;
    on_call: boolean;
  };
  user: any;
  setFormData: (data: any) => void;
}

export function WorkTimeModelCard({ isEditing, formData, user, setFormData }: WorkTimeModelCardProps) {
  return (
    <>
      {/* Zeitmodell */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitmodell</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="work_time_model">Arbeitszeitmodell</Label>
                <Select 
                  value={formData.work_time_model || 'none'} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    work_time_model: value === 'none' ? null : value
                  })}
                >
                  <SelectTrigger id="work_time_model">
                    <SelectValue placeholder="Bitte wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="work-time-none" value="none">Nicht angegeben</SelectItem>
                    <SelectItem key="work-time-schicht" value="SCHICHTMODELL">Schichtmodell</SelectItem>
                    <SelectItem key="work-time-gleitzeit" value="GLEITZEIT">Gleitzeit</SelectItem>
                    <SelectItem key="work-time-bereitschaft" value="BEREITSCHAFT">Bereitschaft</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Wählen Sie das Arbeitszeitmodell für diesen Mitarbeiter</p>
              </div>

              {/* Schichtmodell - Manuelle Zeiteingabe */}
              {formData.work_time_model === 'SCHICHTMODELL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="shift_start_time">Schichtbeginn</Label>
                    <Input
                      id="shift_start_time"
                      type="time"
                      value={formData.shift_start_time}
                      onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
                      placeholder="08:00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shift_end_time">Schichtende</Label>
                    <Input
                      id="shift_end_time"
                      type="time"
                      value={formData.shift_end_time}
                      onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
                      placeholder="17:00"
                    />
                  </div>
                  <p className="text-xs text-gray-600 col-span-full">
                    ℹ️ Feste Arbeitszeiten für Schichtmodell
                  </p>
                </div>
              )}

              {/* Gleitzeit - Zeitrahmen */}
              {formData.work_time_model === 'GLEITZEIT' && (
                <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <Label className="mb-3 block">Gleitzeitrahmen - Start</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="flextime_start_earliest" className="text-xs text-gray-600">Frühester Arbeitsbeginn</Label>
                        <Input
                          id="flextime_start_earliest"
                          type="time"
                          value={formData.flextime_start_earliest}
                          onChange={(e) => setFormData({ ...formData, flextime_start_earliest: e.target.value })}
                          placeholder="07:00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flextime_start_latest" className="text-xs text-gray-600">Spätester Arbeitsbeginn</Label>
                        <Input
                          id="flextime_start_latest"
                          type="time"
                          value={formData.flextime_start_latest}
                          onChange={(e) => setFormData({ ...formData, flextime_start_latest: e.target.value })}
                          placeholder="09:00"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-3 block">Gleitzeitrahmen - Ende</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="flextime_end_earliest" className="text-xs text-gray-600">Frühestes Arbeitsende</Label>
                        <Input
                          id="flextime_end_earliest"
                          type="time"
                          value={formData.flextime_end_earliest}
                          onChange={(e) => setFormData({ ...formData, flextime_end_earliest: e.target.value })}
                          placeholder="16:00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="flextime_end_latest" className="text-xs text-gray-600">Spätestes Arbeitsende</Label>
                        <Input
                          id="flextime_end_latest"
                          type="time"
                          value={formData.flextime_end_latest}
                          onChange={(e) => setFormData({ ...formData, flextime_end_latest: e.target.value })}
                          placeholder="18:00"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    ℹ️ Flexible Arbeitszeiten innerhalb des definierten Rahmens (z.B. Start 7-9 Uhr, Ende 16-18 Uhr)
                  </p>
                </div>
              )}

              {/* Bereitschaft - Info only */}
              {formData.work_time_model === 'BEREITSCHAFT' && (
                <Alert>
                  <AlertDescription>
                    Bereitschaft: Der Mitarbeiter ist in Bereitschaft und hat keine festen Arbeitszeiten.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Arbeitszeitmodell</Label>
                <div className={`field-readonly-v2 mt-1 ${!user.work_time_model ? 'field-readonly-v2-empty' : ''}`}>
                  {user.work_time_model === 'SCHICHTMODELL' ? 'Schichtmodell' :
                   user.work_time_model === 'GLEITZEIT' ? 'Gleitzeit' :
                   user.work_time_model === 'BEREITSCHAFT' ? 'Bereitschaft' :
                   'Nicht angegeben'}
                </div>
              </div>

              {/* Schichtmodell - Show times */}
              {user.work_time_model === 'SCHICHTMODELL' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <Label>Schichtbeginn</Label>
                    <div className="field-readonly-v2 mt-1">
                      {user.shift_start_time || 'Nicht angegeben'}
                    </div>
                  </div>
                  <div>
                    <Label>Schichtende</Label>
                    <div className="field-readonly-v2 mt-1">
                      {user.shift_end_time || 'Nicht angegeben'}
                    </div>
                  </div>
                </div>
              )}

              {/* Gleitzeit - Show timeframes */}
              {user.work_time_model === 'GLEITZEIT' && (
                <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <Label className="mb-2 block">Gleitzeitrahmen - Start</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">Frühester Arbeitsbeginn</Label>
                        <div className="field-readonly-v2 mt-1">
                          {user.flextime_start_earliest || 'Nicht angegeben'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Spätester Arbeitsbeginn</Label>
                        <div className="field-readonly-v2 mt-1">
                          {user.flextime_start_latest || 'Nicht angegeben'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Gleitzeitrahmen - Ende</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">Frühestes Arbeitsende</Label>
                        <div className="field-readonly-v2 mt-1">
                          {user.flextime_end_earliest || 'Nicht angegeben'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Spätestes Arbeitsende</Label>
                        <div className="field-readonly-v2 mt-1">
                          {user.flextime_end_latest || 'Nicht angegeben'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zusatz Zeitkonditionen - Rufbereitschaft */}
      <Card>
        <CardHeader>
          <CardTitle>Zusatz Zeitkonditionen</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="on_call">Rufbereitschaft</Label>
                  <p className="text-xs text-gray-500">Mitarbeiter ist für Rufbereitschaft eingeteilt</p>
                </div>
                <Switch
                  id="on_call"
                  checked={formData.on_call}
                  onCheckedChange={(checked) => setFormData({ ...formData, on_call: checked })}
                />
              </div>
              <p className="text-xs text-gray-500">
                ℹ️ Rufbereitschaft kann jedem Mitarbeiter zugewiesen werden und ist unabhängig vom Zeitmodell
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-0.5">
                  <Label>Rufbereitschaft</Label>
                  <p className="text-xs text-gray-500">Mitarbeiter ist für Rufbereitschaft eingeteilt</p>
                </div>
                <Badge variant={user.on_call ? 'default' : 'outline'}>
                  {user.on_call ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
