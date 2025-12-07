import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo, useCallback, useEffect } from "react";
import { MessageListProps } from "@/types/message";
import { RepoChatDialog } from "../github/RepoChatDialog";
import { CodeViewerDialog } from "../github/RepoDetailModal";
import MessageItem from "./type/MessageItem";
import NotificationMessage from "./type/NotificationMessage";
import CodeShareMessage from "./type/CodeShareMessage";
import LoadMoreIndicator from "@/components/common/LoadMoreIndicator";
import { useMessageScroll } from "@/hooks/useMessage";
import { useMessageStatus } from "@/hooks/useMessage";
import { useMessageActions } from "@/hooks/useMessage";
import { MessageActionType } from "@/components/blocks/messages/MessageAction";
import { chatSocketService } from "@/services/chatSocketService";
import { toast } from "@/hooks/useToast";
import { PinnedMessages } from "./PinnedMessages";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import { ChannelSearch } from "../channels/ChannelSearch";
import { Button } from "@/components/ui/button";
import ToolShareMessage from "./type/ToolShareMessage";
import CodeCardMessage from "./type/CodeCardMessage";
import TesterReportMessage from "./type/TesterReportMessage";
import BARequireMessage from "./type/BaRequireMessage";
import { url } from "inspector";

function shouldShowSenderInfo(messages: any[], idx: number, userId: any) {
  if (idx === 0) return true;
  const curr = messages[idx];
  const prev = messages[idx - 1];
  if (curr?.type === "notification" || prev?.type === "notification")
    return true;
  if (!curr?.sender || !prev?.sender) return true;
  return (
    curr.sender.id !== prev.sender.id ||
    Math.abs(
      new Date(curr.created_at || curr.send_at).getTime() -
      new Date(prev.created_at || prev.send_at).getTime()
    ) >
    5 * 60 * 1000
  );
}

type Props = MessageListProps & {
  channelId: string;
  onPrependMessages?: (msgs: any[]) => void;
  loadOlder?: (
    channelId: string,
    beforeId: string,
    pageSize?: number
  ) => Promise<{
    items: any[];
    hasMoreOlder?: boolean;
    cursors?: any;
  }>;
  type?: string;
  onReplySelect?: (reply: {
    id: string;
    sender: string;
    text?: string;
  }) => void; // <-- thêm
  onEditSelect?: (edit: { id: string; sender: string; text?: string }) => void; // <-- thêm edit
  hasInputPreview?: boolean; // <-- thêm để biết có reply/edit preview không
  onOpenTool?: (data: any) => void;
  members?: any[]; // <-- thêm members prop
  isInputExpanded?: boolean; // true if MessageInput shows preview/link/upload/reply
  onMessageUpdate?: (
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
  ) => void | Promise<void>; // <-- Thêm prop để xử lý update
};

