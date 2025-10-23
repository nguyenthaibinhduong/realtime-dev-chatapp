import React, { useRef, useEffect } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { linter } from "@codemirror/lint";

interface JsonEditorPanelProps {
  paneValue: string;
  setPaneValue: (value: string) => void;
  isEditable?: boolean;
}

const customTheme = EditorView.theme({
  "&": {
    color: "white",
    backgroundColor: "#1e1e1e",
  },
  ".cm-content": {
    caretColor: "white",
    color: "white",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "white",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: "#3e4451",
    },
  ".cm-activeLine": {
    backgroundColor: "#2c313c",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e1e",
    color: "#6b7280",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "#2c313c",
  },
  ".cm-string": { color: "#98c379" },
  ".cm-number": { color: "#d19a66" },
  ".cm-bool": { color: "#56b6c2" },
  ".cm-null": { color: "#c678dd" },
  ".cm-property": { color: "#e06c75" },
});

const createExtensions = (
  isEditable: boolean,
  onChange: (value: string) => void
) => {
  return [
    basicSetup,
    keymap.of([indentWithTab]),
    json(),
    linter(jsonParseLinter()),
    oneDark,
    customTheme,
    EditorView.editable.of(isEditable),
    EditorState.tabSize.of(2),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
  ];
};

export default function JsonEditorPanel({
  paneValue,
  setPaneValue,
  isEditable = true,
}: JsonEditorPanelProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: paneValue,
      extensions: createExtensions(isEditable, setPaneValue),
    });

    viewRef.current = new EditorView({
      state,
      parent: editorRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [isEditable]);

  // Update content when paneValue changes externally
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== paneValue) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: paneValue,
        },
      });
    }
  }, [paneValue]);

  return (
    <div
      ref={editorRef}
      className="border border-zinc-700 rounded-lg overflow-hidden"
      style={{ minHeight: "200px" }}
    />
  );
}
