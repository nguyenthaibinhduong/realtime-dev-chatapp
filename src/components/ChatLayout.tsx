import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, Search, X } from "lucide-react";

// Hooks
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useNotificationActions } from "@/hooks/useNotificationToast";
import { useIsMobile } from "@/hooks/useMobile";
import { usePreview } from "@/hooks/useAttachmentPreview";

// Components - Layouts
import MasterLayout from "./MasterLayout";
import MenubarLayout from "./MenubarLayout";
import SidebarLayout from "./SidebarLayout";

// Components - UI
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Components - Feature
import { ChannelHeader } from "./blocks/channels/ChannelHeader";
import { ChannelSearch } from "./blocks/channels/ChannelSearch";
import { ChannelSection } from "./blocks/channels/ChannelSection";
import { MessageList } from "./blocks/messages/MessageList";
import { MessageInput } from "./blocks/messages/MessageInput";
import { AttachmentViewer } from "./blocks/attachments/AttachmentViewer";
import {
  ApiTool,
  FortuneSheet,
  Tool1,
  Tool2,
  Tool3,
  ToolType,
} from "./blocks/tools";

// Services & API
import { ChatAPI } from "@/api/api";
import { chatSocketService } from "@/services/chatSocketService";
import attachmentService, { UploadResult } from "@/services/attachmentService";

// Types
import { Message } from "@/types/message";
import { Channel, Member } from "@/types/channel";
import { useChannelUpdate } from "@/hooks/useChannelUpdateListener";

