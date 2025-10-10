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

export default function ChatLayout() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(false);
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
  const [replyTo, setReplyTo] = useState<{ id: string; sender: string; text?: string } | null>(null);

  // ✅ Register notification handlers
  useEffect(() => {
    // Handler for navigating to channel from notification
    const handleNavigateToChannel = (data: any) => {
      const { channelId, channel, messageId } = data;

      // Find channel in current list or use provided channel data
      let targetChannel = channels.find(c => String(c.id) === String(channelId));
      if (!targetChannel && channel) {
        targetChannel = channel;
        // Optionally add channel to list if not present
        setChannels(prev => {
          const exists = prev.find(c => String(c.id) === String(channelId));
          return exists ? prev : [...prev, channel];
        });
      }

      if (targetChannel) {
        handleSelectChannel(targetChannel);

        // Update URL params
        const newParams = new URLSearchParams(searchParams);
        newParams.set('channel', String(channelId));
        if (messageId) {
          newParams.set('message', String(messageId));
        }
        setSearchParams(newParams);

        // Scroll to specific message if provided
        if (messageId) {
          setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    registerHandler('navigateToChannel', handleNavigateToChannel);
    registerHandler('openGithubDetail', handleOpenGithubDetail);
    registerHandler('openSystemDetail', handleOpenSystemDetail);
    registerHandler('openNotificationDetail', handleOpenNotificationDetail);

    // Cleanup handlers on unmount
    return () => {
      unregisterHandler('navigateToChannel');
      unregisterHandler('openGithubDetail');
      unregisterHandler('openSystemDetail');
      unregisterHandler('openNotificationDetail');
    };
  }, [channels, registerHandler, unregisterHandler, toast, isMobile, searchParams, setSearchParams]);

  // ✅ Handle URL params on mount
  useEffect(() => {
    const channelParam = searchParams.get('channel');
    if (channelParam && channels.length > 0) {
      const targetChannel = channels.find(c => String(c.id) === channelParam);
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

      setChannels(loadedChannels);

      // ✅ Đăng ký nhận unread cho các channel hiện có
      const channelIds = loadedChannels.map((c) => String(c.id));
      if (channelIds.length > 0) {
        chatSocketService.registerUnread(channelIds); // emits 'register_unread_channels'
      }

      // ✅ Lấy danh sách unread ban đầu bằng API (đảm bảo FE có state khi vừa vào)
      const unreadRes = await ChatAPI.fetchUnread();
      if (unreadRes?.data && typeof unreadRes.data === "object") {
        setUnreadMap(unreadRes.data);
      }

      // Chọn kênh đã lưu hoặc kênh đầu tiên
      const savedChannelId = localStorage.getItem("selectedChannelId");
      const found = loadedChannels.find((c) => String(c.id) === savedChannelId);
      setSelectedChannel(found || loadedChannels[0] || null);
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
    if (selectedChannel?.id) {
      chatSocketService.joinRoom(selectedChannel?.id);
      chatSocketService.onMessage((msg: any) => {
        console.log("New socket message received:", msg);
        setMessages((prev: any) => {
          // Nếu có tin nhắn cùng fakeID thì replace, nếu không thì thêm mới
          const idx = prev.findIndex(
            (p: any) => String(p.fakeID) === String(msg.fakeID)
          );
          if (idx !== -1 && String(prev[idx].channelId) === String(msg.channelId)) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
          return [...prev, msg];
        });
      });
    }
    return () => {
      chatSocketService.leaveRoom(selectedChannel?.id);
      chatSocketService.offMessage();
    };
  }, [selectedChannel]);
  const joinChannelSocketB = useCallback(() => {
    if (selectedChannel?.id) {
      chatSocketService.joinRoom(localStorage.getItem("selectedChannelId"));
      chatSocketService.onMessage((msg: any) => {
        console.log("New socket message received:", msg);
        setMessages((prev: any) => {
          // Nếu có tin nhắn cùng fakeID thì replace, nếu không thì thêm mới

          const idx = prev.findIndex(
            (p: any) => String(p.fakeID) === String(msg.fakeID)
          );
          if (idx !== -1 && String(prev[idx].channelId) === String(msg.channelId)) {
            const updated = [...prev];
            updated[idx] = msg;
            return updated;
          }
          return [...prev, msg];
        });
      });
    }
    return () => {
      chatSocketService.leaveRoom(localStorage.getItem("selectedChannelId"));
      chatSocketService.offMessage();
    };
  }, [selectedChannel]);

  useEffect(() => {
    joinChannelSocketA();
    joinChannelSocketB();
  }, [joinChannelSocketA, joinChannelSocketB]);

  // Socket channel updates (optional)
  useEffect(() => {
    const handler = (channel: any) => {
      setChannels((prev) => {
        const idx = prev.findIndex(
          (c: any) => String(c.fakeID) === String(channel.fakeID)
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

  const handleSelectChannel = (channel: Channel | null) => {
    setSelectedChannel(channel);
    if (channel) {
      localStorage.setItem("selectedChannelId", String(channel.id));
      // Update URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set('channel', String(channel.id));
      newParams.delete('message'); // Clear message param when switching channels
      setSearchParams(newParams);
    } else {
      localStorage.removeItem("selectedChannelId");
      // Clear URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('channel');
      newParams.delete('message');
      setSearchParams(newParams);
    }
  };

  // Initial load messages for selected channel (server trả ASC: cũ→mới)
  const loadMessages = useCallback(
    async (channelId: string) => {
      try {
        const res = await ChatAPI.fetchMessage(channelId);
        console.log("loadMessages:", res);
        if (res?.data) {
          setMessages(Array.isArray(res.data.items) ? res.data.items : []);
          setMembers(Array.isArray(res.data.members) ? res.data.members : []);
        } else {
          setMessages([]);
          setMembers([]);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi tải tin nhắn",
          description: error?.msg || error?.message || "Không thể tải tin nhắn",
          variant: "destructive",
        });
        setMessages([]);
        setMembers([]);
      }
    },
    [toast]
  );

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
        localStorage.setItem("selectedChannelId", res.data.channelId);
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
    async (content: string, files: File[], meta?: { replyTo?: { id: string; sender: string; text?: string } }) => {
      if (!selectedChannel?.id || (!content.trim() && (!files || files.length === 0))) return;

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

      // Xác định type gửi
      const computedType =
        meta?.replyTo
          ? "reply-message"
          : (attachments.length > 0 ? "file-upload" : "message");

      // ✅ Gửi tin nhắn qua socket
      chatSocketService.sendMessage({
        channelId: selectedChannel.id,
        text: content.trim(),
        type: computedType,
        channelData: selectedChannel,
        ...(attachments.length > 0 && { presignedAttachments: attachments }),
        ...(meta?.replyTo && {
          replyTo: {
            id: meta.replyTo.id,
            sender: meta.replyTo.sender,
            text: meta.replyTo.text,
          },
        }),
      });

      // clear reply sau khi gửi
      if (meta?.replyTo) setReplyTo(null);
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

  // Khi chọn kênh trên mobile thì ẩn sidebar
  const handleSelectChannelMobile = (channel: Channel | null) => {
    handleSelectChannel(channel);
    if (isMobile) setShowSidebar(false);
  };

  return (
    <MasterLayout
      menu={<MenubarLayout />}
      sidebar={
        isMobile ? (
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
        ) : (
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
        )
      }
    >
      <div className="flex-1 flex flex-col">
        {selectedChannel && (
          <ChannelHeader channel={selectedChannel} members={members} />
        )}

        <div className="flex-1 flex items-center justify-center">
          {messages.length === 0 ? (
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Chat Coming Soon
              </h3>
              <p className="text-muted-foreground">
                Chat functionality will be implemented with the new backend API
              </p>
            </div>
          ) : (
            <MessageList
              messages={messages}
              channelId={String(selectedChannel?.id)}
              onPrependMessages={handlePrependMessages}
              loadOlder={loadOlder}
              type={selectedChannel?.type}
              onReplySelect={(r) => setReplyTo(r)} // <-- nhận reply từ danh sách
            />
          )}
        </div>

        {selectedChannel && (
          <MessageInput
            channelId={selectedChannel.id}
            onSend={sendMessage}
            replyMessage={replyTo || undefined}        // <-- truyền xuống input
            onCancelReply={() => setReplyTo(null)}     // <-- hủy reply
          />
        )}

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
