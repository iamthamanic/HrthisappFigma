/**
 * BrowoKo Rich Text Editor
 * Version: 4.12.30
 * 
 * Production-Ready WYSIWYG Editor with:
 * - Bold, Italic, Underline, Strike
 * - Headings (H1, H2, H3)
 * - Lists (Bullet, Numbered)
 * - Text Color & Background Color (with Hexcode Input!)
 * - Font Size Selector + Custom Size Input (PT/PX)!
 * - Links (FIXED - Selection gespeichert!)
 * - Image Upload & Insert (FIXED - Bucket Path!)
 * - Code blocks
 * - Text Alignment
 * - Undo/Redo
 * 
 * FIXES v4.12.30:
 * - ✅ Link einfügen FIXED: Selection wird gespeichert und wiederhergestellt
 * - ✅ Bild Upload FIXED: Bucket Path korrigiert (war doppelt)
 * - ✅ Hexcode Eingabe für Textfarbe und Hintergrundfarbe
 * - ✅ Custom Font Size Input (eigene PT-Größe eingeben)
 * - ✅ Font Size Preview kleiner gemacht (max 24px)
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Code,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Highlighter,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { cn } from './ui/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogPortal,
  DialogOverlay 
} from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { supabase } from '../utils/supabase/client';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
}

export function BrowoKo_RichTextEditor({
  value,
  onChange,
  placeholder = 'Beginne mit dem Schreiben...',
  className
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const savedSelectionRef = useRef<Range | null>(null);
  
  // Color Picker States
  const [textColorPickerOpen, setTextColorPickerOpen] = useState(false);
  const [bgColorPickerOpen, setBgColorPickerOpen] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customBgColor, setCustomBgColor] = useState('#ffff00');
  const [textColorHex, setTextColorHex] = useState('');
  const [bgColorHex, setBgColorHex] = useState('');

  // Font Size States
  const [fontSizePickerOpen, setFontSizePickerOpen] = useState(false);
  const [customFontSize, setCustomFontSize] = useState('');

  // Image Dialog State
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Link Dialog State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Predefined color palettes
  const textColors = [
    { name: 'Schwarz', value: '#000000' },
    { name: 'Grau', value: '#6b7280' },
    { name: 'Rot', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Gelb', value: '#eab308' },
    { name: 'Grün', value: '#22c55e' },
    { name: 'Blau', value: '#3b82f6' },
    { name: 'Lila', value: '#a855f7' },
  ];

  const bgColors = [
    { name: 'Transparent', value: 'transparent' },
    { name: 'Gelb', value: '#fef08a' },
    { name: 'Grün', value: '#bbf7d0' },
    { name: 'Blau', value: '#bfdbfe' },
    { name: 'Rosa', value: '#fbcfe8' },
    { name: 'Lila', value: '#e9d5ff' },
    { name: 'Grau', value: '#e5e7eb' },
  ];

  const fontSizes = [
    { label: '10', value: '10px' },
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '20', value: '20px' },
    { label: '24', value: '24px' },
    { label: '28', value: '28px' },
    { label: '32', value: '32px' },
    { label: '36', value: '36px' },
    { label: '48', value: '48px' },
    { label: '72', value: '72px' },
  ];

  // Set initial content when value prop changes (for edit mode)
  useEffect(() => {
    if (editorRef.current && value && value !== editorRef.current.innerHTML) {
      // Only update if it's different to avoid cursor issues
      if (isInitialMount.current || !editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
        isInitialMount.current = false;
      }
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    const text = e.currentTarget.innerText;
    onChange(html, text);
  };

  // Focus editor before executing command
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const executeCommand = (command: string, value?: string) => {
    focusEditor();
    document.execCommand(command, false, value);
  };

  const applyFontSize = (size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (selectedText) {
      // Wrap selected text in span with font-size
      const span = document.createElement('span');
      span.style.fontSize = size;
      
      try {
        range.deleteContents();
        span.textContent = selectedText;
        range.insertNode(span);
        
        // Move cursor after the inserted span
        range.setStartAfter(span);
        range.setEndAfter(span);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e) {
        console.error('Error applying font size:', e);
      }
    }
    
    // Trigger onChange
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      onChange(html, text);
    }
    
    setFontSizePickerOpen(false);
  };

  const applyCustomFontSize = () => {
    if (!customFontSize.trim()) {
      toast.error('Bitte gib eine Schriftgröße ein');
      return;
    }
    
    // Convert PT to PX if needed (1pt = 1.333px)
    let sizeValue = customFontSize.trim();
    if (sizeValue.toLowerCase().endsWith('pt')) {
      const ptValue = parseFloat(sizeValue);
      sizeValue = `${Math.round(ptValue * 1.333)}px`;
    } else if (!sizeValue.endsWith('px')) {
      sizeValue = `${sizeValue}px`;
    }
    
    applyFontSize(sizeValue);
    setCustomFontSize('');
  };

  const insertLink = () => {
    // Save current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      const selectedText = selection.toString() || '';
      setLinkText(selectedText);
    }
    setLinkUrl('');
    setLinkDialogOpen(true);
  };

  const handleLinkInsert = () => {
    if (!linkUrl.trim()) {
      toast.error('Bitte gib eine URL ein');
      return;
    }
    
    focusEditor();
    
    // Restore saved selection
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRef.current);
      }
    }
    
    // If there's link text specified and no selection, insert text with link
    const currentSelection = window.getSelection()?.toString() || '';
    if (linkText.trim() && !currentSelection) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>&nbsp;`;
      document.execCommand('insertHTML', false, linkHtml);
    } else {
      // Just apply link to selection
      executeCommand('createLink', linkUrl);
    }
    
    // Trigger onChange
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      onChange(html, text);
    }
    
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
    savedSelectionRef.current = null;
  };

  const applyTextColor = (color: string) => {
    executeCommand('foreColor', color);
    setTextColorPickerOpen(false);
  };

  const applyTextColorHex = () => {
    const hex = textColorHex.trim();
    if (!hex) {
      toast.error('Bitte gib einen Hexcode ein');
      return;
    }
    
    // Validate hex code
    if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
      toast.error('Ungültiger Hexcode (z.B. #FF0000)');
      return;
    }
    
    const fullHex = hex.startsWith('#') ? hex : `#${hex}`;
    applyTextColor(fullHex);
    setTextColorHex('');
  };

  const applyBgColor = (color: string) => {
    executeCommand('backColor', color);
    setBgColorPickerOpen(false);
  };

  const applyBgColorHex = () => {
    const hex = bgColorHex.trim();
    if (!hex) {
      toast.error('Bitte gib einen Hexcode ein');
      return;
    }
    
    // Validate hex code
    if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
      toast.error('Ungültiger Hexcode (z.B. #FFFF00)');
      return;
    }
    
    const fullHex = hex.startsWith('#') ? hex : `#${hex}`;
    applyBgColor(fullHex);
    setBgColorHex('');
  };

  // Image Upload to Supabase Storage
  const handleImageUpload = async () => {
    if (!imageFile) {
      toast.error('Bitte wähle eine Bilddatei aus');
      return;
    }

    // FILE VALIDATION
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(imageFile.type)) {
      toast.error('Nur JPG, PNG, GIF und WebP Dateien sind erlaubt');
      return;
    }

    if (imageFile.size > maxSize) {
      toast.error('Datei ist zu groß (max. 5MB)');
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
      const fileName = `wiki-image-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage (wiki-images bucket MUST exist)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wiki-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // User-friendly error messages
        if (uploadError.message.includes('Bucket not found')) {
          toast.error('Storage Bucket fehlt! Bitte führe Migration 072 aus.');
        } else if (uploadError.message.includes('exceeds')) {
          toast.error('Datei ist zu groß');
        } else {
          toast.error(`Upload fehlgeschlagen: ${uploadError.message}`);
        }
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wiki-images')
        .getPublicUrl(filePath);

      // Insert image into editor
      insertImageToEditor(publicUrl);
      
      toast.success('Bild erfolgreich eingefügt');
      setImageDialogOpen(false);
      setImageFile(null);
      setImageUrl('');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlInsert = () => {
    if (!imageUrl.trim()) {
      toast.error('Bitte gib eine Bild-URL ein');
      return;
    }
    insertImageToEditor(imageUrl);
    setImageDialogOpen(false);
    setImageUrl('');
  };

  const insertImageToEditor = (url: string) => {
    focusEditor();
    // Insert image with max-width for responsive design
    const imgHtml = `<img src="${url}" alt="Bild" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;
    document.execCommand('insertHTML', false, imgHtml);
    
    // Trigger onChange
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      onChange(html, text);
    }
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    value, 
    onClick,
    title,
    active = false
  }: { 
    icon: any; 
    command?: string; 
    value?: string;
    onClick?: () => void;
    title: string;
    active?: boolean;
  }) => (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        if (onClick) {
          onClick();
        } else if (command) {
          executeCommand(command, value);
        }
      }}
      title={title}
      className="h-8 w-8 p-0"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-white', className)}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton icon={Bold} command="bold" title="Fett (Ctrl+B)" />
          <ToolbarButton icon={Italic} command="italic" title="Kursiv (Ctrl+I)" />
          <ToolbarButton icon={Underline} command="underline" title="Unterstrichen (Ctrl+U)" />
          <ToolbarButton icon={Strikethrough} command="strikeThrough" title="Durchgestrichen" />
        </div>

        {/* Font Size */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <Popover open={fontSizePickerOpen} onOpenChange={setFontSizePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                title="Schriftgröße"
              >
                <Type className="h-4 w-4 mr-1" />
                <span className="text-xs">Größe</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 z-[220]">
              <div className="space-y-2">
                <div className="max-h-[240px] overflow-y-auto border rounded-md p-1 bg-gray-50">
                  <div className="space-y-1">
                    {fontSizes.map((size) => (
                      <Button
                        key={size.value}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start font-normal hover:bg-gray-100 text-left bg-white"
                        style={{ fontSize: Math.min(parseFloat(size.value), 24) + 'px' }}
                        onClick={() => applyFontSize(size.value)}
                      >
                        {size.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <Label className="text-xs mb-2 block">Eigene Größe (PT/PX)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="z.B. 16px oder 12pt"
                      value={customFontSize}
                      onChange={(e) => setCustomFontSize(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyCustomFontSize();
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyCustomFontSize}
                      disabled={!customFontSize.trim()}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton 
            icon={Heading1} 
            command="formatBlock" 
            value="<h1>" 
            title="Überschrift 1" 
          />
          <ToolbarButton 
            icon={Heading2} 
            command="formatBlock" 
            value="<h2>" 
            title="Überschrift 2" 
          />
          <ToolbarButton 
            icon={Heading3} 
            command="formatBlock" 
            value="<h3>" 
            title="Überschrift 3" 
          />
        </div>

        {/* Colors */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          {/* Text Color */}
          <Popover open={textColorPickerOpen} onOpenChange={setTextColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Textfarbe"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 z-[220]">
              <div className="space-y-3">
                <Label>Textfarbe</Label>
                <div className="grid grid-cols-4 gap-2">
                  {textColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="h-8 rounded border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: color.value }}
                      onClick={() => applyTextColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <Label className="text-xs mb-1 block">Color Picker</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customTextColor}
                      onChange={(e) => setCustomTextColor(e.target.value)}
                      className="h-8 w-16 p-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => applyTextColor(customTextColor)}
                    >
                      Anwenden
                    </Button>
                  </div>
                  
                  <Label className="text-xs mb-1 block">Oder Hexcode</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="#FF0000"
                      value={textColorHex}
                      onChange={(e) => setTextColorHex(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyTextColorHex();
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyTextColorHex}
                      disabled={!textColorHex.trim()}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Color */}
          <Popover open={bgColorPickerOpen} onOpenChange={setBgColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Hintergrundfarbe"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 z-[220]">
              <div className="space-y-3">
                <Label>Hintergrundfarbe</Label>
                <div className="grid grid-cols-4 gap-2">
                  {bgColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="h-8 rounded border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      style={{ 
                        backgroundColor: color.value === 'transparent' ? '#ffffff' : color.value,
                        backgroundImage: color.value === 'transparent' 
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                          : 'none',
                        backgroundSize: color.value === 'transparent' ? '8px 8px' : 'auto',
                        backgroundPosition: color.value === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto'
                      }}
                      onClick={() => applyBgColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <Label className="text-xs mb-1 block">Color Picker</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="h-8 w-16 p-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => applyBgColor(customBgColor)}
                    >
                      Anwenden
                    </Button>
                  </div>
                  
                  <Label className="text-xs mb-1 block">Oder Hexcode</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="#FFFF00"
                      value={bgColorHex}
                      onChange={(e) => setBgColorHex(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyBgColorHex();
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyBgColorHex}
                      disabled={!bgColorHex.trim()}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton 
            icon={List} 
            command="insertUnorderedList" 
            title="Aufzählungsliste" 
          />
          <ToolbarButton 
            icon={ListOrdered} 
            command="insertOrderedList" 
            title="Nummerierte Liste" 
          />
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton 
            icon={AlignLeft} 
            command="justifyLeft" 
            title="Linksbündig" 
          />
          <ToolbarButton 
            icon={AlignCenter} 
            command="justifyCenter" 
            title="Zentriert" 
          />
          <ToolbarButton 
            icon={AlignRight} 
            command="justifyRight" 
            title="Rechtsbündig" 
          />
        </div>

        {/* Link, Image & Code */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton 
            icon={LinkIcon} 
            onClick={insertLink}
            title="Link einfügen (Ctrl+K)" 
          />
          <ToolbarButton 
            icon={ImageIcon} 
            onClick={() => setImageDialogOpen(true)}
            title="Bild einfügen" 
          />
          <ToolbarButton 
            icon={Code} 
            command="formatBlock" 
            value="<pre>" 
            title="Code-Block" 
          />
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1">
          <ToolbarButton icon={Undo} command="undo" title="Rückgängig (Ctrl+Z)" />
          <ToolbarButton icon={Redo} command="redo" title="Wiederholen (Ctrl+Y)" />
        </div>
      </div>

      {/* Editor Content - NO dangerouslySetInnerHTML here! */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className={cn(
          'min-h-[300px] max-h-[600px] overflow-y-auto p-4 focus:outline-none',
          'prose prose-sm max-w-none',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2',
          '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1',
          '[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2',
          '[&_a]:text-blue-600 [&_a]:underline [&_a]:cursor-pointer',
          '[&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm',
          '[&_p]:my-2',
          '[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400'
        )}
        data-placeholder={placeholder}
      />

      {/* Character Count */}
      <div className="border-t bg-gray-50 px-4 py-2 text-sm text-gray-500 text-right">
        {editorRef.current?.innerText.length || 0} Zeichen
      </div>

      {/* Image Insert Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="z-[240]" />
          <DialogContent className="sm:max-w-md z-[250]">
            <DialogHeader>
              <DialogTitle>Bild einfügen</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Upload Option */}
              <div className="space-y-2">
                <Label>Bild hochladen</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={!imageFile || uploadingImage}
                    size="sm"
                  >
                    {uploadingImage ? (
                      <>Lädt...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Unterstützt: JPG, PNG, GIF, WebP (max. 5MB)
                </p>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Oder</span>
                </div>
              </div>

              {/* URL Option */}
              <div className="space-y-2">
                <Label>Bild-URL eingeben</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/bild.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleImageUrlInsert}
                    disabled={!imageUrl.trim()}
                    size="sm"
                  >
                    Einfügen
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setImageDialogOpen(false);
                  setImageFile(null);
                  setImageUrl('');
                }}
              >
                Abbrechen
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Link Insert Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="z-[240]" />
          <DialogContent className="sm:max-w-md z-[250]">
            <DialogHeader>
              <DialogTitle>Link einfügen</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>URL *</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLinkInsert();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Link-Text (optional)</Label>
                <Input
                  type="text"
                  placeholder="z.B. Hier klicken"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLinkInsert();
                    }
                  }}
                />
                <p className="text-xs text-gray-500">
                  Wenn leer, wird der markierte Text verwendet
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLinkDialogOpen(false);
                  setLinkUrl('');
                  setLinkText('');
                  savedSelectionRef.current = null;
                }}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                onClick={handleLinkInsert}
                disabled={!linkUrl.trim()}
              >
                Link einfügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
