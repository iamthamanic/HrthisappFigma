import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Bookmark, Trash2, Save, Loader2, Globe } from './icons/BrowoKoIcons';
import { SavedSearch, SearchConfig } from '../types/database';

interface SavedSearchesDropdownProps {
  savedSearches: SavedSearch[];
  currentConfig: SearchConfig;
  onApplySearch: (config: SearchConfig) => void;
  onSaveSearch: (name: string, description: string, isGlobal: boolean) => Promise<void>;
  onDeleteSearch: (searchId: string) => Promise<void>;
  isAdmin?: boolean;
}

export default function SavedSearchesDropdown({
  savedSearches,
  currentConfig,
  onApplySearch,
  onSaveSearch,
  onDeleteSearch,
  isAdmin = false,
}: SavedSearchesDropdownProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSaveSearch(name.trim(), description.trim(), isGlobal);
      setShowSaveDialog(false);
      setName('');
      setDescription('');
      setIsGlobal(false);
    } catch (error) {
      console.error('Save search error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, searchId: string) => {
    e.stopPropagation();
    if (confirm('Diese gespeicherte Suche wirklich löschen?')) {
      await onDeleteSearch(searchId);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Bookmark className="w-4 h-4" />
            Gespeicherte Suchen
            {savedSearches.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {savedSearches.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Gespeicherte Suchen</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
            <Save className="w-4 h-4 mr-2" />
            Aktuelle Suche speichern
          </DropdownMenuItem>
          
          {savedSearches.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {savedSearches.map((search) => (
                  <DropdownMenuItem
                    key={search.id}
                    onClick={() => onApplySearch(search.search_config)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {search.is_global && <Globe className="w-3 h-3 text-blue-600" />}
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{search.name}</p>
                        {search.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {search.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={(e) => handleDelete(e, search.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </div>
            </>
          )}
          
          {savedSearches.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              Keine gespeicherten Suchen
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Suche speichern
            </DialogTitle>
            <DialogDescription>
              Speichere die aktuelle Suche für schnellen Zugriff
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Aktive IT-Mitarbeiter"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kurze Beschreibung der Suche..."
                rows={3}
                disabled={saving}
              />
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="is_global" className="cursor-pointer flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Für alle verfügbar
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Alle Nutzer können diese Suche verwenden
                  </p>
                </div>
                <Switch
                  id="is_global"
                  checked={isGlobal}
                  onCheckedChange={setIsGlobal}
                  disabled={saving}
                />
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Wird gespeichert:</strong>
              </p>
              <ul className="text-xs text-blue-800 mt-1 space-y-0.5">
                {currentConfig.searchQuery && <li>• Suchbegriff: "{currentConfig.searchQuery}"</li>}
                {currentConfig.statusFilter !== 'all' && <li>• Status: {currentConfig.statusFilter}</li>}
                {currentConfig.roleFilter !== 'all' && <li>• Rolle: {currentConfig.roleFilter}</li>}
                {currentConfig.departmentFilter !== 'all' && <li>• Abteilung: {currentConfig.departmentFilter}</li>}
                {currentConfig.locationFilter !== 'all' && <li>• Standort: {currentConfig.locationFilter}</li>}
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSaveDialog(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
