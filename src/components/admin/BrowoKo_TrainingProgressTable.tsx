/**
 * @file BrowoKo_TrainingProgressTable.tsx
 * @domain ADMIN - Training Compliance Dashboard
 * @description Universal table for Videos/Tests progress tracking
 * @version v4.13.3
 */

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Download, Filter, Check, Clock, X } from '../icons/BrowoKoIcons';
import { toast } from 'sonner';

interface TrainingProgressData {
  // Common fields
  user_id: string;
  user_name: string;
  user_email?: string;
  department_id: string | null;
  team_id: string | null;
  location_id: string | null;
  
  // Video-specific
  video_id?: string;
  video_title?: string;
  video_category?: string;
  progress_percent?: number;
  completed?: boolean;
  last_watched_at?: string | null;
  completed_at?: string | null;
  
  // Test-specific
  test_id?: string;
  test_title?: string;
  test_category?: string;
  attempts?: number;
  best_score?: number;
  passed?: boolean;
  last_attempt_at?: string | null;
}

interface Props {
  type: 'videos' | 'tests';
  data: TrainingProgressData[];
  loading?: boolean;
}

export function BrowoKo_TrainingProgressTable({ type, data, loading }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = 
        item.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (type === 'videos' ? item.video_title : item.test_title)?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'all') return true;

      if (type === 'videos') {
        if (statusFilter === 'completed') return item.completed;
        if (statusFilter === 'in_progress') return (item.progress_percent || 0) > 0 && !item.completed;
        if (statusFilter === 'not_started') return (item.progress_percent || 0) === 0;
      } else {
        // Tests
        if (statusFilter === 'completed') return item.passed;
        if (statusFilter === 'in_progress') return (item.attempts || 0) > 0 && !item.passed;
        if (statusFilter === 'not_started') return (item.attempts || 0) === 0;
      }

      return true;
    });
  }, [data, searchTerm, statusFilter, type]);

  // Group by training
  const groupedData = useMemo(() => {
    const groups: { [key: string]: TrainingProgressData[] } = {};

    filteredData.forEach(item => {
      const key = type === 'videos' ? item.video_id! : item.test_id!;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return groups;
  }, [filteredData, type]);

  // Export to CSV
  const handleExport = () => {
    try {
      const csvHeader = type === 'videos'
        ? 'Mitarbeiter,Video,Fortschritt,Status,Zuletzt angesehen\n'
        : 'Mitarbeiter,Test,Versuche,Score,Status,Letzter Versuch\n';

      const csvRows = filteredData.map(item => {
        if (type === 'videos') {
          return `"${item.user_name}","${item.video_title}","${item.progress_percent || 0}%","${item.completed ? 'Abgeschlossen' : item.progress_percent ? 'In Bearbeitung' : 'Nicht gestartet'}","${item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString('de-DE') : '-'}"`;
        } else {
          return `"${item.user_name}","${item.test_title}","${item.attempts || 0}","${item.best_score || 0}%","${item.passed ? 'Bestanden' : item.attempts ? 'Nicht bestanden' : 'Offen'}","${item.last_attempt_at ? new Date(item.last_attempt_at).toLocaleDateString('de-DE') : '-'}"`;
        }
      }).join('\n');

      const csv = csvHeader + csvRows;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `training-progress-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Export erfolgreich');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Export');
    }
  };

  // Get status badge
  const getStatusBadge = (item: TrainingProgressData) => {
    if (type === 'videos') {
      if (item.completed) {
        return <Badge className="bg-green-100 text-green-700 border-green-300"><Check className="w-3 h-3 mr-1" /> Abgeschlossen</Badge>;
      }
      if ((item.progress_percent || 0) > 0) {
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300"><Clock className="w-3 h-3 mr-1" /> {item.progress_percent}%</Badge>;
      }
      return <Badge variant="outline" className="text-gray-500"><X className="w-3 h-3 mr-1" /> Nicht gestartet</Badge>;
    } else {
      // Tests
      if (item.passed) {
        return <Badge className="bg-green-100 text-green-700 border-green-300"><Check className="w-3 h-3 mr-1" /> Bestanden ({item.best_score}%)</Badge>;
      }
      if ((item.attempts || 0) > 0) {
        return <Badge className="bg-red-100 text-red-700 border-red-300"><X className="w-3 h-3 mr-1" /> Nicht bestanden ({item.best_score}%)</Badge>;
      }
      return <Badge variant="outline" className="text-gray-500"><Clock className="w-3 h-3 mr-1" /> Offen</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Lade Daten...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            {type === 'videos' ? '🎥 Videos Progress' : '📝 Tests Progress'}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">Alle Status</option>
              <option value="completed">{type === 'videos' ? 'Abgeschlossen' : 'Bestanden'}</option>
              <option value="in_progress">In Bearbeitung</option>
              <option value="not_started">Nicht gestartet</option>
            </select>

            {/* Export Button */}
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
            <div className="text-xs text-gray-600">Gesamt Einträge</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {type === 'videos' 
                ? data.filter(d => d.completed).length
                : data.filter(d => d.passed).length
              }
            </div>
            <div className="text-xs text-gray-600">{type === 'videos' ? 'Abgeschlossen' : 'Bestanden'}</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {type === 'videos'
                ? data.filter(d => (d.progress_percent || 0) === 0).length
                : data.filter(d => (d.attempts || 0) === 0).length
              }
            </div>
            <div className="text-xs text-gray-600">Nicht gestartet</div>
          </div>
        </div>

        {/* Grouped Table */}
        <div className="space-y-6">
          {Object.entries(groupedData).map(([trainingId, items]) => {
            const firstItem = items[0];
            const trainingTitle = type === 'videos' ? firstItem.video_title : firstItem.test_title;
            const trainingCategory = type === 'videos' ? firstItem.video_category : firstItem.test_category;

            return (
              <div key={trainingId} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium text-gray-900">{trainingTitle}</h3>
                  {trainingCategory && (
                    <p className="text-sm text-gray-500">{trainingCategory}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {items.filter(i => type === 'videos' ? i.completed : i.passed).length} von {items.length} Mitarbeiter abgeschlossen
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mitarbeiter</TableHead>
                        {type === 'videos' ? (
                          <>
                            <TableHead>Fortschritt</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Zuletzt angesehen</TableHead>
                          </>
                        ) : (
                          <>
                            <TableHead>Versuche</TableHead>
                            <TableHead>Bester Score</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Letzter Versuch</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={`${trainingId}-${item.user_id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.user_name}</p>
                              <p className="text-xs text-gray-500">{item.user_email}</p>
                            </div>
                          </TableCell>
                          {type === 'videos' ? (
                            <>
                              <TableCell>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${item.progress_percent || 0}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{item.progress_percent || 0}%</p>
                              </TableCell>
                              <TableCell>{getStatusBadge(item)}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString('de-DE') : '-'}
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-sm">{item.attempts || 0}</TableCell>
                              <TableCell className="text-sm">{item.best_score || 0}%</TableCell>
                              <TableCell>{getStatusBadge(item)}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {item.last_attempt_at ? new Date(item.last_attempt_at).toLocaleDateString('de-DE') : '-'}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Keine Daten gefunden</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
