import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapUnderline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  uploadAnnouncementImage,
  uploadAnnouncementPdf,
  formatFileSize,
  isImageFile,
  isPdfFile,
} from '../utils/BrowoKo_storageHelper';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText } from './icons/BrowoKoIcons';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Undo,
  Redo,
  Video,
  Gift,
  X,
  Upload,
} from './icons/BrowoKoIcons';
import type { AnnouncementContent, AnnouncementContentBlock } from '../services/BrowoKo_announcementService';

interface AnnouncementContentEditorProps {
  content: AnnouncementContent;
  onChange: (content: AnnouncementContent) => void;
  availableVideos?: Array<{ id: string; title: string }>;
  availableBenefits?: Array<{ id: string; title: string }>;
}

export default function AnnouncementContentEditor({
  content,
  onChange,
  availableVideos = [],
  availableBenefits = [],
}: AnnouncementContentEditorProps) {
  // Separate rich text blocks from media blocks
  const richTextBlock = content.blocks.find((b) => b.type === 'richtext');
  const mediaBlocks = content.blocks.filter((b) => b.type === 'video' || b.type === 'benefit');

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'pdf'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [benefitDialogOpen, setBenefitDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState(availableVideos[0]?.id || '');
  const [selectedBenefitId, setSelectedBenefitId] = useState(availableBenefits[0]?.id || '');

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TiptapUnderline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      TiptapImage.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
    ],
    content: richTextBlock?.html || '<p>Schreibe deine Mitteilung hier...</p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 border rounded-md bg-white dark:bg-gray-900 dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      // Update rich text block
      const html = editor.getHTML();
      const newBlocks = [
        {
          type: 'richtext' as const,
          html,
        },
        ...mediaBlocks,
      ];
      onChange({ blocks: newBlocks });
    },
  });

  // Toolbar button component
  const ToolbarButton = ({
    onClick,
    active = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        active ? 'bg-gray-200 dark:bg-gray-700' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  // Insert link
  const insertLink = () => {
    if (!editor) return;

    if (linkUrl) {
      if (linkText) {
        // Insert new link with text
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
          .run();
      } else {
        // Set link on selection
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Handle file selection (Image or PDF)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadType === 'image') {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (uploadType === 'pdf') {
      setPdfFile(file);
    }
  };

  // Insert file (Image or PDF)
  const insertFile = async () => {
    if (!editor) return;

    try {
      setUploading(true);

      if (uploadType === 'image') {
        let finalImageUrl = imageUrl;

        // If file is selected, upload it first
        if (imageFile) {
          toast.info('Bild wird hochgeladen...');
          const result = await uploadAnnouncementImage(imageFile);
          finalImageUrl = result.url;
          toast.success('Bild erfolgreich hochgeladen!');
        }

        if (!finalImageUrl) {
          toast.error('Bitte wähle ein Bild oder gib eine URL ein');
          return;
        }

        editor.chain().focus().setImage({ src: finalImageUrl }).run();
      } else if (uploadType === 'pdf') {
        if (!pdfFile) {
          toast.error('Bitte wähle eine PDF-Datei');
          return;
        }

        toast.info('PDF wird hochgeladen...');
        const result = await uploadAnnouncementPdf(pdfFile);
        
        // Insert PDF as download link
        const pdfLinkHtml = `<p><a href="${result.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">📄 ${pdfFile.name}</a></p>`;
        editor.chain().focus().insertContent(pdfLinkHtml).run();
        
        toast.success('PDF erfolgreich hochgeladen!');
      }

      // Reset
      setUploadDialogOpen(false);
      resetUploadDialog();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  // Reset upload dialog
  const resetUploadDialog = () => {
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setPdfFile(null);
    setUploadType('image');
  };

  // Add video block
  const addVideoBlock = () => {
    if (!selectedVideoId) return;

    const newBlocks = [
      ...content.blocks,
      {
        type: 'video' as const,
        videoId: selectedVideoId,
      },
    ];
    onChange({ blocks: newBlocks });

    setVideoDialogOpen(false);
  };

  // Add benefit block
  const addBenefitBlock = () => {
    if (!selectedBenefitId) return;

    const newBlocks = [
      ...content.blocks,
      {
        type: 'benefit' as const,
        benefitId: selectedBenefitId,
      },
    ];
    onChange({ blocks: newBlocks });

    setBenefitDialogOpen(false);
  };

  // Remove media block
  const removeMediaBlock = (index: number) => {
    const newBlocks = content.blocks.filter((_, i) => i !== index);
    onChange({ blocks: newBlocks });
  };

  if (!editor) {
    return <div className="text-center py-8 text-gray-500">Editor wird geladen...</div>;
  }

  return (
    <div className="space-y-4">
      <Label>Inhalt der Mitteilung</Label>

      {/* Rich Text Editor */}
      <Card className="p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-gray-50 dark:bg-gray-900 p-2 flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Fett (Strg+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Kursiv (Strg+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Unterstrichen (Strg+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 border-r pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Überschrift 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Überschrift 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Überschrift 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Aufzählungsliste"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Nummerierte Liste"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              title="Linksbündig"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              title="Zentriert"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              title="Rechtsbündig"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Insert */}
          <div className="flex items-center gap-1 border-r pr-2">
            <ToolbarButton onClick={() => setLinkDialogOpen(true)} title="Link einfügen">
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton 
              onClick={() => {
                setUploadDialogOpen(true);
                setUploadType('image');
              }} 
              title="Bild oder PDF hochladen"
            >
              <Upload className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive('codeBlock')}
              title="Code-Block"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r pr-2">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Rückgängig (Strg+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Wiederholen (Strg+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Media Blocks */}
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => setVideoDialogOpen(true)}
              title="Schulungsvideo einfügen"
            >
              <Video className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => setBenefitDialogOpen(true)} title="Benefit einfügen">
              <Gift className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor Content */}
        <EditorContent editor={editor} />
      </Card>

      {/* Media Blocks Display */}
      {mediaBlocks.length > 0 && (
        <div className="space-y-2">
          <Label>Eingefügte Medien</Label>
          <div className="space-y-2">
            {content.blocks.map((block, index) => {
              if (block.type === 'video') {
                const video = availableVideos.find((v) => v.id === block.videoId);
                return (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Schulungsvideo</p>
                        <p className="text-xs text-gray-500">{video?.title || 'Unbekannt'}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaBlock(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </Card>
                );
              }

              if (block.type === 'benefit') {
                const benefit = availableBenefits.find((b) => b.id === block.benefitId);
                return (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Benefit</p>
                        <p className="text-xs text-gray-500">{benefit?.title || 'Unbekannt'}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMediaBlock(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </Card>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link einfügen</DialogTitle>
            <DialogDescription>
              Füge einen Link zu deiner Mitteilung hinzu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link-URL</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Link-Text (optional)</Label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="z.B. Klicke hier"
              />
              <p className="text-xs text-gray-500">
                Leer lassen, um den markierten Text zu verlinken
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={insertLink}>
              Einfügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog (Image & PDF) */}
      <Dialog 
        open={uploadDialogOpen} 
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) {
            resetUploadDialog();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Datei hochladen</DialogTitle>
            <DialogDescription>
              Lade ein Bild oder PDF hoch
            </DialogDescription>
          </DialogHeader>

          {/* Tabs: Bild oder PDF */}
          <Tabs value={uploadType} onValueChange={(v: any) => setUploadType(v)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Bild
              </TabsTrigger>
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </TabsTrigger>
            </TabsList>

            {/* Image Tab */}
            <TabsContent value="image" className="space-y-4 mt-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Bild hochladen</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,.heic"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm">
                      <span className="text-blue-600 hover:text-blue-700">
                        Klicke hier
                      </span>{' '}
                      oder ziehe ein Bild hierher
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, HEIC (max. 10 MB)
                    </p>
                  </label>
                </div>

                {/* Preview */}
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border max-h-64 object-contain mx-auto"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {imageFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>{imageFile.name}</span>
                    <span className="text-xs">({formatFileSize(imageFile.size)})</span>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                    Oder
                  </span>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label>Bild-URL</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={!!imageFile}
                />
                {imageFile && (
                  <p className="text-xs text-gray-500">
                    URL-Eingabe ist deaktiviert, wenn eine Datei ausgewählt ist
                  </p>
                )}
              </div>
            </TabsContent>

            {/* PDF Tab */}
            <TabsContent value="pdf" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>PDF hochladen</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileText className="w-12 h-12 text-gray-400" />
                    <p className="text-sm">
                      <span className="text-blue-600 hover:text-blue-700">
                        Klicke hier
                      </span>{' '}
                      oder ziehe ein PDF hierher
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF (max. 20 MB)
                    </p>
                  </label>
                </div>

                {pdfFile && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-red-600" />
                      <div className="flex-1">
                        <p className="font-medium">{pdfFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(pdfFile.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfFile(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ℹ️ Hinweis:</strong> Das PDF wird als Download-Link in die Mitteilung eingefügt.
                  Mitarbeiter können es anklicken, um es herunterzuladen.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploading}
            >
              Abbrechen
            </Button>
            <Button 
              type="button" 
              onClick={insertFile}
              disabled={uploading || (uploadType === 'image' ? (!imageFile && !imageUrl) : !pdfFile)}
            >
              {uploading ? 'Wird hochgeladen...' : 'Einfügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schulungsvideo einfügen</DialogTitle>
            <DialogDescription>
              Wähle ein Schulungsvideo aus dem Learning System
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Video auswählen</Label>
            <Select value={selectedVideoId} onValueChange={setSelectedVideoId}>
              <SelectTrigger>
                <SelectValue placeholder="Video auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableVideos.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableVideos.length === 0 && (
              <p className="text-sm text-gray-500">
                Keine Videos verfügbar. Erstelle zuerst Videos im Lernzentrum.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={addVideoBlock}
              disabled={!selectedVideoId || availableVideos.length === 0}
            >
              Einfügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Benefit Dialog */}
      <Dialog open={benefitDialogOpen} onOpenChange={setBenefitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benefit einfügen</DialogTitle>
            <DialogDescription>
              Wähle einen Benefit aus dem Benefits System
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Benefit auswählen</Label>
            <Select value={selectedBenefitId} onValueChange={setSelectedBenefitId}>
              <SelectTrigger>
                <SelectValue placeholder="Benefit auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableBenefits.map((benefit) => (
                  <SelectItem key={benefit.id} value={benefit.id}>
                    {benefit.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableBenefits.length === 0 && (
              <p className="text-sm text-gray-500">
                Keine Benefits verfügbar. Erstelle zuerst Benefits im Benefits-Bereich.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBenefitDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={addBenefitBlock}
              disabled={!selectedBenefitId || availableBenefits.length === 0}
            >
              Einfügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
