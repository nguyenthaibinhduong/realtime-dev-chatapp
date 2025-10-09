import { memo, useEffect, useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { MessageActions, MessageActionType } from "@/components/blocks/messages/MessageAction";
import Attachment from "../Attachment";
import attachmentService from "@/services/attachmentService";

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
}: MessageItemProps) => {
    const [showSentStatus, setShowSentStatus] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const isHovered = hoveredId === String(message.id);

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
    if (isMe && message.status && message.type !== 'notification') {
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
                    <span className="text-[11px] text-green-400">✓ Đã gửi</span>
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
        onHover(String(message.id));
    };
    const handleMouseLeave = () => {
        onHover(null);
    };

    return (
        <div
            className={cn(
                // vùng hover rộng, nhưng hide/show actions ngay lập tức
                "flex gap-1 group px-3 py-1.5 transition-all duration-100 rounded-md",
                isMe ? "flex-row-reverse" : "flex-row"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Avatar */}
            {showSenderInfo && !isMe ? (
                <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-gray-700 shadow-sm">
                    <AvatarImage src={message.sender?.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-semibold">
                        {message.sender?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
            ) : !isMe ? (
                <div className="w-9 flex-shrink-0" />
            ) : null}

            {/* Message content container */}
            <div className={cn(
                "relative flex flex-col gap-1 max-w-[65%] min-w-[100px]",
                isMe ? "items-end" : "items-start"
            )}>
                {/* Sender name */}
                {showSenderInfo && !isMe && (
                    <span className="text-[11px] font-medium text-gray-400 px-2 mb-0.5">
                        {message.sender?.username || 'Unknown'}
                    </span>
                )}

                {/* Message bubble with relative positioning for actions */}
                <div className="relative">
                    {/* Message Actions */}
                    <MessageActions
                        isMe={isMe}
                        isHovered={isHovered}
                        messageId={String(message.id)}
                        canEdit={isMe && message.status === 'sent'}
                        canDelete={isMe}
                        isPinned={message.isPinned}
                        isLiked={message.isLiked}
                        likeCount={message.likeCount || 0}
                        onAction={handleAction}
                        onMenuOpenChange={() => { /* optional - no timers needed */ }}
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
                                {isMe && message.status === "sent" && (
                                    <span className="text-blue-200 text-[10px]">✓</span>
                                )}
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

                    {message.likeCount > 0 && !isHovered && (
                        <div className={cn(
                            "absolute -bottom-2 flex items-center gap-1 px-2 py-0.5 z-10",
                            "bg-gray-700/90 backdrop-blur-sm rounded-full shadow-md border border-gray-600",
                            isMe ? "right-2" : "left-2"
                        )}>
                            <span className="text-xs">❤️</span>
                            <span className="text-[10px] font-semibold text-gray-200">
                                {message.likeCount}
                            </span>
                        </div>
                    )}
                </div>

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
                        // Bo góc nhỏ hơn giống Zalo
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
            // Bo góc nhỏ hơn
            isImage ? "rounded-lg" : "rounded-md",
            isMe
                ? "bg-blue-600/20 border-blue-500/30"
                : "bg-gray-700/50 border-gray-600",
            isFileUpload ? 'w-full p-3' : 'max-w-xs p-3'
        )}>
            <div className="flex items-center gap-3">
                {/* File icon */}
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

                {/* File info */}
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

                    {/* Progress bar */}
                    <div className="relative w-full h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "absolute top-0 left-0 h-full rounded-full transition-all duration-300",
                                isMe ? "bg-blue-400" : "bg-blue-500"
                            )}
                            style={{ width: `${att.progress || 0}%` }}
                        />
                    </div>

                    {/* Progress text */}
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