import { Shield, Check, X } from './icons/BrowoKoIcons';
import { Card, CardContent } from './ui/card';
import { usePermissions, UserRole } from '../hooks/usePermissions';

interface PermissionsViewProps {
  role: UserRole | undefined;
}

export default function PermissionsView({ role }: PermissionsViewProps) {
  // Use the permissions hook
  const { getAllPermissions, roleInfo } = usePermissions(role);
  const permissions = getAllPermissions;

  return (
    <div className="space-y-6">
      {/* Role Overview */}
      <Card className={`${roleInfo.borderColor} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${roleInfo.bgColor}`}>
              <Shield className={`w-6 h-6 ${roleInfo.color}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${roleInfo.color}`}>
                {roleInfo.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {roleInfo.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions by Category */}
      <div className="space-y-6">
        {permissions.map((category) => (
          <Card key={category.category}>
            <CardContent className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">
                {category.category}
              </h3>
              
              <div className="space-y-3">
                {category.permissions.map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="mt-0.5">
                      {permission.allowed ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="w-3.5 h-3.5 text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Permission Details */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        permission.allowed ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {permission.name}
                      </p>
                      <p className={`text-xs mt-0.5 ${
                        permission.allowed ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {permission.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {permission.allowed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Erlaubt
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Nicht erlaubt
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900">
            💡 <span className="font-medium">Hinweis:</span> Berechtigungen werden automatisch basierend auf Ihrer zugewiesenen Rolle verwaltet. Bei Fragen zur Rollenzuweisung wenden Sie sich an Ihren Administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
