/**
 * ============================================
 * HRTHIS ADMIN BENEFITS LIST
 * ============================================
 * Version: 3.7.0
 * Description: Admin Component für Benefits Verwaltung
 * ============================================
 */

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Pencil, Trash2, Plus, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { Benefit } from '../../types/schemas/HRTHIS_benefitSchemas';
import {
  BENEFIT_CATEGORY_META,
  formatAvailability,
} from '../../types/schemas/HRTHIS_benefitSchemas';

interface Props {
  benefits: Benefit[];
  onEdit: (benefit: Benefit) => void;
  onDelete: (benefitId: string) => void;
  onCreate: () => void;
  isDeleting?: boolean;
}

export default function HRTHIS_AdminBenefitsList({
  benefits,
  onEdit,
  onDelete,
  onCreate,
  isDeleting = false,
}: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<Benefit | null>(null);

  // Delete Handler
  const handleDeleteClick = (benefit: Benefit) => {
    setBenefitToDelete(benefit);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (benefitToDelete) {
      onDelete(benefitToDelete.id);
      setDeleteDialogOpen(false);
      setBenefitToDelete(null);
    }
  };

  if (benefits.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LucideIcons.Gift className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Noch keine Benefits</h3>
        <p className="text-sm text-gray-600">
          Klicke auf "Benefit hinzufügen" um dein erstes Benefit zu erstellen.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Benefits List */}
      <div className="space-y-4">
        {benefits.map((benefit) => {
          const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Gift;
          const categoryMeta = BENEFIT_CATEGORY_META[benefit.category];
          const availability = formatAvailability(benefit);

          return (
            <Card key={benefit.id} className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${getCategoryBgColor(benefit.category)}`}
                >
                  <IconComponent className={`w-7 h-7 ${categoryMeta.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {categoryMeta.label}
                        </Badge>
                        <Badge
                          className={`border-0 text-xs ${
                            benefit.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {benefit.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(benefit)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(benefit)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">{benefit.short_description}</p>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    {/* Verfügbarkeit */}
                    <div>
                      <span className="text-gray-500 block mb-1">Verfügbarkeit</span>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-900">{availability}</span>
                      </div>
                    </div>

                    {/* Aktive Nutzer */}
                    <div>
                      <span className="text-gray-500 block mb-1">Aktive Nutzer</span>
                      <span className="font-medium text-gray-900">
                        {benefit.current_users} Mitarbeiter
                      </span>
                    </div>

                    {/* Wert */}
                    {benefit.value && (
                      <div>
                        <span className="text-gray-500 block mb-1">Wert</span>
                        <span className="font-medium text-gray-900">
                          {benefit.value.toFixed(2)} €
                        </span>
                      </div>
                    )}

                    {/* Voraussetzung */}
                    {benefit.eligibility_months > 0 && (
                      <div>
                        <span className="text-gray-500 block mb-1">Voraussetzung</span>
                        <span className="font-medium text-gray-900">
                          {benefit.eligibility_months} Monate
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Benefit löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du das Benefit "{benefitToDelete?.title}" wirklich löschen? Diese Aktion
              kann nicht rückgängig gemacht werden.
              {benefitToDelete && benefitToDelete.current_users > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Achtung:</strong> {benefitToDelete.current_users} Mitarbeiter haben
                    dieses Benefit aktiv. Es wird bei Löschung automatisch entfernt.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Wird gelöscht...' : 'Ja, löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Helper: Category Background Color
function getCategoryBgColor(category: string): string {
  const colorMap: Record<string, string> = {
    Health: 'bg-red-50',
    Mobility: 'bg-blue-50',
    Finance: 'bg-green-50',
    Food: 'bg-orange-50',
    Learning: 'bg-purple-50',
    Lifestyle: 'bg-pink-50',
    'Work-Life': 'bg-indigo-50',
  };
  return colorMap[category] || 'bg-gray-50';
}
