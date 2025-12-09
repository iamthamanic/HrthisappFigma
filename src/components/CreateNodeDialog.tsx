import { useState } from 'react';
import { MapPin, UserCog, Building2, Layers, X } from './icons/BrowoKoIcons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { cn } from './ui/utils';
import type { NodeType } from './OrgNode';

/**
 * CREATE NODE DIALOG
 * ===================
 * Dialog to create new org chart nodes
 * 
 * Features:
 * - Select node type (Location, Executive, Department, Specialization)
 * - Enter title & description
 * - Visual type selector with icons
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
    description: 'Büro oder Geschäftsstelle',
  },
  {
    type: 'executive',
    icon: UserCog,
    color: '#8B5CF6',
    displayName: 'Geschäftsführung',
    description: 'Führungsposition',
  },
  {
    type: 'department',
    icon: Building2,
    color: '#6B7280',
    displayName: 'Abteilung',
    description: 'Organisationseinheit',
  },
  {
    type: 'specialization',
    icon: Layers,
    color: '#10B981',
    displayName: 'Spezialisierung',
    description: 'Fachbereich oder Team',
  },
];

interface CreateNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    type: NodeType;
    title: string;
    description: string;
  }) => void;
}

export default function CreateNodeDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateNodeDialogProps) {
  const [selectedType, setSelectedType] = useState<NodeType>('department');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    onCreate({
      type: selectedType,
      title: title.trim(),
      description: description.trim(),
    });

    // Reset form
    setSelectedType('department');
    setTitle('');
    setDescription('');
    onClose();
  };

  const handleClose = () => {
    // Reset form on close
    setSelectedType('department');
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="form-card max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neuen Node hinzufügen</DialogTitle>
          <DialogDescription>
            Wählen Sie den Node-Typ und geben Sie die Details für das neue Element im Organigram ein.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Node Type Selection */}
          <div className="form-field">
            <Label className="form-label">Node-Typ auswählen</Label>
            <div className="grid grid-cols-2 gap-3">
              {NODE_TYPES.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedType === option.type;

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedType(option.type)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all duration-200 text-left',
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
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${option.color}20`,
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: option.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-0.5">{option.displayName}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
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
                backgroundColor: NODE_TYPES.find((t) => t.type === selectedType)?.color,
              }}
              className="text-white hover:opacity-90"
            >
              Node erstellen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}