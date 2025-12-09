import { useState, useEffect } from 'react';
import { MapPin, UserCog, Building2, Layers } from './icons/BrowoKoIcons';
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
  description: string;
}

const NODE_TYPES: NodeTypeOption[] = [
  {
    type: 'location',
    icon: MapPin,
    color: '#3B82F6',
    displayName: 'Standort',
    description: 'Ein physischer Standort oder eine Adresse.',
  },
  {
    type: 'executive',
    icon: UserCog,
    color: '#8B5CF6',
    displayName: 'Geschäftsführung',
    description: 'Eine führende Position in der Organisation.',
  },
  {
    type: 'department',
    icon: Building2,
    color: '#6B7280',
    displayName: 'Abteilung',
    description: 'Eine spezifische Abteilung innerhalb der Organisation.',
  },
  {
    type: 'specialization',
    icon: Layers,
    color: '#10B981',
    displayName: 'Spezialisierung',
    description: 'Eine spezifische Fachrichtung oder Kompetenzbereich.',
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

  const currentNode = node;
  const typeOption = NODE_TYPES.find((t) => t.type === selectedType);
  const Icon = typeOption?.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="form-card max-w-2xl">
        <DialogHeader>
          <DialogTitle>Node bearbeiten</DialogTitle>
          <DialogDescription>
            Bearbeiten Sie die Details für {currentNode.data.title}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Node Type Display (Read-only) */}
          <div className="form-field">
            <Label className="form-label">Node-Typ</Label>
            <div className="p-4 rounded-lg border-2 bg-gray-50">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${typeOption.color}20`,
                  }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: typeOption.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-0.5">{typeOption.displayName}</div>
                  <div className="text-xs text-gray-500">{typeOption.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div className="form-field">
            <Label htmlFor="title" className="form-label">Titel *</Label>
            <Input
              id="title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. HR-Abteilung, Hauptsitz Berlin, CEO, etc."
              required
            />
          </div>

          {/* Description Input */}
          <div className="form-field">
            <Label htmlFor="description" className="form-label">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="form-footer">
            <Button type="button" variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              style={{
                backgroundColor: typeOption.color,
              }}
              className="text-white hover:opacity-90"
            >
              Änderungen speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}