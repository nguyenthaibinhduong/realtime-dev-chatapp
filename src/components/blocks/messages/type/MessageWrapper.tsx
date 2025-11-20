/**
 * Shared Message Wrapper Component
 * Component wrapper chung cho tất cả các loại message để đảm bảo layout nhất quán
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import AvatarUser from "@/components/common/AvartarUser";
import {
    getMessageContainerClasses,
    getContentContainerClasses,
    getUsernameClasses,
    LAYOUT,
} from "./messageStyles";

interface MessageWrapperProps {
    /** ID của message */
    messageId: string;

    /** Người gửi message */
    sender?: any;

    /** Message này có phải của user hiện tại không */
    isMe: boolean;

    /** Có hiển thị avatar và username không */
    showSenderInfo: boolean;

    /** Message nội dung (children) */
    children: ReactNode;

    /** ID của message đang được hover */
    hoveredId?: string | null;

    /** Callback khi hover vào message */
    onHover?: (id: string | null) => void;

    /** Custom classes cho container */
    containerClassName?: string;

    /** Custom classes cho content */
    contentClassName?: string;

    /** Có sử dụng avatar size nhỏ không (default: 32) */
    compactAvatar?: boolean;
}

export const MessageWrapper = ({
    messageId,
    sender,
    isMe,
    showSenderInfo,
    children,
    hoveredId,
    onHover,
    containerClassName,
    contentClassName,
    compactAvatar = false,
}: MessageWrapperProps) => {
    const handleMouseEnter = () => {
        onHover?.(messageId);
    };

    const handleMouseLeave = () => {
        onHover?.(null);
    };

    const avatarSize = LAYOUT.avatar.sm; // Always use 24px for consistency

    return (
        <div
            data-message-id={messageId}
            className={cn(
                getMessageContainerClasses(isMe),
                containerClassName
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Avatar */}
            {showSenderInfo && !isMe ? (
                <div className="mr-2 flex flex-col items-center justify-center flex-shrink-0">
                    <AvatarUser user={sender} isMe={isMe} size={avatarSize} />
                </div>
            ) : !isMe ? (
                <div className="w-6 flex-shrink-0" />
            ) : null}

            {/* Message content container */}
            <div className={cn(
                getContentContainerClasses(isMe),
                contentClassName
            )}>
                {/* Sender name */}
                {showSenderInfo && !isMe && (
                    <span className={cn(
                        getUsernameClasses(),
                        "px-2 mb-0.5"
                    )}>
                        {sender?.username || sender?.name || 'Unknown'}
                    </span>
                )}

                {/* Message content */}
                {children}
            </div>
        </div>
    );
};

/**
 * Card Message Wrapper
 * Wrapper đặc biệt cho các message dạng card (CodeCard, ToolShare, etc.)
 */
interface CardMessageWrapperProps extends MessageWrapperProps {
    /** Max width của card (default: 600px) */
    maxWidth?: keyof typeof LAYOUT.maxWidth;

    /** Min width của card (default: 350px) */
    minWidth?: keyof typeof LAYOUT.minWidth;
}

export const CardMessageWrapper = ({
    maxWidth = 'card',
    minWidth = 'card',
    contentClassName: customContentClassName,
    ...props
}: CardMessageWrapperProps) => {
    return (
        <MessageWrapper
            {...props}
            contentClassName={cn(
                "relative flex flex-col gap-1 w-full",
                LAYOUT.maxWidth[maxWidth],
                LAYOUT.minWidth[minWidth],
                props.isMe ? "items-end ml-auto" : "items-start mr-auto",
                customContentClassName
            )}
        />
    );
};

/**
 * Simple Message Wrapper
 * Wrapper đơn giản cho các message text thông thường
 */
export const SimpleMessageWrapper = (props: MessageWrapperProps) => {
    return <MessageWrapper {...props} compactAvatar />;
};
