import { useState, useMemo } from "react";
import { Bug, ExternalLink, Calendar, User, Link as LinkIcon, FileText, Users, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarGroupStack } from "@/components/common/AvatarGroup";
import AvatarUser from "@/components/common/AvartarUser";
import { cn } from "@/lib/utils";

interface TesterReportMessageProps {
    message: any;
    isMe: boolean;
    showSenderInfo: boolean;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
    channelMembers?: any[];
    onMessageAction?: (type: string, messageId: string, messageData?: any) => void;
}

const TesterReportMessage = ({
    message,
    isMe,
    showSenderInfo,
    hoveredId,
    onHover,
    channelMembers = [],
    onMessageAction,
}: TesterReportMessageProps) => {
    const [showDialog, setShowDialog] = useState(false);
    const isHovered = hoveredId === String(message.id);

    const reportData = message.json_data || {};
    const {
        content = "",
        notes = "",
        projectName = "",
        driveLink = "",
        assignees = [],
        relatedMessageId = null,
        syncGoogleSheet = false,
    } = reportData;

    // Get assignee users from channel members
    const assigneeUsers = useMemo(() => {
        if (!assignees || assignees.length === 0) return [];
        return assignees
            .map((id: number) => {
                const member = channelMembers.find((m: any) => m.id === id || m.user?.id === id);
                if (!member) return null;
                // Map to User type for AvatarGroup
                return {
                    id: member.id || member.user?.id,
                    username: member.username || member.user?.username || member.name || member.user?.name,
                    email: member.email || member.user?.email,
                    avatar: member.avatar || member.user?.avatar,
                    github_avatar: member.github_avatar || member.user?.github_avatar,
                };
            })
            .filter(Boolean);
    }, [assignees, channelMembers]);

    // Strip HTML tags for preview
    const stripHtml = (html: string) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const contentPreview = stripHtml(content).slice(0, 100);
    const hasMoreContent = stripHtml(content).length > 100;

    return (
        <>
            {/* Message Container */}
            <div
                data-message-id={message.id}
                className={cn(
                    "group relative flex py-1 transition-colors",
                    isMe ? "justify-end" : "justify-start"
                )}
                onMouseEnter={() => onHover(String(message.id))}
                onMouseLeave={() => onHover(null)}
            >
                {/* Sender Avatar */}
                {showSenderInfo && !isMe ? (
                    <div className="mr-2 flex-shrink-0">
                        <AvatarUser user={message?.sender} isMe={isMe} size={8} />
                    </div>
                ) : !isMe ? (
                    <div className="w-6 flex-shrink-0" />
                ) : null}

                {/* Message Content */}
                <div className={cn("flex flex-col gap-1", isMe ? "items-end" : "items-start")}>
                    {/* Sender Info */}
                    {!isMe && showSenderInfo && (
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-xs font-semibold text-gray-300">
                                {message.sender?.username || "Unknown"}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {new Date(message.created_at).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                    )}

                    {/* Bug Report Card - Compact Preview */}
                    <Card
                        onClick={() => setShowDialog(true)}
                        className={cn(
                            "max-w-[50vw] sm:max-w-[400px] md:max-w-[450px] lg:max-w-[500px] min-w-[280px] sm:min-w-[320px]",
                            "cursor-pointer transition-all duration-200",
                            "bg-black border-2 border-red-500"
                        )}
                    >
                        <div className="p-3 space-y-2">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                                        <Bug className="h-4 w-4 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-white">Bug Report</h3>
                                        {projectName && (
                                            <p className="text-xs text-gray-300 truncate">{projectName}</p>
                                        )}
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            </div>

                            {/* Content Preview */}
                            <div className="space-y-1.5">
                                <p className="text-xs text-white line-clamp-2">
                                    {contentPreview}
                                    {hasMoreContent && "..."}
                                </p>

                                {/* Quick Info */}
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                                    {relatedMessageId && (
                                        <div className="flex items-center gap-1">
                                            <LinkIcon className="h-3 w-3" />
                                            <span>Tin nhắn #{relatedMessageId}</span>
                                        </div>
                                    )}
                                    {assigneeUsers.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <AvatarGroupStack
                                                users={assigneeUsers}
                                                size="xs"
                                                max={3}
                                                overlap
                                                overlapOffset={6}
                                                tooltip
                                            />
                                        </div>
                                    )}
                                    {syncGoogleSheet && (
                                        <Badge variant="outline" className="h-5 text-[9px] border-green-600 text-green-400">
                                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                            Synced
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="pt-2 border-t border-red-500/50">
                                <p className="text-[10px] text-gray-400 text-center">
                                    Click để xem chi tiết báo cáo
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Detail Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-950 border-2 border-red-500/60 shadow-2xl">
                    <DialogHeader className="border-b border-red-500/30 pb-4">
                        <DialogTitle className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/30 to-red-600/20 border border-red-500/50 shadow-lg shadow-red-500/20">
                                <Bug className="h-6 w-6 text-red-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xl font-bold text-white flex items-center gap-2">
                                    Bug Report
                                    <Badge variant="outline" className="ml-2 bg-red-500/10 border-red-500/50 text-red-400 text-xs">
                                        {message.id}
                                    </Badge>
                                </div>
                                {projectName && (
                                    <div className="text-sm font-medium text-gray-400 mt-1 flex items-center gap-2">
                                        <span className="text-gray-500">Project:</span>
                                        <span className="text-white">{projectName}</span>
                                    </div>
                                )}
                            </div>
                            {syncGoogleSheet && (
                                <Badge className="bg-green-500/20 border border-green-500/50 text-green-400 gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Synced
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-5 mt-4 pr-2">
                        {/* Report Info - Date, Reporter & Assignees */}
                        <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-purple-500/30 rounded-xl p-4 shadow-lg">
                            {/* Date & Team Header */}
                            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-purple-500/20">
                                {/* Date */}
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30">
                                        <Calendar className="h-3.5 w-3.5 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Ngày</div>
                                        <div className="text-xs font-semibold text-white truncate">
                                            {new Date(message.created_at).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Reporter */}
                                <div className="flex items-center gap-3">
                                    <AvatarUser user={message.sender} size="8" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Người báo cáo</div>
                                        <div className="text-xs font-semibold text-white truncate">{message.sender?.username || "Unknown"}</div>
                                    </div>
                                </div>

                                {/* Assignees */}
                                {assigneeUsers.length > 0 && (
                                    <div className="flex items-center gap-3">
                                        <AvatarGroupStack
                                            users={assigneeUsers}
                                            size="sm"
                                            max={3}
                                            overlap
                                            overlapOffset={8}
                                            tooltip
                                            showOverflowCount
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">Được giao</div>
                                            <div className="text-xs font-semibold text-purple-400">{assigneeUsers.length} người</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Related Message */}
                        {relatedMessageId && (
                            <div
                                onClick={() => {
                                    setShowDialog(false);
                                    setTimeout(() => {
                                        const el = document.querySelector(`[data-message-id="${relatedMessageId}"]`) as HTMLElement | null;
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            // Highlight effect
                                            el.classList.add('bg-blue-500/20');
                                            setTimeout(() => el.classList.remove('bg-blue-500/20'), 1500);
                                        }
                                    }, 300);
                                }}
                                className="bg-gradient-to-r from-blue-500/5 to-blue-600/5 border border-blue-500/30 rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-200"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30">
                                        <LinkIcon className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Liên quan đến</div>
                                        <div className="text-sm font-semibold text-blue-400">Tin nhắn #{relatedMessageId}</div>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-blue-400 opacity-50" />
                                </div>
                            </div>
                        )}

                        {/* Content Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 pb-2 border-b border-red-500/20">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/30">
                                    <FileText className="h-4 w-4 text-red-400" />
                                </div>
                                <h3 className="text-base font-bold text-white uppercase tracking-wide">Mô tả lỗi</h3>
                            </div>
                            <Card className="bg-black border border-gray-700/50 shadow-inner">
                                <div
                                    className="p-5 prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            </Card>
                        </div>

                        {/* Notes Section */}
                        {notes && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 pb-2 border-b border-yellow-500/20">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                        <FileText className="h-4 w-4 text-yellow-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-white uppercase tracking-wide">Ghi chú</h3>
                                </div>
                                <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-600/5 border border-yellow-500/20">
                                    <div className="p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{notes}</div>
                                </Card>
                            </div>
                        )}

                        {/* Drive Link Section */}
                        {driveLink && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 pb-2 border-b border-blue-500/20">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30">
                                        <LinkIcon className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-white uppercase tracking-wide">Drive Link</h3>
                                </div>
                                <a
                                    href={driveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-500/40 group-hover:bg-blue-500/30 transition-colors">
                                        <ExternalLink className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                    </div>
                                    <span className="text-sm text-blue-400 group-hover:text-blue-300 truncate font-medium transition-colors">
                                        {driveLink}
                                    </span>
                                </a>
                            </div>
                        )}

                        {/* Sync Status */}
                        {syncGoogleSheet && (
                            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/40 shadow-lg shadow-green-500/5">
                                <div className="p-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 border border-green-500/50">
                                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-green-400">Đã đồng bộ với Google Sheets</div>
                                        <div className="text-xs text-green-400 mt-0.5">Báo cáo này đã được lưu vào bảng tính</div>
                                    </div>
                                    <Badge className="bg-green-500/20 border border-green-500/50 text-green-400">Active</Badge>
                                </div>
                            </Card>
                        )}

                        {/* Attachments Section */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 pb-2 border-b border-gray-500/20">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500/10 border border-gray-500/30">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <h3 className="text-base font-bold text-white uppercase tracking-wide">Tệp đính kèm</h3>
                                    <Badge variant="outline" className="ml-auto bg-gray-500/10 border-gray-500/50 text-gray-400">
                                        {message.attachments.length}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {message.attachments.map((file: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-2.5 p-3 rounded-lg bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-lg hover:shadow-gray-500/5 transition-all duration-200"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700/50 border border-gray-600/50 group-hover:bg-gray-600/50 transition-colors">
                                                <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                            </div>
                                            <span className="text-xs text-gray-300 group-hover:text-white truncate font-medium transition-colors">{file.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default TesterReportMessage;