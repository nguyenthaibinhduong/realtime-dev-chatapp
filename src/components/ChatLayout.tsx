import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useNotificationActions } from "@/hooks/useNotificationToast";
import { useSearchParams } from "react-router-dom";
import SidebarLayout from "./SidebarLayout";
import { ChannelHeader } from "./blocks/channels/ChannelHeader";
import { MessageList } from "./blocks/messages/MessageList";
import { MessageInput } from "./blocks/messages/MessageInput";
import { useAuth } from "@/hooks/useAuth";
import MenubarLayout from "./MenubarLayout";
import MasterLayout from "./MasterLayout";
import { ChannelSearch } from "./blocks/channels/ChannelSearch";
import { ChannelSection } from "./blocks/channels/ChannelSection";
import { ChatAPI } from "@/api/api";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Message } from "@/types/message";
import { Channel, Member } from "@/types/channel";
import { chatSocketService } from "@/services/chatSocketService";
import { useIsMobile } from "@/hooks/useMobile";
import attachmentService, { UploadResult } from "@/services/attachmentService";
import {
  ApiTool,
  FortuneSheet,
  Tool1,
  Tool2,
  Tool3,
  ToolType,
} from "./blocks/tools";
import { el } from "date-fns/locale";
import { json } from "stream/consumers";

