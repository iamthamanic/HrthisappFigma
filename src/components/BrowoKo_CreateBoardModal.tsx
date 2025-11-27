/**
 * @file BrowoKo_CreateBoardModal.tsx
 * @domain HR - Task Management
 * @description Modal for creating new Kanban boards
 * @created v4.10.16
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Board {
  id: string;
  name: string;
  description?: string;
}

interface CreateBoardModalProps {
  onClose: () => void;
  onSave: (board: Board) => void;
}

export function BrowoKo_CreateBoardModal({ onClose, onSave }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;

    setSaving(true);
    
    const newBoard: Board = {
      id: `board-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
    };

    onSave(newBoard);
    setSaving(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Board erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Board-Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Marketing, Entwicklung, HR..."
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Beschreibung
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: Beschreibung des Boards"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            Board erstellen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
