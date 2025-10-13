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

function shouldShowSenderInfo(messages: any[], idx: number, userId: any) {
  if (idx === 0) return true;
  const curr = messages[idx];
  const prev = messages[idx - 1];
  if (curr?.type === "notification" || prev?.type === "notification") return true;
  if (!curr?.sender || !prev?.sender) return true;
  return (
    curr.sender.id !== prev.sender.id ||
    Math.abs(
      new Date(curr.created_at || curr.send_at).getTime() -
      new Date(prev.created_at || prev.send_at).getTime()
    ) > 5 * 60 * 1000
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
  onReplySelect?: (reply: { id: string; sender: string; text?: string }) => void; // <-- thêm
};

export const MessageList: React.FC<Props> = ({
  messages,
  channelId,
  onPrependMessages,
  loadOlder,
  type,
  onReplySelect, // <-- thêm
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

  // Message action handlers
  const handleLike = useCallback(async (messageId: string) => {
    console.log('Like message:', messageId);
    // TODO: Implement API call
    // await chatAPI.likeMessage(channelId, messageId);
  }, [channelId]);

  const handleReply = useCallback((messageId: string) => {
    const msg: any = messages.find((m) => String(m.id) === String(messageId));
    if (!msg) return;
    onReplySelect?.({
      id: String(msg.id),
      sender: msg.sender?.username || msg.sender?.name || "Unknown",
      text: msg.text || (Array.isArray(msg.attachments) && msg.attachments.length > 0 ? `[${msg.attachments.length} tệp đính kèm]` : ""),
    });
  }, [messages, onReplySelect]);

  const handleForward = (messageId: string) => {
    setShareMessageId(messageId);
    setShowShareModal(true);
  };
  const handleSelectChannel = (channel: any) => setShareChannelId(String(channel.id));
  const handleDoShare = (shareType: 'current' | 'other') => {
    const messageId = shareMessageId;
    if (!messageId) return;
    let channel_id = "";
    if (shareType === "current") channel_id = localStorage.getItem("selectedChannelId") || "";
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


  const handlePin = useCallback(async (messageId: string) => {
    const msg: any = messages.find((m) => String(m.id) === String(messageId));
    if (!msg) return;

    // Hiển thị toast ngay lập tức
    toast({
      title: "Đang ghim tin nhắn...",
      description: "Tin nhắn sẽ được ghim lên đầu",
      duration: 1000,
    });

    chatSocketService.sendMessage({
      id: messageId,
      isUpdate: true,
      isPin: true,
      text: msg.text,
      channelId: channelId,
      type: 'message',
    });
  }, [channelId, messages, toast]);

  const handleEdit = useCallback((messageId: string) => {
    console.log('Edit message:', messageId);
    // TODO: Set edit mode in message input
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    const msg: any = messages.find((m) => String(m.id) === String(messageId));
    if (!msg) return;
    //console.log('Delete message:', msg);

    chatSocketService.sendMessage({
      id: messageId,
      isUpdate: true,
      channelId: channelId,
      text: `tin nhắn đã bị xóa`,
      type: 'remove',
    });
    // toast({
    //   title: "Đã xóa tin nhắn!",
    // });
  }, [channelId, messages]);

  const handleCopy = useCallback((messageId: string, text: string) => {
    console.log('Copy message:', messageId, text);
  }, []);

  const handleShare = useCallback((messageId: string) => {
    console.log('Share message:', messageId);
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

  const handleMessageAction = useCallback((
    type: MessageActionType,
    messageId: string,
    messageData?: any
  ) => {
    if (type === 'reply') {
      handleReply(messageId); // đẩy dữ liệu reply lên ChatLayout
      return;
    }
    handleAction(type, messageId, messageData);
  }, [handleAction, handleReply]);

  // Jump đến message có id tương ứng (dùng cho reply preview)
  const scrollToMessage = useCallback((targetId: string) => {
    if (!targetId) return;
    const el = document.querySelector(`[data-message-id="${targetId}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHoveredId(String(targetId));
      window.setTimeout(() => setHoveredId(null), 1600);
    }
  }, []);



  // Separate pinned and regular messages with real-time updates
  const { pinnedMessages } = useMemo(() => {
    const pinned: any[] = [];

    // Sắp xếp messages theo thời gian để đảm bảo tin nhắn mới nhất được xử lý đúng
    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.created_at || a.send_at).getTime() - new Date(b.created_at || b.send_at).getTime()
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
  const handleUnpin = useCallback(async (messageId: string) => {

    // Gửi socket message để unpin
    const msg: any = messages.find((m) => String(m.id) === String(messageId));
    if (!msg) return;

    chatSocketService.sendMessage({
      id: messageId,
      isUpdate: true,
      isPin: false, // Đặt thành false để bỏ ghim
      text: msg.text,
      channelId: channelId,
      type: 'message',
    });
  }, [channelId, messages]);

  // Memoized message items
  const messageItems = useMemo(() => {
    return messages.map((message: any, idx: number) => {
      const isMe = message?.sender?.id === user?.id;
      const showSenderInfo = !isMe && shouldShowSenderInfo(messages, idx, user?.id);
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

      // Code share message
      if (message.type === "code-share") {
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
          onJumpToMessage={scrollToMessage} // <-- added
        />
      );
    });
  }, [messages, user, type, hoveredId, handleCodeShare, handleMessageAction, scrollToMessage]);

  const PinItems = useMemo(() => {
    if (pinnedMessages.length > 0) {
      // Tạo key unique dựa trên pin messages để force re-render khi có thay đổi
      const pinKey = pinnedMessages.map(m => `${m.id}-${m.isPin}-${m.updated_at || m.created_at}`).join('|');

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
      className="flex-1 p-4"
      style={{ height: "75vh", minHeight: "75vh", maxHeight: "75vh" }}
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
        <RepoChatDialog
          open={openGitModal}
          onOpenChange={setOpenGitModal}
        />

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
            className="bg-black rounded-xl shadow-lg p-6 w-[40vw] min-h-[60vh] relative flex flex-col items-center justify-center"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", position: "fixed" }}
          >
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl"
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
            <div className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-500" />
              Chia sẻ code cho kênh
            </div>
            <div className="mb-4 w-full">
              <div className="text-xs text-gray-600 mb-2 text-center">Chọn kênh để chia sẻ</div>
              <ChannelSearch onSelectChannel={handleSelectChannel} isShare={true} />
              <Button className="w-full mt-4 bg-blue-600 text-white" onClick={() => handleDoShare("current")}>
                Chia sẻ cho kênh hiện tại
              </Button>
              {shareChannelId && (
                <Button className="w-full mt-4 bg-white text-black hover:bg-blue-600 hover:text-white" onClick={() => handleDoShare("other")}>
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