export default function ChatLayout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile); // Desktop mặc định hiện, mobile mặc định ẩn
  const { registerHandler, unregisterHandler } = useNotificationActions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation states for GitHub detail
  const [showGithubDetail, setShowGithubDetail] = useState(false);
  const [githubDetailData, setGithubDetailData] = useState<any>(null);

  // State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: { progress: number; total: number };
  }>({});
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
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);
  const [toolInitialItem, setToolInitialItem] = useState<any>(null);
  const [toolInitialData, setToolInitialData] = useState<any>(null);

  // Function to render selected tool component
  const renderToolComponent = () => {
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
              // <-- Thêm onClose handler
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

  // Handle opening tool with data - FIX: Sửa logic check
  const handleOpenTool = useCallback((data: any) => {
    //console.log("🚀 handleOpenTool received:", data); // Debug log

    if (data.type == "code-editor") {
      console.log("🔧 Opening Tool2 with code data:", {
        code: data.code,
        language: data.language,
      });
      setToolInitialData({
        code: data.code,
        language: data.language,
      });
      setSelectedTool("tool2");
    } else {
      console.log("🔧 Opening API Tool with data:", data);
      setToolInitialItem(data);
      setSelectedTool("apiTool");
    }
  }, []);

  // Listen to channel updates from socket (members, permissions, etc.)
  useEffect(() => {
    const handleChannelUpdate = (response: any) => {
      console.log('🔔 ChatLayout received onChannelUpdate:', response);

      // Parse response structure: can be { data: { channel, members } } or direct object
      const data = response?.data || response;
      const updatedChannel = data?.channel;
      const updatedMembers = data?.members;

      if (!updatedChannel?.id) {
        console.warn('⚠️ Invalid channel update data received');
        return;
      }

      const channelId = String(updatedChannel.id);

      // Update channels list
      setChannels((prevChannels) => {
        const idx = prevChannels.findIndex((c) => String(c.id) === channelId);
        if (idx !== -1) {
          const updated = [...prevChannels];
          // Merge channel data
          updated[idx] = {
            ...updated[idx],
            ...updatedChannel,
            member_count: updatedMembers?.length || updatedChannel.member_count || updated[idx].member_count,
          };
          console.log('✅ Updated channel in list:', updated[idx]);
          return updated;
        }
        return prevChannels;
      });

      // If this is the currently selected channel, update it and members
      if (selectedChannel && String(selectedChannel.id) === channelId) {
        console.log('🔄 Updating selected channel and members');

        setSelectedChannel((prev) => {
          if (!prev) return prev;

          const updated = { ...prev };

          // Update members if provided
          if (updatedMembers && Array.isArray(updatedMembers)) {
            updated.members = updatedMembers;
            updated.member_count = updatedMembers.length;
            console.log('✅ Updated selectedChannel members:', updatedMembers);
          }

          // Update json_data if provided (for private channels)
          if (updatedChannel.json_data) {
            updated.json_data = {
              ...prev.json_data,
              ...updatedChannel.json_data
            };
            console.log('✅ Updated selectedChannel json_data:', updated.json_data);
          }

          console.log('🎯 New selectedChannel state:', updated);
          return updated;
        });

        // Update members list if provided
        if (updatedMembers && Array.isArray(updatedMembers)) {
          console.log('👥 Updating members list:', updatedMembers);
          setMembers(updatedMembers);
        }
      }
    };

    chatSocketService.onChannelUpdate(handleChannelUpdate);

    return () => {
      chatSocketService.offChannelUpdate(handleChannelUpdate);
    };
  }, [selectedChannel]);

  // ✅ Register notification handlers
  useEffect(() => {
    // Handler for navigating to channel from notification
    const handleNavigateToChannel = (data: any) => {
      const { channelId, channel, messageId } = data;

      // Find channel in current list or use provided channel data
      let targetChannel = channels.find(
        (c) => String(c.id) === String(channelId)
      );
      if (!targetChannel && channel) {
        targetChannel = channel;
        // Optionally add channel to list if not present
        setChannels((prev) => {
          const exists = prev.find((c) => String(c.id) === String(channelId));
          return exists ? prev : [...prev, channel];
        });
      }

      if (targetChannel) {
        handleSelectChannel(targetChannel);

        // Update URL params
        const newParams = new URLSearchParams(searchParams);
        newParams.set("channel", String(channelId));
        if (messageId) {
          newParams.set("message", String(messageId));
        }
        setSearchParams(newParams);

        // Scroll to specific message if provided
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

        // Show success toast
        toast({
          title: "Đã chuyển đến kênh",
          description: `#${targetChannel.name}`,
          duration: 2000,
        });

        // Close sidebar on mobile
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

    // Handler for opening GitHub detail
    const handleOpenGithubDetail = (data: any) => {
      setGithubDetailData(data);
      setShowGithubDetail(true);
    };

    // Handler for system notifications
    const handleOpenSystemDetail = (data: any) => {
      console.log("System notification detail:", data);
      toast({
        title: "System Detail",
        description: data.message,
        duration: 3000,
      });
    };

    // Handler for general notifications
    const handleOpenNotificationDetail = (data: any) => {
      console.log("Notification detail:", data);
      toast({
        title: "Notification Detail",
        description: data.description,
        duration: 3000,
      });
    };

    // Register all handlers
    registerHandler("navigateToChannel", handleNavigateToChannel);
    registerHandler("openGithubDetail", handleOpenGithubDetail);
    registerHandler("openSystemDetail", handleOpenSystemDetail);
    registerHandler("openNotificationDetail", handleOpenNotificationDetail);

    // Cleanup handlers on unmount
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

  // ✅ Handle URL params on mount
  useEffect(() => {
    const channelParam = searchParams.get("channel");
    if (channelParam && channels.length > 0) {
      const targetChannel = channels.find((c) => String(c.id) === channelParam);
      if (targetChannel && targetChannel.id !== selectedChannel?.id) {
        handleSelectChannel(targetChannel);
      }
    }
  }, [searchParams, channels, selectedChannel]);

  // Thêm state cho vị trí nút điều hướng
  const [navBtnPos, setNavBtnPos] = useState({ x: 20, y: 20 });
  const navBtnRef = useRef<HTMLButtonElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Xử lý kéo thả nút điều hướng
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

  // Touch events cho mobile
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

  const handleShowChannelTypeMenu = () => setShowChannelTypeMenu((v) => !v);

  // Load channels + unread map
  const loadChannels = useCallback(async () => {
    try {
      const res = await ChatAPI.fetchChannel();
      let loadedChannels: Channel[] = [];
      if (Array.isArray(res)) loadedChannels = res;
      else if (res?.data && Array.isArray(res.data)) loadedChannels = res.data;

      // ✅ Merge channels thông minh: update existing + add new + keep socket channels
      setChannels((prevChannels) => {
        const mergedChannels = [...prevChannels];

        // Process each channel from API
        loadedChannels.forEach((apiChannel: any) => {
          const existingIndex = mergedChannels.findIndex(
            (c: any) =>
              String(c.id) === String(apiChannel.id) ||
              (c.fakeID && String(c.fakeID) === String(apiChannel.fakeID))
          );

          if (existingIndex !== -1) {
            // Update existing channel
            mergedChannels[existingIndex] = {
              ...mergedChannels[existingIndex],
              ...apiChannel,
            };
          } else {
            // Add new channel
            mergedChannels.push(apiChannel);
          }
        });

        console.log("🔄 Smart merged channels:", {
          existing: prevChannels.length,
          fromAPI: loadedChannels.length,
          final: mergedChannels.length,
        });

        return mergedChannels;
      });

      // ✅ Đăng ký nhận unread cho tất cả channels (từ API và socket)
      // Sử dụng callback để lấy channels state mới nhất
      setChannels((currentChannels) => {
        const channelIds = currentChannels.map((c) => String(c.id));
        if (channelIds.length > 0) {
          chatSocketService.registerUnread(channelIds);
        }

        // Chọn kênh đã lưu hoặc kênh đầu tiên từ currentChannels
        const savedChannelId = localStorage.getItem("selectedChannelId");
        const found = currentChannels.find(
          (c) => String(c.id) === savedChannelId
        );
        setSelectedChannel(found || currentChannels[0] || null);

        return currentChannels; // Không thay đổi state, chỉ sử dụng để access
      });

      // ✅ Lấy danh sách unread ban đầu bằng API (đảm bảo FE có state khi vừa vào)
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

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Socket join/leave + onMessage
  const joinChannelSocketA = useCallback(() => {
    if (!selectedChannel?.id) return () => { };

    const currentChannelId = selectedChannel.id;
    console.log("🔌 Joining socket room for channel:", currentChannelId);

    chatSocketService.joinRoom(currentChannelId);

    const messageHandler = (msg: any) => {
      console.log("📨 New socket message received:", msg);

      // ✅ FILTER: Relaxed channel filtering
      const msgChannelId = String(msg.channelId || msg.channel_id || "");
      const capturedChannelId = String(currentChannelId);

      // Chỉ reject nếu message có channelId và khác với current channel
      if (msgChannelId && msgChannelId !== capturedChannelId) {
        console.log("🚫 Ignoring message from different channel:", {
          messageChannel: msgChannelId,
          currentChannel: capturedChannelId,
        });
        return;
      }

      setMessages((prev: any) => {
        // ✅ Additional safety check với localStorage (less strict)
        const currentStoredChannelId =
          localStorage.getItem("selectedChannelId");
        if (
          currentStoredChannelId &&
          msgChannelId &&
          String(msgChannelId) !== String(currentStoredChannelId)
        ) {
          console.log("🚫 Second check - message channel mismatch:", {
            messageChannel: msgChannelId,
            storedChannel: currentStoredChannelId,
          });
          return prev;
        }

        // ✅ Xử lý tin nhắn bị xóa (type === 'remove') - ưu tiên trước
        if (msg.type === "remove") {
          const idx = prev.findIndex(
            (p: any) => String(p.id) === String(msg.id)
          );
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

        // ✅ Xử lý tin nhắn cập nhật thông thường (isUpdate === true)
        if (msg.isUpdate) {
          if (msg.type === "remove") {
            const idx = prev.findIndex(
              (p: any) => String(p.id) === String(msg.id)
            );
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
          } else {
            const idx = prev.findIndex(
              (p: any) => String(p.id) === String(msg.id)
            );
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
        } else {
          // Kiểm tra tin nhảin thay thế (fakeID match)
          const idx = prev.findIndex(
            (p: any) => String(p.fakeID) === String(msg.fakeID)
          );
          if (
            idx !== -1 &&
            String(prev[idx].channelId) === String(msg.channelId)
          ) {
            console.log("🔄 Replacing fake message with real message:", {
              fakeID: msg.fakeID,
              realID: msg.id,
              channelId: msg.channelId,
            });
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }

          // Kiểm tra trùng lặp tin nhắn
          const existingIdx = prev.findIndex(
            (p: any) => String(p.id) === String(msg.id) && msg.id
          );
          if (existingIdx !== -1) {
            console.log("🚫 Duplicate message ignored:", {
              messageId: msg.id,
              channelId: msg.channelId,
            });
            return prev;
          }

          // Thêm tin nhắn mới vào cuối
          console.log("✅ Adding new message to current channel:", {
            messageId: msg.id,
            channelId: msg.channelId,
            currentChannelId: currentChannelId,
            text: msg.text?.substring(0, 50) + "...",
          });
          return [...prev, msg];
        }
      });
    };

    chatSocketService.onMessage(messageHandler);

    return () => {
      console.log("🔌 Leaving socket room for channel:", currentChannelId);
      chatSocketService.leaveRoom(currentChannelId);
      chatSocketService.offMessage(messageHandler);
    };
  }, [selectedChannel]);

  useEffect(() => {
    const cleanup = joinChannelSocketA();
    return cleanup;
  }, [joinChannelSocketA]);

  // Socket channel updates (optional)
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

  // Lắng nghe unread từ socket
  useEffect(() => {
    const handleUnread = (data: { channelId: string; count: number }) => {
      setUnreadMap((prev) => ({ ...prev, [data.channelId]: data.count }));
    };
    chatSocketService.onUnread(handleUnread);
    return () => chatSocketService.offUnread(handleUnread);
  }, []);

  // Listen to channel removal from socket
  useEffect(() => {
    const handleRemoveChannel = (data: { id: string | number }) => {
      const channelId = String(data.id);
      console.log('🗑️ Received removeChannel event:', { channelId });

      // Remove channel from channels list
      setChannels((prevChannels) => {
        const filtered = prevChannels.filter((c) => String(c.id) !== channelId);
        console.log('✅ Removed channel from list:', {
          removedId: channelId,
          remaining: filtered.length
        });
        return filtered;
      });

      // If removed channel is currently selected, clear selection
      if (selectedChannel && String(selectedChannel.id) === channelId) {
        console.log('⚠️ Removed channel was selected, clearing selection');
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

  const handleSelectChannel = (channel: Channel | null) => {
    setSelectedChannel(channel);

    if (channel) {
      localStorage.setItem("selectedChannelId", String(channel.id));
      console.log("🔄 Switching to channel:", {
        channelId: channel.id,
        channelName: channel.name,
      });

      // Update URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set("channel", String(channel.id));
      newParams.delete("message"); // Clear message param when switching channels
      setSearchParams(newParams);
    } else {
      localStorage.removeItem("selectedChannelId");
      console.log("🔄 Clearing selected channel");

      // Clear messages chỉ khi không có channel nào được chọn
      setMessages([]);
      setMembers([]);

      // Clear URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("channel");
      newParams.delete("message");
      setSearchParams(newParams);
    }
  }; // Initial load messages for selected channel (server trả ASC: cũ→mới)
  const loadMessages = useCallback(async (channelId: string) => {
    console.log("📥 Loading messages for channel:", channelId);
    try {
      const res = await ChatAPI.fetchMessage(channelId);
      console.log("📥 Messages response:", res);

      if (res?.data) {
        const messagesData = Array.isArray(res.data.items)
          ? res.data.items
          : [];
        const membersData = Array.isArray(res.data.members)
          ? res.data.members
          : [];

        console.log("📥 Setting messages:", {
          messagesCount: messagesData.length,
          membersCount: membersData.length,
          channelId,
        });

        setMessages(messagesData);
        setMembers(membersData);
      } else {
        console.log("📥 No data in response, clearing messages");
        setMessages([]);
        setMembers([]);
      }
    } catch (error) {
      console.error("📥 Error loading messages:", error);
      setMessages([]);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    if (selectedChannel?.id) loadMessages(String(selectedChannel.id));
    else {
      setMessages([]);
      setMembers([]);
    }
  }, [selectedChannel, loadMessages]);

  const handleSelectChannelFromSearch = (channel: any) => {
    handleSelectChannel(channel);
    setOpenSearchModal(false);
  };

  const handleJoinChannelFromSearch = async (id: string, type: string) => {
    try {
      const res = await ChatAPI.joinChannel({ id, type });
      if (res && res.status && [200, 201].includes(res.status) && res.data) {
        // console.log('joinfromSearch', res);
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
  };

  // Send message via socket
  const sendMessage = useCallback(
    async (
      content: string,
      files: File[],
      meta?: {
        replyTo?: { id: string; sender: string; text?: string };
        editTo?: { id: string; sender: string; text?: string };
      },
      type?: any,
      json_data?: any
    ) => {
      if (
        !selectedChannel?.id ||
        (!content.trim() && (!files || files.length === 0))
      )
        return;

      let attachments: UploadResult[] = [];

      if (files && files.length > 0) {
        try {
          // ✅ Tạo temporary message với loading attachments
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

          // Thêm temporary message vào danh sách
          setMessages((prev) => [...prev, tempMessage]);

          // Upload files với progress tracking
          const uploadResults = await attachmentService.uploadFile(
            files,
            (fileIndex, progress) => {
              console.log(`File ${fileIndex + 1} progress: ${progress}%`);

              // ✅ Cập nhật progress cho attachment tương ứng
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

          // Convert upload results to attachment format
          attachments = uploadResults.map((result) => ({
            filename: result.filename,
            fileUrl: result.fileUrl,
            fileSize: result.fileSize,
            mimeType: result.mimeType,
            key: result.key,
          }));

          //remove attachments from json_data if any
          if (json_data && json_data.attachments) {
            delete json_data.attachments;
          }

          // ✅ Xóa temporary message sau khi upload thành công
          setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));

          toast({
            title: "Upload thành công",
            description: `${files.length} file(s) đã được upload`,
          });
        } catch (error: any) {
          console.error("📎 Upload process failed:", error);

          // ✅ Xóa temporary message và hiển thị lỗi
          const tempMessageId = `temp-${Date.now()}`;
          setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));

          toast({
            title: "Lỗi upload file",
            description: error?.message || "Không thể upload file",
            variant: "destructive",
          });
          return; // Don't send message if upload fails
        }
      }

      // Xác định type và các thông số gửi
      if (meta?.editTo) {
        // ✅ Chế độ chỉnh sửa tin nhắn

        chatSocketService.sendMessage({
          id: meta.editTo.id,
          channelId: selectedChannel.id,
          text: content.trim(),
          type: "message",
          isUpdate: true,
        });

        // Clear edit mode sau khi gửi
        setEditTo(null);
      } else {
        // ✅ Tin nhắn mới hoặc reply
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

        // Clear reply sau khi gửi
        if (meta?.replyTo) setReplyTo(null);
      }
    },
    [selectedChannel, user, toast]
  );

  // ✅ API: load older messages by cursor (before = oldest id currently rendered)
  const loadOlder = useCallback(
    async (channelId: string, beforeId: string, pageSize = 50) => {
      const res = await ChatAPI.fetchMessage(channelId, pageSize, beforeId);
      // Expect shape: { items, hasMoreOlder, cursors }
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

  // ✅ Prepend messages (dedupe by id)
  const handlePrependMessages = useCallback((newMsgs: Message[]) => {
    setMessages((prev) => {
      const exists = new Set(prev.map((m) => String(m.id)));
      const filtered = newMsgs.filter((m) => !exists.has(String(m.id)));
      return [...filtered, ...prev];
    });
  }, []);

  // Toggle sidebar function
  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  // Khi chọn kênh trên mobile thì ẩn sidebar
  const handleSelectChannelMobile = (channel: Channel | null) => {
    handleSelectChannel(channel);
    if (isMobile && showSidebar) {
      setShowSidebar(false); // Auto-hide sidebar khi chọn kênh trên mobile
    }
  };

  // Đồng bộ showSidebar với responsive - chỉ khi thay đổi từ mobile sang desktop
  useEffect(() => {
    // Khi chuyển từ mobile sang desktop, mặc định hiện sidebar
    if (!isMobile) {
      setShowSidebar(true);
    }
  }, [isMobile]); // Chỉ phụ thuộc vào isMobile, không phụ thuộc showSidebar

  return (
    <MasterLayout
      menu={
        <MenubarLayout
          onToggleSidebar={handleToggleSidebar}
          showSidebar={showSidebar}
        />
      }
      showSidebar={!isMobile && showSidebar} // Desktop only
      sidebar={
        !isMobile ? ( // Desktop only
          <SidebarLayout>
            <div className="flex items-center justify-between px-3 pt-2">
              <Dialog open={openSearchModal} onOpenChange={setOpenSearchModal}>
                <DialogTrigger asChild>
                  <div
                    className="flex items-center w-full bg-[#222] rounded px-3 py-2 cursor-pointer hover:bg-[#333] transition"
                    title="Tìm kiếm kênh"
                    onClick={() => setOpenSearchModal(true)}
                    style={{ minHeight: 40 }}
                  >
                    <Search className="h-5 w-5 text-white mr-2" />
                    <span className="text-white opacity-80 text-sm">
                      Tìm kiếm ...
                    </span>
                  </div>
                </DialogTrigger>
                <DialogContent
                  className="w-full max-w-2xl bg-[#18181b] text-white border-none"
                  style={{
                    background: "#18181b",
                    color: "#fff",
                    height: "85vh",
                  }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Tìm kiếm kênh , người dùng
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
                unreadMap={unreadMap} // truyền vào
              />
            </ScrollArea>
          </SidebarLayout>
        ) : null // Mobile không có sidebar trong MasterLayout
      }
      children_right={renderToolComponent()}
    >
      {/* Mobile Sidebar Overlay - Độc lập với MasterLayout */}
      {isMobile && (
        <div>
          <button
            ref={navBtnRef}
            className="fixed z-50 bg-primary text-white rounded-full p-2 shadow flex items-center justify-center"
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
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowSidebar(false)}
            >
              <div
                className="absolute top-0 left-0 h-full w-[80vw] max-w-xs bg-[#18181b] shadow-lg overflow-y-auto"
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
                          className="flex items-center w-full bg-[#222] rounded px-3 py-2 cursor-pointer hover:bg-[#333] transition"
                          title="Tìm kiếm kênh"
                          onClick={() => setOpenSearchModal(true)}
                          style={{ minHeight: 40 }}
                        >
                          <Search className="h-5 w-5 text-white mr-2" />
                          <span className="text-white opacity-80 text-sm">
                            Tìm kiếm ...
                          </span>
                        </div>
                      </DialogTrigger>
                      <DialogContent
                        className="w-full max-w-2xl bg-[#18181b] text-white border-none"
                        style={{
                          background: "#18181b",
                          color: "#fff",
                          height: "85vh",
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle className="text-white">
                            Tìm kiếm kênh , người dùng
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
                      unreadMap={unreadMap} // truyền vào
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
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
          />
        )}

        <div className="flex flex-col h-full">
          {(() => {
            const filteredMessages: any[] = messages.filter((msg: any) => {
              const msgChannelId = String(
                msg.channelId || msg.channel_id || ""
              );
              const currentChannelId = String(selectedChannel?.id || "");
              return (
                !msgChannelId ||
                !currentChannelId ||
                msgChannelId === currentChannelId
              );
            });

            console.log("💬 Render check:", {
              totalMessages: messages.length,
              filteredMessages: filteredMessages.length,
              selectedChannelId: selectedChannel?.id,
              hasSelectedChannel: !!selectedChannel,
            });

            return (
              <>
                {filteredMessages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">
                        {selectedChannel
                          ? "Chưa có tin nhắn nào"
                          : "Chọn một kênh để bắt đầu trò chuyện"}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedChannel
                          ? "Be the first to send a message in this channel"
                          : "Choose a channel from the sidebar to view messages"}
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
                    onReplySelect={(r) => setReplyTo(r)} // <-- nhận reply từ danh sách
                    onEditSelect={(e) => setEditTo(e)} // <-- nhận edit từ danh sách
                    hasInputPreview={!!(replyTo || editTo)} // <-- truyền trạng thái preview
                    onOpenTool={handleOpenTool}
                    members={selectedChannel?.members}
                  />
                )}

                {selectedChannel && (
                  <div className="flex-shrink-0">
                    <MessageInput
                      channelMembers={members}
                      channelMessages={filteredMessages}
                      channelId={selectedChannel.id}
                      onSend={sendMessage}
                      replyMessage={replyTo || undefined}
                      onCancelReply={() => setReplyTo(null)}
                      editMessage={editTo || undefined}
                      onCancelEdit={() => setEditTo(null)}
                      onToggleCodeEditor={() => {
                        // Toggle logic: nếu đang mở tool2 thì đóng, không thì mở
                        setSelectedTool(
                          selectedTool === "tool2" ? null : "tool2"
                        );
                      }}
                      isCodeEditorOpen={selectedTool === "tool2"} // <-- Pass trạng thái
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* GitHub Detail Modal */}
        {showGithubDetail && (
          <Dialog open={showGithubDetail} onOpenChange={setShowGithubDetail}>
            <DialogContent className="max-w-2xl bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle>GitHub Event Detail</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <pre className="text-sm bg-gray-800 p-4 rounded overflow-auto">
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
