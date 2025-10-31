import { useState } from 'react';
import { Check, Sparkles } from './icons/BrowoKoIcons';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import AvatarDisplay from './AvatarDisplay';

interface AvatarEditorProps {
  currentEmoji?: string;
  currentLevel?: number;
  currentSkinColor?: string;
  currentHairColor?: string;
  currentBackgroundColor?: string;
  onSave?: (avatar: AvatarConfig) => void;
}

export interface AvatarConfig {
  emoji: string;
  skinColor: string;
  hairColor: string;
  backgroundColor: string;
}

const EMOJI_OPTIONS = [
  '👤', '😀', '😎', '🤓', '🥳', '😇', '🤠', '🥸',
  '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🎓',
  '👩‍🎓', '🧙', '🧙‍♀️', '🧛', '🧛‍♀️', '🦸', '🦸‍♀️', '🦹',
  '🦹‍♀️', '🧑‍🚀', '👮', '👮‍♀️', '🕵️', '🕵️‍♀️', '💂', '💂‍♀️'
];

const SKIN_COLORS = [
  '#FFDAB9', '#F4C2A5', '#E6A87E', '#D4915F', '#B56B45', '#8B5A3C'
];

const HAIR_COLORS = [
  '#2C1B18', '#594939', '#8B6F47', '#D2B48C', '#F5DEB3', '#E9967A',
  '#CD853F', '#A0522D', '#FFD700', '#FF6347'
];

const BACKGROUND_COLORS = [
  '#E5E7EB', '#DBEAFE', '#E0E7FF', '#EDE9FE', '#FCE7F3', '#FEE2E2',
  '#FEF3C7', '#D1FAE5', '#CCFBF1', '#E0F2FE'
];

export default function AvatarEditor({
  currentEmoji = '👤',
  currentLevel = 1,
  currentSkinColor = SKIN_COLORS[0],
  currentHairColor = HAIR_COLORS[0],
  currentBackgroundColor = BACKGROUND_COLORS[0],
  onSave
}: AvatarEditorProps) {
  const [emoji, setEmoji] = useState(currentEmoji);
  const [skinColor, setSkinColor] = useState(currentSkinColor);
  const [hairColor, setHairColor] = useState(currentHairColor);
  const [backgroundColor, setBackgroundColor] = useState(currentBackgroundColor);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.({
      emoji,
      skinColor,
      hairColor,
      backgroundColor
    });
    setHasChanges(false);
  };

  const handleReset = () => {
    setEmoji(currentEmoji);
    setSkinColor(currentSkinColor);
    setHairColor(currentHairColor);
    setBackgroundColor(currentBackgroundColor);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Avatar-Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
          <AvatarDisplay
            emoji={emoji}
            level={currentLevel}
            size="xl"
            backgroundColor={backgroundColor}
          />
          <p className="text-sm text-gray-600">Vorschau</p>
        </div>

        {/* Editor Tabs */}
        <Tabs defaultValue="emoji" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emoji">Emoji</TabsTrigger>
            <TabsTrigger value="colors">Farben</TabsTrigger>
            <TabsTrigger value="background">Hintergrund</TabsTrigger>
          </TabsList>

          {/* Emoji Tab */}
          <TabsContent value="emoji" className="space-y-4">
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map((emojiOption) => (
                <button
                  key={emojiOption}
                  onClick={() => handleChange(setEmoji, emojiOption)}
                  className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                    emoji === emojiOption
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {emojiOption}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            {/* Skin Color */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Hautfarbe
              </label>
              <div className="grid grid-cols-6 gap-2">
                {SKIN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange(setSkinColor, color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 relative ${
                      skinColor === color
                        ? 'border-blue-600 shadow-lg'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {skinColor === color && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Haarfarbe
              </label>
              <div className="grid grid-cols-6 gap-2">
                {HAIR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleChange(setHairColor, color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 relative ${
                      hairColor === color
                        ? 'border-blue-600 shadow-lg'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {hairColor === color && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="space-y-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Hintergrundfarbe
            </label>
            <div className="grid grid-cols-5 gap-2">
              {BACKGROUND_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleChange(setBackgroundColor, color)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 relative ${
                    backgroundColor === color
                      ? 'border-blue-600 shadow-lg'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {backgroundColor === color && (
                    <Check className="w-4 h-4 text-blue-600 absolute inset-0 m-auto" />
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            Speichern
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={!hasChanges}
          >
            Zurücksetzen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}