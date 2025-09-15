import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message as MessageBubble } from "./Message";
import { useRef, useEffect, useState, useCallback } from "react";
import { MessageListProps } from "@/types/message";
import { Loader2 } from "lucide-react";
import attachmentService from "@/services/attachmentService";
import Attachment from "./Attachment";

function shouldShowSenderInfo(messages: any[], idx: number, userId: any) {
  if (idx === 0) return true;
  const curr = messages[idx];
  const prev = messages[idx - 1];
  if (!curr?.sender || !prev?.sender) return true;
  // hiển thị nếu khác người gửi hoặc cách > 5 phút
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
  type?: string; // Loại kênh: group, group-private, personal
};

export const MessageList: React.FC<Props> = ({
  messages,
  channelId,
  onPrependMessages,
  loadOlder,
  type,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sentStatusIds, setSentStatusIds] = useState<string[]>([]);

  // Theo dõi các tin nhắn vừa chuyển sang trạng thái "sent"
  useEffect(() => {
    messages.forEach((message: any) => {
      const isMe = message?.sender?.id === user?.id;
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
    // eslint-disable-next-line
  }, [messages]);

  // cờ để chặn auto-scroll-bottom khi prepend
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

  const firstMsgId = messages.length > 0 ? String(messages[0].id) : undefined;

  const handleScroll = useCallback(async () => {
    if (!scrollAreaRef.current || loadingMore || !hasMore || !loadOlder) return;

    // ✅ viewport đúng của shadcn/ui – Radix
    const viewport = scrollAreaRef.current.querySelector(
      "div[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;
    if (!viewport) return;

    // gần đỉnh → load older
    if (viewport.scrollTop <= 40 && messages.length > 0) {
      setLoadingMore(true);
      isPrependingRef.current = true;

      const prevScrollHeight = viewport.scrollHeight;

      try {
        const res = await loadOlder(channelId, firstMsgId!, 50); // lấy thêm 50 tin cũ hơn
        const newItems = Array.isArray(res?.items) ? res.items : [];

        if (newItems.length > 0) {
          onPrependMessages?.(newItems);

          if (typeof res?.hasMoreOlder === "boolean")
            setHasMore(res.hasMoreOlder);
          else setHasMore(newItems.length >= 50);

          // bù scroll để không nhảy vị trí
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

  return (
    <ScrollArea
      className="flex-1 p-4"
      style={{ height: "75vh", minHeight: "75vh", maxHeight: "75vh" }}
      ref={scrollAreaRef}
    >
      <div>
        {loadingMore && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-xs text-muted-foreground">
              Đang tải thêm tin nhắn...
            </span>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message: any, idx: number) => {
            const isMe = message?.sender?.id === user?.id;
            const showSenderInfo =
              !isMe && shouldShowSenderInfo(messages, idx, user?.id);

            // Xác định trạng thái gửi tin nhắn
            let statusLabel = null;
            // Chỉ hiện "Đã gửi" cho tin nhắn cuối cùng của mình
            const isLastMyMessage =
              isMe &&
              idx === messages.length - 1 &&
              message.status === "sent" &&
              sentStatusIds.includes(String(message.id));

            if (isMe && message.status) {
              if (message.status === "pending") {
                statusLabel = (
                  <span className="text-xs text-yellow-400 animate-pulse">
                    Đang gửi...
                  </span>
                );
              } else if (message.status === "error") {
                statusLabel = (
                  <span className="text-xs text-red-500">
                    Lỗi! Không gửi được
                  </span>
                );
              } else if (isLastMyMessage) {
                statusLabel = (
                  <span className="text-xs text-green-400">Đã gửi</span>
                );
              }
            }

            return (
              <div key={message.id} className="flex flex-col items-end">
                <div
                  className={`flex ${isMe ? "justify-end" : "justify-start"} space-x-3 w-full`}
                >
                  {!isMe && showSenderInfo && (
                    <div className="relative flex flex-col items-center justify-center">
                      <Avatar
                        className="h-8 w-8 flex-shrink-0 cursor-pointer"
                        onMouseEnter={() => setHoveredId(message.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {message?.sender?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {/* Nếu type khác personal và không phải tin nhắn của mình thì hiện username phía trên avatar */}

                      {hoveredId === message.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-10 px-2 py-1 bg-black text-white text-xs rounded shadow z-10 whitespace-nowrap">
                          {message?.sender?.username}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    {type !== "personal" && !isMe && showSenderInfo && (
                      <span className="ms-2 block text-xs text-white/80 mt-1 mb-1 text-center">
                        {message?.sender?.username}
                      </span>
                    )}
                    <div
                      className={`min-w-0 rounded-2xl px-4 py-2 flex flex-col ${
                        isMe
                          ? "bg-blue-600 text-white "
                          : "bg-gray-700 text-white " +
                            (showSenderInfo ? " " : " ml-[43px]")
                      } ${message?.type === "code" ? "w-[80%] bg-transparent" : ""}`}
                    >
                      <div className="flex justify-start mb-1 items-center">
                        <p
                          className={`text-xs text-white/60 whitespace-nowrap`}
                        >
                          {new Date(
                            message.send_at || message.created_at
                          ).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="text-sm whitespace-pre-wrap break-words">
                        <MessageBubble text={message.text} />
                      </div>

                      {/* attachments nếu có */}
                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.attachments.map((att: any) => (
                              <div
                                key={att.key || att.id}
                                className="inline-block"
                              >
                                <Attachment
                                  keyName={att.key} // storage key để component fetch presigned URL
                                  fileUrl={att.fileUrl} // nếu đã có public URL, component sẽ ưu tiên
                                  filename={att.filename}
                                  mimeType={att.mimeType}
                                  fileSize={att.fileSize}
                                  className="max-w-xs rounded shadow-sm"
                                  style={{ maxHeight: 200 }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                {/* Hiển thị statusLabel ở ngoài, dưới cùng mỗi tin nhắn của mình */}
                {isMe && statusLabel && (
                  <div className="mt-1 me-2 flex justify-end w-full">
                    {statusLabel}
                  </div>
                )}
              </div>
            );
          })}

          {/* đáy danh sách — để auto scroll */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </ScrollArea>
  );
};
