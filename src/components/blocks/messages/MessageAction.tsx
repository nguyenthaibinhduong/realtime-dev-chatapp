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
                isMe ? "-left-48" : "-right-48"
            )}
        >

            {isHovered && (
                <div className={cn("flex items-center gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                    {quickActions.map(a => (
                        <button
                            key={a.type}
                            onClick={(e) => { e.stopPropagation(); onAction?.(a.type, messageId); }}
                            className="w-9 h-9 rounded-full bg-gray-800/90 border border-gray-700/60 flex items-center justify-center text-gray-200 transition-transform hover:scale-110"
                            title={a.label}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            {a.icon}
                        </button>
                    ))}

                    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
                        <DropdownMenuTrigger asChild>
                            <button
                                className={cn(
                                    "w-9 h-9 rounded-full bg-gray-800/90 border border-gray-700/60 flex items-center justify-center text-gray-200 transition-transform hover:scale-110",
                                    open && "bg-gray-700"
                                )}
                                title="Thêm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuPortal>
                            <DropdownMenuContent
                                side="top"
                                sideOffset={12}
                                align={isMe ? "start" : "end"}
                                className="w-64 p-2 backdrop-blur-xl rounded-2xl shadow-2xl border z-[1200] bg-gray-900/98 border-gray-700/70"
                            >
                                {moreActions.map((action, idx) => (
                                    <React.Fragment key={action.type}>
                                        {action.variant === 'danger' && idx > 0 && <DropdownMenuSeparator className="my-2 bg-gray-700/50" />}
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAction?.(action.type, messageId);
                                                handleOpenChange(false);
                                            }}
                                            className={cn(
                                                "flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors",
                                                action.variant === 'danger' ? "hover:bg-red-500/10" : "hover:bg-gray-700/50"
                                            )}
                                        >
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", action.variant === 'danger' ? "bg-red-500/10 text-red-400" : "bg-gray-700/50 text-gray-300")}>
                                                {action.icon}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className={cn("text-sm font-semibold", action.variant === 'danger' ? "text-red-400" : "text-gray-100")}>{action.label}</span>
                                                {action.description && <span className="text-xs text-gray-400">{action.description}</span>}
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