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
            className="group bg-gray-700/30 hover:bg-gray-700/50 rounded px-2 py-1.5 transition-all cursor-pointer border border-gray-600/30 hover:border-gray-500/50"
            onClick={() => onJumpToMessage?.(String(message.id))}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-gray-300 truncate">
                            {message.sender?.username || message.sender?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">
                            {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 break-words leading-tight">
                        {getMessagePreview(message)}
                    </p>
                </div>

                {showUnpin && onUnpin && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUnpin(String(message.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200 flex-shrink-0"
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
                "bg-gray-800 border-l-2 border-gray-600 shadow-lg rounded-md mb-2",
                className
            )}>
                {/* Header với số lượng và nút xem thêm */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-gray-700/50 rounded-t-md">
                    <div className="flex items-center gap-1.5">
                        <Pin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-300">
                            {messages.length} tin ghim
                        </span>
                    </div>

                    {hasMore && (
                        <button
                            onClick={() => setShowAllDialog(true)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            Xem thêm
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {/* Hiển thị 2 tin nhắn mới nhất */}
                <div className="p-1.5">
                    <div className="space-y-1">
                        {displayMessages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Dialog hiển thị tất cả tin nhắn ghim */}
            <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
                <DialogContent className="sm:max-w-[600px] z-[999] bg-gray-800 border-gray-600">
                    <DialogHeader>
                        <DialogTitle className="text-gray-200 flex items-center gap-2">
                            <Pin className="h-4 w-4" />
                            Tất cả tin nhắn ghim ({messages.length})
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto">
                        <div className="space-y-2 pr-2">
                            {sortedMessages.map((message) => (
                                <div key={message.id} className="p-3 bg-gray-700/30 rounded-md">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-medium text-gray-300">
                                                    {message.sender?.username || message.sender?.name || 'Unknown'}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(message.created_at).toLocaleDateString('vi-VN', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 break-words cursor-pointer hover:text-gray-300"
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
                                                className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-gray-200 flex-shrink-0"
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