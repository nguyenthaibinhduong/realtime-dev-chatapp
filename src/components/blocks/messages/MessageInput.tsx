import { useState, useRef, useEffect } from "react";
import "@/monaco-worker"; // khởi tạo worker
import MonacoEditor from "@monaco-editor/react";
import { Send, Image, Paperclip, X, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  channelId: string;
  // onSend may be async (returns Promise) so the input can await uploads/sending
  onSend?: (content: string, files?: File[], meta?: { replyTo?: ReplyMessage }) => void | Promise<void>;
  replyMessage?: ReplyMessage; // <-- thêm
  onCancelReply?: () => void;  // <-- thêm
}

export type ReplyMessage = {
  id: string;
  sender: string;
  text?: string;
};

type Lang =
  | "javascript"
  | "typescript"
  | "json"
  | "markdown"
  | "html"
  | "css"
  | "plaintext";

export const MessageInput = ({ channelId, onSend, replyMessage, onCancelReply }: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [code, setCode] = useState("");
  const [lang, setLang] = useState<Lang>("javascript");
  const [wrap, setWrap] = useState(true);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // auto height cho textarea chế độ thường
  useEffect(() => {
    if (!taRef.current || isCodeMode) return;
    const el = taRef.current;
    el.style.height = "32px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [newMessage, isCodeMode]);

  useEffect(() => {
    if (!isCodeMode) taRef.current?.focus();
  }, [channelId, isCodeMode]);

  const onFiles = (list: FileList | null) => {
    const selected = Array.from(list || []);
    if (selected.length === 0) return;
    const next = [...files, ...selected];
    setFiles(next);
    setPreviews((p) => [...p, ...selected.map((f) => URL.createObjectURL(f))]);
  };

  // Handle paste events to allow pasting images directly into the input
  const handlePaste = (e: React.ClipboardEvent) => {
    // If in code mode (or auto code detection), do not intercept paste
    if (isAutoCode) return;

    try {
      const items = e.clipboardData?.items;
      if (!items) return;

      const filesFromClipboard: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // item.kind === 'file' typically for images
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) filesFromClipboard.push(file);
        }
      }

      if (filesFromClipboard.length === 0) return;

      // Prevent default paste so images are not inserted as data URLs into textarea
      e.preventDefault();

      // Reuse the onFiles logic by building a DataTransfer to get a FileList
      const dt = new DataTransfer();
      filesFromClipboard.forEach((f) => dt.items.add(f));
      onFiles(dt.files);
    } catch (err) {
      // swallow any clipboard errors
      console.warn("Paste handling failed:", err);
    }
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const isAutoCode = isCodeMode || newMessage.trim().startsWith("```");
  const canSend =
    (isCodeMode ? code.trim().length > 0 : newMessage.trim().length > 0) ||
    files.length > 0;

  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!canSend || isSending) return;

    let content = newMessage.trim();
    if (isAutoCode) {
      const body = (
        isCodeMode ? code : newMessage.replace(/^```[^\n]*\n?|\n?```$/g, "")
      ).trim();
      const fence = lang === "plaintext" ? "" : lang;
      content = `\`\`\`${fence}\n${body}\n\`\`\``;
    }

    try {
      setIsSending(true);
      const res = onSend?.(content, files, { replyTo: replyMessage }); // <-- truyền kèm replyTo
      if (res && typeof (res as any).then === "function") {
        await res;
      }

      // Clear inputs only after successful send
      setNewMessage("");
      setFiles([]);
      setPreviews([]);
      if (isCodeMode) setCode("");
    } catch (err) {
      console.error("Send failed:", err);
      // keep inputs so user can retry
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isAutoCode && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format bằng Prettier (JS/TS/JSON/HTML/CSS/MD)
  const canFormat = [
    "javascript",
    "typescript",
    "json",
    "html",
    "css",
    "markdown",
  ].includes(lang);
  const formatCode = async () => {
    try {
      if (!canFormat) return;
      const prettier = await import("prettier/standalone");
      const pluginBabel = await import("prettier/plugins/babel");
      const pluginEstree = await import("prettier/plugins/estree");
      const pluginTS = await import("prettier/plugins/typescript");
      const pluginHTML = await import("prettier/plugins/html");
      const pluginMD = await import("prettier/plugins/markdown");
      const pluginCSS = await import("prettier/plugins/postcss");

      const parserMap: Record<Lang, string> = {
        javascript: "babel",
        typescript: "typescript",
        json: "json",
        html: "html",
        css: "css",
        markdown: "markdown",
        plaintext: "babel",
      };

      const formatted = await prettier.format(isCodeMode ? code : newMessage, {
        parser: parserMap[lang],
        plugins: [
          pluginBabel,
          pluginEstree as any,
          pluginTS,
          pluginHTML,
          pluginMD,
          pluginCSS,
        ],
        tabWidth: 2,
        singleQuote: false,
        semi: true,
      });

      if (isCodeMode) setCode(formatted);
      else
        setNewMessage(
          "```" +
          (lang === "plaintext" ? "" : lang) +
          "\n" +
          formatted +
          "\n```"
        );
    } catch (e) {
      console.warn("Format error:", e);
    }
  };

  return (
    <div className="border-t border-border p-2">
      {/* Reply preview */}
      {replyMessage && (
        <div className="mb-2 rounded-md bg-[#1f2937] text-gray-200 px-3 py-2 relative">
          <div className="flex items-start gap-2">
            <div className="w-1 rounded bg-blue-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm">
                <span className="opacity-80">Trả lời </span>
                <span className="font-semibold">{replyMessage.sender}</span>
              </div>
              {replyMessage.text ? (
                <div className="text-xs opacity-80 line-clamp-1">{replyMessage.text}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="ml-2 opacity-70 hover:opacity-100"
              onClick={onCancelReply}
              title="Hủy trả lời"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Nhóm nút và khung chat nằm cùng hàng, icon bên trái (giữ styling) */}
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1 py-2">
          <label
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-primary/80 transition-colors"
            title="Ảnh"
          >
            <Image className="h-4 w-4 text-muted-foreground hover:text-white" />
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>

          <label
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-primary/80 transition-colors"
            title="Tệp đính kèm"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground hover:text-white" />
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              // Khi bật code mode lần đầu, chuyển nội dung hiện tại vào editor
              if (!isCodeMode && newMessage.trim())
                setCode(newMessage.replace(/^```[^\n]*\n?|\n?```$/g, ""));
              setIsCodeMode((v) => !v);
            }}
            title={isAutoCode ? "Đang ở chế độ code" : "Bật chế độ code"}
            className={`flex h-7 w-7 items-center justify-center rounded hover:bg-primary/80 transition-colors ${isAutoCode ? "bg-primary text-white" : ""
              }`}
          >
            <Code2
              className={`h-4 w-4 ${isAutoCode ? "text-white" : "text-muted-foreground"}`}
            />
          </button>
        </div>

        {/* Khung chat nhỏ lại, nằm cùng hàng với nút (giữ styling khung) */}
        <div className="relative flex-1">
          <div
            className={`rounded border border-border bg-[hsl(var(--chat-input))] px-2 shadow-sm ${isAutoCode ? "pt-2" : "pt-3"
              } flex ${isAutoCode ? "flex-col" : "items-center"}`}
          >
            {/* ======= CODE MODE: Monaco giữ nguyên phong cách khung của bạn ======= */}
            {isAutoCode ? (
              <>
                {/* Mini toolbar nhưng giữ phong cách tối giản */}
                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Lang)}
                    className="h-7 rounded border border-border bg-muted px-2 text-[12px] text-muted-foreground hover:bg-muted/80"
                    title="Ngôn ngữ"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="plaintext">Plain text</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setWrap((w) => !w)}
                    className="h-7 rounded border border-border bg-muted px-2 text-[12px] text-muted-foreground hover:bg-muted/80"
                    title="Word wrap"
                  >
                    {wrap ? "Wrap: On" : "Wrap: Off"}
                  </button>

                  <button
                    type="button"
                    onClick={formatCode}
                    disabled={!canFormat}
                    className="h-7 rounded border border-border bg-muted px-2 text-[12px] text-muted-foreground hover:bg-muted/80 disabled:opacity-60"
                    title={
                      canFormat
                        ? "Format (Prettier)"
                        : "Ngôn ngữ này chưa hỗ trợ format"
                    }
                  >
                    Format
                  </button>
                </div>

                <div className="relative">
                  <MonacoEditor
                    height={220}
                    language={
                      lang === "plaintext" ? "plaintext" : (lang as any)
                    }
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{
                      fontLigatures: true,
                      fontSize: 13,
                      lineNumbers: "on",
                      minimap: { enabled: false },
                      wordWrap: wrap ? "on" : "off",
                      tabSize: 2,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      renderLineHighlight: "all",
                    }}
                  />

                  {/* Nút Gửi giữ vị trí/size như của bạn */}
                  {canSend && (
                    <Button
                      type="button"
                      onClick={handleSend}
                      size="icon"
                      className="absolute bottom-2 right-2 h-7 w-7 rounded"
                      aria-label="Gửi"
                      title="Gửi"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              // ======= CHAT MODE: giữ nguyên textarea + styling hiện tại =======
              <>
                <textarea
                  ref={taRef}
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isAutoCode
                      ? "Soạn thảo code..."
                      : `Nhắn tin đến #${channelId}...`
                  }
                  className="w-full resize-none bg-transparent pr-10 text-sm  text-white placeholder:text-muted-foreground focus:outline-none"
                  style={{ minHeight: 32, maxHeight: 120 }}
                />
                {canSend && (
                  <Button
                    type="button"
                    onClick={handleSend}
                    size="icon"
                    className="absolute bottom-2 right-2 h-7 w-7 rounded"
                    aria-label="Gửi"
                    title="Gửi"

                    disabled={isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview file (giữ nguyên) */}
      {previews.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {previews.map((url, idx) => (
            <div key={idx} className="relative">
              {files[idx].type.startsWith("image") ? (
                <img
                  src={url}
                  alt="preview"
                  className="h-16 w-16 rounded border object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded border bg-muted text-[10px] text-muted-foreground/90 flex items-center justify-center p-1 text-center">
                  {files[idx].name}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                className="absolute -right-1 -top-1 rounded-full bg-black/60 p-1"
                aria-label="Xóa tệp"
                title="Xóa tệp"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        Tip: dùng{" "}
        <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">```</kbd> hoặc{" "}
        <Code2 className="inline h-4 w-4 align-text-bottom" /> để bật soạn thảo
        code. Nhấn{" "}
        <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">Shift</kbd> +{" "}
        <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">Enter</kbd> để
        xuống dòng.
      </p>
    </div>
  );
};
