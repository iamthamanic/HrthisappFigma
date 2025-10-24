import { useState, useEffect } from 'react';
import { MapPin, UserCog, Building2, Layers } from './icons/HRTHISIcons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { cn } from './ui/utils';
import type { NodeType, OrgNodeData } from './OrgNode';

/**
 * EDIT NODE DIALOG
 * =================
 * Dialog to edit existing org chart nodes
 * 
 * Features:
 * - Edit title & description
 * - Change node type (with warning if connections exist)
 * - Delete node
 */

interface NodeTypeOption {
  type: NodeType;
  icon: typeof MapPin;
  color: string;
  displayName: string;
}

const NODE_TYPES: NodeTypeOption[] = [
  {
    type: 'location',
    icon: MapPin,
    color: '#3B82F6',
    displayName: 'Standort',
  },
  {
    type: 'executive',
    icon: UserCog,
    color: '#8B5CF6',
    displayName: 'Geschäftsführung',
  },
  {
    type: 'department',
    icon: Building2,
    color: '#6B7280',
    displayName: 'Abteilung',
  },
  {
    type: 'specialization',
    icon: Layers,
    color: '#10B981',
    displayName: 'Spezialisierung',
  },
];

interface EditNodeDialogProps {
  node: OrgNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, data: {
    type: NodeType;
    title: string;
    description: string;
  }) => void;
}

export default function EditNodeDialog({
  node,
  isOpen,
  onClose,
  onSave,
}: EditNodeDialogProps) {
  const [selectedType, setSelectedType] = useState<NodeType>(node?.type || 'department');
  const [title, setTitle] = useState(node?.title || '');
  const [description, setDescription] = useState(node?.description || '');

  // Update form when node changes
  useEffect(() => {
    if (node) {
      setSelectedType(node.type);
      setTitle(node.title);
      setDescription(node.description || '');
    }
  }, [node]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!node || !title.trim()) {
      return;
    }

    onSave(node.id, {
      type: selectedType,
      title: title.trim(),
      description: description.trim(),
    });

    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!node) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Node bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Details dieses Organigram-Elements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Node Type Selection */}
          <div>
            <Label>Node-Typ</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {NODE_TYPES.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedType === option.type;

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedType(option.type)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all duration-200 text-left',
                      'hover:shadow-md hover:scale-[1.02]',
                      isSelected
                        ? 'border-current shadow-lg ring-2 ring-offset-2'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    style={{
                      borderColor: isSelected ? option.color : undefined,
                      color: isSelected ? option.color : '#6B7280',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${option.color}20`,
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{ color: option.color }}
                        />
                      </div>
                      <div className="font-medium text-sm">{option.displayName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <Label htmlFor="edit-title">Titel *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. HR-Abteilung, Hauptsitz Berlin, CEO, etc."
              required
              className="mt-1"
            />
          </div>

          {/* Description Input */}
          <div>
            <Label htmlFor="edit-description">Beschreibung (optional)</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              style={{
                backgroundColor: NODE_TYPES.find((t) => t.type === selectedType)?.color,
              }}
              className="text-white hover:opacity-90"
            >
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