export default function ChatLayout() {
  // ==================== HOOKS ====================
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { registerHandler, unregisterHandler } = useNotificationActions();
  const [searchParams, setSearchParams] = useSearchParams();
  const { previewUrl, setPreviewUrl } = usePreview();

  // ==================== STATE - UI ====================
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState<boolean>(false);
  const [showGithubDetail, setShowGithubDetail] = useState(false);
  const [githubDetailData, setGithubDetailData] = useState<any>(null);

  // ==================== STATE - DATA ====================
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  // ==================== STATE - MESSAGE ACTIONS ====================
  const [replyTo, setReplyTo] = useState<{
    id: string;
    sender: string;
    text?: string;
  } | null>(null);

  const [editTo, setEditTo] = useState<{
    id: string;
    sender: string;
    text?: string;
  } | null>(null);

  // ==================== STATE - TOOLS ====================
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [toolInitialItem, setToolInitialItem] = useState<any>(null);
  const [toolInitialData, setToolInitialData] = useState<any>(null);

  // ==================== STATE - MOBILE NAVIGATION ====================
  const [navBtnPos, setNavBtnPos] = useState({ x: 20, y: 20 });
  const navBtnRef = useRef<HTMLButtonElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // ==================== STATE - FILE UPLOAD ====================
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: { progress: number; total: number };
  }>({});

  // ==================== FUNCTIONS - CHANNEL ====================

  /**
   * Load danh sách kênh từ API
   * - Merge với channels hiện có (socket channels)
   * - Đăng ký nhận unread count
   * - Tự động chọn kênh đầu tiên nếu chưa có selectedChannelId
   */
  const loadChannels = useCallback(async () => {
    try {
      const res = await ChatAPI.fetchChannel();
      let loadedChannels: Channel[] = [];
      if (Array.isArray(res)) loadedChannels = res;
      else if (res?.data && Array.isArray(res.data)) loadedChannels = res.data;

      // Merge channels: update existing + add new
      setChannels((prevChannels) => {
        const mergedChannels = [...prevChannels];

        loadedChannels.forEach((apiChannel: any) => {
          const existingIndex = mergedChannels.findIndex(
            (c: any) =>
              String(c.id) === String(apiChannel.id) ||
              (c.fakeID && String(c.fakeID) === String(apiChannel.fakeID))
          );

          if (existingIndex !== -1) {
            mergedChannels[existingIndex] = {
              ...mergedChannels[existingIndex],
              ...apiChannel,
            };
          } else {
            mergedChannels.push(apiChannel);
          }
        });

        return mergedChannels;
      });

      // Đăng ký unread và chọn kênh
      setChannels((currentChannels) => {
        const channelIds = currentChannels.map((c) => String(c.id));
        if (channelIds.length > 0) {
          chatSocketService.registerUnread(channelIds);
        }

        // Chọn kênh đã lưu hoặc kênh đầu tiên
        const savedChannelId = localStorage.getItem("selectedChannelId");
        const found = savedChannelId
          ? currentChannels.find((c) => String(c.id) === savedChannelId)
          : null;

        const channelToSelect = found || currentChannels[0] || null;

        // Lưu vào localStorage nếu chọn kênh đầu tiên
        if (channelToSelect && !savedChannelId) {
          localStorage.setItem("selectedChannelId", String(channelToSelect.id));
        }

        setSelectedChannel(channelToSelect);

        return currentChannels;
      });

      // Lấy unread count từ API
      const unreadRes = await ChatAPI.fetchUnread();
      if (unreadRes?.data && typeof unreadRes.data === "object") {
        setUnreadMap(unreadRes.data);
      }
    } catch (error: any) {
      toast({
        title: "Lỗi tải kênh",
        description:
          error?.msg || error?.message || "Không thể tải danh sách kênh",
        variant: "destructive",
      });
    }
  }, [toast]);

  /**
   * Chọn kênh chat
   * - Cập nhật selectedChannel state
   * - Lưu vào localStorage
   * - Cập nhật URL params
   * - Clear messages nếu không có kênh
   */
  const handleSelectChannel = useCallback((channel: Channel | null) => {
    setSelectedChannel(channel);

    if (channel) {
      localStorage.setItem("selectedChannelId", String(channel.id));

      // Cập nhật URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set("channel", String(channel.id));
      newParams.delete("message");
      setSearchParams(newParams);
    } else {
      localStorage.removeItem("selectedChannelId");

      // Clear dữ liệu
      setMessages([]);
      setMembers([]);

      // Clear URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("channel");
      newParams.delete("message");
      setSearchParams(newParams);
    }
  }, [searchParams, setSearchParams]);

  /**
   * Chọn kênh từ search modal
   */
  const handleSelectChannelFromSearch = useCallback((channel: any) => {
    handleSelectChannel(channel);
    setOpenSearchModal(false);
  }, [handleSelectChannel]);

  /**
   * Tham gia kênh từ search
   */
  const handleJoinChannelFromSearch = useCallback(async (id: string, type: string) => {
    try {
      const res = await ChatAPI.joinChannel({ id, type });
      if (res && res.status && [200, 201].includes(res.status) && res.data) {
        handleSelectChannelFromSearch(res.data.channel);
        localStorage.setItem("selectedChannelId", res.data.channel.id);

        await loadChannels();
        setOpenSearchModal(false);
        toast({
          title: "Tham gia kênh thành công",
          description: `${res.data.msg}`,
        });
      } else {
        toast({
          title: "Lỗi tham gia kênh",
          description: res?.data?.msg || "Không thể tham gia kênh",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi tham gia kênh",
        description: error?.msg || error?.message || "Không thể tham gia kênh",
        variant: "destructive",
      });
    }
  }, [handleSelectChannelFromSearch, loadChannels, toast]);

  /**
   * Chọn kênh trên mobile (tự động đóng sidebar)
   */
  const handleSelectChannelMobile = useCallback((channel: Channel | null) => {
    handleSelectChannel(channel);
    if (isMobile && showSidebar) {
      setShowSidebar(false);
    }
  }, [handleSelectChannel, isMobile, showSidebar]);

  // ==================== FUNCTIONS - MESSAGE ====================

  /**
   * Load tin nhắn của kênh
   */
  const loadMessages = useCallback(async (channelId: string) => {

    try {
      const res = await ChatAPI.fetchMessage(channelId);
      
      if (res?.data) {
        const messagesData = Array.isArray(res.data.items)
          ? res.data.items
          : [];
        const membersData = Array.isArray(res.data.members)
          ? res.data.members
          : [];

        setMessages(messagesData);
        setMembers(membersData);
      } else {
        setMessages([]);
        setMembers([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
      setMembers([]);
    }
  }, []);

  useChannelUpdate({
  onUpdate: () => loadMessages(selectedChannel?.id),
  });

  /**
   * Load tin nhắn cũ hơn (scroll lên)
   */
  const loadOlder = useCallback(
    async (channelId: string, beforeId: string, pageSize = 50) => {
      const res = await ChatAPI.fetchMessage(channelId, pageSize, beforeId);
      return (
        res?.data ?? {
          items: [],
          hasMoreOlder: false,
          cursors: { before: null },
        }
      );
    },
    []
  );

  /**
   * Thêm tin nhắn cũ vào đầu danh sách (dedupe by id)
   */
  const handlePrependMessages = useCallback((newMsgs: Message[]) => {
    setMessages((prev) => {
      const exists = new Set(prev.map((m) => String(m.id)));
      const filtered = newMsgs.filter((m) => !exists.has(String(m.id)));
      return [...filtered, ...prev];
    });
  }, []);

  /**
   * Gửi tin nhắn qua socket
   * - Hỗ trợ: reply, edit, pin/unpin, delete, like
   * - Upload files với progress tracking
   * - Tạo temporary message khi đang upload
   */
  const sendMessage = useCallback(
    async (
      content: string,
      files: File[],
      meta?: {
        replyTo?: { id: string; sender: string; text?: string };
        editTo?: { id: string; sender: string; text?: string };
        messageId?: string;
        updateAction?: 'pin' | 'unpin' | 'delete' | 'like';
        likeData?: any;
      },
      type?: any,
      json_data?: any
    ) => {
      // Xử lý các action update (pin/unpin/delete/like)
      if (meta?.updateAction && meta?.messageId) {
        const action = meta.updateAction;
        const messageId = meta.messageId;

        if (action === 'pin') {
          chatSocketService.sendMessage({
            id: messageId,
            isUpdate: true,
            isPin: true,
            text: content,
            channelId: selectedChannel.id,
            type: 'message',
          });
          return;
        }

        if (action === 'unpin') {
          chatSocketService.sendMessage({
            id: messageId,
            isUpdate: true,
            isPin: false,
            text: content,
            channelId: selectedChannel.id,
            type: 'message',
          });
          return;
        }

        if (action === 'delete') {
          chatSocketService.sendMessage({
            id: messageId,
            isUpdate: true,
            channelId: selectedChannel.id,
            text: content || 'Tin nhắn đã bị xóa',
            type: 'remove',
          });
          return;
        }

        if (action === 'like' && meta.likeData) {
          chatSocketService.sendMessage({
            id: messageId,
            isUpdate: true,
            likeData: meta.likeData,
            isLiked: meta.likeData.isLiked,
            likeCount: meta.likeData.count,
            channelId: selectedChannel.id,
            type: 'message',
          });
          return;
        }
      }

      if (
        !selectedChannel?.id ||
        (!content.trim() && (!files || files.length === 0))
      )
        return;

      let attachments: UploadResult[] = [];

      // Upload files nếu có
      if (files && files.length > 0) {
        try {
          // Tạo temporary message với loading state
          const tempMessageId = `temp-${Date.now()}`;
          const tempMessage: any = {
            id: tempMessageId,
            fakeID: tempMessageId,
            text: content.trim(),
            sender: user,
            status: "uploading",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            send_at: new Date().toISOString(),
            isMine: true,
            attachments: files.map((file, index) => ({
              id: `temp-${tempMessageId}-${index}`,
              key: `temp-${tempMessageId}-${index}`,
              filename: file.name,
              fileSize: file.size,
              fileUrl: "",
              mimeType: file.type,
              uploading: true,
              progress: 0,
            })),
          };

          setMessages((prev) => [...prev, tempMessage]);

          // Upload với progress tracking
          const uploadResults = await attachmentService.uploadFile(
            files,
            (fileIndex, progress) => {
              setMessages((prev: any) =>
                prev.map((msg: any) => {
                  if (msg.id === tempMessageId && msg.attachments) {
                    const updatedAttachments = [...msg.attachments];
                    if (updatedAttachments[fileIndex]) {
                      updatedAttachments[fileIndex] = {
                        ...updatedAttachments[fileIndex],
                        progress: progress,
                      };
                    }
                    return { ...msg, attachments: updatedAttachments };
                  }
                  return msg;
                })
              );
            }
          );

          attachments = uploadResults.map((result) => ({
            filename: result.filename,
            fileUrl: result.fileUrl,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            key: result.key,
          }));

          // Remove attachments từ json_data nếu có
          if (json_data && json_data.attachments) {
            delete json_data.attachments;
          }

          // Xóa temporary message sau khi upload thành công
          setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));

          toast({
            title: "Upload thành công",
            description: `${files.length} file(s) đã được upload`,
          });
        } catch (error: any) {
          console.error("Upload failed:", error);

          const tempMessageId = `temp-${Date.now()}`;
          setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));

          toast({
            title: "Lỗi upload file",
            description: error?.message || "Không thể upload file",
            variant: "destructive",
          });
          return;
        }
      }

      // Gửi tin nhắn
      if (meta?.editTo) {
        // Chỉnh sửa tin nhắn
        chatSocketService.sendMessage({
          id: meta.editTo.id,
          channelId: selectedChannel.id,
          text: content.trim(),
          type: "message",
          isUpdate: true,
        });

        setEditTo(null);
      } else {
        // Tin nhắn mới hoặc reply
        const computedType = meta?.replyTo
          ? "reply-message"
          : attachments.length > 0
            ? "file-upload"
            : "message";

        if (
          type &&
          ["ba-require", "tester-report"].includes(type) &&
          json_data
        ) {
          chatSocketService.sendMessage({
            channelId: selectedChannel.id,
            text: content.trim(),
            type: type,
            json_data: json_data,
            ...(attachments.length > 0 && {
              presignedAttachments: attachments,
            }),
            ...(meta?.replyTo && {
              replyTo: {
                id: meta.replyTo.id,
                sender: meta.replyTo.sender,
                text: meta.replyTo.text,
              },
            }),
          });
        } else {
          chatSocketService.sendMessage({
            channelId: selectedChannel.id,
            text: content.trim(),
            type: computedType,
            channelData: selectedChannel,
            ...(attachments.length > 0 && {
              presignedAttachments: attachments,
            }),
            ...(meta?.replyTo && {
              replyTo: {
                id: meta.replyTo.id,
                sender: meta.replyTo.sender,
                text: meta.replyTo.text,
              },
            }),
          });
        }

        if (meta?.replyTo) setReplyTo(null);
      }
    },
    [selectedChannel, user, toast]
  );

  // ==================== FUNCTIONS - TOOLS ====================

  /**
   * Mở tool với dữ liệu khởi tạo
   */
  const handleOpenTool = useCallback((data: any) => {
    if (data.type === "code-editor") {
      setToolInitialData({
        code: data.code,
        language: data.language,
      });
      setSelectedTool("tool2");
    } else {
      setToolInitialItem(data);
      setSelectedTool("apiTool");
    }
  }, []);

  /**
   * Render tool component theo loại được chọn
   */
  const renderToolComponent = () => {
    if (previewUrl) {
      return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Preview
            </h3>
            <button
              onClick={() => setPreviewUrl(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Đóng preview"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AttachmentViewer url={previewUrl} />
          </div>
        </div>
      );
    }

    switch (selectedTool) {
      case "tool1":
        return <Tool1 />;

      case "tool2":
        return (
          <Tool2
            onSendCode={(code: string, language: string) => {
              const username =
                user?.username ||
                user?.name ||
                user?.email?.split("@")[0] ||
                "Unknown";

              chatSocketService.sendMessage({
                channelId: selectedChannel?.id,
                text: `${username} đã gửi một đoạn code`,
                type: "code-card",
                channelData: selectedChannel,
                json_data: {
                  codeData: {
                    code: code,
                    language: language,
                    author: username,
                  },
                },
              });
            }}
            onClose={() => {
              setSelectedTool(null);
              setToolInitialData(null);
            }}
            initialCode={toolInitialData?.code}
            initialLanguage={toolInitialData?.language}
          />
        );

      case "tool3":
        return <Tool3 />;

      case "apiTool":
        return (
          <ApiTool
            initialHistoryItem={toolInitialItem}
            onClose={() => {
              setSelectedTool(null);
              setToolInitialItem(null);
            }}
          />
        );

      case "sheet":
        return <FortuneSheet />;

      default:
        return null;
    }
  };

  // ==================== FUNCTIONS - MOBILE NAVIGATION ====================

  /**
   * Xử lý kéo thả nút điều hướng trên mobile
   */
  const handleNavBtnMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = true;
    offsetRef.current = {
      x: e.clientX - navBtnPos.x,
      y: e.clientY - navBtnPos.y,
    };
    document.addEventListener("mousemove", handleNavBtnMouseMove);
    document.addEventListener("mouseup", handleNavBtnMouseUp);
  };

  const handleNavBtnMouseMove = (e: MouseEvent) => {
    if (!draggingRef.current) return;
    setNavBtnPos({
      x: Math.max(
        0,
        Math.min(window.innerWidth - 56, e.clientX - offsetRef.current.x)
      ),
      y: Math.max(
        0,
        Math.min(window.innerHeight - 56, e.clientY - offsetRef.current.y)
      ),
    });
  };

  const handleNavBtnMouseUp = () => {
    draggingRef.current = false;
    document.removeEventListener("mousemove", handleNavBtnMouseMove);
    document.removeEventListener("mouseup", handleNavBtnMouseUp);
  };

  const handleNavBtnTouchStart = (e: React.TouchEvent) => {
    draggingRef.current = true;
    const touch = e.touches[0];
    offsetRef.current = {
      x: touch.clientX - navBtnPos.x,
      y: touch.clientY - navBtnPos.y,
    };
    document.addEventListener("touchmove", handleNavBtnTouchMove);
    document.addEventListener("touchend", handleNavBtnTouchEnd);
  };

  const handleNavBtnTouchMove = (e: TouchEvent) => {
    if (!draggingRef.current) return;
    const touch = e.touches[0];
    setNavBtnPos({
      x: Math.max(
        0,
        Math.min(window.innerWidth - 56, touch.clientX - offsetRef.current.x)
      ),
      y: Math.max(
        0,
        Math.min(window.innerHeight - 56, touch.clientY - offsetRef.current.y)
      ),
    });
  };

  const handleNavBtnTouchEnd = () => {
    draggingRef.current = false;
    document.removeEventListener("touchmove", handleNavBtnTouchMove);
    document.removeEventListener("touchend", handleNavBtnTouchEnd);
  };

  // ==================== FUNCTIONS - UI ====================

  /**
   * Toggle sidebar visibility
   */
  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  /**
   * Toggle channel type menu
   */
  const handleShowChannelTypeMenu = () => setShowChannelTypeMenu((v) => !v);

  // ==================== EFFECTS ====================

  /**
   * Load channels khi component mount
   */
  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  /**
   * Load messages khi chọn kênh mới
   */
  useEffect(() => {
    if (selectedChannel?.id) {
      loadMessages(String(selectedChannel.id));
    } else {
      setMessages([]);
      setMembers([]);
    }
  }, [selectedChannel, loadMessages]);

  /**
   * Reset input expansion khi đổi kênh
   */
  useEffect(() => {
    setIsInputExpanded(false);
  }, [selectedChannel?.id]);

  /**
   * Xử lý URL params khi mount
   */
  useEffect(() => {
    const channelParam = searchParams.get("channel");
    if (channelParam && channels.length > 0) {
      const targetChannel = channels.find((c) => String(c.id) === channelParam);
      if (targetChannel && targetChannel.id !== selectedChannel?.id) {
        handleSelectChannel(targetChannel);
      }
    }
  }, [searchParams, channels, selectedChannel]);

  /**
   * Socket: Join/leave channel room và lắng nghe tin nhắn
   */
  const joinChannelSocketA = useCallback(() => {
    if (!selectedChannel?.id) return () => { };


    const currentChannelId = selectedChannel.id;
    chatSocketService.connect();
    chatSocketService.joinRoom(currentChannelId);

    const messageHandler = (msg: any) => {
      // Filter tin nhắn theo channelId
      const msgChannelId = String(msg.channelId || msg.channel_id || "");
      const capturedChannelId = String(currentChannelId);

      if (msgChannelId && msgChannelId !== capturedChannelId) {
        return;
      }

      setMessages((prev: any) => {
        // Double check với localStorage
        const currentStoredChannelId = localStorage.getItem("selectedChannelId");
        if (
          currentStoredChannelId &&
          msgChannelId &&
          String(msgChannelId) !== String(currentStoredChannelId)
        ) {
          return prev;
        }

        // Xử lý tin nhắn bị xóa (type === 'remove')
        if (msg.type === "remove") {
          const idx = prev.findIndex((p: any) => String(p.id) === String(msg.id));
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              ...msg,
              sender: updated[idx].sender || msg.sender,
              type: "remove",
              text: msg.text || "Tin nhắn đã bị xóa",
            };
            return updated;
          }
          return prev;
        }

        // Xử lý tin nhắn cập nhật (isUpdate === true)
        if (msg.isUpdate) {
          const idx = prev.findIndex((p: any) => String(p.id) === String(msg.id));
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              ...msg,
              sender: updated[idx].sender || msg.sender,
              updated_at: msg.updated_at || new Date().toISOString(),
            };
            return updated;
          }
          return prev;
        }

        // Thay thế fake message bằng real message
        const idx = prev.findIndex(
          (p: any) => String(p.fakeID) === String(msg.fakeID)
        );
        if (idx !== -1 && String(prev[idx].channelId) === String(msg.channelId)) {
          const updated = [...prev];
          updated[idx] = msg;
          return updated;
        }

        // Kiểm tra trùng lặp
        const existingIdx = prev.findIndex(
          (p: any) => String(p.id) === String(msg.id) && msg.id
        );
        if (existingIdx !== -1) {
          return prev;
        }

        // Thêm tin nhắn mới
        return [...prev, msg];
      });
    };

    chatSocketService.onMessage(messageHandler);

    return () => {
      chatSocketService.leaveRoom(currentChannelId);
      chatSocketService.offMessage(messageHandler);
    };
  }, [selectedChannel]);

  useEffect(() => {
    const cleanup = joinChannelSocketA();
    return cleanup;
  }, [joinChannelSocketA]);

  /**
   * Socket: Lắng nghe channel updates (members, permissions, etc.)
   */
  useEffect(() => {
    const handleChannelUpdate = (response: any) => {

      const data = response?.data || response;
      const updatedChannel = data?.channel;
      const updatedMembers = data?.members;

      if (!updatedChannel?.id) return;

      const channelId = String(updatedChannel.id);

      // Cập nhật channels list
      setChannels((prevChannels) => {
        const idx = prevChannels.findIndex((c) => String(c.id) === channelId);
        if (idx !== -1) {
          const updated = [...prevChannels];
          updated[idx] = {
            ...updated[idx],
            ...updatedChannel,
            member_count:
              updatedMembers?.length ||
              updatedChannel.member_count ||
              updated[idx].member_count,
          };
          return updated;
        }
        return prevChannels;
      });

      // Cập nhật selected channel nếu đang xem kênh này
      if (selectedChannel && String(selectedChannel.id) === channelId) {
        setSelectedChannel((prev) => {
          if (!prev) return prev;

          const updated = { ...prev };

          if (updatedMembers && Array.isArray(updatedMembers)) {
            updated.members = updatedMembers;
            updated.member_count = updatedMembers.length;
          }

          if (updatedChannel.json_data) {
            updated.json_data = {
              ...prev.json_data,
              ...updatedChannel.json_data,
            };
          }

          return updated;
        });

        if (updatedMembers && Array.isArray(updatedMembers)) {
          setMembers(updatedMembers);
        }
      }
    };

    chatSocketService.onChannelUpdate(handleChannelUpdate);

    return () => {
      chatSocketService.offChannelUpdate(handleChannelUpdate);
    };
  }, [selectedChannel]);

  /**
   * Socket: Lắng nghe channel mới được tạo
   */
  useEffect(() => {
    const handler = (channel: any) => {
      setChannels((prev) => {
        const idx = prev.findIndex(
          (c: any) =>
            String(c.fakeID) === String(channel.fakeID) ||
            String(c.id) === String(channel.id)
        );
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = channel;
          return updated;
        }
        return [...prev, channel];
      });
    };
    chatSocketService.onChannel(handler);
    return () => chatSocketService.offChannel(handler);
  }, []);

  /**
   * Socket: Lắng nghe unread count
   */
  useEffect(() => {
    const handleUnread = (data: { channelId: string; count: number }) => {
      setUnreadMap((prev) => ({ ...prev, [data.channelId]: data.count }));
    };
    chatSocketService.onUnread(handleUnread);
    return () => chatSocketService.offUnread(handleUnread);
  }, []);

  /**
   * Socket: Lắng nghe channel bị xóa
   */
  useEffect(() => {
    const handleRemoveChannel = (data: { id: string | number }) => {
      const channelId = String(data.id);

      // Xóa khỏi danh sách
      setChannels((prevChannels) => {
        return prevChannels.filter((c) => String(c.id) !== channelId);
      });

      // Clear selection nếu đang xem kênh bị xóa
      if (selectedChannel && String(selectedChannel.id) === channelId) {
        handleSelectChannel(null);

        toast({
          title: "Kênh đã bị xóa",
          description: "Kênh bạn đang xem đã bị xóa",
          variant: "destructive",
        });
      }
    };

    chatSocketService.onRemoveChannel(handleRemoveChannel);

    return () => {
      chatSocketService.offRemoveChannel(handleRemoveChannel);
    };
  }, [selectedChannel, toast]);

  /**
   * Đăng ký notification handlers
   */
  useEffect(() => {
    // Handler: Chuyển đến kênh từ notification
    const handleNavigateToChannel = (data: any) => {
      const { channelId, channel, messageId } = data;

      let targetChannel = channels.find((c) => String(c.id) === String(channelId));
      if (!targetChannel && channel) {
        targetChannel = channel;
        setChannels((prev) => {
          const exists = prev.find((c) => String(c.id) === String(channelId));
          return exists ? prev : [...prev, channel];
        });
      }

      if (targetChannel) {
        handleSelectChannel(targetChannel);

        const newParams = new URLSearchParams(searchParams);
        newParams.set("channel", String(channelId));
        if (messageId) {
          newParams.set("message", String(messageId));
        }
        setSearchParams(newParams);

        if (messageId) {
          setTimeout(() => {
            const messageElement = document.querySelector(
              `[data-message-id="${messageId}"]`
            );
            if (messageElement) {
              messageElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 500);
        }

        toast({
          title: "Đã chuyển đến kênh",
          description: `#${targetChannel.name}`,
          duration: 2000,
        });

        if (isMobile) {
          setShowSidebar(false);
        }
      } else {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy kênh",
          variant: "destructive",
        });
      }
    };

    // Handler: Mở GitHub detail
    const handleOpenGithubDetail = (data: any) => {
      setGithubDetailData(data);
      setShowGithubDetail(true);
    };

    // Handler: System notifications
    const handleOpenSystemDetail = (data: any) => {
      toast({
        title: "System Detail",
        description: data.message,
        duration: 3000,
      });
    };

    // Handler: General notifications
    const handleOpenNotificationDetail = (data: any) => {
      toast({
        title: "Notification Detail",
        description: data.description,
        duration: 3000,
      });
    };

    registerHandler("navigateToChannel", handleNavigateToChannel);
    registerHandler("openGithubDetail", handleOpenGithubDetail);
    registerHandler("openSystemDetail", handleOpenSystemDetail);
    registerHandler("openNotificationDetail", handleOpenNotificationDetail);

    return () => {
      unregisterHandler("navigateToChannel");
      unregisterHandler("openGithubDetail");
      unregisterHandler("openSystemDetail");
      unregisterHandler("openNotificationDetail");
    };
  }, [
    channels,
    registerHandler,
    unregisterHandler,
    toast,
    isMobile,
    searchParams,
    setSearchParams,
  ]);

  /**
   * Đồng bộ sidebar với responsive mode
   */
  useEffect(() => {
    if (!isMobile) {
      setShowSidebar(true);
    }
  }, [isMobile]);

  // ==================== RENDER ====================

  // Filter messages theo channel hiện tại
  const filteredMessages = messages.filter((msg: any) => {
    const msgChannelId = String(msg.channelId || msg.channel_id || "");
    const currentChannelId = String(selectedChannel?.id || "");
    return (
      !msgChannelId ||
      !currentChannelId ||
      msgChannelId === currentChannelId
    );
  });

  return (
    <MasterLayout
      menu={
        <MenubarLayout
          onToggleSidebar={handleToggleSidebar}
          showSidebar={showSidebar}
        />
      }
      showSidebar={!isMobile && showSidebar}
      sidebar={
        !isMobile ? (
          <SidebarLayout>
            <div className="flex items-center justify-between px-3 pt-2">
              <Dialog open={openSearchModal} onOpenChange={setOpenSearchModal}>
                <DialogTrigger asChild>
                  <div
                    className="flex items-center w-full bg-gray-200 dark:bg-gray-800 rounded px-3 py-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                    title="Tìm kiếm kênh"
                    onClick={() => setOpenSearchModal(true)}
                    style={{ minHeight: 40 }}
                  >
                    <Search className="h-5 w-5 text-gray-700 dark:text-white mr-2" />
                    <span className="text-gray-700 dark:text-white opacity-80 text-sm">
                      Tìm kiếm ...
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent
                  className="w-full max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
                  style={{ height: "85vh" }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">
                      Tìm kiếm kênh, người dùng
                    </DialogTitle>
                  </DialogHeader>
                  <div className="px-3 pt-2 h-[70vh]">
                    <ChannelSearch
                      onSelectChannel={handleSelectChannelFromSearch}
                      onJoinChannel={handleJoinChannelFromSearch}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <ScrollArea className="flex-1 px-3">
              <ChannelSection
                channels={channels}
                selectedChannel={selectedChannel}
                onSelectChannel={handleSelectChannel}
                onShowChannelTypeMenu={handleShowChannelTypeMenu}
                showChannelTypeMenu={showChannelTypeMenu}
                onChannelCreated={loadChannels}
                unreadMap={unreadMap}
              />
            </ScrollArea>
          </SidebarLayout>
        ) : null
      }
      children_right={renderToolComponent()}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobile && (
        <div>
          <button
            ref={navBtnRef}
            className="fixed z-50 bg-primary text-black dark:text-white rounded-full p-2 shadow flex items-center justify-center"
            style={{
              left: navBtnPos.x,
              top: navBtnPos.y,
              width: 48,
              height: 48,
              touchAction: "none",
              transition: draggingRef.current ? "none" : "box-shadow 0.2s",
            }}
            onClick={() => setShowSidebar((v) => !v)}
            aria-label="Mở danh sách kênh"
            onMouseDown={handleNavBtnMouseDown}
            onTouchStart={handleNavBtnTouchStart}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full">
              <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
                <rect
                  x={4}
                  y={6}
                  width={16}
                  height={2}
                  rx={1}
                  fill="currentColor"
                />
                <rect
                  x={4}
                  y={11}
                  width={16}
                  height={2}
                  rx={1}
                  fill="currentColor"
                />
                <rect
                  x={4}
                  y={16}
                  width={16}
                  height={2}
                  rx={1}
                  fill="currentColor"
                />
              </svg>
            </span>
          </button>
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
              onClick={() => setShowSidebar(false)}
            >
              <div
                className="absolute top-0 left-0 h-full w-[80vw] max-w-xs bg-white dark:bg-gray-900 shadow-lg overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <SidebarLayout>
                  <div className="flex items-center justify-between px-3 pt-2">
                    <Dialog
                      open={openSearchModal}
                      onOpenChange={setOpenSearchModal}
                    >
                      <DialogTrigger asChild>
                        <div
                          className="flex items-center w-full bg-gray-200 dark:bg-gray-800 rounded px-3 py-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                          title="Tìm kiếm kênh"
                          onClick={() => setOpenSearchModal(true)}
                          style={{ minHeight: 40 }}
                        >
                          <Search className="h-5 w-5 text-gray-700 dark:text-white mr-2" />
                          <span className="text-gray-700 dark:text-white opacity-80 text-sm">
                            Tìm kiếm ...
                          </span>
                        </div>
                      </DialogTrigger>
                      <DialogContent
                        className="w-full max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
                        style={{
                          background: "#18181b",
                          color: "#fff",
                          height: "85vh",
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 dark:text-white">
                            Tìm kiếm kênh, người dùng
                          </DialogTitle>
                        </DialogHeader>
                        <div className="px-3 pt-2 h-[70vh]">
                          <ChannelSearch
                            onSelectChannel={handleSelectChannelFromSearch}
                            onJoinChannel={handleJoinChannelFromSearch}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ScrollArea className="flex-1 px-3">
                    <ChannelSection
                      channels={channels}
                      selectedChannel={selectedChannel}
                      onSelectChannel={handleSelectChannelMobile}
                      onShowChannelTypeMenu={handleShowChannelTypeMenu}
                      showChannelTypeMenu={showChannelTypeMenu}
                      onChannelCreated={loadChannels}
                      unreadMap={unreadMap}
                    />
                  </ScrollArea>
                </SidebarLayout>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        {selectedChannel && (
          <ChannelHeader
            channel={selectedChannel}
            members={members}
            messages={filteredMessages} // Thêm prop này
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
          />
        )}

        <div className="flex flex-col h-full">
          {filteredMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {selectedChannel
                    ? "Chưa có tin nhắn nào"
                    : "Chọn một kênh để bắt đầu trò chuyện"}
                </h3>
                <p className="text-muted-foreground">
                  {selectedChannel
                    ? "Hãy là người đầu tiên gửi tin nhắn trong kênh này"
                    : "Chọn một kênh từ sidebar để xem tin nhắn"}
                </p>
              </div>
            </div>
          ) : (
            <MessageList
              messages={filteredMessages}
              channelId={String(selectedChannel?.id)}
              onPrependMessages={handlePrependMessages}
              loadOlder={loadOlder}
              type={selectedChannel?.type}
              onReplySelect={(r) => setReplyTo(r)}
              onEditSelect={(e) => setEditTo(e)}
              hasInputPreview={!!(replyTo || editTo)}
              onOpenTool={handleOpenTool}
              members={selectedChannel?.members}
              isInputExpanded={isInputExpanded}
              onMessageUpdate={sendMessage}
            />
          )}

          {selectedChannel && (
            <div className="flex-shrink-0">
              <MessageInput
                channel={selectedChannel}
                channelMembers={members}
                channelMessages={filteredMessages}
                channelId={selectedChannel.id}
                onSend={sendMessage}
                replyMessage={replyTo || undefined}
                onCancelReply={() => setReplyTo(null)}
                editMessage={editTo || undefined}
                onCancelEdit={() => setEditTo(null)}
                onToggleCodeEditor={() => {
                  setSelectedTool(selectedTool === "tool2" ? null : "tool2");
                }}
                isCodeEditorOpen={selectedTool === "tool2"}
                onInputExpandedChange={(v) => setIsInputExpanded(Boolean(v))}
              />
            </div>
          )}
        </div>

        {/* GitHub Detail Modal */}
        {showGithubDetail && (
          <Dialog open={showGithubDetail} onOpenChange={setShowGithubDetail}>
            <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  GitHub Event Detail
                </DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto text-gray-900 dark:text-white">
                  {JSON.stringify(githubDetailData, null, 2)}
                </pre>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MasterLayout>
  );
}
