/**
 * ============================================
 * ARBEIT SCREEN
 * ============================================
 * Version: 4.10.14
 * Description: Arbeitsverwaltung mit Office/Field/Extern Tabs
 * ============================================
 */

import { useState } from 'react';
import { Building2, Plus, Users, Layers } from '../components/icons/HRTHISIcons';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

export default function FieldScreen() {
  const [activeTab, setActiveTab] = useState<'office' | 'field' | 'extern'>('office');

  // Mock data - später durch echte Daten ersetzen
  const officeCount = 0;
  const fieldCount = 0;
  const externCount = 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Arbeit</h1>
        <p className="text-sm text-gray-500 mt-1">
          Verwalte Office, Field und externe Projekte
        </p>
      </div>

      {/* Tabs System */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        {/* Responsive TabsList */}
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-full sm:w-auto inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="office" className="flex-shrink-0">
              <Building2 className="w-4 h-4 mr-2" />
              <span>Office</span>
              {officeCount > 0 && (
                <Badge className="ml-2 bg-blue-600 hover:bg-blue-600 border-0 text-xs">
                  {officeCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="field" className="flex-shrink-0">
              <Layers className="w-4 h-4 mr-2" />
              <span>Field</span>
              {fieldCount > 0 && (
                <Badge className="ml-2 bg-green-600 hover:bg-green-600 border-0 text-xs">
                  {fieldCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="extern" className="flex-shrink-0">
              <Users className="w-4 h-4 mr-2" />
              <span>Extern</span>
              {externCount > 0 && (
                <Badge className="ml-2 bg-purple-600 hover:bg-purple-600 border-0 text-xs">
                  {externCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB: Office */}
        <TabsContent value="office" className="space-y-4 md:space-y-6">
          {/* Empty State - Office */}
          <Card className="p-8 md:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Noch keine Office-Projekte vorhanden
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Erstelle dein erstes Office-Projekt für Büro-Mitarbeiter
              </p>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Erstes Office-Projekt erstellen
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Field */}
        <TabsContent value="field" className="space-y-4 md:space-y-6">
          {/* Empty State - Field */}
          <Card className="p-8 md:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                <Layers className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Noch keine Field-Projekte vorhanden
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Erstelle dein erstes Field-Projekt für Außendienst-Mitarbeiter
              </p>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Erstes Field-Projekt erstellen
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: Extern */}
        <TabsContent value="extern" className="space-y-4 md:space-y-6">
          {/* Empty State - Extern */}
          <Card className="p-8 md:p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Noch keine externen Projekte vorhanden
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Erstelle dein erstes externes Projekt für externe Mitarbeiter
              </p>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Erstes externes Projekt erstellen
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
