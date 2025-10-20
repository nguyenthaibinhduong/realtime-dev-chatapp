import { useState, useRef, useEffect } from "react";
import { Send, Image, Paperclip, X, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageInputProps {
  channelId: string;
  onSend?: (content: string, files?: File[], meta?: { replyTo?: ReplyMessage; editTo?: EditMessage }) => void | Promise<void>;
  replyMessage?: ReplyMessage;
  onCancelReply?: () => void;
  editMessage?: EditMessage;
  onCancelEdit?: () => void;
  onToggleCodeEditor?: () => void; // <-- Thay đổi thành toggle
  isCodeEditorOpen?: boolean; // <-- Thêm state để biết trạng thái
}

export type ReplyMessage = {
  id: string;
  sender: string;
  text?: string;
};

export type EditMessage = {
  id: string;
  sender: string;
  text?: string;
};

export const MessageInput = ({
  channelId,
  onSend,
  replyMessage,
  onCancelReply,
  editMessage,
  onCancelEdit,
  onToggleCodeEditor,
  isCodeEditorOpen = false
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // auto height cho textarea
  useEffect(() => {
    if (!taRef.current) return;
    const el = taRef.current;
    el.style.height = "32px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [newMessage]);

  useEffect(() => {
    taRef.current?.focus();
  }, [channelId]);

  // Load edit message content when editMessage changes
  useEffect(() => {
    if (editMessage?.text) {
      setNewMessage(editMessage.text);
      setTimeout(() => {
        if (taRef.current) {
          taRef.current.focus();
          taRef.current.setSelectionRange(editMessage.text.length, editMessage.text.length);
        }
      }, 100);
    }
  }, [editMessage]);

  const onFiles = (list: FileList | null) => {
    const selected = Array.from(list || []);
    if (selected.length === 0) return;
    const next = [...files, ...selected];
    setFiles(next);
    setPreviews((p) => [...p, ...selected.map((f) => URL.createObjectURL(f))]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    try {
      const items = e.clipboardData?.items;
      if (!items) return;

      const filesFromClipboard: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) filesFromClipboard.push(file);
        }
      }

      if (filesFromClipboard.length === 0) return;
      e.preventDefault();

      const dt = new DataTransfer();
      filesFromClipboard.forEach((f) => dt.items.add(f));
      onFiles(dt.files);
    } catch (err) {
      console.warn("Paste handling failed:", err);
    }
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((f) => f.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const canSend = newMessage.trim().length > 0 || (files.length > 0 && !editMessage);

  const handleSend = async () => {
    if (!canSend || isSending) return;

    try {
      setIsSending(true);
      const res = onSend?.(newMessage.trim(), files, {
        replyTo: replyMessage,
        editTo: editMessage
      });
      if (res && typeof (res as any).then === "function") {
        await res;
      }

      // Clear inputs only after successful send
      setNewMessage("");
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      console.error("Send failed:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle code editor toggle
  const handleCodeEditorToggle = () => {
    onToggleCodeEditor?.();
  };

  return (
    <div className="border-t border-border transition-all duration-200">
      {/* Preview Section với animation */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${(replyMessage || editMessage) ? 'max-h-24 opacity-100 p-2 pb-0' : 'max-h-0 opacity-0 p-0'
        }`}>
        {/* Reply preview */}
        {replyMessage && !editMessage && (
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
                className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                onClick={onCancelReply}
                title="Hủy trả lời"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Edit preview */}
        {editMessage && !replyMessage && (
          <div className="mb-2 rounded-md bg-[#374151] text-gray-200 px-3 py-2 relative">
            <div className="flex items-start gap-2">
              <div className="w-1 rounded bg-orange-500 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm">
                  <span className="opacity-80">Chỉnh sửa tin nhắn của </span>
                  <span className="font-semibold">{editMessage.sender}</span>
                </div>
                {editMessage.text ? (
                  <div className="text-xs opacity-80 line-clamp-1">{editMessage.text}</div>
                ) : null}
              </div>
              <button
                type="button"
                className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                onClick={onCancelEdit}
                title="Hủy chỉnh sửa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-2">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1 py-2">
            {!editMessage && (
              <>
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
              </>
            )}

            <button
              type="button"
              onClick={handleCodeEditorToggle}
              title={isCodeEditorOpen ? "Đóng trình soạn thảo code" : "Mở trình soạn thảo code"}
              className={`flex h-7 w-7 items-center justify-center rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${isCodeEditorOpen
                  ? "bg-[#007acc] text-white shadow-md"
                  : "hover:bg-primary/80 text-muted-foreground hover:text-white"
                }`}
            >
              <Code2 className="h-4 w-4 transition-colors" />
            </button>
          </div>

          {/* Khung chat */}
          <div className="relative flex-1">
            <div className="rounded border border-border bg-[hsl(var(--chat-input))] px-2 pt-3 shadow-sm flex items-center">
              <textarea
                ref={taRef}
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder={
                  editMessage
                    ? "Chỉnh sửa tin nhắn..."
                    : `Nhắn tin đến #${channelId}...`
                }
                className="w-full resize-none bg-transparent pr-10 text-sm text-white placeholder:text-muted-foreground focus:outline-none"
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
            </div>
          </div>
        </div>

        {/* Preview file */}
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
      </div>
    </div>
  );
};
