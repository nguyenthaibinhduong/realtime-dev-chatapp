import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "./Message";
import React from "react";
import { MessageListProps } from "@/types/message";

function shouldShowSenderInfo(messages: any[], idx: number, userId: any) {
    if (idx === 0) return true;
    const curr = messages[idx];
    const prev = messages[idx - 1];
    // Nếu khác sender hoặc cách nhau hơn 5 phút thì show info
    if (
        curr.sender.id !== prev.sender.id ||
        Math.abs(new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime()) > 5 * 60 * 1000
    ) {
        return true;
    }
    // Nếu là tin đầu hoặc khác ngày cũng show
    return false;
}

export const MessageList = ({ messages }: MessageListProps) => {
    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const [hoveredId, setHoveredId] = React.useState<string | null>(null);
    const { user } = useAuth();

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <ScrollArea
            className="flex-1 p-4"
            style={{ height: "75vh", minHeight: "75vh", maxHeight: "75vh" }}
        >
            <div className="space-y-4">
                {messages.map((message: any, idx: number) => {
                    const isMe = message.sender.id === user?.id;
                    const showSenderInfo = !isMe && shouldShowSenderInfo(messages, idx, user?.id);

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} space-x-3`}
                        >
                            {!isMe && showSenderInfo && (
                                <div className="relative flex items-center">
                                    <Avatar
                                        className="h-8 w-8 flex-shrink-0 cursor-pointer"
                                        onMouseEnter={() => setHoveredId(message.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    >
                                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                            {message.sender.username?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    {hoveredId == message.id && (
                                        <div className="absolute left-1/2 -translate-x-1/2 top-10 px-2 py-1 bg-black text-white text-xs rounded shadow z-10 whitespace-nowrap">
                                            {message.sender.username}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div
                                className={`min-w-0 rounded-2xl px-4 py-2 ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-700 text-white rounded-bl-none' + (showSenderInfo ? ' ' : 'pl-10 ml-10')
                                    }  ${message?.type == 'code' ? 'w-[80%] bg-transparent' : ''}`}
                            >
                                <div className="flex justify-start mb-1 items-center">
                                    {!isMe && showSenderInfo && (
                                        <p className="text-sm font-medium">
                                            {message.sender.username}
                                        </p>
                                    )}
                                    <p className={`text-xs text-white/60 ${isMe ? '' : 'ml-2'} whitespace-nowrap`}>
                                        {message.send_at
                                            ? new Date(message.send_at).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                    </p>
                                </div>
                                <div className="text-sm whitespace-pre-wrap break-words">
                                    <Message text={message.text} />
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
    );
};
