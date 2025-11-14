"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import Placeholder from "@tiptap/extension-placeholder";
import suggestion from "@/app/(main)/components/suggestion";
import { useImperativeHandle, forwardRef } from "react";

interface TipTapEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  className?: string;
}

export interface TipTapEditorRef {
  editor: Editor | null;
  getHTML: () => string;
  getText: () => string;
  focus: () => void;
  isEmpty: () => boolean;
}

export const TipTapEditorWrapper = forwardRef<TipTapEditorRef, TipTapEditorWrapperProps>(
  ({ value, onChange, onSend, placeholder = "Type your message here...", className }, ref) => {
    const editor = useEditor(
      {
        extensions: [
          Document,
          Paragraph,
          Text,
          HardBreak.configure({
            keepMarks: false,
          }),
          Mention.configure({
            HTMLAttributes: {
              class: "mention",
            },
            suggestion,
          }),
          Placeholder.configure({
            placeholder,
          }),
        ],
        onUpdate: ({ editor }) => {
          onChange(editor.getHTML());
        },
        editorProps: {
          handleKeyDown: (view, event) => {
            if (event.key === "Enter") {
              if (event.shiftKey) {
                // Force hard break for Shift+Enter
                view.dispatch(
                  view.state.tr
                    .replaceSelectionWith(
                      view.state.schema.nodes.hardBreak.create(),
                    )
                    .scrollIntoView(),
                );
                return true;
              } else {
                // Regular Enter sends the message
                event.preventDefault();
                onSend();
                return true;
              }
            }
            return false;
          },
        },
        content: value,
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      editor,
      getHTML: () => editor?.getHTML() || "",
      getText: () => editor?.getText() || "",
      focus: () => editor?.commands.focus(),
      isEmpty: () => editor?.getHTML() === "<p></p>" || !editor?.getText()?.trim(),
    }));

    return (
      <EditorContent
        editor={editor}
        className={className || "text-zinc-900 dark:text-white text-sm p-3 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none bg-transparent resize-none"}
      />
    );
  }
);

TipTapEditorWrapper.displayName = "TipTapEditorWrapper";

