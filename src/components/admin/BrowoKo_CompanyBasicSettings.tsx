import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Building2, Save } from '../icons/BrowoKoIcons';

interface CompanyBasicSettingsProps {
  name: string;
  domain: string;
  onNameChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}

export default function CompanyBasicSettings({
  name,
  domain,
  onNameChange,
  onDomainChange,
  onSave,
  saving
}: CompanyBasicSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Unternehmens-Informationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="company_name">Firmenname</Label>
          <Input
            id="company_name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="z.B. Meine Firma GmbH"
          />
        </div>
        <div>
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            placeholder="z.B. meinefirma.de"
          />
          <p className="text-xs text-gray-500 mt-1">
            Wird für E-Mail-Validierung verwendet
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
