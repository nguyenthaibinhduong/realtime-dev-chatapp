import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo, useCallback } from "react";
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
};

export const MessageList: React.FC<Props> = ({
  messages,
  channelId,
  onPrependMessages,
  loadOlder,
  type,
}) => {
  const { user } = useAuth();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [openGitModal, setOpenGitModal] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeShareParams, setCodeShareParams] = useState<any>(null);

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
    console.log('Reply to message:', messageId);
    // TODO: Set reply context in message input
  }, []);

  const handleForward = useCallback((messageId: string) => {
    console.log('Forward message:', messageId);
    // TODO: Open forward dialog
  }, []);

  const handlePin = useCallback(async (messageId: string) => {
    console.log('Pin message:', messageId);
    // TODO: Implement API call
    // await chatAPI.pinMessage(channelId, messageId);
  }, [channelId]);

  const handleEdit = useCallback((messageId: string) => {
    console.log('Edit message:', messageId);
    // TODO: Set edit mode in message input
  }, []);

  const handleDelete = useCallback(async (messageId: string) => {
    console.log('Delete message:', messageId);
    // TODO: Implement API call
    // await chatAPI.deleteMessage(channelId, messageId);
  }, [channelId]);

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
    onForward: handleForward,
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
    handleAction(type, messageId, messageData);
  }, [handleAction]);

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
        />
      );
    });
  }, [messages, user, type, hoveredId, handleCodeShare, handleMessageAction]);

  return (
    <ScrollArea
      className="flex-1 p-4"
      style={{ height: "75vh", minHeight: "75vh", maxHeight: "75vh" }}
      ref={scrollAreaRef}
    >
      <div>
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
      </div>
    </ScrollArea>
  );
};