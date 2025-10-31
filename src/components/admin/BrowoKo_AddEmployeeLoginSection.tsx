import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AddEmployeeLoginSectionProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}

export default function AddEmployeeLoginSection({
  email,
  password,
  onEmailChange,
  onPasswordChange
}: AddEmployeeLoginSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-900 mb-4">Login-Daten</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">E-Mail *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Passwort *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            minLength={6}
          />
        </div>
      </div>
    </div>
  );
}