export const MessageList: React.FC<Props> = ({
  messages,
  channelId,
  onPrependMessages,
  loadOlder,
  type,
  onReplySelect,
  onEditSelect,
  hasInputPreview = false,
  onOpenTool,
  members,
  isInputExpanded = false,
  onMessageUpdate,
  // removed inputHeightPx - layout now handled by flexbox
}) => {
  const { user } = useAuth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openGitModal, setOpenGitModal] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeShareParams, setCodeShareParams] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareChannelId, setShareChannelId] = useState<string | null>(null);
  const [shareMessageId, setShareMessageId] = useState<string | null>(null);

  // Custom hooks
  const { sentStatusIds } = useMessageStatus(messages, user?.id);
  const firstMsgId = messages.length > 0 ? String(messages[0].id) : undefined;

  const { scrollAreaRef, messagesEndRef } = useMessageScroll({
    messages,
    channelId,
    firstMsgId,
    hasMore,
    loadingMore,
    loadOlder,
    onPrependMessages,
    setLoadingMore,
    setHasMore,
  });

  // ✅ Auto scroll to bottom when new messages arrive
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  useEffect(() => {
    if (messages.length === 0) {
      setPreviousMessageCount(0);
      return;
    }

    // Only auto-scroll if messages count increased (new message added)
    if (messages.length <= previousMessageCount) {
      setPreviousMessageCount(messages.length);
      return;
    }

    // Get the latest message
    const latestMessage: any = messages[messages.length - 1];
    if (!latestMessage) return;

    // Check if the latest message belongs to current channel
    const messageChannelId = String(
      latestMessage.channelId || latestMessage.channel_id
    );
    const currentChannelId = String(channelId);

    if (messageChannelId !== currentChannelId) {
      console.log("🚫 Not scrolling - message from different channel:", {
        messageChannel: messageChannelId,
        currentChannel: currentChannelId,
      });
      setPreviousMessageCount(messages.length);
      return;
    }

    // Check if this is a really new message (created recently)
    const messageTime = new Date(
      latestMessage.created_at || latestMessage.send_at
    );
    const now = new Date();
    const timeDiff = now.getTime() - messageTime.getTime();

    // Only auto-scroll for messages created within last 30 seconds (to avoid scrolling on page load)
    if (timeDiff > 30000) {
      console.log("🚫 Not scrolling - message too old:", {
        messageTime: messageTime.toISOString(),
        timeDiff: timeDiff + "ms",
      });
      setPreviousMessageCount(messages.length);
      return;
    }

    // Scroll to bottom smoothly
    if (messagesEndRef.current) {
      console.log("📜 Auto-scrolling to new message:", {
        messageId: latestMessage.id,
        sender: latestMessage.sender?.name || latestMessage.sender?.username,
        time: messageTime.toISOString(),
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 100); // Small delay to ensure DOM is updated
    }

    setPreviousMessageCount(messages.length);
  }, [messages, channelId, messagesEndRef, previousMessageCount]);

  // Message action handlers
  const handleLike = useCallback(
    async (messageId: string) => {
      const msg: any = messages.find((m) => String(m.id) === String(messageId));
      if (!msg) return;

      // Kiểm tra xem user đã like chưa
      const currentLikeData = msg.like_data || {};
      const currentLikes = currentLikeData.users || [];
      const userAlreadyLiked = currentLikes.some(
        (like: any) => like.userId === user?.id
      );

      let updatedLikes;
      let updatedCount;

      if (userAlreadyLiked) {
        // Bỏ like - xóa user khỏi danh sách
        updatedLikes = currentLikes.filter(
          (like: any) => like.userId !== user?.id
        );
        updatedCount = Math.max(0, (currentLikeData.count || 0) - 1);
      } else {
        // Thêm like - thêm user vào danh sách
        updatedLikes = [
          ...currentLikes,
          {
            userId: user?.id,
            username: user?.username || user?.name || "Unknown",
            likedAt: new Date().toISOString(),
          },
        ];
        updatedCount = (currentLikeData.count || 0) + 1;
      }

      // ✅ Sử dụng onMessageUpdate thay vì gọi trực tiếp chatSocketService
      onMessageUpdate?.('', [], {
        messageId,
        updateAction: 'like',
        likeData: {
          count: updatedCount,
          users: updatedLikes,
          isLiked: !userAlreadyLiked,
        },
      });
    },
    [messages, user, onMessageUpdate]
  );

  const handleReply = useCallback(
    (messageId: string) => {
      const msg: any = messages.find((m) => String(m.id) === String(messageId));
      if (!msg) return;
      onReplySelect?.({
        id: String(msg.id),
        sender: msg.sender?.username || msg.sender?.name || "Unknown",
        text:
          msg.text ||
          (Array.isArray(msg.attachments) && msg.attachments.length > 0
            ? `[${msg.attachments.length} tệp đính kèm]`
            : ""),
      });
    },
    [messages, onReplySelect]
  );

  const handleForward = (messageId: string) => {
    setShareMessageId(messageId);
    setShowShareModal(true);
  };
  const handleSelectChannel = (channel: any) =>
    setShareChannelId(String(channel.id));
  const handleDoShare = (shareType: "current" | "other") => {
    const messageId = shareMessageId;
    if (!messageId) return;
    let channel_id = "";
    if (shareType === "current")
      channel_id = localStorage.getItem("selectedChannelId") || "";
    else channel_id = shareChannelId || "";
    const msg: any = messages.find((m) => String(m.id) === String(messageId));
    if (!msg) return;
    chatSocketService.sendMessage({
      channelId: channel_id,
      text: msg.text,
      type: msg.type,
    });
    toast({
      title: "Đã chia sẻ tin nhắn vào kênh chat.",
    });
    setShowShareModal(false);
    setShareMessageId(null);
  };

  const handlePin = useCallback(
    async (messageId: string) => {
      const msg: any = messages.find((m) => String(m.id) === String(messageId));
      if (!msg) return;

      // Hiển thị toast ngay lập tức
      toast({
        title: "Đang ghim tin nhắn...",
        description: "Tin nhắn sẽ được ghim lên đầu",
        duration: 1000,
      });

      // ✅ Sử dụng onMessageUpdate thay vì gọi trực tiếp chatSocketService
      onMessageUpdate?.(msg.text || '', [], {
        messageId,
        updateAction: 'pin',
      });
    },
    [messages, toast, onMessageUpdate]
  );

  const handleEdit = useCallback(
    (messageId: string) => {
      const msg: any = messages.find((m) => String(m.id) === String(messageId));
      if (!msg) return;
      onEditSelect?.({
        id: String(msg.id),
        sender: msg.sender?.username || msg.sender?.name || "Unknown",
        text: msg.text || "",
      });
    },
    [messages, onEditSelect]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      const msg: any = messages.find((m) => String(m.id) === String(messageId));
      if (!msg) return;

      // ✅ Sử dụng onMessageUpdate thay vì gọi trực tiếp chatSocketService
      onMessageUpdate?.('Tin nhắn đã bị xóa', [], {
        messageId,
        updateAction: 'delete',
      });
    },
    [messages, onMessageUpdate]
  );

  const handleCopy = useCallback((messageId: string, text: string) => {
    console.log("Copy message:", messageId, text);
  }, []);

  const handleShare = useCallback((messageId: string) => {
    console.log("Share message:", messageId);
    // TODO: Open share dialog
  }, []);

  // Initialize message actions hook
  const { handleAction } = useMessageActions({
    onLike: handleLike,
    onReply: handleReply,
    onForward: (messageId: string) => handleForward(messageId),
    onPin: handlePin,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCopy: handleCopy,
    onShare: handleShare,
  });

  // Memoized handlers
  const handleCodeShare = useCallback((params: any) => {
    setCodeShareParams(params);
    setCodeOpen(true);
  }, []);

  const handleCloseCodeViewer = useCallback((v: boolean) => {
    setCodeOpen(v);
    if (!v) setCodeShareParams(null);
  }, []);

  const handleMessageAction = useCallback(
    (type: MessageActionType, messageId: string, messageData?: any) => {
      if (type === "reply") {
        handleReply(messageId); // đẩy dữ liệu reply lên ChatLayout
        return;
      }
      handleAction(type, messageId, messageData);
    },
    [handleAction, handleReply]
  );

  // Jump đến message có id tương ứng (dùng cho reply preview)
  const scrollToMessage = useCallback((targetId: string) => {
    if (!targetId) return;
    const el = document.querySelector(
      `[data-message-id="${targetId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHoveredId(String(targetId));
      window.setTimeout(() => setHoveredId(null), 1600);
    }
  }, []);

  // Separate pinned and regular messages with real-time updates
  const { pinnedMessages } = useMemo(() => {
    const pinned: any[] = [];

    // Sắp xếp messages theo thời gian để đảm bảo tin nhắn mới nhất được xử lý đúng
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.created_at || a.send_at).getTime() -
        new Date(b.created_at || b.send_at).getTime()
    );
    sortedMessages.forEach((message: any) => {
      if (message.isPin === true) {
        pinned.push(message);
      }
    });
    return {
      pinnedMessages: pinned,
    };
  }, [messages]);

  // Handle unpin action with immediate UI update
  const handleUnpin = useCallback(
    async (messageId: string) => {
      // Gửi socket message để unpin
      const msg: any = messages.find((m) => String(m.id) === String(messageId));
      if (!msg) return;

      // ✅ Sử dụng onMessageUpdate thay vì gọi trực tiếp chatSocketService
      onMessageUpdate?.(msg.text || '', [], {
        messageId,
        updateAction: 'unpin',
      });
    },
    [messages, onMessageUpdate]
  );

  // Add handleOpenInTool function - FIX: Đảm bảo đúng data structure
  const handleOpenInTool = useCallback(
    (code: string, language: string) => {
      console.log("📝 MessageList - handleOpenInTool called:", {
        code,
        language,
      }); // Debug log
      onOpenTool?.({
        type: "code-editor", // <-- Đảm bảo type đúng
        code,
        language,
      });
    },
    [onOpenTool]
  );

  // Thêm useEffect để handle URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const messageId = params.get("message");

    if (messageId) {
      // Delay để đảm bảo DOM đã render
      setTimeout(() => {
        const messageElement = document.querySelector(
          `[data-message-id="${messageId}"]`
        );
        if (messageElement) {
          messageElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Add highlight class
          messageElement.classList.add("highlight-message");
          setTimeout(() => {
            messageElement.classList.remove("highlight-message");
          }, 2000);
        }
      }, 500);
    }
  }, [messages]);

  // Memoized message items
  const messageItems = useMemo(() => {
    return messages.map((message: any, idx: number) => {
      const isMe = message?.sender?.id === user?.id;
      const showSenderInfo =
        !isMe && shouldShowSenderInfo(messages, idx, user?.id);
      const isLastMyMessage = isMe && idx === messages.length - 1;

      // Notification message
      if (message?.type === "notification") {
        return (
          <NotificationMessage
            key={message.id}
            message={message}
            onViewRepo={() => setOpenGitModal(true)}
          />
        );
      }

      // Code card message - Đã có sẵn, chỉ cần đảm bảo handleOpenInTool hoạt động
      if (message?.type === "code-card") {
        return (
          <CodeCardMessage
            key={message.id}
            message={message}
            isMe={isMe}
            showSenderInfo={showSenderInfo}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onMessageAction={handleMessageAction}
            onOpenInTool={handleOpenInTool} // <-- Đã được định nghĩa ở trên
          />
        );
      }

      // Code share message
      if (message?.type === "code-share") {
        return (
          <CodeShareMessage
            key={message.id}
            message={message}
            isMe={isMe}
            showSenderInfo={showSenderInfo}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onOpenCode={handleCodeShare}
          />
        );
      }

      // Tool share message
      if (message?.type === "tool") {
        return (
          <ToolShareMessage
            key={message.id}
            item={message}
            onOpenTool={onOpenTool}
            isMe={isMe}
            showSenderInfo={showSenderInfo}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        );
      }

      // BA Requirement message
      if (message?.type === "ba-require") {
        return (
          <BARequireMessage
            key={message.id}
            message={message}
            isMe={isMe}
            showSenderInfo={showSenderInfo}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            channelMembers={members}
            onMessageAction={handleMessageAction}
          />
        );
      }

      // Tester report message
      if (message?.type === "tester-report") {
        return (
          <TesterReportMessage
            key={message.id}
            message={message}
            isMe={isMe}
            showSenderInfo={showSenderInfo}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            channelMembers={members}
            onMessageAction={handleMessageAction}
          />
        );
      }

      // Regular message
      return (
        <MessageItem
          key={message.id}
          message={message}
          isMe={isMe}
          showSenderInfo={showSenderInfo}
          type={type}
          user={user}
          sentStatusIds={sentStatusIds}
          isLastMyMessage={isLastMyMessage}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onCodeShare={handleCodeShare}
          onMessageAction={handleMessageAction}
          onJumpToMessage={scrollToMessage}
          data-message-id={message.id} // Thêm data-message-id attribute
        />
      );
    });
  }, [
    messages,
    user,
    type,
    hoveredId,
    handleCodeShare,
    handleMessageAction,
    scrollToMessage,
    onOpenTool,
    handleOpenInTool,
  ]);

  const PinItems = useMemo(() => {
    if (pinnedMessages.length > 0) {
      // Tạo key unique dựa trên pin messages để force re-render khi có thay đổi
      const pinKey = pinnedMessages
        .map((m) => `${m.id}-${m.isPin}-${m.updated_at || m.created_at}`)
        .join("|");

      return (
        <div className="mb-4 absolute top-0 left-0 right-0 z-[99]">
          <PinnedMessages
            key={pinKey} // Force re-render khi có thay đổi pin status
            messages={pinnedMessages}
            onUnpin={handleUnpin}
            onJumpToMessage={scrollToMessage}
          />
        </div>
      );
    }
    return null;
  }, [pinnedMessages, handleUnpin, scrollToMessage]);

  return (
    <ScrollArea
      className={`flex-1 min-h-0 p-4 overflow-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black ${isInputExpanded ? "max-h-[65vh]" : "max-h-[80vh]"}`}
      style={{ transition: "height 0.3s ease-in-out" }}
      ref={scrollAreaRef}
    >
      <div>
        {/* Pinned Messages Section */}
        {PinItems}

        <LoadMoreIndicator loading={loadingMore} />

        <div className="space-y-2">
          {messageItems}
          <div ref={messagesEndRef} />
        </div>

        {/* Modals */}
        <RepoChatDialog open={openGitModal} onOpenChange={setOpenGitModal} />

        {codeShareParams && (
          <CodeViewerDialog
            open={codeOpen}
            onOpenChange={handleCloseCodeViewer}
            repo={codeShareParams.repo}
            refParam={codeShareParams.refParam}
            initialPath={codeShareParams.initialPath}
            installation_id={codeShareParams.installation_id}
            isShare={true}
            json_data_code={codeShareParams.json_code_data}
          />
        )}

        <Dialog
          open={showShareModal}
          onOpenChange={(v) => {
            setShowShareModal(v);
            if (!v) {
              setShareChannelId(null);
              setShareMessageId(null);
            }
          }}
        >
          <DialogContent
            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-[40vw] min-h-[60vh] relative flex flex-col items-center justify-center border border-gray-300 dark:border-gray-700"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              position: "fixed",
            }}
          >
            <button
              className="absolute top-3 right-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xl"
              onClick={() => {
                setShowShareModal(false);
                setShareChannelId(null);
                setShareMessageId(null);
              }}
              aria-label="Đóng"
              type="button"
            >
              ×
            </button>
            <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-500" />
              Chia sẻ code cho kênh
            </div>
            <div className="mb-4 w-full">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                Chọn kênh để chia sẻ
              </div>
              <ChannelSearch
                onSelectChannel={handleSelectChannel}
                isShare={true}
              />
              <Button
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleDoShare("current")}
              >
                Chia sẻ cho kênh hiện tại
              </Button>
              {shareChannelId && (
                <Button
                  className="w-full mt-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white"
                  onClick={() => handleDoShare("other")}
                >
                  Chia sẻ cho kênh này
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
};
