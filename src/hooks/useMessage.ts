import { useRef, useEffect, useCallback, useState } from "react";

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