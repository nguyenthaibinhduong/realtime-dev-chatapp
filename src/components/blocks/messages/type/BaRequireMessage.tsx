import { useState, useMemo } from "react";
import {
  FileText,
  ExternalLink,
  Calendar,
  Users,
  CheckCircle2,
  List,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvatarGroupStack } from "@/components/common/AvatarGroup";
import AvatarUser from "@/components/common/AvartarUser";
import { cn } from "@/lib/utils";
import AttachmentItem from "../../attachments/AttachmentItem";

interface BARequireMessageProps {
  message: any;
  isMe: boolean;
  showSenderInfo: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  channelMembers?: any[];
  onMessageAction?: (
    type: string,
    messageId: string,
    messageData?: any
  ) => void;
}

const BARequireMessage = ({
  message,
  isMe,
  showSenderInfo,
  hoveredId,
  onHover,
  channelMembers = [],
  onMessageAction,
}: BARequireMessageProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const isHovered = hoveredId === String(message.id);

  const requirementData = message.json_data || {};
  const {
    projectName = "",
    requirements = [],
    notes = "",
    assignees = [],
    relatedMessages = [],
  } = requirementData;

  // Get assignee users from channel members
  const assigneeUsers = useMemo(() => {
    if (!assignees || assignees.length === 0) return [];
    return assignees
      .map((id: string | number) => {
        const member = channelMembers.find(
          (m: any) =>
            String(m.id) === String(id) || String(m.user?.id) === String(id)
        );
        if (!member) return null;
        return {
          id: member.id || member.user?.id,
          username:
            member.username ||
            member.user?.username ||
            member.name ||
            member.user?.name,
          email: member.email || member.user?.email,
          avatar: member.avatar || member.user?.avatar,
          github_avatar: member.github_avatar || member.user?.github_avatar,
        };
      })
      .filter(Boolean);
  }, [assignees, channelMembers]);

  // Preview first 2 requirements
  const requirementsPreview = requirements.slice(0, 2);
  const hasMoreRequirements = requirements.length > 2;

  return (
    <>
      {/* Message Container */}
      <div
        data-message-id={message.id}
        className={cn(
          "group relative flex gap-2 px-2 py-1 transition-colors ",
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
          <div className="w-10 flex-shrink-0" />
        ) : null}

        {/* Message Content */}
        <div
          className={cn(
            "flex flex-col gap-1",
            isMe ? "items-end" : "items-start"
          )}
        >
          {/* Sender Info */}
          {!isMe && showSenderInfo && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {message.sender?.username || "Unknown"}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-500">
                {new Date(message.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}

          {/* BA Requirement Card - Compact Preview */}
          <Card
            onClick={() => setShowDialog(true)}
            className={cn(
              "max-w-[50vw] sm:max-w-[400px] md:max-w-[450px] lg:max-w-[500px] min-w-[280px] sm:min-w-[320px]",
              "cursor-pointer transition-all duration-200",
              "bg-white dark:bg-gray-950 border-2 border-blue-400 dark:border-blue-500"
            )}
          >
            <div className="p-3 space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                    <FileText className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      BA Requirement
                    </h3>
                    {projectName && (
                      <p className="text-xs text-gray-300 truncate">
                        {projectName}
                      </p>
                    )}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>

              {/* Requirements Preview */}
              <div className="space-y-1.5">
                {requirementsPreview.map((req: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-black dark:text-white"
                  >
                    <span className="text-blue-400 font-semibold mt-0.5">
                      {idx + 1}.
                    </span>
                    <span className="line-clamp-1">{req}</span>
                  </div>
                ))}
                {hasMoreRequirements && (
                  <p className="text-xs text-gray-400 pl-5">
                    +{requirements.length - 2} yêu cầu khác...
                  </p>
                )}

                {/* Quick Info */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400 pt-1">
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
                  {relatedMessages.length > 0 && (
                    <Badge
                      variant="outline"
                      className="h-5 text-[9px] border-blue-600 text-blue-400"
                    >
                      {relatedMessages.length} tin nhắn liên quan
                    </Badge>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-blue-500/50">
                <p className="text-[10px] text-gray-400 text-center">
                  Click để xem chi tiết yêu cầu
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-950 via-black to-gray-950 border-2 border-blue-500/60 shadow-2xl">
          <DialogHeader className="border-b border-blue-500/30 pb-4">
            <DialogTitle className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/20">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                  BA Requirement
                  <Badge
                    variant="outline"
                    className="ml-2 bg-blue-500/10 border-blue-500/50 text-blue-400 text-xs"
                  >
                    {message.id}
                  </Badge>
                </div>
                {projectName && (
                  <div className="text-sm font-medium text-gray-400 mt-1 flex items-center gap-2">
                    <span className="text-gray-500">Project:</span>
                    <span className="text-black dark:text-white">{projectName}</span>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-5 mt-4 pr-2">
            {/* Report Info - Date, Reporter & Assignees */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-blue-500/30 rounded-xl p-4 shadow-lg">
              {/* Date & Team Header */}
              <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-blue-500/20">
                {/* Date */}
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Ngày
                    </div>
                    <div className="text-xs font-semibold text-black dark:text-white truncate">
                      {new Date(message.created_at).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Reporter */}
                <div className="flex items-center gap-3">
                  <AvatarUser user={message.sender} size="8" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Người tạo
                    </div>
                    <div className="text-xs font-semibold text-black dark:text-white truncate">
                      {message.sender?.username || "Unknown"}
                    </div>
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
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Phụ trách
                      </div>
                      <div className="text-xs font-semibold text-blue-400">
                        {assigneeUsers.length} người
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements List Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-500/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <List className="h-4 w-4 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide">
                  Danh sách yêu cầu
                </h3>
                <Badge
                  variant="outline"
                  className="ml-auto bg-blue-500/10 border-blue-500/50 text-blue-400"
                >
                  {requirements.length}
                </Badge>
              </div>
              <Card className="bg-white dark:bg-black border border-gray-700/50 shadow-inner">
                <div className="p-5 space-y-3">
                  {requirements.map((req: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 group">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 border border-blue-500/30 flex-shrink-0">
                        <span className="text-xs font-bold text-blue-400">
                          {idx + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed flex-1 pt-0.5">
                        {req}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Related Messages */}
            {relatedMessages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-cyan-500/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide">
                    Tin nhắn liên quan
                  </h3>
                  <Badge
                    variant="outline"
                    className="ml-auto bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                  >
                    {relatedMessages.length}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  {relatedMessages.map((msgId: string, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowDialog(false);
                        setTimeout(() => {
                          const el = document.querySelector(
                            `[data-message-id="${msgId}"]`
                          ) as HTMLElement | null;
                          if (el) {
                            el.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            // Highlight effect
                            el.classList.add("bg-cyan-500/20");
                            setTimeout(
                              () => el.classList.remove("bg-cyan-500/20"),
                              1500
                            );
                          }
                        }, 300);
                      }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/5 to-cyan-600/5 border border-cyan-500/20 rounded-lg cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all duration-200"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        {/* <span className="text-xs font-bold text-cyan-400">#{msgId}</span> */}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-cyan-400">
                          Tin nhắn #{msgId}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {notes && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-yellow-500/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <FileText className="h-4 w-4 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide ">
                    Ghi chú
                  </h3>
                </div>
                <Card className="bg-white dark:bg-black border border-yellow-500/20">
                  <div className="p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {notes}
                  </div>
                </Card>
              </div>
            )}

            {/* Attachments Section */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-500/20">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-500/10 border border-gray-500/30">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <h3 className="text-base font-bold text-black dark:text-white uppercase tracking-wide">
                    Tệp đính kèm
                  </h3>
                  <Badge
                    variant="outline"
                    className="ml-auto bg-gray-500/10 border-gray-500/50 text-gray-400"
                  >
                    {message.attachments.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {message.attachments.map((file: any, idx: number) => (
                    <AttachmentItem
                      key={file.id}
                      keyName={file.key}
                      filename={file.filename}
                      mimeType={file.mimeType}
                      fileSize={file.fileSize}
                      showRemove={false}
                      className="hover:shadow-lg transition-shadow w-40"
                    />
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

export default BARequireMessage;
