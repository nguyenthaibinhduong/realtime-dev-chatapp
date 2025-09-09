// src/monaco-workers.ts
// Khai báo workers cho Monaco dùng cơ chế ?worker của Vite
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";

declare global {
  interface Window {
    MonacoEnvironment?: any;
  }
}

self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === "typescript" || label === "javascript") return new tsWorker();
    if (label === "json") return new jsonWorker();
    if (label === "html") return new htmlWorker();
    if (label === "css" || label === "scss" || label === "less") return new cssWorker();
    return new editorWorker();
  },
} as any;
