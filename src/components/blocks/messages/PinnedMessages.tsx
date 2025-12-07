import React, { useState } from 'react';
import { Pin, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface PinnedMessage {
    id: string | number;
    text: string;
    sender: {
        id: string | number;
        username: string;
        name?: string;
    };
    created_at: string;
    attachments?: any[];
}

interface PinnedMessagesProps {
    messages: PinnedMessage[];
    onUnpin?: (messageId: string) => void;
    onJumpToMessage?: (messageId: string) => void;
    className?: string;
}

export const PinnedMessages: React.FC<PinnedMessagesProps> = React.memo(({
    messages,
    onUnpin,
    onJumpToMessage,
    className,
}) => {
    const [showAllDialog, setShowAllDialog] = useState(false);

    console.log('📌 PinnedMessages render (Real-time):', {
        messagesCount: messages?.length || 0,
        timestamp: new Date().toLocaleTimeString(),
        messages: messages?.map(m => ({
            id: m.id,
            text: m.text?.substring(0, 15) + '...',
            created_at: new Date(m.created_at).toLocaleTimeString()
        })) || []
    });

    if (!messages || messages.length === 0) return null;

    // Sắp xếp tin nhắn theo thời gian mới nhất và chỉ lấy 2 tin nhắn đầu
    const sortedMessages = [...messages].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const displayMessages = sortedMessages.slice(0, 2);
    const hasMore = messages.length > 2;



    const truncateText = (text: string, maxLength: number = 40) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const getMessagePreview = (message: PinnedMessage) => {
        if (message.text) {
            return truncateText(message.text);
        }
        if (message.attachments && message.attachments.length > 0) {
            return `[${message.attachments.length} tệp đính kèm]`;
        }
        return 'Tin nhắn không có nội dung';
    };

    const MessageItem = ({ message, showUnpin = true }: { message: PinnedMessage; showUnpin?: boolean }) => (
        <div
            className="group relative overflow-hidden rounded-lg cursor-pointer
                bg-white/80 dark:bg-black/40
                backdrop-blur-xl
                border border-blue-200/40 dark:border-blue-500/20
                shadow-[0_4px_16px_0_rgba(59,130,246,0.1)] dark:shadow-[0_4px_16px_0_rgba(59,130,246,0.2)]
                hover:shadow-[0_8px_24px_0_rgba(59,130,246,0.2)] dark:hover:shadow-[0_8px_24px_0_rgba(59,130,246,0.3)]
                hover:border-blue-400/60 dark:hover:border-blue-500/50
                transition-all duration-300
                px-3 py-2"
            onClick={() => onJumpToMessage?.(String(message.id))}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent dark:from-blue-500/10 dark:via-transparent dark:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center justify-between gap-2 z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
                            {message.sender?.username || message.sender?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 break-words leading-tight">
                        {getMessagePreview(message)}
                    </p>
                </div>

                {showUnpin && onUnpin && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUnpin(String(message.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300
                            p-1.5 rounded-md
                            bg-white/80 dark:bg-black/40
                            backdrop-blur-md
                            border border-red-200/40 dark:border-red-500/20
                            hover:border-red-400/60 dark:hover:border-red-500/50
                            shadow-[0_2px_8px_0_rgba(239,68,68,0.1)] dark:shadow-[0_2px_8px_0_rgba(239,68,68,0.2)]
                            hover:shadow-[0_4px_12px_0_rgba(239,68,68,0.3)] dark:hover:shadow-[0_4px_12px_0_rgba(239,68,68,0.4)]
                            text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
                            flex-shrink-0 hover:scale-110 active:scale-95"
                        title="Bỏ ghim"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className={cn(
                "relative overflow-hidden rounded-xl mb-2",
                "bg-white/80 dark:bg-black/40",
                "backdrop-blur-xl",
                "border-l-4 border-blue-500/60 dark:border-blue-500/50",
                "shadow-[0_8px_32px_0_rgba(59,130,246,0.15)] dark:shadow-[0_8px_32px_0_rgba(59,130,246,0.25)]",
                className
            )}>
                {/* Gradient overlay */}


                {/* Header với số lượng và nút xem thêm - Liquid Glass Style */}
                <div className="relative z-10 flex items-center justify-between px-3 py-2
                    bg-white/60 dark:bg-black/30
                    backdrop-blur-md
                    border-b border-blue-200/30 dark:border-blue-500/20">


                    {hasMore && (
                        <button
                            onClick={() => setShowAllDialog(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg
                                bg-white/80 dark:bg-black/40
                                backdrop-blur-md
                                border border-blue-200/40 dark:border-blue-500/20
                                shadow-[0_2px_8px_0_rgba(59,130,246,0.1)] dark:shadow-[0_2px_8px_0_rgba(59,130,246,0.2)]
                                hover:shadow-[0_4px_12px_0_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_12px_0_rgba(59,130,246,0.3)]
                                hover:border-blue-400/60 dark:hover:border-blue-500/50
                                text-xs font-medium text-blue-600 dark:text-blue-400
                                hover:text-blue-700 dark:hover:text-blue-300
                                transition-all duration-300
                                hover:scale-105 active:scale-95"
                        >
                            Xem thêm
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Hiển thị 2 tin nhắn mới nhất */}
                <div className="relative z-10 p-2">
                    <div className="space-y-2">
                        {displayMessages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Dialog hiển thị tất cả tin nhắn ghim - Liquid Glass Style */}
            <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
                <DialogContent className="sm:max-w-[600px] z-[999]
                    bg-white/95 dark:bg-zinc-900/95
                    backdrop-blur-2xl
                    border border-blue-200/40 dark:border-blue-500/30
                    shadow-[0_20px_80px_0_rgba(59,130,246,0.2)] dark:shadow-[0_20px_80px_0_rgba(59,130,246,0.3)]">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl
                                bg-blue-500/10 dark:bg-blue-500/20
                                border border-blue-200/40 dark:border-blue-500/30
                                shadow-[0_4px_16px_0_rgba(59,130,246,0.15)] dark:shadow-[0_4px_16px_0_rgba(59,130,246,0.25)]">
                                <Pin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-lg font-bold">
                                Tất cả tin nhắn ghim
                                <span className="ml-2 px-2 py-0.5 rounded-lg text-sm
                                    bg-blue-500/10 dark:bg-blue-500/20
                                    border border-blue-200/40 dark:border-blue-500/30
                                    text-blue-600 dark:text-blue-400">
                                    {messages.length}
                                </span>
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto pr-2
                        scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent
                        hover:scrollbar-thumb-blue-500/30">
                        <div className="space-y-3">
                            {sortedMessages.map((message) => (
                                <div key={message.id}
                                    className="group relative overflow-hidden rounded-xl
                                        bg-white/80 dark:bg-black/40
                                        backdrop-blur-xl
                                        border border-blue-200/40 dark:border-blue-500/20
                                        shadow-[0_4px_16px_0_rgba(59,130,246,0.1)] dark:shadow-[0_4px_16px_0_rgba(59,130,246,0.2)]
                                        hover:shadow-[0_8px_24px_0_rgba(59,130,246,0.2)] dark:hover:shadow-[0_8px_24px_0_rgba(59,130,246,0.3)]
                                        hover:border-blue-400/60 dark:hover:border-blue-500/50
                                        transition-all duration-300
                                        p-4">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent dark:from-blue-500/10 dark:via-transparent dark:to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="relative z-10 flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                    {message.sender?.username || message.sender?.name || 'Unknown'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md text-xs
                                                    bg-white/80 dark:bg-black/40
                                                    backdrop-blur-md
                                                    border border-gray-200/40 dark:border-gray-500/20
                                                    text-gray-600 dark:text-gray-400">
                                                    {new Date(message.created_at).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 break-words cursor-pointer
                                                hover:text-blue-600 dark:hover:text-blue-400
                                                transition-colors duration-200"
                                                onClick={() => {
                                                    onJumpToMessage?.(String(message.id));
                                                    setShowAllDialog(false);
                                                }}>
                                                {message.text ||
                                                    (message.attachments && message.attachments.length > 0
                                                        ? `[${message.attachments.length} tệp đính kèm]`
                                                        : 'Tin nhắn không có nội dung')}
                                            </p>
                                        </div>

                                        {onUnpin && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onUnpin(String(message.id));
                                                }}
                                                className="p-2 rounded-lg
                                                    bg-white/80 dark:bg-black/40
                                                    backdrop-blur-md
                                                    border border-red-200/40 dark:border-red-500/20
                                                    shadow-[0_2px_8px_0_rgba(239,68,68,0.1)] dark:shadow-[0_2px_8px_0_rgba(239,68,68,0.2)]
                                                    hover:shadow-[0_4px_12px_0_rgba(239,68,68,0.3)] dark:hover:shadow-[0_4px_12px_0_rgba(239,68,68,0.4)]
                                                    hover:border-red-400/60 dark:hover:border-red-500/50
                                                    text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300
                                                    transition-all duration-300
                                                    hover:scale-110 active:scale-95
                                                    flex-shrink-0"
                                                title="Bỏ ghim"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
});

PinnedMessages.displayName = 'PinnedMessages';