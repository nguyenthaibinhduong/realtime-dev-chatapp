import { useState, useRef, useEffect } from "react";
import { Send, Image, Paperclip, X, Code2, FileText, Bug, Sparkles, LucideIcon, Plus, Smile, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BARequirementForm, BARequirementData } from "./BARequirementForm";
import { TesterDebugForm, TesterDebugData } from "./TesterDebugForm";
import { Member, Channel } from "@/types/channel";
import { Message } from "@/types/message";
import { json } from "stream/consumers";
import { getChannelPermissions } from "@/utils/channelPermissions";
import { useAuth } from "@/hooks/useAuth";

// Button configuration
interface ActionButton {
  id: string;
  icon: LucideIcon;
  label: string;
  colorClass: string;
  activeColorClass: string;
  onClick?: () => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  isFileInput?: boolean;
}

const ACTION_BUTTONS: ActionButton[] = [
  {
    id: 'image',
    icon: Image,
    label: 'Ảnh',
    colorClass: 'text-green-400/70 hover:text-green-300',
    activeColorClass: 'hover:bg-green-950/50',
    isFileInput: true,
    accept: 'image/*',
    multiple: true
  },
  {
    id: 'attachment',
    icon: Paperclip,
    label: 'Tệp đính kèm',
    colorClass: 'text-amber-400/70 hover:text-amber-300',
    activeColorClass: 'hover:bg-amber-950/50',
    isFileInput: true,
    multiple: true
  },
];

const FUNCTION_BUTTONS: ActionButton[] = [
  {
    id: 'ba-requirement',
    icon: FileText,
    label: 'BA Requirement',
    colorClass: 'text-blue-400/70 hover:text-blue-300',
    activeColorClass: 'bg-blue-950 text-blue-300 ring-2 ring-blue-500',
  },
  {
    id: 'debug-report',
    icon: Bug,
    label: 'Debug Report',
    colorClass: 'text-red-400/70 hover:text-red-300',
    activeColorClass: 'bg-red-950 text-red-300 ring-2 ring-red-500',
  },
  {
    id: 'ai-assistant',
    icon: Sparkles,
    label: 'AI Assistant (Coming Soon)',
    colorClass: 'text-purple-400/40',
    activeColorClass: '',
    disabled: true
  }
];

