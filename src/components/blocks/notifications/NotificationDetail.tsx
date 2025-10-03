import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatExactTimeHelper } from "@/lib/utils";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Bell, Hash, MessageSquare, X, Check } from "lucide-react";

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
        <Card className="max-w-3xl mx-auto bg-gray-900/50 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-4 space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-14 h-14 border-2 border-gray-700 ring-2 ring-gray-800">
                <AvatarImage src={notification.data?.sender?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                  {notification.data?.sender?.username
                    ?.slice(0, 1)
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-white text-lg">
                    {notification.data?.sender?.username || "Unknown User"}
                  </h3>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30">
                    {typeMap[notification.type]}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="font-medium">
                    {formatExactTimeHelper()(notification.createdAt)}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>

              {!notification.read && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse ring-4 ring-blue-500/20" />
              )}
            </div>
          </CardHeader>

          <Separator className="bg-gray-800/50" />

          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-gray-300 text-sm uppercase tracking-wide">
                  Nội dung tin nhắn
                </h4>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 shadow-inner">
                  <p className="text-gray-200 leading-relaxed text-base">
                    {notification?.data?.text || "Không có nội dung"}
                  </p>
                </div>
              </div>

              {notification.data?.channel && (
                <div className="bg-gradient-to-r from-gray-800/30 to-gray-800/50 rounded-lg p-4 border border-gray-700/30">
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">Kênh:</span>
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
  }

  // fallback cho các loại thông báo khác
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6 ring-4 ring-gray-700/30">
        <Bell className="w-10 h-10 text-gray-600" />
      </div>
      <h2 className="text-xl font-semibold mb-2 text-gray-300">
        Loại thông báo không xác định
      </h2>
      <p className="text-gray-500 max-w-md">
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-6 ring-4 ring-gray-700/30 shadow-xl">
          <Bell className="w-12 h-12 text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-white">
          Chọn một thông báo
        </h2>
        <p className="text-gray-400 max-w-md leading-relaxed">
          Chi tiết thông báo sẽ được hiển thị ở đây
        </p>
      </div>
    );
  }

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-green-400" />;
      default:
        return <Hash className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationTypeBadge = () => {
    const badgeStyles = {
      message:
        "bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600/30",
      mention:
        "bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30",
      thread:
        "bg-purple-600/20 text-purple-400 border-purple-600/30 hover:bg-purple-600/30",
      reaction:
        "bg-yellow-600/20 text-yellow-400 border-yellow-600/30 hover:bg-yellow-600/30",
      invitation:
        "bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30",
    } as const;

    return (
      <Badge
        className={`capitalize font-medium ${badgeStyles[notification.type] || badgeStyles.message}`}
      >
        {notification.type}
      </Badge>
    );
  };

  const handleMarkAsRead = () => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/95 border-b border-gray-800 backdrop-blur-sm shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800 rounded-lg">
            {getNotificationIcon()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Chi tiết thông báo</h1>
            <p className="text-xs text-gray-400">
              {notification.read ? "Đã đọc" : "Chưa đọc"}
            </p>
          </div>
          {getNotificationTypeBadge()}
        </div>

        <div className="flex items-center gap-2">
          {!notification.read && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 transition-all duration-200"
            >
              <Check className="w-4 h-4 mr-2" />
              Đánh dấu đã đọc
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
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
