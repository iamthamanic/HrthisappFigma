/**
 * TEST BUILDER SCREEN (v4.13.2)
 * ==============================
 * Drag & Drop Test Builder mit 10 Block-Typen
 * 
 * Features:
 * - Block Toolbox (links)
 * - Canvas mit Drag & Drop (mitte)
 * - Block Settings Panel (rechts)
 * - Save/Publish Buttons
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  GripVertical,
  CheckSquare,
  Circle,
  FileText,
  Upload,
  Video,
  Image as ImageIcon,
  List,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { LearningService } from '../../services/BrowoKo_learningService';
import { supabase } from '../../utils/supabase/client';
import { useAuthStore } from '../../stores/BrowoKo_authStore';
import LoadingState from '../../components/LoadingState';
import { YouTubePlayer } from '../../components/YouTubePlayer';
import type { Test, TestBlock } from '../../types/schemas/BrowoKo_learningSchemas';

// ========================================
// BLOCK TYPES
// ========================================
export const BLOCK_TYPES = [
  {
    id: 'multiple-choice-single',
    label: 'Multiple Choice (Single)',
    icon: Circle,
    color: 'bg-blue-500',
    description: 'Eine Antwort auswählen'
  },
  {
    id: 'multiple-choice-multi',
    label: 'Multiple Choice (Multi)',
    icon: CheckSquare,
    color: 'bg-purple-500',
    description: 'Mehrere Antworten auswählen'
  },
  {
    id: 'true-false',
    label: 'True/False',
    icon: CheckSquare,
    color: 'bg-green-500',
    description: 'Wahr oder Falsch'
  },
  {
    id: 'text-input-short',
    label: 'Text Input (Short)',
    icon: Edit3,
    color: 'bg-yellow-500',
    description: 'Kurze Textantwort'
  },
  {
    id: 'text-input-long',
    label: 'Text Input (Long)',
    icon: FileText,
    color: 'bg-orange-500',
    description: 'Lange Textantwort'
  },
  {
    id: 'file-upload',
    label: 'File Upload',
    icon: Upload,
    color: 'bg-red-500',
    description: 'Datei hochladen'
  },
  {
    id: 'video-embed',
    label: 'Video Embed',
    icon: Video,
    color: 'bg-pink-500',
    description: 'YouTube Video'
  },
  {
    id: 'image-question',
    label: 'Image Question',
    icon: ImageIcon,
    color: 'bg-indigo-500',
    description: 'Frage mit Bild'
  },
  {
    id: 'sorting',
    label: 'Sortierung',
    icon: List,
    color: 'bg-teal-500',
    description: 'Reihenfolge sortieren'
  },
  {
    id: 'fill-in-blanks',
    label: 'Lückentext',
    icon: Edit3,
    color: 'bg-cyan-500',
    description: 'Lücken ausfüllen'
  }
] as const;

// ========================================
// MAIN COMPONENT
// ========================================
export default function TestBuilderScreen() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const learningService = useMemo(() => new LearningService(supabase), []);

  const [test, setTest] = useState<Test | null>(null);
  const [blocks, setBlocks] = useState<TestBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkedVideo, setLinkedVideo] = useState<any | null>(null);

  // ========================================
  // LOAD TEST
  // ========================================
  useEffect(() => {
    if (!testId) return;
    loadTest();
  }, [testId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      console.log('🔄 [loadTest] Loading test...', { testId });
      
      // Fixed: Method is called getTest, not getTestById
      const testData = await learningService.getTest(testId!);
      setTest(testData);
      
      // Parse blocks from JSON
      const parsedBlocks = testData.blocks || [];
      setBlocks(parsedBlocks);
      
      // ✅ FIX: Load linked video from test_video_assignments table
      try {
        const { data: assignment, error } = await supabase
          .from('test_video_assignments')
          .select('video_id')
          .eq('test_id', testId!)
          .single();
        
        if (assignment?.video_id) {
          const videoData = await learningService.getVideoById(assignment.video_id);
          setLinkedVideo(videoData);
          console.log('✅ [loadTest] Linked video loaded:', videoData.title);
        } else {
          console.log('ℹ️ [loadTest] No video linked to this test');
          setLinkedVideo(null);
        }
      } catch (error) {
        // No video assigned - this is OK
        console.log('ℹ️ [loadTest] No video linked (or error loading):', error);
        setLinkedVideo(null);
      }
      
      console.log('✅ [loadTest] Success!', { blocks: parsedBlocks.length });
    } catch (error: any) {
      console.error('❌ [loadTest] Error:', error);
      toast.error('Fehler beim Laden des Tests');
      navigate('/admin/lernen');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // ADD BLOCK
  // ========================================
  const addBlock = (blockTypeId: string) => {
    const blockType = BLOCK_TYPES.find(bt => bt.id === blockTypeId);
    if (!blockType) return;

    const newBlock: TestBlock = {
      id: `block-${Date.now()}`,
      type: blockTypeId as any,
      order: blocks.length,
      question: '',
      required: false,
      points: 1,
      // Type-specific defaults
      ...(blockTypeId.startsWith('multiple-choice') && {
        options: [
          { id: '1', text: '', isCorrect: false },
          { id: '2', text: '', isCorrect: false },
          { id: '3', text: '', isCorrect: false },
          { id: '4', text: '', isCorrect: false }
        ]
      }),
      ...(blockTypeId === 'true-false' && {
        correctAnswer: true
      }),
      ...(blockTypeId === 'sorting' && {
        items: [
          { id: '1', text: '', correctOrder: 0 },
          { id: '2', text: '', correctOrder: 1 }
        ]
      }),
      ...(blockTypeId === 'fill-in-blanks' && {
        text: 'Das ist ein __BLANK__ Text mit __BLANK__.',
        blanks: [
          { id: '1', correctAnswer: 'Lückentext' },
          { id: '2', correctAnswer: 'Lücken' }
        ]
      })
    };

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast.success(`${blockType.label} hinzugefügt`);
  };

  // ========================================
  // UPDATE BLOCK
  // ========================================
  const updateBlock = (blockId: string, updates: Partial<TestBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? { ...block, ...updates }
        : block
    ));
  };

  // ========================================
  // DELETE BLOCK
  // ========================================
  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    toast.success('Block gelöscht');
  };

  // ========================================
  // MOVE BLOCK
  // ========================================
  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    
    // Update order
    newBlocks.forEach((block, i) => {
      block.order = i;
    });

    setBlocks(newBlocks);
  };

  // ========================================
  // SAVE TEST
  // ========================================
  const saveTest = async () => {
    if (!test || !profile?.organization_id) return;

    try {
      setSaving(true);
      console.log('💾 [saveTest] Saving...', { blocks: blocks.length });

      await learningService.updateTest(test.id, {
        title: test.title,
        description: test.description,
        xp_reward: test.xp_reward,
        passing_score: test.passing_score,
        coin_reward: test.coin_reward,
        blocks: blocks
      });

      toast.success('Test gespeichert!');
      console.log('✅ [saveTest] Success!');
    } catch (error: any) {
      console.error('❌ [saveTest] Error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // PUBLISH TEST
  // ========================================
  const publishTest = async () => {
    if (!test || !profile?.organization_id) return;

    // Validate
    if (blocks.length === 0) {
      toast.error('Mindestens einen Block hinzufügen!');
      return;
    }

    try {
      setSaving(true);
      console.log('📤 [publishTest] Publishing...', { blocks: blocks.length });

      await learningService.updateTest(test.id, {
        title: test.title,
        description: test.description,
        xp_reward: test.xp_reward,
        passing_score: test.passing_score,
        coin_reward: test.coin_reward,
        blocks: blocks,
        published: true
      });

      toast.success('Test veröffentlicht!');
      navigate('/admin/lernen');
    } catch (error: any) {
      console.error('❌ [publishTest] Error:', error);
      toast.error('Fehler beim Veröffentlichen');
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // UPDATE TEST INFO
  // ========================================
  const updateTestInfo = (updates: Partial<Test>) => {
    if (!test) return;
    setTest({ ...test, ...updates });
  };

  // ========================================
  // SELECTED BLOCK
  // ========================================
  const selectedBlock = useMemo(() => {
    return blocks.find(b => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  // ========================================
  // LOADING STATE
  // ========================================
  if (loading) {
    return <LoadingState message="Test wird geladen..." />;
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Test nicht gefunden</p>
          <Button onClick={() => navigate('/admin/lernen')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </div>
      </div>
    );
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* LEFT COLUMN - Buttons + Block-Typen */}
      <div className="w-80 flex flex-col bg-gray-100 border-r">
        {/* Action Buttons */}
        <div className="bg-white border-b p-4 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/lernen')}
            className="w-full justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            variant="outline"
            onClick={saveTest}
            disabled={saving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
          <Button
            onClick={publishTest}
            disabled={saving || blocks.length === 0}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Veröffentlichen
          </Button>
        </div>

        {/* Block-Typen */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="font-bold mb-4">Block-Typen</h2>
          <div className="space-y-3">
            {BLOCK_TYPES.map(blockType => {
              const Icon = blockType.icon;
              return (
                <button
                  key={blockType.id}
                  onClick={() => addBlock(blockType.id)}
                  className="w-full flex items-start gap-3 p-4 rounded-lg bg-white border hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className={`${blockType.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{blockType.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{blockType.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Test Info + Video (oben) & Canvas (unten) */}
      <div className="flex-1 flex flex-col">
        {/* TOP ROW - Test Info + Video Player */}
        <div className="bg-white border-b">
          <div className="grid grid-cols-[340px_1fr] gap-4 p-6">
            {/* Test Informationen */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h2 className="font-semibold mb-4 text-sm">Test Informationen</h2>
              
              <div className="space-y-4">
                {/* Titel */}
                <div>
                  <Label className="text-xs text-gray-600">Titel</Label>
                  <Input
                    value={test.title}
                    onChange={(e) => updateTestInfo({ title: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Beschreibung */}
                <div>
                  <Label className="text-xs text-gray-600">Beschreibung</Label>
                  <Textarea
                    value={test.description || ''}
                    onChange={(e) => updateTestInfo({ description: e.target.value })}
                    placeholder="Beschreibung eingeben..."
                    rows={2}
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Verknüpftes Video */}
                <div>
                  <Label className="text-xs text-gray-600">Verknüpftes Video</Label>
                  <div className="mt-1 px-3 py-2 bg-white border rounded text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span className="truncate">{linkedVideo ? linkedVideo.title : 'Kein Video'}</span>
                  </div>
                </div>

                {/* Test Kriterien */}
                <div>
                  <h3 className="font-semibold text-xs text-center mb-3">Test Kriterien</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-gray-600">EXP</Label>
                      <Input
                        type="number"
                        placeholder="z.B 200"
                        className="mt-1 text-xs h-8"
                        value={test.xp_reward || ''}
                        onChange={(e) => updateTestInfo({ xp_reward: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">min. Erfolg</Label>
                      <Input
                        type="number"
                        placeholder="z.B 80"
                        className="mt-1 text-xs h-8"
                        value={test.passing_score || ''}
                        onChange={(e) => updateTestInfo({ passing_score: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Coins</Label>
                      <Input
                        type="number"
                        placeholder="z.B 100"
                        className="mt-1 text-xs h-8"
                        value={test.coin_reward || ''}
                        onChange={(e) => updateTestInfo({ coin_reward: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              {linkedVideo ? (
                <YouTubePlayer videoId={linkedVideo.youtube_video_id} />
              ) : (
                <div className="text-center py-32">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Kein Video verknüpft</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW - Canvas & Settings */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
            {blocks.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-2xl">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-3xl font-semibold mb-3 text-gray-900">Noch keine Blöcke</h3>
                  <p className="text-gray-600">
                    Wähle einen Test-Type-Block aus der linken Sidebar aus um zu starten
                  </p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-4">
                {blocks.map((block, index) => {
                  const blockType = BLOCK_TYPES.find(bt => bt.id === block.type);
                  const Icon = blockType?.icon || FileText;
                  const isSelected = selectedBlockId === block.id;

                  return (
                    <Card
                      key={block.id}
                      className={`cursor-pointer transition-all bg-white ${
                        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveBlock(block.id, 'up');
                              }}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveBlock(block.id, 'down');
                              }}
                              disabled={index === blocks.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                          </div>
                          <div className={`${blockType?.color || 'bg-gray-500'} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-500">{blockType?.label}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlock(block.id);
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="font-medium text-gray-900">
                              {block.question || 'Frage eingeben...'}
                            </p>
                            {block.required && (
                              <span className="text-xs text-red-500">* Pflichtfeld</span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Block Settings (wenn Block ausgewählt) */}
          {selectedBlock && (
            <div className="w-96 bg-white border-l overflow-y-auto">
              <div className="p-6">
                <Tabs defaultValue="edit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Bearbeiten
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Vorschau
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="edit" className="mt-0">
                    <h2 className="font-semibold mb-4">Block-Einstellungen</h2>
                    <BlockSettings
                      block={selectedBlock}
                      onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                    />
                  </TabsContent>

                  <TabsContent value="preview" className="mt-0">
                    <h2 className="font-semibold mb-4">Vorschau</h2>
                    <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4">
                      <p className="text-xs text-gray-500 mb-4 text-center">
                        So wird die Frage im Test aussehen:
                      </p>
                      <BlockPreview block={selectedBlock} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// BLOCK SETTINGS COMPONENT
// ========================================
function BlockSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  const blockType = BLOCK_TYPES.find(bt => bt.id === block.type);

  return (
    <div className="space-y-6">
      {/* QUESTION */}
      <div>
        <Label>Frage *</Label>
        <Textarea
          value={block.question}
          onChange={(e) => onUpdate({ question: e.target.value })}
          placeholder="Frage eingeben..."
          rows={3}
          className="mt-1"
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <Label>Beschreibung (optional)</Label>
        <Textarea
          value={block.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Zusätzliche Hinweise..."
          rows={2}
          className="mt-1"
        />
      </div>

      {/* REQUIRED */}
      <div className="flex items-center justify-between">
        <Label>Pflichtfeld</Label>
        <Switch
          checked={block.required}
          onCheckedChange={(checked) => onUpdate({ required: checked })}
        />
      </div>

      {/* POINTS */}
      <div>
        <Label>Punkte</Label>
        <Input
          type="number"
          value={block.points}
          onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
          min={1}
          className="mt-1"
        />
      </div>

      {/* TYPE-SPECIFIC SETTINGS */}
      {(block.type === 'multiple-choice-single' || block.type === 'multiple-choice-multi') && (
        <MultipleChoiceSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'true-false' && (
        <TrueFalseSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'sorting' && (
        <SortingSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'fill-in-blanks' && (
        <FillInBlanksSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'video-embed' && (
        <VideoEmbedSettings block={block} onUpdate={onUpdate} />
      )}
      {block.type === 'image-question' && (
        <ImageQuestionSettings block={block} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// ========================================
// MULTIPLE CHOICE SETTINGS
// ========================================
function MultipleChoiceSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  const options = block.options || [];
  const isSingleChoice = block.type === 'multiple-choice-single';

  const addOption = () => {
    onUpdate({
      options: [
        ...options,
        { id: Date.now().toString(), text: '', isCorrect: false }
      ]
    });
  };

  const updateOption = (optionId: string, updates: Partial<typeof options[0]>) => {
    // For single choice, uncheck all other options when one is checked
    if (isSingleChoice && updates.isCorrect === true) {
      onUpdate({
        options: options.map(opt =>
          opt.id === optionId 
            ? { ...opt, ...updates } 
            : { ...opt, isCorrect: false }
        )
      });
    } else {
      onUpdate({
        options: options.map(opt =>
          opt.id === optionId ? { ...opt, ...updates } : opt
        )
      });
    }
  };

  const deleteOption = (optionId: string) => {
    onUpdate({
      options: options.filter(opt => opt.id !== optionId)
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <Label>Antwortoptionen</Label>
          <p className="text-xs text-gray-500 mt-0.5">
            {isSingleChoice 
              ? '✓ Nur EINE richtige Antwort auswählen' 
              : '✓ MEHRERE richtige Antworten möglich'
            }
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addOption}>
          <Plus className="w-4 h-4 mr-1" />
          Option
        </Button>
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-start gap-2">
            <Input
              value={option.text}
              onChange={(e) => updateOption(option.id, { text: e.target.value })}
              placeholder={`Antwortmöglichkeit ${String.fromCharCode(65 + index)}`}
              className={`flex-1 transition-colors ${
                option.isCorrect 
                  ? 'border-green-500 focus-visible:ring-green-500' 
                  : ''
              }`}
            />
            <div className="flex items-center gap-1">
              <Switch
                checked={option.isCorrect}
                onCheckedChange={(checked) => updateOption(option.id, { isCorrect: checked })}
                title={isSingleChoice ? 'Richtige Antwort' : 'Als richtig markieren'}
                className="data-[state=checked]:bg-green-500"
              />
              <button
                onClick={() => deleteOption(option.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {isSingleChoice && options.filter(o => o.isCorrect).length > 1 && (
        <p className="text-xs text-orange-600 mt-2">
          ⚠️ Warnung: Nur eine Antwort sollte als richtig markiert sein!
        </p>
      )}
      {options.filter(o => o.isCorrect).length === 0 && options.length > 0 && (
        <p className="text-xs text-orange-600 mt-2">
          ⚠️ Mindestens eine Antwort muss als richtig markiert sein!
        </p>
      )}
    </div>
  );
}

// ========================================
// TRUE/FALSE SETTINGS
// ========================================
function TrueFalseSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  return (
    <div>
      <Label>Richtige Antwort</Label>
      <Select
        value={block.correctAnswer?.toString()}
        onValueChange={(value) => onUpdate({ correctAnswer: value === 'true' })}
      >
        <SelectTrigger className="mt-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Wahr</SelectItem>
          <SelectItem value="false">Falsch</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ========================================
// SORTING SETTINGS
// ========================================
function SortingSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  const items = block.items || [];
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const addItem = () => {
    onUpdate({
      items: [
        ...items,
        { id: Date.now().toString(), text: '', correctOrder: items.length }
      ]
    });
  };

  const updateItem = (itemId: string, updates: Partial<typeof items[0]>) => {
    onUpdate({
      items: items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    });
  };

  const deleteItem = (itemId: string) => {
    const newItems = items.filter(item => item.id !== itemId);
    // Re-index correctOrder
    newItems.forEach((item, index) => {
      item.correctOrder = index;
    });
    onUpdate({ items: newItems });
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetItemId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Re-index correctOrder
    newItems.forEach((item, index) => {
      item.correctOrder = index;
    });

    onUpdate({ items: newItems });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <Label>Richtige Reihenfolge festlegen</Label>
          <p className="text-xs text-gray-500 mt-1">
            Per Drag & Drop sortieren, dann Text eingeben
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" />
          Item
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-2 rounded-lg border-2 bg-white transition-all ${
              draggedItem === item.id
                ? 'border-blue-500 opacity-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-move" />
            <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
            <Input
              value={item.text}
              onChange={(e) => updateItem(item.id, { text: e.target.value })}
              placeholder={`Item ${index + 1}`}
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => deleteItem(item.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================================
// FILL IN BLANKS SETTINGS
// ========================================
function FillInBlanksSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Text mit Lücken</Label>
        <Textarea
          value={block.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Verwende __BLANK__ für Lücken..."
          rows={4}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Verwende <code>__BLANK__</code> für jede Lücke
        </p>
      </div>

      <div>
        <Label>Richtige Antworten (kommasepariert)</Label>
        <Input
          value={block.blanks?.map(b => b.correctAnswer).join(', ') || ''}
          onChange={(e) => {
            const answers = e.target.value.split(',').map(a => a.trim()).filter(Boolean);
            onUpdate({
              blanks: answers.map((answer, index) => ({
                id: (index + 1).toString(),
                correctAnswer: answer
              }))
            });
          }}
          placeholder="Antwort 1, Antwort 2, ..."
          className="mt-1"
        />
      </div>
    </div>
  );
}

// ========================================
// VIDEO EMBED SETTINGS
// ========================================
function VideoEmbedSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  return (
    <div>
      <Label>YouTube URL</Label>
      <Input
        value={block.videoUrl || ''}
        onChange={(e) => onUpdate({ videoUrl: e.target.value })}
        placeholder="https://www.youtube.com/watch?v=..."
        className="mt-1"
      />
    </div>
  );
}

// ========================================
// IMAGE QUESTION SETTINGS
// ========================================
function ImageQuestionSettings({
  block,
  onUpdate
}: {
  block: TestBlock;
  onUpdate: (updates: Partial<TestBlock>) => void;
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(block.imageUrl || null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setImagePreview(dataUrl);
        onUpdate({ imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAreas = (areas: any[]) => {
    onUpdate({ clickableAreas: areas });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Bild Upload */}
      <div>
        <Label>Bild hochladen</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-1"
        />
      </div>

      {/* Bild Preview & Button zum Modal öffnen */}
      {imagePreview ? (
        <div className="space-y-3">
          <div
            onClick={() => setModalOpen(true)}
            className="relative cursor-pointer border-2 border-gray-300 hover:border-blue-500 rounded-lg overflow-hidden transition-all group"
            style={{ aspectRatio: '16/9' }}
          >
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            {/* Markierte Bereiche anzeigen */}
            {(block.clickableAreas || []).map((area: any, idx: number) => (
              <div
                key={idx}
                className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                style={{
                  left: `${area.x}%`,
                  top: `${area.y}%`,
                  width: `${area.width}%`,
                  height: `${area.height}%`
                }}
              />
            ))}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-all bg-white px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-medium">Klicken um Bereiche zu markieren</p>
              </div>
            </div>
          </div>

          {/* Bereiche Liste */}
          {(block.clickableAreas || []).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                ✓ {(block.clickableAreas || []).length} {(block.clickableAreas || []).length === 1 ? 'Bereich' : 'Bereiche'} markiert
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Bild hochladen um Bereiche zu markieren</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && imagePreview && (
        <ImageMarkupModal
          imageUrl={imagePreview}
          initialAreas={block.clickableAreas || []}
          onSave={handleSaveAreas}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// ========================================
// BLOCK PREVIEW COMPONENT
// ========================================
function BlockPreview({ block }: { block: TestBlock }) {
  const blockType = BLOCK_TYPES.find(bt => bt.id === block.type);

  if (!blockType) return <div>Unbekannter Block-Typ</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`${blockType.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
          <blockType.icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500">{blockType.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{blockType.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-gray-900">
          {block.question || 'Frage eingeben...'}
        </p>
        {block.required && (
          <span className="text-xs text-red-500">* Pflichtfeld</span>
        )}
      </div>

      {/* TYPE-SPECIFIC PREVIEW */}
      {(block.type === 'multiple-choice-single' || block.type === 'multiple-choice-multi') && (
        <MultipleChoicePreview block={block} />
      )}
      {block.type === 'true-false' && (
        <TrueFalsePreview block={block} />
      )}
      {block.type === 'text-input-short' && (
        <TextInputShortPreview block={block} />
      )}
      {block.type === 'text-input-long' && (
        <TextInputLongPreview block={block} />
      )}
      {block.type === 'file-upload' && (
        <FileUploadPreview block={block} />
      )}
      {block.type === 'image-question' && (
        <ImageQuestionPreview block={block} />
      )}
      {block.type === 'sorting' && (
        <SortingPreview block={block} />
      )}
      {block.type === 'fill-in-blanks' && (
        <FillInBlanksPreview block={block} />
      )}
      {block.type === 'video-embed' && (
        <VideoEmbedPreview block={block} />
      )}
    </div>
  );
}

// ========================================
// MULTIPLE CHOICE PREVIEW
// ========================================
function MultipleChoicePreview({ block }: { block: TestBlock }) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const options = block.options || [];
  const isSingleChoice = block.type === 'multiple-choice-single';

  const toggleAnswer = (optionId: string) => {
    if (isSingleChoice) {
      setSelectedAnswers([optionId]);
    } else {
      if (selectedAnswers.includes(optionId)) {
        setSelectedAnswers(selectedAnswers.filter(id => id !== optionId));
      } else {
        setSelectedAnswers([...selectedAnswers, optionId]);
      }
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const isSelected = selectedAnswers.includes(option.id);
        return (
          <button
            key={option.id}
            onClick={() => toggleAnswer(option.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
              isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-${isSingleChoice ? 'full' : 'md'} border-2 flex items-center justify-center flex-shrink-0 ${
              isSelected 
                ? 'border-blue-500 bg-blue-500' 
                : 'border-gray-300'
            }`}>
              {isSelected && (
                <div className={`w-2.5 h-2.5 bg-white ${isSingleChoice ? 'rounded-full' : 'rounded-sm'}`} />
              )}
            </div>
            <span className="text-sm font-medium text-gray-600 w-6">{String.fromCharCode(65 + index)}.</span>
            <span className="flex-1 text-gray-900">{option.text || `Antwortmöglichkeit ${String.fromCharCode(65 + index)}`}</span>
          </button>
        );
      })}
    </div>
  );
}

// ========================================
// TRUE/FALSE PREVIEW
// ========================================
function TrueFalsePreview({ block }: { block: TestBlock }) {
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setSelectedAnswer(true)}
        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
          selectedAnswer === true 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selectedAnswer === true 
            ? 'border-green-500 bg-green-500' 
            : 'border-gray-300'
        }`}>
          {selectedAnswer === true && (
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          )}
        </div>
        <span className="flex-1 font-medium text-gray-900">✓ Wahr</span>
      </button>

      <button
        onClick={() => setSelectedAnswer(false)}
        className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left ${
          selectedAnswer === false 
            ? 'border-red-500 bg-red-50' 
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selectedAnswer === false 
            ? 'border-red-500 bg-red-500' 
            : 'border-gray-300'
        }`}>
          {selectedAnswer === false && (
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          )}
        </div>
        <span className="flex-1 font-medium text-gray-900">✗ Falsch</span>
      </button>
    </div>
  );
}

// ========================================
// SORTING PREVIEW
// ========================================
function SortingPreview({ block }: { block: TestBlock }) {
  // Shuffle items initially so user has to sort them
  const [items, setItems] = useState(() => {
    const blockItems = [...(block.items || [])];
    // Fisher-Yates shuffle
    for (let i = blockItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [blockItems[i], blockItems[j]] = [blockItems[j], blockItems[i]];
    }
    return blockItems;
  });
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetItemId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    setItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const checkOrder = () => {
    setShowResult(true);
  };

  const isCorrectOrder = () => {
    return items.every((item, index) => item.correctOrder === index);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Ziehe die Items in die richtige Reihenfolge:</p>
        <Button size="sm" onClick={checkOrder}>
          Prüfen
        </Button>
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => {
          const isCorrect = showResult && item.correctOrder === index;
          const isWrong = showResult && item.correctOrder !== index;
          
          return (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-move transition-all ${
                draggedItem === item.id 
                  ? 'border-blue-500 opacity-50' 
                  : isCorrect
                  ? 'border-green-500 bg-green-50'
                  : isWrong
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
              <span className="flex-1 text-gray-900">{item.text || `Item ${index + 1}`}</span>
              {showResult && (
                <span className={`text-sm font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {isCorrect ? '✓' : '✗'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showResult && (
        <div className={`p-3 rounded-lg border-2 ${
          isCorrectOrder() 
            ? 'border-green-500 bg-green-50' 
            : 'border-yellow-500 bg-yellow-50'
        }`}>
          <p className={`text-sm font-medium ${
            isCorrectOrder() ? 'text-green-900' : 'text-yellow-900'
          }`}>
            {isCorrectOrder() 
              ? '✓ Perfekt! Alle Items sind in der richtigen Reihenfolge.' 
              : 'Nicht ganz richtig. Versuche es nochmal!'}
          </p>
        </div>
      )}
    </div>
  );
}

// ========================================
// FILL IN BLANKS PREVIEW
// ========================================
function FillInBlanksPreview({ block }: { block: TestBlock }) {
  const text = block.text || '';
  const blanks = block.blanks || [];
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  // Split text by __BLANK__ and create input fields
  const parts = text.split('__BLANK__');

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-3">Fülle die Lücken aus:</p>
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
        {parts.map((part, index) => (
          <span key={index}>
            <span className="text-gray-900">{part}</span>
            {index < parts.length - 1 && (
              <input
                type="text"
                value={answers[index] || ''}
                onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
                placeholder="..."
                className="inline-block mx-1 px-2 py-1 border-b-2 border-blue-500 bg-blue-50 focus:outline-none focus:border-blue-600 min-w-[100px] text-center"
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// ========================================
// VIDEO EMBED PREVIEW
// ========================================
function VideoEmbedPreview({ block }: { block: TestBlock }) {
  const videoUrl = block.videoUrl || '';
  
  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">YouTube URL eingeben um Video anzuzeigen</p>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <YouTubePlayer videoId={videoId} />
    </div>
  );
}

// ========================================
// TEXT INPUT SHORT PREVIEW
// ========================================
function TextInputShortPreview({ block }: { block: TestBlock }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-3">Kurze Textantwort:</p>
      <input
        type="text"
        placeholder="..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

// ========================================
// TEXT INPUT LONG PREVIEW
// ========================================
function TextInputLongPreview({ block }: { block: TestBlock }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-3">Lange Textantwort:</p>
      <textarea
        placeholder="..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        rows={4}
      />
    </div>
  );
}

// ========================================
// FILE UPLOAD PREVIEW
// ========================================
function FileUploadPreview({ block }: { block: TestBlock }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 mb-3">Datei hochladen:</p>
      <input
        type="file"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

// ========================================
// IMAGE QUESTION PREVIEW
// ========================================
// Helper: Overlap Detection (returns overlap percentage)
function calculateOverlap(rect1: Rectangle, rect2: Rectangle): number {
  const x1 = Math.max(rect1.x, rect2.x);
  const y1 = Math.max(rect1.y, rect2.y);
  const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
  
  if (x2 <= x1 || y2 <= y1) return 0; // No overlap
  
  const overlapArea = (x2 - x1) * (y2 - y1);
  const rect1Area = rect1.width * rect1.height;
  
  return (overlapArea / rect1Area) * 100;
}

interface UserRectangle extends Rectangle {
  isCorrect?: boolean;
  matchedArea?: Rectangle; // Reference to the admin area it matched
}

function ImageQuestionPreview({ block }: { block: TestBlock }) {
  const imageUrl = block.imageUrl;
  const clickableAreas = block.clickableAreas || [];
  const [userRects, setUserRects] = useState<UserRectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setDrawStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const width = Math.abs(x - drawStart.x);
    const height = Math.abs(y - drawStart.y);
    const rectX = Math.min(x, drawStart.x);
    const rectY = Math.min(y, drawStart.y);

    setCurrentRect({
      id: 'temp',
      name: '',
      x: rectX,
      y: rectY,
      width,
      height
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 1 && currentRect.height > 1) {
      // Check if this rectangle overlaps with any admin-defined area
      let bestMatch: Rectangle | null = null;
      let bestOverlap = 0;
      
      clickableAreas.forEach((area: Rectangle) => {
        const overlap = calculateOverlap(currentRect, area);
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          bestMatch = area;
        }
      });
      
      const isCorrect = bestOverlap >= 40; // 40% overlap = correct
      
      const newRect: UserRectangle = {
        id: `rect-${Date.now()}`,
        name: `Bereich ${userRects.length + 1}`,
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
        isCorrect,
        matchedArea: isCorrect ? bestMatch || undefined : undefined
      };
      setUserRects([...userRects, newRect]);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  const clearRects = () => {
    setUserRects([]);
  };

  if (!imageUrl) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Bild hochladen um Frage anzuzeigen</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Zeichne Rechtecke über die relevanten Bereiche:</p>
        {userRects.length > 0 && (
          <button
            onClick={clearRects}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Zurücksetzen
          </button>
        )}
      </div>
      
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative cursor-crosshair border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50"
        style={{ aspectRatio: '16/9' }}
      >
        <img
          src={imageUrl}
          alt="Question"
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
        
        {/* User Rechtecke anzeigen mit Feedback */}
        {userRects.map((rect, index) => (
          <div
            key={rect.id}
            className={`absolute border-4 ${
              rect.isCorrect 
                ? 'border-green-500 bg-green-500/20' 
                : 'border-red-500 bg-red-500/20'
            }`}
            style={{
              left: `${rect.x}%`,
              top: `${rect.y}%`,
              width: `${rect.width}%`,
              height: `${rect.height}%`
            }}
          >
            <div className={`absolute top-1 left-1 px-2 py-0.5 rounded text-xs font-bold ${
              rect.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {rect.isCorrect ? '✓' : '✗'} {index + 1}
            </div>
          </div>
        ))}

        {/* Current drawing rectangle */}
        {currentRect && (
          <div
            className="absolute border-4 border-blue-500 bg-blue-500/20"
            style={{
              left: `${currentRect.x}%`,
              top: `${currentRect.y}%`,
              width: `${currentRect.width}%`,
              height: `${currentRect.height}%`
            }}
          />
        )}
      </div>

      {clickableAreas.length > 0 && (
        <p className="text-xs text-gray-500">
          {clickableAreas.length} {clickableAreas.length === 1 ? 'Bereich' : 'Bereiche'} müssen markiert werden
        </p>
      )}

      {/* Feedback Liste */}
      {userRects.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="font-medium text-sm">Deine Markierungen:</h4>
          {userRects.map((rect, index) => (
            <div
              key={rect.id}
              className={`p-3 rounded-lg border-2 ${
                rect.isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-sm font-bold ${
                  rect.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {rect.isCorrect ? '✓' : '✗'} Bereich {index + 1}:
                </span>
                <div className="flex-1">
                  {rect.isCorrect && rect.matchedArea?.description ? (
                    <p className="text-sm text-green-900">
                      {rect.matchedArea.description}
                    </p>
                  ) : (
                    <p className="text-sm text-red-900">
                      Dieser Bereich ist nicht korrekt markiert.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// IMAGE MARKUP MODAL
// ========================================
interface Rectangle {
  id: string;
  name: string;
  description?: string; // Erklärung was das Problem ist
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

function ImageMarkupModal({
  imageUrl,
  initialAreas,
  onSave,
  onClose
}: {
  imageUrl: string;
  initialAreas: Rectangle[];
  onSave: (areas: Rectangle[]) => void;
  onClose: () => void;
}) {
  const [areas, setAreas] = useState<Rectangle[]>(initialAreas);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [resizing, setResizing] = useState<{ areaId: string; handle: string } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Start drawing new rectangle
    setIsDrawing(true);
    setDrawStart({ x, y });
    setSelectedAreaId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const width = Math.abs(x - drawStart.x);
    const height = Math.abs(y - drawStart.y);
    const rectX = Math.min(x, drawStart.x);
    const rectY = Math.min(y, drawStart.y);

    setCurrentRect({
      id: 'temp',
      name: '',
      x: rectX,
      y: rectY,
      width,
      height
    });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 1 && currentRect.height > 1) {
      const newArea: Rectangle = {
        id: `area-${Date.now()}`,
        name: `Bereich ${areas.length + 1}`,
        description: '',
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height
      };
      setAreas([...areas, newArea]);
      setSelectedAreaId(newArea.id);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  };

  const deleteArea = (areaId: string) => {
    setAreas(areas.filter(a => a.id !== areaId));
    if (selectedAreaId === areaId) {
      setSelectedAreaId(null);
    }
  };

  const updateAreaName = (areaId: string, name: string) => {
    setAreas(areas.map(a => a.id === areaId ? { ...a, name } : a));
  };

  const updateAreaDescription = (areaId: string, description: string) => {
    setAreas(areas.map(a => a.id === areaId ? { ...a, description } : a));
  };

  const handleSave = () => {
    onSave(areas);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="!max-w-[98vw] !max-h-[98vh] !w-[98vw] !h-[98vh] p-0 gap-0">
        <div className="flex flex-col h-full">
          {/* Header - Simple Title */}
          <DialogHeader className="px-4 py-2 border-b shrink-0">
            <DialogTitle className="text-base">Image Question</DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Canvas Area - LEFT SIDE - FILL CONTAINER */}
            <div className="flex-1 bg-gray-200 p-2 flex flex-col gap-1 min-w-0">
              {/* Instructions Text - statisch im Flow */}
              <div className="shrink-0">
                <p className="text-sm">
                  <strong>Bereiche markieren</strong><br />
                  Zeichne Rechtecke über die Bereiche, die im Test markiert werden sollen
                </p>
              </div>

              {/* Image Canvas - FLEX-1 = FILL REST */}
              <div className="flex-1 bg-white relative overflow-hidden rounded">
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="absolute inset-0 cursor-crosshair"
                >
                  <img
                    src={imageUrl}
                    alt="Markup"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Saved rectangles */}
                  {areas.map((area, index) => (
                    <div
                      key={area.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAreaId(area.id);
                      }}
                      className={`absolute border-4 ${
                        selectedAreaId === area.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-green-500 bg-green-500/20'
                      } cursor-move transition-all`}
                      style={{
                        left: `${area.x}%`,
                        top: `${area.y}%`,
                        width: `${area.width}%`,
                        height: `${area.height}%`
                      }}
                    >
                      <div className="absolute top-1 left-1 bg-white px-2 py-0.5 rounded text-xs font-bold">
                        {index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Current drawing rectangle */}
                  {currentRect && (
                    <div
                      className="absolute border-4 border-blue-500 bg-blue-500/20"
                      style={{
                        left: `${currentRect.x}%`,
                        top: `${currentRect.y}%`,
                        width: `${currentRect.width}%`,
                        height: `${currentRect.height}%`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - RIGHT SIDE */}
            <div className="w-80 bg-white border-l overflow-y-auto shrink-0">
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Markierte Bereiche ({areas.length})</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Klicke auf einen Bereich um ihn auszuwählen
                  </p>
                </div>

                {areas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Zeichne Rechtecke auf dem Bild
                  </div>
                ) : (
                  <div className="space-y-2">
                    {areas.map((area, index) => (
                      <div
                        key={area.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedAreaId === area.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAreaId(area.id)}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-sm font-bold text-gray-600 w-6">{index + 1}.</span>
                          <Input
                            value={area.name}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateAreaName(area.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder={`Bereich ${index + 1}`}
                            className="flex-1 text-sm h-8"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArea(area.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="pl-8 mb-2">
                          <Label className="text-xs text-gray-600 mb-1 block">Was ist das Problem?</Label>
                          <Textarea
                            value={area.description || ''}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateAreaDescription(area.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="z.B. Diese E-Mail-Adresse gehört nicht zu PayPal"
                            className="text-xs resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="pl-8 text-xs text-gray-500">
                          Position: {area.x.toFixed(1)}%, {area.y.toFixed(1)}%<br />
                          Größe: {area.width.toFixed(1)}% × {area.height.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={onClose}>
              x Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={areas.length === 0}>
              Bereiche speichern ({areas.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}