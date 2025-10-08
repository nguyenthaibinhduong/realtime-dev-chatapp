import { memo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Code, Loader2 } from "lucide-react";
import { Message as MessageBubble } from "@/components/blocks/messages/Message";
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
}: MessageItemProps) => {
    // Detect file-upload messages that carry attachments
    const isFileUploadWithAttachments =
        message?.type === 'file-upload' &&
        message.attachments &&
        message.attachments.length > 0;

    // Xác định trạng thái gửi tin nhắn
    let statusLabel = null;
    if (isMe && message.status && message.type !== 'notification') {
        if (message.status === "pending") {
            statusLabel = (
                <span className="text-xs text-yellow-400 animate-pulse">
                    Đang gửi...
                </span>
            );
        } else if (message.status === "uploading") {
            statusLabel = (
                <span className="text-xs text-blue-400 animate-pulse flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Đang upload...
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

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex flex-col items-end">
            <div className={`flex ${isMe ? "justify-end" : "justify-start"} space-x-3 w-full`}>
                {!isMe && showSenderInfo && (
                    <div className="relative flex flex-col items-center justify-center">
                        <Avatar
                            className="h-8 w-8 flex-shrink-0 cursor-pointer"
                            onMouseEnter={() => onHover(message.id)}
                            onMouseLeave={() => onHover(null)}
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

                <div className="flex flex-col items-start">
                    {type !== "personal" && !isMe && showSenderInfo && (
                        <span className="ms-2 block text-xs text-white/80 mt-1 mb-1 text-center">
                            {message?.sender?.username}
                        </span>
                    )}

                    <div className={
                        (() => {
                            const base = 'min-w-0 rounded-2xl flex flex-col';
                            const padding = isFileUploadWithAttachments ? 'p-0' : 'px-4 py-2';
                            const color = isFileUploadWithAttachments
                                ? 'bg-transparent text-white'
                                : isMe
                                    ? 'bg-blue-600 text-white'
                                    : `bg-gray-700 text-white ${showSenderInfo ? '' : 'ml-[43px]'}`;
                            const codeStyle = message?.type === 'code' ? 'w-[80%] bg-transparent' : '';
                            return `${base} ${padding} ${color} ${codeStyle}`;
                        })()
                    }>
                        <div className="flex justify-start mb-1 items-center">
                            <p className="text-xs text-white/60 whitespace-nowrap">
                                {formatTime(message.send_at || message.created_at)}
                            </p>
                        </div>

                        <div className="text-sm whitespace-pre-wrap break-words">
                            <MessageBubble text={message.text} />
                        </div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <AttachmentList
                                attachments={message.attachments}
                                isFileUploadWithAttachments={isFileUploadWithAttachments}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Status label */}
            {isMe && statusLabel && (
                <div className="mt-1 me-2 flex justify-end w-full">
                    {statusLabel}
                </div>
            )}
        </div>
    );
});

MessageItem.displayName = "MessageItem";

// Attachment List Component
const AttachmentList = memo(({ attachments, isFileUploadWithAttachments }: {
    attachments: any[];
    isFileUploadWithAttachments: boolean;
}) => (
    <div className={isFileUploadWithAttachments ? 'mt-0 grid grid-cols-1 gap-3' : 'mt-2 flex flex-wrap gap-2'}>
        {attachments.map((att: any) => (
            <div key={att.key || att.id} className={isFileUploadWithAttachments ? 'w-full' : 'inline-block'}>
                {att.uploading ? (
                    <UploadingAttachment
                        att={att}
                        isFileUpload={isFileUploadWithAttachments}
                    />
                ) : (
                    <Attachment
                        keyName={att.key}
                        fileUrl={att.fileUrl}
                        filename={att.filename}
                        mimeType={att.mimeType}
                        fileSize={att.fileSize}
                        className={isFileUploadWithAttachments ? 'w-full rounded shadow-sm' : 'max-w-xs rounded shadow-sm'}
                        style={isFileUploadWithAttachments ? { maxHeight: 360 } : { maxHeight: 200 }}
                    />
                )}
            </div>
        ))}
    </div>
));

AttachmentList.displayName = "AttachmentList";

// Uploading Attachment Component
const UploadingAttachment = memo(({ att, isFileUpload }: { att: any; isFileUpload: boolean }) => (
    <div className={isFileUpload ? 'relative w-full rounded shadow-sm bg-gray-800/20 border border-gray-700/30 p-3' : 'relative max-w-xs rounded shadow-sm bg-gray-800/30 border border-gray-700/50 p-3'}>
        <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
                <div className="h-6 w-6 text-gray-400 animate-pulse">
                    {att.mimeType?.startsWith("image/") ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">
                    {att.filename || "Uploading file..."}
                </div>
                {att.fileSize && (
                    <div className="text-xs text-gray-400">
                        {attachmentService.formatFileSize(att.fileSize)}
                    </div>
                )}

                <div className="mt-2 w-full bg-gray-700 rounded-full h-1.5">
                    <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${att.progress || 0}%` }}
                    />
                </div>

                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">Uploading...</span>
                    <span className="text-xs text-gray-400">{Math.round(att.progress || 0)}%</span>
                </div>
            </div>
        </div>
    </div>
));

UploadingAttachment.displayName = "UploadingAttachment";

export default MessageItem;