import { useRef, useEffect, useCallback, useState } from "react";
import { useToast } from '@/hooks/useToast';
import { MessageActionType } from "@/components/blocks/messages/MessageAction";

interface UseMessageActionsProps {
    onLike?: (messageId: string) => Promise<void>;
    onReply?: (messageId: string) => void;
    onForward?: (messageId: string) => void;
    onPin?: (messageId: string) => Promise<void>;
    onEdit?: (messageId: string) => void;
    onDelete?: (messageId: string) => Promise<void>;
    onCopy?: (messageId: string, text: string) => void;
    onShare?: (messageId: string) => void;
}

export const useMessageActions = ({
    onLike,
    onReply,
    onForward,
    onPin,
    onEdit,
    onDelete,
    onCopy,
    onShare,
}: UseMessageActionsProps = {}) => {
    const { toast } = useToast();

    const handleAction = useCallback(async (
        type: MessageActionType, 
        messageId: string,
        messageData?: any
    ) => {
        console.log(`Action: ${type} on message ${messageId}`);

        try {
            switch (type) {
                case 'like':
                    if (onLike) {
                        await onLike(messageId);
                        toast({
                            description: "👍 Đã thích tin nhắn",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Like handler not provided');
                    }
                    break;

                case 'reply':
                    if (onReply) {
                        onReply(messageId);
                        toast({
                            description: "💬 Đang trả lời...",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Reply handler not provided');
                    }
                    break;

                case 'forward':
                    if (onForward) {
                        onForward(messageId);
                        toast({
                            description: "➡️ Chuyển tiếp tin nhắn",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Forward handler not provided');
                    }
                    break;

                case 'pin':
                    if (onPin) {
                        await onPin(messageId);
                        toast({
                            description: "📌 Đã ghim tin nhắn",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Pin handler not provided');
                    }
                    break;

                case 'edit':
                    if (onEdit) {
                        onEdit(messageId);
                        toast({
                            description: "✏️ Đang chỉnh sửa...",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Edit handler not provided');
                    }
                    break;

                case 'delete':
                    if (onDelete) {
                        // Confirm before delete
                        if (window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
                            await onDelete(messageId);
                            toast({
                                description: "🗑️ Đã xóa tin nhắn",
                                duration: 2000,
                            });
                        }
                    } else {
                        console.warn('Delete handler not provided');
                    }
                    break;

                case 'copy':
                    if (onCopy && messageData?.text) {
                        onCopy(messageId, messageData.text);
                        // Copy to clipboard
                        await navigator.clipboard.writeText(messageData.text);
                        toast({
                            description: "📋 Đã sao chép",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Copy handler not provided or no text');
                    }
                    break;

                case 'share':
                    if (onShare) {
                        onShare(messageId);
                        toast({
                            description: "📤 Đang chia sẻ...",
                            duration: 2000,
                        });
                    } else {
                        console.warn('Share handler not provided');
                    }
                    break;

                default:
                    console.warn(`Unknown action type: ${type}`);
                    break;
            }
        } catch (error) {
            console.error(`Error handling ${type} action:`, error);
            toast({
                title: "Lỗi",
                description: `Không thể ${type} tin nhắn`,
                variant: "destructive",
                duration: 3000,
            });
        }
    }, [onLike, onReply, onForward, onPin, onEdit, onDelete, onCopy, onShare, toast]);

    return { handleAction };
};

interface UseMessageScrollProps {
  messages: any[];
  channelId: string;
  firstMsgId?: string;
  hasMore: boolean;
  loadingMore: boolean;
  loadOlder?: (channelId: string, beforeId: string, pageSize?: number) => Promise<any>;
  onPrependMessages?: (msgs: any[]) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
}

export const useMessageScroll = ({
  messages,
  channelId,
  firstMsgId,
  hasMore,
  loadingMore,
  loadOlder,
  onPrependMessages,
  setLoadingMore,
  setHasMore,
}: UseMessageScrollProps) => {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isPrependingRef = useRef(false);
  const prevLenRef = useRef<number>(messages.length);

  // Scroll xuống đáy khi mount lần đầu
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // Auto scroll xuống đáy khi có tin mới (không phải prepend)
  useEffect(() => {
    const grew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;

    if (isPrependingRef.current) {
      isPrependingRef.current = false;
      return;
    }
    if (grew && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const handleScroll = useCallback(async () => {
    if (!scrollAreaRef.current || loadingMore || !hasMore || !loadOlder) return;

    const viewport = scrollAreaRef.current.querySelector(
      "div[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
    if (!viewport) return;

    if (viewport.scrollTop <= 40 && messages.length > 0) {
      setLoadingMore(true);
      isPrependingRef.current = true;

      const prevScrollHeight = viewport.scrollHeight;

      try {
        const res = await loadOlder(channelId, firstMsgId!, 50);
        const newItems = Array.isArray(res?.items) ? res.items : [];

        if (newItems.length > 0) {
          onPrependMessages?.(newItems);

          if (typeof res?.hasMoreOlder === "boolean")
            setHasMore(res.hasMoreOlder);
          else setHasMore(newItems.length >= 50);

          requestAnimationFrame(() => {
            const newScrollHeight = viewport.scrollHeight;
            const delta = newScrollHeight - prevScrollHeight;
            viewport.scrollTop = viewport.scrollTop + delta;
          });
        } else {
          setHasMore(false);
        }
      } catch {
        setHasMore(false);
      } finally {
        setLoadingMore(false);
      }
    }
  }, [
    channelId,
    firstMsgId,
    hasMore,
    loadOlder,
    loadingMore,
    messages.length,
    onPrependMessages,
    setLoadingMore,
    setHasMore,
  ]);

  // attach scroll listener
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "div[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
    if (!viewport) return;
    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return { scrollAreaRef, messagesEndRef };
};


export const useMessageStatus = (messages: any[], userId: any) => {
  const [sentStatusIds, setSentStatusIds] = useState<string[]>([]);

  useEffect(() => {
    messages.forEach((message: any) => {
      const isMe = message?.sender?.id === userId;
      if (
        isMe &&
        message.status === "sent" &&
        !sentStatusIds.includes(String(message.id))
      ) {
        setSentStatusIds((prev) => [...prev, String(message.id)]);
        setTimeout(() => {
          setSentStatusIds((prev) =>
            prev.filter((id) => id !== String(message.id))
          );
        }, 3000);
      }
    });
  }, [messages, userId, sentStatusIds]);

  return { sentStatusIds };
};