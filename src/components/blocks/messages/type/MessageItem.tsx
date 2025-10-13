import { memo, useEffect, useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, Heart } from "lucide-react";
import { MessageActions, MessageActionType } from "@/components/blocks/messages/MessageAction";
import Attachment from "../Attachment";
import attachmentService from "@/services/attachmentService";
import AvatarUser from "@/components/common/AvartarUser";

interface MessageItemProps {
    message: any;
    isMe: boolean;
    showSenderInfo: boolean;
    type?: string;
    user: any;
    sentStatusIds: string[];
    isLastMyMessage: boolean;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
    onCodeShare?: (params: any) => void;
    onMessageAction?: (type: MessageActionType, messageId: string, messageData?: any) => void;
    onJumpToMessage?: (id: string) => void;
}

const MessageItem = memo(({
    message,
    isMe,
    showSenderInfo,
    type,
    user,
    sentStatusIds,
    isLastMyMessage,
    hoveredId,
    onHover,
    onCodeShare,
    onMessageAction,
    onJumpToMessage,
}: MessageItemProps) => {
    const [showSentStatus, setShowSentStatus] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const menuCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

    const isHovered = hoveredId === String(message.id);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (menuCloseTimerRef.current) {
                clearTimeout(menuCloseTimerRef.current);
            }
        };
    }, []);

    // Check if message is removed
    const isRemovedMessage = message?.type === 'remove';

    // Detect file-upload messages
    const isFileUploadWithAttachments =
        message?.type === 'file-upload' &&
        message.attachments &&
        message.attachments.length > 0;

    // Check if has only image attachments
    const hasOnlyImages = message.attachments?.length > 0 &&
        message.attachments.every((att: any) => att.mimeType?.startsWith("image/"));

    // Effect for "Đã gửi" status
    useEffect(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (isMe && message.status === "sent" && isLastMyMessage && !showSentStatus) {
            setShowSentStatus(true);
            timerRef.current = setTimeout(() => {
                setShowSentStatus(false);
                timerRef.current = null;
            }, 2000);
        } else if (!isMe || message.status !== "sent" || !isLastMyMessage) {
            setShowSentStatus(false);
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isMe, message.status, isLastMyMessage, showSentStatus]);

    // Status label
    let statusLabel = null;
    if (isMe && message.status && message.type !== 'notification' && !isRemovedMessage) {
        if (message.status === "pending") {
            statusLabel = (
                <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
                    <span className="text-[11px] text-yellow-400">Đang gửi</span>
                </div>
            );
        } else if (message.status === "uploading") {
            statusLabel = (
                <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                    <span className="text-[11px] text-blue-400">Đang tải lên</span>
                </div>
            );
        } else if (message.status === "error") {
            statusLabel = (
                <div className="flex items-center gap-1">
                    <span className="text-[11px] text-red-400">⚠ Gửi thất bại</span>
                </div>
            );
        } else if (message.status === "sent" && isLastMyMessage && showSentStatus) {
            statusLabel = (
                <div className="flex items-center gap-1">
                    <span className="text-[11px] text-white">✓ Đã gửi</span>
                </div>
            );
        }
    }

    const handleAction = (actionType: MessageActionType) => {
        if (onMessageAction) {
            onMessageAction(actionType, String(message.id), message);
        }
    };

    // immediate hover: no timers, precise show/hide
    const handleMouseEnter = () => {
        // Clear any pending menu close timer when hovering back
        if (menuCloseTimerRef.current) {
            clearTimeout(menuCloseTimerRef.current);
            menuCloseTimerRef.current = null;
        }

        if (!isRemovedMessage) {
            onHover(String(message.id));
        }
    };
    const handleMouseLeave = () => {
        // Clear any pending menu close timer
        if (menuCloseTimerRef.current) {
            clearTimeout(menuCloseTimerRef.current);
        }

        // If menu is open, set timer to close it after leaving message area
        if (isMenuOpen) {
            menuCloseTimerRef.current = setTimeout(() => {
                setIsMenuOpen(false);
                onHover(null);
            }, 300);
        } else {
            onHover(null);
        }
    };

    // Handle menu open/close state
    const handleMenuOpenChange = (open: boolean) => {
        setIsMenuOpen(open);
        // If menu closes, also clear hover state
        if (!open) {
            // Add small delay to prevent flicker
            setTimeout(() => onHover(null), 50);
        }
    };

    return (
        <div
            data-message-id={message.id}
            className={cn(
                "flex gap-1 group px-3 py-1.5 transition-all duration-100 rounded-md",
                isMe ? "flex-row-reverse" : "flex-row"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Avatar */}
            {showSenderInfo && !isMe ? (
                <AvatarUser user={message?.sender} isMe={isMe} size={8} />
            ) : !isMe ? (
                <div className="w-9 flex-shrink-0" />
            ) : null}

            {/* Message content container */}
            <div className={cn(
                "relative flex flex-col gap-1 max-w-[65%] min-w-[100px]",
                isMe ? "items-end" : "items-start"
            )}>
                {/* Sender name */}
                {showSenderInfo && !isMe && !isRemovedMessage && (
                    <span className="text-[11px] font-medium text-gray-400 px-2 mb-0.5">
                        {message.sender?.username || 'Unknown'}
                    </span>
                )}

                {/* Removed Message Display */}
                {isRemovedMessage ? (
                    <div className={cn(
                        "relative flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed transition-all duration-200",
                        isMe
                            ? "bg-gray-800/30 border-gray-700/50 text-gray-500"
                            : "bg-gray-900/30 border-gray-700/50 text-gray-500"
                    )}>
                        <div className="flex-1">
                            <p className="text-[13px] italic">
                                {isMe ? "Bạn đã xóa tin nhắn này" : "Tin nhắn đã bị xóa"}
                            </p>
                            <div className={cn(
                                "flex items-center gap-1 mt-1",
                                isMe ? "justify-end" : "justify-start"
                            )}>
                                <span className="text-[10px] font-medium text-gray-600">
                                    {new Date(message.created_at || message.send_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Normal Message Display */
                    <div className="relative">
                        {/* Message Actions */}
                        <MessageActions
                            isMe={isMe}
                            isHovered={isHovered}
                            messageId={String(message.id)}
                            canEdit={isMe && message.type !== 'remove'}
                            canDelete={isMe}
                            isPinned={message.isPin || message.isPinned}
                            onAction={onMessageAction}
                            onMenuOpenChange={handleMenuOpenChange}
                        />

                        {/* Message bubble */}
                        <div className={cn(
                            "relative break-words transition-all duration-200",
                            isMe ? "rounded-lg rounded-tr-sm" : "rounded-lg rounded-tl-sm",
                            !hasOnlyImages && (
                                isMe
                                    ? "bg-blue-600 text-white shadow-sm px-3 py-2"
                                    : "bg-gray-800 text-gray-100 border border-gray-700 shadow-sm px-3 py-2"
                            ),
                            isHovered && !isMe && !hasOnlyImages && "shadow-md border-gray-600",
                            isHovered && isMe && !hasOnlyImages && "shadow-lg bg-blue-700",
                            hasOnlyImages && "bg-transparent"
                        )}>

                            {/* Reply preview cho type: reply-message */}
                            {message.type === 'reply-message' && message.replyTo && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onJumpToMessage?.(String(message.replyTo.id)); }}
                                    className={cn(
                                        "mb-2 w-full text-left group/reply rounded-md border px-2 py-1.5",
                                        isMe ? "border-blue-400/30 bg-blue-900 hover:bg-blue-600/30"
                                            : "border-gray-700 bg-gray-900/40 hover:bg-gray-900/60"
                                    )}
                                    title="Đi tới tin nhắn đã được trả lời"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={cn("w-0.5 rounded", isMe ? "bg-blue-300" : "bg-blue-500")} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[12px]">
                                                <span className="opacity-80">Trả lời </span>
                                                <span className="font-semibold">{message.replyTo.sender}</span>
                                            </div>
                                            {message.replyTo.text ? (
                                                <div className="text-[12px] opacity-80 truncate">
                                                    {message.replyTo.text}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            )}

                            {message.text && (
                                <p className={cn(
                                    "text-[14px] leading-relaxed whitespace-pre-wrap break-words",
                                    isMe ? "text-white" : "text-gray-200"
                                )}>
                                    {message.text}
                                </p>
                            )}

                            {isFileUploadWithAttachments && message.attachments && (
                                <AttachmentList
                                    attachments={message.attachments}
                                    isFileUploadWithAttachments={isFileUploadWithAttachments}
                                    isMe={isMe}
                                    hasText={!!message.text}
                                />
                            )}

                            {message.status === "uploading" && message.attachments && (
                                <div className="space-y-2 mt-2">
                                    {message.attachments.map((att: any, idx: number) => (
                                        <UploadingAttachment
                                            key={idx}
                                            att={att}
                                            isFileUpload={message.type === 'file-upload'}
                                            isMe={isMe}
                                        />
                                    ))}
                                </div>
                            )}

                            {!hasOnlyImages && (
                                <div className={cn(
                                    "flex items-center gap-1 mt-1",
                                    isMe ? "justify-end" : "justify-start"
                                )}>
                                    <span className={cn(
                                        "text-[10px] font-medium",
                                        isMe ? "text-blue-200" : "text-gray-400"
                                    )}>
                                        {new Date(message.created_at || message.send_at).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {hasOnlyImages && (
                            <div className={cn(
                                "flex items-center gap-1 mt-1 px-2",
                                isMe ? "justify-end" : "justify-start"
                            )}>
                                <span className="text-[10px] font-medium text-gray-400">
                                    {new Date(message.created_at || message.send_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                                {isMe && message.status === "sent" && (
                                    <span className="text-gray-400 text-[10px]">✓</span>
                                )}
                            </div>
                        )}

                        {/* Like Button - Always visible at bottom left for non-removed messages */}
                        {/* {!isRemovedMessage && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMessageAction?.('like', String(message.id));
                                }}
                                className={cn(
                                    "absolute -bottom-2 left-0 flex items-center gap-1 px-1.5 py-1.5 z-20 transition-all duration-200",
                                    "bg-gray-800/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-700/60",
                                    "hover:scale-105 hover:bg-gray-700/95 active:scale-95 hover:shadow-xl",
                                    message.isLiked && "bg-red-500/15 border-red-500/40 shadow-red-500/20"
                                )}
                                title={message.isLiked ? "Bỏ thích" : "Thích"}
                            >
                                <Heart className={cn(
                                    "h-3 w-3 transition-all duration-200",
                                    message.isLiked
                                        ? "fill-red-400 text-red-400 scale-110"
                                        : "text-gray-400 hover:text-red-400 hover:fill-red-400"
                                )} />
                                {(message.likeCount > 0) && (
                                    <span className="text-[10px] font-semibold text-gray-200 min-w-[10px] text-center">
                                        {message.likeCount}
                                    </span>
                                )}
                            </button>
                        )} */}
                    </div>
                )}

                {statusLabel && (
                    <div className={cn(
                        "px-2 flex items-center",
                        isMe ? "justify-end" : "justify-start"
                    )}>
                        {statusLabel}
                    </div>
                )}
            </div>
        </div>
    );
});

MessageItem.displayName = "MessageItem";

// Attachment List Component
const AttachmentList = memo(({
    attachments,
    isFileUploadWithAttachments,
    isMe,
    hasText
}: {
    attachments: any[];
    isFileUploadWithAttachments: boolean;
    isMe: boolean;
    hasText: boolean;
}) => {
    const allImages = attachments.every((att: any) => att.mimeType?.startsWith("image/"));

    return (
        <div className={cn(
            isFileUploadWithAttachments ? 'grid grid-cols-1 gap-2' : 'flex flex-wrap gap-2',
            hasText ? 'mt-2' : ''
        )}>
            {attachments.map((att: any) => (
                <div
                    key={att.key || att.id}
                    className={cn(
                        "overflow-hidden",
                        allImages ? "rounded-lg" : "rounded-md",
                        isFileUploadWithAttachments ? 'w-full' : 'inline-block'
                    )}
                >
                    {att.uploading ? (
                        <UploadingAttachment
                            att={att}
                            isFileUpload={isFileUploadWithAttachments}
                            isMe={isMe}
                        />
                    ) : (
                        <Attachment
                            keyName={att.key}
                            fileUrl={att.fileUrl}
                            filename={att.filename}
                            mimeType={att.mimeType}
                            fileSize={att.fileSize}
                            className={cn(
                                "shadow-sm transition-transform hover:scale-[1.02]",
                                allImages ? "rounded-lg" : "rounded-md",
                                isFileUploadWithAttachments ? 'w-full' : 'max-w-[150px] max-h-40',
                                att.mimeType?.startsWith("image/") ? "object-cover" : "object-contain"
                            )}
                            style={isFileUploadWithAttachments ? { maxHeight: 360 } : { maxHeight: 200 }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
});

AttachmentList.displayName = "AttachmentList";

// Uploading Attachment Component
const UploadingAttachment = memo(({
    att,
    isFileUpload,
    isMe
}: {
    att: any;
    isFileUpload: boolean;
    isMe: boolean;
}) => {
    const isImage = att.mimeType?.startsWith("image/");

    return (
        <div className={cn(
            "relative overflow-hidden backdrop-blur-sm border shadow-sm",
            isImage ? "rounded-lg" : "rounded-md",
            isMe
                ? "bg-blue-600/20 border-blue-500/30"
                : "bg-gray-700/50 border-gray-600",
            isFileUpload ? 'w-full p-3' : 'max-w-xs p-3'
        )}>
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        isMe ? "bg-blue-500/30" : "bg-gray-600"
                    )}>
                        {att.mimeType?.startsWith("image/") ? (
                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        ) : att.mimeType?.startsWith("video/") ? (
                            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className={cn(
                        "text-sm font-medium truncate mb-1",
                        isMe ? "text-white" : "text-gray-200"
                    )}>
                        {att.filename || "Đang tải lên..."}
                    </div>
                    {att.fileSize && (
                        <div className={cn(
                            "text-xs mb-2",
                            isMe ? "text-blue-200" : "text-gray-400"
                        )}>
                            {attachmentService.formatFileSize(att.fileSize)}
                        </div>
                    )}

                    <div className="relative w-full h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
                                isMe ? "bg-blue-400" : "bg-blue-500"
                            )}
                            style={{ width: `${att.progress || 0}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center mt-1.5">
                        <span className={cn(
                            "text-[10px] font-medium",
                            isMe ? "text-blue-200" : "text-gray-400"
                        )}>
                            Đang tải lên...
                        </span>
                        <span className={cn(
                            "text-[10px] font-semibold",
                            isMe ? "text-white" : "text-blue-400"
                        )}>
                            {Math.round(att.progress || 0)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

UploadingAttachment.displayName = "UploadingAttachment";

export default MessageItem;