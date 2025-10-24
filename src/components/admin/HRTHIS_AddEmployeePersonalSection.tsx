import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AddEmployeePersonalSectionProps {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
}

export default function AddEmployeePersonalSection({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange
}: AddEmployeePersonalSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-4">Persönliche Daten</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">Vorname *</Label>
          <Input
            id="first_name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Nachname *</Label>
          <Input
            id="last_name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );
}
