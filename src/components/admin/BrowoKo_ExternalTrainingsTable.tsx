/**
 * @file BrowoKo_ExternalTrainingsTable.tsx
 * @domain ADMIN - Training Compliance Dashboard
 * @description External trainings management (DRK, TÜV, etc.)
 * @version v4.13.3
 */

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Download, Plus, Edit, Trash2, FileText, AlertCircle } from '../icons/BrowoKoIcons';
import { toast } from 'sonner';
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

interface ExternalTraining {
  id: string;
  user_id: string;
  training_name: string;
  category: string | null;
  provider: string | null;
  completed_at: string;
  expires_at: string | null;
  certificate_url: string | null;
  notes: string | null;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department_id: string | null;
    team_id: string | null;
    location_id: string | null;
  };
  created_by_user: {
    first_name: string;
    last_name: string;
  } | null;
}

interface Props {
  data: ExternalTraining[];
  loading?: boolean;
  onAdd: () => void;
  onEdit: (training: ExternalTraining) => void;
  onDelete: (trainingId: string) => void;
}

export function BrowoKo_ExternalTrainingsTable({ data, loading, onAdd, onEdit, onDelete }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trainingToDelete, setTrainingToDelete] = useState<ExternalTraining | null>(null);

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const userName = `${item.user.first_name} ${item.user.last_name}`;
      const matchesSearch =
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.training_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.provider?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [data, searchTerm]);

  // Export to CSV
  const handleExport = () => {
    try {
      const csvHeader = 'Mitarbeiter,Schulung,Kategorie,Anbieter,Abgeschlossen,Gültig bis,Notizen\n';
      const csvRows = filteredData.map(item => {
        const userName = `${item.user.first_name} ${item.user.last_name}`;
        return `"${userName}","${item.training_name}","${item.category || '-'}","${item.provider || '-'}","${new Date(item.completed_at).toLocaleDateString('de-DE')}","${item.expires_at ? new Date(item.expires_at).toLocaleDateString('de-DE') : '-'}","${item.notes || '-'}"`;
      }).join('\n');

      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `externe-schulungen-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Export erfolgreich');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Export');
    }
  };

  // Check if training expires soon (within 30 days)
  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  // Check if training is expired
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Handle delete confirmation
  const handleDeleteClick = (training: ExternalTraining) => {
    setTrainingToDelete(training);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (trainingToDelete) {
      onDelete(trainingToDelete.id);
      setDeleteDialogOpen(false);
      setTrainingToDelete(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-400">
            <div className="w-8 h-8 mx-auto mb-2 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <p>Lade Daten...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              📋 Externe Schulungen
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Export Button */}
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                CSV Export
              </Button>

              {/* Add Button */}
              <Button onClick={onAdd} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-xs text-gray-600">Gesamt Schulungen</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {data.filter(d => isExpiringSoon(d.expires_at)).length}
              </div>
              <div className="text-xs text-gray-600">Läuft bald ab</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {data.filter(d => isExpired(d.expires_at)).length}
              </div>
              <div className="text-xs text-gray-600">Abgelaufen</div>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Schulung</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Anbieter</TableHead>
                    <TableHead>Abgeschlossen</TableHead>
                    <TableHead>Gültig bis</TableHead>
                    <TableHead>Zertifikat</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((training) => {
                    const userName = `${training.user.first_name} ${training.user.last_name}`;
                    const expiringSoon = isExpiringSoon(training.expires_at);
                    const expired = isExpired(training.expires_at);

                    return (
                      <TableRow key={training.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{userName}</p>
                            <p className="text-xs text-gray-500">{training.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{training.training_name}</p>
                          {training.notes && (
                            <p className="text-xs text-gray-500">{training.notes}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {training.category ? (
                            <Badge variant="outline">{training.category}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{training.provider || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(training.completed_at).toLocaleDateString('de-DE')}
                        </TableCell>
                        <TableCell>
                          {training.expires_at ? (
                            <div className="flex items-center gap-2">
                              {expired && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              {expiringSoon && !expired && (
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                              )}
                              <span className={`text-sm ${expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                                {new Date(training.expires_at).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {training.certificate_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(training.certificate_url!, '_blank')}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Ansehen
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(training)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(training)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Schulungen gefunden</p>
              <Button onClick={onAdd} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Erste Schulung hinzufügen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schulung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Schulung "{trainingToDelete?.training_name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
