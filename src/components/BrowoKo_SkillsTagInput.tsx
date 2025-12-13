/**
 * @file components/BrowoKo_SkillsTagInput.tsx
 * @description Tag input for skills (like Benefits tags)
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface SkillsTagInputProps {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}

export function SkillsTagInput({ skills, onChange, placeholder = 'Skill hinzufügen...' }: SkillsTagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addSkill = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
      setInputValue('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSkill}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Hinzufügen
        </Button>
      </div>

      {/* Tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-sm text-gray-500">Noch keine Skills hinzugefügt</p>
      )}
    </div>
  );
}
