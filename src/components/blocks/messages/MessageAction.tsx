import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
    Reply,
    Forward,
    Pin,
    PinOff,
    Edit,
    Trash2,
    Copy,
    MoreHorizontal,
    Share2,
} from "lucide-react";

export type MessageActionType =
    | 'like'
    | 'reply'
    | 'forward'
    | 'pin'
    | 'edit'
    | 'delete'
    | 'copy'
    | 'share';

interface MessageAction {
    type: MessageActionType;
    icon: React.ReactNode;
    label: string;
    description?: string;
    variant?: 'default' | 'danger';
}

interface MessageActionsProps {
    isMe: boolean;
    isHovered: boolean;
    messageId: string;
    canEdit?: boolean;
    canDelete?: boolean;
    isPinned?: boolean;
    onAction?: (type: MessageActionType, messageId: string) => void;
    onMenuOpenChange?: (open: boolean) => void; // notify parent to keep hovered state
}

// show 3 buttons on message hover, open menu immediately when hovering/clicking more button
export const MessageActions: React.FC<MessageActionsProps> = ({
    isMe,
    isHovered,
    messageId,
    canEdit = true,
    canDelete = true,
    isPinned = false,
    onAction = () => { },
    onMenuOpenChange,
}) => {
    const [open, setOpen] = useState(false);

    const quickActions: MessageAction[] = [
        { type: 'reply', icon: <Reply className="h-4 w-4" />, label: 'Trả lời' },
        { type: 'forward', icon: <Share2 className="h-4 w-4" />, label: 'Chuyển tiếp' },
    ];

    const moreActions: any[] = [
        { type: 'copy', icon: <Copy className="h-4 w-4" />, label: 'Sao chép', description: 'Sao chép nội dung' },
        { type: 'pin', icon: isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />, label: isPinned ? 'Bỏ ghim' : 'Ghim', description: 'Ghim tin nhắn' },
        ...(isMe ? [
            ...(canEdit ? [{ type: 'edit' as MessageActionType, icon: <Edit className="h-4 w-4" />, label: 'Chỉnh sửa' }] : []),
            ...(canDelete ? [{ type: 'delete' as MessageActionType, icon: <Trash2 className="h-4 w-4" />, label: 'Xóa', variant: 'danger' as const }] : []),
        ] : []),
    ];

    // notify parent when dropdown open state changes
    const handleOpenChange = (val: boolean) => {
        setOpen(val);
        onMenuOpenChange?.(val);
    };

    if (!isHovered) return null;

    return (
        <div
            className={cn(
                "absolute top-1/2 -translate-y-1/2 flex items-center gap-2 transition-all duration-100 z-[1100] pointer-events-auto",
                isMe ? "-left-40" : "-right-40"
            )}
        >

            {isHovered && (
                <div className={cn("flex items-center gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                    {quickActions.map(a => (
                        <button
                            key={a.type}
                            onClick={(e) => { e.stopPropagation(); onAction?.(a.type, messageId); }}
                            className="group relative w-9 h-9 rounded-full 
                                bg-white/80 dark:bg-black/40
                                backdrop-blur-xl
                                border border-white/40 dark:border-white/10
                                shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]
                                flex items-center justify-center 
                                text-gray-700 dark:text-gray-200 
                                transition-all duration-300
                                hover:scale-110 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] dark:hover:shadow-[0_12px_40px_0_rgba(255,255,255,0.1)]
                                hover:bg-white/90 dark:hover:bg-white/10
                                active:scale-95"
                            title={a.label}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent dark:from-white/10 dark:to-transparent" />
                            <div className="relative z-10">{a.icon}</div>
                        </button>
                    ))}

                    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "group relative w-9 h-9 rounded-full",
                                    "bg-white/80 dark:bg-black/40",
                                    "backdrop-blur-xl",
                                    "border border-white/40 dark:border-white/10",
                                    "shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]",
                                    "flex items-center justify-center",
                                    "text-gray-700 dark:text-gray-200",
                                    "transition-all duration-300",
                                    "hover:scale-110 hover:shadow-[0_12px_40px_0_rgba(0,0,0,0.2)] dark:hover:shadow-[0_12px_40px_0_rgba(255,255,255,0.1)]",
                                    "hover:bg-white/90 dark:hover:bg-white/10",
                                    "active:scale-95",
                                    open && "scale-110 bg-white/95 dark:bg-white/15 shadow-[0_12px_40px_0_rgba(0,0,0,0.25)] dark:shadow-[0_12px_40px_0_rgba(255,255,255,0.15)]"
                                )}
                                title="Thêm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent dark:from-white/10 dark:to-transparent" />
                                <div className="relative z-10">
                                    <MoreHorizontal className="h-4 w-4" />
                                </div>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                side="top"
                                sideOffset={12}
                                align={isMe ? "start" : "end"}
                                className="w-64 p-2 rounded-2xl z-[1200]
                                    bg-white/90 dark:bg-black/60
                                    backdrop-blur-2xl
                                    border border-white/40 dark:border-white/10
                                    shadow-[0_20px_60px_0_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_0_rgba(0,0,0,0.8)]
                                    before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/30 before:to-transparent dark:before:from-white/5 dark:before:to-transparent before:pointer-events-none"
                            >
                                {moreActions.map((action, idx) => (
                                    <React.Fragment key={action.type}>
                                        {action.variant === 'danger' && idx > 0 && (
                                            <DropdownMenuSeparator className="my-2 h-px bg-gradient-to-r from-transparent via-gray-300/50 dark:via-white/10 to-transparent" />
                                        )}
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAction?.(action.type, messageId);
                                                handleOpenChange(false);
                                            }}
                                            className={cn(
                                                "group relative flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer",
                                                "transition-all duration-300",
                                                "hover:bg-white/60 dark:hover:bg-white/5",
                                                "hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_0_rgba(255,255,255,0.05)]",
                                                "active:scale-[0.98]",
                                                action.variant === 'danger' && "hover:bg-red-500/10 dark:hover:bg-red-500/15"
                                            )}
                                        >
                                            <div className={cn(
                                                "relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                "backdrop-blur-sm transition-all duration-300",
                                                action.variant === 'danger'
                                                    ? "bg-red-500/10 dark:bg-red-500/15 text-red-500 dark:text-red-400 group-hover:bg-red-500/20 dark:group-hover:bg-red-500/25 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                                                    : "bg-gray-100/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 group-hover:bg-gray-200/80 dark:group-hover:bg-white/10 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                            )}>
                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                <div className="relative z-10">{action.icon}</div>
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className={cn(
                                                    "text-sm font-semibold transition-colors duration-300",
                                                    action.variant === 'danger'
                                                        ? "text-red-500 dark:text-red-400"
                                                        : "text-gray-900 dark:text-gray-100"
                                                )}>
                                                    {action.label}
                                                </span>
                                                {action.description && (
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                                                        {action.description}
                                                    </span>
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    </React.Fragment>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenuPortal>
                    </DropdownMenu>
                </div>
            )}
        </div>
    );
};