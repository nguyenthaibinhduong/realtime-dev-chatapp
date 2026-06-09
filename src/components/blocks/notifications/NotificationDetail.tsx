import AvatarUser from "@/components/common/AvartarUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { blockUi } from "@/components/blocks/block-ui";
import { formatExactTimeHelper } from "@/lib/utils";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bell,
  Hash,
  MessageSquare,
  X,
  Check,
  GitBranch,
  Package,
  Settings,
  FileText,
  Share2,
  Upload,
} from "lucide-react";

interface NotificationDetailProps {
  notification: Notification | null;
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
}

// Add this helper function at the top of the file, before renderNotification
function cleanEncryptedFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // If string starts with ENC:, return a masked version or null
    return obj.startsWith("ENC:") ? "[Encrypted]" : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => cleanEncryptedFields(item));
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // Skip if the value is a string starting with ENC:
        if (typeof value === "string" && value.startsWith("ENC:")) {
          continue; // Don't include encrypted fields
        }
        cleaned[key] = cleanEncryptedFields(value);
      }
    }
    return cleaned;
  }

  return obj;
}

//render notification content
//render notification content
function renderNotification(notification: Notification): React.ReactNode {
  if (notification.type === "message") {
    const messageType = notification.data?.type || "message";
    let typeLabel = "Tin nhắn";
    let iconBg = "bg-blue-600/20";

    switch (messageType) {
      case "code-share":
        typeLabel = "Chia sẻ Code";
        iconBg = "bg-purple-600/20";
        break;
      case "file-upload":
        typeLabel = "Upload File";
        iconBg = "bg-green-600/20";
        break;
      case "notification":
        typeLabel = "Thông báo Kênh";
        iconBg = "bg-orange-600/20";
        break;
    }

    return (
      <div className="flex-1 overflow-y-auto p-6">
        <Card className={`max-w-3xl mx-auto backdrop-blur-sm ${blockUi.dialogPanel}`}>
          <CardHeader className="pb-4 space-y-4">
            <div className="flex items-start gap-4">
              <AvatarUser user={notification.data?.sender} size={8} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-lg">
                    {notification.data?.sender?.username || "Unknown User"}
                  </h3>
                  <Badge
                    className={`${iconBg} text-blue-400 border-blue-600/30 hover:bg-blue-600/30`}
                  >
                    {typeLabel}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">
                    {formatExactTimeHelper()(notification.createdAt)}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <Separator className="bg-border" />

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-muted-foreground text-sm uppercase tracking-wide">
                  {messageType === "code-share"
                    ? "Nội dung chia sẻ"
                    : messageType === "file-upload"
                      ? "Thông tin file"
                      : "Nội dung tin nhắn"}
                </h4>
                <div className={blockUi.sectionMuted + " p-4"}>
                  <p className="text-foreground leading-relaxed text-base">
                    {notification?.data?.text || "Không có nội dung"}
                  </p>

                  {messageType === "code-share" &&
                    notification.data?.json_data && (
                      <div className="mt-4 p-3 rounded border border-border bg-background">
                        <h5 className="text-sm font-medium text-foreground mb-2">
                          Chi tiết chia sẻ:
                        </h5>
                        <pre className="text-xs text-muted-foreground overflow-auto">
                          {typeof notification.data.json_data === "string"
                            ? notification.data.json_data
                            : JSON.stringify(
                              notification.data.json_data,
                              null,
                              2
                            )}
                        </pre>
                      </div>
                    )}

                  {messageType === "file-upload" &&
                    notification.data?.attachments && (
                      <div className="mt-4 space-y-2">
                        <h5 className="text-sm font-medium text-foreground">
                          Files đã tải lên:
                        </h5>
                        {notification.data.attachments.map(
                          (file: any, index: number) => (
                            <div
                              key={index}
                              className="p-2 bg-background rounded border border-border text-sm"
                            >
                              <div className="flex items-center gap-2 text-foreground">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">
                                  {file.filename}
                                </span>
                                <span className="text-muted-foreground">
                                  ({(file.fileSize / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Type: {file.mimeType}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </div>

              {notification.data?.channel && (
                <div className={blockUi.sectionMuted + " p-4"}>
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kênh:</span>
                    <span className="text-blue-400 font-medium">
                      {notification.data.channel.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } else if (notification.type === "github") {
    // ✅ GitHub data nằm trong notification.data.data (nested structure)
    const githubData = notification.data?.data;
    const event = notification.data?.event; // "push", "pull_request", "installation", etc.
    const action = notification.data?.action; // "opened", "closed", "merged", etc.

    if (!githubData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 ring-4 ring-border/40">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Dữ liệu GitHub không hợp lệ
          </h2>
          <p className="text-muted-foreground max-w-md">
            Không thể hiển thị chi tiết cho thông báo này
          </p>
        </div>
      );
    }

    // Xác định loại event
    const isPushEvent = event === "push" && githubData.commits;
    const isInstallationEvent = event === "installation" || action === "created";
    const isPullRequestEvent = event === "pull_request";
    const isMerged = isPullRequestEvent && githubData.pull_request?.merged === true;

    return (
      <div className="flex-1 overflow-y-auto p-6">
        <Card className={`max-w-3xl mx-auto backdrop-blur-sm ${blockUi.dialogPanel}`}>
          <CardHeader className="pb-4 space-y-4">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${isMerged ? "bg-purple-600" : "bg-green-600"
                  }`}
              >
                <GitBranch className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-foreground text-lg">
                    {isPushEvent
                      ? "GitHub Push"
                      : isPullRequestEvent
                        ? isMerged
                          ? "Pull Request Merged"
                          : "Pull Request"
                        : isInstallationEvent
                          ? "GitHub Installation"
                          : "GitHub Event"}
                  </h3>
                  <Badge
                    className={`${isMerged
                        ? "bg-purple-600/20 text-purple-400 border-purple-600/30 hover:bg-purple-600/30"
                        : isPullRequestEvent
                          ? "bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30"
                          : "bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30"
                      }`}
                  >
                    {isPushEvent
                      ? "Push"
                      : isPullRequestEvent
                        ? isMerged
                          ? "Merged"
                          : action || "PR"
                        : isInstallationEvent
                          ? "Installation"
                          : event || "Unknown"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">
                    {formatExactTimeHelper()(notification.createdAt)}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>

              {!notification.read && (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse ring-4 ring-green-500/20" />
              )}
            </div>
          </CardHeader>

          <Separator className="bg-border" />

          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* PULL REQUEST EVENT */}
              {isPullRequestEvent && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground text-sm uppercase tracking-wide">
                      Pull Request Details
                    </h4>
                    <div className={blockUi.sectionMuted + " p-4"}>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Repository:</span>
                          <span className="ml-2 text-green-400 font-medium">
                            {githubData.repository?.full_name ||
                              notification.data?.repoFullName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PR Number:</span>
                          <span className="ml-2 text-foreground">
                            #{githubData.pull_request?.number || githubData.number}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span
                            className={`ml-2 font-medium ${isMerged
                                ? "text-purple-400"
                                : githubData.pull_request?.state === "open"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                          >
                            {isMerged
                              ? "Merged"
                              : githubData.pull_request?.state || "Unknown"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Author:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.pull_request?.user?.login || "Unknown"}
                          </span>
                        </div>
                      </div>

                      {githubData.pull_request?.title && (
                        <div className="p-3 bg-background rounded border border-border mb-3">
                          <h6 className="text-sm font-medium text-foreground mb-1">
                            Title:
                          </h6>
                          <p className="text-foreground text-sm">
                            {githubData.pull_request.title}
                          </p>
                        </div>
                      )}

                      {githubData.pull_request?.body && (
                        <div className="p-3 bg-background rounded border border-border mb-3">
                          <h6 className="text-sm font-medium text-foreground mb-1">
                            Description:
                          </h6>
                          <p className="text-foreground text-sm whitespace-pre-wrap">
                            {githubData.pull_request.body}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">From:</span>
                          <span className="ml-2 text-blue-400 font-mono">
                            {githubData.pull_request?.head?.ref || "unknown"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">To:</span>
                          <span className="ml-2 text-blue-400 font-mono">
                            {githubData.pull_request?.base?.ref || "main"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Commits:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.pull_request?.commits || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Changed Files:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.pull_request?.changed_files || 0}
                          </span>
                        </div>
                      </div>

                      {isMerged && githubData.pull_request?.merged_by && (
                        <div className="mt-3 p-2 bg-purple-900/20 rounded border border-purple-600/30">
                          <span className="text-sm text-purple-300">
                            Merged by{" "}
                            <span className="font-medium">
                              {githubData.pull_request.merged_by.login}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {githubData.pull_request?.html_url && (
                    <div className={blockUi.sectionMuted + " p-4"}>
                      <div className="flex items-center gap-2 text-sm">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">View PR:</span>
                        <a
                          href={githubData.pull_request.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 font-medium hover:underline"
                        >
                          {
                            githubData.pull_request.html_url
                              .split("/")
                              .slice(-1)[0]
                          }
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* PUSH EVENT */}
              {isPushEvent && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground text-sm uppercase tracking-wide">
                      Push Event
                    </h4>
                    <div className={blockUi.sectionMuted + " p-4"}>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Repository:</span>
                          <span className="ml-2 text-green-400 font-medium">
                            {githubData.repository?.full_name || notification.data?.repoFullName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Branch:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.ref?.replace("refs/heads/", "") || "main"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Commits:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.commits?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pusher:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.pusher?.name || "Unknown"}
                          </span>
                        </div>
                      </div>

                      {githubData.head_commit && (
                        <div className="p-3 bg-background rounded border border-border">
                          <h6 className="text-sm font-medium text-foreground mb-1">
                            Latest Commit:
                          </h6>
                          <p className="text-foreground text-sm">
                            {githubData.head_commit.message}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            by {githubData.head_commit.author?.name} •{" "}
                            {githubData.head_commit.id?.slice(0, 7)}
                          </div>
                        </div>
                      )}

                      {/* List all commits */}
                      {githubData.commits && githubData.commits.length > 1 && (
                        <div className="mt-4">
                          <h6 className="text-sm font-medium text-foreground mb-2">
                            All Commits ({githubData.commits.length}):
                          </h6>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {githubData.commits.map((commit: any, index: number) => (
                              <div key={index} className="p-2 bg-background rounded border border-border text-sm">
                                <p className="text-foreground font-medium">{commit.message}</p>
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                  <span>{commit.author?.name || commit.committer?.name}</span>
                                  <span>•</span>
                                  <span className="font-mono">{commit.id?.slice(0, 7)}</span>
                                  {commit.modified && commit.modified.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{commit.modified.length} file(s) modified</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {githubData.compare && (
                    <div className={blockUi.sectionMuted + " p-4"}>
                      <div className="flex items-center gap-2 text-sm">
                        <GitBranch className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Compare:</span>
                        <a
                          href={githubData.compare}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 font-medium hover:underline"
                        >
                          View changes
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* INSTALLATION EVENT */}
              {isInstallationEvent && githubData.installation && (
                <>
                  <div>
                    <h4 className="font-semibold mb-3 text-muted-foreground text-sm uppercase tracking-wide">
                      GitHub App Installation
                    </h4>
                    <div className={blockUi.sectionMuted + " p-4"}>
                      <p className="text-foreground mb-3">
                        Ứng dụng GitHub đã được cài đặt cho tài khoản:
                        <span className="font-medium text-green-400 ml-2">
                          {githubData.installation?.account?.login || "Unknown"}
                        </span>
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Repositories:</span>
                          <span className="ml-2 text-foreground">
                            {githubData.repositories?.length || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Installation ID:</span>
                          <span className="ml-2 text-foreground">
                            {notification.data?.installationId || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {githubData.repositories && githubData.repositories.length > 0 && (
                    <div>
                      <h5 className="font-semibold mb-2 text-foreground">
                        Repositories được cài đặt:
                      </h5>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {githubData.repositories.slice(0, 10).map((repo: any, index: number) => (
                          <div
                            key={index}
                            className="p-2 bg-background rounded border border-border text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-green-400" />
                              <span className="text-foreground font-medium">
                                {repo.full_name}
                              </span>
                              {repo.private && (
                                <Badge variant="outline" className="text-xs text-foreground">
                                  Private
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {githubData.repositories.length > 10 && (
                          <p className="text-muted-foreground text-sm">
                            ... và {githubData.repositories.length - 10} repository khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* UNKNOWN EVENT - Hiển thị raw data đã clean */}
              {!isPushEvent && !isInstallationEvent && !isPullRequestEvent && (
                <div>
                  <h4 className="font-semibold mb-3 text-muted-foreground text-sm uppercase tracking-wide">
                    GitHub Event Details
                  </h4>
                  <div className={blockUi.sectionMuted + " p-4"}>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Event Type:</span>
                        <span className="ml-2 text-foreground">
                          {event || "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Repository:</span>
                        <span className="ml-2 text-green-400">
                          {notification.data?.repoFullName || "N/A"}
                        </span>
                      </div>
                      {notification.data?.installationId && (
                        <div>
                          <span className="text-muted-foreground">Installation ID:</span>
                          <span className="ml-2 text-foreground">
                            {notification.data.installationId}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Debug: Show cleaned raw data */}
                    <details className="mt-4">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View data (encrypted fields hidden)
                      </summary>
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-64 bg-background p-2 rounded border border-border">
                        {JSON.stringify(cleanEncryptedFields(githubData), null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // fallback cho các loại thông báo khác
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 ring-4 ring-border/40">
        <Bell className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-foreground">
        Loại thông báo không xác định
      </h2>
      <p className="text-muted-foreground max-w-md">
        Không thể hiển thị chi tiết cho loại thông báo này
      </p>
    </div>
  );
}

export default function NotificationDetail({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationDetailProps) {
  console.log("selected notification:", notification);

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6 ring-4 ring-border/40 shadow-sm">
          <Bell className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-foreground">
          Chọn một thông báo
        </h2>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          Chi tiết thông báo sẽ được hiển thị ở đây
        </p>
      </div>
    );
  }

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "message":
        const messageType = notification.data?.type || "message";
        switch (messageType) {
          case "code-share":
            return <Share2 className="w-5 h-5 text-purple-400" />;
          case "file-upload":
            return <Upload className="w-5 h-5 text-green-400" />;
          case "notification":
            return <Bell className="w-5 h-5 text-orange-400" />;
          default:
            return <MessageSquare className="w-5 h-5 text-blue-400" />;
        }
      case "github":
        return <GitBranch className="w-5 h-5 text-green-400" />;
      case "system":
        return <Settings className="w-5 h-5 text-orange-400" />;
      default:
        return <Hash className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeBadge = () => {
    const badgeStyles = {
      message:
        "bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30",
      github:
        "bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30",
      system:
        "bg-orange-600/20 text-orange-400 border-orange-600/30 hover:bg-orange-600/30",
      mention:
        "bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30",
      thread:
        "bg-purple-600/20 text-purple-400 border-purple-600/30 hover:bg-purple-600/30",
      reaction:
        "bg-yellow-600/20 text-yellow-400 border-yellow-600/30 hover:bg-yellow-600/30",
      invitation:
        "bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30",
    } as const;

    let displayType: string = notification.type;
    if (notification.type === "message") {
      const messageType = notification.data?.type || "message";
      switch (messageType) {
        case "code-share":
          displayType = "Code Share";
          break;
        case "file-upload":
          displayType = "File Upload";
          break;
        case "notification":
          displayType = "Channel Notification";
          break;
        default:
          displayType = "Message";
      }
    } else if (notification.type === "github") {
      const action = notification.data?.action;
      if (action === "created") {
        displayType = "GitHub Installation";
      } else if (notification.data?.commits) {
        displayType = "GitHub Push";
      } else {
        displayType = "GitHub Event";
      }
    }

    return (
      <Badge
        className={`capitalize font-medium ${badgeStyles[notification.type as keyof typeof badgeStyles] || badgeStyles.message}`}
      >
        {displayType}
      </Badge>
    );
  };

  const handleMarkAsRead = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            {getNotificationIcon()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Chi tiết thông báo
            </h1>
            <p className="text-xs text-muted-foreground">
              {notification.read ? "Đã đọc" : "Chưa đọc"}
            </p>
          </div>
          {getNotificationTypeBadge()}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {renderNotification(notification)}
    </div>
  );
}
