/**
 * Rich Text Editor für E-Mail Templates
 * Basiert auf TipTap (Headless Editor)
 * Unterstützt: Bold, Italic, Underline, Lists, Links, Variablen-Insertion
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Underline as UnderlineIcon } from '../../components/icons/BrowoKoIcons';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import './RichTextEditor.css';

interface Variable {
  key: string;
  label: string;
  example: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  variables?: Variable[];
}

export default function RichTextEditor({ value, onChange, variables = [] }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder: 'Schreibe deine E-Mail-Nachricht hier...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const insertVariable = (variableKey: string) => {
    const variableText = `{{ ${variableKey} }}`;
    editor.chain().focus().insertContent(variableText).run();
  };

  const setLink = () => {
    const url = window.prompt('URL eingeben:', 'https://');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200' : ''}
          type="button"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200' : ''}
          type="button"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-gray-200' : ''}
          type="button"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
          type="button"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <Button
          variant="ghost"
          size="sm"
          onClick={setLink}
          className={editor.isActive('link') ? 'bg-gray-200' : ''}
          type="button"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        {editor.isActive('link') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={removeLink}
            type="button"
          >
            Link entfernen
          </Button>
        )}

        {variables.length > 0 && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600 px-2">Variablen:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    insertVariable(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
              >
                <option value="">Einfügen...</option>
                {variables.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character Count */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 text-right">
        {editor.storage.characterCount?.characters() || 0} Zeichen
      </div>
    </div>
  );
}
