'use client'

/**
 * rich-text — headless tiptap rich-text editor engine.
 *
 * Owns all useEditor configuration: StarterKit, Placeholder, Link, Image, immediatelyRender, prose classes in
 * editorProps.attributes, and onUpdate → onChange. Also owns the value → setContent and editable → setEditable sync effects.
 * The consumer layer (@comwit/ui-templates) drives this editor instance through its visuals and toolbar.
 */

import * as React from 'react'
import { useEditor, type Editor as TiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

export type { TiptapEditor }

// The extensions configured here (StarterKit, Link, Image) register their commands
// (toggleBold/setLink/unsetLink/setImage/undo/redo, etc.) through @tiptap/core module
// augmentation. Value imports above disappear from published .d.ts files, so
// re-export the extension option types here to carry those command augmentations
// alongside the published @comwit/ui types. This lets the consumer template toolbar
// use editor.chain()/can() with full type safety without importing tiptap extensions directly.
export type { StarterKitOptions } from '@tiptap/starter-kit'
export type { LinkOptions } from '@tiptap/extension-link'
export type { ImageOptions } from '@tiptap/extension-image'

export function useRichTextEditor(opts: {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  /** Attributes for the contenteditable area, such as id, aria-label, and aria-labelledby. */
  attributes?: Record<string, string>
  editable?: boolean
}): TiptapEditor | null {
  const { value = '', onChange, placeholder, editable = true, attributes } = opts

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Write something…',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image,
    ],
    content: value,
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-40 px-3 py-2',
        role: 'textbox',
        'aria-multiline': 'true',
        ...attributes,
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  React.useEffect(() => {
    if (!editor) return
    if (value === editor.getHTML()) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  React.useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  return editor
}
