import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message as MessageBubble } from "./Message";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { MessageListProps } from "@/types/message";
import { Loader2 } from "lucide-react";

function shouldShowSenderInfo(messages: any[], idx: number, userId: any) {
    if (idx === 0) return true;
    const curr = messages[idx];
    const prev = messages[idx - 1];
    if (!curr?.sender || !prev?.sender) return true;
    // hiển thị nếu khác người gửi hoặc cách > 5 phút
    return (
        curr.sender.id !== prev.sender.id ||
        Math.abs(new Date(curr.created_at || curr.send_at).getTime() - new Date(prev.created_at || prev.send_at).getTime()) >
        5 * 60 * 1000
    );
}

type Props = MessageListProps & {
    channelId: string;
    onPrependMessages?: (msgs: any[]) => void;
    loadOlder?: (channelId: string, beforeId: string, pageSize?: number) => Promise<{
        items: any[];
        hasMoreOlder?: boolean;
        cursors?: any;
    }>;
};

export const MessageList: React.FC<Props> = ({
    messages,                    // ASC: cũ → mới
    channelId,
    onPrependMessages,
    loadOlder,
}) => {
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { user } = useAuth();

    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

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

                    if (typeof res?.hasMoreOlder === "boolean") setHasMore(res.hasMoreOlder);
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
    }, [channelId, firstMsgId, hasMore, loadOlder, loadingMore, messages.length, onPrependMessages]);

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
                        <span className="text-xs text-muted-foreground">Đang tải thêm tin nhắn...</span>
                    </div>
                )}

                <div className="space-y-4">
                    {messages.map((message: any, idx: number) => {
                        const isMe = message?.sender?.id === user?.id;
                        const showSenderInfo = !isMe && shouldShowSenderInfo(messages, idx, user?.id);

                        return (
                            <div
                                key={message.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"} space-x-3`}
                            >
                                {!isMe && showSenderInfo && (
                                    <div className="relative flex items-center">
                                        <Avatar
                                            className="h-8 w-8 flex-shrink-0 cursor-pointer"
                                            onMouseEnter={() => setHoveredId(message.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                                {message?.sender?.username?.[0]?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        {hoveredId === message.id && (
                                            <div className="absolute left-1/2 -translate-x-1/2 top-10 px-2 py-1 bg-black text-white text-xs rounded shadow z-10 whitespace-nowrap">
                                                {message?.sender?.username}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div
                                    className={`min-w-0 rounded-2xl px-4 py-2 ${isMe
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-gray-700 text-white rounded-bl-none" + (showSenderInfo ? " " : " pl-10 ml-10")
                                        } ${message?.type === "code" ? "w-[80%] bg-transparent" : ""}`}
                                >
                                    <div className="flex justify-start mb-1 items-center">
                                        {!isMe && showSenderInfo && (
                                            <p className="text-sm font-medium">{message?.sender?.username}</p>
                                        )}
                                        <p className={`text-xs text-white/60 ${isMe ? "" : "ml-2"} whitespace-nowrap`}>
                                            {new Date(message.send_at || message.created_at).toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>

                                    <div className="text-sm whitespace-pre-wrap break-words">
                                        <MessageBubble text={message.text} />
                                    </div>
                                </div>
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