interface MessageInputProps {
  channelId: string;
  channel?: Channel | null;
  onSend?: (
    content: string,
    files?: File[],
    meta?: { replyTo?: ReplyMessage; editTo?: EditMessage },
    type?: any,
    json_data?: any) => void | Promise<void>;
  replyMessage?: ReplyMessage;
  onCancelReply?: () => void;
  editMessage?: EditMessage;
  onCancelEdit?: () => void;
  onToggleCodeEditor?: () => void; // <-- Thay đổi thành toggle
  isCodeEditorOpen?: boolean; // <-- Thêm state để biết trạng thái
  channelMembers?: Array<Member | any>;
  channelMessages?: any[];
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
  channel,
  onSend,
  replyMessage,
  onCancelReply,
  editMessage,
  onCancelEdit,
  onToggleCodeEditor,
  isCodeEditorOpen = false,
  channelMembers = [],
  channelMessages = []
}: MessageInputProps) => {
  const { user } = useAuth();
  const permissions = getChannelPermissions(channel, user?.id);
  const [newMessage, setNewMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showBAForm, setShowBAForm] = useState(false);
  const [showTesterForm, setShowTesterForm] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  console.log("Channel in permissions:", permissions);

  // Prevent multiple forms from opening at once
  const openBAForm = () => {
    setShowTesterForm(false);
    setShowBAForm(true);
  };

  const openTesterForm = () => {
    setShowBAForm(false);
    setShowTesterForm(true);
  };

  // auto height cho textarea - compact version
  useEffect(() => {
    if (!taRef.current) return;
    const el = taRef.current;
    el.style.height = "28px";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }, [newMessage]);

  useEffect(() => {
    taRef.current?.focus();
  }, [channelId]);

  // Keyboard shortcuts for forms
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+B for BA Form
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        openBAForm();
      }
      // Ctrl+Shift+D for Debug Form
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        openTesterForm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };

    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAttachMenu]);

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

  // Handle BA Requirement submit
  const handleBASubmit = (data: BARequirementData) => {
    console.log("✅ BA Requirement submitted:", data);
    onSend?.(
      `📋 **BA Requirement: ${data.projectName}**\n\n${data.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n${data.notes ? `📝 Ghi chú: ${data.notes}` : ''}`,
      data.attachments,
      { replyTo: replyMessage },
      'ba-require',
      data
    );
    // Đóng form sau khi gửi
    setShowBAForm(false);
  };

  // Handle Tester Debug submit
  const handleTesterSubmit = (data: TesterDebugData) => {
    console.log("✅ Tester Debug Report submitted:", data);
    const projectInfo = data.projectName || `Liên quan tin nhắn #${data.relatedMessageId}`;
    onSend?.(
      `🐛 **Debug Report: ${projectInfo}**\n\n${data.content}\n\n${data.notes ? `📝 Ghi chú: ${data.notes}` : ''}${data.driveLink ? `\n🔗 Drive: ${data.driveLink}` : ''}`,
      data.attachments,
      { replyTo: replyMessage },
      'tester-report',
      data
    );
    // Đóng form sau khi gửi
    setShowTesterForm(false);
  };

  // If user is Viewer in private channel, hide the entire input
  if (!permissions.isOwner && !permissions.isPM && permissions.isViewer && channel.type === 'group-private') {
    return (
      <div className="border-t border-gray-300 dark:border-gray-700 p-4 bg-gray-100 dark:bg-zinc-900/50">
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Bạn chỉ có quyền xem tin nhắn trong kênh này.
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="border-t border-border transition-all duration-200">
        {/* Preview Section với animation */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${(replyMessage || editMessage) ? 'max-h-24 opacity-100 p-2 pb-0' : 'max-h-0 opacity-0 p-0'
          }`}>
          {/* Reply preview */}
          {replyMessage && !editMessage && (
            <div className="mb-2 rounded-md bg-blue-100 dark:bg-[#1f2937] text-gray-900 dark:text-gray-200 px-3 py-2 relative">
              <div className="flex items-start gap-2">
                <div className="w-1 rounded bg-blue-500 dark:bg-blue-500 mt-0.5" />
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
            <div className="mb-2 rounded-md bg-orange-100 dark:bg-[#374151] text-gray-900 dark:text-gray-200 px-3 py-2 relative">
              <div className="flex items-start gap-2">
                <div className="w-1 rounded bg-orange-500 dark:bg-orange-500 mt-0.5" />
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

        {/* Input Section - WhatsApp Style */}
        <div className="p-3">
          <div className="w-full flex items-end gap-2">
            {/* Plus Button with Popup Menu */}
            <div className="relative" ref={menuRef}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${showAttachMenu
                      ? "bg-[#00a884] text-white rotate-45"
                      : "bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{showAttachMenu ? "Đóng menu" : "Đính kèm"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Popup Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-300 dark:border-gray-700 p-2 min-w-[200px] animate-in slide-in-from-bottom-2 duration-200">
                  {/* File Upload Options */}
                  {!editMessage && (
                    <>
                      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                          <Image className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">Hình ảnh</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            onFiles(e.target.files);
                            setShowAttachMenu(false);
                          }}
                        />
                      </label>

                      <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                          <Paperclip className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">Tệp đính kèm</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            onFiles(e.target.files);
                            setShowAttachMenu(false);
                          }}
                        />
                      </label>

                      <div className="h-px bg-gray-300 dark:bg-gray-700 my-2" />
                    </>
                  )}

                  {/* Code Editor - Only for Dev/PM/Owner */}
                  {permissions.isDev
                    && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCodeEditorToggle();
                          setShowAttachMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                      >
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isCodeEditorOpen
                          ? "bg-[#007acc] text-white"
                          : "bg-teal-500/20 group-hover:bg-teal-500/30"
                          }`}>
                          <Code2 className={`h-4 w-4 ${isCodeEditorOpen ? "text-white" : "text-teal-500 dark:text-teal-400"}`} />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">Code Editor</span>
                      </button>
                    )}

                  {(permissions.isBA || permissions.isTester) && (
                    <div className="h-px bg-gray-700 my-2" />
                  )}

                  {/* Function Buttons */}
                  {/* BA Requirement - Only for BA/PM/Owner */}
                  {permissions.isBA && (
                    <button
                      type="button"
                      onClick={() => {
                        openBAForm();
                        setShowAttachMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${showBAForm
                        ? "bg-blue-500 text-white"
                        : "bg-blue-500/20 group-hover:bg-blue-500/30"
                        }`}>
                        <FileText className={`h-4 w-4 ${showBAForm ? "text-white" : "text-blue-500 dark:text-blue-400"}`} />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">BA Requirement</span>
                    </button>
                  )}

                  {/* Debug Report - Only for Tester/PM/Owner */}
                  {permissions.isTester && (
                    <button
                      type="button"
                      onClick={() => {
                        openTesterForm();
                        setShowAttachMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${showTesterForm
                        ? "bg-red-500 text-white"
                        : "bg-red-500/20 group-hover:bg-red-500/30"
                        }`}>
                        <Bug className={`h-4 w-4 ${showTesterForm ? "text-white" : "text-red-500 dark:text-red-400"}`} />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">Debug Report</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed opacity-40"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20">
                      <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <span className="text-sm text-gray-900 dark:text-gray-200 font-medium">AI Assistant</span>
                  </button>
                </div>
              )}
            </div>

            {/* Input Field - WhatsApp Style */}
            <div className="relative flex-1">
              <div className="rounded-full bg-gray-200 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-700/50 px-4 py-2 shadow-lg flex items-center gap-2">
                <button
                  type="button"
                  className="flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <Smile className="h-5 w-5" />
                </button>

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
                      : "Nhập tin nhắn"
                  }
                  className="w-full resize-none bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none"
                  style={{ minHeight: 24, maxHeight: 100 }}
                />
              </div>
            </div>

            {/* Send/Mic Button - WhatsApp Style */}
            {canSend ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] hover:bg-[#00a884]/90 text-white transition-all disabled:opacity-50 shadow-lg"
                    aria-label="Gửi"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Gửi (Enter)</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-800 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"
                    aria-label="Ghi âm"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Ghi âm tin nhắn</p>
                </TooltipContent>
              </Tooltip>
            )}
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
                    <div className="h-16 w-16 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400 flex items-center justify-center p-1 text-center">
                      {files[idx].name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute -right-1 -top-1 rounded-full bg-red-500 hover:bg-red-600 p-1 shadow-lg"
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

        {/* BA Requirement Form Drawer */}
        <BARequirementForm
          open={showBAForm}
          onOpenChange={setShowBAForm}
          channelMembers={channelMembers}
          channelMessages={channelMessages}
          onSubmit={handleBASubmit}
        />

        {/* Tester Debug Form Drawer */}
        <TesterDebugForm
          open={showTesterForm}
          onOpenChange={setShowTesterForm}
          channelMembers={channelMembers}
          channelMessages={channelMessages}
          onSubmit={handleTesterSubmit}
        />
      </div>
    </TooltipProvider>
  );
};
