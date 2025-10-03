import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatExactTimeHelper } from "@/lib/utils";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { create } from "domain";
import { read } from "fs";
import {
  Bell,
  Hash,
  AtSign,
  ThumbsUp,
  Mail,
  MessageSquare,
  X,
  ExternalLink,
} from "lucide-react";

interface NotificationDetailProps {
  notification: Notification | null;
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
}

//render notification content
function renderNotification(notification: Notification): React.ReactNode {
  const typeMap: Record<string, string> = {
    message: "Tin nhắn",
  };

  if (typeMap[notification.type]) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12 border border-border">
                {/* <AvatarImage src={notification.avatar} /> */}
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  {notification.data?.sender?.username
                    .slice(0, 1)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {notification.data?.sender?.username}
                  </h3>
                  <span className="text-sm text-primary">
                    {typeMap[notification.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-950">
                  <span>{formatExactTimeHelper()(notification.createdAt)}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(notification.createdAt, {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>
              {!notification.read && (
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
              )}
            </div>
          </CardHeader>
          <Separator className="bg-border/50" />
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 text-foreground">Nội dung</h4>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <p className="text-foreground leading-relaxed">
                    {notification?.data?.text || ""}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // fallback cho các loại thông báo khác
  return (
    <div className="p-6 text-center text-muted-foreground min-h-[80vh] flex flex-col items-center justify-center">
      <Bell className="w-12 h-12 mb-4" />
      <h2 className="text-md mb-2 text-white text-foreground">
        Loại thông báo không xác định
      </h2>
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Chọn một thông báo{" "}
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
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      default:
        return <Hash className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeBadge = () => {
    const variants = {
      mention: "default",
      thread: "secondary",
      reaction: "outline",
      invitation: "destructive",
      message: "default",
    } as const;

    return (
      <Badge
        variant={variants[notification.type] || "default"}
        className="capitalize"
      >
        {notification.type}
      </Badge>
    );
  };

  const handleMarkAsRead = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-blue-50/5 ">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <div className="flex items-center gap-3">
          {getNotificationIcon()}
          <h1 className="text-lg font-semibold">Nội dung thông báo</h1>
          {getNotificationTypeBadge()}
        </div>
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              className="text-sm text-black"
            >
              Đánh dấu đã đọc
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <>{renderNotification(notification)}</>
    </div>
  );
}
